import { prisma } from '@/lib/prisma'
import { MealType, PlannedMeal, Recipe } from '@prisma/client'
import { startOfWeek, endOfWeek, subWeeks, startOfMonth, endOfMonth, differenceInDays, format } from 'date-fns'
import {
  safeDiv,
  safePercentage,
  safeAverage,
  clamp,
  hasMinimumSampleSize,
  safeWeeksFromDays,
  safeSum,
} from './math-utils'

// Types for analytics data
export interface RecipeFrequency {
  recipeId: string
  recipeName: string
  count: number
  lastPlanned?: Date
  averageDaysBetween?: number
}

export interface CuisineDistribution {
  cuisine: string
  count: number
  percentage: number
}

export interface MealTypeDistribution {
  mealType: MealType
  count: number
  percentage: number
  averageCalories?: number
}

export interface WeeklyStats {
  week: string
  totalMeals: number
  uniqueRecipes: number
  averageMealsPerDay: number
  completionRate: number
}

export interface CostEstimate {
  weekly: number
  monthly: number
  perMeal: number
  trend: 'up' | 'down' | 'stable'
}

export interface NutritionalTrends {
  averageCalories: number
  averageProtein: number
  averageCarbs: number
  averageFat: number
  caloriesTrend: 'up' | 'down' | 'stable'
  complianceRate: number // % of days meeting nutritional goals
}

export interface SeasonalPattern {
  season: 'winter' | 'spring' | 'summer' | 'fall'
  popularRecipes: string[]
  cuisinePreferences: string[]
  averageCalories: number
}

export interface AnalyticsDashboard {
  overview: {
    totalMealsPlanned: number
    uniqueRecipesUsed: number
    averageMealsPerWeek: number
    planningStreak: number // consecutive weeks with meal plans
    mostActiveDay: string
  }
  recipeStats: {
    mostPlanned: RecipeFrequency[]
    leastUsed: RecipeFrequency[]
    needsRotation: RecipeFrequency[] // Haven't been used in a while
  }
  cuisineDistribution: CuisineDistribution[]
  mealTypeDistribution: MealTypeDistribution[]
  weeklyTrends: WeeklyStats[]
  nutritionalTrends: NutritionalTrends
  seasonalPatterns: SeasonalPattern[]
  costEstimate?: CostEstimate
  wasteReduction: {
    completionRate: number
    mostWasted: string[] // Recipes frequently not completed
    improvementTips: string[]
  }
}

export interface PersonalizedRecommendations {
  rotationSuggestions: {
    recipe: Recipe
    reason: string
    lastUsed: Date | null
  }[]
  cuisineSuggestions: {
    cuisine: string
    reason: string
    recipes: Recipe[]
  }[]
  nutritionalSuggestions: string[]
  varietyScore: number // 0-100 score for meal variety
  seasonalSuggestions: Recipe[]
  costOptimizations: string[]
}

export class AnalyticsEngine {
  constructor(private userId: string) {}

  // Get complete analytics dashboard
  async getDashboard(dateRange?: { start: Date; end: Date }): Promise<AnalyticsDashboard> {
    const endDate = dateRange?.end || new Date()
    const startDate = dateRange?.start || subWeeks(endDate, 12) // Default to 12 weeks

    const [
      overview,
      recipeStats,
      cuisineDistribution,
      mealTypeDistribution,
      weeklyTrends,
      nutritionalTrends,
      seasonalPatterns,
      wasteReduction
    ] = await Promise.all([
      this.getOverview(startDate, endDate),
      this.getRecipeStats(startDate, endDate),
      this.getCuisineDistribution(startDate, endDate),
      this.getMealTypeDistribution(startDate, endDate),
      this.getWeeklyTrends(startDate, endDate),
      this.getNutritionalTrends(startDate, endDate),
      this.getSeasonalPatterns(),
      this.getWasteReduction(startDate, endDate)
    ])

    return {
      overview,
      recipeStats,
      cuisineDistribution,
      mealTypeDistribution,
      weeklyTrends,
      nutritionalTrends,
      seasonalPatterns,
      wasteReduction
    }
  }

