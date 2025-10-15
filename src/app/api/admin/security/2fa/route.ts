/**
 * API Route: 2FA Setup for Super Admins
 * POST /api/admin/security/2fa/setup - Generate 2FA secret
 * POST /api/admin/security/2fa/enable - Enable 2FA with verification
 * POST /api/admin/security/2fa/disable - Disable 2FA
 * POST /api/admin/security/2fa/verify - Verify 2FA code
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/data';
import {
  generateTOTPSecret,
  generateTOTPQRCodeURL,
  verifyTOTPCode,
  encryptSecret,
  decryptSecret
} from '@/lib/two-factor';
import { createAuditLog } from '@/lib/audit-log';
import { getClientIP } from '@/lib/ip-allowlist';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        email: true,
        role: true,
        twoFactorEnabled: true,
        twoFactorSecret: true
      }
    });

    if (!user || user.role !== 'SUPER_ADMIN') {
      return NextResponse.json(
        { error: 'Only Super Admins can manage 2FA' },
        { status: 403 }
      );
    }

    const { action, code } = await request.json();

    switch (action) {
      case 'setup': {
        // Generate new secret
        const secret = generateTOTPSecret();
        const encryptedSecret = encryptSecret(secret);
        const qrCodeURL = generateTOTPQRCodeURL(secret, user.email);

        // Save secret (but don't enable yet)
        await prisma.user.update({
          where: { id: user.id },
          data: { twoFactorSecret: encryptedSecret }
        });

        await createAuditLog({
          userId: user.id,
          action: 'UPDATE',
          entityType: 'User',
          entityId: user.id,
          changes: { action: '2FA_SETUP_INITIATED' },
          ipAddress: getClientIP(request)
        });

        return NextResponse.json({
          secret,
          qrCodeURL,
          message: 'Scan QR code with authenticator app and verify to enable 2FA'
        });
      }

      case 'enable': {
        if (!code) {
          return NextResponse.json(
            { error: 'Verification code required' },
            { status: 400 }
          );
        }

        if (!user.twoFactorSecret) {
          return NextResponse.json(
            { error: 'Must setup 2FA before enabling' },
            { status: 400 }
          );
        }

        // Verify code
        const decryptedSecret = decryptSecret(user.twoFactorSecret);
        const isValid = verifyTOTPCode(code, decryptedSecret);

        if (!isValid) {
          await createAuditLog({
            userId: user.id,
            action: 'UPDATE',
            entityType: 'User',
            entityId: user.id,
            changes: { action: '2FA_ENABLE_FAILED', reason: 'Invalid code' },
            ipAddress: getClientIP(request)
          });

          return NextResponse.json(
            { error: 'Invalid verification code' },
            { status: 400 }
          );
        }

        // Enable 2FA
        await prisma.user.update({
          where: { id: user.id },
          data: {
            twoFactorEnabled: true,
            twoFactorVerifiedAt: new Date()
          }
        });

        await createAuditLog({
          userId: user.id,
          action: 'UPDATE',
          entityType: 'User',
          entityId: user.id,
          changes: { action: '2FA_ENABLED' },
          ipAddress: getClientIP(request)
        });

        return NextResponse.json({
          success: true,
          message: '2FA enabled successfully'
        });
      }

      case 'disable': {
        if (!code) {
          return NextResponse.json(
            { error: 'Verification code required to disable 2FA' },
            { status: 400 }
          );
        }

        if (!user.twoFactorSecret || !user.twoFactorEnabled) {
          return NextResponse.json(
            { error: '2FA is not enabled' },
            { status: 400 }
          );
        }

        // Verify code before disabling
        const decryptedSecret = decryptSecret(user.twoFactorSecret);
        const isValid = verifyTOTPCode(code, decryptedSecret);

        if (!isValid) {
          return NextResponse.json(
            { error: 'Invalid verification code' },
            { status: 400 }
          );
        }

        // Disable 2FA
        await prisma.user.update({
          where: { id: user.id },
          data: {
            twoFactorEnabled: false,
            twoFactorSecret: null,
            twoFactorVerifiedAt: null
          }
        });

        await createAuditLog({
          userId: user.id,
          action: 'UPDATE',
          entityType: 'User',
          entityId: user.id,
          changes: { action: '2FA_DISABLED' },
          ipAddress: getClientIP(request)
        });

        return NextResponse.json({
          success: true,
          message: '2FA disabled successfully'
        });
      }

      case 'verify': {
        if (!code) {
          return NextResponse.json(
            { error: 'Verification code required' },
            { status: 400 }
          );
        }

        if (!user.twoFactorSecret || !user.twoFactorEnabled) {
          return NextResponse.json(
            { error: '2FA is not enabled' },
            { status: 400 }
          );
        }

        const decryptedSecret = decryptSecret(user.twoFactorSecret);
        const isValid = verifyTOTPCode(code, decryptedSecret);

        if (!isValid) {
          return NextResponse.json(
            { error: 'Invalid verification code' },
            { status: 401 }
          );
        }

        // Update verification timestamp
        await prisma.user.update({
          where: { id: user.id },
          data: { twoFactorVerifiedAt: new Date() }
        });

        return NextResponse.json({
          success: true,
          message: '2FA verified successfully',
          validFor: '5 minutes'
        });
      }

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('2FA API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// GET - Check 2FA status
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        role: true,
        twoFactorEnabled: true,
        twoFactorVerifiedAt: true
      }
    });

    if (!user || user.role !== 'SUPER_ADMIN') {
      return NextResponse.json(
        { error: 'Only Super Admins can check 2FA status' },
        { status: 403 }
      );
    }

    return NextResponse.json({
      enabled: user.twoFactorEnabled,
      verifiedAt: user.twoFactorVerifiedAt,
      isVerificationValid: user.twoFactorVerifiedAt 
        ? (new Date().getTime() - new Date(user.twoFactorVerifiedAt).getTime()) < 5 * 60 * 1000
        : false
    });
  } catch (error) {
    console.error('2FA status error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
