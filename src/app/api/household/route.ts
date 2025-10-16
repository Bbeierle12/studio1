import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get current user with household info
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: {
        id: true,
        householdId: true,
        householdRole: true
      }
    });

    if (!user || !user.householdId) {
      return NextResponse.json({ error: 'No household found' }, { status: 404 });
    }

    // Get household with members
    const household = await prisma.household.findUnique({
      where: { id: user.householdId },
      include: {
        members: {
          select: {
            id: true,
            email: true,
            name: true,
            householdRole: true,
            avatarUrl: true
          },
          orderBy: [
            { householdRole: 'asc' },
            { name: 'asc' }
          ]
        }
      }
    });

    if (!household) {
      return NextResponse.json({ error: 'Household not found' }, { status: 404 });
    }

    return NextResponse.json(household);
  } catch (error) {
    console.error('Error fetching household:', error);
    return NextResponse.json(
      { error: 'Failed to fetch household' },
      { status: 500 }
    );
  }
}
