import { lookup } from 'dns/promises'
import { isIP } from 'net'

const MAX_REDIRECTS = 5

const BROWSER_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
  'Accept-Language': 'en-US,en;q=0.5',
  'Accept-Encoding': 'gzip, deflate, br',
  'Connection': 'keep-alive',
  'Upgrade-Insecure-Requests': '1',
}

/**
 * Returns true if the given IP literal falls inside a private, loopback,
 * link-local, or otherwise non-public range. Blocking these prevents SSRF
 * against internal services and cloud metadata endpoints (169.254.169.254).
 */
export function isPrivateIp(ip: string): boolean {
  const kind = isIP(ip)
  if (kind === 4) {
    const p = ip.split('.').map(Number)
    if (p.some((n) => Number.isNaN(n) || n < 0 || n > 255)) return true
    const [a, b] = p
    if (a === 10) return true
    if (a === 127) return true
    if (a === 0) return true
    if (a === 169 && b === 254) return true // link-local / cloud metadata
    if (a === 172 && b >= 16 && b <= 31) return true
    if (a === 192 && b === 168) return true
    if (a === 100 && b >= 64 && b <= 127) return true // CGNAT
    if (a >= 224) return true // multicast / reserved
    return false
  }
  if (kind === 6) {
    let v = ip.toLowerCase()
    // Unwrap IPv4-mapped IPv6 addresses (::ffff:a.b.c.d) and re-check.
    const mapped = v.match(/::ffff:(\d+\.\d+\.\d+\.\d+)$/)
    if (mapped) return isPrivateIp(mapped[1])
    if (v === '::1' || v === '::') return true
    if (v.startsWith('fc') || v.startsWith('fd')) return true // unique local
    if (v.startsWith('fe8') || v.startsWith('fe9') || v.startsWith('fea') || v.startsWith('feb')) return true // link-local
    return false
  }
  // Not an IP literal — treat as unsafe.
  return true
}

/**
 * Validates a user-supplied URL: must be http(s), and every IP its hostname
 * resolves to must be public. Throws with a client-safe message on rejection.
 */
export async function assertSafeUrl(rawUrl: string): Promise<void> {
  let parsed: URL
  try {
    parsed = new URL(rawUrl)
  } catch {
    throw new Error('Invalid URL')
  }

  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    throw new Error('Only http(s) URLs are allowed')
  }

  const host = parsed.hostname
  // If the host is already an IP literal, check it directly.
  if (isIP(host)) {
    if (isPrivateIp(host)) throw new Error('URL resolves to a disallowed address')
    return
  }

  // Otherwise resolve the hostname and reject if any address is private.
  let addresses
  try {
    addresses = await lookup(host, { all: true })
  } catch {
    throw new Error('Could not resolve URL host')
  }
  if (addresses.length === 0 || addresses.some((a) => isPrivateIp(a.address))) {
    throw new Error('URL resolves to a disallowed address')
  }
}

export class SafeFetchError extends Error {
  status: number
  constructor(message: string, status = 400) {
    super(message)
    this.status = status
  }
}

/**
 * Fetches HTML from a user-supplied URL with SSRF protection: the URL (and
 * every redirect hop) is validated against private ranges before each request,
 * so a public URL cannot redirect the fetch inward.
 */
export async function fetchHtmlSafely(rawUrl: string): Promise<{ html: string; finalUrl: string }> {
  let currentUrl = rawUrl
  let response: Response | null = null

  for (let hop = 0; hop <= MAX_REDIRECTS; hop++) {
    await assertSafeUrl(currentUrl)

    response = await fetch(currentUrl, {
      headers: BROWSER_HEADERS,
      redirect: 'manual',
    })

    if (response.status >= 300 && response.status < 400) {
      const location = response.headers.get('location')
      if (!location) break
      currentUrl = new URL(location, currentUrl).toString()
      if (hop === MAX_REDIRECTS) {
        throw new SafeFetchError('Too many redirects')
      }
      continue
    }
    break
  }

  if (!response || !response.ok) {
    throw new SafeFetchError(
      `Failed to fetch URL: ${response?.statusText || 'unknown error'}`,
      response?.status || 502
    )
  }

  const html = await response.text()
  const finalUrl = response.url || currentUrl

  return { html, finalUrl }
}
