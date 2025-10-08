// Mock next/headers for test environment
export function headers() {
  return new Map<string, string>()
}

export async function cookies() {
  return new Map<string, string>()
}
