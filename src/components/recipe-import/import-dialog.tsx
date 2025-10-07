'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useMutation } from '@tanstack/react-query'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { toast } from 'sonner'
import {
  Import,
  Link,
  FileText,
  Check,
  X,
  Loader2,
  ExternalLink,
  Clock,
  Users,
  ChefHat,
  Globe,
  Tag,
  AlertCircle,
  Sparkles,
  Upload,
} from 'lucide-react'
import { RecipeParser, ParsedRecipe } from '@/lib/recipe-parser'

interface RecipeImportDialogProps {
  trigger?: React.ReactNode
  onSuccess?: (recipeId: string) => void
}

export function RecipeImportDialog({ trigger, onSuccess }: RecipeImportDialogProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [importMethod, setImportMethod] = useState<'url' | 'paste'>('url')
  const [url, setUrl] = useState('')
  const [html, setHtml] = useState('')
  const [parsedRecipe, setParsedRecipe] = useState<ParsedRecipe | null>(null)
  const [editedRecipe, setEditedRecipe] = useState<ParsedRecipe | null>(null)

  const parseMutation = useMutation({
    mutationFn: async (data: { url?: string; html?: string }) => {
      const response = await fetch('/api/recipe-import/parse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to parse recipe')
      }

      return response.json()
    },
    onSuccess: (data) => {
      setParsedRecipe(data.recipe)
      setEditedRecipe(data.recipe)
      toast.success('Recipe parsed successfully!')
    },
    onError: (error: Error) => {
      toast.error(error.message)
    },
  })

  const saveMutation = useMutation({
    mutationFn: async (recipe: ParsedRecipe) => {
      const response = await fetch('/api/recipe-import/parse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          html: `<script type="application/ld+json">${JSON.stringify({
            '@type': 'Recipe',
            ...recipe,
          })}</script>`,
          autoSave: true,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to save recipe')
      }

      return response.json()
    },
    onSuccess: (data) => {
      toast.success('Recipe imported successfully!')
      if (onSuccess) {
        onSuccess(data.recipeId)
      }
      router.push(`/recipes/${data.recipeId}`)
      setOpen(false)
      resetForm()
    },
    onError: (error: Error) => {
      toast.error(error.message)
    },
  })

  const handleParse = () => {
    if (importMethod === 'url' && url) {
      parseMutation.mutate({ url })
    } else if (importMethod === 'paste' && html) {
      parseMutation.mutate({ html })
    }
  }

  const handleSave = () => {
    if (editedRecipe) {
      saveMutation.mutate(editedRecipe)
    }
  }

  const resetForm = () => {
    setUrl('')
    setHtml('')
    setParsedRecipe(null)
    setEditedRecipe(null)
    setImportMethod('url')
  }

  const supportedSites = RecipeParser.getSupportedSites()

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" className="gap-2">
            <Import className="h-4 w-4" />
            Import Recipe
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>Import Recipe</DialogTitle>
          <DialogDescription>
            Import recipes from your favorite cooking websites or paste HTML content
          </DialogDescription>
        </DialogHeader>

        {!parsedRecipe ? (
          <>
            <Tabs value={importMethod} onValueChange={(v) => setImportMethod(v as 'url' | 'paste')}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="url" className="gap-2">
                  <Link className="h-4 w-4" />
                  From URL
                </TabsTrigger>
                <TabsTrigger value="paste" className="gap-2">
                  <FileText className="h-4 w-4" />
                  Paste HTML
                </TabsTrigger>
              </TabsList>

              <TabsContent value="url" className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="url">Recipe URL</Label>
                  <Input
                    id="url"
                    type="url"
                    placeholder="https://www.example.com/recipe"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                  />
                  <p className="text-sm text-muted-foreground">
                    Enter the URL of the recipe you want to import
                  </p>
                </div>

                <Alert>
                  <Sparkles className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Supported Sites:</strong>
                    <div className="mt-2 flex flex-wrap gap-1">
                      {supportedSites.slice(0, 10).map((site) => (
                        <Badge key={site} variant="secondary" className="text-xs">
                          {site}
                        </Badge>
                      ))}
                    </div>
                    <p className="mt-2 text-xs">
                      Works with most recipe websites using structured data
                    </p>
                  </AlertDescription>
                </Alert>
              </TabsContent>

              <TabsContent value="paste" className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="html">HTML Content</Label>
                  <Textarea
                    id="html"
                    placeholder="Paste the HTML content of the recipe page here..."
                    value={html}
                    onChange={(e) => setHtml(e.target.value)}
                    className="min-h-[200px] font-mono text-xs"
                  />
                  <p className="text-sm text-muted-foreground">
                    Right-click on the recipe page → View Page Source → Copy and paste here
                  </p>
                </div>
              </TabsContent>
            </Tabs>

            <DialogFooter>
              <Button
                onClick={handleParse}
                disabled={
                  parseMutation.isPending ||
                  (importMethod === 'url' && !url) ||
                  (importMethod === 'paste' && !html)
                }
              >
                {parseMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Parsing...
                  </>
                ) : (
                  <>
                    <Import className="mr-2 h-4 w-4" />
                    Parse Recipe
                  </>
                )}
              </Button>
            </DialogFooter>
          </>
        ) : (
          <ScrollArea className="h-[500px] pr-4">
            <div className="space-y-4">
              {/* Preview Card */}
              <Card>
                <CardHeader>
                  <CardTitle>Recipe Preview</CardTitle>
                  <CardDescription>
                    Review and edit the imported recipe before saving
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Title */}
                  <div className="space-y-2">
                    <Label htmlFor="title">Title</Label>
                    <Input
                      id="title"
                      value={editedRecipe?.title || ''}
                      onChange={(e) =>
                        setEditedRecipe((prev) =>
                          prev ? { ...prev, title: e.target.value } : null
                        )
                      }
                    />
                  </div>

                  {/* Description */}
                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={editedRecipe?.description || ''}
                      onChange={(e) =>
                        setEditedRecipe((prev) =>
                          prev ? { ...prev, description: e.target.value } : null
                        )
                      }
                      className="min-h-[80px]"
                    />
                  </div>

                  {/* Metadata */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>
                        <Clock className="inline h-4 w-4 mr-1" />
                        Total Time
                      </Label>
                      <Input
                        type="number"
                        value={editedRecipe?.totalTime || ''}
                        onChange={(e) =>
                          setEditedRecipe((prev) =>
                            prev
                              ? { ...prev, totalTime: parseInt(e.target.value) || undefined }
                              : null
                          )
                        }
                        placeholder="Minutes"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>
                        <Users className="inline h-4 w-4 mr-1" />
                        Servings
                      </Label>
                      <Input
                        type="number"
                        value={editedRecipe?.servings || ''}
                        onChange={(e) =>
                          setEditedRecipe((prev) =>
                            prev
                              ? { ...prev, servings: parseInt(e.target.value) || undefined }
                              : null
                          )
                        }
                        placeholder="4"
                      />
                    </div>
                  </div>

                  {/* Categories */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>
                        <Globe className="inline h-4 w-4 mr-1" />
                        Cuisine
                      </Label>
                      <Input
                        value={editedRecipe?.cuisine || ''}
                        onChange={(e) =>
                          setEditedRecipe((prev) =>
                            prev ? { ...prev, cuisine: e.target.value } : null
                          )
                        }
                        placeholder="Italian, Asian, etc."
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>
                        <ChefHat className="inline h-4 w-4 mr-1" />
                        Course
                      </Label>
                      <Input
                        value={editedRecipe?.course || ''}
                        onChange={(e) =>
                          setEditedRecipe((prev) =>
                            prev ? { ...prev, course: e.target.value } : null
                          )
                        }
                        placeholder="Main, Dessert, etc."
                      />
                    </div>
                  </div>

                  <Separator />

                  {/* Ingredients */}
                  <div className="space-y-2">
                    <Label>Ingredients ({editedRecipe?.ingredients?.length || 0})</Label>
                    <ScrollArea className="h-[150px] rounded-md border p-3">
                      <ul className="space-y-1">
                        {editedRecipe?.ingredients?.map((ingredient, idx) => (
                          <li key={idx} className="flex items-start gap-2">
                            <Badge variant="outline" className="mt-0.5">
                              {idx + 1}
                            </Badge>
                            <span className="text-sm">{ingredient}</span>
                          </li>
                        ))}
                      </ul>
                    </ScrollArea>
                  </div>

                  {/* Instructions */}
                  <div className="space-y-2">
                    <Label>Instructions ({editedRecipe?.instructions?.length || 0} steps)</Label>
                    <ScrollArea className="h-[150px] rounded-md border p-3">
                      <ol className="space-y-2">
                        {editedRecipe?.instructions?.map((instruction, idx) => (
                          <li key={idx} className="flex gap-2">
                            <Badge className="mt-0.5">{idx + 1}</Badge>
                            <span className="text-sm">{instruction}</span>
                          </li>
                        ))}
                      </ol>
                    </ScrollArea>
                  </div>

                  {/* Source */}
                  {editedRecipe?.sourceUrl && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <ExternalLink className="h-4 w-4" />
                      <a
                        href={editedRecipe.sourceUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:underline"
                      >
                        View original recipe
                      </a>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </ScrollArea>
        )}

        {parsedRecipe && (
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={resetForm}>
              <X className="mr-2 h-4 w-4" />
              Start Over
            </Button>
            <Button onClick={handleSave} disabled={saveMutation.isPending}>
              {saveMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Check className="mr-2 h-4 w-4" />
                  Save Recipe
                </>
              )}
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  )
}