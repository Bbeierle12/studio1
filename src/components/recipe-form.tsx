'use client';

import { useEffect, useState, useTransition, useActionState } from 'react';
import { addRecipeAction, type FormState } from '@/app/actions';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';
import { useAuth } from '@/context/auth-context';
import Link from 'next/link';

type RecipeFormProps = {
    recipe?: {
        title: string;
        ingredients: string;
        instructions: string;
        tags: string;
        prepTime?: number;
        servings?: number;
    }
}

export function RecipeForm({ recipe }: RecipeFormProps) {
  const initialState: FormState = { message: '', errors: {} };
  const [state, dispatch] = useActionState(addRecipeAction, initialState);
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();
  const { user } = useAuth();


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
        // Fallback for when user has no display name
        formData.set('contributor', 'Anonymous Chef');
    }
    startTransition(() => {
      dispatch(formData);
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="title">Recipe Title</Label>
        <Input id="title" name="title" placeholder="e.g., Classic Chocolate Chip Cookies" defaultValue={recipe?.title} required />
        {state.errors?.title && <p className="text-sm text-destructive">{state.errors.title}</p>}
      </div>

       <input type="hidden" name="contributor" value={user?.displayName || 'Anonymous Chef'} />
      
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="prepTime">Prep Time (minutes)</Label>
          <Input id="prepTime" name="prepTime" type="number" placeholder="e.g., 30" defaultValue={recipe?.prepTime} />
          {state.errors?.prepTime && <p className="text-sm text-destructive">{state.errors.prepTime}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="servings">Servings</Label>
          <Input id="servings" name="servings" type="number" placeholder="e.g., 4" defaultValue={recipe?.servings} />
          {state.errors?.servings && <p className="text-sm text-destructive">{state.errors.servings}</p>}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="ingredients">Ingredients</Label>
        <Textarea
          id="ingredients"
          name="ingredients"
          placeholder="List each ingredient on a new line..."
          rows={8}
          defaultValue={recipe?.ingredients}
          required
        />
        {state.errors?.ingredients && <p className="text-sm text-destructive">{state.errors.ingredients}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="instructions">Instructions</Label>
        <Textarea
          id="instructions"
          name="instructions"
          placeholder="Describe the cooking steps..."
          rows={12}
          defaultValue={recipe?.instructions}
          required
        />
        {state.errors?.instructions && <p className="text-sm text-destructive">{state.errors.instructions}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="tags">Tags</Label>
        <Input id="tags" name="tags" placeholder="e.g., dessert, baking, vegetarian" defaultValue={recipe?.tags} required />
        <p className="text-sm text-muted-foreground">Separate tags with a comma.</p>
        {state.errors?.tags && <p className="text-sm text-destructive">{state.errors.tags}</p>}
      </div>

      <Button type="submit" className="w-full" disabled={isPending || !user}>
        {isPending ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Saving Recipe...
          </>
        ) : (
          'Save Recipe'
        )}
      </Button>
       {!user && (
        <p className="text-center text-sm text-muted-foreground">
          Please <Link href="/login" className="underline">log in</Link> to add a recipe.
        </p>
      )}
    </form>
  );
}
