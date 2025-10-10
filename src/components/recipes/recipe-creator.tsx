'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { RecipeForm } from '@/components/recipe-form';
import { RecipeGenerator } from '@/components/recipe-generator';
import { Pencil, Wand2, Globe } from 'lucide-react';

export function RecipeCreator() {
  const [method, setMethod] = useState<'manual' | 'ai' | 'import'>('manual');

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold">Create Recipe</h2>
        <p className="text-muted-foreground">
          Choose how you&apos;d like to create your recipe
        </p>
      </div>

      <Tabs value={method} onValueChange={(v) => setMethod(v as any)}>
        <TabsList className="grid w-full grid-cols-3 max-w-lg">
          <TabsTrigger value="manual" className="gap-2">
            <Pencil className="h-4 w-4" />
            <span className="hidden sm:inline">Write Manually</span>
            <span className="sm:hidden">Manual</span>
          </TabsTrigger>
          <TabsTrigger value="ai" className="gap-2">
            <Wand2 className="h-4 w-4" />
            <span className="hidden sm:inline">Generate with AI</span>
            <span className="sm:hidden">AI</span>
          </TabsTrigger>
          <TabsTrigger value="import" className="gap-2">
            <Globe className="h-4 w-4" />
            <span className="hidden sm:inline">Import from URL</span>
            <span className="sm:hidden">Import</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="manual" className="mt-6">
          <Card className="p-6">
            <div className="mb-4">
              <h3 className="text-xl font-semibold mb-2">Manual Entry</h3>
              <p className="text-sm text-muted-foreground">
                Fill in all recipe details manually
              </p>
            </div>
            <RecipeForm />
          </Card>
        </TabsContent>

        <TabsContent value="ai" className="mt-6">
          <Card className="p-6">
            <div className="mb-4">
              <h3 className="text-xl font-semibold mb-2">AI Recipe Generator</h3>
              <p className="text-sm text-muted-foreground">
                Upload a photo and let AI create the recipe for you
              </p>
            </div>
            <RecipeGenerator />
          </Card>
        </TabsContent>

        <TabsContent value="import" className="mt-6">
          <Card className="p-6">
            <div className="mb-4">
              <h3 className="text-xl font-semibold mb-2">Import from URL</h3>
              <p className="text-sm text-muted-foreground">
                Paste a recipe URL and we&apos;ll extract the details
              </p>
            </div>
            <RecipeImportForm />
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Temporary placeholder for import form
function RecipeImportForm() {
  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Import functionality will be integrated here
      </p>
      <div className="text-xs text-muted-foreground">
        (Moving from /recipes/import to this unified view)
      </div>
    </div>
  );
}
