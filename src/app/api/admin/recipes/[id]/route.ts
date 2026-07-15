import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/data';
import { requireAdmin } from '@/lib/admin-middleware';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAdmin('VIEW_ALL_RECIPES');
    if (!auth.authorized) return auth.response;

    const recipe = await prisma.recipe.findUnique({
      where: { id: (await params).id },
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
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAdmin('EDIT_ANY_RECIPE');
    if (!auth.authorized) return auth.response;
    const adminUser = auth.user;

    const body = await req.json();

    // Allowlist the fields an admin may edit. Spreading the raw body into
    // prisma.recipe.update() was a mass-assignment hole: it let a content admin
    // set columns that must not be editable here — e.g. reassign ownership via
    // `userId`, forge `slug`, rewrite `createdAt`, or flip `isFeatured`
    // (which has its own dedicated, separately-permissioned route).
    const EDITABLE_FIELDS = [
      'title', 'contributor', 'prepTime', 'servings', 'course', 'cuisine',
      'difficulty', 'ingredients', 'instructions', 'tags', 'summary', 'story',
      'originStory', 'photoUrl', 'voiceNoteUrl', 'voiceNoteDuration',
      'allergyTags', 'substitutions', 'dietaryFlags', 'imageUrl', 'imageHint',
      'audioUrl', 'originName', 'originLat', 'originLng', 'servingSize',
      'calories', 'protein', 'carbs', 'fat', 'fiber', 'sugar', 'sodium',
      'stepTimers', 'voiceEnabled', 'prefetchPriority', 'printFriendly',
    ] as const;

    const data: Record<string, unknown> = {};
    for (const field of EDITABLE_FIELDS) {
      if (Object.prototype.hasOwnProperty.call(body, field)) {
        data[field] = body[field];
      }
    }

    if (Object.keys(data).length === 0) {
      return NextResponse.json(
        { error: 'No editable fields provided' },
        { status: 400 }
      );
    }

    // Get the recipe before update for audit log
    const existingRecipe = await prisma.recipe.findUnique({
      where: { id: (await params).id },
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
      where: { id: (await params).id },
      data,
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
        entityId: (await params).id,
        changes: {
          before: existingRecipe,
          after: data as Record<string, any>,
        } as any,
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
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAdmin('DELETE_ANY_RECIPE');
    if (!auth.authorized) return auth.response;
    const adminUser = auth.user;

    // Get recipe before deletion for audit log
    const recipe = await prisma.recipe.findUnique({
      where: { id: (await params).id },
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
        entityId: (await params).id,
        changes: { deletedRecipe: recipe },
        ipAddress: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown',
        userAgent: req.headers.get('user-agent') || 'unknown',
      },
    });

    // Delete recipe (cascade will handle related records)
    await prisma.recipe.delete({
      where: { id: (await params).id },
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
