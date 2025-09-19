'use client';

import { createContext, useContext, ReactNode, useState, useEffect, useCallback } from 'react';

type ShoppingListItem = {
  name: string;
  checked: boolean;
};

type ShoppingListContextType = {
  items: ShoppingListItem[];
  addIngredients: (newItems: string[]) => void;
  toggleItem: (index: number) => void;
  clearList: () => void;
  getItemsCount: () => { total: number; unchecked: number };
};

const ShoppingListContext = createContext<ShoppingListContextType | undefined>(undefined);

const LOCAL_STORAGE_KEY = 'shoppingList';

export function ShoppingListProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ShoppingListItem[]>([]);

  useEffect(() => {
    try {
      const storedItems = window.localStorage.getItem(LOCAL_STORAGE_KEY);
      if (storedItems) {
        setItems(JSON.parse(storedItems));
      }
    } catch (error) {
      console.error('Failed to parse shopping list from localStorage', error);
    }
  }, []);

  useEffect(() => {
    window.localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(items));
  }, [items]);

  const addIngredients = useCallback((newItems: string[]) => {
    const itemsToAdd: ShoppingListItem[] = newItems.map(name => ({ name, checked: false }));
    setItems(prevItems => [...prevItems, ...itemsToAdd]);
  }, []);

  const toggleItem = useCallback((index: number) => {
    setItems(prevItems =>
      prevItems.map((item, i) =>
        i === index ? { ...item, checked: !item.checked } : item
      )
    );
  }, []);

  const clearList = useCallback(() => {
    setItems([]);
  }, []);
  
  const getItemsCount = useCallback(() => {
    const total = items.length;
    const unchecked = items.filter(item => !item.checked).length;
    return { total, unchecked };
  }, [items]);

  const value = { items, addIngredients, toggleItem, clearList, getItemsCount };

  return (
    <ShoppingListContext.Provider value={value}>
      {children}
    </ShoppingListContext.Provider>
  );
}

export const useShoppingList = () => {
  const context = useContext(ShoppingListContext);
  if (context === undefined) {
    throw new Error('useShoppingList must be used within a ShoppingListProvider');
  }
  return context;
};
