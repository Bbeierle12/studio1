
'use client';

import { Button } from '@/components/ui/button';
import { Printer } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export function PrintRecipeButton() {
  const { toast } = useToast();

  const handlePrint = () => {
    const articleNode = document.querySelector('article');
    if (!articleNode) {
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

    const printDocument = iframe.contentWindow?.document;
    if (!printDocument) {
        toast({
            variant: 'destructive',
            title: 'Print Error',
            description: 'Could not create a print document.',
        });
        document.body.removeChild(iframe);
        return;
    }

    // Get all styles from the main document
    const headContent = Array.from(document.querySelectorAll('link, style'))
        .map(el => el.outerHTML)
        .join('');

    // Set the content of the iframe
    printDocument.open();
    printDocument.write(`
        <html>
            <head>
                <title>Print - ${document.title}</title>
                ${headContent}
            </head>
            <body class="dark">
                ${articleNode.outerHTML}
            </body>
        </html>
    `);
    printDocument.close();

    // Wait for the iframe to fully load its content and styles
    iframe.onload = function() {
        try {
            // Focus on the iframe and print
            iframe.contentWindow?.focus();
            iframe.contentWindow?.print();
        } catch (e) {
            console.error("Print failed: ", e);
            toast({
                variant: 'destructive',
                title: 'Print Error',
                description: 'An error occurred while trying to print.',
            });
        } finally {
            // Clean up the iframe after a delay
            setTimeout(() => {
                if (document.body.contains(iframe)) {
                    document.body.removeChild(iframe);
                }
            }, 1000);
        }
    };
  };

  return (
    <Button variant="outline" size="sm" onClick={handlePrint} className="no-print">
      <Printer className="mr-2 h-4 w-4" />
      Print
    </Button>
  );
}
