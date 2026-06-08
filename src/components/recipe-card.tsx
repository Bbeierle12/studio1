import Link from 'next/link';
import Image from 'next/image';
import type { Recipe } from '@/lib/types';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { RecipeImageFallback } from '@/components/recipe-image-fallback';
import { Clock, Flame, Heart } from 'lucide-react';

type RecipeCardProps = {
  recipe: Recipe;
};

// Canonical recipe card (also used by the browser, my-recipes, saved):
// image on top with a heart + tag overlay, font-headline title, meta row.
export function RecipeCard({ recipe }: RecipeCardProps) {
  return (
    <Link href={`/recipes/${recipe.id}`} className="group block h-full">
      <Card className="flex h-full flex-col overflow-hidden p-0 shadow-md3-1 transition-all duration-200 group-hover:shadow-md3-3">
        <div className="relative">
          <div className="h-32 overflow-hidden">
            {recipe.imageUrl ? (
              <Image
                src={recipe.imageUrl}
                alt={recipe.title}
                width={600}
                height={264}
                data-ai-hint={recipe.imageHint}
                className="h-32 w-full object-cover transition-transform duration-300 group-hover:scale-105"
              />
            ) : (
              <RecipeImageFallback className="h-32 w-full" />
            )}
          </div>
          <span className="absolute right-2.5 top-2.5 grid h-8 w-8 place-items-center rounded-full bg-card/90 text-muted-foreground backdrop-blur-sm">
            <Heart className="h-4 w-4" />
          </span>
          {recipe.tags?.[0] && (
            <Badge className="absolute bottom-2.5 left-2.5 border-transparent bg-card/90 capitalize text-foreground backdrop-blur-sm">
              {recipe.tags[0]}
            </Badge>
          )}
        </div>

        <div className="flex flex-1 flex-col gap-2 p-3.5">
          <h3 className="line-clamp-2 font-headline text-[17px] font-bold leading-tight text-foreground">
            {recipe.title}
          </h3>
          <div className="mt-auto flex items-center gap-3 text-xs text-muted-foreground">
            {recipe.prepTime ? (
              <span className="inline-flex items-center gap-1">
                <Clock className="h-3.5 w-3.5" />
                {recipe.prepTime} min
              </span>
            ) : null}
            {recipe.difficulty ? (
              <span className="inline-flex items-center gap-1">
                <Flame className="h-3.5 w-3.5" />
                {recipe.difficulty}
              </span>
            ) : null}
            {recipe.course ? (
              <span className="ml-auto font-medium text-meal-breakfast">
                {recipe.course}
              </span>
            ) : null}
          </div>
        </div>
      </Card>
    </Link>
  );
}
