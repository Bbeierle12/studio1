import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { parseRecipeFromText } from '@/lib/ai-import';
import {
  checkRateLimit,
  getRateLimitIdentifier,
  formatRateLimitError,
  RATE_LIMITS,
} from '@/lib/rate-limit';

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Rate limit per user: each request is a paid Gemini call.
    const identifier = getRateLimitIdentifier(
      session.user.id,
      req.headers.get('x-forwarded-for') || undefined
    );
    const rateLimit = checkRateLimit(identifier, RATE_LIMITS.AI_RECIPE_GENERATION);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: formatRateLimitError(rateLimit.resetIn, RATE_LIMITS.AI_RECIPE_GENERATION.message) },
        { status: 429 }
      );
    }

    if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
      return NextResponse.json(
        { error: 'Gemini API key is not configured.' },
        { status: 500 }
      );
    }

    const { text } = await req.json();

    if (!text || typeof text !== 'string' || text.trim().length === 0) {
      return NextResponse.json(
        { error: 'No text or URL provided.' },
        { status: 400 }
      );
    }

    const recipe = await parseRecipeFromText(text);

    return NextResponse.json({
      recipe,
      saved: false,
      message: 'Recipe parsed successfully with AI',
    });
  } catch (error) {
    console.error('Error parsing recipe with Gemini:', error);
    return NextResponse.json(
      { error: 'Failed to process recipe with AI.' },
      { status: 500 }
    );
  }
}
