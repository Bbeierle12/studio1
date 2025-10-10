'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { UnifiedRecipeForm } from '@/components/recipes/unified-recipe-form';

export function RecipeCreator() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold">Create Recipe</h2>
        <p className="text-muted-foreground">
          Fill in what you know, import from a URL, or let AI help you - it's all up to you
        </p>
      </div>

      <UnifiedRecipeForm />
    </div>
  );
}
