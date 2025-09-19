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
  const [isClient, setIsClient] = useState(false);
  const printContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // This ensures the component only renders on the client, preventing hydration errors.
    setIsClient(true);
  }, []);

  const handlePrint = () => {
    // The CSS media queries will handle showing only the printable-content div.
    window.print();
  };

  const handleOpenChange = (open: boolean) => {
    setPrintOpen(open);
  };
  
  // Return null if not on the client or if the dialog is not open.
  // This prevents any server-side rendering attempts of the dialog.
  if (!isClient) {
    return null;
  }

  // This hidden div gets populated with the print content and is the only thing shown via print CSS
  const PrintArea = () => (
      <div 
        ref={printContainerRef}
        className="printable-content"
        dangerouslySetInnerHTML={{ __html: printContent }}
      />
  );


  return (
    <>
      <PrintArea />
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
