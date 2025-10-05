'use client';

import { useAuth } from '@/context/auth-context';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Users, 
  CookingPot, 
  Library, 
  Settings, 
  BarChart3, 
  Shield, 
  Database,
  Flag,
  Loader2,
  AlertCircle
} from 'lucide-react';
import Link from 'next/link';

export default function AdminDashboard() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalRecipes: 0,
    totalCollections: 0,
    activeUsers: 0,
  });
  const [loadingStats, setLoadingStats] = useState(true);

  useEffect(() => {
    if (!loading && (!user || user.role === 'USER')) {
      router.push('/');
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (user && user.role !== 'USER') {
      fetchStats();
    }
  }, [user]);

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/admin/stats');
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    } finally {
      setLoadingStats(false);
    }
  };

  if (loading || !user) {
    return (
      <div className='flex h-screen items-center justify-center'>
        <Loader2 className='h-8 w-8 animate-spin' />
      </div>
    );
  }

  if (user.role === 'USER') {
    return (
      <div className='flex h-screen items-center justify-center'>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-destructive" />
              Unauthorized Access
            </CardTitle>
            <CardDescription>
              You do not have permission to access the admin dashboard.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild>
              <Link href="/">Go to Home</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const isSuperAdmin = user.role === 'SUPER_ADMIN';
  const isContentAdmin = user.role === 'CONTENT_ADMIN' || isSuperAdmin;

  return (
    <div className='container mx-auto py-8'>
      <div className='mb-8'>
        <h1 className='text-3xl font-bold mb-2'>Admin Dashboard</h1>
        <p className='text-muted-foreground'>
          Welcome back, {user.name}. You are logged in as{' '}
          <span className='font-semibold'>{user.role.replace('_', ' ')}</span>
        </p>
      </div>

      {/* Stats Overview */}
      <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8'>
        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>Total Users</CardTitle>
            <Users className='h-4 w-4 text-muted-foreground' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>
              {loadingStats ? '...' : stats.totalUsers.toLocaleString()}
            </div>
            <p className='text-xs text-muted-foreground'>
              Registered accounts
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>Total Recipes</CardTitle>
            <CookingPot className='h-4 w-4 text-muted-foreground' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>
              {loadingStats ? '...' : stats.totalRecipes.toLocaleString()}
            </div>
            <p className='text-xs text-muted-foreground'>
              In the database
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>Collections</CardTitle>
            <Library className='h-4 w-4 text-muted-foreground' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>
              {loadingStats ? '...' : stats.totalCollections.toLocaleString()}
            </div>
            <p className='text-xs text-muted-foreground'>
              Recipe collections
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>Active Users</CardTitle>
            <Users className='h-4 w-4 text-muted-foreground' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>
              {loadingStats ? '...' : stats.activeUsers.toLocaleString()}
            </div>
            <p className='text-xs text-muted-foreground'>
              Last 24 hours
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Admin Navigation */}
      <Card>
        <CardHeader>
          <CardTitle>Admin Tools</CardTitle>
          <CardDescription>
            Select a tool to manage your application
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-3'>
            {/* User Management */}
            <Button
              asChild
              variant='outline'
              className='h-auto flex-col items-start gap-2 p-4'
            >
              <Link href='/admin/users'>
                <Users className='h-6 w-6' />
                <div className='text-left'>
                  <div className='font-semibold'>User Management</div>
                  <div className='text-xs text-muted-foreground'>
                    View and manage user accounts
                  </div>
                </div>
              </Link>
            </Button>

            {/* Recipe Management */}
            {isContentAdmin && (
              <Button
                asChild
                variant='outline'
                className='h-auto flex-col items-start gap-2 p-4'
              >
                <Link href='/admin/recipes'>
                  <CookingPot className='h-6 w-6' />
                  <div className='text-left'>
                    <div className='font-semibold'>Recipe Management</div>
                    <div className='text-xs text-muted-foreground'>
                      Edit, delete, and feature recipes
                    </div>
                  </div>
                </Link>
              </Button>
            )}

            {/* Analytics */}
            <Button
              asChild
              variant='outline'
              className='h-auto flex-col items-start gap-2 p-4'
            >
              <Link href='/admin/analytics'>
                <BarChart3 className='h-6 w-6' />
                <div className='text-left'>
                  <div className='font-semibold'>Analytics</div>
                  <div className='text-xs text-muted-foreground'>
                    View usage and engagement metrics
                  </div>
                </div>
              </Link>
            </Button>

            {/* Audit Logs */}
            {isContentAdmin && (
              <Button
                asChild
                variant='outline'
                className='h-auto flex-col items-start gap-2 p-4'
              >
                <Link href='/admin/audit'>
                  <Shield className='h-6 w-6' />
                  <div className='text-left'>
                    <div className='font-semibold'>Audit Logs</div>
                    <div className='text-xs text-muted-foreground'>
                      Review admin actions and security
                    </div>
                  </div>
                </Link>
              </Button>
            )}

            {/* System Settings */}
            {isSuperAdmin && (
              <Button
                asChild
                variant='outline'
                className='h-auto flex-col items-start gap-2 p-4'
              >
                <Link href='/admin/settings'>
                  <Settings className='h-6 w-6' />
                  <div className='text-left'>
                    <div className='font-semibold'>System Settings</div>
                    <div className='text-xs text-muted-foreground'>
                      Configure application settings
                    </div>
                  </div>
                </Link>
              </Button>
            )}

            {/* Feature Flags */}
            {isSuperAdmin && (
              <Button
                asChild
                variant='outline'
                className='h-auto flex-col items-start gap-2 p-4'
              >
                <Link href='/admin/features'>
                  <Flag className='h-6 w-6' />
                  <div className='text-left'>
                    <div className='font-semibold'>Feature Flags</div>
                    <div className='text-xs text-muted-foreground'>
                      Enable/disable features
                    </div>
                  </div>
                </Link>
              </Button>
            )}

            {/* Database Tools */}
            {isSuperAdmin && (
              <Button
                asChild
                variant='outline'
                className='h-auto flex-col items-start gap-2 p-4'
              >
                <Link href='/admin/database'>
                  <Database className='h-6 w-6' />
                  <div className='text-left'>
                    <div className='font-semibold'>Database Tools</div>
                    <div className='text-xs text-muted-foreground'>
                      View stats and manage backups
                    </div>
                  </div>
                </Link>
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <Card className='mt-8'>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>
            Latest admin actions in the system
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className='text-sm text-muted-foreground'>
            Activity log will appear here
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
