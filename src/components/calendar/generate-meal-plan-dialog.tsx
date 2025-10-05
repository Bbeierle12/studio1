'use client';

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { MealPlan } from '@/lib/types';
import { Wand2 } from 'lucide-react';

interface GenerateMealPlanDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mealPlan: MealPlan | null;
}

export function GenerateMealPlanDialog({
  open,
  onOpenChange,
  mealPlan
}: GenerateMealPlanDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Wand2 className="h-5 w-5" />
            Auto-Generate Meal Plan
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <p className="text-muted-foreground">
            This feature will intelligently generate meal suggestions based on weather forecasts and your preferences.
          </p>
          
          <div className="rounded-lg bg-muted p-4 text-sm">
            <p className="font-semibold mb-2">Coming Soon:</p>
            <ul className="list-disc list-inside space-y-1 text-muted-foreground">
              <li>Weather-based meal recommendations</li>
              <li>Dietary preference filters</li>
              <li>Leftover optimization</li>
              <li>Nutrition balancing</li>
            </ul>
          </div>
          
          <Button
            className="w-full"
            onClick={() => onOpenChange(false)}
          >
            Got it!
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
