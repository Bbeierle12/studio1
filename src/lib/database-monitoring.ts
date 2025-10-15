import { prisma } from '@/lib/prisma';
import { createHash } from 'crypto';

// Types for database monitoring
export interface SlowQuery {
  id: string;
  query: string;
  duration: number;
  timestamp: Date;
  table: string;
  operation: 'SELECT' | 'INSERT' | 'UPDATE' | 'DELETE';
  userId?: string;
  metadata?: Record<string, any>;
}

export interface MigrationStatus {
  status: 'synced' | 'drift' | 'pending' | 'error';
  appliedMigrations: string[];
  pendingMigrations: string[];
  driftDetails?: string[];
  lastChecked: Date;
}

export interface StorageMetrics {
  timestamp: Date;
  totalSize: number; // in MB
  tables: {
    name: string;
    size: number; // in MB
    rowCount: number;
    indexSize: number; // in MB
  }[];
  growthRate: number; // % per day
  projectedFull?: Date; // When storage might be exhausted
}

export interface QueryPerformanceMetrics {
  avgResponseTime: number;
  p95ResponseTime: number;
  p99ResponseTime: number;
  slowQueryCount: number;
  totalQueries: number;
  errorRate: number;
  topSlowQueries: SlowQuery[];
}

// Query monitoring class
export class DatabaseMonitor {
  private static instance: DatabaseMonitor;
  private slowQueries: SlowQuery[] = [];
  private queryMetrics: Map<string, number[]> = new Map();
  private storageHistory: StorageMetrics[] = [];

  private constructor() {}

  public static getInstance(): DatabaseMonitor {
    if (!DatabaseMonitor.instance) {
      DatabaseMonitor.instance = new DatabaseMonitor();
    }
    return DatabaseMonitor.instance;
  }

  // Record query performance
  public recordQuery(
    query: string,
    duration: number,
    table: string,
    operation: 'SELECT' | 'INSERT' | 'UPDATE' | 'DELETE',
    userId?: string
  ): void {
    const queryHash = this.hashQuery(query);

    // Store query metrics
    if (!this.queryMetrics.has(queryHash)) {
      this.queryMetrics.set(queryHash, []);
    }
    this.queryMetrics.get(queryHash)?.push(duration);

    // Track slow queries (> 1000ms)
    if (duration > 1000) {
      const slowQuery: SlowQuery = {
        id: createHash('md5').update(`${query}-${Date.now()}`).digest('hex'),
        query: this.sanitizeQuery(query),
        duration,
        timestamp: new Date(),
        table,
        operation,
        userId,
      };

      this.slowQueries.push(slowQuery);

      // Keep only last 100 slow queries
      if (this.slowQueries.length > 100) {
        this.slowQueries = this.slowQueries.slice(-100);
      }
    }
  }

  // Get top slow queries
  public async getTopSlowQueries(limit: number = 10): Promise<SlowQuery[]> {
    // In production, this would query from a proper monitoring table
    return this.slowQueries
      .sort((a, b) => b.duration - a.duration)
      .slice(0, limit);
  }

  // Check migration status
  public async checkMigrationStatus(): Promise<MigrationStatus> {
    try {
      // Check if migrations table exists and get applied migrations
      const appliedMigrations = await prisma.$queryRaw<Array<{ migration_name: string }>>`
        SELECT migration_name FROM _prisma_migrations
        WHERE finished_at IS NOT NULL
        ORDER BY finished_at DESC
      `;

      // In production, compare with migration files in prisma/migrations
      const migrationNames = appliedMigrations.map(m => m.migration_name);

      // Check for schema drift by validating schema
      let driftDetails: string[] = [];
      try {
        // This would compare actual DB schema with Prisma schema
        await prisma.$queryRaw`SELECT 1`;
      } catch (error) {
        driftDetails.push('Schema validation failed');
      }

      return {
        status: driftDetails.length > 0 ? 'drift' : 'synced',
        appliedMigrations: migrationNames,
        pendingMigrations: [],
        driftDetails: driftDetails.length > 0 ? driftDetails : undefined,
        lastChecked: new Date(),
      };
    } catch (error) {
      console.error('Failed to check migration status:', error);
      return {
        status: 'error',
        appliedMigrations: [],
        pendingMigrations: [],
        lastChecked: new Date(),
      };
    }
  }

  // Get storage metrics
  public async getStorageMetrics(): Promise<StorageMetrics> {
    try {
      // Get table sizes (PostgreSQL specific)
      const tableSizes = await prisma.$queryRaw<Array<{
        table_name: string;
        total_size: bigint;
        row_count: bigint;
        index_size: bigint;
      }>>`
        SELECT
          schemaname || '.' || tablename AS table_name,
          pg_total_relation_size(schemaname||'.'||tablename) AS total_size,
          n_live_tup AS row_count,
          pg_indexes_size(schemaname||'.'||tablename) AS index_size
        FROM pg_stat_user_tables
        ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC
      `;

      const tables = tableSizes.map(t => ({
        name: t.table_name.split('.')[1] || t.table_name,
        size: Number(t.total_size) / (1024 * 1024), // Convert to MB
        rowCount: Number(t.row_count),
        indexSize: Number(t.index_size) / (1024 * 1024), // Convert to MB
      }));

      const totalSize = tables.reduce((sum, t) => sum + t.size, 0);

      // Calculate growth rate
      const previousMetric = this.storageHistory[this.storageHistory.length - 1];
      let growthRate = 0;
      if (previousMetric) {
        const timeDiff = Date.now() - previousMetric.timestamp.getTime();
        const daysDiff = timeDiff / (1000 * 60 * 60 * 24);
        growthRate = ((totalSize - previousMetric.totalSize) / previousMetric.totalSize) * 100 / daysDiff;
      }

      const metrics: StorageMetrics = {
        timestamp: new Date(),
        totalSize,
        tables,
        growthRate,
      };

      // Store in history
      this.storageHistory.push(metrics);
      if (this.storageHistory.length > 30) {
        this.storageHistory = this.storageHistory.slice(-30);
      }

      // Calculate projected full date if growth rate is positive
      if (growthRate > 0) {
        const maxStorage = parseInt(process.env.MAX_DB_SIZE_MB || '10000');
        const remainingSpace = maxStorage - totalSize;
        const daysUntilFull = remainingSpace / (totalSize * growthRate / 100);
        metrics.projectedFull = new Date(Date.now() + daysUntilFull * 24 * 60 * 60 * 1000);
      }

      return metrics;
    } catch (error) {
      console.error('Failed to get storage metrics:', error);
      // Return mock data for non-PostgreSQL databases
      return {
        timestamp: new Date(),
        totalSize: 0,
        tables: [],
        growthRate: 0,
      };
    }
  }

