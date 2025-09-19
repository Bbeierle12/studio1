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
import { useEffect, useRef, useState, useCallback } from 'react';
import { Button } from './ui/button';

export function PrintDialog() {
  const { isPrintOpen, setPrintOpen, printContent } = usePrint();
  const [isClient, setIsClient] = useState(false);
  const printContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const handlePrint = useCallback(() => {
    if (printContainerRef.current) {
        document.body.classList.add('printing-active');
        window.print();
        document.body.classList.remove('printing-active');
    } else {
        console.error("Could not find content to print.");
    }
  }, []);

  const handleOpenChange = (open: boolean) => {
    if (!open) {
        // clean up classes when dialog is closed
        document.body.classList.remove('printing-active');
    }
    setPrintOpen(open);
  };
  
  // Add a listener to clean up in case the user uses the browser's "Cancel" button
  useEffect(() => {
    const afterPrint = () => {
        document.body.classList.remove('printing-active');
    };
    
    window.addEventListener('afterprint', afterPrint);
    return () => window.removeEventListener('afterprint', afterPrint);
  }, []);


  if (!isClient) {
    return null;
  }

  return (
    <>
      <div 
        ref={printContainerRef}
        className="printable-content"
        dangerouslySetInnerHTML={{ __html: printContent }}
      />
      <AlertDialog open={isPrintOpen} onOpenChange={handleOpenChange}>
        <AlertDialogContent className="max-w-3xl no-print">
          <AlertDialogHeader>
            <AlertDialogTitle>Print Preview</AlertDialogTitle>
            <AlertDialogDescription>
              This is a preview of your recipe. Use the print button to open the print dialog. Note: The preview may differ slightly from the final printout.
            </AlertDialogDescription>
          </AlertDialogHeader>
          
          <div className="flex-grow border rounded-md overflow-y-auto bg-white p-4 h-[60vh]">
              <div className="prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: printContent }} />
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
    </>
  );
}
