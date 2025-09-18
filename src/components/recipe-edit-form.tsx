
'use client';

import { useEffect, useTransition, useActionState } from 'react';
import { updateRecipeAction, type FormState } from '@/app/actions';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import type { Recipe } from '@/lib/types';
import { Loader2 } from 'lucide-react';
import { useAuth } from '@/context/auth-context';
import Link from 'next/link';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

type RecipeEditFormProps = {
    recipe: Recipe;
};

export function RecipeEditForm({ recipe }: RecipeEditFormProps) {
  const initialState: FormState = { message: '', errors: {} };
  const [state, dispatch] = useActionState(updateRecipeAction, initialState);
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();
  const { user } = useAuth();
  
  // A user can edit if they are logged in AND (they are the recipe's owner OR the recipe has no owner).
  const canEdit = user && (!recipe.userId || user.uid === recipe.userId);


  useEffect(() => {
    if (state.message && state.message !== 'Validation failed. Please check your input.') {
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
    if (user?.displayName) {
      formData.set('contributor', user.displayName);
    } else {
        formData.set('contributor', recipe.contributor);
    }
    startTransition(() => {
      dispatch(formData);
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <input type="hidden" name="id" value={recipe.id} />
      <div className="space-y-2">
        <Label htmlFor="title">Recipe Title</Label>
        <Input id="title" name="title" defaultValue={recipe.title} required disabled={!canEdit} />
        {state.errors?.title && <p className="text-sm text-destructive">{state.errors.title}</p>}
      </div>

      <input type="hidden" name="contributor" value={user?.displayName || recipe.contributor} />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="prepTime">Prep Time (minutes)</Label>
          <Input id="prepTime" name="prepTime" type="number" placeholder="e.g., 30" defaultValue={recipe.prepTime} disabled={!canEdit} />
          {state.errors?.prepTime && <p className="text-sm text-destructive">{state.errors.prepTime}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="servings">Servings</Label>
          <Input id="servings" name="servings" type="number" placeholder="e.g., 4" defaultValue={recipe.servings} disabled={!canEdit} />
          {state.errors?.servings && <p className="text-sm text-destructive">{state.errors.servings}</p>}
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label htmlFor="course">Course</Label>
          <Select name="course" defaultValue={recipe.course} disabled={!canEdit}>
            <SelectTrigger>
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
           {state.errors?.course && <p className="text-sm text-destructive">{state.errors.course}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="cuisine">Cuisine</Label>
          <Select name="cuisine" defaultValue={recipe.cuisine} disabled={!canEdit}>
            <SelectTrigger>
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
          {state.errors?.cuisine && <p className="text-sm text-destructive">{state.errors.cuisine}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="difficulty">Difficulty</Label>
          <Select name="difficulty" defaultValue={recipe.difficulty} disabled={!canEdit}>
            <SelectTrigger>
              <SelectValue placeholder="Select difficulty" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Easy">Easy</SelectItem>
              <SelectItem value="Medium">Medium</SelectItem>
              <SelectItem value="Hard">Hard</SelectItem>
            </SelectContent>
          </Select>
          {state.errors?.difficulty && <p className="text-sm text-destructive">{state.errors.difficulty}</p>}
        </div>
      </div>


      <div className="space-y-2">
        <Label htmlFor="ingredients">Ingredients</Label>
        <Textarea
          id="ingredients"
          name="ingredients"
          defaultValue={recipe.ingredients}
          rows={8}
          required
          disabled={!canEdit}
        />
        {state.errors?.ingredients && <p className="text-sm text-destructive">{state.errors.ingredients}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="instructions">Instructions</Label>
        <Textarea
          id="instructions"
          name="instructions"
          defaultValue={recipe.instructions}
          rows={12}
          required
          disabled={!canEdit}
        />
        {state.errors?.instructions && <p className="text-sm text-destructive">{state.errors.instructions}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="tags">Tags</Label>
        <Input id="tags" name="tags" defaultValue={recipe.tags.join(', ')} required disabled={!canEdit} />
        <p className="text-sm text-muted-foreground">Separate tags with a comma.</p>
        {state.errors?.tags && <p className="text-sm text-destructive">{state.errors.tags}</p>}
      </div>

      <div className="flex flex-col items-center gap-4">
        <Button type="submit" className="w-full" disabled={isPending || !canEdit}>
            {isPending ? (
            <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving Changes...
            </>
            ) : (
            'Save Changes'
            )}
        </Button>
        {!user && (
            <p className="text-center text-sm text-muted-foreground">
            Please <Link href="/login" className="underline hover:text-primary">log in</Link> to edit this recipe.
            </p>
        )}
        {user && !canEdit && (
            <p className="text-center text-sm text-destructive">
            You do not have permission to edit this recipe.
            </p>
        )}
      </div>
    </form>
  );
}
