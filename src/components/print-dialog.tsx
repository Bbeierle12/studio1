'use client';

import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { usePrint } from '@/context/print-context';
import { Printer, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { Button } from './ui/button';
import { cn } from '@/lib/utils';

export function PrintDialog() {
  const { isPrintOpen, setPrintOpen, printContent } = usePrint();
  const contentRef = useRef<HTMLDivElement>(null);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    // This ensures the component only renders on the client,
    // avoiding SSR issues with `dangerouslySetInnerHTML`.
    setIsClient(true);
  }, []);

  const handlePrint = () => {
    // Find the original article node on the main page
    const printableElement = document.querySelector('.printable-source');
    
    if (printableElement) {
      // Add a class to the element we want to print
      printableElement.classList.add('printable-content');
      
      // Add a class to the body to hide other elements
      document.body.classList.add('printing-active');
      
      window.print();
      
      // Clean up classes after print dialog is closed or print is done
      printableElement.classList.remove('printable-content');
      document.body.classList.remove('printing-active');
    } else {
      console.error("Could not find the source content to print.");
      // You could show a toast message here to inform the user.
    }
  };

  const handleOpenChange = (open: boolean) => {
    setPrintOpen(open);
  }

  return (
    <AlertDialog open={isPrintOpen} onOpenChange={handleOpenChange}>
      <AlertDialogContent className="max-w-3xl h-[90vh] flex flex-col">
        <AlertDialogHeader>
          <AlertDialogTitle>Print Preview</AlertDialogTitle>
          <AlertDialogDescription>
            This is a preview of your recipe. Use the print button to open the print dialog.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="flex-grow border rounded-md overflow-auto p-4 bg-white dark:bg-background">
          {isClient && (
            <div
              ref={contentRef}
              className="prose dark:prose-invert"
              dangerouslySetInnerHTML={{ __html: printContent }}
            />
          )}
        </div>
        <AlertDialogFooter>
          <AlertDialogCancel asChild>
            <Button variant="ghost">
              <X className="mr-2 h-4 w-4" />
              Close
            </Button>
          </AlertDialogCancel>
          <Button onClick={handlePrint}>
            <Printer className="mr-2 h-4 w-4" />
            Print
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
