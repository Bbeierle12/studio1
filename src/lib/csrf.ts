/**
 * CSRF (Cross-Site Request Forgery) Protection
 * Token-based protection for admin state-changing operations
 */

import { prisma } from '@/lib/data';
import * as crypto from 'crypto';
import { NextRequest } from 'next/server';

const CSRF_TOKEN_EXPIRY = 60 * 60 * 1000; // 1 hour

/**
 * Generate a new CSRF token for a user
 */
export async function generateCSRFToken(userId: string): Promise<string> {
  const token = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + CSRF_TOKEN_EXPIRY);
  
  await prisma.csrfToken.create({
    data: {
      token,
      userId,
      expiresAt
    }
  });
  
  return token;
}

/**
 * Verify CSRF token
 */
export async function verifyCSRFToken(
  token: string,
  userId: string
): Promise<boolean> {
  try {
    const csrfToken = await prisma.csrfToken.findFirst({
      where: {
        token,
        userId,
        expiresAt: { gt: new Date() }
      }
    });
    
    if (!csrfToken) {
      return false;
    }
    
    // Delete token after use (one-time use)
    await prisma.csrfToken.delete({
      where: { id: csrfToken.id }
    });
    
    return true;
  } catch (error) {
    console.error('Error verifying CSRF token:', error);
    return false;
  }
}

/**
 * Extract CSRF token from request
 */
export function getCSRFTokenFromRequest(request: NextRequest): string | null {
  // Check header first (preferred for API calls)
  const headerToken = request.headers.get('x-csrf-token');
  if (headerToken) return headerToken;
  
  // Check query parameter (for form submissions)
  const queryToken = request.nextUrl.searchParams.get('csrf_token');
  if (queryToken) return queryToken;
  
  return null;
}

/**
 * Clean up expired CSRF tokens
 */
export async function cleanupExpiredCSRFTokens(): Promise<void> {
  await prisma.csrfToken.deleteMany({
    where: {
      expiresAt: { lt: new Date() }
    }
  });
}

/**
 * Middleware helper to verify CSRF on state-changing requests
 */
export async function requireCSRFToken(
  request: NextRequest,
  userId: string
): Promise<boolean> {
  const method = request.method;
  
  // Only require CSRF for state-changing methods
  if (!['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
    return true;
  }
  
  const token = getCSRFTokenFromRequest(request);
  
  if (!token) {
    return false;
  }
  
  return await verifyCSRFToken(token, userId);
}
