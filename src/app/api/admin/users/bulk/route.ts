import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/data';
import { hasPermission } from '@/lib/admin-permissions';

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const adminUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true, id: true },
    });

    if (!adminUser || !hasPermission(adminUser.role, 'EDIT_USERS')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await req.json();
    const { action, userIds } = body;

    if (!action || !Array.isArray(userIds) || userIds.length === 0) {
      return NextResponse.json(
        { error: 'Invalid request body' },
        { status: 400 }
      );
    }

    // Prevent action on self
    if (userIds.includes(adminUser.id)) {
      return NextResponse.json(
        { error: 'Cannot perform bulk actions on your own account' },
        { status: 400 }
      );
    }

    let result;

    switch (action) {
      case 'activate':
        result = await prisma.user.updateMany({
          where: { id: { in: userIds } },
          data: { isActive: true },
        });
        break;

      case 'suspend':
        result = await prisma.user.updateMany({
          where: { id: { in: userIds } },
          data: { isActive: false },
        });
        break;

      case 'delete':
        if (!hasPermission(adminUser.role, 'DELETE_USERS')) {
          return NextResponse.json(
            { error: 'Insufficient permissions to delete users' },
            { status: 403 }
          );
        }
        result = await prisma.user.deleteMany({
          where: { id: { in: userIds } },
        });
        break;

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: adminUser.id,
        action: 'BULK_' + action.toUpperCase(),
        entityType: 'User',
        changes: {
          action,
          userIds,
          count: result.count,
        },
        ipAddress: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown',
        userAgent: req.headers.get('user-agent') || 'unknown',
      },
    });

    return NextResponse.json({
      success: true,
      count: result.count,
    });
  } catch (error) {
    console.error('Error performing bulk action:', error);
    return NextResponse.json(
      { error: 'Failed to perform bulk action' },
      { status: 500 }
    );
  }
}
