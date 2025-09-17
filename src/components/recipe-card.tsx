import Link from 'next/link';
import Image from 'next/image';
import type { Recipe } from '@/lib/types';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

type RecipeCardProps = {
  recipe: Recipe;
};

export function RecipeCard({ recipe }: RecipeCardProps) {
  return (
    <Link href={`/recipes/${recipe.id}`} className="group block">
      <Card className="flex h-full flex-col overflow-hidden transition-all duration-300 ease-in-out group-hover:shadow-xl group-hover:border-primary/50">
        <CardHeader>
          <CardTitle className="line-clamp-2 font-headline text-xl leading-tight">
            {recipe.title}
          </CardTitle>
          <CardDescription>by {recipe.contributor}</CardDescription>
        </CardHeader>
        <CardContent className="flex-grow p-0">
          <div className="aspect-video overflow-hidden">
            <Image
              src={recipe.imageUrl}
              alt={recipe.title}
              width={600}
              height={400}
              data-ai-hint={recipe.imageHint}
              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
          </div>
          <p className="mt-4 px-6 text-sm text-muted-foreground line-clamp-3">
            {recipe.summary}
          </p>
        </CardContent>
        <CardFooter className="mt-auto flex flex-wrap gap-2 pt-4">
          {recipe.tags.map(tag => (
            <Badge key={tag} variant="secondary" className="capitalize">
              {tag}
            </Badge>
          ))}
        </CardFooter>
      </Card>
    </Link>
  );
}
