/**
 * On-brand replacement for the blank-white `placehold.co/...FFFFFF` images that
 * shipped to prod. Uses muted/accent tokens + a Lucide food glyph — themes and
 * dark-modes for free, with no network request.
 *
 * Usage:
 *   {recipe.imageUrl
 *     ? <Image src={recipe.imageUrl} alt={recipe.title} fill className="object-cover" />
 *     : <RecipeImageFallback className="h-full w-full" glyph={glyphForMeal(recipe.mealType)} />}
 */

import * as React from 'react';
import {
  Soup,
  Salad,
  Coffee,
  Cookie,
  ChefHat,
  UtensilsCrossed,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const GLYPHS = {
  soup: Soup,
  salad: Salad,
  coffee: Coffee,
  cookie: Cookie,
  chef: ChefHat,
  utensils: UtensilsCrossed,
} as const;

export type FallbackGlyph = keyof typeof GLYPHS;

export interface RecipeImageFallbackProps
  extends React.HTMLAttributes<HTMLDivElement> {
  glyph?: FallbackGlyph;
}

export function RecipeImageFallback({
  glyph = 'utensils',
  className,
  ...props
}: RecipeImageFallbackProps) {
  const Glyph = GLYPHS[glyph];
  return (
    <div
      className={cn(
        'relative flex items-center justify-center overflow-hidden',
        // warm tokened gradient — accent → muted, no hardcoded colors
        'bg-[radial-gradient(120%_120%_at_30%_20%,hsl(var(--accent))_0%,hsl(var(--muted))_70%)]',
        'text-muted-foreground',
        className
      )}
      role="img"
      aria-label="Recipe image placeholder"
      {...props}
    >
      {/* subtle dotted texture so it never reads as a broken image */}
      <div className="absolute inset-0 opacity-50 [background-image:radial-gradient(hsl(var(--foreground)/0.05)_1px,transparent_1px)] [background-size:14px_14px]" />
      <Glyph
        className="relative h-[30%] w-[30%] opacity-55"
        strokeWidth={1.4}
      />
    </div>
  );
}

/** Map a meal type → the most fitting fallback glyph. */
export function glyphForMeal(
  meal?: 'breakfast' | 'lunch' | 'dinner' | 'snack' | string
): FallbackGlyph {
  switch (meal) {
    case 'breakfast':
      return 'coffee';
    case 'lunch':
      return 'salad';
    case 'dinner':
      return 'soup';
    case 'snack':
      return 'cookie';
    default:
      return 'utensils';
  }
}
