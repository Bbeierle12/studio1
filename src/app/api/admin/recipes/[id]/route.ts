import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/data';
import { hasPermission } from '@/lib/admin-permissions';

export async function GET(
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
      select: { role: true },
    });

    if (!adminUser || !hasPermission(adminUser.role, 'VIEW_ALL_RECIPES')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const recipe = await prisma.recipe.findUnique({
      where: { id: params.id },
      include: {
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
            variations: true,
          },
        },
      },
    });

    if (!recipe) {
      return NextResponse.json({ error: 'Recipe not found' }, { status: 404 });
    }

    return NextResponse.json({ recipe });
  } catch (error) {
    console.error('Error fetching recipe:', error);
    return NextResponse.json(
      { error: 'Failed to fetch recipe' },
      { status: 500 }
    );
  }
}

export async function PATCH(
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

    if (!adminUser || !hasPermission(adminUser.role, 'EDIT_ANY_RECIPE')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await req.json();

    // Get the recipe before update for audit log
    const existingRecipe = await prisma.recipe.findUnique({
      where: { id: params.id },
      select: {
        title: true,
        course: true,
        cuisine: true,
        difficulty: true,
      },
    });

    if (!existingRecipe) {
      return NextResponse.json({ error: 'Recipe not found' }, { status: 404 });
    }

    // Update recipe
    const updatedRecipe = await prisma.recipe.update({
      where: { id: params.id },
      data: body,
      select: {
        id: true,
        title: true,
        slug: true,
        course: true,
        cuisine: true,
        difficulty: true,
        updatedAt: true,
      },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: adminUser.id,
        action: 'UPDATE',
        entityType: 'Recipe',
        entityId: params.id,
        changes: {
          before: existingRecipe,
          after: body,
        },
        ipAddress: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown',
        userAgent: req.headers.get('user-agent') || 'unknown',
      },
    });

    return NextResponse.json({ recipe: updatedRecipe });
  } catch (error) {
    console.error('Error updating recipe:', error);
    return NextResponse.json(
      { error: 'Failed to update recipe' },
      { status: 500 }
    );
  }
}

export async function DELETE(
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

    if (!adminUser || !hasPermission(adminUser.role, 'DELETE_ANY_RECIPE')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Get recipe before deletion for audit log
    const recipe = await prisma.recipe.findUnique({
      where: { id: params.id },
      select: {
        title: true,
        slug: true,
        contributor: true,
        userId: true,
      },
    });

    if (!recipe) {
      return NextResponse.json({ error: 'Recipe not found' }, { status: 404 });
    }

    // Create audit log before deletion
    await prisma.auditLog.create({
      data: {
        userId: adminUser.id,
        action: 'DELETE',
        entityType: 'Recipe',
        entityId: params.id,
        changes: { deletedRecipe: recipe },
        ipAddress: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown',
        userAgent: req.headers.get('user-agent') || 'unknown',
      },
    });

    // Delete recipe (cascade will handle related records)
    await prisma.recipe.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting recipe:', error);
    return NextResponse.json(
      { error: 'Failed to delete recipe' },
      { status: 500 }
    );
  }
}
