
'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useDebouncedCallback } from 'use-debounce';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, X } from 'lucide-react';
import { cn } from '@/lib/utils';

type RecipeFilterProps = {
  tags: string[];
};

export function RecipeFilter({ tags }: RecipeFilterProps) {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const { replace } = useRouter();

  const handleSearch = useDebouncedCallback((term: string) => {
    const params = new URLSearchParams(searchParams);
    if (term) {
      params.set('query', term);
    } else {
      params.delete('query');
    }
    replace(`${pathname}?${params.toString()}`);
  }, 300);

  const handleTagClick = (tag: string) => {
    const params = new URLSearchParams(searchParams);
    if (params.get('tag') === tag) {
      params.delete('tag');
    } else {
      params.set('tag', tag);
    }
    replace(`${pathname}?${params.toString()}`);
  };

  const currentTag = searchParams.get('tag');

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
        <Input
          type="search"
          placeholder="Search by title or ingredient..."
          className="pl-10 text-base"
          onChange={e => handleSearch(e.target.value)}
          defaultValue={searchParams.get('query')?.toString()}
        />
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <p className="text-sm font-medium text-muted-foreground">Filter by tag:</p>
        {tags.map(tag => (
          <Button
            key={tag}
            variant={currentTag === tag ? 'default' : 'secondary'}
            size="sm"
            onClick={() => handleTagClick(tag)}
            className="capitalize transition-all"
          >
            {tag}
            {currentTag === tag && <X className="ml-2 h-4 w-4" />}
          </Button>
        ))}
        {currentTag && (
           <Button
             variant="ghost"
             size="sm"
             onClick={() => handleTagClick(currentTag)}
           >
             Clear filter
           </Button>
        )}
      </div>
    </div>
  );
}
