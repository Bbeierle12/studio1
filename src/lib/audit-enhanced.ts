/**
 * Enhanced Audit Log Utilities
 * Full-text search, webhooks, and investigation features
 */

import { prisma } from '@/lib/data';
import crypto from 'crypto';

export type AuditAction = 
  | 'CREATE' 
  | 'UPDATE' 
  | 'DELETE' 
  | 'VIEW' 
  | 'LOGIN' 
  | 'LOGOUT' 
  | 'ROLE_CHANGE' 
  | 'SUSPEND' 
  | 'ACTIVATE'
  | 'FEATURE'
  | 'UNFEATURE'
  | 'EXPORT'
  | 'IMPORT'
  | 'DOWNLOAD'
  | 'UPLOAD';

export type EntityType = 
  | 'User' 
  | 'Recipe' 
  | 'Collection' 
  | 'Settings' 
  | 'FeatureFlag' 
  | 'System'
  | 'MealPlan'
  | 'ShoppingList';

export type QuickRange = 
  | 'today'
  | 'yesterday'
  | 'last7days'
  | 'last30days'
  | 'last90days'
  | 'thisMonth'
  | 'lastMonth'
  | 'custom';

interface AuditLogData {
  userId: string;
  action: AuditAction;
  entityType: EntityType;
  entityId?: string;
  changes?: any;
  ipAddress?: string;
  userAgent?: string;
}

interface AuditSearchFilters {
  userId?: string;
  entityType?: EntityType;
  action?: AuditAction;
  startDate?: Date;
  endDate?: Date;
  quickRange?: QuickRange;
  search?: string; // Full-text search
  ipAddress?: string;
  limit?: number;
  offset?: number;
}

/**
 * Get date range for quick range filters
 */
export function getDateRangeForQuickRange(range: QuickRange): { startDate: Date; endDate: Date } | null {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  
  switch (range) {
    case 'today':
      return {
        startDate: today,
        endDate: new Date(today.getTime() + 24 * 60 * 60 * 1000 - 1)
      };
    
    case 'yesterday':
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      return {
        startDate: yesterday,
        endDate: new Date(yesterday.getTime() + 24 * 60 * 60 * 1000 - 1)
      };
    
    case 'last7days':
      const last7 = new Date(today);
      last7.setDate(last7.getDate() - 7);
      return {
        startDate: last7,
        endDate: now
      };
    
    case 'last30days':
      const last30 = new Date(today);
      last30.setDate(last30.getDate() - 30);
      return {
        startDate: last30,
        endDate: now
      };
    
    case 'last90days':
      const last90 = new Date(today);
      last90.setDate(last90.getDate() - 90);
      return {
        startDate: last90,
        endDate: now
      };
    
    case 'thisMonth':
      return {
        startDate: new Date(now.getFullYear(), now.getMonth(), 1),
        endDate: now
      };
    
    case 'lastMonth':
      const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);
      return {
        startDate: lastMonth,
        endDate: lastMonthEnd
      };
    
    default:
      return null;
  }
}

/**
 * Create audit log with webhook triggers
 */
export async function createAuditLog(data: AuditLogData) {
  try {
    const log = await prisma.auditLog.create({
      data: {
        userId: data.userId,
        action: data.action,
        entityType: data.entityType,
        entityId: data.entityId,
        changes: data.changes ? JSON.parse(JSON.stringify(data.changes)) : null,
        ipAddress: data.ipAddress,
        userAgent: data.userAgent,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
      },
    });

    // Trigger webhooks asynchronously
    triggerAuditWebhooks(log).catch(err => {
      console.error('Webhook trigger error:', err);
    });

    return log;
  } catch (error) {
    console.error('Failed to create audit log:', error);
    // Don't throw error - audit logging should not break the app
  }
}

/**
 * Enhanced audit log search with full-text search
 */
