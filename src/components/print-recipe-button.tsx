'use client';

import { Button } from '@/components/ui/button';
import { Printer } from 'lucide-react';
import { usePrint } from '@/context/print-context';
import { useToast } from '@/hooks/use-toast';

export function PrintRecipeButton() {
  const { triggerPrint } = usePrint();
  const { toast } = useToast();

  const handlePrintClick = () => {
    const articleNode = document.querySelector('article');

    if (articleNode) {
      articleNode.classList.add('printable-source');
      
      toast({
        title: 'Preparing Print View',
        description: 'The print preview dialog is opening.',
      });
      triggerPrint(articleNode.innerHTML);
    } else {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Could not find recipe content to print.',
      });
    }
  };

  return (
    <Button variant="outline" size="sm" onClick={handlePrintClick} className="no-print">
      <Printer className="mr-2 h-4 w-4" />
      Print
    </Button>
  );
}