  // Get overview statistics
  private async getOverview(startDate: Date, endDate: Date) {
    const mealPlans = await prisma.mealPlan.findMany({
      where: {
        userId: this.userId,
        startDate: { gte: startDate },
        endDate: { lte: endDate }
      },
      include: {
        meals: {
          include: {
            recipe: true
          }
        }
      }
    })

    const allMeals = mealPlans.flatMap(plan => plan.meals)
    const uniqueRecipeIds = new Set(allMeals.filter(m => m.recipeId).map(m => m.recipeId))

    // Calculate planning streak
    const weeklyPlans = new Map<string, boolean>()
    mealPlans.forEach(plan => {
      const weekKey = format(startOfWeek(plan.startDate), 'yyyy-MM-dd')
      weeklyPlans.set(weekKey, true)
    })

    let streak = 0
    let currentDate = startOfWeek(new Date())
    while (weeklyPlans.has(format(currentDate, 'yyyy-MM-dd'))) {
      streak++
      currentDate = subWeeks(currentDate, 1)
    }

    // Find most active day of week
    const dayActivity = new Map<number, number>()
    allMeals.forEach(meal => {
      const day = new Date(meal.date).getDay()
      dayActivity.set(day, (dayActivity.get(day) || 0) + 1)
    })

    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
    let mostActiveDay = 'Monday'
    let maxActivity = 0
    dayActivity.forEach((count, day) => {
      if (count > maxActivity) {
        maxActivity = count
        mostActiveDay = dayNames[day]
      }
    })

    const totalDays = differenceInDays(endDate, startDate)
    const weeks = safeWeeksFromDays(totalDays) // Guard short ranges

    return {
      totalMealsPlanned: allMeals.length,
      uniqueRecipesUsed: uniqueRecipeIds.size,
      averageMealsPerWeek: Math.round(safeDiv(allMeals.length, weeks)),
      planningStreak: streak,
      mostActiveDay
    }
  }

  // Get recipe statistics
  private async getRecipeStats(startDate: Date, endDate: Date) {
    const meals = await prisma.plannedMeal.findMany({
      where: {
        mealPlan: {
          userId: this.userId,
          startDate: { gte: startDate },
          endDate: { lte: endDate }
        },
        recipeId: { not: null }
      },
      include: {
        recipe: true
      },
      orderBy: {
        date: 'desc'
      }
    })

    // Count recipe frequency
    const recipeFrequency = new Map<string, {
      name: string
      count: number
      dates: Date[]
    }>()

    meals.forEach(meal => {
      if (meal.recipe) {
        const existing = recipeFrequency.get(meal.recipeId!) || {
          name: meal.recipe.title,
          count: 0,
          dates: []
        }
        existing.count++
        existing.dates.push(meal.date)
        recipeFrequency.set(meal.recipeId!, existing)
      }
    })

    // Convert to sorted arrays
    const frequencyArray: RecipeFrequency[] = Array.from(recipeFrequency.entries()).map(([id, data]) => {
      const sortedDates = data.dates.sort((a, b) => a.getTime() - b.getTime())
      let avgDaysBetween = 0

      if (sortedDates.length > 1) {
        const gaps = []
        for (let i = 1; i < sortedDates.length; i++) {
          gaps.push(differenceInDays(sortedDates[i], sortedDates[i - 1]))
        }
        avgDaysBetween = gaps.reduce((a, b) => a + b, 0) / gaps.length
      }

      return {
        recipeId: id,
        recipeName: data.name,
        count: data.count,
        lastPlanned: sortedDates[sortedDates.length - 1],
        averageDaysBetween: avgDaysBetween
      }
    })

    const mostPlanned = frequencyArray
      .sort((a, b) => b.count - a.count)
      .slice(0, 10)

    // Get all user recipes to find least used
    const allRecipes = await prisma.recipe.findMany({
      where: { userId: this.userId },
      select: { id: true, title: true }
    })

    const leastUsed = allRecipes
      .filter(recipe => !recipeFrequency.has(recipe.id) || recipeFrequency.get(recipe.id)!.count < 2)
      .map(recipe => ({
        recipeId: recipe.id,
        recipeName: recipe.title,
        count: recipeFrequency.get(recipe.id)?.count || 0,
        lastPlanned: recipeFrequency.get(recipe.id)?.dates[0]
      }))
      .slice(0, 10)

    // Find recipes that need rotation (haven't been used in 3+ weeks)
    const threeWeeksAgo = subWeeks(new Date(), 3)
    const needsRotation = frequencyArray
      .filter(r => r.lastPlanned && r.lastPlanned < threeWeeksAgo && r.count > 2)
      .sort((a, b) => a.lastPlanned!.getTime() - b.lastPlanned!.getTime())
      .slice(0, 10)

    return {
      mostPlanned,
      leastUsed,
      needsRotation
    }
  }

