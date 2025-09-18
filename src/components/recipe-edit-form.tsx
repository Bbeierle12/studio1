
'use client';

import { useEffect, useState, useTransition } from 'react';
import { useFormState } from 'react-dom';
import { updateRecipeAction, type FormState } from '@/app/actions';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { getUsers } from '@/lib/data';
import type { User, Recipe } from '@/lib/types';
import { Loader2 } from 'lucide-react';

type RecipeEditFormProps = {
    recipe: Recipe;
};

export function RecipeEditForm({ recipe }: RecipeEditFormProps) {
  const initialState: FormState = { message: '', errors: {} };
  const [state, dispatch] = useFormState(updateRecipeAction, initialState);
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();

  const [users, setUsers] = useState<User[]>([]);

  useEffect(() => {
    async function fetchUsers() {
      const fetchedUsers = await getUsers();
      setUsers(fetchedUsers);
    }
    fetchUsers();
  }, []);

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
    startTransition(() => {
      dispatch(formData);
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <input type="hidden" name="id" value={recipe.id} />
      <div className="space-y-2">
        <Label htmlFor="title">Recipe Title</Label>
        <Input id="title" name="title" defaultValue={recipe.title} required />
        {state.errors?.title && <p className="text-sm text-destructive">{state.errors.title}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="contributor">Contributor</Label>
        <Select name="contributor" defaultValue={recipe.contributor} required>
          <SelectTrigger>
            <SelectValue placeholder="Select a family member" />
          </SelectTrigger>
          <SelectContent>
            {users.map(user => (
              <SelectItem key={user.id} value={user.name}>
                {user.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {state.errors?.contributor && <p className="text-sm text-destructive">{state.errors.contributor}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="ingredients">Ingredients</Label>
        <Textarea
          id="ingredients"
          name="ingredients"
          defaultValue={recipe.ingredients}
          rows={8}
          required
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
        />
        {state.errors?.instructions && <p className="text-sm text-destructive">{state.errors.instructions}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="tags">Tags</Label>
        <Input id="tags" name="tags" defaultValue={recipe.tags.join(', ')} required />
        <p className="text-sm text-muted-foreground">Separate tags with a comma.</p>
        {state.errors?.tags && <p className="text-sm text-destructive">{state.errors.tags}</p>}
      </div>

      <Button type="submit" className="w-full" disabled={isPending}>
        {isPending ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Saving Changes...
          </>
        ) : (
          'Save Changes'
        )}
      </Button>
    </form>
  );
}
