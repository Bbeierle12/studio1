import type { ParsedRecipeData } from '@/lib/types'

/**
 * Helpers for the /api/recipes/import-parsed route (clipper bridge).
 * Pure functions, unit-tested in tests/parsed-import.test.ts.
 */

/**
 * Collapse internal newlines in list items. RecipeInput storage joins arrays
 * with '\n' and later re-splits; an item containing its own newline would be
 * silently split into two corrupted entries on the round-trip.
 */
export function sanitizeListItems(items: string[]): string[] {
  return items
    .map((item) => item.replace(/\s*\r?\n\s*/g, ' ').trim())
    .filter(Boolean)
}

/** Sanitized copy of a parsed recipe's array fields (input is not mutated). */
export function sanitizeParsedRecipe<
  T extends { ingredients: string[]; instructions: string[] },
>(parsed: T): T {
  return {
    ...parsed,
    ingredients: sanitizeListItems(parsed.ingredients),
    instructions: sanitizeListItems(parsed.instructions),
  }
}

/**
 * The unified conversion (parseRecipeToInput) drops cuisine/course/difficulty
 * values it cannot match to an allowed enum — silently. Surface every dropped
 * value as a warning so imports never lose data without saying so.
 */
export function droppedEnumWarnings(
  parsed: Pick<ParsedRecipeData, 'cuisine' | 'course' | 'difficulty'>,
  input: { cuisine?: string; course?: string; difficulty?: string }
): string[] {
  const warnings: string[] = []
  for (const field of ['cuisine', 'course', 'difficulty'] as const) {
    if (parsed[field] && !input[field]) {
      warnings.push(
        `${field} "${parsed[field]}" did not match an allowed value and was not saved`
      )
    }
  }
  return warnings
}
