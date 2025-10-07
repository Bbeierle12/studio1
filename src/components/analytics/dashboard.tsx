'use client'

import { useState } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { CalendarIcon, TrendingUp, Users, ChefHat, Target, Sparkles } from 'lucide-react'
import { format, subDays, subWeeks, subMonths, startOfDay, endOfDay } from 'date-fns'
import { cn } from '@/lib/utils'
import { useAnalyticsDashboard, useRecommendations } from '@/hooks/use-analytics'
import {
  StatsCards,
  RecipeFrequencyChart,
  CuisineDistributionChart,
  MealTypeChart,
  WeeklyTrendsChart,
  NutritionTrendsCard,
  WasteReductionCard
} from './charts'
import { RecommendationsPanel } from './recommendations-panel'

type DateRangePreset = '7d' | '14d' | '30d' | '90d' | 'custom'

export function AnalyticsDashboard() {
  const [dateRangePreset, setDateRangePreset] = useState<DateRangePreset>('30d')
  const [customDateRange, setCustomDateRange] = useState<{ from: Date; to: Date } | undefined>()

  // Calculate date range based on preset
  const getDateRange = () => {
    const now = new Date()
    if (dateRangePreset === 'custom' && customDateRange) {
      return {
        startDate: format(customDateRange.from, 'yyyy-MM-dd'),
        endDate: format(customDateRange.to, 'yyyy-MM-dd')
      }
    }

    let startDate: Date
    switch (dateRangePreset) {
      case '7d':
        startDate = subDays(now, 7)
        break
      case '14d':
        startDate = subDays(now, 14)
        break
      case '30d':
        startDate = subDays(now, 30)
        break
      case '90d':
        startDate = subDays(now, 90)
        break
      default:
        startDate = subDays(now, 30)
    }

    return {
      startDate: format(startOfDay(startDate), 'yyyy-MM-dd'),
      endDate: format(endOfDay(now), 'yyyy-MM-dd')
    }
  }

  const dateRange = getDateRange()
  const { data: dashboard, isLoading, error } = useAnalyticsDashboard(dateRange)
  const { data: recommendations, isLoading: recommendationsLoading } = useRecommendations()

  if (error) {
    return (
      <Alert variant="destructive" className="m-4">
        <AlertDescription>
          Failed to load analytics data. Please try again later.
        </AlertDescription>
      </Alert>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header with Date Range Selector */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Analytics & Insights</h1>
          <p className="text-muted-foreground">
            Track your meal planning patterns and get personalized recommendations
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Select
            value={dateRangePreset}
            onValueChange={(value: DateRangePreset) => setDateRangePreset(value)}
          >
            <SelectTrigger className="w-[120px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="14d">Last 14 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
              <SelectItem value="custom">Custom</SelectItem>
            </SelectContent>
          </Select>

          {dateRangePreset === 'custom' && (
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    'justify-start text-left font-normal',
                    !customDateRange && 'text-muted-foreground'
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {customDateRange ? (
                    <>
                      {format(customDateRange.from, 'PP')} - {format(customDateRange.to, 'PP')}
                    </>
                  ) : (
                    <span>Pick a date range</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="end">
                <Calendar
                  mode="range"
                  selected={customDateRange}
                  onSelect={setCustomDateRange}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          )}
        </div>
      </div>

      {/* Loading State */}
      {isLoading ? (
        <div className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
            {[...Array(5)].map((_, i) => (
              <Card key={i}>
                <CardHeader className="pb-2">
                  <Skeleton className="h-4 w-24" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-8 w-16" />
                  <Skeleton className="h-3 w-32 mt-2" />
                </CardContent>
              </Card>
            ))}
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[...Array(3)].map((_, i) => (
              <Card key={i} className={i === 0 ? 'col-span-2' : ''}>
                <CardHeader>
                  <Skeleton className="h-5 w-32" />
                  <Skeleton className="h-3 w-48 mt-1" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-[300px] w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      ) : dashboard ? (
        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList className="grid w-full grid-cols-4 lg:w-[400px]">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="recipes">Recipes</TabsTrigger>
            <TabsTrigger value="nutrition">Nutrition</TabsTrigger>
            <TabsTrigger value="recommendations">Insights</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            {/* Stats Cards */}
            <StatsCards overview={dashboard.overview} />

            {/* Charts Grid */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              <WeeklyTrendsChart data={dashboard.weeklyTrends} />
              <CuisineDistributionChart data={dashboard.cuisineDistribution} />
              <MealTypeChart data={dashboard.mealTypeDistribution} />
            </div>

            {/* Waste Reduction */}
            <div className="grid gap-4 md:grid-cols-3">
              <div className="col-span-2">
                <RecipeFrequencyChart
                  data={dashboard.recipeStats.mostPlanned}
                  title="Most Frequently Planned"
                />
              </div>
              <WasteReductionCard data={dashboard.wasteReduction} />
            </div>
          </TabsContent>

          <TabsContent value="recipes" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <RecipeFrequencyChart
                data={dashboard.recipeStats.mostPlanned}
                title="Top Recipes"
              />
              <RecipeFrequencyChart
                data={dashboard.recipeStats.needsRotation}
                title="Haven't Made Recently"
              />
            </div>

            {/* Recipe Insights Cards */}
            <div className="grid gap-4 md:grid-cols-3">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <ChefHat className="h-5 w-5" />
                    Recipe Rotation
                  </CardTitle>
                  <CardDescription>
                    Recipes that haven't been used in a while
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {dashboard.recipeStats.needsRotation.slice(0, 5).map((recipe) => (
                      <div key={recipe.recipeId} className="flex justify-between text-sm">
                        <span className="truncate flex-1">{recipe.recipeName}</span>
                        <span className="text-muted-foreground ml-2">
                          {recipe.lastPlanned
                            ? format(new Date(recipe.lastPlanned), 'MMM d')
                            : 'Never'}
                        </span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    Least Used
                  </CardTitle>
                  <CardDescription>
                    Recipes you might want to try more
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {dashboard.recipeStats.leastUsed.slice(0, 5).map((recipe) => (
                      <div key={recipe.recipeId} className="flex justify-between text-sm">
                        <span className="truncate flex-1">{recipe.recipeName}</span>
                        <span className="text-muted-foreground ml-2">
                          {recipe.count} times
                        </span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="h-5 w-5" />
                    Cuisine Balance
                  </CardTitle>
                  <CardDescription>
                    Diversity in your meal planning
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {dashboard.cuisineDistribution.slice(0, 5).map((cuisine) => (
                      <div key={cuisine.cuisine} className="flex justify-between text-sm">
                        <span>{cuisine.cuisine}</span>
                        <span className="text-muted-foreground">{cuisine.percentage}%</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="nutrition" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-3">
              <NutritionTrendsCard data={dashboard.nutritionalTrends} />
              <MealTypeChart data={dashboard.mealTypeDistribution} />
            </div>

            {/* Seasonal Patterns */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {dashboard.seasonalPatterns.map((season) => (
                <Card key={season.season}>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium capitalize">
                      {season.season}
                    </CardTitle>
                    <CardDescription className="text-xs">
                      Avg. {season.averageCalories} cal
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-1">
                      <div className="text-xs font-medium">Top Cuisines:</div>
                      {season.cuisinePreferences.map((cuisine, idx) => (
                        <div key={idx} className="text-xs text-muted-foreground">
                          • {cuisine}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="recommendations">
            {recommendationsLoading ? (
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <Card key={i}>
                    <CardHeader>
                      <Skeleton className="h-5 w-32" />
                      <Skeleton className="h-3 w-48 mt-1" />
                    </CardHeader>
                    <CardContent>
                      <Skeleton className="h-24 w-full" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : recommendations ? (
              <RecommendationsPanel recommendations={recommendations} />
            ) : (
              <Alert>
                <AlertDescription>
                  No recommendations available. Keep planning meals to get personalized insights!
                </AlertDescription>
              </Alert>
            )}
          </TabsContent>
        </Tabs>
      ) : null}
    </div>
  )
}