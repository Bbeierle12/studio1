import { Skeleton } from '@/components/ui/skeleton';
import { ChefHat, BookOpen } from 'lucide-react';

export default function RecipeLoading() {
  return (
    <div className="container mx-auto max-w-4xl py-8 animate-pulse">
      <div className="space-y-4 text-center">
        <Skeleton className="h-12 w-3/4 mx-auto" />
        <div className="mt-2 flex items-center justify-center space-x-4">
          <Skeleton className="h-5 w-24" />
          <Skeleton className="h-5 w-20" />
          <Skeleton className="h-5 w-20" />
        </div>
        <div className="mt-2 flex items-center justify-center gap-2">
            <Skeleton className="h-5 w-32" />
        </div>
      </div>

      <div className="my-8 overflow-hidden rounded-lg">
        <Skeleton className="h-[400px] w-full" />
      </div>

      <div className="mx-auto max-w-2xl">
        <div className="my-8 rounded-lg border bg-card p-6">
          <div className="flex items-center gap-3">
            <ChefHat className="h-8 w-8 text-muted-foreground" />
            <Skeleton className="h-8 w-48" />
          </div>
          <div className="mt-4 space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-2/3" />
          </div>
        </div>

        <div className="my-8 rounded-lg border bg-card p-6">
            <div className="flex items-center gap-3">
                <BookOpen className="h-8 w-8 text-muted-foreground"/>
                <Skeleton className="h-8 w-48" />
            </div>
            <div className="mt-4 space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-5/6" />
            </div>
        </div>

        <div className="grid gap-8 md:grid-cols-3">
          <div className="md:col-span-1">
            <Skeleton className="h-8 w-3/4" />
            <Skeleton className="my-4 h-px w-full" />
            <div className="space-y-3">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-2/3" />
              <Skeleton className="h-4 w-full" />
            </div>
          </div>
          <div className="md:col-span-2">
            <Skeleton className="h-8 w-1/2" />
            <Skeleton className="my-4 h-px w-full" />
            <div className="space-y-3">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
