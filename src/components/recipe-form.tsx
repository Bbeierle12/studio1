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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { Recipe } from '@/lib/types';


type RecipeFormProps = {
    recipe?: {
        title: string;
        ingredients: string;
        instructions: string;
        tags: string;
        prepTime?: number;
        servings?: number;
        course?: Recipe['course'];
        cuisine?: Recipe['cuisine'];
        difficulty?: Recipe['difficulty'];
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
      
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
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
      
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="space-y-2">
          <Label htmlFor="course">Course</Label>
          <Select name="course" defaultValue={recipe?.course}>
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
          <Select name="cuisine" defaultValue={recipe?.cuisine}>
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
          <Select name="difficulty" defaultValue={recipe?.difficulty}>
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
