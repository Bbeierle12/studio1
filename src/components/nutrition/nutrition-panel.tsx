'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DailySummary } from './daily-summary';
import { GoalsDialog } from './goals-dialog';
import { Target, Calendar, TrendingUp, Settings } from 'lucide-react';
import { format } from 'date-fns';

interface NutritionPanelProps {
  selectedDate: Date;
  className?: string;
}

/**
 * Main nutrition tracking panel
 * Displays daily summary, weekly trends, and goal management
 */
export function NutritionPanel({ selectedDate, className = '' }: NutritionPanelProps) {
  const [showGoalsDialog, setShowGoalsDialog] = useState(false);
  const [activeTab, setActiveTab] = useState('daily');

  // These would be fetched from the API
  const [dailyData, setDailyData] = useState<any>(null);
  const [weeklyData, setWeeklyData] = useState<any>(null);
  const [activeGoal, setActiveGoal] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Fetch daily nutrition data
  const fetchDailyData = async (date: Date) => {
    setIsLoading(true);
    try {
      const response = await fetch(
        `/api/nutrition/summary?date=${format(date, 'yyyy-MM-dd')}`
      );
      if (response.ok) {
        const data = await response.json();
        setDailyData(data);
        setActiveGoal(data.goal);
      }
    } catch (error) {
      console.error('Error fetching daily nutrition:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch weekly nutrition data
  const fetchWeeklyData = async (startDate: Date) => {
    setIsLoading(true);
    try {
      const response = await fetch(
        `/api/nutrition/weekly-summary?startDate=${format(startDate, 'yyyy-MM-dd')}`
      );
      if (response.ok) {
        const data = await response.json();
        setWeeklyData(data);
      }
    } catch (error) {
      console.error('Error fetching weekly nutrition:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Load data when date changes
  useState(() => {
    fetchDailyData(selectedDate);
  });

  const handleGoalUpdate = () => {
    fetchDailyData(selectedDate);
  };

  return (
    <>
      <Card className={className}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                Nutrition Tracking
              </CardTitle>
              <CardDescription>
                Track your daily nutrition and progress toward goals
              </CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowGoalsDialog(true)}
            >
              <Settings className="h-4 w-4 mr-2" />
              {activeGoal ? 'Edit Goal' : 'Set Goals'}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="daily">
                <Calendar className="h-4 w-4 mr-2" />
                Daily
              </TabsTrigger>
              <TabsTrigger value="weekly">
                <TrendingUp className="h-4 w-4 mr-2" />
                Weekly
              </TabsTrigger>
              <TabsTrigger value="breakdown">
                Breakdown
              </TabsTrigger>
            </TabsList>

            <TabsContent value="daily" className="space-y-4">
              {isLoading ? (
                <div className="text-center py-8 text-muted-foreground">
                  Loading nutrition data...
                </div>
              ) : dailyData?.totalNutrition ? (
                <DailySummary
                  nutrition={dailyData.totalNutrition}
                  goal={activeGoal}
                  date={format(selectedDate, 'yyyy-MM-dd')}
                />
              ) : (
                <div className="text-center py-8">
                  <p className="text-muted-foreground mb-4">
                    No nutrition data for this date
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Add meals to your meal plan to see nutrition tracking
                  </p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="weekly" className="space-y-4">
              {isLoading ? (
                <div className="text-center py-8 text-muted-foreground">
                  Loading weekly data...
                </div>
              ) : weeklyData ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-4 bg-muted rounded-lg">
                      <div className="text-2xl font-bold">
                        {weeklyData.weeklyAverage.calories}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Avg Calories/Day
                      </div>
                    </div>
                    <div className="text-center p-4 bg-muted rounded-lg">
                      <div className="text-2xl font-bold">
                        {weeklyData.daysWithData}/7
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Days Tracked
                      </div>
                    </div>
                  </div>
                  <DailySummary
                    nutrition={weeklyData.weeklyAverage}
                    goal={activeGoal}
                  />
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">
                    Select a week to view weekly trends
                  </p>
                  <Button
                    className="mt-4"
                    onClick={() => fetchWeeklyData(selectedDate)}
                  >
                    Load Weekly Data
                  </Button>
                </div>
              )}
            </TabsContent>

            <TabsContent value="breakdown" className="space-y-4">
              {dailyData?.breakdown ? (
                <div className="space-y-4">
                  {dailyData.breakdown.map((mealType: any) => (
                    <Card key={mealType.mealType}>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-base">
                          {mealType.mealType} ({mealType.mealsCount} meals)
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-4 gap-2 text-sm">
                          <div>
                            <div className="text-muted-foreground">Calories</div>
                            <div className="font-semibold">
                              {mealType.nutrition.calories} kcal
                            </div>
                          </div>
                          <div>
                            <div className="text-muted-foreground">Protein</div>
                            <div className="font-semibold">
                              {mealType.nutrition.protein.toFixed(1)}g
                            </div>
                          </div>
                          <div>
                            <div className="text-muted-foreground">Carbs</div>
                            <div className="font-semibold">
                              {mealType.nutrition.carbs.toFixed(1)}g
                            </div>
                          </div>
                          <div>
                            <div className="text-muted-foreground">Fat</div>
                            <div className="font-semibold">
                              {mealType.nutrition.fat.toFixed(1)}g
                            </div>
                          </div>
                        </div>
                        {mealType.meals.length > 0 && (
                          <div className="mt-3 pt-3 border-t">
                            <div className="text-xs text-muted-foreground space-y-1">
                              {mealType.meals.map((meal: any) => (
                                <div key={meal.id}>
                                  • {meal.recipeName} (x{meal.servings})
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  No meal breakdown available
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      <GoalsDialog
        open={showGoalsDialog}
        onOpenChange={setShowGoalsDialog}
        initialGoal={activeGoal}
        onSuccess={handleGoalUpdate}
      />
    </>
  );
}
