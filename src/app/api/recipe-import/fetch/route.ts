import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { fetchHtmlSafely, SafeFetchError } from '@/lib/safe-fetch'

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const url = searchParams.get('url')

    if (!url) {
      return NextResponse.json({ error: 'URL parameter is required' }, { status: 400 })
    }

    const { html, finalUrl } = await fetchHtmlSafely(url)

    return NextResponse.json({ html, finalUrl })
  } catch (error) {
    if (error instanceof SafeFetchError) {
      return NextResponse.json({ error: error.message }, { status: error.status })
    }
    if (error instanceof Error && error.message.includes('disallowed')) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }
    if (error instanceof Error && (error.message === 'Invalid URL' || error.message.includes('http(s)') || error.message.includes('resolve'))) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }
    console.error('Failed to fetch URL:', error)
    return NextResponse.json(
      { error: 'Failed to fetch recipe content' },
      { status: 500 }
    )
  }
}
