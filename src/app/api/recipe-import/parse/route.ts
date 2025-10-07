import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { RecipeParser } from '@/lib/recipe-parser'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const ImportRequestSchema = z.object({
  url: z.string().url().optional(),
  html: z.string().optional(),
  autoSave: z.boolean().default(false),
})

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const validation = ImportRequestSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid request data', details: validation.error.errors },
        { status: 400 }
      )
    }

    const { url, html, autoSave } = validation.data

    if (!url && !html) {
      return NextResponse.json(
        { error: 'Either URL or HTML content is required' },
        { status: 400 }
      )
    }

    const parser = new RecipeParser()
    let parsedRecipe

    try {
      if (url) {
        parsedRecipe = await parser.parseFromUrl(url)
      } else if (html) {
        parsedRecipe = parser.parseFromHtml(html)
      }
    } catch (error) {
      console.error('Failed to parse recipe:', error)
      return NextResponse.json(
        { error: `Failed to parse recipe: ${error instanceof Error ? error.message : 'Unknown error'}` },
        { status: 400 }
      )
    }

    if (!parsedRecipe) {
      return NextResponse.json(
        { error: 'Could not extract recipe data from the provided content' },
        { status: 400 }
      )
    }

    // If autoSave is true, save the recipe to the database
    if (autoSave) {
      try {
        // Generate a unique slug
        const baseSlug = parsedRecipe.title
          .toLowerCase()
          .replace(/[^\w\s-]/g, '')
          .replace(/\s+/g, '-')

        let slug = baseSlug
        let counter = 0

        while (await prisma.recipe.findUnique({ where: { slug } })) {
          counter++
          slug = `${baseSlug}-${counter}`
        }

        const recipe = await prisma.recipe.create({
          data: {
            title: parsedRecipe.title,
            slug,
            summary: parsedRecipe.description || '',
            ingredients: JSON.stringify(parsedRecipe.ingredients),
            instructions: JSON.stringify(parsedRecipe.instructions),
            prepTime: parsedRecipe.totalTime || parsedRecipe.prepTime,
            servings: parsedRecipe.servings,
            cuisine: parsedRecipe.cuisine,
            course: parsedRecipe.course,
            difficulty: parsedRecipe.difficulty,
            imageUrl: parsedRecipe.imageUrl || '',
            imageHint: `Imported from ${parsedRecipe.sourceUrl || 'external source'}`,
            tags: JSON.stringify(parsedRecipe.tags || []),
            contributor: parsedRecipe.author || session.user.name || 'Imported',
            // Nutrition data
            calories: parsedRecipe.nutrition?.calories,
            protein: parsedRecipe.nutrition?.protein,
            carbs: parsedRecipe.nutrition?.carbs,
            fat: parsedRecipe.nutrition?.fat,
            fiber: parsedRecipe.nutrition?.fiber,
            sugar: parsedRecipe.nutrition?.sugar,
            sodium: parsedRecipe.nutrition?.sodium,
            userId: session.user.id,
          },
        })

        return NextResponse.json({
          recipe: parsedRecipe,
          saved: true,
          recipeId: recipe.id,
          message: 'Recipe imported and saved successfully',
        })
      } catch (error) {
        console.error('Failed to save recipe:', error)
        return NextResponse.json({
          recipe: parsedRecipe,
          saved: false,
          error: 'Failed to save recipe to database',
        })
      }
    }

    // Return the parsed recipe without saving
    return NextResponse.json({
      recipe: parsedRecipe,
      saved: false,
      message: 'Recipe parsed successfully',
    })
  } catch (error) {
    console.error('Recipe import error:', error)
    return NextResponse.json(
      { error: 'Failed to import recipe' },
      { status: 500 }
    )
  }
}