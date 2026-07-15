import { getRecipeById } from '@/lib/data';
import { notFound, redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { RecipeEditForm } from '@/components/recipe-edit-form';

type EditRecipePageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function EditRecipePage({ params }: EditRecipePageProps) {
  const resolvedParams = await params;
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    redirect('/login');
  }
  const recipe = await getRecipeById(resolvedParams.id, session.user.id);

  if (!recipe) {
    notFound();
  }

  return (
    <div className='container mx-auto max-w-2xl py-8'>
      <Card>
        <CardHeader>
          <CardTitle className='text-3xl font-headline'>Edit Recipe</CardTitle>
          <CardDescription>
            Make changes to &quot;{recipe.title}&quot;.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <RecipeEditForm recipe={recipe} />
        </CardContent>
      </Card>
    </div>
  );
}
