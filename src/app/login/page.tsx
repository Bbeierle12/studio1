'use client';

import { LoginForm } from '@/components/login-form';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { useAuth } from '@/context/auth-context';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import Link from 'next/link';
import { Separator } from '@/components/ui/separator';

export default function LoginPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) {
      router.push('/');
    }
  }, [user, loading, router]);

  if (loading || user) {
    return (
      <div className='flex h-full flex-grow items-center justify-center'>
        <Loader2 className='h-8 w-8 animate-spin' />
      </div>
    );
  }

  return (
    <div className='container mx-auto flex h-full flex-col items-center justify-center py-8'>
      <Card className='w-full max-w-md'>
        <CardHeader className='text-center'>
          <CardTitle className='text-3xl font-headline'>Welcome back</CardTitle>
          <CardDescription>
            Sign in to access your family recipes.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Demo Credentials Notice */}
          <div className="mb-6 p-4 bg-amber-50 rounded-lg border border-amber-200">
            <p className="text-sm font-medium text-amber-800 mb-2">Demo Credentials:</p>
            <div className="text-sm text-amber-700 space-y-1">
              <p><strong>Email:</strong> demo@familyrecipes.com</p>
              <p><strong>Password:</strong> password123</p>
            </div>
          </div>
          
          <LoginForm />
          
          <div className='mt-6 text-center'>
            <Separator className="my-4" />
            <p className='text-sm text-muted-foreground'>
              Don&apos;t have an account?{' '}
              <Link
                href='/register'
                className='font-medium text-primary hover:underline'
              >
                Create one here
              </Link>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
