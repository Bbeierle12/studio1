import { streamText, generateObject, tool, type StreamTextResult, type ToolSet } from 'ai';
import { z } from 'zod';
import { geminiModel } from '@/lib/ai-config';
import { RecipeContext, ChatMode } from './types';

const IntentSchema = z.object({
  mode: z.enum([
    'recipe_creation',
    'recipe_modification',
    'recipe_search',
    'cooking_guidance',
    'ingredient_substitution',
    'nutrition_analysis',
    'general',
  ]),
  confidence: z.number().describe('Confidence score 0-1'),
  extractedInfo: z
    .record(z.string(), z.unknown())
    .optional()
    .describe('Any specific information extracted from the message'),
});

const RecipeUpdatesSchema = z.object({
  name: z.string().optional(),
  description: z.string().optional(),
  ingredients: z
    .array(
      z.object({
        name: z.string(),
        amount: z.number().optional(),
        unit: z.string().optional(),
        preparation: z.string().optional(),
      })
    )
    .optional(),
  instructions: z
    .array(
      z.object({
        step: z.number(),
        instruction: z.string(),
        duration: z.number().optional(),
        temperature: z.string().optional(),
      })
    )
    .optional(),
  cookingTime: z.number().optional(),
  prepTime: z.number().optional(),
  servings: z.number().optional(),
  difficulty: z.string().optional(),
  cuisine: z.string().optional(),
  mealType: z.array(z.string()).optional(),
  dietaryInfo: z.array(z.string()).optional(),
});

export type RecipeUpdates = z.infer<typeof RecipeUpdatesSchema>;

/**
 * Emitted as a tool call rather than executed here: the API route intercepts it
 * so the DB write stays at the request boundary, where the user's session is.
 */
const updateRecipeTool = tool({
  description: 'Update the recipe being created',
  inputSchema: z.object({
    updates: RecipeUpdatesSchema,
    nextQuestion: z.string().optional().describe('Next clarifying question to ask the user'),
    isComplete: z.boolean().optional().describe('Whether the recipe is complete'),
  }),
});

export type RecipeChatStream = StreamTextResult<ToolSet, never>;

/** System prompt per intent. Only recipe_creation gets the update_recipe tool. */
function systemPromptFor(mode: ChatMode | string, context: RecipeContext): string {
  switch (mode) {
    case 'recipe_creation':
      return `You are an expert chef and recipe creator.
Guide the user through creating a recipe step by step.
Ask clarifying questions when needed.
Current recipe state: ${JSON.stringify(context.currentRecipe || {})}`;
    case 'recipe_modification':
      return `You are helping modify an existing recipe.
Current recipe: ${JSON.stringify(context.currentRecipe)}
Help the user make changes while maintaining recipe integrity.`;
    case 'recipe_search':
      return `You are helping discover recipes based on user preferences.
User preferences: ${JSON.stringify(context.userPreferences)}`;
    case 'cooking_guidance':
      return 'You are a cooking instructor providing step-by-step guidance.';
    case 'ingredient_substitution':
      return 'You are an expert at suggesting ingredient substitutions.';
    case 'nutrition_analysis':
      return 'You are a nutritionist analyzing recipe nutrition.';
    default:
      return 'You are a friendly cooking assistant.';
  }
}

export class RecipeChatEngine {
  async processMessage(message: string, context: RecipeContext): Promise<RecipeChatStream> {
    const intent = await this.analyzeIntent(message, context);

    return streamText({
      model: geminiModel(),
      system: systemPromptFor(intent.mode, context),
      prompt: message,
      // The recipe-building flow is the only one that mutates a recipe.
      tools: intent.mode === 'recipe_creation' ? { update_recipe: updateRecipeTool } : {},
    });
  }

  private async analyzeIntent(
    message: string,
    context: RecipeContext
  ): Promise<z.infer<typeof IntentSchema>> {
    try {
      const { object } = await generateObject({
        model: geminiModel(),
        schema: IntentSchema,
        system: `Analyze the user's message in the context of recipe creation and cooking.
Current context: ${JSON.stringify(context)}`,
        prompt: message,
      });

      return object;
    } catch (error) {
      console.error('Intent analysis failed, defaulting to general chat:', error);
      return { mode: 'general', confidence: 0.5 };
    }
  }
}
