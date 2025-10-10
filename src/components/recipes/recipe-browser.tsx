'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { RecipeCard } from '@/components/recipe-card';
import { RecipeFilter } from '@/components/recipe-filter';
import { Search, Filter, Grid3x3, List } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface Recipe {
  id: string;
  title: string;
  slug: string;
  course: string | null;
  cuisine: string | null;
  difficulty: string | null;
  prepTime: number | null;
  servings: number | null;
  tags: string;
  summary: string;
  imageUrl: string;
  ingredients: string;
}

interface RecipeBrowserProps {
  onSelectRecipe: (id: string) => void;
}

export function RecipeBrowser({ onSelectRecipe }: RecipeBrowserProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState('');
  const [sortBy, setSortBy] = useState('recent');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const { data: recipes = [], isLoading } = useQuery<Recipe[]>({
    queryKey: ['recipes', searchQuery, selectedTag],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (searchQuery) params.set('query', searchQuery);
      if (selectedTag) params.set('tag', selectedTag);
      
      const res = await fetch(`/api/recipes?${params.toString()}`);
      if (!res.ok) throw new Error('Failed to fetch recipes');
      return res.json();
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Sort recipes
  const sortedRecipes = [...recipes].sort((a, b) => {
    switch (sortBy) {
      case 'title':
        return a.title.localeCompare(b.title);
      case 'prepTime':
        return (a.prepTime || 0) - (b.prepTime || 0);
      case 'recent':
      default:
        return 0; // Keep original order (most recent first from API)
    }
  });

  return (
    <div className="space-y-6">
      {/* Search and Filter Bar */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search recipes by name, ingredients, or tags..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <div className="flex gap-2">
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="recent">Most Recent</SelectItem>
              <SelectItem value="title">Name (A-Z)</SelectItem>
              <SelectItem value="prepTime">Prep Time</SelectItem>
            </SelectContent>
          </Select>

          <div className="flex border rounded-md">
            <Button
              variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('grid')}
              className="rounded-r-none"
            >
              <Grid3x3 className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('list')}
              className="rounded-l-none"
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Tag Filter - To be implemented */}
      {/* <RecipeFilter tags={[]} /> */}

      {/* Results Count */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {isLoading ? 'Loading...' : `${sortedRecipes.length} recipes found`}
        </p>
      </div>

      {/* Recipe Grid/List */}
      {isLoading ? (
        <RecipeGridSkeleton />
      ) : sortedRecipes.length > 0 ? (
        <div className={
          viewMode === 'grid'
            ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6'
            : 'flex flex-col gap-4'
        }>
          {sortedRecipes.map((recipe) => (
            <div
              key={recipe.id}
              onClick={() => onSelectRecipe(recipe.id)}
              className="cursor-pointer transition-transform hover:scale-[1.02]"
            >
              <RecipeCard recipe={recipe as any} />
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 border border-dashed rounded-lg">
          <p className="text-lg text-muted-foreground mb-2">No recipes found</p>
          <p className="text-sm text-muted-foreground">
            {searchQuery || selectedTag
              ? 'Try adjusting your search or filters'
              : 'Start by creating your first recipe!'}
          </p>
        </div>
      )}
    </div>
  );
}

function RecipeGridSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="space-y-3">
          <Skeleton className="h-48 w-full rounded-lg" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
        </div>
      ))}
    </div>
  );
}
