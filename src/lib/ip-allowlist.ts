/**
 * IP Allowlist Utilities
 * Restrict admin access to approved IP addresses
 */

import { prisma } from '@/lib/data';
import { NextRequest } from 'next/server';

/**
 * Get client IP address from request
 */
export function getClientIP(request: NextRequest): string {
  // Try various headers for proxied requests
  const forwarded = request.headers.get('x-forwarded-for');
  const realIp = request.headers.get('x-real-ip');
  const cfConnectingIp = request.headers.get('cf-connecting-ip');
  
  if (forwarded) {
    // x-forwarded-for can contain multiple IPs, take the first
    return forwarded.split(',')[0].trim();
  }
  
  if (realIp) {
    return realIp.trim();
  }
  
  if (cfConnectingIp) {
    return cfConnectingIp.trim();
  }
  
  // Fallback (for local development)
  return '127.0.0.1';
}

/**
 * Check if IP is in allowlist
 */
export async function isIPAllowed(ipAddress: string): Promise<boolean> {
  try {
    // Allow localhost for development
    if (ipAddress === '127.0.0.1' || ipAddress === '::1' || ipAddress.startsWith('192.168.')) {
      return true;
    }
    
    const allowedIP = await prisma.adminIpAllowlist.findFirst({
      where: {
        ipAddress,
        isActive: true,
        OR: [
          { expiresAt: null },
          { expiresAt: { gt: new Date() } }
        ]
      }
    });
    
    return !!allowedIP;
  } catch (error) {
    console.error('Error checking IP allowlist:', error);
    // Fail open for database errors to prevent lockout
    return true;
  }
}

/**
 * Add IP to allowlist
 */
export async function addIPToAllowlist(
  ipAddress: string,
  addedBy: string,
  description?: string,
  expiresAt?: Date
): Promise<void> {
  await prisma.adminIpAllowlist.upsert({
    where: { ipAddress },
    update: {
      isActive: true,
      description,
      expiresAt,
      addedBy,
      updatedAt: new Date()
    },
    create: {
      ipAddress,
      description,
      addedBy,
      expiresAt,
      isActive: true
    }
  });
}

/**
 * Remove IP from allowlist
 */
export async function removeIPFromAllowlist(ipAddress: string): Promise<void> {
  await prisma.adminIpAllowlist.update({
    where: { ipAddress },
    data: { isActive: false }
  });
}

/**
 * Get all allowed IPs
 */
export async function getAllowedIPs(): Promise<any[]> {
  return await prisma.adminIpAllowlist.findMany({
    where: { isActive: true },
    orderBy: { createdAt: 'desc' }
  });
}

/**
 * Clean up expired IPs
 */
export async function cleanupExpiredIPs(): Promise<void> {
  await prisma.adminIpAllowlist.updateMany({
    where: {
      expiresAt: { lt: new Date() },
      isActive: true
    },
    data: { isActive: false }
  });
}
