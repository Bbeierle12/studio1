import { getRecipeById } from '@/lib/data';
import { notFound } from 'next/navigation';
import Image from 'next/image';
import { ChefHat, Tag, User, Edit, Clock, Users, UtensilsCrossed, Globe, BarChart, BookOpen } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { DeleteRecipeButton } from '@/components/delete-recipe-button';
import { PrintRecipeButton } from '@/components/print-recipe-button';
import { IngredientList } from '@/components/ingredient-list';
import type { Recipe } from '@/lib/types';
import { SaveRecipeButton } from '@/components/save-recipe-button';

type RecipePageProps = {
  params: {
    id: string;
  };
};

export default async function RecipePage({ params }: RecipePageProps) {
  const recipe = await getRecipeById(params.id);

  if (!recipe) {
    notFound();
  }

  return (
    <article className="container mx-auto max-w-4xl py-8">
      <div className="space-y-4 print-only text-center mb-8">
         <h1 className="text-4xl font-headline font-extrabold tracking-tight lg:text-5xl">
            {recipe.title}
         </h1>
      </div>
      <div className="space-y-4 no-print">
        <div className="text-center">
            <h1 className="text-4xl font-headline font-extrabold tracking-tight lg:text-5xl">
            {recipe.title}
            </h1>
            <div className="mt-2 flex items-center justify-center space-x-4 text-muted-foreground flex-wrap">
                <div className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    <span>{recipe.contributor}</span>
                </div>
                 {recipe.prepTime && (
                    <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        <span>{recipe.prepTime} min</span>
                    </div>
                 )}
                 {recipe.servings && (
                    <div className="flex items-center gap-2">
                        <Users className="h-4 w-4" />
                        <span>Serves {recipe.servings}</span>
                    </div>
                 )}
                 {recipe.course && (
                    <div className="flex items-center gap-2">
                        <UtensilsCrossed className="h-4 w-4" />
                        <span>{recipe.course}</span>
                    </div>
                 )}
                 {recipe.cuisine && (
                    <div className="flex items-center gap-2">
                        <Globe className="h-4 w-4" />
                        <span>{recipe.cuisine}</span>
                    </div>
                 )}
                 {recipe.difficulty && (
                    <div className="flex items-center gap-2">
                        <BarChart className="h-4 w-4 -rotate-90" />
                        <span>{recipe.difficulty}</span>
                    </div>
                 )}
            </div>
            <div className="mt-2 flex items-center justify-center gap-2">
                <Tag className="h-4 w-4 text-muted-foreground" />
                <div className="flex flex-wrap gap-1">
                {recipe.tags.map((tag, index) => (
                    <span key={tag} className="capitalize text-muted-foreground">
                    {tag}
                    {index < recipe.tags.length - 1 ? ', ' : ''}
                    </span>
                ))}
                </div>
            </div>
        </div>
        <div className="flex justify-center gap-2 no-print">
            <PrintRecipeButton />
             <SaveRecipeButton recipe={recipe} />
            <Button asChild variant="outline" size="sm">
                <Link href={`/recipes/${recipe.id}/edit`}>
                    <Edit className="mr-2 h-4 w-4" />
                    Edit
                </Link>
            </Button>
            <DeleteRecipeButton recipeId={recipe.id} />
        </div>
      </div>

      <div className="my-8 overflow-hidden rounded-lg shadow-lg print:shadow-none print:border print:rounded-none print:my-4">
        <Image
          src="https://placehold.co/1200x675/FFFFFF/FFFFFF"
          alt={recipe.title}
          width={1200}
          height={675}
          className="h-full w-full object-cover"
          data-ai-hint={recipe.imageHint}
          priority
        />
      </div>

      <div className="mx-auto max-w-2xl">
        <div className="my-8 rounded-lg border bg-card p-6 print:border-none print:p-0 print:bg-transparent print:my-4">
            <div className="flex items-center gap-3">
                <ChefHat className="h-8 w-8 text-primary print:hidden"/>
                <h2 className="text-2xl font-headline font-semibold">Chef's Summary</h2>
            </div>
            <p className="mt-3 text-muted-foreground">
                {recipe.summary}
            </p>
        </div>

        {recipe.story && (
          <div className="my-8 rounded-lg border bg-card p-6 print:border-none print:p-0 print:bg-transparent print:my-4">
              <div className="flex items-center gap-3">
                  <BookOpen className="h-8 w-8 text-primary print:hidden"/>
                  <h2 className="text-2xl font-headline font-semibold">Family Story</h2>
              </div>
              <p className="mt-3 text-muted-foreground prose prose-stone dark:prose-invert max-w-none prose-p:text-muted-foreground">
                  {recipe.story}
              </p>
          </div>
        )}

        <div className="grid gap-8 md:grid-cols-3 print:grid-cols-1">
          <div className="md:col-span-1">
            <IngredientList ingredients={recipe.ingredients} />
          </div>
          <div className="md:col-span-2">
            <h2 className="text-2xl font-headline font-semibold">Instructions</h2>
            <Separator className="my-4" />
            <div className="prose prose-stone dark:prose-invert max-w-none prose-p:text-muted-foreground prose-li:text-muted-foreground print:prose-black">
              {recipe.instructions
                .split('\n')
                .map((paragraph, i) => (
                  <p key={i}>{paragraph}</p>
                ))}
            </div>
          </div>
        </div>
      </div>
    </article>
  );
}
