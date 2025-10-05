'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MealPlan, WeatherForecast, MealType } from '@/lib/types';
import { useMealPlan } from '@/hooks/use-meal-plan';
import { Loader2 } from 'lucide-react';

interface AddMealDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  date: Date;
  mealPlan: MealPlan;
  weather: WeatherForecast | null;
  defaultMealType?: MealType;
}

export function AddMealDialog({
  open,
  onOpenChange,
  date,
  mealPlan,
  weather,
  defaultMealType = 'DINNER'
}: AddMealDialogProps) {
  const { addMeal, isCreating } = useMealPlan();
  const [mealType, setMealType] = useState<MealType>(defaultMealType);
  const [customMealName, setCustomMealName] = useState('');
  const [servings, setServings] = useState(4);
  const [notes, setNotes] = useState('');
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!customMealName.trim()) {
      return;
    }
    
    addMeal({
      mealPlanId: mealPlan.id,
      meal: {
        date,
        mealType,
        customMealName: customMealName.trim(),
        servings,
        notes: notes.trim() || undefined,
        weatherAtPlanning: weather ? {
          temp: weather.temperature.current,
          condition: weather.condition,
          precipitation: weather.precipitation
        } : undefined
      }
    });
    
    // Reset and close
    setCustomMealName('');
    setNotes('');
    onOpenChange(false);
  };
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            Add Meal for {date.toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Meal Type */}
          <div>
            <Label htmlFor="mealType">Meal Type</Label>
            <Select value={mealType} onValueChange={(v) => setMealType(v as MealType)}>
              <SelectTrigger id="mealType">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="BREAKFAST">Breakfast</SelectItem>
                <SelectItem value="LUNCH">Lunch</SelectItem>
                <SelectItem value="DINNER">Dinner</SelectItem>
                <SelectItem value="SNACK">Snack</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          {/* Meal Name */}
          <div>
            <Label htmlFor="mealName">Meal Name</Label>
            <Input
              id="mealName"
              value={customMealName}
              onChange={(e) => setCustomMealName(e.target.value)}
              placeholder="Enter meal name or recipe"
              required
            />
          </div>
          
          {/* Servings */}
          <div>
            <Label htmlFor="servings">Servings</Label>
            <Input
              id="servings"
              type="number"
              min="1"
              value={servings}
              onChange={(e) => setServings(parseInt(e.target.value))}
            />
          </div>
          
          {/* Notes */}
          <div>
            <Label htmlFor="notes">Notes (Optional)</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add any notes or modifications..."
              rows={3}
            />
          </div>
          
          {/* Weather Info */}
          {weather && (
            <div className="rounded-lg bg-muted p-3 text-sm">
              <p className="font-semibold mb-1">Weather Forecast:</p>
              <p className="text-muted-foreground">
                {weather.condition}, {weather.temperature.high}°F
                {weather.precipitation > 30 && ` · ${weather.precipitation}% chance of rain`}
              </p>
            </div>
          )}
          
          {/* Actions */}
          <div className="flex gap-2 justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isCreating}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isCreating}>
              {isCreating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Adding...
                </>
              ) : (
                'Add Meal'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
