import { Metadata } from 'next'
import { AnalyticsDashboard } from '@/components/analytics/dashboard'

export const metadata: Metadata = {
  title: 'Analytics & Insights | Meal Planner',
  description: 'Track your meal planning patterns and get personalized recommendations',
}

export default function AnalyticsPage() {
  return (
    <div className="container mx-auto py-8 px-4">
      <AnalyticsDashboard />
    </div>
  )
}