  // Get cuisine distribution
  private async getCuisineDistribution(startDate: Date, endDate: Date): Promise<CuisineDistribution[]> {
    const meals = await prisma.plannedMeal.findMany({
      where: {
        mealPlan: {
          userId: this.userId,
          startDate: { gte: startDate },
          endDate: { lte: endDate }
        },
        recipe: { isNot: null }
      },
      include: {
        recipe: true
      }
    })

    const cuisineCounts = new Map<string, number>()
    let total = 0

    meals.forEach(meal => {
      if (meal.recipe?.cuisine) {
        const cuisine = meal.recipe.cuisine
        cuisineCounts.set(cuisine, (cuisineCounts.get(cuisine) || 0) + 1)
        total++
      }
    })

    return Array.from(cuisineCounts.entries())
      .map(([cuisine, count]) => ({
        cuisine,
        count,
        percentage: Math.round(safePercentage(count, total)) // Safe percentage with zero check
      }))
      .sort((a, b) => b.count - a.count)
  }

  // Get meal type distribution
  private async getMealTypeDistribution(startDate: Date, endDate: Date): Promise<MealTypeDistribution[]> {
    const meals = await prisma.plannedMeal.findMany({
      where: {
        mealPlan: {
          userId: this.userId,
          startDate: { gte: startDate },
          endDate: { lte: endDate }
        }
      },
      include: {
        recipe: true
      }
    })

    const mealTypeCounts = new Map<MealType, { count: number; calories: number[] }>()
    let total = 0

    meals.forEach(meal => {
      const existing = mealTypeCounts.get(meal.mealType) || { count: 0, calories: [] }
      existing.count++
      if (meal.recipe?.calories) {
        existing.calories.push(meal.recipe.calories)
      }
      mealTypeCounts.set(meal.mealType, existing)
      total++
    })

    return Array.from(mealTypeCounts.entries())
      .map(([mealType, data]) => ({
        mealType,
        count: data.count,
        percentage: Math.round(safePercentage(data.count, total)), // Safe percentage
        averageCalories: data.calories.length > 0
          ? Math.round(safeAverage(data.calories)) // Safe average
          : undefined
      }))
      .sort((a, b) => {
        const order = { BREAKFAST: 0, LUNCH: 1, DINNER: 2, SNACK: 3 }
        return order[a.mealType] - order[b.mealType]
      })
  }

  // Get weekly trends
  private async getWeeklyTrends(startDate: Date, endDate: Date): Promise<WeeklyStats[]> {
    const mealPlans = await prisma.mealPlan.findMany({
      where: {
        userId: this.userId,
        startDate: { gte: startDate },
        endDate: { lte: endDate }
      },
      include: {
        meals: true
      }
    })

    const weeklyStats = new Map<string, {
      week: string;
      totalMeals: number;
      uniqueRecipes: Set<string>;
      completedMeals: number;
      totalDays: Set<string>;
    }>()

    mealPlans.forEach(plan => {
      plan.meals.forEach(meal => {
        const weekStart = format(startOfWeek(meal.date), 'yyyy-MM-dd')
        const existing = weeklyStats.get(weekStart) || {
          week: weekStart,
          totalMeals: 0,
          uniqueRecipes: new Set<string>(),
          completedMeals: 0,
          totalDays: new Set<string>()
        }

        existing.totalMeals++
        if (meal.recipeId) {
          existing.uniqueRecipes.add(meal.recipeId)
        }
        if (meal.isCompleted) {
          existing.completedMeals++
        }
        existing.totalDays.add(format(meal.date, 'yyyy-MM-dd'))

        weeklyStats.set(weekStart, existing)
      })
    })

    return Array.from(weeklyStats.values())
      .map(week => ({
        week: week.week,
        totalMeals: week.totalMeals,
        uniqueRecipes: week.uniqueRecipes.size,
        averageMealsPerDay: Math.round(safeDiv(week.totalMeals, week.totalDays.size) * 10) / 10, // Safe division with 1dp
        completionRate: Math.round(safePercentage(week.completedMeals, week.totalMeals)) // Safe percentage
      }))
      .sort((a, b) => a.week.localeCompare(b.week))
      .slice(-12) // Last 12 weeks
  }

