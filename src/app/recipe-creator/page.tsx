import { RecipeChatInterface } from '@/components/recipe-chat/recipe-chat-interface';

export const metadata = {
  title: 'AI Recipe Creator | Studio1',
  description: 'Create recipes with AI assistance through conversational chat',
};

export default function RecipeChatPage() {
  return (
    <main className="h-screen">
      <RecipeChatInterface />
    </main>
  );
}
