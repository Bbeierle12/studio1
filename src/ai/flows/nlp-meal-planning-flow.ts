import { openai } from '@ai-sdk/openai';
import { generateObject } from 'ai';
import { z } from 'zod';
import { createUserOpenAI } from '@/lib/openai-utils';

/**
 * Natural Language Meal Planning Flow
 * Parses natural language commands to create meal plans
 * Examples: "Add pasta for Tuesday dinner", "Plan a vegetarian week"
 */

const NLPMealPlanInputSchema = z.object({
  command: z.string().describe('Natural language command from user'),
  currentDate: z.string().describe('Current date for context (ISO format)'),
  existingMealPlan: z.array(z.object({
    date: z.string(),
    mealType: z.string(),
    recipeName: z.string().optional(),
  })).optional(),
});

export type NLPMealPlanInput = z.infer<typeof NLPMealPlanInputSchema>;

const NLPMealPlanOutputSchema = z.object({
  intent: z.enum([
    'add_meal',
    'remove_meal',
    'replace_meal',
    'plan_week',
    'plan_day',
    'query',
    'unknown'
  ]),
  actions: z.array(z.object({
    action: z.enum(['add', 'remove', 'replace']),
    date: z.string(),
    mealType: z.enum(['breakfast', 'lunch', 'dinner', 'snack']),
    recipeName: z.string().optional(),
    recipeQuery: z.string().optional(), // Search query if recipe not specified
    dietaryConstraints: z.array(z.string()).optional(),
  })),
  confidence: z.number().min(0).max(100),
  clarificationNeeded: z.boolean(),
  clarificationQuestion: z.string().optional(),
  parsedEntities: z.object({
    dates: z.array(z.string()),
    mealTypes: z.array(z.string()),
    recipes: z.array(z.string()),
    cuisines: z.array(z.string()),
    dietaryConstraints: z.array(z.string()),
  }),
});

export type NLPMealPlanOutput = z.infer<typeof NLPMealPlanOutputSchema>;

export async function parseNaturalLanguageCommand(
  input: NLPMealPlanInput,
  userId?: string
): Promise<NLPMealPlanOutput> {
  try {
    // Use user-specific OpenAI key if available
    const model = userId 
      ? (await createUserOpenAI(userId)) as any
      : openai('gpt-4-turbo');

    const { object } = await generateObject({
      model,
      schema: NLPMealPlanOutputSchema,
      messages: [
        {
          role: 'system',
          content: `You are a natural language parser for a meal planning application.
          
Parse user commands and extract:
1. Intent (what they want to do)
2. Specific actions (add/remove/replace meals)
3. Dates (resolve relative dates like "tomorrow", "next Tuesday", "this week")
4. Meal types (breakfast, lunch, dinner, snack)
5. Recipe names or search queries
6. Dietary constraints (vegetarian, vegan, gluten-free, etc.)

Current date context: ${input.currentDate}

Examples:
- "Add pasta for Tuesday dinner" → Add action, date: next Tuesday, mealType: dinner, recipeQuery: "pasta"
- "Plan a vegetarian week" → Plan week action, dietaryConstraints: ["vegetarian"]
- "Remove lunch on Friday" → Remove action, date: next Friday, mealType: lunch
- "What's for dinner tomorrow?" → Query intent

Be smart about date parsing:
- "tomorrow" = day after current date
- "next Tuesday" = upcoming Tuesday
- "this week" = current week (Monday-Sunday)
- Specific dates like "October 10"

If the command is ambiguous, set clarificationNeeded=true and provide a question.`,
        },
        {
          role: 'user',
          content: input.command,
        },
      ],
    });

    return object;
  } catch (error) {
    console.error('Error parsing natural language command:', error);
    
    // Fallback: return unknown intent
    return {
      intent: 'unknown',
      actions: [],
      confidence: 0,
      clarificationNeeded: true,
      clarificationQuestion: "I couldn't understand that command. Could you rephrase it?",
      parsedEntities: {
        dates: [],
        mealTypes: [],
        recipes: [],
        cuisines: [],
        dietaryConstraints: [],
      },
    };
  }
}

/**
 * Generate meal plan for a period (day, week, etc.)
 */
