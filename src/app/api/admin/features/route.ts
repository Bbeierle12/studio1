import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { isSuperAdmin } from '@/lib/admin-permissions';
import { requireAdmin } from '@/lib/admin-middleware';
import { createAuditLog } from '@/lib/audit-log';

// GET - List all feature flags
export async function GET() {
  try {
    const auth = await requireAdmin(isSuperAdmin, 'Unauthorized. Only Super Admins can view feature flags.');
    if (!auth.authorized) return auth.response;

    const flags = await prisma.featureFlag.findMany({
      orderBy: [
        { enabled: 'desc' },
        { name: 'asc' },
      ],
    });

    return NextResponse.json({ flags });
  } catch (error) {
    console.error('Error fetching feature flags:', error);
    return NextResponse.json(
      { error: 'Failed to fetch feature flags' },
      { status: 500 }
    );
  }
}

// POST - Create new feature flag
export async function POST(request: Request) {
  try {
    const auth = await requireAdmin(isSuperAdmin, 'Unauthorized. Only Super Admins can create feature flags.');
    if (!auth.authorized) return auth.response;

    const body = await request.json();
    const { name, description, enabled, rolloutPercentage } = body;

    if (!name || typeof name !== 'string') {
      return NextResponse.json(
        { error: 'Feature name is required' },
        { status: 400 }
      );
    }

    // Validate name format (lowercase with underscores)
    if (!/^[a-z_][a-z0-9_]*$/.test(name)) {
      return NextResponse.json(
        { error: 'Feature name must be lowercase with underscores (e.g., dark_mode)' },
        { status: 400 }
      );
    }

    // Check if flag already exists
    const existing = await prisma.featureFlag.findUnique({
      where: { name },
    });

    if (existing) {
      return NextResponse.json(
        { error: 'A feature flag with this name already exists' },
        { status: 409 }
      );
    }

    const flag = await prisma.featureFlag.create({
      data: {
        name,
        description: description || null,
        enabled: enabled ?? false,
        rolloutPercentage: rolloutPercentage ?? 100,
      },
    });

    // Log the creation
    await createAuditLog({
      userId: auth.user.id,
      action: 'CREATE',
      entityType: 'FeatureFlag',
      entityId: flag.id,
      changes: {
        name: flag.name,
        enabled: flag.enabled,
        rolloutPercentage: flag.rolloutPercentage,
      },
    });

    return NextResponse.json({ flag }, { status: 201 });
  } catch (error) {
    console.error('Error creating feature flag:', error);
    return NextResponse.json(
      { error: 'Failed to create feature flag' },
      { status: 500 }
    );
  }
}
