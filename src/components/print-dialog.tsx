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

export function PrintDialog() {
  const { isPrintOpen, setPrintOpen, printContent } = usePrint();
  const contentRef = useRef<HTMLDivElement>(null);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);
  
  const handleOpenChange = (open: boolean) => {
    setPrintOpen(open);
    // Clean up the body class when the dialog is closed.
    if (!open) {
        document.body.classList.remove('printing-active');
    }
  }

  const handlePrint = () => {
    // Add a class to the body to activate the print styles
    document.body.classList.add('printing-active');
    window.print();
  };

  return (
    <AlertDialog open={isPrintOpen} onOpenChange={handleOpenChange}>
      <AlertDialogContent className="max-w-3xl h-[90vh] flex flex-col printable-content">
        <AlertDialogHeader className="no-print">
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
        <AlertDialogFooter className="no-print">
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
