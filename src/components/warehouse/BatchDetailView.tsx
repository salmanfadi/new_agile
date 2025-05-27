
import React, { useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { FileText, Package, Boxes, Warehouse, Download, Printer } from 'lucide-react';
import { format } from 'date-fns';
import BarcodePreview from '../barcode/BarcodePreview';
import { useBatchItems } from '@/hooks/useBatchItems';
import { BatchItem } from '@/components/warehouse/BatchItemsTable';

interface BatchDetailViewProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  batchId: string | null;
  onPrintBarcodes?: () => void;
}

export function BatchDetailView({ open, onOpenChange, batchId, onPrintBarcodes }: BatchDetailViewProps) {
  const [activeTab, setActiveTab] = useState<string>('items');
  const { data: batchItems, isLoading, error } = useBatchItems(batchId || undefined);
  
  // Group boxes by location for summary view
  const groupedByLocation = React.useMemo(() => {
    if (!batchItems) return [];
    
    const groups: Record<string, { locationName: string; warehouseName: string; items: BatchItem[] }> = {};
    
    batchItems.forEach(item => {
      const locationKey = `${item.warehouse_id}-${item.location_id}`;
      if (!groups[locationKey]) {
        groups[locationKey] = {
          locationName: item.locationDetails || 'Unknown Location',
          warehouseName: item.warehouseName || 'Unknown Warehouse',
          items: []
        };
      }
      groups[locationKey].items.push(item);
    });
    
    return Object.values(groups);
  }, [batchItems]);
  
  // Calculate totals for summary display
  const totalQuantity = React.useMemo(() => 
    batchItems?.reduce((sum, item) => sum + item.quantity, 0) || 0,
  [batchItems]);
  
  const totalBoxes = React.useMemo(() => 
    batchItems?.length || 0,
  [batchItems]);
  
  // Get basic batch information from first item (if available)
  const batchInfo = React.useMemo(() => {
    if (!batchItems || batchItems.length === 0) return null;
    return {
      batchId: batchItems[0].batch_id,
      createdAt: batchItems[0].created_at,
    };
  }, [batchItems]);
  
  // Get unique attributes (colors, sizes)
  const attributes = React.useMemo(() => {
    if (!batchItems) return { colors: [], sizes: [] };
    
    const colors = new Set<string>();
    const sizes = new Set<string>();
    
    batchItems.forEach(item => {
      if (item.color) colors.add(item.color);
      if (item.size) sizes.add(item.size);
    });
    
    return {
      colors: Array.from(colors),
      sizes: Array.from(sizes)
    };
  }, [batchItems]);
  
  // Handle download data as CSV
  const handleExportCSV = () => {
    if (!batchItems || batchItems.length === 0) return;
    
    const headers = 'Barcode,Quantity,Status,Color,Size,Warehouse,Location,Created\n';
    const csvData = batchItems.map(item => {
      return `"${item.barcode}",${item.quantity},"${item.status}","${item.color || ''}","${item.size || ''}","${item.warehouseName || ''}","${item.locationDetails || ''}","${format(new Date(item.created_at), 'yyyy-MM-dd')}"`
    }).join('\n');
    
    const csvContent = `data:text/csv;charset=utf-8,${headers}${csvData}`;
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `batch-${batchId}-items.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex justify-between items-center">
            <span>Batch Details</span>
            {batchInfo && (
              <Badge variant="outline" className="ml-2 text-xs">
                {format(new Date(batchInfo.createdAt), 'MMM d, yyyy')}
              </Badge>
            )}
          </DialogTitle>
          <DialogDescription>
            {batchId && (
              <span className="font-mono text-xs">Batch ID: {batchId}</span>
            )}
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : error ? (
          <div className="rounded-md bg-red-50 border border-red-200 p-4 my-4">
            <p className="text-red-800">Failed to load batch details: {error instanceof Error ? error.message : 'Unknown error'}</p>
          </div>
        ) : !batchItems || batchItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <Package className="h-12 w-12 text-gray-300 mb-2" />
            <p>No items found for this batch</p>
          </div>
        ) : (
          <>
            <div className="flex justify-between items-center mb-4">
              <div className="flex space-x-2">
                <Button variant="outline" size="sm" onClick={onPrintBarcodes}>
                  <Printer className="h-4 w-4 mr-1" />
                  Print All Barcodes
                </Button>
                <Button variant="outline" size="sm" onClick={handleExportCSV}>
                  <Download className="h-4 w-4 mr-1" />
                  Export Data
                </Button>
              </div>
            </div>

            <Tabs
              defaultValue="summary" 
              value={activeTab} 
              onValueChange={setActiveTab} 
              className="w-full"
            >
              <TabsList>
                <TabsTrigger value="summary">
                  <Warehouse className="h-4 w-4 mr-1" />
                  Summary
                </TabsTrigger>
                <TabsTrigger value="items">
                  <Boxes className="h-4 w-4 mr-1" />
                  Items ({totalBoxes})
                </TabsTrigger>
                <TabsTrigger value="barcodes">
                  <FileText className="h-4 w-4 mr-1" />
                  Barcodes
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="summary" className="border-none p-0 mt-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium">Total Items</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{totalBoxes}</div>
                      <p className="text-xs text-muted-foreground">Individual boxes/items</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium">Total Quantity</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{totalQuantity}</div>
                      <p className="text-xs text-muted-foreground">Units across all items</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium">Locations</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{groupedByLocation.length}</div>
                      <p className="text-xs text-muted-foreground">Warehouse locations</p>
                    </CardContent>
                  </Card>
                </div>
                
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Location Breakdown</CardTitle>
                    <CardDescription>Items grouped by warehouse location</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ScrollArea className="h-[300px]">
                      {groupedByLocation.map((location, idx) => (
                        <div key={idx} className="mb-4">
                          <div className="flex justify-between items-center mb-2">
                            <div>
                              <h4 className="font-medium">{location.warehouseName}</h4>
                              <p className="text-sm text-muted-foreground">{location.locationName}</p>
                            </div>
                            <Badge variant="outline">{location.items.length} items</Badge>
                          </div>
                          
                          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                            {location.items.map(item => (
                              <Card key={item.id} className="p-2 border">
                                <p className="text-xs font-medium truncate">{item.barcode}</p>
                                <div className="flex justify-between items-center mt-1">
                                  <span className="text-xs">Qty: {item.quantity}</span>
                                  {item.color && <Badge variant="secondary" className="text-xs">{item.color}</Badge>}
                                </div>
                              </Card>
                            ))}
                          </div>
                          
                          {idx < groupedByLocation.length - 1 && <Separator className="my-4" />}
                        </div>
                      ))}
                    </ScrollArea>
                  </CardContent>
                </Card>

                {(attributes.colors.length > 0 || attributes.sizes.length > 0) && (
                  <Card className="mt-4">
                    <CardHeader>
                      <CardTitle className="text-base">Attributes</CardTitle>
                      <CardDescription>Colors and sizes in this batch</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {attributes.colors.length > 0 && (
                          <div>
                            <h4 className="font-medium mb-2">Colors</h4>
                            <div className="flex flex-wrap gap-1">
                              {attributes.colors.map(color => (
                                <Badge key={color} variant="secondary">{color}</Badge>
                              ))}
                            </div>
                          </div>
                        )}
                        
                        {attributes.sizes.length > 0 && (
                          <div>
                            <h4 className="font-medium mb-2">Sizes</h4>
                            <div className="flex flex-wrap gap-1">
                              {attributes.sizes.map(size => (
                                <Badge key={size} variant="secondary">{size}</Badge>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>
              
              <TabsContent value="items" className="border-none p-0 mt-4">
                <ScrollArea className="h-[400px]">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Barcode</TableHead>
                        <TableHead>Quantity</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Attributes</TableHead>
                        <TableHead>Location</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {batchItems.map(item => (
                        <TableRow key={item.id}>
                          <TableCell className="font-mono text-xs">{item.barcode}</TableCell>
                          <TableCell>{item.quantity}</TableCell>
                          <TableCell>
                            <Badge className={
                              item.status === 'available' ? 'bg-green-500' :
                              item.status === 'reserved' ? 'bg-blue-500' :
                              item.status === 'sold' ? 'bg-purple-500' :
                              item.status === 'damaged' ? 'bg-red-500' : ''
                            }>
                              {item.status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {(item.color || item.size) ? (
                              <div className="flex flex-wrap gap-1">
                                {item.color && <Badge variant="outline" className="text-xs">{item.color}</Badge>}
                                {item.size && <Badge variant="outline" className="text-xs">{item.size}</Badge>}
                              </div>
                            ) : '—'}
                          </TableCell>
                          <TableCell>
                            <div>
                              <div className="text-xs font-medium">{item.warehouseName}</div>
                              <div className="text-xs text-muted-foreground">{item.locationDetails}</div>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </ScrollArea>
              </TabsContent>
              
              <TabsContent value="barcodes" className="border-none p-0 mt-4">
                <ScrollArea className="h-[400px]">
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 p-2">
                    {batchItems.map(item => (
                      <Card key={item.id} className="p-4 flex flex-col items-center">
                        <BarcodePreview 
                          barcode={item.barcode} 
                          height={60}
                          width={180}
                          includeText={true}
                          scale={2}
                        />
                        <div className="mt-2 text-center">
                          <p className="text-xs font-medium">{item.quantity} units</p>
                          {(item.color || item.size) && (
                            <p className="text-xs text-muted-foreground">
                              {[item.color, item.size].filter(Boolean).join(' / ')}
                            </p>
                          )}
                        </div>
                      </Card>
                    ))}
                  </div>
                </ScrollArea>
              </TabsContent>
            </Tabs>
          </>
        )}
        
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
