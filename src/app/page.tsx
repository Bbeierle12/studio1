'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '@/context/auth-context';
import { isSignInWithEmailLink, signInWithEmailLink } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';

export default function Home() {
  const { user, loading } = useAuth();
  const { toast } = useToast();
  const router = useRouter();

  useEffect(() => {
    const email = window.localStorage.getItem('emailForSignIn');
    if (isSignInWithEmailLink(auth, window.location.href) && email) {
      signInWithEmailLink(auth, email, window.location.href)
        .then((result) => {
          toast({
            title: 'Successfully Signed In',
            description: `Welcome back, ${result.user.email}!`,
          });
          window.localStorage.removeItem('emailForSignIn');
          router.push('/');
        })
        .catch((error) => {
          toast({
            variant: 'destructive',
            title: 'Sign In Failed',
            description: 'The sign-in link is invalid or has expired. Please try again.',
          });
        });
    }
  }, [toast, router]);

  return (
    <div className="flex-grow">
      <div className="absolute inset-0 top-[65px] opacity-10">
        <Image
          src="https://placehold.co/1920x1080/FFFFFF/FFFFFF"
          alt="Gnomes in a kitchen sketch background"
          fill
          className="object-cover"
          data-ai-hint="gnomes kitchen"
        />
      </div>
      <main className="relative flex h-full grow flex-col items-center justify-center p-8 text-center">
        <h1 className="mb-2 font-headline text-6xl font-bold text-white">
          Our Family Table
        </h1>
        <p className="text-xl text-secondary">
          Preserving culinary heritage, one recipe at a time.
        </p>
        <div className="mt-8 w-full max-w-md space-y-4">
          <Button
            asChild
            className="w-full transform transition-transform hover:scale-105"
            size="lg"
          >
            <Link href="/recipes">Browse Recipes</Link>
          </Button>
          {!loading && !user && (
            <Button
              asChild
              variant="outline"
              className="w-full transition-colors"
              size="lg"
            >
              <Link href="/login">Log In</Link>
            </Button>
          )}
        </div>
      </main>
      <footer className="absolute bottom-8 w-full text-center text-sm text-secondary">
        <p>© 2024 Our Family Table. All Rights Reserved.</p>
      </footer>
    </div>
  );
}
