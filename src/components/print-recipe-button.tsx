'use client';

import { Button } from '@/components/ui/button';
import { Printer } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export function PrintRecipeButton() {
  const { toast } = useToast();

  const handlePrint = () => {
    toast({
      title: 'Preparing Print View',
      description: 'Your recipe is being prepared for printing.',
    });

    const article = document.querySelector('article');
    if (!article) {
      console.error('Printable article area not found.');
      // Fallback for safety
      window.print();
      return;
    }

    const iframe = document.createElement('iframe');
    iframe.style.position = 'absolute';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = 'none';
    document.body.appendChild(iframe);

    const doc = iframe.contentWindow?.document;
    if (doc) {
      // Find all stylesheets and link tags in the main document's head
      const headContent = document.head.innerHTML;

      doc.open();
      doc.write(`
        <html>
          <head>
            <title>Print Recipe - ${document.title}</title>
            ${headContent}
          </head>
          <body>
            ${article.innerHTML}
          </body>
        </html>
      `);
      doc.close();
      
      // Delay printing slightly to ensure all styles are loaded in the iframe
      setTimeout(() => {
        iframe.contentWindow?.focus();
        iframe.contentWindow?.print();
        
        // Clean up the iframe after a delay
        setTimeout(() => {
            document.body.removeChild(iframe);
        }, 1000);

      }, 500);
    }
  };

  return (
    <Button variant="outline" size="sm" onClick={handlePrint} className="no-print">
      <Printer className="mr-2 h-4 w-4" />
      Print
    </Button>
  );
}
