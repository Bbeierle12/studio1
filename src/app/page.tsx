'use client';

import { Button } from '@/components/ui/button';
import Link from 'next/link';
import Image from 'next/image';

export default function Home() {
  return (
    <div className="flex-grow">
      <div className="absolute inset-0 top-[65px] opacity-10">
        <Image
          src="https://picsum.photos/seed/kitchen/1920/1080"
          alt="Kitchen background"
          fill
          className="object-cover"
          data-ai-hint="kitchen cooking"
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
          <Button
            asChild
            variant="outline"
            className="w-full transition-colors"
            size="lg"
          >
            <Link href="#">Log In</Link>
          </Button>
        </div>
      </main>
      <footer className="absolute bottom-8 w-full text-center text-sm text-secondary">
        <p>© 2024 Our Family Table. All Rights Reserved.</p>
      </footer>
    </div>
  );
}
