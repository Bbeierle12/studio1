import { NextRequest, NextResponse } from 'next/server';
import { generateText, generateObject } from 'ai';
import { z } from 'zod';
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

// Bound generated tokens on each (paid) vision/structuring call.
const MAX_OUTPUT_TOKENS = 2048;

// Shape the second AI call must return, so the response is schema-guaranteed
// rather than a JSON.parse of free-form model text.
const TranscribedRecipeSchema = z.object({
  title: z.string().describe('Recipe name'),
  ingredients: z.array(z.string()).describe('Ingredient lines with measurements'),
  instructions: z.array(z.string()).describe('Step-by-step instructions'),
  additionalInfo: z
    .object({
      servingSize: z.string().optional(),
      cookTime: z.string().optional(),
      prepTime: z.string().optional(),
      temperature: z.string().optional(),
      notes: z.string().optional(),
    })
    .optional(),
  confidence: z.number().optional().describe('1-10 confidence, for handwritten recipes'),
  isHandwritten: z.boolean().optional(),
});

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
      maxOutputTokens: MAX_OUTPUT_TOKENS,
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
    
    // Use another AI call to structure the data. generateObject enforces the
    // schema, so the response shape is guaranteed rather than a JSON.parse of
    // free-form text. If the model still fails to produce a valid object, fall
    // back to the raw text so the request degrades gracefully instead of 500ing.
    let structuredRecipe;
    try {
      const structureResult = await withRetry(() => generateObject({
        model: geminiModel(),
        schema: TranscribedRecipeSchema,
        maxOutputTokens: MAX_OUTPUT_TOKENS,
        prompt: `Convert the following recipe text into structured data. Only include fields that have actual data; omit anything missing.

${extractedText}`,
      }));
      structuredRecipe = { ...structureResult.object, isHandwritten };
    } catch (e) {
      // Fallback if the model output can't be coerced to the schema.
      console.error('Failed to structure transcribed recipe:', e);
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