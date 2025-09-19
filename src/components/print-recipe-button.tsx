'use client';

import { Button } from '@/components/ui/button';
import { Printer } from 'lucide-react';
import { usePrint } from '@/context/print-context';
import { useToast } from '@/hooks/use-toast';

export function PrintRecipeButton() {
  const { triggerPrint } = usePrint();
  const { toast } = useToast();

  const handlePrint = () => {
    const articleNode = document.querySelector('article');
    if (!articleNode) {
      toast({
        variant: 'destructive',
        title: 'Print Error',
        description: 'Could not find recipe content to print.',
      });
      return;
    }
    triggerPrint(articleNode.outerHTML);
  };

  return (
    <Button variant="outline" size="sm" onClick={handlePrint} className="no-print">
      <Printer className="mr-2 h-4 w-4" />
      Print
    </Button>
  );
}
