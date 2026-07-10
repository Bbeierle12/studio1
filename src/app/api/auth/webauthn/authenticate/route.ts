/**
 * WebAuthn Authentication API
 * Handle WebAuthn credential authentication
 */

import { NextRequest, NextResponse } from 'next/server';
import { generateAuthenticationOptions } from '@/lib/webauthn';
import { prisma } from '@/lib/data';

// GET - Get authentication options
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');

    if (!email) {
      return NextResponse.json(
        { error: 'Email required' },
        { status: 400 }
      );
    }

    // Get user
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
      select: { id: true },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    const rpId = process.env.NEXTAUTH_URL
      ? new URL(process.env.NEXTAUTH_URL).hostname
      : 'localhost';

    const options = await generateAuthenticationOptions(user.id, rpId);

    return NextResponse.json({ options });
  } catch (error) {
    console.error('Error generating authentication options:', error);
    return NextResponse.json(
      { error: 'Failed to generate authentication options' },
      { status: 500 }
    );
  }
}

// POST - Verify authentication
//
// SECURITY: This endpoint is intentionally disabled. The previous
// implementation returned a successful authentication (including the user's
// id/email/role) WITHOUT ever verifying the WebAuthn assertion signature or
// the server-issued challenge — the signature was accepted on trust. Wiring
// that into session creation would be a complete passwordless-auth bypass:
// anyone who knew a registered email and a (non-secret) credential id could
// authenticate as that user with an arbitrary signature.
//
// It must not be re-enabled until real assertion verification is implemented
// (verify the signature against the stored credential public key, validate a
// single-use challenge via verifyChallenge(), and reject counter regression —
// e.g. using @simplewebauthn/server's verifyAuthenticationResponse). Until
// then we refuse the request rather than fake a successful login.
export async function POST(_request: NextRequest) {
  return NextResponse.json(
    {
      error:
        'WebAuthn authentication is not available. Please sign in with your password or Google.',
    },
    { status: 501 }
  );
}
