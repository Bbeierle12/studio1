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

    // TODO: Implement saved recipes count when model is available
    const count = 0;

    return NextResponse.json({ count });
  } catch (error) {
    console.error('Error fetching saved recipes count:', error);
    return NextResponse.json({ count: 0 });
  }
}
