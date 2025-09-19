
'use client';

import { Button } from '@/components/ui/button';
import { Printer } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export function PrintRecipeButton() {
  const { toast } = useToast();

  const handlePrint = () => {
    const article = document.querySelector('article');
    if (!article) {
      console.error('Printable article area not found.');
      toast({
        variant: 'destructive',
        title: 'Print Error',
        description: 'Could not find the recipe content to print.',
      });
      return;
    }

    toast({
      title: 'Preparing Print View',
      description: 'Your recipe is being prepared for printing...',
    });

    // Create a hidden iframe
    const iframe = document.createElement('iframe');
    iframe.style.position = 'absolute';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = 'none';
    document.body.appendChild(iframe);
    
    const doc = iframe.contentWindow?.document;
    if (!doc) {
        toast({
            variant: 'destructive',
            title: 'Print Error',
            description: 'Could not create a print document.',
        });
        document.body.removeChild(iframe);
        return;
    }
    
    // Write the document structure, including head content for styles
    const headContent = document.head.innerHTML;
    doc.open();
    doc.write(`
        <html>
            <head>
                <title>Print Recipe - ${document.title}</title>
                ${headContent}
            </head>
            <body>
                ${article.outerHTML}
            </body>
        </html>
    `);
    doc.close();

    // Use a timeout to allow the iframe content and styles to load
    const printTimeout = setTimeout(() => {
        if (iframe.contentWindow) {
            iframe.contentWindow.focus();
            iframe.contentWindow.print();
        }
    }, 500); // 500ms delay is usually sufficient

    // Add an event listener to clean up the iframe after printing
    const afterPrint = () => {
        clearTimeout(printTimeout); // Clear the timeout in case printing was cancelled
        document.body.removeChild(iframe);
        iframe.contentWindow?.removeEventListener('afterprint', afterPrint);
    };
    iframe.contentWindow?.addEventListener('afterprint', afterPrint);

    // Fallback cleanup in case 'afterprint' event doesn't fire
    setTimeout(() => {
        if (document.body.contains(iframe)) {
            document.body.removeChild(iframe);
        }
    }, 5000);
  };

  return (
    <Button variant="outline" size="sm" onClick={handlePrint} className="no-print">
      <Printer className="mr-2 h-4 w-4" />
      Print
    </Button>
  );
}
