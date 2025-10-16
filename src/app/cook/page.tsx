"use client";

import { useSearchParams } from 'next/navigation';
import { useEffect, useState, Suspense } from 'react';
import { ChevronLeft, Clock, Volume2, Mic, ChefHat, ListChecks } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import VoiceOverlayDefer from '@/components/voice/VoiceOverlayDefer';
import { useQuery } from '@tanstack/react-query';

interface Recipe {
  id: string;
  title: string;
  ingredients: string;
  instructions: string;
  prepTime?: number;
  cookTime?: number;
  servings?: number;
}

function CookModeContent() {
  const searchParams = useSearchParams();
  const recipeId = searchParams.get('recipe');
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());
  const [activeTimers, setActiveTimers] = useState<Array<{ id: string; label: string; endTime: number }>>([]);
  const [showIngredients, setShowIngredients] = useState(true);

  // Fetch recipe if ID provided
  const { data: recipe, isLoading } = useQuery<Recipe>({
    queryKey: ['recipe', recipeId],
    queryFn: async () => {
      if (!recipeId) return null;
      const res = await fetch(`/api/recipes/${recipeId}`);
      if (!res.ok) throw new Error('Failed to fetch recipe');
      return res.json();
    },
    enabled: !!recipeId,
  });

  // Parse recipe data
  const recipeSteps = recipe?.instructions ? recipe.instructions.split('\n').filter((s: string) => s.trim()) : [];
  const recipeIngredients = recipe?.ingredients ? recipe.ingredients.split('\n').filter((s: string) => s.trim()) : [];

  // Timer management
  const addTimer = (minutes: number, label: string) => {
    const id = Date.now().toString();
    const endTime = Date.now() + minutes * 60 * 1000;
    const newTimer = { id, label, endTime };

    setActiveTimers(prev => [...prev, newTimer]);

    // Persist to localStorage
    const timers = JSON.parse(localStorage.getItem('cookModeTimers') || '[]');
    timers.push(newTimer);
    localStorage.setItem('cookModeTimers', JSON.stringify(timers));

    // Broadcast to other tabs
    const channel = new BroadcastChannel('timers');
    channel.postMessage({ type: 'add', timer: newTimer });
    channel.close();
  };

  const removeTimer = (id: string) => {
    setActiveTimers(prev => prev.filter(t => t.id !== id));

    // Update localStorage
    const timers = JSON.parse(localStorage.getItem('cookModeTimers') || '[]');
    const filtered = timers.filter((t: any) => t.id !== id);
    localStorage.setItem('cookModeTimers', JSON.stringify(filtered));

    // Broadcast removal
    const channel = new BroadcastChannel('timers');
    channel.postMessage({ type: 'remove', id });
    channel.close();
  };

  // Restore timers on mount
  useEffect(() => {
    const stored = localStorage.getItem('cookModeTimers');
    if (stored) {
      const timers = JSON.parse(stored);
      const active = timers.filter((t: any) => t.endTime > Date.now());
      setActiveTimers(active);

      // Clean up expired timers
      if (active.length !== timers.length) {
        localStorage.setItem('cookModeTimers', JSON.stringify(active));
      }
    }

    // Listen for timer updates from other tabs
    const channel = new BroadcastChannel('timers');
    channel.onmessage = (event) => {
      if (event.data.type === 'add') {
        setActiveTimers(prev => [...prev, event.data.timer]);
      } else if (event.data.type === 'remove') {
        setActiveTimers(prev => prev.filter(t => t.id !== event.data.id));
      }
    };

    return () => channel.close();
  }, []);

  // Timer countdown effect
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveTimers(prev => {
        const updated = prev.filter(timer => {
          const remaining = timer.endTime - Date.now();
          if (remaining <= 0) {
            // Timer expired - could trigger notification here
            if ('Notification' in window && Notification.permission === 'granted') {
              new Notification('Timer Complete!', {
                body: timer.label,
                icon: '/icon-192x192.png',
              });
            }
            return false;
          }
          return true;
        });

        // Update localStorage if timers changed
        if (updated.length !== prev.length) {
          localStorage.setItem('cookModeTimers', JSON.stringify(updated));
        }

        return updated;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const toggleStepComplete = (stepIndex: number) => {
    setCompletedSteps(prev => {
      const next = new Set(prev);
      if (next.has(stepIndex)) {
        next.delete(stepIndex);
      } else {
        next.add(stepIndex);
      }
      return next;
    });
  };

  const formatTime = (ms: number) => {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  if (!recipeId) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-amber-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-2xl mx-auto text-center space-y-6">
            <ChefHat className="h-24 w-24 mx-auto text-orange-500" />
            <h1 className="text-4xl font-bold">Cook Mode</h1>
            <p className="text-lg text-muted-foreground">
              Start Cook Mode from any recipe to get hands-free cooking assistance with voice commands, timers, and step-by-step guidance.
            </p>
            <Link href="/recipes">
              <Button size="lg" className="gap-2">
                <ListChecks className="h-5 w-5" />
                Browse Recipes
              </Button>
            </Link>
          </div>
        </div>
      </main>
    );
  }

  if (isLoading) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <ChefHat className="h-16 w-16 mx-auto animate-pulse text-orange-500" />
          <p className="text-lg">Loading recipe...</p>
        </div>
      </main>
    );
  }

  if (!recipe) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <p className="text-lg text-red-600">Recipe not found</p>
          <Link href="/recipes">
            <Button>Back to Recipes</Button>
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="h-dvh flex flex-col bg-gradient-to-br from-orange-50 via-white to-amber-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Header */}
      <header className="flex items-center justify-between p-4 border-b bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
        <div className="flex items-center gap-4">
          <Link href={`/recipes?openRecipe=${recipeId}`}>
            <Button variant="ghost" size="sm" className="gap-2">
              <ChevronLeft className="h-4 w-4" />
              Exit Cook Mode
            </Button>
          </Link>
          <div>
            <h1 className="font-bold text-lg">{recipe.title}</h1>
            <div className="flex gap-4 text-sm text-muted-foreground">
              {recipe.prepTime && <span>Prep: {recipe.prepTime} min</span>}
              {recipe.cookTime && <span>Cook: {recipe.cookTime} min</span>}
              {recipe.servings && <span>Serves: {recipe.servings}</span>}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Badge variant="outline" className="gap-1">
            <Mic className="h-3 w-3" />
            Voice Active
          </Badge>
          <Badge variant="outline" className="gap-1">
            <Volume2 className="h-3 w-3" />
            Audio On
          </Badge>
        </div>
      </header>

      {/* Main content area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left panel - Steps */}
        <div className="flex-1 flex flex-col p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-semibold">
              Step {currentStep + 1} of {recipeSteps.length}
            </h2>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowIngredients(!showIngredients)}
            >
              {showIngredients ? 'Hide' : 'Show'} Ingredients
            </Button>
          </div>

          {/* Current step card */}
          <Card className="flex-1 p-8 mb-6 bg-white dark:bg-gray-800">
            <p className="text-xl leading-relaxed">
              {recipeSteps[currentStep]}
            </p>

            <div className="flex items-center gap-4 mt-8">
              <Button
                variant="outline"
                onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
                disabled={currentStep === 0}
              >
                Previous
              </Button>

              <Button
                variant={completedSteps.has(currentStep) ? "default" : "outline"}
                onClick={() => toggleStepComplete(currentStep)}
                className="flex-1"
              >
                {completedSteps.has(currentStep) ? "✓ Completed" : "Mark Complete"}
              </Button>

              <Button
                onClick={() => setCurrentStep(Math.min(recipeSteps.length - 1, currentStep + 1))}
                disabled={currentStep === recipeSteps.length - 1}
              >
                Next
              </Button>
            </div>
          </Card>

          {/* Step navigation dots */}
          <div className="flex gap-2 justify-center">
            {recipeSteps.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentStep(i)}
                className={cn(
                  "w-3 h-3 rounded-full transition-all",
                  i === currentStep
                    ? "w-8 bg-orange-500"
                    : completedSteps.has(i)
                      ? "bg-green-500"
                      : "bg-gray-300 dark:bg-gray-600"
                )}
              />
            ))}
          </div>
        </div>

        {/* Right panel - Ingredients & Timers */}
        <div className="w-96 border-l bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm p-6 space-y-6">
          {/* Timers section */}
          <div>
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Active Timers
            </h3>
            {activeTimers.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No active timers. Say "Set a timer for X minutes" to start one.
              </p>
            ) : (
              <div className="space-y-2">
                {activeTimers.map(timer => (
                  <Card key={timer.id} className="p-3 flex items-center justify-between">
                    <div>
                      <p className="font-medium">{timer.label}</p>
                      <p className="text-2xl font-mono">
                        {formatTime(Math.max(0, timer.endTime - Date.now()))}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeTimer(timer.id)}
                    >
                      Cancel
                    </Button>
                  </Card>
                ))}
              </div>
            )}
          </div>

          {/* Ingredients section */}
          {showIngredients && (
            <div>
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <ListChecks className="h-4 w-4" />
                Ingredients
              </h3>
              <ScrollArea className="h-96">
                <ul className="space-y-2">
                  {recipeIngredients.map((ingredient, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="text-orange-500 mt-1">•</span>
                      <span className="text-sm">{ingredient}</span>
                    </li>
                  ))}
                </ul>
              </ScrollArea>
            </div>
          )}
        </div>
      </div>

      {/* Voice hint footer */}
      <div className="p-4 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-t text-center">
        <p className="text-sm text-muted-foreground">
          💡 Try saying: "Next step" • "Set timer for 10 minutes" • "Read ingredients" • "What's the current step?"
        </p>
      </div>

      {/* Voice overlay - lazy loaded, only in Cook Mode */}
      <VoiceOverlayDefer
        recipe={recipe ? {
          ...recipe,
          instructions: recipeSteps,
          ingredients: recipeIngredients
        } : undefined}
        currentStep={currentStep}
        onStepChange={setCurrentStep}
        onTimerRequest={addTimer}
        completedSteps={completedSteps}
        onToggleStepComplete={toggleStepComplete}
      />
    </main>
  );
}

export default function CookMode() {
  return (
    <Suspense fallback={
      <main className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <ChefHat className="h-16 w-16 mx-auto animate-pulse text-orange-500" />
          <p className="text-lg">Loading Cook Mode...</p>
        </div>
      </main>
    }>
      <CookModeContent />
    </Suspense>
  );
}