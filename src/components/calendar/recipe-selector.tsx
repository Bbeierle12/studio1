'use client';

import { useState, useMemo } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Search, Clock, Users, ChefHat, Image as ImageIcon } from 'lucide-react';
import Image from 'next/image';

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

interface RecipeSelectorProps {
  recipes: Recipe[];
  onSelect: (recipe: Recipe) => void;
  selectedRecipeId?: string;
}

export function RecipeSelector({ recipes, onSelect, selectedRecipeId }: RecipeSelectorProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCourse, setSelectedCourse] = useState<string>('all');
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('all');

  // Extract unique courses and difficulties
  const courses = useMemo(() => {
    const uniqueCourses = new Set(recipes.map(r => r.course).filter(Boolean) as string[]);
    return ['all', ...Array.from(uniqueCourses)];
  }, [recipes]);

  const difficulties = useMemo(() => {
    const uniqueDifficulties = new Set(recipes.map(r => r.difficulty).filter(Boolean) as string[]);
    return ['all', ...Array.from(uniqueDifficulties)];
  }, [recipes]);

  // Filter recipes based on search and filters
  const filteredRecipes = useMemo(() => {
    return recipes.filter(recipe => {
      // Search filter
      const matchesSearch = searchQuery === '' || 
        recipe.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        recipe.summary.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (recipe.cuisine && recipe.cuisine.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (recipe.tags && recipe.tags.toLowerCase().includes(searchQuery.toLowerCase()));

      // Course filter
      const matchesCourse = selectedCourse === 'all' || recipe.course === selectedCourse;

      // Difficulty filter
      const matchesDifficulty = selectedDifficulty === 'all' || recipe.difficulty === selectedDifficulty;

      return matchesSearch && matchesCourse && matchesDifficulty;
    });
  }, [recipes, searchQuery, selectedCourse, selectedDifficulty]);

  const parseTags = (tagsString: string): string[] => {
    try {
      return JSON.parse(tagsString);
    } catch {
      return [];
    }
  };

  return (
    <div className="space-y-4">
      {/* Search Input */}
      <div className="space-y-2">
        <Label htmlFor="recipe-search">Search Recipes</Label>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            id="recipe-search"
            placeholder="Search by name, cuisine, tags..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-4">
        <div className="flex-1 space-y-2">
          <Label htmlFor="course-filter">Course</Label>
          <select
            id="course-filter"
            value={selectedCourse}
            onChange={(e) => setSelectedCourse(e.target.value)}
            className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            {courses.map(course => (
              <option key={course} value={course}>
                {course === 'all' ? 'All Courses' : course}
              </option>
            ))}
          </select>
        </div>

        <div className="flex-1 space-y-2">
          <Label htmlFor="difficulty-filter">Difficulty</Label>
          <select
            id="difficulty-filter"
            value={selectedDifficulty}
            onChange={(e) => setSelectedDifficulty(e.target.value)}
            className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            {difficulties.map(difficulty => (
              <option key={difficulty} value={difficulty}>
                {difficulty === 'all' ? 'All Levels' : difficulty}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Results Count */}
      <div className="text-sm text-muted-foreground">
        {filteredRecipes.length} {filteredRecipes.length === 1 ? 'recipe' : 'recipes'} found
      </div>

      {/* Recipe List */}
      <ScrollArea className="h-[400px] pr-4">
        <div className="space-y-3">
          {filteredRecipes.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <ChefHat className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No recipes found</p>
              <p className="text-sm mt-1">Try adjusting your filters</p>
            </div>
          ) : (
            filteredRecipes.map(recipe => (
              <Card
                key={recipe.id}
                className={`cursor-pointer transition-all hover:shadow-md ${
                  selectedRecipeId === recipe.id
                    ? 'ring-2 ring-primary'
                    : ''
                }`}
                onClick={() => onSelect(recipe)}
              >
                <CardContent className="p-4">
                  <div className="flex gap-4">
                    {/* Recipe Image */}
                    <div className="relative w-24 h-24 flex-shrink-0 rounded-md overflow-hidden bg-muted">
                      {recipe.imageUrl ? (
                        <Image
                          src={recipe.imageUrl}
                          alt={recipe.title}
                          fill
                          className="object-cover"
                          sizes="96px"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <ImageIcon className="h-8 w-8 text-muted-foreground" />
                        </div>
                      )}
                    </div>

                    {/* Recipe Details */}
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-sm mb-1 truncate">
                        {recipe.title}
                      </h4>
                      <p className="text-xs text-muted-foreground mb-2 line-clamp-2">
                        {recipe.summary}
                      </p>

                      {/* Meta Info */}
                      <div className="flex flex-wrap gap-3 text-xs text-muted-foreground mb-2">
                        {recipe.prepTime && (
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            <span>{recipe.prepTime} min</span>
                          </div>
                        )}
                        {recipe.servings && (
                          <div className="flex items-center gap-1">
                            <Users className="h-3 w-3" />
                            <span>{recipe.servings} servings</span>
                          </div>
                        )}
                        {recipe.difficulty && (
                          <Badge variant="outline" className="text-xs">
                            {recipe.difficulty}
                          </Badge>
                        )}
                      </div>

                      {/* Tags */}
                      <div className="flex flex-wrap gap-1">
                        {recipe.course && (
                          <Badge variant="secondary" className="text-xs">
                            {recipe.course}
                          </Badge>
                        )}
                        {recipe.cuisine && (
                          <Badge variant="secondary" className="text-xs">
                            {recipe.cuisine}
                          </Badge>
                        )}
                        {parseTags(recipe.tags).slice(0, 2).map(tag => (
                          <Badge key={tag} variant="outline" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