  // Get nutritional trends
  private async getNutritionalTrends(startDate: Date, endDate: Date): Promise<NutritionalTrends> {
    const meals = await prisma.plannedMeal.findMany({
      where: {
        mealPlan: {
          userId: this.userId,
          startDate: { gte: startDate },
          endDate: { lte: endDate }
        },
        recipe: { isNot: null }
      },
      include: {
        recipe: true
      },
      orderBy: {
        date: 'asc'
      }
    })

    const nutritionGoal = await prisma.nutritionGoal.findFirst({
      where: {
        userId: this.userId,
        isActive: true
      }
    })

    // Calculate daily totals
    const dailyTotals = new Map<string, {
      calories: number
      protein: number
      carbs: number
      fat: number
      mealCount: number
    }>()

    meals.forEach(meal => {
      if (meal.recipe) {
        const dateKey = format(meal.date, 'yyyy-MM-dd')
        const existing = dailyTotals.get(dateKey) || {
          calories: 0,
          protein: 0,
          carbs: 0,
          fat: 0,
          mealCount: 0
        }

        if (meal.recipe.calories) existing.calories += meal.recipe.calories * (meal.servings / (meal.recipe.servings || 4))
        if (meal.recipe.protein) existing.protein += meal.recipe.protein * (meal.servings / (meal.recipe.servings || 4))
        if (meal.recipe.carbs) existing.carbs += meal.recipe.carbs * (meal.servings / (meal.recipe.servings || 4))
        if (meal.recipe.fat) existing.fat += meal.recipe.fat * (meal.servings / (meal.recipe.servings || 4))
        existing.mealCount++

        dailyTotals.set(dateKey, existing)
      }
    })

    const totalsArray = Array.from(dailyTotals.values())

    // Calculate averages with safe division
    const averageCalories = Math.round(safeAverage(totalsArray.map(d => d.calories)))
    const averageProtein = Math.round(safeAverage(totalsArray.map(d => d.protein)))
    const averageCarbs = Math.round(safeAverage(totalsArray.map(d => d.carbs)))
    const averageFat = Math.round(safeAverage(totalsArray.map(d => d.fat)))

    // Calculate trend (compare last 2 weeks to previous 2 weeks)
    // Require minimum sample size (≥4 points) else return "stable"
    let caloriesTrend: 'up' | 'down' | 'stable' = 'stable'
    
    if (hasMinimumSampleSize(totalsArray.length, 4)) {
      const midPoint = Math.floor(totalsArray.length / 2)
      const firstHalf = totalsArray.slice(0, midPoint)
      const secondHalf = totalsArray.slice(midPoint)
      
      const firstHalfCalories = safeAverage(firstHalf.map(d => d.calories))
      const secondHalfCalories = safeAverage(secondHalf.map(d => d.calories))

      if (secondHalfCalories > firstHalfCalories * 1.05) caloriesTrend = 'up'
      else if (secondHalfCalories < firstHalfCalories * 0.95) caloriesTrend = 'down'
    }

    // Calculate compliance rate with safe percentage
    let complianceRate = 0
    if (nutritionGoal) {
      const daysWithinGoal = totalsArray.filter(day => {
        const calorieVariance = safeDiv(Math.abs(day.calories - nutritionGoal.targetCalories), nutritionGoal.targetCalories)
        return calorieVariance < 0.1 // Within 10% of goal
      }).length
      complianceRate = Math.round(safePercentage(daysWithinGoal, totalsArray.length))
    }

    return {
      averageCalories,
      averageProtein,
      averageCarbs,
      averageFat,
      caloriesTrend,
      complianceRate
    }
  }

