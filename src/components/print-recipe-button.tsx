'use client';

import { Button } from '@/components/ui/button';
import { Printer } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export function PrintRecipeButton() {
  const { toast } = useToast();

  const handlePrint = async () => {
    const articleNode = document.querySelector('article');
    if (!articleNode) {
      toast({
        variant: 'destructive',
        title: 'Print Error',
        description: 'Could not find recipe content to print.',
      });
      return;
    }

    toast({
      title: 'Preparing Print View',
      description: 'Your recipe is being prepared for printing...',
    });

    try {
      // Get all link tags from the head that are stylesheets
      const stylesheets = Array.from(document.querySelectorAll('link[rel="stylesheet"]'));
      
      // Fetch the content of each stylesheet
      const stylePromises = stylesheets.map(sheet => 
        fetch(sheet.href).then(res => res.text()).catch(err => {
          console.error(`Could not fetch stylesheet: ${sheet.href}`, err);
          return ''; // Return empty string on error
        })
      );
      const styleContents = await Promise.all(stylePromises);
      
      const combinedStyles = styleContents.join('\n');

      // Create a hidden iframe
      const iframe = document.createElement('iframe');
      iframe.style.position = 'absolute';
      iframe.style.width = '0';
      iframe.style.height = '0';
      iframe.style.border = '0';
      
      let cleanupTimeout: NodeJS.Timeout;

      const cleanup = () => {
        if (document.body.contains(iframe)) {
          document.body.removeChild(iframe);
        }
        if (cleanupTimeout) {
            clearTimeout(cleanupTimeout);
        }
      };
      
      iframe.onload = () => {
        try {
          const printDocument = iframe.contentWindow?.document;
          if (!printDocument) {
            throw new Error('Could not access print document.');
          }

          // Write the HTML to the iframe
          printDocument.open();
          printDocument.write(`
            <!DOCTYPE html>
            <html>
              <head>
                <title>Print - ${document.title}</title>
                <style>${combinedStyles}</style>
              </head>
              <body class="dark">
                ${articleNode.outerHTML}
              </body>
            </html>
          `);
          printDocument.close();

          // Add a listener for after the print dialog is closed
          if (iframe.contentWindow) {
             iframe.contentWindow.addEventListener('afterprint', cleanup);
          }
         

          // Wait a fraction of a second for rendering before printing
          setTimeout(() => {
            if (iframe.contentWindow) {
              iframe.contentWindow.focus();
              iframe.contentWindow.print();
            }
          }, 250); // A small delay ensures rendering is complete

        } catch (e: any) {
          console.error("Print failed: ", e);
          toast({
            variant: 'destructive',
            title: 'Print Error',
            description: e.message || 'An error occurred while trying to print.',
          });
          // Cleanup on error as well
          cleanup();
        } finally {
          // Fallback cleanup in case afterprint doesn't fire
          cleanupTimeout = setTimeout(cleanup, 5000);
        }
      };

      document.body.appendChild(iframe);

    } catch (error: any) {
      console.error('Failed to prepare print view:', error);
      toast({
        variant: 'destructive',
        title: 'Print Setup Failed',
        description: 'Could not load styles for printing.',
      });
    }
  };

  return (
    <Button variant="outline" size="sm" onClick={handlePrint} className="no-print">
      <Printer className="mr-2 h-4 w-4" />
      Print
    </Button>
  );
}
