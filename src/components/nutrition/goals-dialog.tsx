'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { getPresetGoals } from '@/lib/nutrition-calculator';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format } from 'date-fns';
import { CalendarIcon } from 'lucide-react';

interface GoalsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialGoal?: any;
  onSuccess?: () => void;
}

interface GoalFormData {
  name: string;
  targetCalories: number;
  targetProtein: number;
  targetCarbs: number;
  targetFat: number;
  targetFiber: number;
  startDate: Date;
  endDate?: Date;
}

export function GoalsDialog({
  open,
  onOpenChange,
  initialGoal,
  onSuccess,
}: GoalsDialogProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [selectedPreset, setSelectedPreset] = useState<string>('');

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<GoalFormData>({
    defaultValues: initialGoal
      ? {
          name: initialGoal.name || '',
          targetCalories: initialGoal.targetCalories,
          targetProtein: initialGoal.targetProtein || 0,
          targetCarbs: initialGoal.targetCarbs || 0,
          targetFat: initialGoal.targetFat || 0,
          targetFiber: initialGoal.targetFiber || 0,
          startDate: initialGoal.startDate ? new Date(initialGoal.startDate) : new Date(),
          endDate: initialGoal.endDate ? new Date(initialGoal.endDate) : undefined,
        }
      : {
          name: '',
          targetCalories: 2000,
          targetProtein: 100,
          targetCarbs: 250,
          targetFat: 67,
          targetFiber: 28,
          startDate: new Date(),
        },
  });

  const startDate = watch('startDate');
  const endDate = watch('endDate');

  const handlePresetChange = (preset: string) => {
    setSelectedPreset(preset);
    if (preset) {
      const presetGoals = getPresetGoals(
        preset as 'weight-loss' | 'muscle-gain' | 'maintenance'
      );
      setValue('name', preset === 'weight-loss' ? 'Weight Loss' : preset === 'muscle-gain' ? 'Muscle Gain' : 'Maintenance');
      setValue('targetCalories', presetGoals.targetCalories);
      setValue('targetProtein', presetGoals.targetProtein || 0);
      setValue('targetCarbs', presetGoals.targetCarbs || 0);
      setValue('targetFat', presetGoals.targetFat || 0);
      setValue('targetFiber', presetGoals.targetFiber || 0);
    }
  };

  const onSubmit = async (data: GoalFormData) => {
    setIsLoading(true);
    try {
      const url = initialGoal
        ? '/api/nutrition/goals'
        : '/api/nutrition/goals';
      const method = initialGoal ? 'PATCH' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...(initialGoal && { id: initialGoal.id }),
          ...data,
          deactivateOthers: true,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to save nutrition goal');
      }

      toast({
        title: 'Success',
        description: initialGoal
          ? 'Nutrition goal updated successfully'
          : 'Nutrition goal created successfully',
      });

      onSuccess?.();
      onOpenChange(false);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to save nutrition goal',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {initialGoal ? 'Edit Nutrition Goal' : 'Set Nutrition Goals'}
          </DialogTitle>
          <DialogDescription>
            Set your daily nutritional targets to track your progress
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Preset Selection */}
          {!initialGoal && (
            <div className="space-y-2">
              <Label>Quick Start (Optional)</Label>
              <Select value={selectedPreset} onValueChange={handlePresetChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a preset or enter custom values" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="weight-loss">Weight Loss (1,800 kcal)</SelectItem>
                  <SelectItem value="maintenance">Maintenance (2,000 kcal)</SelectItem>
                  <SelectItem value="muscle-gain">Muscle Gain (2,500 kcal)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Goal Name */}
          <div className="space-y-2">
            <Label htmlFor="name">Goal Name (Optional)</Label>
            <Input
              id="name"
              {...register('name')}
              placeholder="e.g., Summer Cut, Bulking Phase"
            />
          </div>

          {/* Calories */}
          <div className="space-y-2">
            <Label htmlFor="targetCalories">
              Daily Calories Target <span className="text-red-500">*</span>
            </Label>
            <Input
              id="targetCalories"
              type="number"
              {...register('targetCalories', {
                required: 'Calories target is required',
                min: { value: 500, message: 'Minimum 500 calories' },
                max: { value: 10000, message: 'Maximum 10,000 calories' },
              })}
            />
            {errors.targetCalories && (
              <p className="text-sm text-red-500">{errors.targetCalories.message}</p>
            )}
          </div>

          {/* Macros Grid */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="targetProtein">Protein (g)</Label>
              <Input
                id="targetProtein"
                type="number"
                step="0.1"
                {...register('targetProtein', { min: 0 })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="targetCarbs">Carbs (g)</Label>
              <Input
                id="targetCarbs"
                type="number"
                step="0.1"
                {...register('targetCarbs', { min: 0 })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="targetFat">Fat (g)</Label>
              <Input
                id="targetFat"
                type="number"
                step="0.1"
                {...register('targetFat', { min: 0 })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="targetFiber">Fiber (g)</Label>
              <Input
                id="targetFiber"
                type="number"
                step="0.1"
                {...register('targetFiber', { min: 0 })}
              />
            </div>
          </div>

          {/* Date Range */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>
                Start Date <span className="text-red-500">*</span>
              </Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-left font-normal"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {startDate ? format(startDate, 'PPP') : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={startDate}
                    onSelect={(date) => date && setValue('startDate', date)}
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label>End Date (Optional)</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-left font-normal"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {endDate ? format(endDate, 'PPP') : <span>No end date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={endDate}
                    onSelect={(date) => setValue('endDate', date)}
                    disabled={(date) => date < startDate}
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Saving...' : initialGoal ? 'Update Goal' : 'Create Goal'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
