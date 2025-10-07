'use client'

import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Progress } from '@/components/ui/progress'
import { toast } from 'sonner'
import {
  ShoppingCart,
  Truck,
  DollarSign,
  Clock,
  Check,
  X,
  Loader2,
  ExternalLink,
  AlertCircle,
  Package,
  Store,
  Sparkles,
} from 'lucide-react'
import {
  GroceryExporter,
  GroceryService,
  GroceryItem,
  GROCERY_SERVICES,
  ExportResult,
} from '@/lib/grocery-integrations'

interface GroceryDeliveryExportProps {
  items: GroceryItem[]
  trigger?: React.ReactNode
}

export function GroceryDeliveryExport({ items, trigger }: GroceryDeliveryExportProps) {
  const [open, setOpen] = useState(false)
  const [selectedService, setSelectedService] = useState<string>('')
  const [groupByCategory, setGroupByCategory] = useState(true)
  const [includeNotes, setIncludeNotes] = useState(true)
  const [priceComparison, setPriceComparison] = useState<any[]>([])
  const [exportResult, setExportResult] = useState<ExportResult | null>(null)

  const exporter = new GroceryExporter()

  // Fetch price comparison
  const priceMutation = useMutation({
    mutationFn: async () => {
      return await exporter.getPriceComparison(items)
    },
    onSuccess: (data) => {
      setPriceComparison(data)
    },
  })

  // Export to service
  const exportMutation = useMutation({
    mutationFn: async (serviceId: string) => {
      return await exporter.exportToService({
        service: serviceId,
        items,
        groupByCategory,
        includeNotes,
      })
    },
    onSuccess: (result) => {
      setExportResult(result)
      if (result.success) {
        toast.success(`Successfully exported to ${result.service}`)

        // Handle different export formats
        if (result.url) {
          if (result.format === 'csv') {
            // Download CSV
            const a = document.createElement('a')
            a.href = result.url
            a.download = `shopping-list-${Date.now()}.csv`
            a.click()
          } else if (result.format === 'email') {
            // Open email client
            window.location.href = result.url
          } else if (result.format === 'link' || result.format === 'api') {
            // Open in new tab
            window.open(result.url, '_blank')
          }
        }
      } else {
        toast.error(result.error || 'Export failed')
      }
    },
    onError: (error: Error) => {
      toast.error(error.message)
    },
  })

  // Check availability
  const availabilityMutation = useMutation({
    mutationFn: async (serviceId: string) => {
      return await exporter.checkAvailability(items, serviceId)
    },
  })

  const handleExport = () => {
    if (selectedService) {
      exportMutation.mutate(selectedService)
    }
  }

  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen)
    if (isOpen && priceComparison.length === 0) {
      priceMutation.mutate()
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" className="gap-2">
            <Truck className="h-4 w-4" />
            Order Groceries
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>Export to Grocery Delivery</DialogTitle>
          <DialogDescription>
            Send your shopping list to your favorite grocery delivery service
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="services" className="mt-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="services">Services</TabsTrigger>
            <TabsTrigger value="comparison">Price Compare</TabsTrigger>
            <TabsTrigger value="options">Export Options</TabsTrigger>
          </TabsList>

          <TabsContent value="services" className="space-y-4">
            <ScrollArea className="h-[400px] pr-4">
              <RadioGroup value={selectedService} onValueChange={setSelectedService}>
                <div className="grid gap-4">
                  {GROCERY_SERVICES.map((service) => (
                    <Card
                      key={service.id}
                      className={cn(
                        'cursor-pointer transition-colors',
                        selectedService === service.id && 'border-primary'
                      )}
                      onClick={() => setSelectedService(service.id)}
                    >
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <RadioGroupItem value={service.id} />
                            <span className="text-2xl">{service.logo}</span>
                            <div>
                              <CardTitle className="text-base">{service.name}</CardTitle>
                              <CardDescription className="text-xs">
                                {service.description}
                              </CardDescription>
                            </div>
                          </div>
                          {service.available ? (
                            <Badge variant="outline" className="text-green-600">
                              Available
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-gray-400">
                              Coming Soon
                            </Badge>
                          )}
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="flex flex-wrap gap-1">
                          {service.features.map((feature, idx) => (
                            <Badge key={idx} variant="secondary" className="text-xs">
                              {feature}
                            </Badge>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </RadioGroup>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="comparison" className="space-y-4">
            {priceMutation.isPending ? (
              <div className="flex items-center justify-center h-[400px]">
                <Loader2 className="h-8 w-8 animate-spin" />
              </div>
            ) : priceComparison.length > 0 ? (
              <ScrollArea className="h-[400px] pr-4">
                <div className="space-y-4">
                  {priceComparison
                    .sort((a, b) => a.estimatedTotal - b.estimatedTotal)
                    .map((comparison) => (
                      <Card key={comparison.service}>
                        <CardHeader className="pb-3">
                          <div className="flex items-center justify-between">
                            <CardTitle className="text-base">{comparison.service}</CardTitle>
                            <div className="text-right">
                              <div className="text-2xl font-bold">
                                ${comparison.estimatedTotal}
                              </div>
                              {comparison.deliveryFee !== undefined && (
                                <p className="text-xs text-muted-foreground">
                                  + ${comparison.deliveryFee} delivery
                                </p>
                              )}
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-2">
                            <div className="flex items-center justify-between text-sm">
                              <span>Item Availability</span>
                              <div className="flex items-center gap-2">
                                <Progress value={comparison.availability} className="w-20" />
                                <span className="text-xs">{comparison.availability}%</span>
                              </div>
                            </div>
                            <div className="flex items-center justify-between text-sm">
                              <span>Est. Total with Delivery</span>
                              <span className="font-medium">
                                $
                                {(
                                  comparison.estimatedTotal + (comparison.deliveryFee || 0)
                                ).toFixed(2)}
                              </span>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                </div>
              </ScrollArea>
            ) : (
              <div className="flex flex-col items-center justify-center h-[400px] text-muted-foreground">
                <DollarSign className="h-12 w-12 mb-2" />
                <p>Price comparison data unavailable</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="options" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Export Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="group-category"
                    checked={groupByCategory}
                    onCheckedChange={(checked) => setGroupByCategory(checked as boolean)}
                  />
                  <Label
                    htmlFor="group-category"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    Group items by category
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="include-notes"
                    checked={includeNotes}
                    onCheckedChange={(checked) => setIncludeNotes(checked as boolean)}
                  />
                  <Label
                    htmlFor="include-notes"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    Include recipe notes
                  </Label>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Shopping List Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Total Items</span>
                    <span className="font-medium">{items.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Categories</span>
                    <span className="font-medium">
                      {new Set(items.map((i) => i.category || 'Other')).size}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>From Recipes</span>
                    <span className="font-medium">
                      {new Set(items.flatMap((i) => i.recipeIds || [])).size}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Your shopping list will be formatted for the selected service. Some services
                may require you to manually add items to your cart.
              </AlertDescription>
            </Alert>
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleExport}
            disabled={!selectedService || exportMutation.isPending}
          >
            {exportMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Exporting...
              </>
            ) : (
              <>
                <ShoppingCart className="mr-2 h-4 w-4" />
                Export to {GROCERY_SERVICES.find((s) => s.id === selectedService)?.name || 'Service'}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function cn(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(' ')
}