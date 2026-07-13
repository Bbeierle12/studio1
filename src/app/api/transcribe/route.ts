import { NextRequest, NextResponse } from 'next/server';
import { generateText } from 'ai';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/data';
import { withRetry } from '@/lib/ai-utils';
import { geminiModel } from '@/lib/ai-config';
import {
  checkRateLimit,
  getRateLimitIdentifier,
  formatRateLimitError,
  RATE_LIMITS,
} from '@/lib/rate-limit';

// Only accept image types the vision model can use. file.type is
// attacker-controlled, so this is a coarse gate, not a guarantee.
const ALLOWED_IMAGE_TYPES = new Set([
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/gif',
  'image/webp',
]);
const MAX_IMAGE_BYTES = 10 * 1024 * 1024; // 10MB

export async function POST(request: NextRequest) {
  try {
    // Authenticate user
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized - Please sign in' },
        { status: 401 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Each request makes two GPT-4-Turbo vision calls, so throttle per user to
    // contain cost-based abuse (this route previously had no rate limiting).
    const identifier = getRateLimitIdentifier(
      user.id,
      request.headers.get('x-forwarded-for') || undefined
    );
    const rateLimit = checkRateLimit(identifier, RATE_LIMITS.AI_RECIPE_GENERATION);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: formatRateLimitError(rateLimit.resetIn, RATE_LIMITS.AI_RECIPE_GENERATION.message) },
        { status: 429 }
      );
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const isHandwritten = formData.get('isHandwritten') === 'true';

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Validate type and size before embedding the image into (billable) model
    // calls. Rejects non-images and oversized uploads.
    if (!ALLOWED_IMAGE_TYPES.has(file.type)) {
      return NextResponse.json(
        { error: 'Invalid file type. Only JPEG, PNG, GIF, or WebP images are allowed.' },
        { status: 400 }
      );
    }
    if (file.size > MAX_IMAGE_BYTES) {
      return NextResponse.json(
        { error: 'File too large. Maximum size is 10MB.' },
        { status: 400 }
      );
    }

    // Convert file to base64
    const bytes = await file.arrayBuffer();
    const base64 = Buffer.from(bytes).toString('base64');
    const mimeType = file.type;

    // Use Gemini vision for OCR and recipe understanding
    const prompt = isHandwritten 
      ? `You are an expert at reading handwritten recipes. Please carefully examine this image and extract all the recipe information you can see. Pay special attention to:

1. Recipe title/name
2. Ingredients list with measurements
3. Cooking instructions/steps
4. Any additional notes (cooking time, temperature, serving size, etc.)

For handwritten text, be extra careful about interpreting unclear handwriting. If you're uncertain about a word, indicate it with [unclear] but make your best guess. Format the output as a structured recipe with clear sections.

Please provide a confidence score (1-10) for how clearly you could read the handwritten text.`
      : `Please extract the recipe information from this image. Look for:

1. Recipe title/name
2. Ingredients list with measurements
3. Cooking instructions/steps  
4. Any additional information (cooking time, temperature, serving size, etc.)

Format the output as a structured recipe with clear sections.`;


    const result = await withRetry(() => generateText({
      model: geminiModel(),
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: prompt,
            },
            {
              type: 'image',
              image: `data:${mimeType};base64,${base64}`,
            },
          ],
        },
      ],
    }));

    // Parse the response to extract structured data
    const extractedText = result.text;
    
    // Use another AI call to structure the data
    const structureResult = await withRetry(() => generateText({
      model: geminiModel(),
      prompt: `Please convert the following recipe text into a structured JSON format:

${extractedText}

Return a JSON object with the following structure:
{
  "title": "Recipe Name",
  "ingredients": ["ingredient 1", "ingredient 2", ...],
  "instructions": ["step 1", "step 2", ...],
  "additionalInfo": {
    "servingSize": "X servings",
    "cookTime": "X minutes",
    "prepTime": "X minutes",
    "temperature": "X°F",
    "notes": "any additional notes"
  },
  "confidence": X (1-10 scale for handwritten recipes),
  "isHandwritten": boolean
}

Only include fields that have actual data. If information is missing, omit those fields.`,
    }));

    let structuredRecipe;
    try {
      structuredRecipe = JSON.parse(structureResult.text);
    } catch (e) {
      // Fallback if JSON parsing fails
      structuredRecipe = {
        title: "Extracted Recipe",
        rawText: extractedText,
        confidence: isHandwritten ? 5 : 8,
        isHandwritten: isHandwritten
      };
    }

    return NextResponse.json({
      success: true,
      rawText: extractedText,
      structuredData: structuredRecipe,
      isHandwritten: isHandwritten
    });

  } catch (error) {
    console.error('Transcription error:', error);
    return NextResponse.json(
      { error: 'Failed to transcribe image' }, 
      { status: 500 }
    );
  }
}