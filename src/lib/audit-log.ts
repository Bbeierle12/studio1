import { prisma } from '@/lib/data';

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
  | 'EXPORT';

export type EntityType = 
  | 'User' 
  | 'Recipe' 
  | 'Collection' 
  | 'Settings' 
  | 'FeatureFlag' 
  | 'System';

interface AuditLogData {
  userId: string;
  action: AuditAction;
  entityType: EntityType;
  entityId?: string;
  changes?: any;
  ipAddress?: string;
  userAgent?: string;
}

export async function createAuditLog(data: AuditLogData) {
  try {
    await prisma.auditLog.create({
      data: {
        userId: data.userId,
        action: data.action,
        entityType: data.entityType,
        entityId: data.entityId,
        changes: data.changes ? JSON.parse(JSON.stringify(data.changes)) : null,
        ipAddress: data.ipAddress,
        userAgent: data.userAgent,
      },
    });
  } catch (error) {
    console.error('Failed to create audit log:', error);
    // Don't throw error - audit logging should not break the app
  }
}

export async function getAuditLogs(filters?: {
  userId?: string;
  entityType?: EntityType;
  action?: AuditAction;
  startDate?: Date;
  endDate?: Date;
  limit?: number;
  offset?: number;
}) {
  const where: any = {};

  if (filters?.userId) {
    where.userId = filters.userId;
  }

  if (filters?.entityType) {
    where.entityType = filters.entityType;
  }

  if (filters?.action) {
    where.action = filters.action;
  }

  if (filters?.startDate || filters?.endDate) {
    where.createdAt = {};
    if (filters.startDate) {
      where.createdAt.gte = filters.startDate;
    }
    if (filters.endDate) {
      where.createdAt.lte = filters.endDate;
    }
  }

  const logs = await prisma.auditLog.findMany({
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
    take: filters?.limit || 50,
    skip: filters?.offset || 0,
  });

  const total = await prisma.auditLog.count({ where });

  return {
    logs,
    total,
    limit: filters?.limit || 50,
    offset: filters?.offset || 0,
  };
}

export async function getUserAuditHistory(userId: string, limit: number = 20) {
  return prisma.auditLog.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    take: limit,
  });
}

export async function getEntityAuditHistory(entityType: EntityType, entityId: string, limit: number = 20) {
  return prisma.auditLog.findMany({
    where: { 
      entityType,
      entityId,
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
    take: limit,
  });
}
