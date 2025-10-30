'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command';
import {
  CookingPot,
  Home,
  CalendarDays,
  Users,
  Bookmark,
  Settings,
  Search,
  Plus,
  ShoppingCart,
  Mic,
} from 'lucide-react';

export function CommandPalette() {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen(open => !open);
      }
    };

    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, []);

  const runCommand = useCallback((command: () => void) => {
    setOpen(false);
    command();
  }, []);

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder="Type a command or search..." />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>

        <CommandGroup heading="Navigation">
          <CommandItem
            onSelect={() => runCommand(() => router.push('/'))}
          >
            <Home className="mr-2 h-4 w-4" />
            <span>Foyer</span>
          </CommandItem>
          <CommandItem
            onSelect={() => runCommand(() => router.push('/recipes'))}
          >
            <CookingPot className="mr-2 h-4 w-4" />
            <span>Recipe Hub</span>
          </CommandItem>
          <CommandItem
            onSelect={() => runCommand(() => router.push('/meal-plan'))}
          >
            <CalendarDays className="mr-2 h-4 w-4" />
            <span>Meal Plan</span>
          </CommandItem>
          <CommandItem
            onSelect={() => runCommand(() => router.push('/household'))}
          >
            <Users className="mr-2 h-4 w-4" />
            <span>Family</span>
          </CommandItem>
          <CommandItem
            onSelect={() => runCommand(() => router.push('/saved'))}
          >
            <Bookmark className="mr-2 h-4 w-4" />
            <span>Saved Recipes</span>
          </CommandItem>
          <CommandItem
            onSelect={() => runCommand(() => router.push('/settings'))}
          >
            <Settings className="mr-2 h-4 w-4" />
            <span>Settings</span>
          </CommandItem>
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading="Actions">
          <CommandItem
            onSelect={() => runCommand(() => router.push('/recipes/new'))}
          >
            <Plus className="mr-2 h-4 w-4" />
            <span>Create New Recipe</span>
          </CommandItem>
          <CommandItem
            onSelect={() => runCommand(() => router.push('/recipes?search='))}
          >
            <Search className="mr-2 h-4 w-4" />
            <span>Search Recipes</span>
          </CommandItem>
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading="Tools">
          <CommandItem
            onSelect={() => runCommand(() => {
              // Open shopping list (this would trigger the sheet)
              document.querySelector<HTMLButtonElement>('[aria-label*="Shopping"]')?.click();
            })}
          >
            <ShoppingCart className="mr-2 h-4 w-4" />
            <span>View Shopping List</span>
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
