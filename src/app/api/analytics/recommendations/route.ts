import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/options'
import { AnalyticsEngine } from '@/lib/analytics-engine'

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const analytics = new AnalyticsEngine(session.user.id)
    const recommendations = await analytics.getRecommendations()

    return NextResponse.json(recommendations)
  } catch (error) {
    console.error('Failed to fetch recommendations:', error)
    return NextResponse.json(
      { error: 'Failed to fetch recommendations' },
      { status: 500 }
    )
  }
}