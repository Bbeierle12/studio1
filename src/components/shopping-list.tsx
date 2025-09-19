'use client';

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetFooter
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { ShoppingCart, Trash2, Clipboard, Printer } from 'lucide-react';
import { useShoppingList } from '@/context/shopping-list-context';
import { Checkbox } from './ui/checkbox';
import { Label } from './ui/label';
import { ScrollArea } from './ui/scroll-area';
import { cn } from '@/lib/utils';
import { Badge } from './ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Separator } from './ui/separator';

export function ShoppingList() {
  const { items, toggleItem, clearList, getItemsCount, getListAsText } = useShoppingList();
  const { total, unchecked } = getItemsCount();
  const { toast } = useToast();

  const handleCopy = () => {
    const listText = getListAsText();
    if (!listText) {
        toast({
            variant: 'destructive',
            title: 'List is empty',
            description: 'There are no items to copy.',
        });
        return;
    }
    navigator.clipboard.writeText(listText);
    toast({
      title: 'Copied to Clipboard',
      description: 'Your shopping list has been copied.',
    });
  };

  const handlePrint = () => {
    const listText = getListAsText();
    if (!listText) {
        toast({
            variant: 'destructive',
            title: 'List is empty',
            description: 'There are no items to print.',
        });
        return;
    }

    // Use an iframe to print to avoid popup issues
    const iframe = document.createElement('iframe');
    iframe.style.position = 'absolute';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = 'none';
    document.body.appendChild(iframe);

    const doc = iframe.contentWindow?.document;
    if (doc) {
        doc.open();
        doc.write(`
            <html>
            <head>
                <title>Shopping List</title>
                <style>
                body { font-family: sans-serif; }
                h1 { font-size: 1.5rem; margin-bottom: 1rem; }
                ul { list-style-type: none; padding: 0; }
                li { margin-bottom: 0.5rem; font-size: 1rem; }
                </style>
            </head>
            <body>
                <h1>Shopping List</h1>
                <ul>
                ${listText.split('\n').map(item => `<li>&#9744; ${item}</li>`).join('')}
                </ul>
            </body>
            </html>
        `);
        doc.close();
        
        iframe.contentWindow?.focus();
        iframe.contentWindow?.print();
    }
    
    // Clean up the iframe after printing
    setTimeout(() => {
        document.body.removeChild(iframe);
    }, 1000);
  };


  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline" size="icon" className="relative">
          <ShoppingCart className="h-4 w-4" />
          <span className="sr-only">Open Shopping List</span>
          {unchecked > 0 && (
             <Badge 
                variant="destructive" 
                className="absolute -right-2 -top-2 h-5 w-5 justify-center rounded-full p-0 text-xs"
             >
                {unchecked}
             </Badge>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent className="flex flex-col">
        <SheetHeader>
          <SheetTitle>Shopping List</SheetTitle>
          <SheetDescription>
            Your ingredients for upcoming masterpieces. Mark items as you shop.
          </SheetDescription>
        </SheetHeader>
        {total > 0 ? (
          <>
            <ScrollArea className="flex-grow my-4">
              <div className="space-y-4 pr-4">
                  {items.map((item, index) => (
                  <div key={index} className="flex items-center space-x-3">
                      <Checkbox
                          id={`item-${index}`}
                          checked={item.checked}
                          onCheckedChange={() => toggleItem(index)}
                      />
                      <Label
                      htmlFor={`item-${index}`}
                      className={cn(
                          "flex-1 text-sm leading-snug",
                          item.checked && "text-muted-foreground line-through"
                      )}
                      >
                      {item.name}
                      </Label>
                  </div>
                  ))}
              </div>
            </ScrollArea>
            <Separator />
          </>
        ) : (
          <div className="flex flex-grow flex-col items-center justify-center text-center">
            <ShoppingCart className="h-12 w-12 text-muted-foreground" />
            <p className="mt-4 text-lg font-semibold">Your List is Empty</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Add ingredients from a recipe page to get started.
            </p>
          </div>
        )}
        <SheetFooter>
           {total > 0 && (
            <div className="grid w-full gap-2">
                <div className="grid grid-cols-2 gap-2">
                    <Button
                        variant="outline"
                        onClick={handleCopy}
                    >
                        <Clipboard className="mr-2 h-4 w-4" />
                        Copy List
                    </Button>
                     <Button
                        variant="outline"
                        onClick={handlePrint}
                    >
                        <Printer className="mr-2 h-4 w-4" />
                        Print List
                    </Button>
                </div>
                <Button
                    variant="destructive"
                    onClick={() => clearList()}
                >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Clear All Items
                </Button>
            </div>
           )}
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
