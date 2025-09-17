'use client';

import { useState, useEffect, useMemo } from 'react';
import { getRecipes, getTags } from '@/lib/data';
import type { Recipe } from '@/lib/types';
import { RecipeCard } from '@/components/recipe-card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search } from 'lucide-react';

export default function Home() {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [allTags, setAllTags] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      const fetchedRecipes = await getRecipes();
      const fetchedTags = await getTags();
      setRecipes(fetchedRecipes);
      setAllTags(fetchedTags);
    }
    fetchData();
  }, []);

  const filteredRecipes = useMemo(() => {
    return recipes.filter(recipe => {
      const searchMatch =
        searchTerm === '' ||
        recipe.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        recipe.ingredients.toLowerCase().includes(searchTerm.toLowerCase()) ||
        recipe.contributor.toLowerCase().includes(searchTerm.toLowerCase());
      
      const tagMatch = selectedTag === null || recipe.tags.includes(selectedTag);

      return searchMatch && tagMatch;
    });
  }, [recipes, searchTerm, selectedTag]);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8 text-center">
        <h1 className="text-4xl font-headline font-bold tracking-tight lg:text-5xl">
          Our Family Recipes
        </h1>
        <p className="mt-2 text-lg text-muted-foreground">
          A collection of memories and flavors.
        </p>
      </div>

      <div className="mb-8 flex flex-col gap-4 md:flex-row">
        <div className="relative flex-grow">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search by title, ingredient, or contributor..."
            className="w-full pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant={selectedTag === null ? 'default' : 'secondary'}
            onClick={() => setSelectedTag(null)}
            className="rounded-full"
          >
            All
          </Button>
          {allTags.map(tag => (
            <Button
              key={tag}
              variant={selectedTag === tag ? 'default' : 'secondary'}
              onClick={() => setSelectedTag(tag)}
              className="rounded-full capitalize"
            >
              {tag}
            </Button>
          ))}
        </div>
      </div>

      {filteredRecipes.length > 0 ? (
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredRecipes.map(recipe => (
            <RecipeCard key={recipe.id} recipe={recipe} />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-border bg-card p-12 text-center">
            <p className="text-lg font-medium text-muted-foreground">No recipes found.</p>
            <p className="text-sm text-muted-foreground/80">Try adjusting your search or filters.</p>
        </div>
      )}
    </div>
  );
}