  // Get query performance metrics
  public async getPerformanceMetrics(): Promise<QueryPerformanceMetrics> {
    const allDurations: number[] = [];
    for (const durations of this.queryMetrics.values()) {
      allDurations.push(...durations);
    }

    allDurations.sort((a, b) => a - b);

    const avgResponseTime = allDurations.length > 0
      ? allDurations.reduce((sum, d) => sum + d, 0) / allDurations.length
      : 0;

    const p95Index = Math.floor(allDurations.length * 0.95);
    const p99Index = Math.floor(allDurations.length * 0.99);

    return {
      avgResponseTime: Math.round(avgResponseTime),
      p95ResponseTime: allDurations[p95Index] || 0,
      p99ResponseTime: allDurations[p99Index] || 0,
      slowQueryCount: this.slowQueries.length,
      totalQueries: allDurations.length,
      errorRate: 0, // Would track actual errors in production
      topSlowQueries: await this.getTopSlowQueries(5),
    };
  }

  // Get storage growth chart data
  public getStorageGrowthData(): Array<{ date: string; size: number }> {
    return this.storageHistory.map(m => ({
      date: m.timestamp.toISOString().split('T')[0],
      size: Math.round(m.totalSize),
    }));
  }

  // Analyze query patterns
  public analyzeQueryPatterns(): {
    hotTables: Array<{ table: string; queryCount: number }>;
    queryDistribution: Record<string, number>;
    recommendations: string[];
  } {
    const tableCount: Record<string, number> = {};
    const operationCount: Record<string, number> = {
      SELECT: 0,
      INSERT: 0,
      UPDATE: 0,
      DELETE: 0,
    };

    for (const query of this.slowQueries) {
      tableCount[query.table] = (tableCount[query.table] || 0) + 1;
      operationCount[query.operation]++;
    }

    const hotTables = Object.entries(tableCount)
      .map(([table, count]) => ({ table, queryCount: count }))
      .sort((a, b) => b.queryCount - a.queryCount)
      .slice(0, 5);

    const recommendations: string[] = [];

    // Generate recommendations based on patterns
    if (operationCount.SELECT > this.slowQueries.length * 0.8) {
      recommendations.push('Consider adding indexes for frequently queried columns');
    }

    if (hotTables.length > 0 && hotTables[0].queryCount > this.slowQueries.length * 0.5) {
      recommendations.push(`Table "${hotTables[0].table}" is accessed frequently - consider partitioning or caching`);
    }

    if (this.slowQueries.some(q => q.duration > 5000)) {
      recommendations.push('Critical: Queries taking >5s detected - immediate optimization required');
    }

    return {
      hotTables,
      queryDistribution: operationCount,
      recommendations,
    };
  }

  // Helper to hash queries for grouping
  private hashQuery(query: string): string {
    // Remove values to group similar queries
    const normalized = query
      .replace(/'\d+'/g, "'?'")
      .replace(/\d+/g, '?')
      .replace(/\s+/g, ' ')
      .trim();
    return createHash('md5').update(normalized).digest('hex');
  }

  // Sanitize query for display
  private sanitizeQuery(query: string): string {
    // Remove sensitive data
    return query
      .replace(/password\s*=\s*'[^']*'/gi, "password='***'")
      .replace(/email\s*=\s*'[^']*'/gi, "email='***'")
      .substring(0, 500); // Limit length
  }

  // Generate runbook links based on issues
  public getRunbookLink(issue: string): string {
    const runbooks: Record<string, string> = {
      'slow-query': '/docs/runbooks/slow-query-optimization',
      'migration-drift': '/docs/runbooks/schema-migration-drift',
      'storage-growth': '/docs/runbooks/database-storage-management',
      'high-error-rate': '/docs/runbooks/database-error-recovery',
      'connection-pool': '/docs/runbooks/connection-pool-tuning',
    };

    return runbooks[issue] || '/docs/runbooks/general-database-issues';
  }
}

// Singleton instance
export const dbMonitor = DatabaseMonitor.getInstance();

// Middleware to track queries (would be integrated with Prisma middleware)
export function createQueryMonitoringMiddleware() {
  return async (params: any, next: any) => {
    const start = Date.now();
    const result = await next(params);
    const duration = Date.now() - start;

    // Extract table and operation from params
    const table = params.model || 'unknown';
    const operation = params.action?.toUpperCase().includes('CREATE') ? 'INSERT' :
                     params.action?.toUpperCase().includes('UPDATE') ? 'UPDATE' :
                     params.action?.toUpperCase().includes('DELETE') ? 'DELETE' :
                     'SELECT';

    // Record the query
    dbMonitor.recordQuery(
      `${operation} on ${table}`,
      duration,
      table,
      operation as any,
      params.userId
    );

    return result;
  };
}