import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/data';
import { requireAdmin } from '@/lib/admin-middleware';

export async function GET(req: NextRequest) {
  try {
    const auth = await requireAdmin('VIEW_ALL_RECIPES');
    if (!auth.authorized) return auth.response;

    // Parse query parameters
    const searchParams = req.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '12');
    const search = searchParams.get('search') || '';
    const course = searchParams.get('course');
    const cuisine = searchParams.get('cuisine');
    const difficulty = searchParams.get('difficulty');
    const userId = searchParams.get('userId');
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const sortOrder = searchParams.get('sortOrder') || 'desc';

    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {};

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { contributor: { contains: search, mode: 'insensitive' } },
        { summary: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (course) {
      where.course = course;
    }

    if (cuisine) {
      where.cuisine = cuisine;
    }

    // difficulty is a Prisma enum (Easy|Medium|Hard); a malformed query param would
    // throw PrismaClientValidationError (500) instead of simply matching nothing.
    if (difficulty && ['Easy', 'Medium', 'Hard'].includes(difficulty)) {
      where.difficulty = difficulty;
    }

    if (userId) {
      where.userId = userId;
    }

    // Get recipes with pagination
    const [recipes, totalCount] = await Promise.all([
      prisma.recipe.findMany({
        where,
        select: {
          id: true,
          title: true,
          slug: true,
          contributor: true,
          course: true,
          cuisine: true,
          difficulty: true,
          imageUrl: true,
          summary: true,
          prepTime: true,
          servings: true,
          userId: true,
          isFeatured: true,
          featuredAt: true,
          createdAt: true,
          updatedAt: true,
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
            },
          },
          _count: {
            select: {
              favorites: true,
              plans: true,
              plannedMeals: true,
            },
          },
        },
        orderBy: {
          [sortBy]: sortOrder,
        },
        skip,
        take: limit,
      }),
      prisma.recipe.count({ where }),
    ]);

    const totalPages = Math.ceil(totalCount / limit);

    return NextResponse.json({
      recipes,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages,
      },
    });
  } catch (error) {
    console.error('Error fetching recipes:', error);
    return NextResponse.json(
      { error: 'Failed to fetch recipes' },
      { status: 500 }
    );
  }
}
