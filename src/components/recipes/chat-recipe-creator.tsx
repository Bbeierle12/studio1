'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Send, 
  Sparkles, 
  ChefHat, 
  X, 
  Eye,
  Filter,
  Settings,
  Loader2
} from 'lucide-react';
import { AnimatedBackground } from './animated-background';
import { ChatMessage } from './chat-message';
import { RecipePreviewPanel } from './recipe-preview-panel';
import { RecipeFilterSidebar } from './recipe-filter-sidebar';
import { useAuth } from '@/context/auth-context';
import { useToast } from '@/hooks/use-toast';
import type { Recipe } from '@/lib/types';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface RecipeData {
  title: string;
  ingredients: string[];
  instructions: string[];
  tags: string[];
  prepTime?: number;
  servings?: number;
  course?: string;
  cuisine?: string;
  difficulty?: string;
  story?: string;
}

export function ChatRecipeCreator() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: "Hi! I'm your AI recipe assistant. 🍳 Let's create an amazing recipe together! What would you like to cook today?",
      timestamp: new Date(),
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPreview, setShowPreview] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [recipeData, setRecipeData] = useState<RecipeData>({
    title: '',
    ingredients: [],
    instructions: [],
    tags: [],
  });
  const [conversationStep, setConversationStep] = useState<
    'initial' | 'title' | 'ingredients' | 'instructions' | 'details' | 'complete'
  >('initial');
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const addMessage = (role: 'user' | 'assistant', content: string) => {
    const newMessage: Message = {
      id: Date.now().toString(),
      role,
      content,
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, newMessage]);
  };

  const processUserInput = async (userInput: string) => {
    addMessage('user', userInput);
    setInput('');
    setIsLoading(true);

    try {
      // Prepare messages for API (strip timestamp/id)
      const apiMessages = messages.map(m => ({
        role: m.role,
        content: m.content,
      })).concat({ role: 'user', content: userInput });

      const res = await fetch('/api/recipe-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: apiMessages,
          recipeData,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        console.error('Recipe chat API error:', errorData);
        throw new Error(errorData.details || errorData.error || 'AI chat failed');
      }
      const data = await res.json();

      // Update recipe data with extracted info
      if (data.extractedData) {
        setRecipeData(prev => {
          const updated = { ...prev };
          if (data.extractedData.title) updated.title = data.extractedData.title;
          if (data.extractedData.ingredients?.length) {
            updated.ingredients = [
              ...new Set([...(prev.ingredients || []), ...data.extractedData.ingredients])
            ];
          }
          if (data.extractedData.instructions?.length) {
            updated.instructions = [
              ...new Set([...(prev.instructions || []), ...data.extractedData.instructions])
            ];
          }
          if (data.extractedData.servings) updated.servings = data.extractedData.servings;
          if (data.extractedData.prepTime) updated.prepTime = data.extractedData.prepTime;
          if (data.extractedData.cuisine) updated.cuisine = data.extractedData.cuisine;
          if (data.extractedData.difficulty) updated.difficulty = data.extractedData.difficulty;
          if (data.extractedData.tags?.length) {
            updated.tags = [
              ...new Set([...(prev.tags || []), ...data.extractedData.tags])
            ];
          }
          return updated;
        });
      }

      // Advance conversation step based on completeness
      if (
        data.extractedData?.title &&
        data.extractedData?.ingredients?.length > 0 &&
        data.extractedData?.instructions?.length > 0 &&
        data.extractedData?.prepTime
      ) {
        setConversationStep('complete');
      } else if (
        data.extractedData?.title &&
        data.extractedData?.ingredients?.length > 0 &&
        data.extractedData?.instructions?.length > 0
      ) {
        setConversationStep('details');
      } else if (
        data.extractedData?.title &&
        data.extractedData?.ingredients?.length > 0
      ) {
        setConversationStep('instructions');
      } else if (data.extractedData?.title) {
        setConversationStep('ingredients');
      }

      // Add AI response
      addMessage('assistant', data.response || '');
    } catch (error) {
      console.error('Chat error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      addMessage('assistant', `Sorry, I had trouble understanding that. Could you try rephrasing? 😅\n\n(Error: ${errorMessage})`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;
    await processUserInput(input.trim());
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-background">
      {/* Animated Background */}
      <AnimatedBackground />

      {/* Filter Sidebar */}
      <RecipeFilterSidebar 
        isOpen={showFilters}
        onClose={() => setShowFilters(false)}
      />

      {/* Main Chat Container */}
      <div className="relative h-full flex">
        {/* Chat Area */}
        <div className={`flex-1 flex flex-col transition-all duration-300 ${
          showPreview ? 'mr-96' : ''
        }`}>
          {/* Header */}
          <div className="relative z-10 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="container mx-auto px-4 py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => window.history.back()}
                  className="mr-2"
                >
                  <X className="h-5 w-5" />
                </Button>
                <div className="relative">
                  <ChefHat className="h-8 w-8 text-primary" />
                  <Sparkles className="h-4 w-4 text-yellow-500 absolute -top-1 -right-1 animate-pulse" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold">Recipe Creator</h1>
                  <p className="text-sm text-muted-foreground">
                    AI-Powered Conversational Recipe Building
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowFilters(!showFilters)}
                >
                  <Filter className="h-4 w-4 mr-2" />
                  Filters
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowPreview(!showPreview)}
                >
                  {showPreview ? (
                    <>
                      <X className="h-4 w-4 mr-2" />
                      Hide Preview
                    </>
                  ) : (
                    <>
                      <Eye className="h-4 w-4 mr-2" />
                      Show Preview
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>

          {/* Messages Area */}
          <ScrollArea className="flex-1 px-4">
            <div className="container mx-auto max-w-4xl py-8 space-y-4">
              {messages.map((message) => (
                <ChatMessage key={message.id} message={message} />
              ))}
              
              {isLoading && (
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <ChefHat className="h-4 w-4 text-primary" />
                  </div>
                  <Card className="flex-1 p-4 bg-muted/50">
                    <div className="flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span className="text-sm text-muted-foreground">Thinking...</span>
                    </div>
                  </Card>
                </div>
              )}
              
              <div ref={messagesEndRef} />
            </div>
          </ScrollArea>

          {/* Input Area */}
          <div className="relative z-10 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="container mx-auto max-w-4xl px-4 py-4">
              <div className="flex items-end gap-2">
                <div className="flex-1 relative">
                  <Input
                    ref={inputRef}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Type your message... (Press Enter to send)"
                    className="pr-12 min-h-[44px]"
                    disabled={isLoading}
                  />
                  {input.length > 0 && (
                    <Badge 
                      variant="secondary" 
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-xs"
                    >
                      {input.length}
                    </Badge>
                  )}
                </div>
                <Button
                  onClick={handleSend}
                  disabled={!input.trim() || isLoading}
                  size="lg"
                  className="px-6"
                >
                  {isLoading ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <>
                      <Send className="h-5 w-5 mr-2" />
                      Send
                    </>
                  )}
                </Button>
              </div>
              
              {/* Quick Suggestions */}
              {conversationStep === 'initial' && messages.length === 1 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  <Badge 
                    variant="outline" 
                    className="cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors"
                    onClick={() => processUserInput("Chocolate Chip Cookies")}
                  >
                    Chocolate Chip Cookies
                  </Badge>
                  <Badge 
                    variant="outline" 
                    className="cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors"
                    onClick={() => processUserInput("Spaghetti Carbonara")}
                  >
                    Spaghetti Carbonara
                  </Badge>
                  <Badge 
                    variant="outline" 
                    className="cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors"
                    onClick={() => processUserInput("Caesar Salad")}
                  >
                    Caesar Salad
                  </Badge>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Recipe Preview Panel */}
        {showPreview && (
          <RecipePreviewPanel 
            recipeData={recipeData}
            conversationStep={conversationStep}
            onClose={() => setShowPreview(false)}
          />
        )}
      </div>
    </div>
  );
}
