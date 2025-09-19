import { RecipeGenerator } from '@/components/recipe-generator';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertTriangle } from 'lucide-react';
import { Suspense } from 'react';

type GenerateRecipePageProps = {
  searchParams?: {
    error?: string;
  };
};

function ErrorMessage({ error }: { error?: string }) {
  if (!error) return null;

  const title = error === 'validation' ? 'Invalid Input' : 'Generation Failed';
  const description =
    error === 'validation'
      ? 'Please make sure you provide a title and an image.'
      : 'The AI failed to generate a recipe. Please try again.';

  return (
    <Alert variant='destructive' className='mb-6'>
      <AlertTriangle className='h-4 w-4' />
      <AlertTitle>{title}</AlertTitle>
      <AlertDescription>{description}</AlertDescription>
    </Alert>
  );
}

export default function GenerateRecipePage({
  searchParams,
}: GenerateRecipePageProps) {
  return (
    <div className='container mx-auto max-w-2xl py-8'>
      <Card>
        <CardHeader>
          <CardTitle className='text-3xl font-headline'>
            Generate Recipe with AI
          </CardTitle>
          <CardDescription>
            Upload a picture of a dish and let AI create a recipe for you.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Suspense fallback={null}>
            <ErrorMessage error={searchParams?.error} />
          </Suspense>
          <RecipeGenerator />
        </CardContent>
      </Card>
    </div>
  );
}
