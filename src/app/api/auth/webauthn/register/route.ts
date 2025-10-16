/**
 * WebAuthn Registration API
 * Handle WebAuthn credential registration
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import {
  generateRegistrationOptions,
  verifyAndStoreCredential,
  getUserCredentials,
  deleteCredential,
} from '@/lib/webauthn';
import { createSecurityEvent } from '@/lib/security-webhooks';
import { getClientInfo } from '@/lib/login-anomaly';

// GET - Get registration options or list credentials
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    if (action === 'list') {
      // List user's credentials
      const credentials = await getUserCredentials((session.user as any).id);
      return NextResponse.json({
        credentials: credentials.map((c) => ({
          id: c.id,
          credentialId: c.credentialId,
          deviceName: c.deviceName,
          createdAt: c.createdAt,
          lastUsedAt: c.lastUsedAt,
          transports: c.transports,
        })),
      });
    }

    // Generate registration options
    const rpId = process.env.NEXTAUTH_URL
      ? new URL(process.env.NEXTAUTH_URL).hostname
      : 'localhost';

    const options = await generateRegistrationOptions(
      (session.user as any).id,
      session.user.email!,
      session.user.name || session.user.email!,
      'Recipe Hub',
      rpId
    );

    return NextResponse.json({ options });
  } catch (error) {
    console.error('Error generating registration options:', error);
    return NextResponse.json(
      { error: 'Failed to generate registration options' },
      { status: 500 }
    );
  }
}

// POST - Register new credential
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { credentialId, publicKey, transports, deviceName } = body;

    if (!credentialId || !publicKey) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const success = await verifyAndStoreCredential(
      (session.user as any).id,
      credentialId,
      publicKey,
      transports || [],
      deviceName
    );

    if (!success) {
      return NextResponse.json(
        { error: 'Failed to register credential' },
        { status: 400 }
      );
    }

    // Log security event
    const { ipAddress, userAgent } = getClientInfo(request);
    await createSecurityEvent({
      userId: (session.user as any).id,
      eventType: 'webauthn_added',
      severity: 'medium',
      description: `WebAuthn credential registered: ${deviceName || 'Unnamed device'}`,
      ipAddress,
      userAgent,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error registering credential:', error);
    return NextResponse.json(
      { error: 'Failed to register credential' },
      { status: 500 }
    );
  }
}

// DELETE - Remove credential
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const credentialId = searchParams.get('credentialId');

    if (!credentialId) {
      return NextResponse.json(
        { error: 'Credential ID required' },
        { status: 400 }
      );
    }

    const success = await deleteCredential(
      (session.user as any).id,
      credentialId
    );

    if (!success) {
      return NextResponse.json(
        { error: 'Failed to delete credential' },
        { status: 400 }
      );
    }

    // Log security event
    const { ipAddress, userAgent } = getClientInfo(request);
    await createSecurityEvent({
      userId: (session.user as any).id,
      eventType: 'webauthn_removed',
      severity: 'medium',
      description: 'WebAuthn credential removed',
      ipAddress,
      userAgent,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting credential:', error);
    return NextResponse.json(
      { error: 'Failed to delete credential' },
      { status: 500 }
    );
  }
}
