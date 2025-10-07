import { Metadata } from 'next'
import { RecipeImportDialog } from '@/components/recipe-import/import-dialog'
import { BulkRecipeImport } from '@/components/recipe-import/bulk-import'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import {
  Import,
  Link,
  Upload,
  Zap,
  Globe,
  ChefHat,
  Sparkles,
  BookOpen,
  Clock,
} from 'lucide-react'
import { RecipeParser } from '@/lib/recipe-parser'

export const metadata: Metadata = {
  title: 'Import Recipes | Meal Planner',
  description: 'Import recipes from your favorite cooking websites',
}

export default function RecipeImportPage() {
  const supportedSites = RecipeParser.getSupportedSites()

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">Import Recipes</h1>
          <p className="text-muted-foreground">
            Easily import recipes from your favorite cooking websites or add multiple recipes at once
          </p>
        </div>

        {/* Features */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="pb-3">
              <Zap className="h-8 w-8 text-primary mb-2" />
              <CardTitle className="text-sm">Instant Import</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">
                Paste a URL and we'll extract all recipe details automatically
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <Globe className="h-8 w-8 text-primary mb-2" />
              <CardTitle className="text-sm">Wide Support</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">
                Works with hundreds of recipe websites worldwide
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <BookOpen className="h-8 w-8 text-primary mb-2" />
              <CardTitle className="text-sm">Smart Parsing</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">
                Extracts ingredients, instructions, nutrition, and more
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Import Tabs */}
        <Tabs defaultValue="single" className="space-y-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="single" className="gap-2">
              <Link className="h-4 w-4" />
              Single Recipe
            </TabsTrigger>
            <TabsTrigger value="bulk" className="gap-2">
              <Upload className="h-4 w-4" />
              Bulk Import
            </TabsTrigger>
          </TabsList>

          <TabsContent value="single" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Import className="h-5 w-5" />
                  Import Single Recipe
                </CardTitle>
                <CardDescription>
                  Import one recipe at a time with preview and editing options
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <RecipeImportDialog />

                <Alert>
                  <ChefHat className="h-4 w-4" />
                  <AlertDescription>
                    <strong>How it works:</strong>
                    <ol className="mt-2 ml-4 list-decimal text-sm space-y-1">
                      <li>Copy the URL of any recipe from a supported website</li>
                      <li>Paste it in the import dialog</li>
                      <li>Review and edit the extracted information</li>
                      <li>Save to your recipe collection</li>
                    </ol>
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="bulk" className="space-y-4">
            <BulkRecipeImport />
          </TabsContent>
        </Tabs>

        {/* Supported Sites */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5" />
              Supported Websites
            </CardTitle>
            <CardDescription>
              We support recipe import from these popular cooking websites and many more
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
              {supportedSites.map((site) => (
                <Badge key={site} variant="secondary" className="justify-center">
                  {site}
                </Badge>
              ))}
            </div>
            <p className="text-xs text-muted-foreground mt-4">
              <strong>Note:</strong> We can import from any website that uses standard recipe
              markup (JSON-LD or Microdata). If a site isn't listed but has recipe pages, try
              importing anyway!
            </p>
          </CardContent>
        </Card>

        {/* Tips */}
        <Alert>
          <Clock className="h-4 w-4" />
          <AlertDescription>
            <strong>Pro Tips:</strong>
            <ul className="mt-2 ml-4 list-disc text-sm space-y-1">
              <li>Use bulk import to quickly build your recipe collection</li>
              <li>Imported recipes can be edited after saving</li>
              <li>Nutrition data is extracted when available</li>
              <li>Original source URLs are preserved for reference</li>
            </ul>
          </AlertDescription>
        </Alert>
      </div>
    </div>
  )
}