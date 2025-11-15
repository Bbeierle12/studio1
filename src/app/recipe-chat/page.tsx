'use client';

import { Suspense, lazy } from 'react';
import { Skeleton } from '@/components/ui/skeleton';

// Lazy load chat creator to avoid SSR issues with canvas
const ChatRecipeCreator = lazy(() =>
  import('@/components/recipes/chat-recipe-creator').then(mod => ({
    default: mod.ChatRecipeCreator
  }))
);

function ChatRecipeCreatorWrapper() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center h-[600px]">
        <div className="text-center">
          <Skeleton className="h-12 w-12 rounded-full mx-auto mb-4" />
          <p className="text-muted-foreground">Loading chat interface...</p>
        </div>
      </div>
    }>
      <ChatRecipeCreator />
    </Suspense>
  );
}

export default function RecipeChatPage() {
  return <ChatRecipeCreatorWrapper />;
}
