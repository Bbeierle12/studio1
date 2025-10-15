'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import {
  Download,
  FileText,
  Table,
  FileJson,
  Loader2,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ExportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  dataType: 'users' | 'recipes' | 'audit' | 'analytics';
  filters?: any;
  totalCount?: number;
}

export function ExportDialog({
  open,
  onOpenChange,
  dataType,
  filters = {},
  totalCount = 0
}: ExportDialogProps) {
  const { toast } = useToast();
  const [exporting, setExporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [format, setFormat] = useState<'csv' | 'json' | 'excel'>('csv');
  const [fields, setFields] = useState<string[]>([]);
  const [dateRange, setDateRange] = useState('all');
  const [includeRelated, setIncludeRelated] = useState(false);

  // Field options based on data type
  const getFieldOptions = () => {
    switch (dataType) {
      case 'users':
        return [
          { value: 'id', label: 'User ID' },
          { value: 'email', label: 'Email' },
          { value: 'name', label: 'Name' },
          { value: 'role', label: 'Role' },
          { value: 'createdAt', label: 'Created Date' },
          { value: 'lastLogin', label: 'Last Login' },
          { value: 'isActive', label: 'Status' },
          { value: 'recipesCount', label: 'Recipe Count' },
        ];
      case 'recipes':
        return [
          { value: 'id', label: 'Recipe ID' },
          { value: 'title', label: 'Title' },
          { value: 'contributor', label: 'Contributor' },
          { value: 'cuisine', label: 'Cuisine' },
          { value: 'difficulty', label: 'Difficulty' },
          { value: 'prepTime', label: 'Prep Time' },
          { value: 'servings', label: 'Servings' },
          { value: 'createdAt', label: 'Created Date' },
          { value: 'isFeatured', label: 'Featured' },
        ];
      case 'audit':
        return [
          { value: 'id', label: 'Log ID' },
          { value: 'userId', label: 'User ID' },
          { value: 'action', label: 'Action' },
          { value: 'entityType', label: 'Entity Type' },
          { value: 'entityId', label: 'Entity ID' },
          { value: 'ipAddress', label: 'IP Address' },
          { value: 'userAgent', label: 'User Agent' },
          { value: 'createdAt', label: 'Timestamp' },
        ];
      case 'analytics':
        return [
          { value: 'date', label: 'Date' },
          { value: 'activeUsers', label: 'Active Users' },
          { value: 'newUsers', label: 'New Users' },
          { value: 'recipesCreated', label: 'Recipes Created' },
          { value: 'recipesViewed', label: 'Recipes Viewed' },
          { value: 'avgSessionTime', label: 'Avg Session Time' },
        ];
      default:
        return [];
    }
  };

  const handleExport = async () => {
    setExporting(true);
    setProgress(0);

    try {
      // Build query params
      const params = new URLSearchParams({
        format,
        fields: fields.join(','),
        dateRange,
        includeRelated: includeRelated.toString(),
        ...filters,
      });

      // Simulate progress for better UX
      const progressInterval = setInterval(() => {
        setProgress((prev) => Math.min(prev + 10, 90));
      }, 200);

      const response = await fetch(`/api/admin/export/${dataType}?${params}`, {
        method: 'GET',
      });

      clearInterval(progressInterval);
      setProgress(100);

      if (response.ok) {
        // Get filename from Content-Disposition header or create default
        const disposition = response.headers.get('Content-Disposition');
        const filename = disposition?.match(/filename="(.+)"/)?.[1] ||
          `${dataType}-export-${new Date().toISOString().split('T')[0]}.${format}`;

        // Download the file
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);

        toast({
          title: 'Export Successful',
          description: `${dataType} data exported as ${format.toUpperCase()}`,
        });

        setTimeout(() => {
          onOpenChange(false);
          setProgress(0);
        }, 1000);
      } else {
        const data = await response.json();
        toast({
          title: 'Export Failed',
          description: data.error || 'Failed to export data',
          variant: 'destructive',
        });
        setProgress(0);
      }
    } catch (error) {
      console.error('Export error:', error);
      toast({
        title: 'Export Failed',
        description: 'An error occurred during export',
        variant: 'destructive',
      });
      setProgress(0);
    } finally {
      setExporting(false);
    }
  };

  const fieldOptions = getFieldOptions();

  // Default select all fields
  if (fields.length === 0 && fieldOptions.length > 0) {
    setFields(fieldOptions.map(f => f.value));
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Export {dataType}</DialogTitle>
          <DialogDescription>
            Configure export settings for {totalCount.toLocaleString()} {dataType} records
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="format" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="format">Format</TabsTrigger>
            <TabsTrigger value="fields">Fields</TabsTrigger>
            <TabsTrigger value="options">Options</TabsTrigger>
          </TabsList>

          <TabsContent value="format" className="space-y-4">
            <RadioGroup value={format} onValueChange={(v: any) => setFormat(v)}>
              <div className="space-y-3">
                <label className="flex items-center space-x-3 p-4 border rounded-lg cursor-pointer hover:bg-muted/50">
                  <RadioGroupItem value="csv" />
                  <div className="flex items-center gap-3 flex-1">
                    <FileText className="h-5 w-5 text-green-600" />
                    <div>
                      <p className="font-medium">CSV</p>
                      <p className="text-xs text-muted-foreground">
                        Comma-separated values, compatible with Excel and Google Sheets
                      </p>
                    </div>
                  </div>
                </label>

                <label className="flex items-center space-x-3 p-4 border rounded-lg cursor-pointer hover:bg-muted/50">
                  <RadioGroupItem value="json" />
                  <div className="flex items-center gap-3 flex-1">
                    <FileJson className="h-5 w-5 text-blue-600" />
                    <div>
                      <p className="font-medium">JSON</p>
                      <p className="text-xs text-muted-foreground">
                        JavaScript Object Notation, ideal for developers and APIs
                      </p>
                    </div>
                  </div>
                </label>

                <label className="flex items-center space-x-3 p-4 border rounded-lg cursor-pointer hover:bg-muted/50">
                  <RadioGroupItem value="excel" />
                  <div className="flex items-center gap-3 flex-1">
                    <Table className="h-5 w-5 text-purple-600" />
                    <div>
                      <p className="font-medium">Excel</p>
                      <p className="text-xs text-muted-foreground">
                        Microsoft Excel format (.xlsx) with formatting
                      </p>
                    </div>
                  </div>
                </label>
              </div>
            </RadioGroup>
          </TabsContent>

          <TabsContent value="fields" className="space-y-4">
            <div className="space-y-2">
              <Label>Select fields to export</Label>
              <div className="grid grid-cols-2 gap-2 max-h-64 overflow-y-auto p-4 border rounded-lg">
                {fieldOptions.map((field) => (
                  <label
                    key={field.value}
                    className="flex items-center space-x-2 cursor-pointer"
                  >
                    <Checkbox
                      checked={fields.includes(field.value)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setFields([...fields, field.value]);
                        } else {
                          setFields(fields.filter(f => f !== field.value));
                        }
                      }}
                    />
                    <span className="text-sm">{field.label}</span>
                  </label>
                ))}
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setFields(fieldOptions.map(f => f.value))}
                >
                  Select All
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setFields([])}
                >
                  Clear All
                </Button>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="options" className="space-y-4">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Date Range</Label>
                <Select value={dateRange} onValueChange={setDateRange}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Time</SelectItem>
                    <SelectItem value="today">Today</SelectItem>
                    <SelectItem value="week">Last 7 Days</SelectItem>
                    <SelectItem value="month">Last 30 Days</SelectItem>
                    <SelectItem value="quarter">Last 90 Days</SelectItem>
                    <SelectItem value="year">Last Year</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {(dataType === 'users' || dataType === 'recipes') && (
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="related"
                    checked={includeRelated}
                    onCheckedChange={(checked) => setIncludeRelated(!!checked)}
                  />
                  <Label htmlFor="related">
                    Include related data (may increase file size)
                  </Label>
                </div>
              )}

              <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
                <div className="flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 text-amber-600 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-amber-900">
                      Export Notice
                    </p>
                    <p className="text-xs text-amber-700 mt-1">
                      Large exports may take several seconds. The download will start automatically when ready.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        {exporting && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span>Exporting...</span>
              <span>{progress}%</span>
            </div>
            <Progress value={progress} className="h-2" />
            {progress === 100 && (
              <div className="flex items-center gap-2 text-green-600">
                <CheckCircle2 className="h-4 w-4" />
                <span className="text-sm">Export complete!</span>
              </div>
            )}
          </div>
        )}

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={exporting}
          >
            Cancel
          </Button>
          <Button
            onClick={handleExport}
            disabled={exporting || fields.length === 0}
          >
            {exporting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Exporting...
              </>
            ) : (
              <>
                <Download className="mr-2 h-4 w-4" />
                Export {format.toUpperCase()}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}