const GeneratePlanInputSchema = z.object({
  startDate: z.string(),
  endDate: z.string(),
  mealTypes: z.array(z.enum(['breakfast', 'lunch', 'dinner', 'snack'])),
  dietaryConstraints: z.array(z.string()).optional(),
  calorieTarget: z.number().optional(),
  cuisinePreferences: z.array(z.string()).optional(),
  variety: z.enum(['low', 'medium', 'high']).default('medium'),
});

export type GeneratePlanInput = z.infer<typeof GeneratePlanInputSchema>;

const GeneratePlanOutputSchema = z.object({
  meals: z.array(z.object({
    date: z.string(),
    mealType: z.string(),
    recipeName: z.string(),
    cuisine: z.string(),
    estimatedCalories: z.number().optional(),
    tags: z.array(z.string()),
    reason: z.string(),
  })),
  planSummary: z.string(),
  nutritionSummary: z.object({
    totalCalories: z.number(),
    avgCaloriesPerDay: z.number(),
    cuisineVariety: z.number(), // 0-100 score
  }),
});

export type GeneratePlanOutput = z.infer<typeof GeneratePlanOutputSchema>;

export async function generateMealPlan(
  input: GeneratePlanInput,
  userId?: string
): Promise<GeneratePlanOutput> {
  try {
    const model = userId 
      ? (await createUserOpenAI(userId)) as any
      : openai('gpt-4-turbo');

    const prompt = buildPlanPrompt(input);

    const { object } = await generateObject({
      model,
      schema: GeneratePlanOutputSchema,
      messages: [
        {
          role: 'system',
          content: `You are a professional meal planning assistant. Create balanced, varied meal plans that:
          1. Meet dietary constraints and preferences
          2. Provide good nutrition balance
          3. Include variety across cuisines and ingredients
          4. Are practical for home cooking
          5. Consider seasonal ingredients
          
          For each meal, provide the recipe name, cuisine type, estimated calories, relevant tags, and a brief reason for the choice.`,
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
    });

    return object;
  } catch (error) {
    console.error('Error generating meal plan:', error);
    throw new Error('Failed to generate meal plan');
  }
}

function buildPlanPrompt(input: GeneratePlanInput): string {
  const parts: string[] = [];

  parts.push(`Create a meal plan from ${input.startDate} to ${input.endDate}`);
  parts.push(`\nMeal types to plan: ${input.mealTypes.join(', ')}`);

  if (input.dietaryConstraints && input.dietaryConstraints.length > 0) {
    parts.push(`\nDietary constraints: ${input.dietaryConstraints.join(', ')}`);
  }

  if (input.calorieTarget) {
    parts.push(`\nTarget calories per day: ~${input.calorieTarget} kcal`);
  }

  if (input.cuisinePreferences && input.cuisinePreferences.length > 0) {
    parts.push(`\nPreferred cuisines: ${input.cuisinePreferences.join(', ')}`);
  }

  parts.push(`\nVariety level: ${input.variety} (avoid repetition)`);

  return parts.join('\n');
}

/**
 * Helper: Parse relative dates
 */
export function parseRelativeDate(dateString: string, currentDate: Date): Date | null {
  const lower = dateString.toLowerCase();
  const result = new Date(currentDate);
  result.setHours(0, 0, 0, 0);

  if (lower === 'today') {
    return result;
  }
  
  if (lower === 'tomorrow') {
    result.setDate(result.getDate() + 1);
    return result;
  }

  if (lower === 'yesterday') {
    result.setDate(result.getDate() - 1);
    return result;
  }

  // "next monday", "next tuesday", etc.
  const nextDayMatch = lower.match(/^next\s+(monday|tuesday|wednesday|thursday|friday|saturday|sunday)$/);
  if (nextDayMatch) {
    const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const targetDay = dayNames.indexOf(nextDayMatch[1]);
    const currentDay = result.getDay();
    let daysToAdd = targetDay - currentDay;
    if (daysToAdd <= 0) daysToAdd += 7; // Next occurrence
    result.setDate(result.getDate() + daysToAdd);
    return result;
  }

  // Try parsing as ISO date
  try {
    const parsed = new Date(dateString);
    if (!isNaN(parsed.getTime())) {
      return parsed;
    }
  } catch {
    // Not a valid date
  }

  return null;
}
