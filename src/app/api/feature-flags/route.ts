import { NextRequest, NextResponse } from 'next/server';
import { featureFlags } from '@/lib/feature-flags';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, userEmail, userRole } = body;

    const user = userId ? {
      id: userId,
      email: userEmail,
      role: userRole,
    } : null;

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
    const searchParams = request.nextUrl.searchParams;
    const flagName = searchParams.get('flag');
    const userId = searchParams.get('userId');

    if (!flagName) {
      return NextResponse.json({ error: 'Flag name is required' }, { status: 400 });
    }

    const user = userId ? { id: userId } : null;
    const enabled = await featureFlags.isEnabled(flagName, user);

    return NextResponse.json({ enabled });
  } catch (error) {
    console.error('Error checking feature flag:', error);
    return NextResponse.json({ enabled: false }, { status: 500 });
  }
}