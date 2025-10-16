/**
 * Login Anomaly Detection
 * Detects suspicious login patterns and potential security threats
 */

import { prisma } from '@/lib/data';
import { NextRequest } from 'next/server';

interface AnomalyCheckResult {
  isAnomalous: boolean;
  reasons: string[];
  riskScore: number; // 0-100
  shouldBlock: boolean;
}

interface LoginAttemptData {
  email: string;
  ipAddress: string;
  userAgent: string;
  successful: boolean;
  userId?: string;
  failureReason?: string;
  location?: {
    country?: string;
    city?: string;
    lat?: number;
    lng?: number;
  };
}

const MAX_FAILED_ATTEMPTS = 5;
const FAILED_ATTEMPT_WINDOW = 15 * 60 * 1000; // 15 minutes
const HIGH_RISK_THRESHOLD = 70;

/**
 * Extract client information from request
 */
export function getClientInfo(request: NextRequest): {
  ipAddress: string;
  userAgent: string;
} {
  const ipAddress =
    request.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
    request.headers.get('x-real-ip') ||
    'unknown';

  const userAgent = request.headers.get('user-agent') || 'unknown';

  return { ipAddress, userAgent };
}

/**
 * Log login attempt
 */
export async function logLoginAttempt(
  data: LoginAttemptData
): Promise<void> {
  try {
    await prisma.loginAttempt.create({
      data: {
        userId: data.userId,
        email: data.email,
        ipAddress: data.ipAddress,
        userAgent: data.userAgent,
        successful: data.successful,
        failureReason: data.failureReason,
        location: data.location || {},
        deviceInfo: parseUserAgent(data.userAgent),
      },
    });
  } catch (error) {
    console.error('Error logging login attempt:', error);
  }
}

/**
 * Check for login anomalies
 */
export async function checkLoginAnomaly(
  email: string,
  ipAddress: string,
  userAgent: string
): Promise<AnomalyCheckResult> {
  const reasons: string[] = [];
  let riskScore = 0;

  try {
    // Get user's login history
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
      select: { id: true },
    });

    if (!user) {
      return {
        isAnomalous: false,
        reasons: [],
        riskScore: 0,
        shouldBlock: false,
      };
    }

    // Check 1: Too many recent failed attempts
    const recentFailures = await prisma.loginAttempt.findMany({
      where: {
        email: email.toLowerCase().trim(),
        successful: false,
        createdAt: {
          gte: new Date(Date.now() - FAILED_ATTEMPT_WINDOW),
        },
      },
    });

    if (recentFailures.length >= MAX_FAILED_ATTEMPTS) {
      reasons.push(
        `${recentFailures.length} failed attempts in last 15 minutes`
      );
      riskScore += 40;
    }

    // Check 2: New IP address
    const recentSuccessful = await prisma.loginAttempt.findMany({
      where: {
        userId: user.id,
        successful: true,
        createdAt: {
          gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });

    const knownIPs = new Set(recentSuccessful.map((a) => a.ipAddress));
    if (recentSuccessful.length > 0 && !knownIPs.has(ipAddress)) {
      reasons.push('Login from new IP address');
      riskScore += 20;
    }

    // Check 3: New device/user agent
    const knownUserAgents = new Set(recentSuccessful.map((a) => a.userAgent));
    if (recentSuccessful.length > 0 && !knownUserAgents.has(userAgent)) {
      reasons.push('Login from new device');
      riskScore += 15;
    }

    // Check 4: Impossible travel (logins from distant locations in short time)
    if (recentSuccessful.length > 0) {
      const lastLogin = recentSuccessful[0];
      const timeDiff = Date.now() - lastLogin.createdAt.getTime();
      
      // If last login was less than 1 hour ago from different IP
      if (timeDiff < 60 * 60 * 1000 && lastLogin.ipAddress !== ipAddress) {
        reasons.push('Rapid location change detected');
        riskScore += 25;
      }
    }

    // Check 5: Multiple accounts from same IP
    const sameIPAttempts = await prisma.loginAttempt.findMany({
      where: {
        ipAddress,
        createdAt: {
          gte: new Date(Date.now() - 60 * 60 * 1000), // Last hour
        },
      },
      select: { email: true },
      distinct: ['email'],
    });

    if (sameIPAttempts.length > 5) {
      reasons.push('Multiple accounts accessed from same IP');
      riskScore += 30;
    }

    const isAnomalous = riskScore > 0;
    const shouldBlock = riskScore >= HIGH_RISK_THRESHOLD;

    return {
      isAnomalous,
      reasons,
      riskScore,
      shouldBlock,
    };
  } catch (error) {
    console.error('Error checking login anomaly:', error);
    return {
      isAnomalous: false,
      reasons: [],
      riskScore: 0,
      shouldBlock: false,
    };
  }
}

/**
 * Parse user agent string
 */
function parseUserAgent(userAgent: string): object {
  // Simple parsing - in production, use a library like 'ua-parser-js'
  const ua = userAgent.toLowerCase();
  
  return {
    browser: ua.includes('chrome')
      ? 'Chrome'
      : ua.includes('firefox')
      ? 'Firefox'
      : ua.includes('safari')
      ? 'Safari'
      : ua.includes('edge')
      ? 'Edge'
      : 'Unknown',
    os: ua.includes('windows')
      ? 'Windows'
      : ua.includes('mac')
      ? 'macOS'
      : ua.includes('linux')
      ? 'Linux'
      : ua.includes('android')
      ? 'Android'
      : ua.includes('ios')
      ? 'iOS'
      : 'Unknown',
    device: ua.includes('mobile') ? 'Mobile' : 'Desktop',
  };
}

/**
 * Get failed login attempts for user
 */
export async function getFailedLoginAttempts(
  email: string,
  timeWindowMs: number = FAILED_ATTEMPT_WINDOW
): Promise<number> {
  try {
    return await prisma.loginAttempt.count({
      where: {
        email: email.toLowerCase().trim(),
        successful: false,
        createdAt: {
          gte: new Date(Date.now() - timeWindowMs),
        },
      },
    });
  } catch (error) {
    console.error('Error getting failed login attempts:', error);
    return 0;
  }
}

/**
 * Check if account should be locked
 */
export async function shouldLockAccount(email: string): Promise<boolean> {
  const failedAttempts = await getFailedLoginAttempts(email);
  return failedAttempts >= MAX_FAILED_ATTEMPTS;
}

/**
 * Clean up old login attempts (maintenance)
 */
export async function cleanupOldLoginAttempts(daysOld: number = 90): Promise<void> {
  try {
    const cutoffDate = new Date(Date.now() - daysOld * 24 * 60 * 60 * 1000);
    
    await prisma.loginAttempt.deleteMany({
      where: {
        createdAt: {
          lt: cutoffDate,
        },
      },
    });
  } catch (error) {
    console.error('Error cleaning up login attempts:', error);
  }
}
