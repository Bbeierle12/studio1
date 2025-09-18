import { getRecipeById } from '@/lib/data';
import { notFound } from 'next/navigation';
import Image from 'next/image';
import { Badge } from '@/components/ui/badge';
import { ChefHat, Tag, User, Edit, Clock, Users, UtensilsCrossed, Globe, BarChart, Printer } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { DeleteRecipeButton } from '@/components/delete-recipe-button';
import { PrintRecipeButton } from '@/components/print-recipe-button';

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
      <div className="space-y-4">
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
            <Button asChild variant="outline" size="sm">
                <Link href={`/recipes/${recipe.id}/edit`}>
                    <Edit className="mr-2 h-4 w-4" />
                    Edit
                </Link>
            </Button>
            <DeleteRecipeButton recipeId={recipe.id} />
        </div>
      </div>

      <div className="my-8 overflow-hidden rounded-lg shadow-lg">
        <Image
          src={recipe.imageUrl}
          alt={recipe.title}
          width={1200}
          height={675}
          className="h-full w-full object-cover"
          data-ai-hint={recipe.imageHint}
          priority
        />
      </div>

      <div className="mx-auto max-w-2xl">
        <div className="my-8 rounded-lg border bg-card p-6">
            <div className="flex items-center gap-3">
                <ChefHat className="h-8 w-8 text-primary"/>
                <h2 className="text-2xl font-headline font-semibold">Chef's Summary</h2>
            </div>
            <p className="mt-3 text-muted-foreground">
                {recipe.summary}
            </p>
        </div>

        <div className="grid gap-8 md:grid-cols-3">
          <div className="md:col-span-1">
            <h2 className="text-2xl font-headline font-semibold">Ingredients</h2>
            <Separator className="my-4" />
            <ul className="space-y-2 text-muted-foreground">
              {recipe.ingredients.split('\n').map((line, i) => (
                <li key={i} className="flex items-start">
                  <span className="mr-2 mt-1 block h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                  <span>{line}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="md:col-span-2">
            <h2 className="text-2xl font-headline font-semibold">Instructions</h2>
            <Separator className="my-4" />
            <div className="prose prose-stone dark:prose-invert max-w-none prose-p:text-muted-foreground prose-li:text-muted-foreground">
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
