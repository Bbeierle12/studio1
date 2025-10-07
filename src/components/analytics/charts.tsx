'use client'

import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Area,
  AreaChart,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar
} from 'recharts'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import {
  CuisineDistribution,
  MealTypeDistribution,
  WeeklyStats,
  RecipeFrequency,
  NutritionalTrends
} from '@/lib/analytics-engine'

// Color palette for charts
const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16']

interface RecipeFrequencyChartProps {
  data: RecipeFrequency[]
  title: string
}

export function RecipeFrequencyChart({ data, title }: RecipeFrequencyChartProps) {
  const chartData = data.slice(0, 10).map(item => ({
    name: item.recipeName.length > 20 ? item.recipeName.slice(0, 20) + '...' : item.recipeName,
    count: item.count
  }))

  return (
    <Card className="col-span-2">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>Your top recipes by frequency</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="name"
              angle={-45}
              textAnchor="end"
              height={100}
            />
            <YAxis />
            <Tooltip />
            <Bar dataKey="count" fill="#3b82f6" radius={[8, 8, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}

interface CuisineDistributionChartProps {
  data: CuisineDistribution[]
}

export function CuisineDistributionChart({ data }: CuisineDistributionChartProps) {
  return (
    <Card className="col-span-1">
      <CardHeader>
        <CardTitle>Cuisine Distribution</CardTitle>
        <CardDescription>Variety in your meal planning</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={(entry) => `${entry.cuisine} (${entry.percentage}%)`}
              outerRadius={80}
              fill="#8884d8"
              dataKey="count"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}

interface MealTypeChartProps {
  data: MealTypeDistribution[]
}

export function MealTypeChart({ data }: MealTypeChartProps) {
  const chartData = data.map(item => ({
    name: item.mealType.charAt(0) + item.mealType.slice(1).toLowerCase(),
    meals: item.count,
    calories: item.averageCalories || 0
  }))

  return (
    <Card className="col-span-1">
      <CardHeader>
        <CardTitle>Meal Type Distribution</CardTitle>
        <CardDescription>Breakdown by meal type with average calories</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis yAxisId="left" orientation="left" stroke="#3b82f6" />
            <YAxis yAxisId="right" orientation="right" stroke="#10b981" />
            <Tooltip />
            <Legend />
            <Bar yAxisId="left" dataKey="meals" fill="#3b82f6" name="Count" />
            <Bar yAxisId="right" dataKey="calories" fill="#10b981" name="Avg Calories" />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}

interface WeeklyTrendsChartProps {
  data: WeeklyStats[]
}

export function WeeklyTrendsChart({ data }: WeeklyTrendsChartProps) {
  const chartData = data.map(week => ({
    week: new Date(week.week).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    meals: week.totalMeals,
    unique: week.uniqueRecipes,
    completion: week.completionRate
  }))

  return (
    <Card className="col-span-3">
      <CardHeader>
        <CardTitle>Weekly Trends</CardTitle>
        <CardDescription>Your meal planning patterns over time</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="week" />
            <YAxis yAxisId="left" />
            <YAxis yAxisId="right" orientation="right" />
            <Tooltip />
            <Legend />
            <Line
              yAxisId="left"
              type="monotone"
              dataKey="meals"
              stroke="#3b82f6"
              name="Total Meals"
              strokeWidth={2}
            />
            <Line
              yAxisId="left"
              type="monotone"
              dataKey="unique"
              stroke="#10b981"
              name="Unique Recipes"
              strokeWidth={2}
            />
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="completion"
              stroke="#f59e0b"
              name="Completion %"
              strokeWidth={2}
              strokeDasharray="5 5"
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}

interface NutritionTrendsCardProps {
  data: NutritionalTrends
}

export function NutritionTrendsCard({ data }: NutritionTrendsCardProps) {
  const macroData = [
    { name: 'Protein', value: data.averageProtein, max: 150 },
    { name: 'Carbs', value: data.averageCarbs, max: 400 },
    { name: 'Fat', value: data.averageFat, max: 100 }
  ]

  return (
    <Card className="col-span-2">
      <CardHeader>
        <CardTitle>Nutritional Trends</CardTitle>
        <CardDescription>Average daily macronutrients</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <div className="text-2xl font-bold">{data.averageCalories}</div>
            <p className="text-xs text-muted-foreground">Average Calories/Day</p>
            <Badge variant={
              data.caloriesTrend === 'up' ? 'destructive' :
              data.caloriesTrend === 'down' ? 'default' : 'secondary'
            } className="mt-1">
              {data.caloriesTrend === 'up' ? '↑' : data.caloriesTrend === 'down' ? '↓' : '→'} Trending {data.caloriesTrend}
            </Badge>
          </div>
          <div>
            <div className="text-2xl font-bold">{data.complianceRate}%</div>
            <p className="text-xs text-muted-foreground">Goal Compliance</p>
            <Progress value={data.complianceRate} className="mt-2" />
          </div>
        </div>

        <ResponsiveContainer width="100%" height={200}>
          <RadarChart data={macroData}>
            <PolarGrid />
            <PolarAngleAxis dataKey="name" />
            <PolarRadiusAxis angle={90} domain={[0, 'dataMax']} />
            <Radar name="Macros" dataKey="value" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.6} />
            <Tooltip />
          </RadarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}

interface StatsCardsProps {
  overview: {
    totalMealsPlanned: number
    uniqueRecipesUsed: number
    averageMealsPerWeek: number
    planningStreak: number
    mostActiveDay: string
  }
}

export function StatsCards({ overview }: StatsCardsProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Meals</CardTitle>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            className="h-4 w-4 text-muted-foreground"
          >
            <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
          </svg>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{overview.totalMealsPlanned}</div>
          <p className="text-xs text-muted-foreground">
            Meals planned
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Unique Recipes</CardTitle>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            className="h-4 w-4 text-muted-foreground"
          >
            <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
          </svg>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{overview.uniqueRecipesUsed}</div>
          <p className="text-xs text-muted-foreground">
            Different recipes used
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Weekly Average</CardTitle>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            className="h-4 w-4 text-muted-foreground"
          >
            <rect width="20" height="14" x="2" y="5" rx="2" />
            <path d="M2 10h20" />
          </svg>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{overview.averageMealsPerWeek}</div>
          <p className="text-xs text-muted-foreground">
            Meals per week
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Planning Streak</CardTitle>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            className="h-4 w-4 text-muted-foreground"
          >
            <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
          </svg>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{overview.planningStreak}</div>
          <p className="text-xs text-muted-foreground">
            Weeks in a row
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Most Active</CardTitle>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            className="h-4 w-4 text-muted-foreground"
          >
            <path d="M8 2v4M16 2v4M3 10h18M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z" />
          </svg>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{overview.mostActiveDay}</div>
          <p className="text-xs text-muted-foreground">
            Most planned day
          </p>
        </CardContent>
      </Card>
    </div>
  )
}

interface WasteReductionCardProps {
  data: {
    completionRate: number
    mostWasted: string[]
    improvementTips: string[]
  }
}

export function WasteReductionCard({ data }: WasteReductionCardProps) {
  return (
    <Card className="col-span-1">
      <CardHeader>
        <CardTitle>Waste Reduction</CardTitle>
        <CardDescription>Meal completion insights</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Completion Rate</span>
            <span className="text-2xl font-bold">{data.completionRate}%</span>
          </div>
          <Progress value={data.completionRate} className="mt-2" />
        </div>

        {data.mostWasted.length > 0 && (
          <div>
            <h4 className="text-sm font-medium mb-2">Often Skipped</h4>
            <div className="space-y-1">
              {data.mostWasted.map((recipe, idx) => (
                <div key={idx} className="text-xs text-muted-foreground">
                  • {recipe}
                </div>
              ))}
            </div>
          </div>
        )}

        {data.improvementTips.length > 0 && (
          <div>
            <h4 className="text-sm font-medium mb-2">Tips</h4>
            <div className="space-y-1">
              {data.improvementTips.map((tip, idx) => (
                <div key={idx} className="text-xs text-muted-foreground">
                  • {tip}
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}