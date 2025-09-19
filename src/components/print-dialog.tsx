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
import { useEffect, useRef, useState } from 'react';
import { Button } from './ui/button';

export function PrintDialog() {
  const { isPrintOpen, setPrintOpen, printContent } = usePrint();
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [isFrameReady, setIsFrameReady] = useState(false);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const handleOpenChange = (open: boolean) => {
    setPrintOpen(open);
    if (!open) {
      // Reset frame readiness when dialog closes
      setIsFrameReady(false);
    }
  };

  const handlePrint = () => {
    if (iframeRef.current?.contentWindow) {
      iframeRef.current.contentWindow.print();
    } else {
      console.error('Could not find iframe to print.');
    }
  };

  // When printContent changes, update the iframe's content
  useEffect(() => {
    if (isPrintOpen && printContent && isClient) {
      const frame = iframeRef.current;
      if (frame) {
        setIsFrameReady(false); // Set to false while loading new content
        const doc = frame.contentDocument;
        if (doc) {
          const stylesheetLinks = Array.from(document.querySelectorAll('link[rel="stylesheet"]'))
            .map(link => link.outerHTML)
            .join('');

          const styleTags = Array.from(document.querySelectorAll('style'))
            .map(style => style.outerHTML)
            .join('');

          doc.open();
          doc.write(`
            <!DOCTYPE html>
            <html class="dark">
              <head>
                <title>Print Recipe</title>
                ${stylesheetLinks}
                ${styleTags}
              </head>
              <body class="bg-white">
                <div class="printable-content p-8">
                  ${printContent}
                </div>
              </body>
            </html>
          `);
          doc.close();
        }
      }
    }
  }, [printContent, isPrintOpen, isClient]);

  return (
    <AlertDialog open={isPrintOpen} onOpenChange={handleOpenChange}>
      <AlertDialogContent className="max-w-3xl h-[90vh] flex flex-col">
        <AlertDialogHeader className="no-print">
          <AlertDialogTitle>Print Preview</AlertDialogTitle>
          <AlertDialogDescription>
            This is a preview of your recipe. Use the print button to open the print dialog.
          </AlertDialogDescription>
        </AlertDialogHeader>
        
        <div className="flex-grow border rounded-md overflow-hidden bg-white">
          {/* Hidden iframe for printing */}
          <iframe
            ref={iframeRef}
            className="w-full h-full"
            onLoad={() => setIsFrameReady(true)}
            title="Print Content"
            srcDoc={isClient ? `
              <!DOCTYPE html>
              <html class="dark">
                <head>
                  <title>Print Preview</title>
                  ${
                    Array.from(document.querySelectorAll('link[rel="stylesheet"]'))
                      .map(link => link.outerHTML)
                      .join('')
                  }
                  ${
                    Array.from(document.querySelectorAll('style'))
                      .map(style => style.outerHTML)
                      .join('')
                  }
                </head>
                <body class="bg-background">
                  <div class="prose dark:prose-invert p-4">
                    ${printContent}
                  </div>
                </body>
              </html>
            ` : ''}
          />
        </div>

        <AlertDialogFooter className="no-print mt-4">
          <AlertDialogCancel asChild>
            <Button variant="ghost">
              <X className="mr-2 h-4 w-4" />
              Close
            </Button>
          </AlertDialogCancel>
          <Button onClick={handlePrint} disabled={!isFrameReady}>
            {isFrameReady ? (
              <Printer className="mr-2 h-4 w-4" />
            ) : (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            Print
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
