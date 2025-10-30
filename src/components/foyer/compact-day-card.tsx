'use client';

import { format } from 'date-fns';
import { PlannedMeal } from '@/lib/types';
import { getMealTypeEmoji } from '@/lib/calendar-utils';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';

interface CompactDayCardProps {
  date: Date;
  meals: PlannedMeal[];
  isPast?: boolean;
  onClick?: () => void;
  onAddMeal?: () => void;
}

export function CompactDayCard({
  date,
  meals,
  isPast = false,
  onClick,
  onAddMeal
}: CompactDayCardProps) {
  const dayName = format(date, 'EEE');
  const dayNumber = format(date, 'd');
  const hasMeals = meals.length > 0;
  const maxDisplayMeals = 2;
  const displayMeals = meals.slice(0, maxDisplayMeals);
  const remainingCount = meals.length - maxDisplayMeals;

  return (
    <div
      className={`
        bg-card border rounded-lg p-3 space-y-2 min-h-[100px]
        transition-all duration-200 ease-in-out
        ${isPast ? 'opacity-75 hover:opacity-90' : 'hover:shadow-lg hover:scale-[1.02]'}
        ${onClick ? 'cursor-pointer' : ''}
        ${!isPast ? 'hover:border-primary/50' : ''}
      `}
      onClick={onClick}
      role="article"
      aria-label={`${dayName} ${format(date, 'MMMM')} ${dayNumber}, ${meals.length} meals planned`}
      tabIndex={onClick ? 0 : -1}
      onKeyDown={(e) => {
        if (onClick && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault();
          onClick();
        }
      }}
    >
      {/* Day Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-baseline gap-2">
          <span className="text-xs text-muted-foreground font-semibold">
            {dayName}
          </span>
          <span className={`text-sm font-semibold ${isPast ? 'text-muted-foreground' : 'text-foreground'}`}>
            {dayNumber}
          </span>
        </div>
        {hasMeals && meals.length > maxDisplayMeals && (
          <span className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
            +{remainingCount} more
          </span>
        )}
      </div>

      {/* Meals List */}
      {hasMeals ? (
        <div className="space-y-1">
          {displayMeals.map((meal) => {
            const mealName = meal.recipe?.title || meal.customMealName || 'Unnamed Meal';
            const emoji = getMealTypeEmoji(meal.mealType);

            return (
              <div
                key={meal.id}
                className={`
                  text-xs leading-tight p-1.5 rounded flex items-start gap-1
                  ${meal.isCompleted
                    ? 'bg-muted/50 text-muted-foreground line-through'
                    : 'bg-primary/5 text-foreground'
                  }
                `}
              >
                <span className="text-[16px] leading-none flex-shrink-0">
                  {meal.isCompleted ? '✓' : emoji}
                </span>
                <span className="truncate flex-1 pt-0.5">
                  {mealName}
                </span>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-2">
          <p className="text-xs text-muted-foreground mb-2">No meals</p>
          {onAddMeal && !isPast && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs text-primary hover:text-primary-foreground hover:bg-primary"
              onClick={(e) => {
                e.stopPropagation();
                onAddMeal();
              }}
            >
              <Plus className="h-3 w-3 mr-1" />
              Add meal
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
