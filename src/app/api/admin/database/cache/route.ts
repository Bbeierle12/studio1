import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { createAuditLog } from '@/lib/audit-log';
import { revalidatePath, revalidateTag } from 'next/cache';

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user || (session.user as any).role !== 'SUPER_ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized. Only Super Admins can manage cache.' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { type } = body;

    if (!type || !['next', 'prisma', 'all'].includes(type)) {
      return NextResponse.json(
        { error: 'Invalid cache type. Must be: next, prisma, or all' },
        { status: 400 }
      );
    }

    let cleared: string[] = [];

    // Clear Next.js cache
    if (type === 'next' || type === 'all') {
      // Revalidate all paths
      revalidatePath('/', 'layout');
      
      // Revalidate common tags
      const commonTags = ['recipes', 'users', 'analytics', 'mealplans'];
      commonTags.forEach(tag => {
        try {
          revalidateTag(tag);
        } catch (error) {
          console.error(`Failed to revalidate tag ${tag}:`, error);
        }
      });
      
      cleared.push('Next.js cache');
    }

    // Clear Prisma query cache (restart connection pool)
    if (type === 'prisma' || type === 'all') {
      try {
        // Disconnect and reconnect Prisma to clear query cache
        await prisma.$disconnect();
        await prisma.$connect();
        cleared.push('Prisma query cache');
      } catch (error) {
        console.error('Failed to restart Prisma connection:', error);
      }
    }

    // Log the cache clear action
    await createAuditLog({
      userId: session.user.id,
      action: 'UPDATE',
      entityType: 'System',
      entityId: 'cache-management',
      changes: {
        operation: 'clear_cache',
        type,
        cleared,
        timestamp: new Date().toISOString(),
      },
    });

    return NextResponse.json({
      success: true,
      message: `Successfully cleared ${cleared.join(', ')}`,
      cleared,
    });
  } catch (error) {
    console.error('Error clearing cache:', error);
    return NextResponse.json(
      { error: 'Failed to clear cache' },
      { status: 500 }
    );
  }
}
