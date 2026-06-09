'use client';

import { LoginForm } from '@/components/login-form';
import { useAuth } from '@/context/auth-context';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Loader2, ChefHat } from 'lucide-react';
import Link from 'next/link';

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
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background px-4">
      {/* Warm tokened ambience (no hardcoded gradient) */}
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(80%_60%_at_80%_10%,hsl(var(--meal-breakfast)/0.16)_0%,transparent_60%),radial-gradient(70%_60%_at_10%_100%,hsl(var(--meal-dinner)/0.14)_0%,transparent_55%)]"
        aria-hidden
      />
      <ChefHat
        className="pointer-events-none absolute -bottom-12 -left-10 h-72 w-72 text-foreground/[0.04]"
        strokeWidth={0.8}
        aria-hidden
      />

      <div className="relative w-full max-w-[360px] rounded-lg bg-card p-7 shadow-md3-3">
        {/* Wordmark */}
        <div className="mb-5 flex items-center justify-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <ChefHat className="h-5 w-5" />
          </span>
          <span className="font-headline text-lg font-bold text-foreground">
            Our Family Table
          </span>
        </div>

        <h1 className="text-center font-headline text-2xl font-bold text-foreground">
          Welcome home
        </h1>
        <p className="mb-6 mt-1 text-center text-sm text-muted-foreground">
          Sign in to your family table
        </p>

        <LoginForm />

        <p className="mt-6 text-center text-sm text-muted-foreground">
          Don&apos;t have an account?{' '}
          <Link
            href="/register"
            className="font-semibold text-primary hover:underline"
          >
            Create one
          </Link>
        </p>
      </div>
    </div>
  );
}
