import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/options'
import { AnalyticsEngine } from '@/lib/analytics-engine'
import { z } from 'zod'

const querySchema = z.object({
  startDate: z.string().optional(),
  endDate: z.string().optional()
})

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const query = {
      startDate: searchParams.get('startDate') || undefined,
      endDate: searchParams.get('endDate') || undefined
    }

    const validation = querySchema.safeParse(query)
    if (!validation.success) {
      return NextResponse.json({ error: 'Invalid query parameters' }, { status: 400 })
    }

    const dateRange = validation.data.startDate && validation.data.endDate
      ? {
          start: new Date(validation.data.startDate),
          end: new Date(validation.data.endDate)
        }
      : undefined

    const analytics = new AnalyticsEngine(session.user.id)
    const dashboard = await analytics.getDashboard(dateRange)

    return NextResponse.json(dashboard)
  } catch (error) {
    console.error('Failed to fetch analytics dashboard:', error)
    return NextResponse.json(
      { error: 'Failed to fetch analytics data' },
      { status: 500 }
    )
  }
}