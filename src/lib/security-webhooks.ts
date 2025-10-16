/**
 * Security Event Webhooks
 * Triggers webhooks for security events and notifications
 */

import { prisma } from '@/lib/data';
import crypto from 'crypto';

export type SecurityEventType =
  | 'password_changed'
  | 'password_reset_requested'
  | '2fa_enabled'
  | '2fa_disabled'
  | 'login_success'
  | 'login_failed'
  | 'login_anomaly'
  | 'account_locked'
  | 'account_unlocked'
  | 'webauthn_added'
  | 'webauthn_removed'
  | 'role_changed'
  | 'account_deleted'
  | 'suspicious_activity';

export type SecurityEventSeverity = 'low' | 'medium' | 'high' | 'critical';

export interface SecurityEventData {
  userId?: string;
  eventType: SecurityEventType;
  severity: SecurityEventSeverity;
  description: string;
  metadata?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
}

/**
 * Create and log security event
 */
export async function createSecurityEvent(
  data: SecurityEventData
): Promise<void> {
  try {
    const event = await prisma.securityEvent.create({
      data: {
        userId: data.userId,
        eventType: data.eventType,
        severity: data.severity,
        description: data.description,
        metadata: data.metadata || {},
        ipAddress: data.ipAddress,
        userAgent: data.userAgent,
        notified: false,
      },
    });

    // Trigger webhooks asynchronously
    void triggerWebhooks(event.id, data.eventType);
  } catch (error) {
    console.error('Error creating security event:', error);
  }
}

/**
 * Trigger webhooks for security event
 */
async function triggerWebhooks(
  eventId: string,
  eventType: SecurityEventType
): Promise<void> {
  try {
    // Get active webhooks that listen for this event type
    const webhooks = await prisma.auditWebhook.findMany({
      where: {
        isActive: true,
        events: {
          has: eventType,
        },
      },
    });

    if (webhooks.length === 0) {
      return;
    }

    // Get event details
    const event = await prisma.securityEvent.findUnique({
      where: { id: eventId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
            role: true,
          },
        },
      },
    });

    if (!event) {
      return;
    }

    // Trigger each webhook
    const webhookPromises = webhooks.map((webhook) =>
      sendWebhook(webhook, event)
    );

    await Promise.allSettled(webhookPromises);

    // Mark event as notified
    await prisma.securityEvent.update({
      where: { id: eventId },
      data: { notified: true },
    });
  } catch (error) {
    console.error('Error triggering webhooks:', error);
  }
}

/**
 * Send webhook notification
 */
async function sendWebhook(webhook: any, event: any): Promise<void> {
  try {
    const payload = {
      eventId: event.id,
      eventType: event.eventType,
      severity: event.severity,
      description: event.description,
      timestamp: event.createdAt,
      user: event.user
        ? {
            id: event.user.id,
            email: event.user.email,
            name: event.user.name,
            role: event.user.role,
          }
        : null,
      metadata: event.metadata,
      ipAddress: event.ipAddress,
      userAgent: event.userAgent,
    };

    // Sign payload if secret is configured
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'User-Agent': 'RecipeHub-Security-Webhook/1.0',
    };

    if (webhook.secret) {
      const signature = generateSignature(payload, webhook.secret);
      headers['X-Webhook-Signature'] = signature;
    }

    // Send webhook
    const response = await fetch(webhook.url, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(10000), // 10 second timeout
    });

    if (!response.ok) {
      throw new Error(`Webhook failed: ${response.status}`);
    }

    // Update webhook stats
    await prisma.auditWebhook.update({
      where: { id: webhook.id },
      data: {
        lastTrigger: new Date(),
        failureCount: 0, // Reset on success
      },
    });
  } catch (error) {
    console.error(`Webhook ${webhook.name} failed:`, error);

    // Increment failure count
    await prisma.auditWebhook.update({
      where: { id: webhook.id },
      data: {
        failureCount: { increment: 1 },
      },
    });

    // Disable webhook after 10 consecutive failures
    const updatedWebhook = await prisma.auditWebhook.findUnique({
      where: { id: webhook.id },
    });

    if (updatedWebhook && updatedWebhook.failureCount >= 10) {
      await prisma.auditWebhook.update({
        where: { id: webhook.id },
        data: { isActive: false },
      });
    }
  }
}

/**
 * Generate HMAC signature for webhook payload
 */
function generateSignature(payload: any, secret: string): string {
  const hmac = crypto.createHmac('sha256', secret);
  hmac.update(JSON.stringify(payload));
  return `sha256=${hmac.digest('hex')}`;
}

/**
 * Verify webhook signature
 */
export function verifyWebhookSignature(
  payload: any,
  signature: string,
  secret: string
): boolean {
  const expectedSignature = generateSignature(payload, secret);
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  );
}

/**
 * Get security events for user
 */
export async function getUserSecurityEvents(
  userId: string,
  limit: number = 50
) {
  try {
    return await prisma.securityEvent.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  } catch (error) {
    console.error('Error getting user security events:', error);
    return [];
  }
}

/**
 * Get all recent security events
 */
export async function getRecentSecurityEvents(limit: number = 100) {
  try {
    return await prisma.securityEvent.findMany({
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
      },
    });
  } catch (error) {
    console.error('Error getting recent security events:', error);
    return [];
  }
}

/**
 * Clean up old security events (maintenance)
 */
export async function cleanupOldSecurityEvents(
  daysOld: number = 90
): Promise<void> {
  try {
    const cutoffDate = new Date(Date.now() - daysOld * 24 * 60 * 60 * 1000);

    await prisma.securityEvent.deleteMany({
      where: {
        createdAt: {
          lt: cutoffDate,
        },
      },
    });
  } catch (error) {
    console.error('Error cleaning up security events:', error);
  }
}

/**
 * Helper functions for common security events
 */

export async function logPasswordChange(
  userId: string,
  ipAddress?: string,
  userAgent?: string
): Promise<void> {
  await createSecurityEvent({
    userId,
    eventType: 'password_changed',
    severity: 'medium',
    description: 'User password was changed',
    ipAddress,
    userAgent,
  });
}

export async function log2FAEnabled(
  userId: string,
  ipAddress?: string,
  userAgent?: string
): Promise<void> {
  await createSecurityEvent({
    userId,
    eventType: '2fa_enabled',
    severity: 'medium',
    description: 'Two-factor authentication was enabled',
    ipAddress,
    userAgent,
  });
}

export async function logLoginAnomaly(
  userId: string,
  reasons: string[],
  riskScore: number,
  ipAddress?: string,
  userAgent?: string
): Promise<void> {
  await createSecurityEvent({
    userId,
    eventType: 'login_anomaly',
    severity: riskScore >= 70 ? 'high' : 'medium',
    description: 'Suspicious login activity detected',
    metadata: { reasons, riskScore },
    ipAddress,
    userAgent,
  });
}

export async function logAccountLocked(
  userId: string,
  reason: string,
  ipAddress?: string
): Promise<void> {
  await createSecurityEvent({
    userId,
    eventType: 'account_locked',
    severity: 'high',
    description: `Account locked: ${reason}`,
    ipAddress,
  });
}
