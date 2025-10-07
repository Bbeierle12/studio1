'use client'

import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { toast } from 'sonner'
import {
  Upload,
  Loader2,
  Check,
  X,
  AlertCircle,
  FileText,
  Link,
  Sparkles,
} from 'lucide-react'
import { ParsedRecipe } from '@/lib/recipe-parser'

interface ImportResult {
  url: string
  success: boolean
  recipe?: ParsedRecipe
  error?: string
  recipeId?: string
}

export function BulkRecipeImport() {
  const [urls, setUrls] = useState('')
  const [results, setResults] = useState<ImportResult[]>([])
  const [isImporting, setIsImporting] = useState(false)
  const [progress, setProgress] = useState(0)

  const importMutation = useMutation({
    mutationFn: async (url: string): Promise<ImportResult> => {
      try {
        const response = await fetch('/api/recipe-import/parse', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url, autoSave: true }),
        })

        const data = await response.json()

        if (!response.ok) {
          throw new Error(data.error || 'Failed to import recipe')
        }

        return {
          url,
          success: true,
          recipe: data.recipe,
          recipeId: data.recipeId,
        }
      } catch (error) {
        return {
          url,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        }
      }
    },
  })

  const handleBulkImport = async () => {
    const urlList = urls
      .split('\n')
      .map((u) => u.trim())
      .filter((u) => u.length > 0)
      .filter((u) => {
        try {
          new URL(u)
          return true
        } catch {
          return false
        }
      })

    if (urlList.length === 0) {
      toast.error('Please enter valid URLs')
      return
    }

    setIsImporting(true)
    setResults([])
    setProgress(0)

    const importResults: ImportResult[] = []

    for (let i = 0; i < urlList.length; i++) {
      const url = urlList[i]
      const result = await importMutation.mutateAsync(url)
      importResults.push(result)
      setResults([...importResults])
      setProgress(((i + 1) / urlList.length) * 100)
    }

    setIsImporting(false)

    const successCount = importResults.filter((r) => r.success).length
    const failCount = importResults.filter((r) => !r.success).length

    if (successCount > 0) {
      toast.success(`Successfully imported ${successCount} recipe${successCount > 1 ? 's' : ''}`)
    }
    if (failCount > 0) {
      toast.error(`Failed to import ${failCount} recipe${failCount > 1 ? 's' : ''}`)
    }
  }

  const urlCount = urls
    .split('\n')
    .map((u) => u.trim())
    .filter((u) => u.length > 0).length

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="h-5 w-5" />
          Bulk Recipe Import
        </CardTitle>
        <CardDescription>
          Import multiple recipes at once by entering their URLs
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Textarea
            placeholder="Enter recipe URLs, one per line...
https://www.allrecipes.com/recipe/...
https://www.foodnetwork.com/recipes/..."
            value={urls}
            onChange={(e) => setUrls(e.target.value)}
            className="min-h-[200px] font-mono text-sm"
            disabled={isImporting}
          />
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              {urlCount} URL{urlCount !== 1 ? 's' : ''} entered
            </p>
            <Button
              onClick={handleBulkImport}
              disabled={isImporting || urlCount === 0}
              size="sm"
            >
              {isImporting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Importing ({Math.round(progress)}%)
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4" />
                  Import All
                </>
              )}
            </Button>
          </div>
        </div>

        {isImporting && (
          <div className="space-y-2">
            <Progress value={progress} />
            <p className="text-sm text-muted-foreground text-center">
              Importing recipes... Please wait
            </p>
          </div>
        )}

        {results.length > 0 && (
          <>
            <Separator />
            <div className="space-y-2">
              <h4 className="font-medium text-sm">Import Results</h4>
              <ScrollArea className="h-[300px] rounded-md border p-3">
                <div className="space-y-2">
                  {results.map((result, idx) => (
                    <div
                      key={idx}
                      className="flex items-start gap-2 p-2 rounded-lg hover:bg-accent"
                    >
                      {result.success ? (
                        <Check className="h-4 w-4 text-green-600 mt-0.5" />
                      ) : (
                        <X className="h-4 w-4 text-red-600 mt-0.5" />
                      )}
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center gap-2">
                          {result.recipe ? (
                            <a
                              href={`/recipes/${result.recipeId}`}
                              className="font-medium text-sm hover:underline"
                            >
                              {result.recipe.title}
                            </a>
                          ) : (
                            <span className="font-medium text-sm">Import Failed</span>
                          )}
                          {result.success && (
                            <Badge variant="outline" className="text-xs">
                              Saved
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground truncate">
                          {result.url}
                        </p>
                        {result.error && (
                          <p className="text-xs text-red-600">{result.error}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>
          </>
        )}

        <Alert>
          <Sparkles className="h-4 w-4" />
          <AlertDescription>
            <strong>Supported Sites:</strong> AllRecipes, Food Network, Serious Eats,
            Bon Appétit, NYT Cooking, BBC Good Food, and many more!
            <br />
            <span className="text-xs mt-1 block">
              Works with most recipe websites that use structured data (JSON-LD or microdata)
            </span>
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  )
}