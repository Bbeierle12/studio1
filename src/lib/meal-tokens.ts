/**
 * Single source of truth for meal-type styling.
 *
 * Every calendar surface (foyer-week-calendar, home-week-view,
 * calendar/day-view, day-cell, week-view, month-view, meal-planning-calendar)
 * imports from here instead of hardcoding hex. One import = correct light AND
 * dark automatically (classes resolve to the --meal-* tokens in globals.css).
 */

import { Coffee, Salad, Soup, Cookie, type LucideIcon } from 'lucide-react';

export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack';

export interface MealToken {
  /** Lucide icon for this meal type (icon system; emoji is tag-accent only). */
  icon: LucideIcon;
  /** Sanctioned emoji accent — ONLY for meal tags, never chrome. */
  emoji: string;
  /** Soft block: tinted bg + accent left border + readable foreground text. */
  block: string;
  /** Solid chip: filled accent. */
  solid: string;
  /** Just the accent text color (for labels / icons). */
  text: string;
  /** Just the accent dot bg (legends). */
  dot: string;
  label: string;
}

export const MEAL_TOKENS: Record<MealType, MealToken> = {
  breakfast: {
    icon: Coffee,
    emoji: '🍳',
    block:
      'bg-meal-breakfast-muted border-l-4 border-meal-breakfast text-foreground',
    solid: 'bg-meal-breakfast text-meal-breakfast-foreground',
    text: 'text-meal-breakfast',
    dot: 'bg-meal-breakfast',
    label: 'Breakfast',
  },
  lunch: {
    icon: Salad,
    emoji: '🥗',
    block: 'bg-meal-lunch-muted border-l-4 border-meal-lunch text-foreground',
    solid: 'bg-meal-lunch text-meal-lunch-foreground',
    text: 'text-meal-lunch',
    dot: 'bg-meal-lunch',
    label: 'Lunch',
  },
  dinner: {
    icon: Soup,
    emoji: '🍲',
    block: 'bg-meal-dinner-muted border-l-4 border-meal-dinner text-foreground',
    solid: 'bg-meal-dinner text-meal-dinner-foreground',
    text: 'text-meal-dinner',
    dot: 'bg-meal-dinner',
    label: 'Dinner',
  },
  snack: {
    icon: Cookie,
    emoji: '🍪',
    block: 'bg-meal-snack-muted border-l-4 border-meal-snack text-foreground',
    solid: 'bg-meal-snack text-meal-snack-foreground',
    text: 'text-meal-snack',
    dot: 'bg-meal-snack',
    label: 'Snack',
  },
};

export const MEAL_ORDER: MealType[] = ['breakfast', 'lunch', 'dinner', 'snack'];

/** Normalize an arbitrary meal-type string (e.g. Prisma's 'DINNER') to a MealType. */
export function toMealType(value?: string | null): MealType {
  const v = (value ?? '').toLowerCase();
  if (v === 'breakfast' || v === 'lunch' || v === 'dinner' || v === 'snack') {
    return v;
  }
  return 'dinner';
}