  // Get seasonal patterns
  private async getSeasonalPatterns(): Promise<SeasonalPattern[]> {
    const meals = await prisma.plannedMeal.findMany({
      where: {
        mealPlan: {
          userId: this.userId
        },
        recipe: { isNot: null }
      },
      include: {
        recipe: true
      }
    })

    const seasonalData = new Map<string, {
      recipes: Map<string, number>
      cuisines: Map<string, number>
      calories: number[]
    }>()

    meals.forEach(meal => {
      const month = new Date(meal.date).getMonth()
      let season: string
      if (month >= 2 && month <= 4) season = 'spring'
      else if (month >= 5 && month <= 7) season = 'summer'
      else if (month >= 8 && month <= 10) season = 'fall'
      else season = 'winter'

      const existing = seasonalData.get(season) || {
        recipes: new Map<string, number>(),
        cuisines: new Map<string, number>(),
        calories: [] as number[]
      }

      if (meal.recipe) {
        existing.recipes.set(meal.recipe.title, (existing.recipes.get(meal.recipe.title) || 0) + 1)
        if (meal.recipe.cuisine) {
          existing.cuisines.set(meal.recipe.cuisine, (existing.cuisines.get(meal.recipe.cuisine) || 0) + 1)
        }
        if (meal.recipe.calories) {
          existing.calories.push(meal.recipe.calories)
        }
      }

      seasonalData.set(season, existing)
    })

    return ['winter', 'spring', 'summer', 'fall'].map(season => {
      const data = seasonalData.get(season)
      if (!data) {
        return {
          season: season as any,
          popularRecipes: [],
          cuisinePreferences: [],
          averageCalories: 0
        }
      }

      const popularRecipes = Array.from(data.recipes.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([recipe]) => recipe)

      const cuisinePreferences = Array.from(data.cuisines.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([cuisine]) => cuisine)

      const averageCalories = Math.round(safeAverage(data.calories)) // Safe average

      return {
        season: season as any,
        popularRecipes,
        cuisinePreferences,
        averageCalories
      }
    })
  }

  // Get waste reduction insights
  private async getWasteReduction(startDate: Date, endDate: Date) {
    const meals = await prisma.plannedMeal.findMany({
      where: {
        mealPlan: {
          userId: this.userId,
          startDate: { gte: startDate },
          endDate: { lte: endDate }
        }
      },
      include: {
        recipe: true
      }
    })

    const totalMeals = meals.length
    const completedMeals = meals.filter(m => m.isCompleted).length
    const completionRate = Math.round((completedMeals / totalMeals) * 100)

    // Find most wasted recipes
    const recipeWaste = new Map<string, { name: string; planned: number; completed: number }>()

    meals.forEach(meal => {
      if (meal.recipe) {
        const existing = recipeWaste.get(meal.recipeId!) || {
          name: meal.recipe.title,
          planned: 0,
          completed: 0
        }
        existing.planned++
        if (meal.isCompleted) existing.completed++
        recipeWaste.set(meal.recipeId!, existing)
      }
    })

    const mostWasted = Array.from(recipeWaste.entries())
      .filter(([_, data]) => data.planned > 2) // Only consider recipes planned 3+ times
      .map(([_, data]) => ({
        name: data.name,
        wasteRate: 1 - (data.completed / data.planned)
      }))
      .sort((a, b) => b.wasteRate - a.wasteRate)
      .slice(0, 5)
      .map(r => r.name)

    // Generate improvement tips
    const improvementTips = []

    if (completionRate < 70) {
      improvementTips.push('Consider planning fewer meals per week to reduce waste')
    }
    if (completionRate < 50) {
      improvementTips.push('Try using meal templates for consistency')
    }
    if (mostWasted.length > 0) {
      improvementTips.push(`Consider removing or modifying recipes like ${mostWasted[0]} that often go unmade`)
    }
    if (completionRate > 90) {
      improvementTips.push('Great job! Your meal completion rate is excellent!')
    }

    // Add day-specific tips
    const dayCompletion = new Map<number, { total: number; completed: number }>()
    meals.forEach(meal => {
      const day = new Date(meal.date).getDay()
      const existing = dayCompletion.get(day) || { total: 0, completed: 0 }
      existing.total++
      if (meal.isCompleted) existing.completed++
      dayCompletion.set(day, existing)
    })

    let worstDay = -1
    let worstRate = 1
    dayCompletion.forEach((data, day) => {
      const rate = data.completed / data.total
      if (rate < worstRate) {
        worstRate = rate
        worstDay = day
      }
    })

    if (worstDay >= 0 && worstRate < 0.6) {
      const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
      improvementTips.push(`${days[worstDay]}s have low completion rates - consider simpler meals or takeout`)
    }

    return {
      completionRate,
      mostWasted,
      improvementTips
    }
  }

