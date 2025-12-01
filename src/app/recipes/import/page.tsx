import { Metadata } from 'next';
import { RecipeImportDialog } from '@/components/recipe-import/import-dialog';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Import, Zap, Globe, ChefHat, Sparkles, Clock } from 'lucide-react';
import { RecipeParser } from '@/lib/recipe-parser';

export const metadata: Metadata = {
  title: 'Import Recipe | Recipe App',
  description: 'Import recipes from your favorite cooking websites',
};

export default function RecipeImportPage() {
  const supportedSites = RecipeParser.getSupportedSites();

  return (
    <div className='container mx-auto py-8 px-4'>
      <div className='max-w-4xl mx-auto space-y-6'>
        {/* Header */}
        <div className='space-y-2'>
          <h1 className='text-3xl font-bold tracking-tight'>Import Recipe</h1>
          <p className='text-muted-foreground'>
            Easily import recipes from your favorite cooking websites
          </p>
        </div>

        {/* Features */}
        <div className='grid gap-4 md:grid-cols-3'>
          <Card>
            <CardHeader className='pb-3'>
              <Zap className='h-8 w-8 text-primary mb-2' />
              <CardTitle className='text-sm'>Instant Import</CardTitle>
            </CardHeader>
            <CardContent>
              <p className='text-xs text-muted-foreground'>
                Paste a URL and we'll extract all recipe details automatically
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className='pb-3'>
              <Globe className='h-8 w-8 text-primary mb-2' />
              <CardTitle className='text-sm'>Wide Support</CardTitle>
            </CardHeader>
            <CardContent>
              <p className='text-xs text-muted-foreground'>
                Works with hundreds of recipe websites worldwide
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className='pb-3'>
              <ChefHat className='h-8 w-8 text-primary mb-2' />
              <CardTitle className='text-sm'>Smart Parsing</CardTitle>
            </CardHeader>
            <CardContent>
              <p className='text-xs text-muted-foreground'>
                Extracts ingredients, instructions, and more
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Import Card */}
        <Card>
          <CardHeader>
            <CardTitle className='flex items-center gap-2'>
              <Import className='h-5 w-5' />
              Import Recipe
            </CardTitle>
            <CardDescription>
              Import a recipe with preview and editing options
            </CardDescription>
          </CardHeader>
          <CardContent className='space-y-4'>
            <RecipeImportDialog />

            <Alert>
              <ChefHat className='h-4 w-4' />
              <AlertDescription>
                <strong>How it works:</strong>
                <ol className='mt-2 ml-4 list-decimal text-sm space-y-1'>
                  <li>Copy the URL of any recipe from a supported website</li>
                  <li>Paste it in the import dialog</li>
                  <li>Review and edit the extracted information</li>
                  <li>Save to your recipe collection</li>
                </ol>
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>

        {/* Supported Sites */}
        <Card>
          <CardHeader>
            <CardTitle className='flex items-center gap-2'>
              <Sparkles className='h-5 w-5' />
              Supported Websites
            </CardTitle>
            <CardDescription>
              We support recipe import from these popular cooking websites
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className='grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2'>
              {supportedSites.map((site) => (
                <Badge key={site} variant='secondary' className='justify-center'>
                  {site}
                </Badge>
              ))}
            </div>
            <p className='text-xs text-muted-foreground mt-4'>
              <strong>Note:</strong> We can import from any website that uses
              standard recipe markup. If a site isn't listed, try it anyway!
            </p>
          </CardContent>
        </Card>

        {/* Tips */}
        <Alert>
          <Clock className='h-4 w-4' />
          <AlertDescription>
            <strong>Tip:</strong> Imported recipes can be edited after saving.
            Original source URLs are preserved for reference.
          </AlertDescription>
        </Alert>
      </div>
    </div>
  );
}
