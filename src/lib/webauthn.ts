/**
 * WebAuthn (Passwordless Authentication)
 * Implements FIDO2 authentication using biometrics or security keys
 */

import { prisma } from '@/lib/data';
import crypto from 'crypto';

export interface WebAuthnRegistrationOptions {
  challenge: string;
  rp: {
    name: string;
    id: string;
  };
  user: {
    id: string;
    name: string;
    displayName: string;
  };
  pubKeyCredParams: Array<{
    type: 'public-key';
    alg: number;
  }>;
  timeout: number;
  attestation: 'none' | 'indirect' | 'direct';
  authenticatorSelection: {
    authenticatorAttachment?: 'platform' | 'cross-platform';
    requireResidentKey: boolean;
    userVerification: 'required' | 'preferred' | 'discouraged';
  };
}

export interface WebAuthnAuthenticationOptions {
  challenge: string;
  timeout: number;
  rpId: string;
  allowCredentials: Array<{
    type: 'public-key';
    id: string;
    transports?: Array<'usb' | 'nfc' | 'ble' | 'internal'>;
  }>;
  userVerification: 'required' | 'preferred' | 'discouraged';
}

/**
 * Generate registration options for WebAuthn
 */
export async function generateRegistrationOptions(
  userId: string,
  userName: string,
  displayName: string,
  rpName: string = 'Recipe Hub',
  rpId: string = 'localhost'
): Promise<WebAuthnRegistrationOptions> {
  // Generate challenge
  const challenge = crypto.randomBytes(32).toString('base64url');
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

  // Store challenge
  await prisma.webAuthnChallenge.create({
    data: {
      userId,
      challenge,
      expiresAt,
    },
  });

  return {
    challenge,
    rp: {
      name: rpName,
      id: rpId,
    },
    user: {
      id: userId,
      name: userName,
      displayName,
    },
    pubKeyCredParams: [
      { type: 'public-key', alg: -7 }, // ES256
      { type: 'public-key', alg: -257 }, // RS256
    ],
    timeout: 60000,
    attestation: 'none',
    authenticatorSelection: {
      requireResidentKey: false,
      userVerification: 'preferred',
    },
  };
}

/**
 * Generate authentication options for WebAuthn
 */
export async function generateAuthenticationOptions(
  userId: string,
  rpId: string = 'localhost'
): Promise<WebAuthnAuthenticationOptions> {
  // Generate challenge
  const challenge = crypto.randomBytes(32).toString('base64url');
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

  // Store challenge
  await prisma.webAuthnChallenge.create({
    data: {
      userId,
      challenge,
      expiresAt,
    },
  });

  // Get user's credentials
  const credentials = await prisma.webAuthnCredential.findMany({
    where: { userId },
  });

  return {
    challenge,
    timeout: 60000,
    rpId,
    allowCredentials: credentials.map((cred) => ({
      type: 'public-key' as const,
      id: cred.credentialId,
      transports: cred.transports as Array<'usb' | 'nfc' | 'ble' | 'internal'>,
    })),
    userVerification: 'preferred',
  };
}

/**
 * Verify and store WebAuthn credential
 */
export async function verifyAndStoreCredential(
  userId: string,
  credentialId: string,
  publicKey: string,
  transports: string[],
  deviceName?: string
): Promise<boolean> {
  try {
    // Check if credential already exists
    const existing = await prisma.webAuthnCredential.findUnique({
      where: { credentialId },
    });

    if (existing) {
      return false; // Credential already registered
    }

    // Store credential
    await prisma.webAuthnCredential.create({
      data: {
        userId,
        credentialId,
        publicKey,
        transports,
        deviceName,
      },
    });

    return true;
  } catch (error) {
    console.error('Error storing WebAuthn credential:', error);
    return false;
  }
}

/**
 * Verify WebAuthn challenge
 */
export async function verifyChallenge(
  userId: string,
  challenge: string
): Promise<boolean> {
  try {
    const storedChallenge = await prisma.webAuthnChallenge.findUnique({
      where: { challenge },
    });

    if (!storedChallenge) {
      return false;
    }

    // Check if expired
    if (storedChallenge.expiresAt < new Date()) {
      await prisma.webAuthnChallenge.delete({
        where: { id: storedChallenge.id },
      });
      return false;
    }

    // Check if belongs to user
    if (storedChallenge.userId !== userId) {
      return false;
    }

    // Delete challenge (one-time use)
    await prisma.webAuthnChallenge.delete({
      where: { id: storedChallenge.id },
    });

    return true;
  } catch (error) {
    console.error('Error verifying challenge:', error);
    return false;
  }
}

/**
 * Update credential counter (for replay protection)
 */
export async function updateCredentialCounter(
  credentialId: string,
  newCounter: bigint
): Promise<void> {
  try {
    await prisma.webAuthnCredential.update({
      where: { credentialId },
      data: {
        counter: newCounter,
        lastUsedAt: new Date(),
      },
    });
  } catch (error) {
    console.error('Error updating credential counter:', error);
  }
}

/**
 * Get user's WebAuthn credentials
 */
export async function getUserCredentials(userId: string) {
  try {
    return await prisma.webAuthnCredential.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  } catch (error) {
    console.error('Error getting user credentials:', error);
    return [];
  }
}

/**
 * Delete WebAuthn credential
 */
export async function deleteCredential(
  userId: string,
  credentialId: string
): Promise<boolean> {
  try {
    const credential = await prisma.webAuthnCredential.findUnique({
      where: { credentialId },
    });

    if (!credential || credential.userId !== userId) {
      return false;
    }

    await prisma.webAuthnCredential.delete({
      where: { credentialId },
    });

    return true;
  } catch (error) {
    console.error('Error deleting credential:', error);
    return false;
  }
}

/**
 * Clean up expired challenges (maintenance)
 */
export async function cleanupExpiredChallenges(): Promise<void> {
  try {
    await prisma.webAuthnChallenge.deleteMany({
      where: {
        expiresAt: {
          lt: new Date(),
        },
      },
    });
  } catch (error) {
    console.error('Error cleaning up challenges:', error);
  }
}

/**
 * Check if user has WebAuthn enabled
 */
export async function hasWebAuthnEnabled(userId: string): Promise<boolean> {
  try {
    const count = await prisma.webAuthnCredential.count({
      where: { userId },
    });
    return count > 0;
  } catch (error) {
    console.error('Error checking WebAuthn status:', error);
    return false;
  }
}
