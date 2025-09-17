import Link from 'next/link';
import { Button } from './ui/button';
import { CookingPot, PlusCircle } from 'lucide-react';

export function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 max-w-screen-2xl items-center">
        <Link href="/" className="mr-6 flex items-center space-x-2">
          <CookingPot className="h-6 w-6 text-primary" />
          <span className="hidden font-bold font-headline sm:inline-block">
            Family Cookbook Keeper
          </span>
        </Link>
        <div className="flex flex-1 items-center justify-end space-x-4">
          <Button asChild>
            <Link href="/recipes/new">
              <PlusCircle className="mr-2 h-4 w-4" /> Add Recipe
            </Link>
          </Button>
        </div>
      </div>
    </header>
  );
}
