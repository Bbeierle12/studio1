import { google } from '@ai-sdk/google';
import { generateObject } from 'ai';
import { z } from 'zod';

const ImportedRecipeSchema = z.object({
  title: z.string().describe('The title of the recipe.'),
  description: z.string().optional().describe('A short description of the recipe.'),
  ingredients: z.array(z.object({
    item: z.string().describe('The name of the ingredient'),
    amount: z.string().optional().describe('The amount/quantity of the ingredient'),
    unit: z.string().optional().describe('The unit of measurement'),
  })).describe('The list of ingredients'),
  instructions: z.array(z.string()).describe('The step-by-step cooking instructions'),
  prepTime: z.number().optional().describe('Preparation time in minutes'),
  cookTime: z.number().optional().describe('Cooking time in minutes'),
  servings: z.number().optional().describe('Number of servings'),
});

export type ImportedRecipe = z.infer<typeof ImportedRecipeSchema>;

export async function importRecipeFromUrl(url: string): Promise<ImportedRecipe> {
  // Validate URL format
  let parsedUrl: URL;
  try {
    parsedUrl = new URL(url);
  } catch (e) {
    throw new Error('Invalid URL');
  }

  // Fetch the page content
  let response: Response;
  try {
    response = await fetch(parsedUrl.toString());
  } catch (e) {
    throw new Error('Failed to fetch the URL');
  }

  if (!response.ok) {
    throw new Error('Failed to fetch the URL');
  }

  const htmlText = await response.text();
  
  // Basic stripping of excessive HTML to save tokens (could use a robust library like cheerio, 
  // but for a lightweight pass, we can just send the first chunk or text content)
  // To avoid huge prompts, we'll limit the text length.
  const contentToAnalyze = htmlText.substring(0, 15000); 

  // Parse with Google Gemini
  try {
    const { object } = await generateObject({
      model: google('gemini-1.5-flash'),
      schema: ImportedRecipeSchema,
      messages: [
        {
          role: 'user',
          content: `You are an expert recipe parser. Extract the recipe details from the following webpage content. 
If there are no recipe details, do your best to summarize or return empty arrays.

Content:
${contentToAnalyze}`
        }
      ]
    });
    
    return object;
  } catch (error) {
    console.error('Error parsing recipe from AI:', error);
    throw new Error('Failed to parse the recipe using AI');
  }
}
