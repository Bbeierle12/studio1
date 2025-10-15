'use client';

import { useAuth } from '@/context/auth-context';
import { useRouter, useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { hasPermission, ROLE_LABELS } from '@/lib/admin-permissions';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  ArrowLeft,
  Loader2,
  Mail,
  Calendar,
  CookingPot,
  Heart,
  CalendarDays,
  Shield,
} from 'lucide-react';
import Link from 'next/link';
import { UserRole } from '@prisma/client';

interface UserDetails {
  id: string;
  email: string;
  name: string | null;
  avatarUrl: string | null;
  bio: string | null;
  role: UserRole;
  isActive: boolean;
  lastLogin: string | null;
  createdAt: string;
  updatedAt: string;
  _count: {
    recipes: number;
    mealPlans: number;
    favorites: number;
    auditLogs: number;
  };
  recipes: Array<{
    id: string;
    title: string;
    slug: string;
    imageUrl: string;
    createdAt: string;
  }>;
}

export default function UserDetailsPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const userId = params.id as string;

  const [userDetails, setUserDetails] = useState<UserDetails | null>(null);
  const [loadingDetails, setLoadingDetails] = useState(true);

  useEffect(() => {
    if (!loading && (!user || !user.role || !hasPermission(user.role, 'VIEW_USERS'))) {
      router.push('/admin');
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (user && user.role && hasPermission(user.role, 'VIEW_USERS')) {
      fetchUserDetails();
    }
  }, [user, userId]);

  const fetchUserDetails = async () => {
    setLoadingDetails(true);
    try {
      const response = await fetch(`/api/admin/users/${userId}`);
      if (response.ok) {
        const data = await response.json();
        setUserDetails(data.user);
      } else {
        router.push('/admin/users');
      }
    } catch (error) {
      console.error('Error fetching user details:', error);
      router.push('/admin/users');
    } finally {
      setLoadingDetails(false);
    }
  };

  if (loading || !user || loadingDetails) {
    return (
      <div className='flex h-screen items-center justify-center'>
        <Loader2 className='h-8 w-8 animate-spin' />
      </div>
    );
  }

  if (!userDetails) {
    return null;
  }

  return (
    <div className='container mx-auto py-8'>
      <div className='mb-6'>
        <Button variant='ghost' asChild className='mb-4'>
          <Link href='/admin/users'>
            <ArrowLeft className='h-4 w-4 mr-2' />
            Back to Users
          </Link>
        </Button>

        <div className='flex items-start gap-6'>
          <Avatar className='h-24 w-24'>
            <AvatarImage src={userDetails.avatarUrl || undefined} />
            <AvatarFallback className='text-2xl'>
              {userDetails.name?.[0]?.toUpperCase() || userDetails.email[0].toUpperCase()}
            </AvatarFallback>
          </Avatar>

          <div className='flex-1'>
            <div className='flex items-center gap-3 mb-2'>
              <h1 className='text-3xl font-bold'>
                {userDetails.name || 'No name'}
              </h1>
              <Badge
                className={
                  userDetails.isActive
                    ? 'bg-green-100 text-green-800'
                    : 'bg-gray-100 text-gray-800'
                }
              >
                {userDetails.isActive ? 'Active' : 'Inactive'}
              </Badge>
            </div>
            <div className='flex items-center gap-2 text-muted-foreground mb-4'>
              <Mail className='h-4 w-4' />
              {userDetails.email}
            </div>
            {userDetails.bio && (
              <p className='text-muted-foreground'>{userDetails.bio}</p>
            )}
          </div>

          <div className='flex flex-col items-end gap-2'>
            <Badge className='bg-purple-100 text-purple-800'>
              <Shield className='h-3 w-3 mr-1' />
              {ROLE_LABELS[userDetails.role]}
            </Badge>
          </div>
        </div>
      </div>

      <div className='grid grid-cols-1 md:grid-cols-3 gap-6 mb-6'>
        <Card>
          <CardHeader className='pb-3'>
            <CardTitle className='text-sm font-medium flex items-center gap-2'>
              <CookingPot className='h-4 w-4' />
              Recipes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>{userDetails._count.recipes}</div>
            <p className='text-xs text-muted-foreground'>Created recipes</p>
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
            <div className='text-2xl font-bold'>{userDetails._count.mealPlans}</div>
            <p className='text-xs text-muted-foreground'>Active meal plans</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className='pb-3'>
            <CardTitle className='text-sm font-medium flex items-center gap-2'>
              <Heart className='h-4 w-4' />
              Favorites
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>{userDetails._count.favorites}</div>
            <p className='text-xs text-muted-foreground'>Saved favorites</p>
          </CardContent>
        </Card>
      </div>

      <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
        <Card>
          <CardHeader>
            <CardTitle>Account Information</CardTitle>
          </CardHeader>
          <CardContent className='space-y-4'>
            <div>
              <div className='text-sm font-medium text-muted-foreground mb-1'>
                User ID
              </div>
              <div className='font-mono text-sm'>{userDetails.id}</div>
            </div>
            <div>
              <div className='text-sm font-medium text-muted-foreground mb-1'>
                <div className='flex items-center gap-2'>
                  <Calendar className='h-4 w-4' />
                  Joined
                </div>
              </div>
              <div>{new Date(userDetails.createdAt).toLocaleString()}</div>
            </div>
            <div>
              <div className='text-sm font-medium text-muted-foreground mb-1'>
                Last Login
              </div>
              <div>
                {userDetails.lastLogin
                  ? new Date(userDetails.lastLogin).toLocaleString()
                  : 'Never logged in'}
              </div>
            </div>
            <div>
              <div className='text-sm font-medium text-muted-foreground mb-1'>
                Last Updated
              </div>
              <div>{new Date(userDetails.updatedAt).toLocaleString()}</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Recipes</CardTitle>
            <CardDescription>
              Last {userDetails.recipes.length} recipes created
            </CardDescription>
          </CardHeader>
          <CardContent>
            {userDetails.recipes.length === 0 ? (
              <p className='text-sm text-muted-foreground'>No recipes yet</p>
            ) : (
              <div className='space-y-3'>
                {userDetails.recipes.map((recipe) => (
                  <Link
                    key={recipe.id}
                    href={`/recipes/${recipe.slug}`}
                    className='flex items-center gap-3 p-2 rounded-lg hover:bg-muted transition-colors'
                  >
                    <img
                      src={recipe.imageUrl}
                      alt={recipe.title}
                      className='w-12 h-12 rounded object-cover'
                    />
                    <div className='flex-1 min-w-0'>
                      <div className='font-medium truncate'>{recipe.title}</div>
                      <div className='text-xs text-muted-foreground'>
                        {new Date(recipe.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
