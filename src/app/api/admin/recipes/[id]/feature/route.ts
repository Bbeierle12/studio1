import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/data';
import { requireAdmin } from '@/lib/admin-middleware';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAdmin('FEATURE_RECIPES');
    if (!auth.authorized) return auth.response;
    const adminUser = auth.user;

    const body = await req.json();
    const { isFeatured } = body;

    if (typeof isFeatured !== 'boolean') {
      return NextResponse.json(
        { error: 'isFeatured must be a boolean' },
        { status: 400 }
      );
    }

    // Get the recipe before update for audit log
    const existingRecipe = await prisma.recipe.findUnique({
      where: { id: (await params).id },
      select: {
        title: true,
        isFeatured: true,
      },
    });

    if (!existingRecipe) {
      return NextResponse.json({ error: 'Recipe not found' }, { status: 404 });
    }

    // Update recipe featured status
    const updatedRecipe = await prisma.recipe.update({
      where: { id: (await params).id },
      data: {
        isFeatured,
        featuredAt: isFeatured ? new Date() : null,
      },
      select: {
        id: true,
        title: true,
        slug: true,
        isFeatured: true,
        featuredAt: true,
      },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: adminUser.id,
        action: isFeatured ? 'FEATURE' : 'UNFEATURE',
        entityType: 'Recipe',
        entityId: (await params).id,
        changes: {
          before: { isFeatured: existingRecipe.isFeatured },
          after: { isFeatured },
          title: existingRecipe.title,
        },
        ipAddress: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown',
        userAgent: req.headers.get('user-agent') || 'unknown',
      },
    });

    return NextResponse.json({
      recipe: updatedRecipe,
      message: isFeatured ? 'Recipe featured successfully' : 'Recipe unfeatured successfully',
    });
  } catch (error) {
    console.error('Error toggling recipe featured status:', error);
    return NextResponse.json(
      { error: 'Failed to update recipe' },
      { status: 500 }
    );
  }
}
