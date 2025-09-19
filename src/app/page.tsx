'use client';

import { Button } from '@/components/ui/button';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '@/context/auth-context';

export default function Home() {
  const { user, loading } = useAuth();

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
            <div className="grid grid-cols-2 gap-4">
              <Button
                asChild
                variant="secondary"
                className="w-full transition-colors"
                size="lg"
              >
                <Link href="/login">Log In</Link>
              </Button>
              <Button
                asChild
                variant="outline"
                className="w-full transition-colors"
                size="lg"
              >
                <Link href="/login">Sign Up</Link>
              </Button>
            </div>
          )}
        </div>
      </main>
      <footer className="absolute bottom-8 w-full text-center text-sm text-secondary">
        <p>© 2024 Our Family Table. All Rights Reserved.</p>
      </footer>
    </div>
  );
}
