'use client';

import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2, Send, MessageSquare, CheckCircle2, XCircle } from 'lucide-react';
import { useNLPMealPlanning, NLPPlanResult } from '@/hooks/use-nlp-planning';
import { Badge } from '@/components/ui/badge';

interface NLPCommandInputProps {
  onSuccess?: (result: NLPPlanResult) => void;
  placeholder?: string;
}

export function NLPCommandInput({ onSuccess, placeholder }: NLPCommandInputProps) {
  const [command, setCommand] = useState('');
  const [result, setResult] = useState<NLPPlanResult | null>(null);
  const nlpPlanning = useNLPMealPlanning();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!command.trim()) return;

    try {
      const response = await nlpPlanning.mutateAsync(command);
      setResult(response);
      if (response.success && onSuccess) {
        onSuccess(response);
      }
      if (response.success && !response.clarificationNeeded) {
        setCommand('');
      }
    } catch (error) {
      console.error('Error processing command:', error);
    }
  };

  const exampleCommands = [
    'Add spaghetti carbonara for Tuesday dinner',
    'Remove lunch from tomorrow',
    'Plan meals for next week',
    'Add chicken stir fry for Friday',
  ];

  return (
    <div className="space-y-4">
      <form onSubmit={handleSubmit} className="flex gap-2">
        <div className="relative flex-1">
          <MessageSquare className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={command}
            onChange={(e) => setCommand(e.target.value)}
            placeholder={placeholder || 'Try: "Add pasta for Tuesday dinner"'}
            className="pl-10"
            disabled={nlpPlanning.isPending}
          />
        </div>
        <Button type="submit" disabled={nlpPlanning.isPending || !command.trim()}>
          {nlpPlanning.isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <>
              <Send className="mr-2 h-4 w-4" />
              Send
            </>
          )}
        </Button>
      </form>

      {/* Example Commands */}
      {!result && (
        <div className="flex flex-wrap gap-2">
          <span className="text-xs text-muted-foreground">Try:</span>
          {exampleCommands.map((example, i) => (
            <Button
              key={i}
              variant="outline"
              size="sm"
              className="text-xs h-7"
              onClick={() => setCommand(example)}
            >
              {example}
            </Button>
          ))}
        </div>
      )}

      {/* Results */}
      {result && (
        <Card className={result.success ? 'border-green-500' : 'border-yellow-500'}>
          <CardContent className="pt-6">
            <div className="space-y-3">
              {/* Clarification Needed */}
              {result.clarificationNeeded && result.question && (
                <div className="flex items-start gap-2">
                  <MessageSquare className="h-5 w-5 text-yellow-500 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-medium mb-1">Clarification Needed</p>
                    <p className="text-sm text-muted-foreground">{result.question}</p>
                  </div>
                </div>
              )}

              {/* Success Message */}
              {result.success && !result.clarificationNeeded && (
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-medium mb-2">Command Processed Successfully</p>
                    {result.intent && (
                      <Badge variant="outline" className="mb-2">
                        {result.intent}
                      </Badge>
                    )}
                    {result.results && result.results.length > 0 && (
                      <div className="space-y-1 mt-2">
                        {result.results.map((actionResult, i) => (
                          <div key={i} className="flex items-center gap-2 text-sm">
                            {actionResult.success ? (
                              <CheckCircle2 className="h-4 w-4 text-green-500" />
                            ) : (
                              <XCircle className="h-4 w-4 text-red-500" />
                            )}
                            <span className="text-muted-foreground">
                              {actionResult.action === 'add' && actionResult.success && (
                                `Added meal successfully`
                              )}
                              {actionResult.action === 'remove' && actionResult.success && (
                                `Removed ${actionResult.deletedCount || 0} meal(s)`
                              )}
                              {!actionResult.success && actionResult.error}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Actions */}
              {result.actions && result.actions.length > 0 && (
                <div className="mt-3 space-y-1">
                  <p className="text-xs font-medium text-muted-foreground">Actions Performed:</p>
                  {result.actions.map((action, i) => (
                    <div key={i} className="text-xs bg-muted p-2 rounded">
                      <span className="font-medium capitalize">{action.action}</span>
                      {action.recipeName && <> - {action.recipeName}</>}
                      {action.date && <> on {new Date(action.date).toLocaleDateString()}</>}
                      {action.mealType && <> ({action.mealType})</>}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
