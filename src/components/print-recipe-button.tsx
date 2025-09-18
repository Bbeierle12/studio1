'use client';

import { Button } from '@/components/ui/button';
import { Printer } from 'lucide-react';

export function PrintRecipeButton() {
  const handlePrint = () => {
    window.print();
  };

  return (
    <Button variant="outline" size="sm" onClick={handlePrint}>
      <Printer className="mr-2 h-4 w-4" />
      Print
    </Button>
  );
}
