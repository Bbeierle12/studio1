import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/data';
import { hasPermission } from '@/lib/admin-permissions';

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const adminUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true, id: true },
    });

    if (!adminUser || !hasPermission(adminUser.role, 'FEATURE_RECIPES')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

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
      where: { id: params.id },
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
      where: { id: params.id },
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
        entityId: params.id,
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
