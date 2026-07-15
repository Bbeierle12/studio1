import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/data';
import { requireAdmin } from '@/lib/admin-middleware';
import { UserRole } from '@prisma/client';

export async function GET(req: NextRequest) {
  try {
    const auth = await requireAdmin('VIEW_USERS');
    if (!auth.authorized) return auth.response;

    // Parse query parameters
    const searchParams = req.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search') || '';
    const role = searchParams.get('role') as UserRole | null;
    const status = searchParams.get('status'); // 'active' | 'inactive' | null
    // Allowlist sort fields/order — these flow into Prisma's orderBy, and an
    // unrecognized field would throw a schema-leaking error.
    const SORTABLE_FIELDS = [
      'id', 'email', 'name', 'role', 'isActive',
      'lastLogin', 'createdAt', 'updatedAt',
    ] as const;
    const requestedSortBy = searchParams.get('sortBy') || 'createdAt';
    const sortBy = (SORTABLE_FIELDS as readonly string[]).includes(requestedSortBy)
      ? requestedSortBy
      : 'createdAt';
    const sortOrder = searchParams.get('sortOrder') === 'asc' ? 'asc' : 'desc';

    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {};

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (role) {
      where.role = role;
    }

    if (status === 'active') {
      where.isActive = true;
    } else if (status === 'inactive') {
      where.isActive = false;
    }

    // Get users with pagination
    const [users, totalCount] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true,
          email: true,
          name: true,
          avatarUrl: true,
          role: true,
          isActive: true,
          lastLogin: true,
          createdAt: true,
          updatedAt: true,
          _count: {
            select: {
              recipes: true,
              mealPlans: true,
              favorites: true,
            },
          },
        },
        orderBy: {
          [sortBy]: sortOrder,
        },
        skip,
        take: limit,
      }),
      prisma.user.count({ where }),
    ]);

    const totalPages = Math.ceil(totalCount / limit);

    return NextResponse.json({
      users,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages,
      },
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json(
      { error: 'Failed to fetch users' },
      { status: 500 }
    );
  }
}
