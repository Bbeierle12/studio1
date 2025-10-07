'use client';

import { RecipeNutrition, hasNutritionData, formatNutritionValue } from '@/lib/nutrition-calculator';
import { Flame, Apple } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface NutritionBadgeProps {
  recipe: RecipeNutrition | null | undefined;
  servings?: number;
  variant?: 'default' | 'compact' | 'detailed';
  className?: string;
}

/**
 * Display nutrition information as a small badge
 * Used on recipe cards and meal items
 */
export function NutritionBadge({
  recipe,
  servings = 1,
  variant = 'default',
  className = '',
}: NutritionBadgeProps) {
  if (!recipe || !hasNutritionData(recipe)) {
    return null;
  }

  const calories = (recipe.calories || 0) * servings;
  const protein = (recipe.protein || 0) * servings;
  const carbs = (recipe.carbs || 0) * servings;
  const fat = (recipe.fat || 0) * servings;

  if (variant === 'compact') {
    return (
      <div className={`flex items-center gap-1 text-xs text-muted-foreground ${className}`}>
        <Flame className="h-3 w-3" />
        <span>{Math.round(calories)} kcal</span>
      </div>
    );
  }

  if (variant === 'detailed') {
    return (
      <div className={`flex flex-wrap items-center gap-2 ${className}`}>
        <Badge variant="secondary" className="gap-1">
          <Flame className="h-3 w-3" />
          {Math.round(calories)} kcal
        </Badge>
        {protein > 0 && (
          <Badge variant="outline" className="text-xs">
            P: {formatNutritionValue(protein, 'g')}
          </Badge>
        )}
        {carbs > 0 && (
          <Badge variant="outline" className="text-xs">
            C: {formatNutritionValue(carbs, 'g')}
          </Badge>
        )}
        {fat > 0 && (
          <Badge variant="outline" className="text-xs">
            F: {formatNutritionValue(fat, 'g')}
          </Badge>
        )}
      </div>
    );
  }

  // Default variant
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className="flex items-center gap-1 text-sm">
        <Flame className="h-4 w-4 text-orange-500" />
        <span className="font-medium">{Math.round(calories)}</span>
        <span className="text-xs text-muted-foreground">kcal</span>
      </div>
      {(protein > 0 || carbs > 0 || fat > 0) && (
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <Apple className="h-3 w-3" />
          <span>
            P:{protein.toFixed(0)} C:{carbs.toFixed(0)} F:{fat.toFixed(0)}
          </span>
        </div>
      )}
    </div>
  );
}
