import { getRecipeById } from '@/lib/data';
import { notFound } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { RecipeEditForm } from '@/components/recipe-edit-form';

type EditRecipePageProps = {
    params: {
        id: string;
    };
};

export default async function EditRecipePage({ params }: EditRecipePageProps) {
    const recipe = await getRecipeById(params.id);

    if (!recipe) {
        notFound();
    }

    return (
        <div className="container mx-auto max-w-2xl py-8">
            <Card>
                <CardHeader>
                    <CardTitle className="text-3xl font-headline">Edit Recipe</CardTitle>
                    <CardDescription>Make changes to "{recipe.title}".</CardDescription>
                </CardHeader>
                <CardContent>
                    <RecipeEditForm recipe={recipe} />
                </CardContent>
            </Card>
        </div>
    );
}
