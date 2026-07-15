import { RecipeContext, RecipeChatRecipe, UserPreferences } from './types';
import { v4 as uuidv4 } from 'uuid';

/**
 * Get or create a recipe context for the user
 */
export async function getOrCreateContext(
  userId: string | undefined,
  contextData?: Partial<RecipeContext>
): Promise<RecipeContext> {
  // In a real implementation, this would fetch from database
  // For now, create a new context
  return {
    mode: contextData?.mode || 'create',
    currentRecipe: contextData?.currentRecipe,
    history: contextData?.history || [],
    userPreferences: contextData?.userPreferences || getDefaultPreferences(),
    sessionId: contextData?.sessionId || uuidv4(),
  };
}

/**
 * Get default user preferences
 */
export function getDefaultPreferences(): UserPreferences {
  return {
    dietaryRestrictions: [],
    allergies: [],
    cuisinePreferences: [],
 cookingLevel: 'intermediate',
    mealPrepTime: {
      breakfast: 15,
      lunch: 30,
      dinner: 45,
    },
  };
}

/**
 * Save or update recipe in database.
 *
 * NOT IMPLEMENTED. A previous stub returned a fabricated success without ever
 * writing to the DB and without any ownership (userId) check, which would have
 * been an IDOR the moment it persisted. Until it is implemented with an explicit
 * `where: { id, userId }` ownership guard, it throws so no caller can rely on a
 * fake save. The recipe-chat tool that called this has been removed.
 */
export async function updateRecipeInDB(
  _recipeId: string | undefined,
  _updates: Partial<RecipeChatRecipe>
): Promise<RecipeChatRecipe> {
  throw new Error('updateRecipeInDB is not implemented: recipe persistence via chat is disabled.');
}

/**
 * Save chat interaction to database
 */
export async function saveChatInteraction(
  sessionId: string,
  messages: any[],
  completion: string
): Promise<void> {
  // In a real implementation, this would save to database
  console.log('Saving chat interaction:', { sessionId, messageCount: messages.length });
}

/**
 * Get user preferences (mock for now)
 */
export function getUserPreferences(): UserPreferences {
  // In a real implementation, fetch from user profile
  return getDefaultPreferences();
}