export async function searchAuditLogs(filters: AuditSearchFilters) {
  const where: any = {};

  // User filter
  if (filters.userId) {
    where.userId = filters.userId;
  }

  // Entity type filter
  if (filters.entityType) {
    where.entityType = filters.entityType;
  }

  // Action filter
  if (filters.action) {
    where.action = filters.action;
  }

  // IP address filter
  if (filters.ipAddress) {
    where.ipAddress = { contains: filters.ipAddress };
  }

  // Date range filter
  if (filters.quickRange && filters.quickRange !== 'custom') {
    const range = getDateRangeForQuickRange(filters.quickRange);
    if (range) {
      where.createdAt = {
        gte: range.startDate,
        lte: range.endDate,
      };
    }
  } else if (filters.startDate || filters.endDate) {
    where.createdAt = {};
    if (filters.startDate) {
      where.createdAt.gte = filters.startDate;
    }
    if (filters.endDate) {
      where.createdAt.lte = filters.endDate;
    }
  }

  // Full-text search (searches in user email, entity ID, IP, user agent, changes JSON)
  if (filters.search && filters.search.trim()) {
    where.OR = [
      {
        user: {
          email: { contains: filters.search, mode: 'insensitive' },
        },
      },
      {
        user: {
          name: { contains: filters.search, mode: 'insensitive' },
        },
      },
      {
        entityId: { contains: filters.search, mode: 'insensitive' },
      },
      {
        ipAddress: { contains: filters.search, mode: 'insensitive' },
      },
      {
        userAgent: { contains: filters.search, mode: 'insensitive' },
      },
    ];
  }

  const [logs, total] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: filters.limit || 50,
      skip: filters.offset || 0,
    }),
    prisma.auditLog.count({ where }),
  ]);

  return {
    logs,
    total,
    limit: filters.limit || 50,
    offset: filters.offset || 0,
  };
}

/**
 * Export audit logs to CSV
 */
export function exportToCSV(logs: any[]): string {
  const headers = [
    'Timestamp',
    'Action',
    'User Email',
    'User Name',
    'User Role',
    'Entity Type',
    'Entity ID',
    'IP Address',
    'User Agent',
    'Changes',
  ];

  const rows = logs.map(log => [
    new Date(log.createdAt).toISOString(),
    log.action,
    log.user?.email || '',
    log.user?.name || '',
    log.user?.role || '',
    log.entityType,
    log.entityId || '',
    log.ipAddress || '',
    log.userAgent || '',
    log.changes ? JSON.stringify(log.changes) : '',
  ]);

  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')),
  ].join('\n');

  return csvContent;
}

/**
 * Export audit logs to JSON
 */
export function exportToJSON(logs: any[]): string {
  return JSON.stringify(logs, null, 2);
}

/**
 * Get investigation context for an audit log
 * Returns related logs and entity details
 */
