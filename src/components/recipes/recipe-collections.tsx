'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  Card,
  CardContent,
} from '@/components/ui/card';
import { Library } from 'lucide-react';

interface Collection {
  name: string;
  count: number;
  coverImage: string;
  imageHint: string;
}

export function RecipeCollections() {
  const [collections, setCollections] = useState<Collection[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCollections = async () => {
      try {
        const response = await fetch('/api/collections');
        if (response.ok) {
          const data = await response.json();
          setCollections(data);
        }
      } catch (error) {
        console.error('Error fetching collections:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCollections();
  }, []);

  if (loading) {
    return (
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-48 animate-pulse bg-muted rounded-lg" />
        ))}
      </div>
    );
  }

  if (collections.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <Library className="h-16 w-16 text-muted-foreground mb-4" />
        <h3 className="text-xl font-semibold mb-2">No Collections Yet</h3>
        <p className="text-muted-foreground max-w-md">
          Collections will appear here as you add tags to your recipes.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <Library className="h-6 w-6" />
          Recipe Collections
        </h2>
        <p className="text-muted-foreground">Explore recipes grouped by tag.</p>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {collections.map((collection) => (
          <Link
            key={collection.name}
            href={`/recipes?tag=${collection.name}`}
            className="group block"
          >
            <Card className="flex h-full flex-col overflow-hidden transition-all duration-300 ease-in-out group-hover:shadow-xl group-hover:border-primary/50">
              <div className="relative aspect-video overflow-hidden">
                <Image
                  src="https://placehold.co/600x400/FFFFFF/FFFFFF"
                  alt={collection.name}
                  width={600}
                  height={400}
                  data-ai-hint={collection.imageHint}
                  className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                <div className="absolute bottom-4 left-4">
                  <h2 className="text-2xl font-headline font-bold text-white capitalize">
                    {collection.name}
                  </h2>
                </div>
              </div>
              <CardContent className="pt-4">
                <p className="text-sm text-muted-foreground">
                  {collection.count}{' '}
                  {collection.count === 1 ? 'recipe' : 'recipes'}
                </p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
