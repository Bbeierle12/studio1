/**
 * Admin Security Middleware
 * Comprehensive security checks for admin operations
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/data';
import { getClientIP, isIPAllowed } from '@/lib/ip-allowlist';
import { requireCSRFToken } from '@/lib/csrf';
import { checkRateLimit, RATE_LIMITS } from '@/lib/rate-limit';
import { is2FAVerificationValid, decryptSecret, verifyTOTPCode } from '@/lib/two-factor';
import { createAuditLog } from '@/lib/audit-log';

export interface SecurityCheckOptions {
  requireSuperAdmin?: boolean;
  require2FA?: boolean;
  requireIPAllowlist?: boolean;
  requireCSRF?: boolean;
  rateLimit?: 'mutations' | 'sensitive' | 'general';
}

export interface SecurityCheckResult {
  allowed: boolean;
  error?: string;
  status?: number;
  user?: any;
}

/**
 * Comprehensive security check for admin operations
 */
export async function checkAdminSecurity(
  request: NextRequest,
  options: SecurityCheckOptions = {}
): Promise<SecurityCheckResult> {
  const {
    requireSuperAdmin = false,
    require2FA = false,
    requireIPAllowlist = false,
    requireCSRF = true,
    rateLimit = 'mutations'
  } = options;

  try {
    // 1. Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return {
        allowed: false,
        error: 'Unauthorized - Authentication required',
        status: 401
      };
    }

    // 2. Get user details
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        email: true,
        role: true,
        isActive: true,
        twoFactorEnabled: true,
        twoFactorSecret: true,
        twoFactorVerifiedAt: true
      }
    });

    if (!user) {
      return {
        allowed: false,
        error: 'User not found',
        status: 404
      };
    }

    if (!user.isActive) {
      return {
        allowed: false,
        error: 'Account suspended',
        status: 403
      };
    }

    // 3. Check role permissions
    const isAdmin = ['SUPPORT_ADMIN', 'CONTENT_ADMIN', 'SUPER_ADMIN'].includes(user.role);
    if (!isAdmin) {
      await createAuditLog({
        userId: user.id,
        action: 'VIEW',
        entityType: 'User',
        ipAddress: getClientIP(request),
        changes: { attempt: 'UNAUTHORIZED_ACCESS_ATTEMPT', path: request.nextUrl.pathname }
      });
      
      return {
        allowed: false,
        error: 'Forbidden - Admin access required',
        status: 403
      };
    }

    if (requireSuperAdmin && user.role !== 'SUPER_ADMIN') {
      await createAuditLog({
        userId: user.id,
        action: 'VIEW',
        entityType: 'User',
        ipAddress: getClientIP(request),
        changes: { attempt: 'INSUFFICIENT_PERMISSIONS', path: request.nextUrl.pathname }
      });
      
      return {
        allowed: false,
        error: 'Forbidden - Super Admin access required',
        status: 403
      };
    }

    // 4. Check IP allowlist (for SUPER_ADMIN)
    if (requireIPAllowlist && user.role === 'SUPER_ADMIN') {
      const clientIP = getClientIP(request);
      const ipAllowed = await isIPAllowed(clientIP);
      
      if (!ipAllowed) {
        await createAuditLog({
          userId: user.id,
          action: 'VIEW',
          entityType: 'System',
          ipAddress: clientIP,
          changes: { attempt: 'IP_NOT_ALLOWED', ip: clientIP, path: request.nextUrl.pathname }
        });
        
        return {
          allowed: false,
          error: 'Forbidden - IP address not authorized',
          status: 403
        };
      }
    }

    // 5. Check 2FA requirement (for SUPER_ADMIN)
    if (require2FA && user.role === 'SUPER_ADMIN') {
      if (!user.twoFactorEnabled) {
        return {
          allowed: false,
          error: 'Two-factor authentication must be enabled',
          status: 403
        };
      }

      // Check if 2FA verification is still valid (5 minutes)
      if (!is2FAVerificationValid(user.twoFactorVerifiedAt)) {
        // Check for 2FA code in header
        const twoFactorCode = request.headers.get('x-2fa-code');
        
        if (!twoFactorCode) {
          return {
            allowed: false,
            error: '2FA verification required',
            status: 403
          };
        }

        // Verify the 2FA code
        if (user.twoFactorSecret) {
          const decryptedSecret = decryptSecret(user.twoFactorSecret);
          const isValid = verifyTOTPCode(twoFactorCode, decryptedSecret);
          
          if (!isValid) {
            await createAuditLog({
              userId: user.id,
              action: 'VIEW',
              entityType: 'System',
              ipAddress: getClientIP(request),
              changes: { attempt: '2FA_VERIFICATION_FAILED', path: request.nextUrl.pathname }
            });
            
            return {
              allowed: false,
              error: 'Invalid 2FA code',
              status: 403
            };
          }

          // Update verification timestamp
          await prisma.user.update({
            where: { id: user.id },
            data: { twoFactorVerifiedAt: new Date() }
          });
        }
      }
    }

    // 6. Check CSRF token (for state-changing requests)
    if (requireCSRF) {
      const csrfValid = await requireCSRFToken(request, user.id);
      
      if (!csrfValid) {
        await createAuditLog({
          userId: user.id,
          action: 'VIEW',
          entityType: 'System',
          ipAddress: getClientIP(request),
          changes: { attempt: 'CSRF_VALIDATION_FAILED', path: request.nextUrl.pathname }
        });
        
        return {
          allowed: false,
          error: 'CSRF token validation failed',
          status: 403
        };
      }
    }

    // 7. Check rate limiting
    if (rateLimit) {
      const rateLimitConfig = 
        rateLimit === 'sensitive' ? RATE_LIMITS.ADMIN_SENSITIVE :
        rateLimit === 'mutations' ? RATE_LIMITS.ADMIN_MUTATIONS :
        RATE_LIMITS.GENERAL;

      const identifier = `admin:${user.id}`;
      const rateLimitResult = checkRateLimit(identifier, rateLimitConfig);

      if (!rateLimitResult.allowed) {
        await createAuditLog({
          userId: user.id,
          action: 'VIEW',
          entityType: 'System',
          ipAddress: getClientIP(request),
          changes: { 
            attempt: 'RATE_LIMIT_EXCEEDED',
            resetIn: rateLimitResult.resetIn,
            limit: rateLimit,
            path: request.nextUrl.pathname
          }
        });
        
        return {
          allowed: false,
          error: rateLimitConfig.message || 'Rate limit exceeded',
          status: 429
        };
      }
    }

    // All checks passed
    return {
      allowed: true,
      user
    };

  } catch (error) {
    console.error('Security check error:', error);
    return {
      allowed: false,
      error: 'Security check failed',
      status: 500
    };
  }
}

/**
 * Helper to create security error response
 */
export function createSecurityErrorResponse(result: SecurityCheckResult): NextResponse {
  return NextResponse.json(
    { error: result.error },
    { status: result.status || 500 }
  );
}
