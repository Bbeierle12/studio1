'use client';

import { useAuth } from '@/context/auth-context';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
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

            {/* Info Card */}
            <Card className="border-blue-200 bg-blue-50/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-blue-900">
                  <AlertCircle className="h-5 w-5" />
                  Database Management
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-blue-800">
                <p className="mb-2">
                  This dashboard provides read-only monitoring of the database. For database
                  migrations and schema changes, use the Prisma CLI:
                </p>
                <div className="bg-blue-100 p-3 rounded-lg font-mono text-xs space-y-1">
                  <p># Run pending migrations</p>
                  <p>npx prisma migrate dev</p>
                  <p className="mt-2"># Reset database (caution!)</p>
                  <p>npx prisma migrate reset</p>
                  <p className="mt-2"># Generate Prisma Client</p>
                  <p>npx prisma generate</p>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
