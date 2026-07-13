import { describe, it, expect, vi, beforeEach } from 'vitest';
import { isPrivateIp, assertSafeUrl, fetchHtmlSafely } from '../src/lib/safe-fetch';

vi.mock('dns/promises', () => ({
  lookup: vi.fn(async (host: string) => {
    if (host === 'internal.example.com') return [{ address: '10.1.2.3', family: 4 }];
    if (host === 'public.example.com') return [{ address: '93.184.216.34', family: 4 }];
    if (host === 'redirect-target.internal') return [{ address: '192.168.0.5', family: 4 }];
    throw new Error('ENOTFOUND');
  }),
}));

global.fetch = vi.fn();

describe('isPrivateIp', () => {
  it.each([
    ['10.0.0.1', true],
    ['127.0.0.1', true],
    ['169.254.169.254', true], // cloud metadata
    ['192.168.1.1', true],
    ['172.16.0.1', true],
    ['172.31.255.255', true],
    ['100.64.0.1', true], // CGNAT
    ['0.0.0.0', true],
    ['8.8.8.8', false],
    ['93.184.216.34', false],
    ['::1', true],
    ['::ffff:10.0.0.1', true], // IPv4-mapped
    ['fd00::1', true], // unique local
    ['fe80::1', true], // link-local
    ['2607:f8b0::1', false],
    ['not-an-ip', true], // non-IP treated as unsafe
  ])('%s -> %s', (ip, expected) => {
    expect(isPrivateIp(ip)).toBe(expected);
  });
});

describe('assertSafeUrl', () => {
  it('rejects malformed URLs', async () => {
    await expect(assertSafeUrl('not a url')).rejects.toThrow('Invalid URL');
  });

  it('rejects non-http(s) schemes', async () => {
    await expect(assertSafeUrl('file:///etc/passwd')).rejects.toThrow();
    await expect(assertSafeUrl('ftp://example.com/x')).rejects.toThrow();
  });

  it('rejects private IP literals', async () => {
    await expect(assertSafeUrl('http://127.0.0.1/admin')).rejects.toThrow('disallowed');
    await expect(assertSafeUrl('http://169.254.169.254/latest/meta-data/')).rejects.toThrow('disallowed');
  });

  it('rejects hostnames that resolve to private ranges', async () => {
    await expect(assertSafeUrl('https://internal.example.com/x')).rejects.toThrow('disallowed');
  });

  it('accepts public hostnames', async () => {
    await expect(assertSafeUrl('https://public.example.com/recipe')).resolves.toBeUndefined();
  });
});

describe('fetchHtmlSafely', () => {
  beforeEach(() => {
    vi.mocked(global.fetch as any).mockReset();
  });

  it('returns html and finalUrl on success', async () => {
    (global.fetch as any).mockResolvedValue({
      ok: true,
      status: 200,
      url: 'https://public.example.com/recipe',
      headers: new Headers(),
      text: () => Promise.resolve('<html>recipe</html>'),
    });

    const result = await fetchHtmlSafely('https://public.example.com/recipe');
    expect(result.html).toBe('<html>recipe</html>');
    expect(result.finalUrl).toBe('https://public.example.com/recipe');
  });

  it('sends browser-like headers', async () => {
    (global.fetch as any).mockResolvedValue({
      ok: true,
      status: 200,
      url: 'https://public.example.com/x',
      headers: new Headers(),
      text: () => Promise.resolve('ok'),
    });

    await fetchHtmlSafely('https://public.example.com/x');
    const [, init] = (global.fetch as any).mock.calls[0];
    expect(init.headers['User-Agent']).toContain('Mozilla');
    expect(init.redirect).toBe('manual');
  });

  it('re-validates each redirect hop and blocks redirects into private ranges', async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: false,
      status: 302,
      headers: new Headers({ location: 'https://redirect-target.internal/secret' }),
      text: () => Promise.resolve(''),
    });

    await expect(fetchHtmlSafely('https://public.example.com/start')).rejects.toThrow('disallowed');
  });

  it('gives up after too many redirects', async () => {
    (global.fetch as any).mockResolvedValue({
      ok: false,
      status: 301,
      headers: new Headers({ location: 'https://public.example.com/loop' }),
      text: () => Promise.resolve(''),
    });

    await expect(fetchHtmlSafely('https://public.example.com/loop')).rejects.toThrow('redirect');
  });

  it('throws on non-ok terminal responses', async () => {
    (global.fetch as any).mockResolvedValue({
      ok: false,
      status: 404,
      statusText: 'Not Found',
      headers: new Headers(),
      text: () => Promise.resolve(''),
    });

    await expect(fetchHtmlSafely('https://public.example.com/missing')).rejects.toThrow();
  });

  it('explains bot-blocking (403) instead of implying a broken link', async () => {
    (global.fetch as any).mockResolvedValue({
      ok: false,
      status: 403,
      statusText: 'Forbidden',
      headers: new Headers(),
      text: () => Promise.resolve(''),
    });

    await expect(fetchHtmlSafely('https://public.example.com/blocked')).rejects.toThrow(
      'blocks automated access'
    );
  });
});
