
'use client';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { usePrint } from '@/context/print-context';
import { Printer, X } from 'lucide-react';
import { useRef, useEffect, useState } from 'react';
import { Button } from './ui/button';
import { ScrollArea } from './ui/scroll-area';

export function PrintDialog() {
  const { isPrintOpen, setPrintOpen, printContent } = usePrint();
  const printFrameRef = useRef<HTMLIFrameElement>(null);
  const [styles, setStyles] = useState('');

  useEffect(() => {
    // Fetch and store stylesheet content when component mounts.
    const fetchStyles = async () => {
      const stylesheets = Array.from(document.querySelectorAll('link[rel="stylesheet"]'));
      const stylePromises = stylesheets.map(sheet =>
        fetch(sheet.href)
          .then(res => res.text())
          .catch(err => {
            console.error(`Could not fetch stylesheet: ${sheet.href}`, err);
            return '';
          })
      );
      const styleContents = await Promise.all(stylePromises);
      setStyles(styleContents.join('\n'));
    };

    fetchStyles();
  }, []);

  const handlePrint = () => {
    const printFrame = printFrameRef.current;
    if (printFrame && printFrame.contentWindow) {
      printFrame.contentWindow.focus();
      printFrame.contentWindow.print();
    }
  };

  return (
    <AlertDialog open={isPrintOpen} onOpenChange={setPrintOpen}>
      <AlertDialogContent className="max-w-3xl h-[90vh] flex flex-col">
        <AlertDialogHeader>
          <AlertDialogTitle>Print Preview</AlertDialogTitle>
          <AlertDialogDescription>
            Review the content below. Click "Print" to open the print dialog.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="flex-grow border rounded-md overflow-hidden relative bg-white">
            <iframe
                ref={printFrameRef}
                title="Print Content"
                className="w-full h-full"
                srcDoc={`<!DOCTYPE html><html><head><style>${styles}</style></head><body class="dark p-8">${printContent}</body></html>`}
            />
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
