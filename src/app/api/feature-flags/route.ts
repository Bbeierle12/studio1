import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/data';
import { featureFlags } from '@/lib/feature-flags';

// Resolve the current user strictly from the authenticated session. The client
// must never be trusted to assert its own id/email/role — doing so previously
// let an unauthenticated caller evaluate flags as any identity (e.g. claim
// SUPER_ADMIN) and bypass user targeting/exclusion.
async function getSessionUser() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return null;

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { id: true, email: true, role: true },
  });
  if (!user) return null;

  return { id: user.id, email: user.email, role: user.role };
}

export async function POST(_request: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const flags = await featureFlags.getAllFlags(user);

    return NextResponse.json({ flags });
  } catch (error) {
    console.error('Error fetching feature flags:', error);
    return NextResponse.json({ flags: {} }, { status: 500 });
  }
}

// GET endpoint for server-side flag checking
export async function GET(request: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const flagName = searchParams.get('flag');

    if (!flagName) {
      return NextResponse.json({ error: 'Flag name is required' }, { status: 400 });
    }

    const enabled = await featureFlags.isEnabled(flagName, user);

    return NextResponse.json({ enabled });
  } catch (error) {
    console.error('Error checking feature flag:', error);
    return NextResponse.json({ enabled: false }, { status: 500 });
  }
}
