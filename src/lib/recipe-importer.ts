import { google } from '@ai-sdk/google';
import { generateObject } from 'ai';
import { z } from 'zod';
import { GEMINI_MODEL_ID } from '@/lib/ai-config';
import { fetchHtmlSafely } from '@/lib/safe-fetch';

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

/** Cap on HTML handed to the model, to bound prompt cost. */
const MAX_CONTENT_CHARS = 15000;

/**
 * Reduces a raw HTML page to the text most likely to contain the recipe.
 * A blind substring of raw HTML is mostly <head> boilerplate — scripts,
 * inlined CSS, and meta tags — which is how a real recipe page can yield an
 * empty extraction. Prefer the JSON-LD Recipe block sites publish for search
 * engines; fall back to tag-stripped body text.
 */
export function extractRecipeContent(html: string): string {
  const jsonLdBlocks = html.matchAll(
    /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi
  );
  for (const block of jsonLdBlocks) {
    const raw = block[1]?.trim();
    // Matches both "@type":"Recipe" and "@type":["Recipe","NewsArticle"].
    if (raw && /"@type"\s*:\s*(\[[^\]]*?)?["']Recipe["']/i.test(raw)) {
      return raw.substring(0, MAX_CONTENT_CHARS);
    }
  }

  const text = html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  return text.substring(0, MAX_CONTENT_CHARS);
}

export async function importRecipeFromUrl(url: string): Promise<ImportedRecipe> {
  // Fetch the page with SSRF protection (scheme allowlist, private-range
  // blocking, redirect re-validation) — the URL is user-supplied.
  let html: string;
  try {
    ({ html } = await fetchHtmlSafely(url));
  } catch (e) {
    if (e instanceof Error && (e.message === 'Invalid URL' || e.message.includes('http(s)'))) {
      throw new Error('Invalid URL');
    }
    if (e instanceof Error && (e.message.includes('disallowed') || e.message.includes('resolve'))) {
      throw new Error('Invalid URL');
    }
    // Preserve the actionable "site blocks bots" message for the user.
    if (e instanceof Error && e.message.includes('blocks automated access')) {
      throw e;
    }
    throw new Error('Failed to fetch the URL');
  }

  const contentToAnalyze = extractRecipeContent(html);

  // Parse with Google Gemini
  try {
    const { object } = await generateObject({
      model: google(GEMINI_MODEL_ID),
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
