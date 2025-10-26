import { NextRequest } from 'next/server';
import { RecipeChatEngine } from '@/lib/recipe-chat/recipe-chat-engine';
import { getOrCreateContext, updateRecipeInDB, saveChatInteraction } from '@/lib/recipe-chat/helpers';
import { getServerSession } from 'next-auth';

const engine = new RecipeChatEngine();

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession();
    const { messages, context, mode } = await req.json();

  // Check if API key is configured
    if (!process.env.OPENAI_API_KEY) {
      console.error('OPENAI_API_KEY is not configured');
    return new Response(
     JSON.stringify({ error: 'OpenAI API key is not configured' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
   );
    }

    // Get or create recipe context
    const recipeContext = await getOrCreateContext(session?.user?.id, context);

    // Process through recipe chat engine
    const stream = await engine.processMessage(
      messages[messages.length - 1].content,
      recipeContext
    );

    // Convert OpenAI stream to Response
    // Create a ReadableStream from the OpenAI stream
    const readableStream = new ReadableStream({
  async start(controller) {
        try {
          for await (const chunk of stream) {
            const text = chunk.choices[0]?.delta?.content || '';
       if (text) {
controller.enqueue(new TextEncoder().encode(text));
            }
       
            // Handle tool calls
    const toolCalls = chunk.choices[0]?.delta?.tool_calls;
            if (toolCalls) {
       for (const toolCall of toolCalls) {
   if (toolCall.function?.name === 'update_recipe' && toolCall.function?.arguments) {
            try {
            const updates = JSON.parse(toolCall.function.arguments);
     await updateRecipeInDB(
    recipeContext.currentRecipe?.id,
       updates.updates
    );
                  } catch (e) {
    console.error('Error updating recipe:', e);
        }
             }
           }
      }
 });


// Save chat history asynchronously
    saveChatInteraction(recipeContext.sessionId, messages, 'completion').catch(console.error);

    // Return streaming response with headers
    return new Response(readableStream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'X-Recipe-Context': JSON.stringify(recipeContext),
        'X-Recipe-Mode': mode || 'recipe_creation'
      }
    });
  } catch (error) {
    console.error('Recipe chat error:', error);
    return new Response(
      JSON.stringify({
        error: 'Failed to process recipe chat',
    details: error instanceof Error ? error.message : 'Unknown error',
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
