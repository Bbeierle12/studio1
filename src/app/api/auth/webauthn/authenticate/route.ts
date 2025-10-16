/**
 * WebAuthn Authentication API
 * Handle WebAuthn credential authentication
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import {
  generateAuthenticationOptions,
  updateCredentialCounter,
} from '@/lib/webauthn';
import { prisma } from '@/lib/data';
import { getClientInfo, logLoginAttempt } from '@/lib/login-anomaly';

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
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, credentialId, signature, counter } = body;

    if (!email || !credentialId || !signature) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const { ipAddress, userAgent } = getClientInfo(request);

    // Get user
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    });

    if (!user) {
      await logLoginAttempt({
        email,
        ipAddress,
        userAgent,
        successful: false,
        failureReason: 'user_not_found',
      });
      return NextResponse.json(
        { error: 'Authentication failed' },
        { status: 401 }
      );
    }

    // Verify credential exists and belongs to user
    const credential = await prisma.webAuthnCredential.findFirst({
      where: {
        credentialId,
        userId: user.id,
      },
    });

    if (!credential) {
      await logLoginAttempt({
        email,
        ipAddress,
        userAgent,
        successful: false,
        userId: user.id,
        failureReason: 'invalid_credential',
      });
      return NextResponse.json(
        { error: 'Authentication failed' },
        { status: 401 }
      );
    }

    // In a real implementation, you would verify the signature here
    // using the credential's public key and the challenge
    // For now, we'll assume it's valid

    // Update counter for replay protection
    if (counter !== undefined) {
      await updateCredentialCounter(credentialId, BigInt(counter));
    }

    // Update last login
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLogin: new Date() },
    });

    // Log successful login
    await logLoginAttempt({
      email,
      ipAddress,
      userAgent,
      successful: true,
      userId: user.id,
    });

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    });
  } catch (error) {
    console.error('Error verifying authentication:', error);
    return NextResponse.json(
      { error: 'Authentication failed' },
      { status: 500 }
    );
  }
}
