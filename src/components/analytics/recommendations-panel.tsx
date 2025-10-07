'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  ChefHat,
  TrendingUp,
  Lightbulb,
  Calendar,
  DollarSign,
  Sparkles,
  Clock,
  Globe,
  Target,
  Info
} from 'lucide-react'
import { PersonalizedRecommendations } from '@/lib/analytics-engine'
import { format } from 'date-fns'
import { useRouter } from 'next/navigation'

interface RecommendationsPanelProps {
  recommendations: PersonalizedRecommendations
}

export function RecommendationsPanel({ recommendations }: RecommendationsPanelProps) {
  const router = useRouter()

  const getVarietyScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600'
    if (score >= 60) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getVarietyMessage = (score: number) => {
    if (score >= 80) return 'Excellent variety! You're doing great with recipe rotation.'
    if (score >= 60) return 'Good variety, but consider trying more diverse recipes.'
    return 'Low variety detected. Try rotating through more recipes.'
  }

  return (
    <div className="space-y-6">
      {/* Variety Score Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Meal Variety Score
            </span>
            <span className={`text-3xl font-bold ${getVarietyScoreColor(recommendations.varietyScore)}`}>
              {recommendations.varietyScore}
            </span>
          </CardTitle>
          <CardDescription>{getVarietyMessage(recommendations.varietyScore)}</CardDescription>
        </CardHeader>
        <CardContent>
          <Progress value={recommendations.varietyScore} className="h-3" />
        </CardContent>
      </Card>

      {/* Main Recommendations Grid */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Recipe Rotation Suggestions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Recipe Rotation
            </CardTitle>
            <CardDescription>
              Recipes you should consider making again
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[300px] pr-4">
              <div className="space-y-3">
                {recommendations.rotationSuggestions.length > 0 ? (
                  recommendations.rotationSuggestions.map((suggestion) => (
                    <div
                      key={suggestion.recipe.id}
                      className="p-3 border rounded-lg hover:bg-accent cursor-pointer transition-colors"
                      onClick={() => router.push(`/recipes/${suggestion.recipe.id}`)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="font-medium text-sm">{suggestion.recipe.title}</h4>
                          <p className="text-xs text-muted-foreground mt-1">
                            {suggestion.reason}
                          </p>
                        </div>
                        <Badge variant="outline" className="ml-2">
                          {suggestion.recipe.cuisine || 'Various'}
                        </Badge>
                      </div>
                      {suggestion.recipe.prepTime && (
                        <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          {suggestion.recipe.prepTime} mins
                        </div>
                      )}
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">
                    No rotation suggestions available. Keep planning meals!
                  </p>
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Cuisine Exploration */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5" />
              Cuisine Exploration
            </CardTitle>
            <CardDescription>
              Try something different this week
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[300px] pr-4">
              <div className="space-y-3">
                {recommendations.cuisineSuggestions.length > 0 ? (
                  recommendations.cuisineSuggestions.map((suggestion) => (
                    <div key={suggestion.cuisine} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium text-sm">{suggestion.cuisine}</h4>
                        <Badge variant="secondary">
                          {suggestion.recipes.length} recipes
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {suggestion.reason}
                      </p>
                      <div className="pl-4 space-y-1">
                        {suggestion.recipes.slice(0, 3).map((recipe) => (
                          <Button
                            key={recipe.id}
                            variant="ghost"
                            size="sm"
                            className="h-auto p-1 justify-start w-full"
                            onClick={() => router.push(`/recipes/${recipe.id}`)}
                          >
                            <ChefHat className="h-3 w-3 mr-1" />
                            <span className="text-xs truncate">{recipe.title}</span>
                          </Button>
                        ))}
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">
                    You're exploring cuisines well! Keep it up.
                  </p>
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>

      {/* Insights Grid */}
      <div className="grid gap-4 md:grid-cols-3">
        {/* Nutritional Suggestions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm">
              <Lightbulb className="h-4 w-4" />
              Nutrition Tips
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {recommendations.nutritionalSuggestions.length > 0 ? (
                recommendations.nutritionalSuggestions.map((suggestion, idx) => (
                  <div key={idx} className="flex items-start gap-2">
                    <Info className="h-3 w-3 mt-0.5 text-muted-foreground" />
                    <p className="text-xs text-muted-foreground">{suggestion}</p>
                  </div>
                ))
              ) : (
                <p className="text-xs text-muted-foreground">
                  Your nutrition is well-balanced!
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Seasonal Suggestions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm">
              <Calendar className="h-4 w-4" />
              Seasonal Picks
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {recommendations.seasonalSuggestions.length > 0 ? (
                recommendations.seasonalSuggestions.slice(0, 3).map((recipe) => (
                  <Button
                    key={recipe.id}
                    variant="ghost"
                    size="sm"
                    className="h-auto p-1 justify-start w-full"
                    onClick={() => router.push(`/recipes/${recipe.id}`)}
                  >
                    <span className="text-xs truncate">{recipe.title}</span>
                  </Button>
                ))
              ) : (
                <p className="text-xs text-muted-foreground">
                  No seasonal recommendations available
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Cost Optimizations */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm">
              <DollarSign className="h-4 w-4" />
              Save Money
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {recommendations.costOptimizations.length > 0 ? (
                recommendations.costOptimizations.map((tip, idx) => (
                  <div key={idx} className="flex items-start gap-2">
                    <Sparkles className="h-3 w-3 mt-0.5 text-muted-foreground" />
                    <p className="text-xs text-muted-foreground">{tip}</p>
                  </div>
                ))
              ) : (
                <p className="text-xs text-muted-foreground">
                  No cost optimizations available
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Smart Notifications Alert */}
      {recommendations.rotationSuggestions.length > 0 && (
        <Alert>
          <TrendingUp className="h-4 w-4" />
          <AlertDescription>
            <strong>Pro tip:</strong> Planning meals from your rotation suggestions helps maintain
            variety and reduces food waste. Try adding at least 2 suggested recipes to your next
            meal plan!
          </AlertDescription>
        </Alert>
      )}
    </div>
  )
}