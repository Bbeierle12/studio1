import { getRecipeById } from '@/lib/data';
import { notFound } from 'next/navigation';
import Image from 'next/image';
import {
  ChefHat,
  Edit,
  Clock,
  Users,
  UtensilsCrossed,
  Flame,
  ArrowLeft,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { DeleteRecipeButton } from '@/components/delete-recipe-button';
import { PrintRecipeButton } from '@/components/print-recipe-button';
import { IngredientList } from '@/components/ingredient-list';
import { SaveRecipeButton } from '@/components/save-recipe-button';
import { RecipeImageFallback } from '@/components/recipe-image-fallback';

type RecipePageProps = {
  params: Promise<{ id: string }>;
};

export default async function RecipePage({ params }: RecipePageProps) {
  const { id } = await params;
  const recipe = await getRecipeById(id);

  if (!recipe) {
    notFound();
  }

  const meta = [
    recipe.prepTime ? { Icon: Clock, label: 'Total', value: `${recipe.prepTime} min` } : null,
    recipe.difficulty ? { Icon: Flame, label: 'Difficulty', value: recipe.difficulty } : null,
    recipe.servings ? { Icon: Users, label: 'Serves', value: String(recipe.servings) } : null,
    recipe.course ? { Icon: UtensilsCrossed, label: 'Course', value: recipe.course } : null,
  ].filter(Boolean) as { Icon: typeof Clock; label: string; value: string }[];

  const steps = recipe.instructions
    .split('\n')
    .map((s) => s.trim())
    .filter(Boolean);

  return (
    <article className="pb-16">
      {/* Hero */}
      <div className="relative">
        <div className="h-60 w-full overflow-hidden">
          {recipe.imageUrl ? (
            <Image
              src={recipe.imageUrl}
              alt={recipe.title}
              width={1600}
              height={480}
              priority
              data-ai-hint={recipe.imageHint}
              className="h-60 w-full object-cover"
            />
          ) : (
            <RecipeImageFallback className="h-60 w-full" glyph="chef" />
          )}
        </div>
        <div className="no-print absolute left-5 top-4">
          <Button
            asChild
            variant="outline"
            size="sm"
            className="bg-card/90 backdrop-blur-sm"
          >
            <Link href="/recipes">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Link>
          </Button>
        </div>
        <div className="no-print absolute right-5 top-4">
          <Button
            asChild
            size="sm"
            className="bg-card/95 text-primary backdrop-blur-sm hover:bg-card"
          >
            <Link href="/cook">
              <ChefHat className="mr-2 h-4 w-4" />
              Cook mode
            </Link>
          </Button>
        </div>
      </div>

      {/* Article */}
      <div className="mx-auto max-w-[780px] px-6 pt-7 md:px-8">
        <div className="mb-3 flex flex-wrap items-center gap-2">
          {recipe.tags.map((tag) => (
            <Badge key={tag} variant="secondary" className="capitalize">
              {tag}
            </Badge>
          ))}
        </div>
        <h1 className="mb-2 font-headline text-3xl font-bold leading-tight text-foreground md:text-[38px]">
          {recipe.title}
        </h1>

        <p className="mb-1 text-sm text-muted-foreground">by {recipe.contributor}</p>
        <p className="mb-6 text-base leading-relaxed text-muted-foreground">
          {recipe.summary}
        </p>

        {/* Actions */}
        <div className="no-print mb-7 flex flex-wrap gap-2">
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

        {/* Meta strip */}
        {meta.length > 0 && (
          <div className="mb-8 flex overflow-hidden rounded-2xl border border-border">
            {meta.map((m, i) => (
              <div
                key={m.label}
                className={`flex-1 px-4 py-3.5 text-center ${
                  i < meta.length - 1 ? 'border-r border-border' : ''
                }`}
              >
                <m.Icon className="mx-auto mb-1.5 h-[18px] w-[18px] text-primary" />
                <div className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                  {m.label}
                </div>
                <div className="mt-0.5 text-sm font-semibold text-foreground">
                  {m.value}
                </div>
              </div>
            ))}
          </div>
        )}

        {recipe.story && (
          <div className="mb-8 rounded-lg border border-border bg-muted/40 p-5">
            <h2 className="mb-2 font-headline text-lg font-bold text-foreground">
              Family Story
            </h2>
            <p className="text-sm leading-relaxed text-muted-foreground">
              {recipe.story}
            </p>
          </div>
        )}

        {/* Ingredients + Instructions */}
        <div className="grid gap-8 md:grid-cols-[1fr_1.4fr] print:grid-cols-1">
          <div>
            <IngredientList ingredients={recipe.ingredients} />
          </div>
          <div>
            <h2 className="mb-4 font-headline text-2xl font-semibold text-foreground">
              Instructions
            </h2>
            <div className="flex flex-col gap-4">
              {steps.map((step, i) => (
                <div key={i} className="flex gap-3.5">
                  <div className="grid h-[30px] w-[30px] flex-none place-items-center rounded-full bg-primary font-headline text-sm font-bold text-primary-foreground">
                    {i + 1}
                  </div>
                  <p className="pt-1 text-sm leading-relaxed text-muted-foreground">
                    {step}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </article>
  );
}
