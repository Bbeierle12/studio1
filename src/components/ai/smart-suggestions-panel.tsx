'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, Sparkles, TrendingUp } from 'lucide-react';
import { useGenerateMealSuggestions, MealSuggestion } from '@/hooks/use-ai-suggestions';

interface SmartSuggestionsPanelProps {
  date: Date;
  mealType: 'BREAKFAST' | 'LUNCH' | 'DINNER' | 'SNACK';
  weather?: {
    temperature: number;
    condition: string;
    precipitation?: number;
  };
  onSelectSuggestion?: (suggestion: MealSuggestion) => void;
}

export function SmartSuggestionsPanel({
  date,
  mealType,
  weather,
  onSelectSuggestion,
}: SmartSuggestionsPanelProps) {
  const [suggestions, setSuggestions] = useState<MealSuggestion[]>([]);
  const generateSuggestions = useGenerateMealSuggestions();

  const handleGenerateSuggestions = async () => {
    try {
      const result = await generateSuggestions.mutateAsync({
        date: date.toISOString(),
        mealType,
        weather,
        includePreferences: true,
        includeHistory: true,
      });
      setSuggestions(result.suggestions);
    } catch (error) {
      console.error('Error generating suggestions:', error);
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'bg-green-500';
    if (confidence >= 0.6) return 'bg-yellow-500';
    return 'bg-gray-500';
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5" />
              AI Meal Suggestions
            </CardTitle>
            <CardDescription>
              Get personalized meal suggestions based on your preferences and history
            </CardDescription>
          </div>
          <Button
            onClick={handleGenerateSuggestions}
            disabled={generateSuggestions.isPending}
          >
            {generateSuggestions.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-4 w-4" />
                Get Suggestions
              </>
            )}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {suggestions.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Sparkles className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Click "Get Suggestions" to see AI-powered meal recommendations</p>
          </div>
        ) : (
          <div className="space-y-4">
            {suggestions.map((suggestion, index) => (
              <Card key={index} className="border-2 hover:border-primary/50 transition-colors">
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg mb-1">{suggestion.recipeName}</h3>
                      <p className="text-sm text-muted-foreground mb-2">{suggestion.reason}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1">
                        <TrendingUp className="h-4 w-4" />
                        <span className="text-sm font-medium">
                          {Math.round(suggestion.confidence * 100)}%
                        </span>
                      </div>
                      <div className={`w-2 h-2 rounded-full ${getConfidenceColor(suggestion.confidence)}`} />
                    </div>
                  </div>
                  
                  <div className="flex flex-wrap gap-2 mb-3">
                    {suggestion.cuisine && (
                      <Badge variant="outline">{suggestion.cuisine}</Badge>
                    )}
                    {suggestion.calories && (
                      <Badge variant="secondary">{suggestion.calories} cal</Badge>
                    )}
                    {suggestion.tags?.slice(0, 3).map((tag, i) => (
                      <Badge key={i} variant="outline">{tag}</Badge>
                    ))}
                  </div>

                  <p className="text-xs text-muted-foreground mb-3">
                    {suggestion.reasoning}
                  </p>

                  {onSelectSuggestion && (
                    <Button
                      size="sm"
                      className="w-full"
                      onClick={() => onSelectSuggestion(suggestion)}
                    >
                      Add to Meal Plan
                    </Button>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