  // Get personalized recommendations
  async getRecommendations(): Promise<PersonalizedRecommendations> {
    const endDate = new Date()
    const startDate = subWeeks(endDate, 8) // Look at last 8 weeks

    const [
      rotationSuggestions,
      cuisineSuggestions,
      nutritionalSuggestions,
      varietyScore,
      seasonalSuggestions,
      costOptimizations
    ] = await Promise.all([
      this.getRotationSuggestions(startDate, endDate),
      this.getCuisineSuggestions(startDate, endDate),
      this.getNutritionalSuggestions(startDate, endDate),
      this.calculateVarietyScore(startDate, endDate),
      this.getSeasonalSuggestions(),
      this.getCostOptimizations(startDate, endDate)
    ])

    return {
      rotationSuggestions,
      cuisineSuggestions,
      nutritionalSuggestions,
      varietyScore,
      seasonalSuggestions,
      costOptimizations
    }
  }

  // Get rotation suggestions
  private async getRotationSuggestions(startDate: Date, endDate: Date) {
    const recentMeals = await prisma.plannedMeal.findMany({
      where: {
        mealPlan: {
          userId: this.userId,
          startDate: { gte: startDate }
        },
        recipeId: { not: null }
      },
      select: {
        recipeId: true,
        date: true
      }
    })

    const lastUsedMap = new Map<string, Date>()
    recentMeals.forEach(meal => {
      if (meal.recipeId) {
        const existing = lastUsedMap.get(meal.recipeId)
        if (!existing || meal.date > existing) {
          lastUsedMap.set(meal.recipeId, meal.date)
        }
      }
    })

    // Get recipes that haven't been used recently
    const allRecipes = await prisma.recipe.findMany({
      where: { userId: this.userId },
      take: 50,
      orderBy: { createdAt: 'desc' }
    })

    const threeWeeksAgo = subWeeks(new Date(), 3)
    const suggestions = []

    for (const recipe of allRecipes) {
      const lastUsed = lastUsedMap.get(recipe.id)

      if (!lastUsed || lastUsed < threeWeeksAgo) {
        let reason = ''
        if (!lastUsed) {
          reason = "You haven't tried this recipe yet"
        } else {
          const weeksSince = Math.floor(differenceInDays(new Date(), lastUsed) / 7)
          reason = `You haven't made this in ${weeksSince} weeks`
        }

        suggestions.push({
          recipe,
          reason,
          lastUsed: lastUsed || null // Convert undefined to null for type compatibility
        })
      }

      if (suggestions.length >= 5) break
    }

    return suggestions
  }

