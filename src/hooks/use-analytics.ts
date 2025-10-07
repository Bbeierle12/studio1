import { useQuery } from '@tanstack/react-query'
import { AnalyticsDashboard, PersonalizedRecommendations } from '@/lib/analytics-engine'

interface DateRange {
  startDate?: string
  endDate?: string
}

export function useAnalyticsDashboard(dateRange?: DateRange) {
  return useQuery<AnalyticsDashboard>({
    queryKey: ['analytics-dashboard', dateRange],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (dateRange?.startDate) params.append('startDate', dateRange.startDate)
      if (dateRange?.endDate) params.append('endDate', dateRange.endDate)

      const response = await fetch(`/api/analytics/dashboard?${params}`)
      if (!response.ok) {
        throw new Error('Failed to fetch analytics dashboard')
      }
      return response.json()
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    enabled: true
  })
}

export function useRecommendations() {
  return useQuery<PersonalizedRecommendations>({
    queryKey: ['analytics-recommendations'],
    queryFn: async () => {
      const response = await fetch('/api/analytics/recommendations')
      if (!response.ok) {
        throw new Error('Failed to fetch recommendations')
      }
      return response.json()
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
  })
}