export async function getInvestigationContext(logId: string) {
  const log = await prisma.auditLog.findUnique({
    where: { id: logId },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          isActive: true,
          lastLogin: true,
        },
      },
    },
  });

  if (!log) {
    return null;
  }

  // Get related logs
  const [
    relatedByUser,
    relatedByEntity,
    relatedByIP,
    recentByUser,
  ] = await Promise.all([
    // Logs by same user around the same time
    prisma.auditLog.findMany({
      where: {
        userId: log.userId,
        createdAt: {
          gte: new Date(new Date(log.createdAt).getTime() - 60 * 60 * 1000), // 1 hour before
          lte: new Date(new Date(log.createdAt).getTime() + 60 * 60 * 1000), // 1 hour after
        },
        id: { not: log.id },
      },
      include: {
        user: {
          select: {
            email: true,
            name: true,
            role: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 10,
    }),

    // Logs for same entity
    log.entityId
      ? prisma.auditLog.findMany({
          where: {
            entityType: log.entityType,
            entityId: log.entityId,
            id: { not: log.id },
          },
          include: {
            user: {
              select: {
                email: true,
                name: true,
                role: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
          take: 10,
        })
      : Promise.resolve([]),

    // Logs from same IP
    log.ipAddress
      ? prisma.auditLog.findMany({
          where: {
            ipAddress: log.ipAddress,
            id: { not: log.id },
          },
          include: {
            user: {
              select: {
                email: true,
                name: true,
                role: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
          take: 10,
        })
      : Promise.resolve([]),

    // Recent activity by user
    prisma.auditLog.findMany({
      where: {
        userId: log.userId,
      },
      orderBy: { createdAt: 'desc' },
      take: 20,
    }),
  ]);

  // Get entity details if available
  let entityDetails = null;
  if (log.entityId) {
    try {
      switch (log.entityType) {
        case 'User':
          entityDetails = await prisma.user.findUnique({
            where: { id: log.entityId },
            select: {
              id: true,
              email: true,
              name: true,
              role: true,
              isActive: true,
              lastLogin: true,
              createdAt: true,
            },
          });
          break;
        
        case 'Recipe':
          entityDetails = await prisma.recipe.findUnique({
            where: { id: log.entityId },
            select: {
              id: true,
              title: true,
              contributor: true,
              userId: true,
              createdAt: true,
              updatedAt: true,
            },
          });
          break;
        
        // Add other entity types as needed
      }
    } catch (error) {
      console.error('Error fetching entity details:', error);
    }
  }

  return {
    log,
    context: {
      relatedByUser,
      relatedByEntity,
      relatedByIP,
      recentByUser,
      entityDetails,
    },
    stats: {
      totalLogsByUser: await prisma.auditLog.count({ where: { userId: log.userId } }),
      totalLogsByIP: log.ipAddress ? await prisma.auditLog.count({ where: { ipAddress: log.ipAddress } }) : 0,
      totalLogsForEntity: log.entityId
        ? await prisma.auditLog.count({ where: { entityType: log.entityType, entityId: log.entityId } })
        : 0,
    },
  };
}

/**
 * Trigger webhooks for audit log events
 */
async function triggerAuditWebhooks(log: any) {
  // Get active webhooks that listen for this event
  const webhooks = await prisma.auditWebhook.findMany({
    where: {
      isActive: true,
      events: {
        hasSome: [log.action, 'ALL'],
      },
    },
  });

  for (const webhook of webhooks) {
    try {
      const payload = {
        id: log.id,
        timestamp: log.createdAt,
        action: log.action,
        entityType: log.entityType,
        entityId: log.entityId,
        user: {
          id: log.user.id,
          email: log.user.email,
          name: log.user.name,
          role: log.user.role,
        },
        changes: log.changes,
        ipAddress: log.ipAddress,
        userAgent: log.userAgent,
      };

      const body = JSON.stringify(payload);
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'User-Agent': 'AuditLog-Webhook/1.0',
      };

      // Add signature if secret is configured
      if (webhook.secret) {
        const signature = crypto
          .createHmac('sha256', webhook.secret)
          .update(body)
          .digest('hex');
        headers['X-Audit-Signature'] = `sha256=${signature}`;
      }

      const response = await fetch(webhook.url, {
        method: 'POST',
        headers,
        body,
      });

      if (!response.ok) {
        throw new Error(`Webhook failed: ${response.status}`);
      }

      // Update success
      await prisma.auditWebhook.update({
        where: { id: webhook.id },
        data: {
          lastTrigger: new Date(),
          failureCount: 0,
        },
      });
    } catch (error) {
      console.error(`Webhook ${webhook.name} failed:`, error);
      
      // Increment failure count
      await prisma.auditWebhook.update({
        where: { id: webhook.id },
        data: {
          failureCount: { increment: 1 },
          lastTrigger: new Date(),
        },
      });

      // Disable webhook after 10 consecutive failures
      if (webhook.failureCount >= 9) {
        await prisma.auditWebhook.update({
          where: { id: webhook.id },
          data: { isActive: false },
        });
      }
    }
  }
}

/**
 * Get audit statistics
 */
export async function getAuditStatistics(filters: AuditSearchFilters) {
  const where: any = {};

  if (filters.userId) where.userId = filters.userId;
  if (filters.entityType) where.entityType = filters.entityType;
  if (filters.startDate || filters.endDate) {
    where.createdAt = {};
    if (filters.startDate) where.createdAt.gte = filters.startDate;
    if (filters.endDate) where.createdAt.lte = filters.endDate;
  }

  const [
    totalLogs,
    actionBreakdown,
    entityBreakdown,
    topUsers,
    topIPs,
  ] = await Promise.all([
    prisma.auditLog.count({ where }),
    
    prisma.auditLog.groupBy({
      by: ['action'],
      where,
      _count: true,
      orderBy: { _count: { action: 'desc' } },
    }),
    
    prisma.auditLog.groupBy({
      by: ['entityType'],
      where,
      _count: true,
      orderBy: { _count: { entityType: 'desc' } },
    }),
    
    prisma.auditLog.groupBy({
      by: ['userId'],
      where,
      _count: true,
      orderBy: { _count: { userId: 'desc' } },
      take: 10,
    }),
    
    prisma.auditLog.groupBy({
      by: ['ipAddress'],
      where: { ...where, ipAddress: { not: null } },
      _count: true,
      orderBy: { _count: { ipAddress: 'desc' } },
      take: 10,
    }),
  ]);

  return {
    totalLogs,
    actionBreakdown,
    entityBreakdown,
    topUsers,
    topIPs,
  };
}
