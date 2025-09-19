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
import { ShoppingCart, Trash2 } from 'lucide-react';
import { useShoppingList } from '@/context/shopping-list-context';
import { Checkbox } from './ui/checkbox';
import { Label } from './ui/label';
import { ScrollArea } from './ui/scroll-area';
import { cn } from '@/lib/utils';
import { Badge } from './ui/badge';

export function ShoppingList() {
  const { items, toggleItem, clearList, getItemsCount } = useShoppingList();
  const { total, unchecked } = getItemsCount();

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
            <Button
                variant="destructive"
                className="w-full"
                onClick={() => clearList()}
            >
                <Trash2 className="mr-2 h-4 w-4" />
                Clear List
            </Button>
           )}
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
