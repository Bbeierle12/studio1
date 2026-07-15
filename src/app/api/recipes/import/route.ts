import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { importRecipeFromUrl } from '@/lib/recipe-importer';
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

    // Rate limit per user: each request is an outbound fetch + paid Gemini call.
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

    const body = await req.json();
    const { url } = body;

    if (!url || typeof url !== 'string') {
      return NextResponse.json({ error: 'Valid URL is required' }, { status: 400 });
    }

    const recipe = await importRecipeFromUrl(url);

    return NextResponse.json({ recipe }, { status: 200 });
  } catch (error: any) {
    console.error('Recipe import API error:', error);
    // Invalid/disallowed URLs are client errors, not server faults. Return a
    // generic message rather than the raw error to avoid leaking internals.
    const isInvalidUrl = error?.message === 'Invalid URL';
    const status = isInvalidUrl ? 400 : 500;
    return NextResponse.json(
      { error: isInvalidUrl ? 'Invalid URL' : 'Failed to import recipe' },
      { status }
    );
  }
}
