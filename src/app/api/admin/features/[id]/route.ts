import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { createAuditLog } from '@/lib/audit-log';

// PUT - Update feature flag
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user || (session.user as any).role !== 'SUPER_ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized. Only Super Admins can update feature flags.' },
        { status: 403 }
      );
    }

    const { id } = params;
    const body = await request.json();
    const { description, enabled, rolloutPercentage } = body;

    // Get current flag
    const currentFlag = await prisma.featureFlag.findUnique({
      where: { id },
    });

    if (!currentFlag) {
      return NextResponse.json(
        { error: 'Feature flag not found' },
        { status: 404 }
      );
    }

    // Update flag
    const flag = await prisma.featureFlag.update({
      where: { id },
      data: {
        description: description !== undefined ? description || null : undefined,
        enabled: enabled !== undefined ? enabled : undefined,
        rolloutPercentage: rolloutPercentage !== undefined ? rolloutPercentage : undefined,
      },
    });

    // Log the update
    const changes: any = {};
    if (enabled !== undefined && enabled !== currentFlag.enabled) {
      changes.enabled = { from: currentFlag.enabled, to: enabled };
    }
    if (rolloutPercentage !== undefined && rolloutPercentage !== currentFlag.rolloutPercentage) {
      changes.rolloutPercentage = { from: currentFlag.rolloutPercentage, to: rolloutPercentage };
    }
    if (description !== undefined && description !== currentFlag.description) {
      changes.description = { from: currentFlag.description, to: description };
    }

    await createAuditLog({
      userId: session.user.id,
      action: 'UPDATE',
      entityType: 'FeatureFlag',
      entityId: flag.id,
      changes: {
        name: flag.name,
        changes,
      },
    });

    return NextResponse.json({ flag });
  } catch (error) {
    console.error('Error updating feature flag:', error);
    return NextResponse.json(
      { error: 'Failed to update feature flag' },
      { status: 500 }
    );
  }
}

// DELETE - Delete feature flag
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user || (session.user as any).role !== 'SUPER_ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized. Only Super Admins can delete feature flags.' },
        { status: 403 }
      );
    }

    const { id } = params;

    // Get flag before deleting
    const flag = await prisma.featureFlag.findUnique({
      where: { id },
    });

    if (!flag) {
      return NextResponse.json(
        { error: 'Feature flag not found' },
        { status: 404 }
      );
    }

    // Delete the flag
    await prisma.featureFlag.delete({
      where: { id },
    });

    // Log the deletion
    await createAuditLog({
      userId: session.user.id,
      action: 'DELETE',
      entityType: 'FeatureFlag',
      entityId: id,
      changes: {
        name: flag.name,
        wasEnabled: flag.enabled,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting feature flag:', error);
    return NextResponse.json(
      { error: 'Failed to delete feature flag' },
      { status: 500 }
    );
  }
}
