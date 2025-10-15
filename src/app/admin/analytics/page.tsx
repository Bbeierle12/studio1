'use client';

import { useAuth } from '@/context/auth-context';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { hasPermission, ROLE_LABELS } from '@/lib/admin-permissions';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Users,
  CookingPot,
  CalendarDays,
  TrendingUp,
  Loader2,
  RefreshCw,
  UserCheck,
  UserPlus,
  Heart,
  Download,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import Link from 'next/link';

interface AnalyticsData {
  overview: {
    totalUsers: number;
    totalRecipes: number;
    totalMealPlans: number;
    activeUsers7Days: number;
    activeUsers30Days: number;
    newUsers7Days: number;
    newUsers30Days: number;
    newRecipes7Days: number;
    newRecipes30Days: number;
  };
  usersByRole: Array<{
    role: string;
    count: number;
  }>;
  userGrowth: Array<{
    date: string;
    count: number;
  }>;
  recipeGrowth: Array<{
    date: string;
    count: number;
  }>;
  topCreators: Array<{
    id: string;
    name: string | null;
    email: string;
    recipeCount: number;
  }>;
  popularRecipes: Array<{
    id: string;
    title: string;
    slug: string;
    imageUrl: string;
    favoritesCount: number;
    plannedMealsCount: number;
  }>;
  recipesByCourse: Array<{
    course: string;
    count: number;
  }>;
  recipesByCuisine: Array<{
    cuisine: string;
    count: number;
  }>;
}

const ROLE_COLORS: Record<string, string> = {
  USER: '#94a3b8',
  SUPPORT_ADMIN: '#60a5fa',
  CONTENT_ADMIN: '#a78bfa',
  SUPER_ADMIN: '#f87171',
};

