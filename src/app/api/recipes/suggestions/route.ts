import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ suggestions: [] });
    }

    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get('q') || '';

    if (!query.trim()) {
      return NextResponse.json({ suggestions: [] });
    }

    // Search for recipes by name
    const recipes = await prisma.recipe.findMany({
      where: {
        userId: session.user.id,
        OR: [
          {
            title: {
              contains: query,
              mode: 'insensitive',
            },
          },
        ],
      },
      select: {
        id: true,
        title: true,
      },
      take: 5,
    });

    const suggestions = recipes.map((recipe: any) => ({
      id: recipe.id,
      text: recipe.title,
      type: 'recipe' as const,
    }));

    return NextResponse.json({ suggestions });
  } catch (error) {
    console.error('Error fetching suggestions:', error);
    return NextResponse.json({ suggestions: [] });
  }
}
