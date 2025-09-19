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
import { Printer, X, Loader2 } from 'lucide-react';
import { useRef, useEffect, useState } from 'react';
import { Button } from './ui/button';
import { cn } from '@/lib/utils';

export function PrintDialog() {
  const { isPrintOpen, setPrintOpen, printContent } = usePrint();
  const printFrameRef = useRef<HTMLIFrameElement>(null);
  const [isContentLoaded, setIsContentLoaded] = useState(false);
  const [styles, setStyles] = useState('');

  // Fetch and store stylesheet content when component mounts.
  useEffect(() => {
    const fetchStyles = async () => {
      // Find all link and style tags from the document head
      const styleSheets = Array.from(document.head.querySelectorAll('link[rel="stylesheet"], style'));
      const stylePromises = Array.from(styleSheets).map(sheet => {
          // For inline <style> tags
          if (sheet.tagName === 'STYLE') {
              return Promise.resolve(sheet.innerHTML);
          }
          // For <link> tags
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
      // Reset content loaded state when closing
      setIsContentLoaded(false);
    }
    setPrintOpen(open);
  }
  
  const handleFrameLoad = () => {
    setIsContentLoaded(true);
  }

  const handlePrint = () => {
    const printFrame = printFrameRef.current;
    if (printFrame && printFrame.contentWindow) {
      printFrame.contentWindow.focus(); // Focus is required for some browsers
      printFrame.contentWindow.print();
    }
  };
  
  // Construct the full HTML for the iframe, including fetched styles and the dark class
  const printHtml = `<!DOCTYPE html><html><head><style>${styles}</style></head><body class="dark p-8">${printContent}</body></html>`;

  // Reset content loaded state whenever the print content changes
  useEffect(() => {
    if (isPrintOpen) {
      setIsContentLoaded(false);
    }
  }, [printContent, isPrintOpen]);

  return (
    <AlertDialog open={isPrintOpen} onOpenChange={handleOpenChange}>
      <AlertDialogContent className="max-w-3xl h-[90vh] flex flex-col">
        <AlertDialogHeader>
          <AlertDialogTitle>Print Preview</AlertDialogTitle>
          <AlertDialogDescription>
            Review the content below. When ready, click "Print".
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="flex-grow border rounded-md overflow-hidden relative bg-white">
           {!isContentLoaded && (
            <div className="absolute inset-0 flex items-center justify-center bg-white/80">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          )}
          <iframe
            ref={printFrameRef}
            title="Print Content"
            className={cn("w-full h-full", !isContentLoaded && 'opacity-0')}
            srcDoc={printHtml}
            onLoad={handleFrameLoad}
          />
        </div>
        <AlertDialogFooter>
           <AlertDialogCancel asChild>
            <Button variant="ghost">
              <X className="mr-2 h-4 w-4" />
              Close
            </Button>
          </AlertDialogCancel>
          <Button onClick={handlePrint} disabled={!isContentLoaded}>
            <Printer className="mr-2 h-4 w-4" />
            {isContentLoaded ? 'Print' : 'Loading Preview...'}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