export default function AnalyticsPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loadingAnalytics, setLoadingAnalytics] = useState(true);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    if (!loading && (!user || !user.role || !hasPermission(user.role, 'VIEW_ANALYTICS'))) {
      router.push('/admin');
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (user && user.role && hasPermission(user.role, 'VIEW_ANALYTICS')) {
      fetchAnalytics();
    }
  }, [user]);

  const fetchAnalytics = async () => {
    setLoadingAnalytics(true);
    try {
      const response = await fetch('/api/admin/analytics/overview');
      if (response.ok) {
        const data = await response.json();
        setAnalytics(data);
      } else {
        toast({
          title: 'Error',
          description: 'Failed to fetch analytics',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error fetching analytics:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch analytics',
        variant: 'destructive',
      });
    } finally {
      setLoadingAnalytics(false);
    }
  };

  const handleExport = async (type: string) => {
    setExporting(true);
    try {
      const response = await fetch(`/api/admin/export/analytics?type=${type}`);
      
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `analytics_${type}_${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);

        toast({
          title: 'Export Successful',
          description: `${type} analytics exported to CSV`,
        });
      } else {
        throw new Error('Export failed');
      }
    } catch (error) {
      console.error('Error exporting analytics:', error);
      toast({
        title: 'Error',
        description: 'Failed to export analytics',
        variant: 'destructive',
      });
    } finally {
      setExporting(false);
    }
  };

  if (loading || !user || loadingAnalytics) {
    return (
      <div className='flex h-screen items-center justify-center'>
        <Loader2 className='h-8 w-8 animate-spin' />
      </div>
    );
  }

  if (!user.role || !hasPermission(user.role, 'VIEW_ANALYTICS')) {
    return (
      <div className='flex h-screen items-center justify-center'>
        <Card>
          <CardHeader>
            <CardTitle>Unauthorized</CardTitle>
            <CardDescription>
              You do not have permission to view analytics.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  if (!analytics) {
    return null;
  }

  return (
    <div className='container mx-auto py-8'>
      <div className='mb-6'>
        <div className='flex items-center justify-between mb-4'>
          <div>
            <h1 className='text-3xl font-bold'>Analytics Dashboard</h1>
            <p className='text-muted-foreground'>
              Comprehensive insights and statistics
            </p>
          </div>
          <div className='flex gap-2'>
            <Button onClick={fetchAnalytics} variant='outline' size='sm'>
              <RefreshCw className='h-4 w-4 mr-2' />
              Refresh
            </Button>
            <Button 
              onClick={() => handleExport('overview')} 
              variant='outline' 
              size='sm'
              disabled={exporting}
            >
              <Download className='h-4 w-4 mr-2' />
              {exporting ? 'Exporting...' : 'Export CSV'}
            </Button>
          </div>
        </div>

        {/* Overview Stats */}
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6'>
          <Card>
            <CardHeader className='pb-3'>
              <CardTitle className='text-sm font-medium flex items-center gap-2'>
                <Users className='h-4 w-4' />
                Total Users
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className='text-2xl font-bold'>{analytics.overview.totalUsers}</div>
              <p className='text-xs text-muted-foreground mt-1'>
                +{analytics.overview.newUsers7Days} this week
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className='pb-3'>
              <CardTitle className='text-sm font-medium flex items-center gap-2'>
                <CookingPot className='h-4 w-4' />
                Total Recipes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className='text-2xl font-bold'>{analytics.overview.totalRecipes}</div>
              <p className='text-xs text-muted-foreground mt-1'>
                +{analytics.overview.newRecipes7Days} this week
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className='pb-3'>
              <CardTitle className='text-sm font-medium flex items-center gap-2'>
                <UserCheck className='h-4 w-4' />
                Active Users (30d)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className='text-2xl font-bold'>{analytics.overview.activeUsers30Days}</div>
              <p className='text-xs text-muted-foreground mt-1'>
                {Math.round((analytics.overview.activeUsers30Days / analytics.overview.totalUsers) * 100)}% of total
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className='pb-3'>
              <CardTitle className='text-sm font-medium flex items-center gap-2'>
                <CalendarDays className='h-4 w-4' />
                Meal Plans
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className='text-2xl font-bold'>{analytics.overview.totalMealPlans}</div>
              <p className='text-xs text-muted-foreground mt-1'>
                Active meal plans
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Growth Charts */}
        <div className='grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6'>
          <Card>
            <CardHeader>
              <CardTitle>User Growth</CardTitle>
              <CardDescription>New users registered over the last 30 days</CardDescription>
            </CardHeader>
            <CardContent>
              <div className='h-[300px]'>
                <ResponsiveContainer width='100%' height='100%'>
                  <LineChart data={analytics.userGrowth}>
                    <CartesianGrid strokeDasharray='3 3' />
                    <XAxis
                      dataKey='date'
                      tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    />
                    <YAxis />
                    <Tooltip
                      labelFormatter={(value) => new Date(value).toLocaleDateString()}
                      formatter={(value: any) => [value, 'New Users']}
                    />
                    <Line type='monotone' dataKey='count' stroke='#8b5cf6' strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Recipe Creation</CardTitle>
              <CardDescription>Recipes created over the last 30 days</CardDescription>
            </CardHeader>
            <CardContent>
              <div className='h-[300px]'>
                <ResponsiveContainer width='100%' height='100%'>
                  <LineChart data={analytics.recipeGrowth}>
                    <CartesianGrid strokeDasharray='3 3' />
                    <XAxis
                      dataKey='date'
                      tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    />
                    <YAxis />
                    <Tooltip
                      labelFormatter={(value) => new Date(value).toLocaleDateString()}
                      formatter={(value: any) => [value, 'New Recipes']}
                    />
                    <Line type='monotone' dataKey='count' stroke='#f59e0b' strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Additional Stats */}
        <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
          <Card>
            <CardHeader>
              <CardTitle>Users by Role</CardTitle>
              <CardDescription>Distribution of user roles</CardDescription>
            </CardHeader>
            <CardContent>
              <div className='h-[300px]'>
                <ResponsiveContainer width='100%' height='100%'>
                  <PieChart>
                    <Pie
                      data={analytics.usersByRole}
                      dataKey='count'
                      nameKey='role'
                      cx='50%'
                      cy='50%'
                      outerRadius={80}
                      label={(entry) => `${ROLE_LABELS[entry.role as keyof typeof ROLE_LABELS]}: ${entry.count}`}
                    >
                      {analytics.usersByRole.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={ROLE_COLORS[entry.role]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Top Recipe Creators</CardTitle>
              <CardDescription>Users with the most recipes</CardDescription>
            </CardHeader>
            <CardContent>
              <div className='space-y-4'>
                {analytics.topCreators.map((creator, index) => (
                  <div key={creator.id} className='flex items-center justify-between'>
                    <div className='flex items-center gap-3'>
                      <div className='flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-bold'>
                        {index + 1}
                      </div>
                      <div>
                        <div className='font-medium'>{creator.name || 'Unknown'}</div>
                        <div className='text-sm text-muted-foreground'>{creator.email}</div>
                      </div>
                    </div>
                    <div className='flex items-center gap-2'>
                      <CookingPot className='h-4 w-4 text-muted-foreground' />
                      <span className='font-bold'>{creator.recipeCount}</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recipe Analytics */}
        <div className='grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6'>
          <Card>
            <CardHeader>
              <CardTitle>Most Popular Recipes</CardTitle>
              <CardDescription>Recipes with the most favorites</CardDescription>
            </CardHeader>
            <CardContent>
              <div className='space-y-4'>
                {analytics.popularRecipes?.map((recipe, index) => (
                  <Link
                    key={recipe.id}
                    href={`/recipes/${recipe.slug}`}
                    target='_blank'
                    className='flex items-center gap-3 p-2 rounded-lg hover:bg-muted transition-colors'
                  >
                    <div className='flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-bold text-sm'>
                      {index + 1}
                    </div>
                    <img
                      src={recipe.imageUrl}
                      alt={recipe.title}
                      className='w-12 h-12 rounded object-cover'
                    />
                    <div className='flex-1 min-w-0'>
                      <div className='font-medium truncate'>{recipe.title}</div>
                      <div className='text-xs text-muted-foreground flex items-center gap-3'>
                        <span className='flex items-center gap-1'>
                          <Heart className='h-3 w-3' />
                          {recipe.favoritesCount} favorites
                        </span>
                        <span className='flex items-center gap-1'>
                          <CalendarDays className='h-3 w-3' />
                          {recipe.plannedMealsCount} planned
                        </span>
                      </div>
                    </div>
                  </Link>
                )) || <p className='text-sm text-muted-foreground'>No data available</p>}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Recipes by Course</CardTitle>
              <CardDescription>Distribution of recipe categories</CardDescription>
            </CardHeader>
            <CardContent>
              <div className='h-[300px]'>
                <ResponsiveContainer width='100%' height='100%'>
                  <PieChart>
                    <Pie
                      data={analytics.recipesByCourse || []}
                      dataKey='count'
                      nameKey='course'
                      cx='50%'
                      cy='50%'
                      outerRadius={80}
                      label={(entry) => `${entry.course}: ${entry.count}`}
                    >
                      {(analytics.recipesByCourse || []).map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={['#ef4444', '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6'][index % 5]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Cuisine Distribution */}
        <div className='grid grid-cols-1 gap-6 mt-6'>
          <Card>
            <CardHeader>
              <CardTitle>Recipes by Cuisine</CardTitle>
              <CardDescription>Global cuisine distribution</CardDescription>
            </CardHeader>
            <CardContent>
              <div className='grid grid-cols-2 md:grid-cols-4 gap-4'>
                {analytics.recipesByCuisine?.map((item) => (
                  <div key={item.cuisine} className='p-4 border rounded-lg text-center'>
                    <div className='text-2xl font-bold'>{item.count}</div>
                    <div className='text-sm text-muted-foreground'>{item.cuisine}</div>
                  </div>
                )) || <p className='text-sm text-muted-foreground col-span-4'>No data available</p>}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