  // Get cuisine suggestions
  private async getCuisineSuggestions(startDate: Date, endDate: Date) {
    const meals = await prisma.plannedMeal.findMany({
      where: {
        mealPlan: {
          userId: this.userId,
          startDate: { gte: startDate }
        },
        recipe: { isNot: null }
      },
      include: {
        recipe: true
      }
    })

    const cuisineCounts = new Map<string, number>()
    meals.forEach(meal => {
      if (meal.recipe?.cuisine) {
        cuisineCounts.set(meal.recipe.cuisine, (cuisineCounts.get(meal.recipe.cuisine) || 0) + 1)
      }
    })

    // Find underrepresented cuisines
    const allCuisines = await prisma.recipe.findMany({
      where: { userId: this.userId },
      select: { cuisine: true },
      distinct: ['cuisine']
    })

    const suggestions = []
    for (const { cuisine } of allCuisines) {
      if (cuisine) {
        const count = cuisineCounts.get(cuisine) || 0
        if (count < 3) {
          const recipes = await prisma.recipe.findMany({
            where: {
              userId: this.userId,
              cuisine
            },
            take: 3
          })

          suggestions.push({
            cuisine,
            reason: count === 0
              ? `Try adding more ${cuisine} recipes for variety`
              : `You've only had ${cuisine} ${count} times recently`,
            recipes
          })
        }
      }

      if (suggestions.length >= 3) break
    }

    return suggestions
  }

  // Get nutritional suggestions
  private async getNutritionalSuggestions(startDate: Date, endDate: Date): Promise<string[]> {
    const trends = await this.getNutritionalTrends(startDate, endDate)
    const suggestions = []

    if (trends.averageCalories > 2500) {
      suggestions.push('Consider adding more low-calorie recipes to balance your intake')
    }
    if (trends.averageProtein < 50) {
      suggestions.push('Try adding more protein-rich meals to meet your daily needs')
    }
    if (trends.caloriesTrend === 'up') {
      suggestions.push('Your calorie intake has been trending upward - consider lighter options')
    }
    if (trends.complianceRate < 50) {
      suggestions.push('Adjust your nutrition goals to be more achievable')
    }
    if (trends.averageCarbs > 300) {
      suggestions.push('Consider reducing carbohydrate intake with more veggie-based meals')
    }

    return suggestions
  }

  // Calculate variety score
  private async calculateVarietyScore(startDate: Date, endDate: Date): Promise<number> {
    const meals = await prisma.plannedMeal.findMany({
      where: {
        mealPlan: {
          userId: this.userId,
          startDate: { gte: startDate }
        },
        recipeId: { not: null }
      }
    })

    if (meals.length === 0) return 0

    const uniqueRecipes = new Set(meals.map(m => m.recipeId))
    const uniquenessRatio = uniqueRecipes.size / meals.length

    // Score is higher when ratio is closer to 1 (more variety)
    // Penalize if same recipe is used too often
    const score = Math.min(100, Math.round(uniquenessRatio * 150))

    return score
  }

  // Get seasonal suggestions
  private async getSeasonalSuggestions(): Promise<Recipe[]> {
    const currentMonth = new Date().getMonth()
    let season: string
    if (currentMonth >= 2 && currentMonth <= 4) season = 'spring'
    else if (currentMonth >= 5 && currentMonth <= 7) season = 'summer'
    else if (currentMonth >= 8 && currentMonth <= 10) season = 'fall'
    else season = 'winter'

    // Find recipes with seasonal tags or ingredients
    const seasonalKeywords = {
      winter: ['soup', 'stew', 'roast', 'comfort', 'warm'],
      spring: ['fresh', 'salad', 'light', 'green', 'asparagus'],
      summer: ['grill', 'bbq', 'cold', 'refreshing', 'tomato', 'corn'],
      fall: ['pumpkin', 'apple', 'harvest', 'squash', 'warm']
    }

    const recipes = await prisma.recipe.findMany({
      where: {
        userId: this.userId,
        OR: [
          { tags: { contains: season } },
          ...seasonalKeywords[season as keyof typeof seasonalKeywords].map(keyword => ({
            OR: [
              { title: { contains: keyword, mode: 'insensitive' as const } },
              { ingredients: { contains: keyword, mode: 'insensitive' as const } }
            ]
          }))
        ]
      },
      take: 5
    })

    return recipes
  }

  // Get cost optimization suggestions
  private async getCostOptimizations(startDate: Date, endDate: Date): Promise<string[]> {
    const suggestions = []

    // This would require cost data per recipe/ingredient
    // For now, provide general suggestions
    suggestions.push('Batch cook meals to reduce ingredient waste')
    suggestions.push('Plan meals that share common ingredients')
    suggestions.push('Consider seasonal produce for better prices')

    return suggestions
  }
}