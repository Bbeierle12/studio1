// Mock Next.js server APIs for test environment
export class NextRequest {
  url: string = 'http://localhost:3000'
  method: string = 'GET'
  headers: Map<string, string> = new Map()
}

export const NextResponse = {
  json: (data: unknown, init?: { status?: number }) => ({
    data,
    status: init?.status ?? 200,
  }),
}
