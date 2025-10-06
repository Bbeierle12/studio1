'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import {
  useMealTemplates,
  useCreateTemplate,
  useDeleteTemplate,
  MealTemplate,
} from '@/hooks/use-meal-templates';
import { Save, Trash2, Calendar, ChevronRight } from 'lucide-react';
import { format } from 'date-fns';
import type { MealPlan, PlannedMeal, Recipe } from '@/lib/types';

interface MealTemplateDialogProps {
  mealPlan: MealPlan | null;
  recipes: Recipe[];
  onLoadTemplate: (template: MealTemplate, targetDate: Date) => Promise<void>;
  children?: React.ReactNode;
}

export function MealTemplateDialog({
  mealPlan,
  recipes,
  onLoadTemplate,
  children,
}: MealTemplateDialogProps) {
  const [open, setOpen] = useState(false);
  const [templateName, setTemplateName] = useState('');
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [loadingTemplateId, setLoadingTemplateId] = useState<string | null>(null);
  const [targetLoadDate, setTargetLoadDate] = useState(format(new Date(), 'yyyy-MM-dd'));

  const { toast } = useToast();
  const { data: templates, isLoading } = useMealTemplates();
  const createTemplate = useCreateTemplate();
  const deleteTemplate = useDeleteTemplate();

  const handleSaveTemplate = async () => {
    if (!templateName.trim()) {
      toast({
        title: 'Name Required',
        description: 'Please enter a name for your template.',
        variant: 'destructive',
      });
      return;
    }

    if (!mealPlan || !mealPlan.meals || !mealPlan.meals.length) {
      toast({
        title: 'No Meals',
        description: 'Add meals to your plan before saving as a template.',
        variant: 'destructive',
      });
      return;
    }

    try {
      const templateMeals = mealPlan.meals.map((meal) => ({
        mealType: meal.mealType,
        recipeId: meal.recipeId || undefined,
        customMealName: meal.customMealName || undefined,
        servings: meal.servings,
      }));

      await createTemplate.mutateAsync({
        name: templateName,
        meals: templateMeals,
      });

      toast({
        title: 'Template Saved',
        description: `"${templateName}" has been saved successfully.`,
      });

      setTemplateName('');
    } catch (error) {
      console.error('Error saving template:', error);
      toast({
        title: 'Error',
        description: 'Failed to save template. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteTemplate = async (id: string) => {
    try {
      await deleteTemplate.mutateAsync(id);
      toast({
        title: 'Template Deleted',
        description: 'Template has been removed.',
      });
      setDeleteConfirmId(null);
    } catch (error) {
      console.error('Error deleting template:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete template.',
        variant: 'destructive',
      });
    }
  };

  const handleLoadTemplate = async (template: MealTemplate) => {
    setLoadingTemplateId(template.id);
    try {
      const targetDate = new Date(targetLoadDate);
      await onLoadTemplate(template, targetDate);
      
      toast({
        title: 'Template Loaded',
        description: `"${template.name}" has been applied to your meal plan.`,
      });
      
      setOpen(false);
    } catch (error) {
      console.error('Error loading template:', error);
      toast({
        title: 'Error',
        description: 'Failed to load template.',
        variant: 'destructive',
      });
    } finally {
      setLoadingTemplateId(null);
    }
  };

  const getRecipeName = (recipeId?: string) => {
    if (!recipeId) return null;
    const recipe = recipes.find((r) => r.id === recipeId);
    return recipe?.title || 'Unknown Recipe';
  };

  const getMealTypeLabel = (mealType: string) => {
    return mealType.charAt(0) + mealType.slice(1).toLowerCase();
  };

  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          {children || (
            <Button variant="outline">
              <Save className="mr-2 h-4 w-4" />
              Templates
            </Button>
          )}
        </DialogTrigger>
        <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Meal Templates</DialogTitle>
            <DialogDescription>
              Save your current meal plan as a template or load a saved template.
            </DialogDescription>
          </DialogHeader>

          <Tabs defaultValue="load" className="flex-1 flex flex-col min-h-0">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="load">Load Template</TabsTrigger>
              <TabsTrigger value="save">Save Template</TabsTrigger>
            </TabsList>

            <TabsContent value="load" className="flex-1 flex flex-col min-h-0 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="target-date">Apply to Date</Label>
                <Input
                  id="target-date"
                  type="date"
                  value={targetLoadDate}
                  onChange={(e) => setTargetLoadDate(e.target.value)}
                />
                <p className="text-sm text-muted-foreground">
                  Templates will be applied starting from this date
                </p>
              </div>

              <ScrollArea className="flex-1 pr-4">
                {isLoading && (
                  <p className="text-sm text-muted-foreground">Loading templates...</p>
                )}

                {!isLoading && (!templates || templates.length === 0) && (
                  <div className="text-center py-8 text-muted-foreground">
                    <Calendar className="mx-auto h-12 w-12 mb-2 opacity-50" />
                    <p>No saved templates yet.</p>
                    <p className="text-sm">Create a meal plan and save it as a template!</p>
                  </div>
                )}

                {templates && templates.length > 0 && (
                  <div className="space-y-3">
                    {templates.map((template) => (
                      <div
                        key={template.id}
                        className="border rounded-lg p-4 space-y-2 hover:bg-accent transition-colors"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h4 className="font-semibold">{template.name}</h4>
                            <p className="text-xs text-muted-foreground">
                              {template.meals.length} meal{template.meals.length !== 1 ? 's' : ''} •
                              Created {format(new Date(template.createdAt), 'MMM d, yyyy')}
                            </p>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleLoadTemplate(template)}
                              disabled={loadingTemplateId === template.id}
                            >
                              {loadingTemplateId === template.id ? (
                                'Loading...'
                              ) : (
                                <>
                                  Load
                                  <ChevronRight className="ml-1 h-4 w-4" />
                                </>
                              )}
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => setDeleteConfirmId(template.id)}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </div>

                        <div className="space-y-1 text-sm">
                          {template.meals.slice(0, 3).map((meal, idx) => (
                            <div key={idx} className="flex items-center gap-2 text-muted-foreground">
                              <span className="font-medium">{getMealTypeLabel(meal.mealType)}:</span>
                              <span>
                                {meal.recipeId
                                  ? getRecipeName(meal.recipeId)
                                  : meal.customMealName || 'Unnamed Meal'}
                              </span>
                            </div>
                          ))}
                          {template.meals.length > 3 && (
                            <p className="text-xs text-muted-foreground">
                              +{template.meals.length - 3} more meal{template.meals.length - 3 !== 1 ? 's' : ''}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </TabsContent>

            <TabsContent value="save" className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="template-name">Template Name</Label>
                <Input
                  id="template-name"
                  placeholder="e.g., Typical Week, Weekend Meals"
                  value={templateName}
                  onChange={(e) => setTemplateName(e.target.value)}
                />
              </div>

              {mealPlan && mealPlan.meals && mealPlan.meals.length > 0 && (
                <div className="border rounded-lg p-4 space-y-2">
                  <p className="text-sm font-medium">Current Meal Plan Preview:</p>
                  <ScrollArea className="h-32">
                    <div className="space-y-1 text-sm">
                      {mealPlan.meals.map((meal) => (
                        <div key={meal.id} className="flex items-center gap-2 text-muted-foreground">
                          <span className="font-medium">{getMealTypeLabel(meal.mealType)}:</span>
                          <span>
                            {meal.recipe?.title || meal.customMealName || 'Unnamed Meal'}
                          </span>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </div>
              )}

              {(!mealPlan || !mealPlan.meals || mealPlan.meals.length === 0) && (
                <div className="text-center py-8 text-muted-foreground border rounded-lg">
                  <Calendar className="mx-auto h-12 w-12 mb-2 opacity-50" />
                  <p>No meals in current plan.</p>
                  <p className="text-sm">Add meals to save as a template!</p>
                </div>
              )}

              <Button
                onClick={handleSaveTemplate}
                disabled={!mealPlan || !mealPlan.meals || mealPlan.meals.length === 0 || createTemplate.isPending}
                className="w-full"
              >
                <Save className="mr-2 h-4 w-4" />
                {createTemplate.isPending ? 'Saving...' : 'Save as Template'}
              </Button>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteConfirmId} onOpenChange={() => setDeleteConfirmId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Template?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this meal template. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteConfirmId && handleDeleteTemplate(deleteConfirmId)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
