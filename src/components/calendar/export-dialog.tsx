'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { MealPlan } from '@/lib/types';
import { Download, FileText, Table, Loader2 } from 'lucide-react';
import { 
  exportMealPlanToPDF, 
  exportMealPlanToCSV, 
  downloadCSV, 
  downloadPDF 
} from '@/lib/meal-plan-export';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';

interface ExportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mealPlan: MealPlan;
}

export function ExportDialog({ open, onOpenChange, mealPlan }: ExportDialogProps) {
  const [exportFormat, setExportFormat] = useState<'pdf' | 'csv'>('pdf');
  const [isExporting, setIsExporting] = useState(false);
  const { toast } = useToast();

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const filename = `${mealPlan.name.replace(/\s+/g, '_')}_${format(new Date(), 'yyyy-MM-dd')}`;
      
      if (exportFormat === 'pdf') {
        const pdfBlob = await exportMealPlanToPDF(mealPlan);
        downloadPDF(pdfBlob, `${filename}.pdf`);
        
        toast({
          title: 'Success',
          description: 'Meal plan exported as PDF successfully',
        });
      } else {
        const csv = exportMealPlanToCSV(mealPlan);
        downloadCSV(csv, `${filename}.csv`);
        
        toast({
          title: 'Success',
          description: 'Meal plan exported as CSV successfully',
        });
      }
      
      onOpenChange(false);
    } catch (error) {
      console.error('Export failed:', error);
      toast({
        title: 'Error',
        description: 'Failed to export meal plan. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Export Meal Plan</DialogTitle>
          <DialogDescription>
            Choose a format to export "{mealPlan.name}"
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6 py-4">
          <RadioGroup 
            value={exportFormat} 
            onValueChange={(v) => setExportFormat(v as 'pdf' | 'csv')}
            className="space-y-3"
          >
            <div className="flex items-start space-x-3 space-y-0 rounded-md border p-4 hover:bg-accent/50 cursor-pointer transition-colors">
              <RadioGroupItem value="pdf" id="pdf" className="mt-0.5" />
              <Label htmlFor="pdf" className="flex-1 cursor-pointer">
                <div className="flex items-center gap-2 mb-1">
                  <FileText className="h-4 w-4" />
                  <span className="font-semibold">PDF Document</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Formatted, printable document with all meal details
                </p>
              </Label>
            </div>
            
            <div className="flex items-start space-x-3 space-y-0 rounded-md border p-4 hover:bg-accent/50 cursor-pointer transition-colors">
              <RadioGroupItem value="csv" id="csv" className="mt-0.5" />
              <Label htmlFor="csv" className="flex-1 cursor-pointer">
                <div className="flex items-center gap-2 mb-1">
                  <Table className="h-4 w-4" />
                  <span className="font-semibold">CSV Spreadsheet</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Compatible with Excel, Google Sheets, and other apps
                </p>
              </Label>
            </div>
          </RadioGroup>
          
          <div className="flex gap-2 justify-end pt-4">
            <Button 
              variant="outline" 
              onClick={() => onOpenChange(false)}
              disabled={isExporting}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleExport} 
              disabled={isExporting}
            >
              {isExporting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Exporting...
                </>
              ) : (
                <>
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
