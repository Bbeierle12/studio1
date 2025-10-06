'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { MealPlan, WeatherForecast, MealType, PlannedMeal } from '@/lib/types';
import { useMealPlan } from '@/hooks/use-meal-plan';
import { RecipeSelector } from './recipe-selector';
import { WeatherSuggestions } from './weather-suggestions';
import { Loader2, Trash2, AlertTriangle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Recipe {
  id: string;
  title: string;
  slug: string;
  course: string | null;
  cuisine: string | null;
  difficulty: string | null;
  prepTime: number | null;
  servings: number | null;
  tags: string;
  summary: string;
  imageUrl: string;
  ingredients: string;
}

interface AddMealDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  date: Date;
  mealPlan: MealPlan;
  weather: WeatherForecast | null;
  defaultMealType?: MealType;
  existingMeal?: PlannedMeal; // For edit mode
  recipes?: Recipe[]; // User's recipes
}

export function AddMealDialog({
  open,
  onOpenChange,
  date,
  mealPlan,
  weather,
  defaultMealType = 'DINNER',
  existingMeal,
  recipes = []
}: AddMealDialogProps) {
  const { addMeal, updateMeal, deleteMeal, isCreating, isUpdating, isDeleting } = useMealPlan();
  const { toast } = useToast();
  const isEditMode = !!existingMeal;
  
  // Form state
  const [activeTab, setActiveTab] = useState<'custom' | 'recipe' | 'suggested'>('custom');
  const [mealType, setMealType] = useState<MealType>(defaultMealType);
  const [customMealName, setCustomMealName] = useState('');
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [servings, setServings] = useState(4);
  const [notes, setNotes] = useState('');
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  
  // Initialize form with existing meal data
  useEffect(() => {
    if (existingMeal && open) {
      setMealType(existingMeal.mealType);
      setCustomMealName(existingMeal.customMealName || '');
      setServings(existingMeal.servings);
      setNotes(existingMeal.notes || '');
      
      // If meal has a recipe, switch to recipe tab and select it
      if (existingMeal.recipeId && recipes.length > 0) {
        const recipe = recipes.find(r => r.id === existingMeal.recipeId);
        if (recipe) {
          setSelectedRecipe(recipe);
          setActiveTab('recipe');
        }
      } else {
        setActiveTab('custom');
      }
    } else if (!existingMeal) {
      // Reset form for new meal
      setMealType(defaultMealType);
      setCustomMealName('');
      setSelectedRecipe(null);
      setServings(4);
      setNotes('');
      setActiveTab('custom');
    }
  }, [existingMeal, open, defaultMealType, recipes]);
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate
    if (activeTab === 'custom' && !customMealName.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter a meal name',
        variant: 'destructive'
      });
      return;
    }
    
    if (activeTab === 'recipe' && !selectedRecipe) {
      toast({
        title: 'Error',
        description: 'Please select a recipe',
        variant: 'destructive'
      });
      return;
    }
    
    const mealData = {
      date,
      mealType,
      recipeId: activeTab === 'recipe' ? selectedRecipe?.id : undefined,
      customMealName: activeTab === 'custom' ? customMealName.trim() : undefined,
      servings,
      notes: notes.trim() || undefined,
      weatherAtPlanning: weather ? {
        temp: weather.temperature.current,
        condition: weather.condition,
        precipitation: weather.precipitation
      } : undefined
    };
    
    if (isEditMode) {
      // Update existing meal
      updateMeal({
        mealPlanId: mealPlan.id,
        mealId: existingMeal.id,
        updates: mealData
      });
    } else {
      // Create new meal
      addMeal({
        mealPlanId: mealPlan.id,
        meal: mealData
      });
    }
    
    onOpenChange(false);
  };
  
  const handleDelete = () => {
    if (existingMeal) {
      deleteMeal({
        mealPlanId: mealPlan.id,
        mealId: existingMeal.id
      });
      setShowDeleteDialog(false);
      onOpenChange(false);
    }
  };
  
  const handleRecipeSelect = (recipe: Recipe) => {
    setSelectedRecipe(recipe);
    // Pre-fill servings from recipe if available
    if (recipe.servings) {
      setServings(recipe.servings);
    }
  };
  
  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {isEditMode ? 'Edit' : 'Add'} Meal for {date.toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}
            </DialogTitle>
            {weather && (
              <DialogDescription>
                Weather: {weather.condition}, {weather.temperature.high}°F
                {weather.precipitation > 30 && ` · ${weather.precipitation}% chance of rain`}
              </DialogDescription>
            )}
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
            
            {/* Tabs: Custom Meal vs Recipe vs Suggested */}
            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'custom' | 'recipe' | 'suggested')}>
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="custom">Custom Meal</TabsTrigger>
                <TabsTrigger value="recipe" disabled={recipes.length === 0}>
                  From Recipe {recipes.length === 0 && '(No recipes)'}
                </TabsTrigger>
                <TabsTrigger value="suggested" disabled={recipes.length === 0 || !weather}>
                  Suggested
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="custom" className="space-y-4 mt-4">
                <div>
                  <Label htmlFor="mealName">Meal Name</Label>
                  <Input
                    id="mealName"
                    value={customMealName}
                    onChange={(e) => setCustomMealName(e.target.value)}
                    placeholder="E.g., Grilled Chicken Salad, Leftover Pizza"
                    required={activeTab === 'custom'}
                  />
                </div>
              </TabsContent>
              
              <TabsContent value="recipe" className="mt-4">
                <RecipeSelector
                  recipes={recipes}
                  onSelect={handleRecipeSelect}
                  selectedRecipeId={selectedRecipe?.id}
                />
                {selectedRecipe && (
                  <div className="mt-4 p-3 bg-muted rounded-lg">
                    <p className="text-sm font-semibold">Selected: {selectedRecipe.title}</p>
                    <p className="text-xs text-muted-foreground mt-1">{selectedRecipe.summary}</p>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="suggested" className="mt-4">
                {weather ? (
                  <WeatherSuggestions
                    recipes={recipes}
                    weather={{
                      temperature: weather.temperature.current || weather.temperature.high,
                      condition: weather.condition,
                      precipitation: weather.precipitation,
                      humidity: weather.humidity
                    }}
                    mealType={mealType}
                    onSelectRecipe={(recipe) => {
                      setSelectedRecipe(recipe);
                      setActiveTab('recipe');
                      if (recipe.servings) {
                        setServings(recipe.servings);
                      }
                    }}
                    limit={5}
                  />
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    Weather data not available
                  </p>
                )}
              </TabsContent>
            </Tabs>
            
            {/* Servings */}
            <div>
              <Label htmlFor="servings">Servings</Label>
              <Input
                id="servings"
                type="number"
                min="1"
                max="100"
                value={servings}
                onChange={(e) => setServings(parseInt(e.target.value) || 1)}
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
            
            {/* Actions */}
            <div className="flex gap-2 justify-between">
              {/* Delete button (only in edit mode) */}
              <div>
                {isEditMode && (
                  <Button
                    type="button"
                    variant="destructive"
                    onClick={() => setShowDeleteDialog(true)}
                    disabled={isDeleting}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </Button>
                )}
              </div>
              
              {/* Cancel and Submit */}
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                  disabled={isCreating || isUpdating}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isCreating || isUpdating}>
                  {isCreating || isUpdating ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      {isEditMode ? 'Updating...' : 'Adding...'}
                    </>
                  ) : (
                    isEditMode ? 'Update Meal' : 'Add Meal'
                  )}
                </Button>
              </div>
            </div>
          </form>
        </DialogContent>
      </Dialog>
      
      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              Delete Meal?
            </AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this meal from your plan. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                'Delete'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
