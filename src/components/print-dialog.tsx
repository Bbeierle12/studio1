
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
import { Printer, X, ArrowRight } from 'lucide-react';
import { useRef, useEffect, useState, useCallback } from 'react';
import { Button } from './ui/button';

export function PrintDialog() {
  const { isPrintOpen, setPrintOpen, printContent } = usePrint();
  const printFrameRef = useRef<HTMLIFrameElement>(null);
  const [styles, setStyles] = useState('');
  const [step, setStep] = useState(1);
  const [isPrinting, setIsPrinting] = useState(false);

  // Fetch and store stylesheet content when component mounts.
  useEffect(() => {
    const fetchStyles = async () => {
      const styleSheets = Array.from(document.querySelectorAll('link[rel="stylesheet"], style'));
      const stylePromises = Array.from(styleSheets).map(sheet => {
          if (sheet.tagName === 'STYLE') {
              return Promise.resolve(sheet.innerHTML);
          }
          if ('href' in sheet && (sheet as HTMLLinkElement).href) {
              return fetch((sheet as HTMLLinkElement).href)
                  .then(res => res.text())
                  .catch(err => {
                      console.error(`Could not fetch stylesheet: ${(sheet as HTMLLinkElement).href}`, err);
                      return '';
                  });
          }
          return Promise.resolve('');
      });
      const styleContents = await Promise.all(stylePromises);
      setStyles(styleContents.join('\n'));
    };

    fetchStyles();
  }, []);
  
  const handleOpenChange = (open: boolean) => {
    if (!open) {
      setTimeout(() => {
        setStep(1);
        setIsPrinting(false);
      }, 200); 
    }
    setPrintOpen(open);
  }

  const handlePrint = useCallback(() => {
    setIsPrinting(true);
  }, []);
  
  useEffect(() => {
    if(isPrinting && printFrameRef.current) {
        printFrameRef.current.focus();
        printFrameRef.current.contentWindow?.print();
        setIsPrinting(false); // Reset printing state
    }
  }, [isPrinting]);

  // Full HTML doc to ensure proper rendering in the iframe
  const printHtml = `<!DOCTYPE html><html><head><style>${styles}</style></head><body class="dark p-8">${printContent}</body></html>`;

  return (
    <AlertDialog open={isPrintOpen} onOpenChange={handleOpenChange}>
      <AlertDialogContent className="max-w-3xl h-[90vh] flex flex-col">
        <AlertDialogHeader>
          <AlertDialogTitle>Print Preview</AlertDialogTitle>
          <AlertDialogDescription>
            {step === 1 
              ? 'Review the content below. Click "Continue" to proceed to printing.'
              : 'Click "Print" to open your browser\'s print dialog.'}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="flex-grow border rounded-md overflow-hidden relative bg-white">
          <iframe
            ref={printFrameRef}
            title="Print Content"
            className="w-full h-full"
            srcDoc={printHtml}
            onLoad={step === 2 && isPrinting ? handlePrint : undefined}
          />
        </div>
        <AlertDialogFooter>
           <AlertDialogCancel asChild>
            <Button variant="ghost">
              <X className="mr-2 h-4 w-4" />
              Close
            </Button>
          </AlertDialogCancel>
          {step === 1 ? (
             <Button onClick={() => setStep(2)}>
              <ArrowRight className="mr-2 h-4 w-4" />
              Continue
            </Button>
          ) : (
            <Button onClick={handlePrint} disabled={isPrinting}>
              <Printer className="mr-2 h-4 w-4" />
              {isPrinting ? 'Preparing...' : 'Print'}
            </Button>
          )}
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
