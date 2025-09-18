import { getRecipes } from '@/lib/data';
import { RecipeCard } from '@/components/recipe-card';
import { Separator } from '@/components/ui/separator';

export default async function RecipesPage() {
  const recipes = await getRecipes();

  return (
    <div className="container mx-auto py-8">
      <div className="space-y-2 mb-8">
        <h1 className="text-3xl font-headline font-extrabold tracking-tight lg:text-4xl">
          Browse Recipes
        </h1>
        <p className="text-muted-foreground">
          Explore the collection of our family's cherished recipes.
        </p>
      </div>
      
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {recipes.map(recipe => (
          <RecipeCard key={recipe.id} recipe={recipe} />
        ))}
      </div>
    </div>
  );
}
