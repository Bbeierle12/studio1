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
    // Add user message
    addMessage('user', userInput);
    setInput('');
    setIsLoading(true);

    // Simulate AI processing (replace with actual API call)
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Simple conversation flow logic
    let response = '';
    let nextStep = conversationStep;

    switch (conversationStep) {
      case 'initial':
        // User provides recipe name/idea
        setRecipeData(prev => ({ ...prev, title: userInput }));
        response = `Great! "${userInput}" sounds delicious! 🎉 Let's start with the ingredients. What ingredients do you need? You can list them one by one or all at once.`;
        nextStep = 'ingredients';
        break;

      case 'ingredients':
        // Parse ingredients from user input
        const newIngredients = userInput
          .split(/\n|,|;/)
          .map(i => i.trim())
          .filter(i => i.length > 0);
        
        setRecipeData(prev => ({ 
          ...prev, 
          ingredients: [...prev.ingredients, ...newIngredients] 
        }));
        
        if (newIngredients.length > 0) {
          response = `Perfect! I've added ${newIngredients.length} ingredient(s). ${
            recipeData.ingredients.length + newIngredients.length > 3
              ? "That's a good list! Ready to move on to the instructions? (Say 'yes' or add more ingredients)"
              : "Do you have more ingredients to add, or shall we move to the cooking instructions?"
          }`;
        }
        
        // Check if user wants to proceed
        if (userInput.toLowerCase().includes('yes') || 
            userInput.toLowerCase().includes('next') || 
            userInput.toLowerCase().includes('instructions')) {
          response = `Excellent! Now, let's talk about how to prepare ${recipeData.title}. Walk me through the cooking steps. You can describe them in your own words, and I'll help organize them.`;
          nextStep = 'instructions';
        }
        break;

      case 'instructions':
        // Parse instructions
        const newInstructions = userInput
          .split(/\n\n|\d+\.|Step \d+/i)
          .map(i => i.trim())
          .filter(i => i.length > 10); // Filter out very short text
        
        setRecipeData(prev => ({ 
          ...prev, 
          instructions: [...prev.instructions, ...newInstructions] 
        }));
        
        if (newInstructions.length > 0) {
          response = `Got it! I've added ${newInstructions.length} step(s). ${
            recipeData.instructions.length + newInstructions.length > 2
              ? "Looks like we have a good flow! Want to add any final details like prep time, servings, or cuisine type? (or say 'finish' to complete)"
              : "Any more steps to add?"
          }`;
        }
        
        if (userInput.toLowerCase().includes('done') || 
            userInput.toLowerCase().includes('finish') || 
            userInput.toLowerCase().includes('details')) {
          response = `Almost done! Let me ask a few quick details:\n\n• How many servings does this make?\n• How long does it take to prepare? (in minutes)\n• What type of cuisine is this?\n• Difficulty level: Easy, Medium, or Hard?\n\nYou can answer all at once or one by one!`;
          nextStep = 'details';
        }
        break;

      case 'details':
        // Parse details from natural language
        const servingsMatch = userInput.match(/(\d+)\s*(serving|portion|people)/i);
        const timeMatch = userInput.match(/(\d+)\s*(minute|min|hour)/i);
        const cuisineMatch = userInput.match(/(italian|chinese|mexican|french|japanese|indian|thai|american|mediterranean)/i);
        const difficultyMatch = userInput.match(/(easy|medium|hard|difficult)/i);
        
        const updates: Partial<RecipeData> = {};
        
        if (servingsMatch) {
          updates.servings = parseInt(servingsMatch[1]);
        }
        if (timeMatch) {
          const time = parseInt(timeMatch[1]);
          updates.prepTime = timeMatch[2].toLowerCase().includes('hour') ? time * 60 : time;
        }
        if (cuisineMatch) {
          updates.cuisine = cuisineMatch[1].charAt(0).toUpperCase() + cuisineMatch[1].slice(1).toLowerCase();
        }
        if (difficultyMatch) {
          const diff = difficultyMatch[1].toLowerCase();
          updates.difficulty = diff === 'hard' || diff === 'difficult' ? 'Hard' : 
                              diff === 'medium' ? 'Medium' : 'Easy';
        }
        
        setRecipeData(prev => ({ ...prev, ...updates }));
        
        const detailsAdded = Object.keys(updates).length;
        if (detailsAdded > 0) {
          response = `Perfect! I've captured ${detailsAdded} detail(s). ${
            updates.servings && updates.prepTime 
              ? `Your ${recipeData.title} is ready to save! Check the preview on the right. Want to add any tags or a personal story about this recipe?`
              : "Anything else you'd like to add? Or say 'finish' to complete your recipe!"
          }`;
        } else {
          response = "I didn't catch those details. Could you try again? For example: 'Serves 4, takes 30 minutes, Italian cuisine, medium difficulty'";
        }
        
        if (userInput.toLowerCase().includes('finish') || 
            userInput.toLowerCase().includes('save') || 
            userInput.toLowerCase().includes('done')) {
          response = `🎉 Wonderful! Your recipe "${recipeData.title}" is complete! You can review it in the preview panel on the right, make any edits if needed, and then save it to your collection. Great job!`;
          nextStep = 'complete';
        }
        break;

      case 'complete':
        response = "Your recipe is all set! Use the 'Save Recipe' button in the preview panel to save it, or say 'start over' to create another recipe.";
        
        if (userInput.toLowerCase().includes('start') || 
            userInput.toLowerCase().includes('new') || 
            userInput.toLowerCase().includes('another')) {
          setRecipeData({
            title: '',
            ingredients: [],
            instructions: [],
            tags: [],
          });
          response = "Great! Let's create another masterpiece! What recipe would you like to make?";
          nextStep = 'initial';
        }
        break;
    }

    setConversationStep(nextStep);
    addMessage('assistant', response);
    setIsLoading(false);
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
