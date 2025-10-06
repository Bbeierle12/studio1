'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ShoppingListItem, MealPlan } from '@/lib/types';
import { formatShoppingListAsText } from '@/lib/shopping-list-generator';
import { useToast } from '@/hooks/use-toast';
import { useShoppingList } from '@/hooks/use-shopping-list';
import { ShoppingCart, Copy, Printer, CheckCircle2 } from 'lucide-react';

interface ShoppingListDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mealPlan: MealPlan;
}

export function ShoppingListDialog({
  open,
  onOpenChange,
  mealPlan
}: ShoppingListDialogProps) {
  const { data: items = [], isLoading } = useShoppingList(mealPlan);
  const [checkedState, setCheckedState] = useState<Record<string, boolean>>({});
  const [copiedToClipboard, setCopiedToClipboard] = useState(false);
  const { toast } = useToast();

  // Group items by category
  const groupedByCategory: Record<string, ShoppingListItem[]> = {};
  for (const item of items) {
    if (!groupedByCategory[item.category]) {
      groupedByCategory[item.category] = [];
    }
    groupedByCategory[item.category].push(item);
  }

  const handleToggleItem = (ingredientKey: string) => {
    setCheckedState(prev => ({
      ...prev,
      [ingredientKey]: !prev[ingredientKey]
    }));
  };

  const handleCopyToClipboard = async () => {
    try {
      const text = formatShoppingListAsText(items);
      await navigator.clipboard.writeText(text);
      setCopiedToClipboard(true);
      toast({
        title: 'Copied!',
        description: 'Shopping list copied to clipboard'
      });
      setTimeout(() => setCopiedToClipboard(false), 2000);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to copy to clipboard',
        variant: 'destructive'
      });
    }
  };

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      const text = formatShoppingListAsText(items);
      printWindow.document.write(`
        <html>
          <head>
            <title>Shopping List</title>
            <style>
              body {
                font-family: Arial, sans-serif;
                padding: 20px;
                max-width: 800px;
                margin: 0 auto;
              }
              pre {
                white-space: pre-wrap;
                font-family: Arial, sans-serif;
              }
            </style>
          </head>
          <body>
            <pre>${text}</pre>
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.print();
    }
  };

  const totalItems = items.length;
  const checkedCount = Object.values(checkedState).filter(Boolean).length;
  const progress = totalItems > 0 ? Math.round((checkedCount / totalItems) * 100) : 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5" />
            Shopping List
          </DialogTitle>
          <DialogDescription>
            Consolidated ingredients from your meal plan
          </DialogDescription>
        </DialogHeader>

        {isLoading && (
          <div className="py-8 text-center text-muted-foreground">
            Generating shopping list...
          </div>
        )}

        {!isLoading && items.length === 0 && (
          <div className="py-8 text-center text-muted-foreground">
            <ShoppingCart className="mx-auto h-12 w-12 mb-2 opacity-50" />
            <p>No items in shopping list</p>
            <p className="text-sm">Add meals with recipes to generate a list</p>
          </div>
        )}

        {!isLoading && items.length > 0 && (
          <>
            {/* Progress Bar */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Progress</span>
                <span className="font-medium">{checkedCount} / {totalItems} items</span>
              </div>
              <div className="h-2 bg-secondary rounded-full overflow-hidden">
                <div 
                  className="h-full bg-primary transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleCopyToClipboard}
                className="flex-1"
              >
                <Copy className="h-4 w-4 mr-2" />
                {copiedToClipboard ? 'Copied!' : 'Copy'}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handlePrint}
                className="flex-1"
              >
                <Printer className="h-4 w-4 mr-2" />
                Print
              </Button>
            </div>

            {/* Shopping List Items */}
            <ScrollArea className="flex-1 pr-4">
              <div className="space-y-6">
                {Object.entries(groupedByCategory).map(([category, categoryItems]) => (
                  <div key={category} className="space-y-2">
                    <h3 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground">
                      {category}
                    </h3>
                    <div className="space-y-2">
                      {categoryItems.map((item, idx) => {
                        const itemKey = `${category}-${idx}`;
                        const isChecked = checkedState[itemKey] || false;
                        
                        return (
                          <div
                            key={itemKey}
                            className="flex items-start gap-3 p-2 rounded-lg hover:bg-accent transition-colors"
                          >
                            <Checkbox
                              id={itemKey}
                              checked={isChecked}
                              onCheckedChange={() => handleToggleItem(itemKey)}
                              className="mt-1"
                            />
                            <label
                              htmlFor={itemKey}
                              className="flex-1 cursor-pointer"
                            >
                              <div className={`font-medium ${isChecked ? 'line-through text-muted-foreground' : ''}`}>
                                {item.ingredient}
                              </div>
                              <div className="text-sm text-muted-foreground">
                                {item.quantity} {item.unit}
                              </div>
                              {item.recipeIds.length > 0 && (
                                <div className="text-xs text-muted-foreground mt-1">
                                  Used in {item.recipeIds.length} recipe{item.recipeIds.length !== 1 ? 's' : ''}
                                </div>
                              )}
                            </label>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
