'use client';

import { useEffect, useState, useRef } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { addRecipeAction } from '@/app/actions';
import { Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export function AutoImporter() {
  const searchParams = useSearchParams();
  const router = useRouter();
  
  const [status, setStatus] = useState<string>('Initializing import...');
  const [error, setError] = useState<string | null>(null);
  const [isActive, setIsActive] = useState(false);
  
  const fetchedRef = useRef(false);

  useEffect(() => {
    if (!searchParams) return;
    
    // Web Share API might put the URL in 'url' or 'text'
    const shareUrl = searchParams.get('url');
    const shareText = searchParams.get('text');
    let targetUrl = shareUrl;
    
    if (!targetUrl && shareText && shareText.startsWith('http')) {
      targetUrl = shareText;
    } else if (!targetUrl && shareText) {
      // Try to extract URL from text
      const urlMatch = shareText.match(/https?:\/\/[^\s]+/);
      if (urlMatch) targetUrl = urlMatch[0];
    }
    
    if (targetUrl) {
      setIsActive(true);
      processImport(targetUrl);
    } else if (shareText && shareText.trim().length > 10) {
      setIsActive(true);
      processAiImport(shareText);
    }
  }, [searchParams]);

  async function processAiImport(text: string) {
    if (fetchedRef.current) return;
    fetchedRef.current = true;

    try {
      setStatus(`Using AI to extract recipe from shared text...`);
      
      const response = await fetch('/api/recipe-import/ai', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ text })
      });
      
      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || 'Failed to extract recipe with AI');
      }
      
      const recipe = await response.json();
      setStatus('Cataloging and saving...');
      await saveRecipe(recipe, 'Imported via AI Share');
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'An error occurred during AI import.');
    }
  }

  async function processImport(url: string) {
    if (fetchedRef.current) return;
    fetchedRef.current = true;

    try {
      setStatus(`Fetching recipe from social media URL...`);
      
      const response = await fetch('/api/recipes/import', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ url })
      });
      
      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || 'Failed to import recipe');
      }
      
      const data = await response.json();
      setStatus('Cataloging and saving...');
      await saveRecipe(data.recipe, `Imported from ${url}`);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'An error occurred during import.');
    }
  }

  async function saveRecipe(recipe: any, story: string) {
    try {
      // Auto-save using the action
      const formData = new FormData();
      formData.append('title', recipe.title || 'Imported Recipe');
      formData.append('contributor', 'Imported via Share');
      formData.append('prepTime', recipe.prepTime?.toString() || '0');
      formData.append('cookTime', recipe.cookTime?.toString() || '0');
      formData.append('servings', recipe.servings?.toString() || '1');
      
      // Format ingredients
      const formattedIngredients = recipe.ingredients
        ? recipe.ingredients.map((i: any) => `${i.amount || ''} ${i.unit || ''} ${i.item}`.trim()).join('\n')
        : '';
      formData.append('ingredients', formattedIngredients);
      
      // Format instructions
      const formattedInstructions = recipe.instructions
        ? recipe.instructions.join('\n')
        : '';
      formData.append('instructions', formattedInstructions);
      
      formData.append('tags', 'imported');
      formData.append('story', story);
      
      const result = await addRecipeAction({ message: '' }, formData);
      
      if (result && result.errors) {
        throw new Error('Validation failed while saving.');
      }
      
      setStatus('Success! Opening recipe...');
      
      // The addRecipeAction will automatically redirect to '/' or '/recipes'
      // We don't need to push here if the action does it, but we can as a fallback
      router.push('/recipes');
      
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'An error occurred during import.');
    }
  }

  if (!isActive) return null;

  return (
    <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-lg border-2 border-primary/20">
        <CardHeader>
          <CardTitle className="text-center text-xl">Importing Recipe</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center py-6 space-y-4">
          {!error ? (
            <>
              <Loader2 className="h-12 w-12 text-primary animate-spin" />
              <p className="text-muted-foreground animate-pulse text-center">{status}</p>
            </>
          ) : (
            <>
              <div className="text-destructive font-medium text-center">{error}</div>
              <button 
                onClick={() => setIsActive(false)}
                className="px-4 py-2 mt-4 bg-secondary text-secondary-foreground rounded-md hover:bg-secondary/80"
              >
                Close
              </button>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
