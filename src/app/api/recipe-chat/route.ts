import { NextRequest } from 'next/server';
import { RecipeChatEngine } from '@/lib/recipe-chat/recipe-chat-engine';
import { getOrCreateContext, saveChatInteraction } from '@/lib/recipe-chat/helpers';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import {
  checkRateLimit,
  getRateLimitIdentifier,
  formatRateLimitError,
  RATE_LIMITS,
} from '@/lib/rate-limit';
import { isGeminiConfigured, GEMINI_NOT_CONFIGURED_ERROR } from '@/lib/ai-config';

const engine = new RecipeChatEngine();

export async function POST(req: NextRequest) {
  try {
    // Require an authenticated session. Without passing authOptions the session
    // is never resolved, which left this route effectively unauthenticated and
    // able to stream (billable) OpenAI completions for anonymous callers.
    const session = await getServerSession(authOptions);
    const userId = (session?.user as { id?: string } | undefined)?.id;
    if (!userId) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Rate limit expensive AI streaming per user to contain cost-based abuse.
    const identifier = getRateLimitIdentifier(
      userId,
      req.headers.get('x-forwarded-for') || undefined
    );
    const rateLimit = checkRateLimit(identifier, RATE_LIMITS.AI_ASSISTANT);
    if (!rateLimit.allowed) {
      return new Response(
        JSON.stringify({
          error: formatRateLimitError(rateLimit.resetIn, RATE_LIMITS.AI_ASSISTANT.message),
        }),
        { status: 429, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const { messages, context, mode } = await req.json();

    if (!isGeminiConfigured()) {
      console.error(GEMINI_NOT_CONFIGURED_ERROR);
      return new Response(
        JSON.stringify({ error: GEMINI_NOT_CONFIGURED_ERROR }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Get or create recipe context
    const recipeContext = await getOrCreateContext(userId, context);

    // Process through recipe chat engine
    const result = await engine.processMessage(
      messages[messages.length - 1].content,
      recipeContext
    );

    // Stream Gemini text deltas to the client. The chat advertises no tools
    // (recipe persistence via chat is not implemented — see updateRecipeInDB),
    // so the engine streams conversational prose only and the UX degrades to a
    // read-only assistant rather than claiming a fake save.
    const readableStream = new ReadableStream({
      async start(controller) {
        try {
          for await (const part of result.fullStream) {
            if (part.type === 'text-delta') {
              controller.enqueue(new TextEncoder().encode(part.text));
            } else if (part.type === 'error') {
              console.error('Recipe chat stream error:', part.error);
            }
          }
          controller.close();
        } catch (error) {
          controller.error(error);
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
        'X-Recipe-Mode': mode || 'recipe_creation'
      }
    });
  } catch (error) {
    console.error('Recipe chat error:', error);
    return new Response(
      JSON.stringify({
        error: 'Failed to process recipe chat',
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
