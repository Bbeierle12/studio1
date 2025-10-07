'use client';

import { useMemo } from 'react';
import {
  NutritionData,
  NutritionGoal,
  calculateNutritionProgress,
  calculateMacroRatios,
  getNutritionProgressBarColor,
  getNutritionStatusColor,
} from '@/lib/nutrition-calculator';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Flame, Beef, Wheat, Droplets, Leaf, TrendingUp } from 'lucide-react';

interface DailySummaryProps {
  nutrition: NutritionData;
  goal?: NutritionGoal | null;
  date?: string;
  className?: string;
}

interface NutrientRowProps {
  icon: React.ReactNode;
  label: string;
  current: number;
  target?: number;
  unit: string;
  color: string;
}

function NutrientRow({ icon, label, current, target, unit, color }: NutrientRowProps) {
  const percentage = target && target > 0 ? Math.round((current / target) * 100) : 0;
  const statusColor = getNutritionStatusColor(percentage);
  const barColor = getNutritionProgressBarColor(percentage);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className={color}>{icon}</div>
          <span className="text-sm font-medium">{label}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold">
            {current.toFixed(current < 100 ? 1 : 0)}{unit}
          </span>
          {target && target > 0 && (
            <>
              <span className="text-sm text-muted-foreground">/ {target}{unit}</span>
              <Badge variant="outline" className={statusColor}>
                {percentage}%
              </Badge>
            </>
          )}
        </div>
      </div>
      {target && target > 0 && (
        <Progress value={Math.min(percentage, 100)} className={barColor} />
      )}
    </div>
  );
}

export function DailySummary({ nutrition, goal, date, className = '' }: DailySummaryProps) {
  const progress = useMemo(() => {
    if (!goal) return null;
    return calculateNutritionProgress(nutrition, goal);
  }, [nutrition, goal]);

  const macroRatios = useMemo(() => {
    return calculateMacroRatios(nutrition);
  }, [nutrition]);

  const hasGoal = !!goal;

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          Daily Nutrition Summary
        </CardTitle>
        {date && (
          <CardDescription>
            {new Date(date).toLocaleDateString('en-US', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </CardDescription>
        )}
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Calories */}
        <NutrientRow
          icon={<Flame className="h-4 w-4" />}
          label="Calories"
          current={nutrition.calories}
          target={goal?.targetCalories}
          unit=" kcal"
          color="text-orange-500"
        />

        {/* Protein */}
        <NutrientRow
          icon={<Beef className="h-4 w-4" />}
          label="Protein"
          current={nutrition.protein}
          target={goal?.targetProtein || undefined}
          unit="g"
          color="text-red-500"
        />

        {/* Carbs */}
        <NutrientRow
          icon={<Wheat className="h-4 w-4" />}
          label="Carbohydrates"
          current={nutrition.carbs}
          target={goal?.targetCarbs || undefined}
          unit="g"
          color="text-yellow-500"
        />

        {/* Fat */}
        <NutrientRow
          icon={<Droplets className="h-4 w-4" />}
          label="Fat"
          current={nutrition.fat}
          target={goal?.targetFat || undefined}
          unit="g"
          color="text-blue-500"
        />

        {/* Fiber */}
        {(nutrition.fiber > 0 || (goal?.targetFiber && goal.targetFiber > 0)) && (
          <NutrientRow
            icon={<Leaf className="h-4 w-4" />}
            label="Fiber"
            current={nutrition.fiber}
            target={goal?.targetFiber || undefined}
            unit="g"
            color="text-green-500"
          />
        )}

        {/* Macro Ratios */}
        {(nutrition.protein > 0 || nutrition.carbs > 0 || nutrition.fat > 0) && (
          <div className="pt-4 border-t">
            <h4 className="text-sm font-medium mb-3">Macro Distribution</h4>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-red-500">
                  {macroRatios.proteinPercent}%
                </div>
                <div className="text-xs text-muted-foreground">Protein</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-yellow-500">
                  {macroRatios.carbsPercent}%
                </div>
                <div className="text-xs text-muted-foreground">Carbs</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-blue-500">
                  {macroRatios.fatPercent}%
                </div>
                <div className="text-xs text-muted-foreground">Fat</div>
              </div>
            </div>
          </div>
        )}

        {/* Additional Nutrients */}
        {(nutrition.sugar > 0 || nutrition.sodium > 0) && (
          <div className="pt-4 border-t">
            <h4 className="text-sm font-medium mb-3">Other Nutrients</h4>
            <div className="grid grid-cols-2 gap-4">
              {nutrition.sugar > 0 && (
                <div>
                  <div className="text-sm text-muted-foreground">Sugar</div>
                  <div className="text-lg font-semibold">{nutrition.sugar.toFixed(1)}g</div>
                </div>
              )}
              {nutrition.sodium > 0 && (
                <div>
                  <div className="text-sm text-muted-foreground">Sodium</div>
                  <div className="text-lg font-semibold">{nutrition.sodium}mg</div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* No Goal Message */}
        {!hasGoal && (
          <div className="pt-4 border-t">
            <p className="text-sm text-muted-foreground text-center">
              Set nutrition goals to track your progress
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
