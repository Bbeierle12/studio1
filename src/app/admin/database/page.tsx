'use client';

import { useAuth } from '@/context/auth-context';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Database,
  Loader2,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  HardDrive,
  Table,
  Clock,
  Server,
  Zap,
  Settings,
  Activity,
  Trash2,
  BarChart3,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';

interface DatabaseStats {
  tables: {
    name: string;
    count: number;
  }[];
  health: {
    status: 'healthy' | 'warning' | 'error';
    message: string;
    responseTime: number;
  };
  prismaVersion: string;
  databaseUrl: string;
  lastMigration: string | null;
}

export default function DatabaseToolsPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const [stats, setStats] = useState<DatabaseStats | null>(null);
  const [loadingStats, setLoadingStats] = useState(true);
  const [clearingCache, setClearingCache] = useState<string | null>(null);
  const [optimizing, setOptimizing] = useState<string | null>(null);
  const [lastCacheCleared, setLastCacheCleared] = useState<string | null>(null);
  const [lastOptimized, setLastOptimized] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && (!user || user.role !== 'SUPER_ADMIN')) {
      router.push('/admin');
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (user && user.role === 'SUPER_ADMIN') {
      fetchStats();
    }
  }, [user]);

  const fetchStats = async () => {
    setLoadingStats(true);
    try {
      const response = await fetch('/api/admin/database/stats');
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      } else {
        toast({
          title: 'Error',
          description: 'Failed to fetch database statistics',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error fetching database stats:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch database statistics',
        variant: 'destructive',
      });
    } finally {
      setLoadingStats(false);
    }
  };

  const handleClearCache = async (type: 'next' | 'prisma' | 'all') => {
    setClearingCache(type);
    try {
      const response = await fetch('/api/admin/database/cache', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type }),
      });

      if (response.ok) {
        const data = await response.json();
        setLastCacheCleared(new Date().toISOString());
        toast({
          title: 'Success',
          description: data.message || `${type} cache cleared successfully`,
        });
      } else {
        const data = await response.json();
        toast({
          title: 'Error',
          description: data.error || 'Failed to clear cache',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error clearing cache:', error);
      toast({
        title: 'Error',
        description: 'Failed to clear cache',
        variant: 'destructive',
      });
    } finally {
      setClearingCache(null);
    }
  };

  const handleOptimize = async (operation: 'analyze' | 'reindex') => {
    setOptimizing(operation);
    try {
      const response = await fetch('/api/admin/database/optimize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ operation }),
      });

      if (response.ok) {
        const data = await response.json();
        setLastOptimized(new Date().toISOString());
        toast({
          title: 'Success',
          description: data.message || `Database ${operation} completed successfully`,
        });
        fetchStats(); // Refresh stats after optimization
      } else {
        const data = await response.json();
        toast({
          title: 'Error',
          description: data.error || 'Failed to optimize database',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error optimizing database:', error);
      toast({
        title: 'Error',
        description: 'Failed to optimize database',
        variant: 'destructive',
      });
    } finally {
      setOptimizing(null);
    }
  };

  if (loading || loadingStats) {
    return (
      <div className='flex h-screen items-center justify-center'>
        <Loader2 className='h-8 w-8 animate-spin' />
      </div>
    );
  }

  if (!user || user.role !== 'SUPER_ADMIN') {
    return (
      <div className='flex h-screen items-center justify-center'>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-destructive" />
              Unauthorized Access
            </CardTitle>
            <CardDescription>
              Only Super Admins can access database tools.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild>
              <Link href="/admin">Go to Admin Dashboard</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const totalRecords = stats?.tables.reduce((sum, table) => sum + table.count, 0) || 0;

  return (
    <div className='container mx-auto py-8'>
      <div className='mb-6'>
        <div className='flex items-center justify-between mb-4'>
          <div>
            <div className='flex items-center gap-2 mb-2'>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/admin">← Back to Dashboard</Link>
              </Button>
            </div>
            <h1 className='text-3xl font-bold'>Database Tools</h1>
            <p className='text-muted-foreground'>
              Database health, statistics, and monitoring
            </p>
          </div>
          <Button onClick={fetchStats} variant='outline' size='sm'>
            <RefreshCw className='h-4 w-4 mr-2' />
            Refresh
          </Button>
        </div>

        {stats && (
          <div className="space-y-6">
            {/* Health Status */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  {stats.health.status === 'healthy' ? (
                    <CheckCircle2 className="h-5 w-5 text-green-500" />
                  ) : (
                    <AlertCircle className="h-5 w-5 text-yellow-500" />
                  )}
                  Database Health
                </CardTitle>
                <CardDescription>
                  Current status and performance metrics
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="flex items-center gap-3 p-4 border rounded-lg">
                    <div className={`p-2 rounded-full ${
                      stats.health.status === 'healthy' 
                        ? 'bg-green-100 text-green-600' 
                        : 'bg-yellow-100 text-yellow-600'
                    }`}>
                      <Server className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Status</p>
                      <p className="text-lg font-semibold capitalize">{stats.health.status}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 p-4 border rounded-lg">
                    <div className="p-2 rounded-full bg-blue-100 text-blue-600">
                      <Clock className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Response Time</p>
                      <p className="text-lg font-semibold">{stats.health.responseTime}ms</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 p-4 border rounded-lg">
                    <div className="p-2 rounded-full bg-purple-100 text-purple-600">
                      <HardDrive className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Total Records</p>
                      <p className="text-lg font-semibold">{totalRecords.toLocaleString()}</p>
                    </div>
                  </div>
                </div>

                {stats.health.message && (
                  <div className="mt-4 p-3 bg-muted rounded-lg">
                    <p className="text-sm">{stats.health.message}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Table Statistics */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Table className="h-5 w-5" />
                  Table Statistics
                </CardTitle>
                <CardDescription>
                  Record counts for each database table
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {stats.tables.map((table) => (
                    <div
                      key={table.name}
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-full bg-blue-100 text-blue-600">
                          <Table className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="font-medium">{table.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {table.count.toLocaleString()} record{table.count !== 1 ? 's' : ''}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* System Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="h-5 w-5" />
                  System Information
                </CardTitle>
                <CardDescription>
                  Database configuration and version details
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <span className="text-sm font-medium">Prisma Version</span>
                    <span className="text-sm text-muted-foreground font-mono">
                      {stats.prismaVersion}
                    </span>
                  </div>

                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <span className="text-sm font-medium">Database Provider</span>
                    <span className="text-sm text-muted-foreground font-mono">
                      {stats.databaseUrl.startsWith('postgresql') ? 'PostgreSQL' : 
                       stats.databaseUrl.startsWith('mysql') ? 'MySQL' :
                       stats.databaseUrl.startsWith('mongodb') ? 'MongoDB' : 'Unknown'}
                    </span>
                  </div>

                  {stats.lastMigration && (
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <span className="text-sm font-medium">Last Migration</span>
                      <span className="text-sm text-muted-foreground">
                        {new Date(stats.lastMigration).toLocaleString()}
                      </span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Cache Management */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5" />
                  Cache Management
                </CardTitle>
                <CardDescription>
                  Clear application caches to free memory and ensure fresh data
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="text-sm font-medium">Next.js Cache</p>
                      <p className="text-xs text-muted-foreground">
                        Page and data cache revalidation
                      </p>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleClearCache('next')}
                      disabled={clearingCache === 'next'}
                    >
                      {clearingCache === 'next' ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        'Clear'
                      )}
                    </Button>
                  </div>

                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="text-sm font-medium">Prisma Query Cache</p>
                      <p className="text-xs text-muted-foreground">
                        Database query results cache
                      </p>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleClearCache('prisma')}
                      disabled={clearingCache === 'prisma'}
                    >
                      {clearingCache === 'prisma' ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        'Clear'
                      )}
                    </Button>
                  </div>

                  <div className="pt-2 border-t">
                    <Button
                      variant="destructive"
                      className="w-full"
                      onClick={() => handleClearCache('all')}
                      disabled={clearingCache === 'all'}
                    >
                      {clearingCache === 'all' ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Clearing...
                        </>
                      ) : (
                        <>
                          <Trash2 className="mr-2 h-4 w-4" />
                          Clear All Caches
                        </>
                      )}
                    </Button>
                    {lastCacheCleared && (
                      <p className="text-xs text-muted-foreground mt-2 text-center">
                        Last cleared: {new Date(lastCacheCleared).toLocaleString()}
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Database Optimization */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Database Optimization
                </CardTitle>
                <CardDescription>
                  Optimize database performance and maintain indexes
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <Button
                    variant="outline"
                    className="w-full justify-start"
                    onClick={() => handleOptimize('analyze')}
                    disabled={optimizing === 'analyze'}
                  >
                    {optimizing === 'analyze' ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Analyzing...
                      </>
                    ) : (
                      <>
                        <BarChart3 className="mr-2 h-4 w-4" />
                        Analyze Tables
                      </>
                    )}
                  </Button>
                  <p className="text-xs text-muted-foreground px-1">
                    Update table statistics for better query planning
                  </p>

                  <Button
                    variant="outline"
                    className="w-full justify-start"
                    onClick={() => handleOptimize('reindex')}
                    disabled={optimizing === 'reindex'}
                  >
                    {optimizing === 'reindex' ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Reindexing...
                      </>
                    ) : (
                      <>
                        <RefreshCw className="mr-2 h-4 w-4" />
                        Rebuild Indexes
                      </>
                    )}
                  </Button>
                  <p className="text-xs text-muted-foreground px-1">
                    Rebuild database indexes for optimal performance
                  </p>

                  {lastOptimized && (
                    <div className="pt-2 border-t">
                      <p className="text-xs text-muted-foreground text-center">
                        Last optimized: {new Date(lastOptimized).toLocaleString()}
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Performance Metrics */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  Performance Metrics
                </CardTitle>
                <CardDescription>
                  Database connection and query performance
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="text-sm font-medium">Connection Pool</p>
                      <p className="text-xs text-muted-foreground">
                        Active connections
                      </p>
                    </div>
                    <Badge variant="secondary">Available</Badge>
                  </div>

                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="text-sm font-medium">Query Performance</p>
                      <p className="text-xs text-muted-foreground">
                        Average response time
                      </p>
                    </div>
                    <Badge variant={stats && stats.health.responseTime < 100 ? 'default' : 'secondary'}>
                      {stats?.health.responseTime || 0}ms
                    </Badge>
                  </div>

                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="text-sm font-medium">Database Size</p>
                      <p className="text-xs text-muted-foreground">
                        Approximate storage used
                      </p>
                    </div>
                    <span className="text-sm font-mono">
                      ~{Math.round(totalRecords / 1000)}MB
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* CLI Reference Card */}
            <Card className="border-blue-200 bg-blue-50/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-blue-900">
                  <AlertCircle className="h-5 w-5" />
                  Prisma CLI Commands
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-blue-800">
                <p className="mb-2">
                  For database migrations and schema changes, use these Prisma CLI commands:
                </p>
                <div className="bg-blue-100 p-3 rounded-lg font-mono text-xs space-y-1">
                  <p># Run pending migrations</p>
                  <p>npx prisma migrate dev</p>
                  <p className="mt-2"># Generate Prisma Client</p>
                  <p>npx prisma generate</p>
                  <p className="mt-2"># Open Prisma Studio</p>
                  <p>npx prisma studio</p>
                  <p className="mt-2"># Reset database (caution!)</p>
                  <p>npx prisma migrate reset</p>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
