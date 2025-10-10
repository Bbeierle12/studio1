'use client';

import { useState, useEffect, useTransition, useActionState } from 'react';
import { addRecipeAction, type FormState } from '@/app/actions';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  Loader2, 
  Wand2, 
  Globe, 
  Upload, 
  Sparkles,
  AlertCircle 
} from 'lucide-react';
import { useAuth } from '@/context/auth-context';
import type { Recipe } from '@/lib/types';
import type { ParsedRecipe } from '@/lib/recipe-parser';

export function UnifiedRecipeForm() {
  const initialState: FormState = { message: '', errors: {} };
  const [state, dispatch] = useActionState(addRecipeAction, initialState);
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();
  const { user } = useAuth();

  // Form state
  const [title, setTitle] = useState('');
  const [ingredients, setIngredients] = useState('');
  const [instructions, setInstructions] = useState('');
  const [tags, setTags] = useState('');
  const [prepTime, setPrepTime] = useState('');
  const [servings, setServings] = useState('');
  const [course, setCourse] = useState('');
  const [cuisine, setCuisine] = useState('');
  const [difficulty, setDifficulty] = useState('');
  const [story, setStory] = useState('');

  // Helper modals
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [showAIDialog, setShowAIDialog] = useState(false);
  const [importUrl, setImportUrl] = useState('');
  const [aiImageFile, setAiImageFile] = useState<File | null>(null);
  const [aiImagePreview, setAiImagePreview] = useState<string>('');
  const [isImporting, setIsImporting] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [helperSource, setHelperSource] = useState<'import' | 'ai' | null>(null);

  useEffect(() => {
    if (
      state.message &&
      state.message !== 'Validation failed. Please check your input.'
    ) {
      toast({
        variant: state.errors ? 'destructive' : 'default',
        title: state.errors ? 'Error' : 'Success',
        description: state.message,
      });
    }
  }, [state, toast]);

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    if (user?.name) {
      formData.set('contributor', user.name);
    } else {
      formData.set('contributor', 'Anonymous Chef');
    }
    startTransition(() => {
      dispatch(formData);
    });
  };

  // Import from URL handler
  const handleImportFromUrl = async () => {
    if (!importUrl) {
      toast({ 
        title: 'Error', 
        description: 'Please enter a URL', 
        variant: 'destructive' 
      });
      return;
    }

    setIsImporting(true);
    try {
      const response = await fetch('/api/recipe-import/parse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: importUrl }),
      });

      if (!response.ok) {
        throw new Error('Failed to parse recipe');
      }

      const data = await response.json();
      const recipe: ParsedRecipe = data.recipe;

      // Populate form fields
      setTitle(recipe.title || '');
      setIngredients(recipe.ingredients?.join('\n') || '');
      setInstructions(recipe.instructions?.join('\n') || '');
      setTags(recipe.tags?.join(', ') || '');
      setPrepTime(recipe.prepTime?.toString() || recipe.totalTime?.toString() || '');
      setServings(recipe.servings?.toString() || '');
      if (recipe.course) setCourse(recipe.course);
      if (recipe.cuisine) setCuisine(recipe.cuisine);
      if (recipe.difficulty) setDifficulty(recipe.difficulty);

      setHelperSource('import');
      setShowImportDialog(false);
      setImportUrl('');
      
      toast({
        title: 'Recipe imported!',
        description: 'Feel free to edit any fields before saving',
      });
    } catch (error) {
      toast({
        title: 'Import failed',
        description: error instanceof Error ? error.message : 'Could not import recipe',
        variant: 'destructive',
      });
    } finally {
      setIsImporting(false);
    }
  };

  // AI generation handler
  const handleGenerateWithAI = async () => {
    if (!title) {
      toast({
        title: 'Missing information',
        description: 'Please enter a recipe title',
        variant: 'destructive',
      });
      return;
    }

    setIsGenerating(true);
    try {
      const formData = new FormData();
      formData.set('title', title);
      
      // Add photo if provided
      if (aiImageFile) {
        const reader = new FileReader();
        const photoDataUri = await new Promise<string>((resolve) => {
          reader.onloadend = () => resolve(reader.result as string);
          reader.readAsDataURL(aiImageFile);
        });
        formData.set('photoDataUri', photoDataUri);
      }
      
      // Pass additional context to help AI generate better recipes
      if (prepTime) formData.set('prepTime', prepTime);
      if (servings) formData.set('servings', servings);
      if (course) formData.set('course', course);
      if (cuisine) formData.set('cuisine', cuisine);
      if (difficulty) formData.set('difficulty', difficulty);
      if (tags) formData.set('tags', tags);
      if (story) formData.set('story', story);

      const response = await fetch('/api/generate-recipe', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('AI generation failed');
      }

      const result = await response.json();

      // Populate form fields with AI results
      setIngredients(result.ingredients || '');
      setInstructions(result.instructions || '');
      setTags(result.tags || tags); // Use AI tags or keep existing
      
      // Set metadata if AI provided them and user didn't specify
      if (result.prepTime && !prepTime) setPrepTime(result.prepTime);
      if (result.servings && !servings) setServings(result.servings);
      if (result.course && !course) setCourse(result.course);
      if (result.cuisine && !cuisine) setCuisine(result.cuisine);
      if (result.difficulty && !difficulty) setDifficulty(result.difficulty);

      setHelperSource('ai');
      setShowAIDialog(false);
      setAiImageFile(null);
      setAiImagePreview('');

      toast({
        title: 'Recipe generated!',
        description: 'AI has filled in the details. Review and adjust as needed',
      });
    } catch (error) {
      toast({
        title: 'Generation failed',
        description: error instanceof Error ? error.message : 'Could not generate recipe',
        variant: 'destructive',
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAiImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setAiImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <>
      <Card className="p-6">
        {helperSource && (
          <div className="mb-6 rounded-lg border border-blue-500/50 bg-blue-500/10 p-4">
            <div className="flex items-start gap-3">
              {helperSource === 'ai' ? (
                <Sparkles className="h-5 w-5 text-blue-400 mt-0.5" />
              ) : (
                <Globe className="h-5 w-5 text-blue-400 mt-0.5" />
              )}
              <div>
                <p className="text-sm font-medium text-blue-300">
                  {helperSource === 'ai' 
                    ? 'Recipe generated with AI' 
                    : 'Recipe imported from URL'}
                </p>
                <p className="text-xs text-blue-300/70 mt-1">
                  Review and edit any fields as needed before saving
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Helper buttons */}
        <div className="flex flex-wrap gap-3 mb-6 pb-6 border-b">
          <Button
            type="button"
            variant="outline"
            onClick={() => setShowImportDialog(true)}
            className="gap-2"
          >
            <Globe className="h-4 w-4" />
            Import from URL
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => setShowAIDialog(true)}
            className="gap-2"
          >
            <Wand2 className="h-4 w-4" />
            Generate with AI
          </Button>
          <div className="flex-1" />
          <p className="text-sm text-muted-foreground self-center">
            Or fill in manually →
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="title">Recipe Title *</Label>
            <Input
              id="title"
              name="title"
              placeholder="e.g., Classic Chocolate Chip Cookies"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
            {state.errors?.title && (
              <p className="text-sm text-destructive">{state.errors.title}</p>
            )}
          </div>

          <input
            type="hidden"
            name="contributor"
            value={user?.name || 'Anonymous Chef'}
          />

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="prepTime">Prep Time (minutes)</Label>
              <Input
                id="prepTime"
                name="prepTime"
                type="number"
                placeholder="e.g., 30"
                value={prepTime}
                onChange={(e) => setPrepTime(e.target.value)}
              />
              {state.errors?.prepTime && (
                <p className="text-sm text-destructive">{state.errors.prepTime}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="servings">Servings</Label>
              <Input
                id="servings"
                name="servings"
                type="number"
                placeholder="e.g., 4"
                value={servings}
                onChange={(e) => setServings(e.target.value)}
              />
              {state.errors?.servings && (
                <p className="text-sm text-destructive">{state.errors.servings}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="course">Course</Label>
              <Select name="course" value={course} onValueChange={setCourse}>
                <SelectTrigger id="course">
                  <SelectValue placeholder="Select a course" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Appetizer">Appetizer</SelectItem>
                  <SelectItem value="Main">Main</SelectItem>
                  <SelectItem value="Dessert">Dessert</SelectItem>
                  <SelectItem value="Side">Side</SelectItem>
                  <SelectItem value="Breakfast">Breakfast</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="cuisine">Cuisine</Label>
              <Select name="cuisine" value={cuisine} onValueChange={setCuisine}>
                <SelectTrigger id="cuisine">
                  <SelectValue placeholder="Select a cuisine" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Italian">Italian</SelectItem>
                  <SelectItem value="American">American</SelectItem>
                  <SelectItem value="Mexican">Mexican</SelectItem>
                  <SelectItem value="Asian">Asian</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="difficulty">Difficulty</Label>
              <Select name="difficulty" value={difficulty} onValueChange={setDifficulty}>
                <SelectTrigger id="difficulty">
                  <SelectValue placeholder="Select difficulty" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Easy">Easy</SelectItem>
                  <SelectItem value="Medium">Medium</SelectItem>
                  <SelectItem value="Hard">Hard</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="ingredients">Ingredients *</Label>
            <Textarea
              id="ingredients"
              name="ingredients"
              placeholder="List ingredients, one per line"
              rows={8}
              value={ingredients}
              onChange={(e) => setIngredients(e.target.value)}
              required
            />
            {state.errors?.ingredients && (
              <p className="text-sm text-destructive">{state.errors.ingredients}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="instructions">Instructions *</Label>
            <Textarea
              id="instructions"
              name="instructions"
              placeholder="Describe the cooking steps"
              rows={10}
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              required
            />
            {state.errors?.instructions && (
              <p className="text-sm text-destructive">{state.errors.instructions}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="tags">Tags *</Label>
            <Input
              id="tags"
              name="tags"
              placeholder="e.g., dinner, italian, pasta"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              required
            />
            <p className="text-xs text-muted-foreground">
              Separate tags with commas
            </p>
            {state.errors?.tags && (
              <p className="text-sm text-destructive">{state.errors.tags}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="story">Family Story / Anecdote (optional)</Label>
            <Textarea
              id="story"
              name="story"
              placeholder="Share a memory or story about this recipe..."
              rows={4}
              value={story}
              onChange={(e) => setStory(e.target.value)}
            />
          </div>

          <div className="flex gap-4 pt-4">
            <Button type="submit" disabled={isPending} className="flex-1">
              {isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save Recipe'
              )}
            </Button>
          </div>
        </form>
      </Card>

      {/* Import Dialog */}
      <Dialog open={showImportDialog} onOpenChange={setShowImportDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Import Recipe from URL</DialogTitle>
            <DialogDescription>
              Paste a recipe URL from popular cooking websites. We'll extract the details and populate the form.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="import-url">Recipe URL</Label>
              <Input
                id="import-url"
                placeholder="https://www.allrecipes.com/recipe/..."
                value={importUrl}
                onChange={(e) => setImportUrl(e.target.value)}
                disabled={isImporting}
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Supports AllRecipes, Food Network, Serious Eats, NYT Cooking, and many more
            </p>
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setShowImportDialog(false)}
              disabled={isImporting}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleImportFromUrl}
              disabled={isImporting || !importUrl}
            >
              {isImporting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Importing...
                </>
              ) : (
                <>
                  <Globe className="mr-2 h-4 w-4" />
                  Import
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* AI Generation Dialog */}
      <Dialog open={showAIDialog} onOpenChange={setShowAIDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Generate Recipe with AI</DialogTitle>
            <DialogDescription>
              Fill in what you know and AI will generate the rest!
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="ai-title">Recipe Title *</Label>
              <Input
                id="ai-title"
                placeholder="e.g., Homemade Pizza"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                disabled={isGenerating}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="ai-image">Upload Photo (optional)</Label>
              <Input
                id="ai-image"
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                disabled={isGenerating}
              />
              {aiImagePreview && (
                <div className="mt-2 rounded-lg overflow-hidden border">
                  <img 
                    src={aiImagePreview} 
                    alt="Preview" 
                    className="w-full h-48 object-cover"
                  />
                </div>
              )}
            </div>

            <div className="pt-2 pb-2 border-t">
              <p className="text-sm font-medium mb-3">
                Optional: Help AI generate a better recipe
              </p>
              
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="ai-prepTime" className="text-xs">Prep Time (minutes)</Label>
                  <Input
                    id="ai-prepTime"
                    type="number"
                    placeholder="e.g., 30"
                    value={prepTime}
                    onChange={(e) => setPrepTime(e.target.value)}
                    disabled={isGenerating}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="ai-servings" className="text-xs">Servings</Label>
                  <Input
                    id="ai-servings"
                    type="number"
                    placeholder="e.g., 4"
                    value={servings}
                    onChange={(e) => setServings(e.target.value)}
                    disabled={isGenerating}
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3 mt-3">
                <div className="space-y-2">
                  <Label htmlFor="ai-course" className="text-xs">Course (optional)</Label>
                  <Select 
                    value={course || undefined} 
                    onValueChange={(value) => setCourse(value === 'unspecified' ? '' : value)}
                    disabled={isGenerating}
                  >
                    <SelectTrigger id="ai-course">
                      <SelectValue placeholder="Not specified" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Appetizer">Appetizer</SelectItem>
                      <SelectItem value="Main">Main</SelectItem>
                      <SelectItem value="Dessert">Dessert</SelectItem>
                      <SelectItem value="Side">Side</SelectItem>
                      <SelectItem value="Breakfast">Breakfast</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="ai-cuisine" className="text-xs">Cuisine (optional)</Label>
                  <Select 
                    value={cuisine || undefined} 
                    onValueChange={(value) => setCuisine(value === 'unspecified' ? '' : value)}
                    disabled={isGenerating}
                  >
                    <SelectTrigger id="ai-cuisine">
                      <SelectValue placeholder="Not specified" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Italian">Italian</SelectItem>
                      <SelectItem value="American">American</SelectItem>
                      <SelectItem value="Mexican">Mexican</SelectItem>
                      <SelectItem value="Asian">Asian</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="ai-difficulty" className="text-xs">Difficulty (optional)</Label>
                  <Select 
                    value={difficulty || undefined} 
                    onValueChange={(value) => setDifficulty(value === 'unspecified' ? '' : value)}
                    disabled={isGenerating}
                  >
                    <SelectTrigger id="ai-difficulty">
                      <SelectValue placeholder="Not specified" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Easy">Easy</SelectItem>
                      <SelectItem value="Medium">Medium</SelectItem>
                      <SelectItem value="Hard">Hard</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2 mt-3">
                <Label htmlFor="ai-tags" className="text-xs">Tags (comma-separated)</Label>
                <Input
                  id="ai-tags"
                  placeholder="e.g., dinner, italian, comfort-food"
                  value={tags}
                  onChange={(e) => setTags(e.target.value)}
                  disabled={isGenerating}
                />
              </div>

              <div className="space-y-2 mt-3">
                <Label htmlFor="ai-story" className="text-xs">Context / Special Notes</Label>
                <Textarea
                  id="ai-story"
                  placeholder="e.g., Make it kid-friendly, Extra spicy, Vegetarian version..."
                  rows={2}
                  value={story}
                  onChange={(e) => setStory(e.target.value)}
                  disabled={isGenerating}
                />
              </div>

              <p className="text-xs text-muted-foreground mt-3">
                💡 The more details you provide, the better AI can tailor the recipe to your needs
              </p>
            </div>

            {!title && (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/50">
                <AlertCircle className="h-4 w-4 text-yellow-500" />
                <p className="text-xs text-yellow-600 dark:text-yellow-400">
                  Please enter a recipe title
                </p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                setShowAIDialog(false);
                setAiImageFile(null);
                setAiImagePreview('');
              }}
              disabled={isGenerating}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleGenerateWithAI}
              disabled={isGenerating || !title}
            >
              {isGenerating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Wand2 className="mr-2 h-4 w-4" />
                  Generate Recipe
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
