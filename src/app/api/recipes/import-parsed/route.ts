import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { timingSafeEqual } from 'crypto'
import { authOptions } from '@/lib/auth'
import { ParsedRecipeSchema } from '@/lib/recipe-parser'
import { prisma } from '@/lib/prisma'
import { parseRecipeToInput, validateRecipeInput } from '@/lib/recipe-utils'
import { droppedEnumWarnings, sanitizeParsedRecipe } from '@/lib/parsed-import'
import { generateUniqueSlug } from '@/lib/data'
import {
  checkRateLimit,
  getRateLimitIdentifier,
  formatRateLimitError,
  RATE_LIMITS,
} from '@/lib/rate-limit'

/**
 * POST /api/recipes/import-parsed — the clipper bridge.
 *
 * Accepts an already-parsed recipe (ParsedRecipeSchema shape) and saves it.
 * No outbound fetch, no AI call: the heavy lifting (video download, whisper,
 * extraction) happened on the client machine. Auth is either the normal
 * session, or — for headless CLI pushes — a bearer token configured via
 * CLIPPER_IMPORT_TOKEN + CLIPPER_IMPORT_USER_ID (both required; the token
 * path is disabled unless both are set).
 */

function tokenMatches(header: string | null, expected: string): boolean {
  if (!header?.startsWith('Bearer ')) return false
  const presented = Buffer.from(header.slice('Bearer '.length))
  const secret = Buffer.from(expected)
  return presented.length === secret.length && timingSafeEqual(presented, secret)
}

/** Session user id, or the token-mapped user for headless pushes, or null. */
async function resolveUserId(req: NextRequest): Promise<string | null> {
  const session = await getServerSession(authOptions)
  if (session?.user?.id) return session.user.id
  const token = process.env.CLIPPER_IMPORT_TOKEN
  const userId = process.env.CLIPPER_IMPORT_USER_ID
  if (token && userId && tokenMatches(req.headers.get('authorization'), token)) {
    return userId
  }
  return null
}

export async function POST(req: NextRequest) {
  try {
    const userId = await resolveUserId(req)
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Rate limit per user: this route writes to the database.
    const identifier = getRateLimitIdentifier(
      userId,
      req.headers.get('x-forwarded-for') || undefined
    )
    const rateLimit = checkRateLimit(identifier, RATE_LIMITS.AI_ASSISTANT)
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: formatRateLimitError(rateLimit.resetIn, RATE_LIMITS.AI_ASSISTANT.message) },
        { status: 429 }
      )
    }

    const body = await req.json()
    const validation = ParsedRecipeSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid recipe data', details: validation.error.errors },
        { status: 400 }
      )
    }
    if (!validation.data.ingredients.length || !validation.data.instructions.length) {
      return NextResponse.json(
        { error: 'Recipe must have at least one ingredient and one instruction' },
        { status: 400 }
      )
    }

    // Sanitize list items: storage joins arrays with '\n'; embedded newlines
    // would silently corrupt entries on the round-trip.
    const parsed = sanitizeParsedRecipe(validation.data)

    const recipeInput = parseRecipeToInput(parsed, userId)
    const inputValidation = validateRecipeInput(recipeInput)
    if (!inputValidation.isValid) {
      return NextResponse.json(
        { error: `Validation failed: ${inputValidation.errors.join(', ')}` },
        { status: 400 }
      )
    }

    // Never lose data silently: report enum values the conversion dropped.
    const warnings = droppedEnumWarnings(parsed, recipeInput)
    for (const warning of warnings) {
      console.warn(`import-parsed: ${warning}`)
    }

    const slug = await generateUniqueSlug(recipeInput.title)
    const recipe = await prisma.recipe.create({
      data: {
        title: recipeInput.title,
        slug,
        contributor: recipeInput.contributor,
        summary: recipeInput.summary || '',
        ingredients: recipeInput.ingredients,
        instructions: recipeInput.instructions,
        prepTime: recipeInput.prepTime,
        servings: recipeInput.servings,
        cuisine: recipeInput.cuisine,
        course: recipeInput.course,
        difficulty: recipeInput.difficulty,
        imageUrl: recipeInput.imageUrl || 'https://placehold.co/600x400/FFFFFF/FFFFFF',
        imageHint: recipeInput.imageHint || '',
        tags: JSON.stringify(recipeInput.tags || []),
        story: recipeInput.story || '',
        calories: parsed.nutrition?.calories,
        protein: parsed.nutrition?.protein,
        carbs: parsed.nutrition?.carbs,
        fat: parsed.nutrition?.fat,
        fiber: parsed.nutrition?.fiber,
        sugar: parsed.nutrition?.sugar,
        sodium: parsed.nutrition?.sodium,
        userId,
      },
    })

    return NextResponse.json(
      {
        saved: true,
        recipeId: recipe.id,
        slug: recipe.slug,
        warnings,
        message: 'Recipe imported successfully',
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('import-parsed error:', error)
    return NextResponse.json(
      { error: 'Failed to import recipe' },
      { status: 500 }
    )
  }
}
