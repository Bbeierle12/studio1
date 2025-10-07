'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Loader2, Sparkles, CheckCircle2 } from 'lucide-react';
import { useAutoTagRecipe, AutoTagResult } from '@/hooks/use-auto-tag';

interface AutoTagButtonProps {
  recipeId?: string;
  recipeName?: string;
  ingredients?: string[];
  instructions?: string;
  cuisine?: string;
  course?: string;
  existingTags?: string[];
  onTagsGenerated?: (result: AutoTagResult) => void;
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'default' | 'sm' | 'lg';
}

export function AutoTagButton({
  recipeId,
  recipeName,
  ingredients,
  instructions,
  cuisine,
  course,
  existingTags,
  onTagsGenerated,
  variant = 'outline',
  size = 'default',
}: AutoTagButtonProps) {
  const [open, setOpen] = useState(false);
  const [result, setResult] = useState<AutoTagResult | null>(null);
  const [applied, setApplied] = useState(false);
  const autoTag = useAutoTagRecipe();

  const handleGenerateTags = async (autoApply = false) => {
    try {
      const response = await autoTag.mutateAsync({
        recipeId,
        recipeName,
        ingredients,
        instructions,
        cuisine,
        course,
        existingTags,
        autoApply,
      });
      setResult(response);
      setApplied(autoApply);
      if (autoApply && onTagsGenerated) {
        onTagsGenerated(response);
      }
    } catch (error) {
      console.error('Error generating tags:', error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant={variant} size={size}>
          <Sparkles className="mr-2 h-4 w-4" />
          Auto-Tag with AI
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>AI-Powered Recipe Tagging</DialogTitle>
          <DialogDescription>
            Generate comprehensive tags and metadata for your recipe using AI
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {!result ? (
            <div className="space-y-4">
              <div className="bg-muted p-4 rounded-lg">
                <p className="text-sm text-muted-foreground">
                  Our AI will analyze your recipe and suggest:
                </p>
                <ul className="list-disc list-inside text-sm text-muted-foreground mt-2 space-y-1">
                  <li>Relevant tags and keywords</li>
                  <li>Meal type classification</li>
                  <li>Dietary labels (vegan, gluten-free, etc.)</li>
                  <li>Cooking method and difficulty</li>
                  <li>Seasonal recommendations</li>
                  <li>Cuisine and course suggestions</li>
                </ul>
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={() => handleGenerateTags(false)}
                  disabled={autoTag.isPending}
                  className="flex-1"
                >
                  {autoTag.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Sparkles className="mr-2 h-4 w-4" />
                      Preview Tags
                    </>
                  )}
                </Button>
                <Button
                  onClick={() => handleGenerateTags(true)}
                  disabled={autoTag.isPending}
                  variant="default"
                  className="flex-1"
                >
                  {autoTag.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    'Generate & Apply'
                  )}
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {applied && (
                <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg">
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                  <p className="text-sm text-green-800 font-medium">
                    Tags applied successfully!
                  </p>
                </div>
              )}

              <div>
                <p className="text-sm font-medium mb-2">Generated Tags:</p>
                <div className="flex flex-wrap gap-2">
                  {result.tags.map((tag, i) => (
                    <Badge key={i} variant="secondary">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>

              {result.mealType && result.mealType.length > 0 && (
                <div>
                  <p className="text-sm font-medium mb-2">Meal Type:</p>
                  <div className="flex flex-wrap gap-2">
                    {result.mealType.map((type, i) => (
                      <Badge key={i} variant="outline">
                        {type}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {result.dietaryLabels && result.dietaryLabels.length > 0 && (
                <div>
                  <p className="text-sm font-medium mb-2">Dietary Labels:</p>
                  <div className="flex flex-wrap gap-2">
                    {result.dietaryLabels.map((label, i) => (
                      <Badge key={i} variant="outline" className="bg-green-50">
                        {label}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                {result.suggestedCuisine && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Cuisine:</p>
                    <p className="text-sm">{result.suggestedCuisine}</p>
                  </div>
                )}
                {result.suggestedCourse && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Course:</p>
                    <p className="text-sm">{result.suggestedCourse}</p>
                  </div>
                )}
                {result.difficulty && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Difficulty:</p>
                    <p className="text-sm">{result.difficulty}</p>
                  </div>
                )}
                {result.prepTime && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Prep Time:</p>
                    <p className="text-sm">{result.prepTime}</p>
                  </div>
                )}
              </div>

              {result.cookingMethod && result.cookingMethod.length > 0 && (
                <div>
                  <p className="text-sm font-medium mb-2">Cooking Methods:</p>
                  <div className="flex flex-wrap gap-2">
                    {result.cookingMethod.map((method, i) => (
                      <Badge key={i} variant="outline">
                        {method}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {result.seasonality && result.seasonality.length > 0 && (
                <div>
                  <p className="text-sm font-medium mb-2">Best Seasons:</p>
                  <div className="flex flex-wrap gap-2">
                    {result.seasonality.map((season, i) => (
                      <Badge key={i} variant="outline">
                        {season}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              <div className="pt-2 border-t">
                <p className="text-xs text-muted-foreground">
                  Confidence Score: {Math.round(result.confidence * 100)}%
                </p>
              </div>

              {!applied && onTagsGenerated && (
                <Button
                  onClick={() => {
                    onTagsGenerated(result);
                    setApplied(true);
                  }}
                  className="w-full"
                >
                  Apply These Tags
                </Button>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
