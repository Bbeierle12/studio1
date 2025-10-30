import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ count: 0 });
    }

    // Count household members
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { householdId: true },
    });

    if (!user?.householdId) {
      return NextResponse.json({ count: 1 }); // Just the user
    }

    const count = await prisma.user.count({
      where: {
        householdId: user.householdId,
      },
    });

    return NextResponse.json({ count });
  } catch (error) {
    console.error('Error fetching household count:', error);
    return NextResponse.json({ count: 0 });
  }
}
