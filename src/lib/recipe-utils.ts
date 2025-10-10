import type { RecipeInput, ParsedRecipeData } from './types';

/**
 * Converts array-based parsed recipe data to unified RecipeInput format
 */
export function parseRecipeToInput(
  parsed: ParsedRecipeData,
  userId: string
): RecipeInput {
  return {
    title: parsed.title,
    contributor: parsed.author || 'Imported Recipe',
    ingredients: Array.isArray(parsed.ingredients)
      ? parsed.ingredients.join('\n')
      : parsed.ingredients,
    instructions: Array.isArray(parsed.instructions)
      ? parsed.instructions.join('\n')
      : parsed.instructions,
    summary: parsed.description || '',
    story: '',
    prepTime: parsed.totalTime || parsed.prepTime,
    cookTime: parsed.cookTime,
    totalTime: parsed.totalTime,
    servings: parsed.servings,
    course: normalizeEnumValue(parsed.course, [
      'Appetizer',
      'Main',
      'Dessert',
      'Side',
      'Breakfast',
    ]) as RecipeInput['course'],
    cuisine: normalizeEnumValue(parsed.cuisine, [
      'Italian',
      'American',
      'Mexican',
      'Asian',
      'Other',
    ]) as RecipeInput['cuisine'],
    difficulty: normalizeEnumValue(parsed.difficulty, [
      'Easy',
      'Medium',
      'Hard',
    ]) as RecipeInput['difficulty'],
    tags: parsed.tags || [],
    imageUrl: parsed.imageUrl || '',
    imageHint: parsed.sourceUrl
      ? `Imported from ${parsed.sourceUrl}`
      : 'Imported recipe',
    sourceUrl: parsed.sourceUrl,
    userId,
  };
}

/**
 * Normalizes a string value to match one of the allowed enum values
 */
function normalizeEnumValue<T extends string>(
  value: string | undefined,
  allowedValues: readonly T[]
): T | undefined {
  if (!value) return undefined;

  const normalized = value.trim();
  const lowerValue = normalized.toLowerCase();

  // Try exact match first
  for (const allowed of allowedValues) {
    if (allowed.toLowerCase() === lowerValue) {
      return allowed;
    }
  }

  // Try partial match
  for (const allowed of allowedValues) {
    if (lowerValue.includes(allowed.toLowerCase())) {
      return allowed;
    }
  }

  return undefined;
}

/**
 * Converts string ingredients/instructions to array format
 */
export function recipeInputToArrays(input: RecipeInput): {
  ingredients: string[];
  instructions: string[];
} {
  return {
    ingredients: input.ingredients.split('\n').filter((line) => line.trim()),
    instructions: input.instructions
      .split('\n')
      .filter((line) => line.trim()),
  };
}

/**
 * Validates that RecipeInput has all required fields
 */
export function validateRecipeInput(input: Partial<RecipeInput>): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!input.title || input.title.length < 3) {
    errors.push('Title must be at least 3 characters');
  }

  if (!input.contributor) {
    errors.push('Contributor is required');
  }

  if (!input.ingredients || input.ingredients.length < 10) {
    errors.push('Ingredients list is too short');
  }

  if (!input.instructions || input.instructions.length < 20) {
    errors.push('Instructions are too short');
  }

  if (!input.userId) {
    errors.push('User ID is required');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}
