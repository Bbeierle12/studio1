import { NextRequest } from 'next/server';
import { openai } from '@ai-sdk/openai';
import { streamText, generateObject } from 'ai';
import { z } from 'zod';

// Schema for extracted recipe data
const RecipeExtractionSchema = z.object({
  title: z.string().nullable(),
  ingredients: z.array(z.string()).describe('Individual ingredients'),
  instructions: z.array(z.string()).describe('Numbered cooking steps'),
  servings: z.number().nullable(),
  prepTime: z.number().nullable().describe('Preparation time in minutes'),
  cuisine: z.string().nullable(),
  difficulty: z.enum(['Easy', 'Medium', 'Hard']).nullable(),
  tags: z.array(z.string()),
});

export async function POST(request: NextRequest) {
  try {
    const { messages, recipeData } = await request.json();

    // Check if API key is configured
    if (!process.env.OPENAI_API_KEY) {
      console.error('OPENAI_API_KEY is not configured');
      return new Response(
        JSON.stringify({ error: 'OpenAI API key is not configured' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // System prompt for the chat assistant
    const systemPrompt = `You are a friendly, expert chef assistant helping users create recipes through conversation.

Your role:
- Guide users through recipe creation naturally
- Ask clarifying questions
- Parse ingredients and instructions from natural language
- Be encouraging and helpful
- Keep responses concise (2-3 sentences max)

Current recipe data:
${JSON.stringify(recipeData, null, 2)}

When the user provides information:
- Extract ingredients, instructions, servings, time, cuisine, difficulty
- Respond with what you captured and ask for the next piece
- Use emojis occasionally to be friendly`;

    // Generate the conversational response
    const result = await streamText({
      model: openai('gpt-4o'),
      messages: [
        { role: 'system', content: systemPrompt },
        ...messages,
      ],
    });

    // Get the full text for extraction
    const fullText = await result.text;

    // Extract structured recipe data using generateObject
    const { object: extractedData } = await generateObject({
      model: openai('gpt-4o'),
      schema: RecipeExtractionSchema,
      messages: [
        {
          role: 'system',
          content: 'Extract recipe information from this conversation. Return structured data based on the schema.',
        },
        ...messages,
        { role: 'assistant', content: fullText },
      ],
    });

    // Return both the response and extracted data
    return new Response(
      JSON.stringify({
        response: fullText,
        extractedData,
      }),
      {
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Recipe chat error:', error);
    return new Response(
      JSON.stringify({
        error: 'Failed to process chat message',
        details: error instanceof Error ? error.message : 'Unknown error',
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
