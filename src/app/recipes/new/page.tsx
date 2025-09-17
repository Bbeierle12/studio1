import { RecipeForm } from '@/components/recipe-form';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

export default function NewRecipePage() {
  return (
    <div className="container mx-auto max-w-2xl py-8">
      <Card>
        <CardHeader>
          <CardTitle className="text-3xl font-headline">Add a New Recipe</CardTitle>
          <CardDescription>Share a delicious creation with the family.</CardDescription>
        </CardHeader>
        <CardContent>
          <RecipeForm />
        </CardContent>
      </Card>
    </div>
  );
}
