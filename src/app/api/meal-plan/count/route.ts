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

    const count = await prisma.mealPlan.count({
      where: {
        userId: session.user.id,
      },
    });

    return NextResponse.json({ count });
  } catch (error) {
    console.error('Error fetching meal plan count:', error);
    return NextResponse.json({ count: 0 });
  }
}
