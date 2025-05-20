
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { PageHeader } from '@/components/ui/PageHeader';
import { Button } from '@/components/ui/button';
import { 
  ArrowLeft, Printer, Download, BoxesIcon, Eye, Settings, GridIcon, ListBulletIcon
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useBatchDetails, useBatchItems } from '@/hooks/useProcessedBatches';
import { BarcodePreview } from '@/components/barcode/BarcodePreview';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Table, TableBody, TableCell, TableHead, 
  TableHeader, TableRow 
} from '@/components/ui/table';
import { toast } from '@/hooks/use-toast';

// Helper function to create a CSV from batch items
const generateCSV = (batchId: string, items: any[]) => {
  const headers = ['Barcode', 'Quantity', 'Color', 'Size', 'Status', 'Location'];
  const rows = items.map(item => [
    item.barcode,
    item.quantity,
    item.color || '',
    item.size || '',
    item.status,
    `${item.warehouseName} - ${item.locationDetails}`
  ]);
  
  let csv = [headers, ...rows].map(row => row.join(',')).join('\n');
  
  // Create a Blob and download
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `batch-${batchId.substring(0, 8)}-barcodes.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  window.URL.revokeObjectURL(url);
};

const BarcodePrintPage = () => {
  const { batchId } = useParams<{ batchId: string }>();
  const navigate = useNavigate();
  const [view, setView] = useState<'grid' | 'table'>('grid');
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [selectAll, setSelectAll] = useState(false);
  
  const { data: batchDetails, isLoading: batchLoading } = useBatchDetails(batchId);
  const { data: items, isLoading: itemsLoading } = useBatchItems(batchId);
  
  const isLoading = batchLoading || itemsLoading;
  
  // Handle select all items
  useEffect(() => {
    if (selectAll && items) {
      setSelectedItems(items.map(item => item.id));
    } else if (!selectAll) {
      setSelectedItems([]);
    }
  }, [selectAll, items]);
  
  const handleItemSelect = (itemId: string) => {
    setSelectedItems(prev => {
      if (prev.includes(itemId)) {
        return prev.filter(id => id !== itemId);
      } else {
        return [...prev, itemId];
      }
    });
  };
  
  const handlePrint = () => {
    window.print();
    toast({
      title: 'Print dialog opened',
      description: 'Your barcodes are ready to print.'
    });
  };
  
  const handleExport = () => {
    if (!items || !batchId) return;
    
    generateCSV(batchId, items);
    
    toast({
      title: 'Export started',
      description: 'Your CSV file will download shortly.'
    });
  };
  
  const handleViewDetails = () => {
    if (batchId) {
      navigate(`/manager/batch/${batchId}`);
    }
  };
  
  return (
    <div className="space-y-6 print:m-0 print:p-0">
      <div className="print:hidden">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate(-1)}
          className="gap-1"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>
      </div>
      
      <PageHeader 
        title="Batch Barcodes" 
        description={isLoading ? 'Loading...' : `${batchDetails?.product?.name || 'Unknown Product'}`}
        className="print:hidden"
      />
      
      <div className="print:hidden">
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>
                  Batch #{batchId?.substring(0, 8).toUpperCase() || ''}
                </CardTitle>
                <CardDescription>
                  {isLoading ? 'Loading batch details...' : (
                    <>
                      {batchDetails?.total_boxes || 0} boxes, 
                      {' '}{batchDetails?.total_quantity || 0} items
                    </>
                  )}
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" onClick={handlePrint}>
                  <Printer className="h-4 w-4 mr-2" />
                  Print
                </Button>
                <Button variant="outline" onClick={handleExport}>
                  <Download className="h-4 w-4 mr-2" />
                  Export CSV
                </Button>
                <Button variant="ghost" onClick={handleViewDetails}>
                  <Eye className="h-4 w-4 mr-2" />
                  Batch Details
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <Button 
                  variant={selectAll ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectAll(!selectAll)}
                >
                  {selectAll ? 'Deselect All' : 'Select All'}
                </Button>
                <span className="text-sm text-muted-foreground">
                  {selectedItems.length} of {items?.length || 0} selected
                </span>
              </div>
              
              <Tabs value={view} onValueChange={(v: string) => setView(v as 'grid' | 'table')}>
                <TabsList className="grid w-[180px] grid-cols-2">
                  <TabsTrigger value="grid">
                    <GridIcon className="h-4 w-4 mr-2" />
                    Grid
                  </TabsTrigger>
                  <TabsTrigger value="table">
                    <ListBulletIcon className="h-4 w-4 mr-2" />
                    Table
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
            
            {isLoading ? (
              view === 'grid' ? (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {Array.from({ length: 8 }).map((_, i) => (
                    <Skeleton key={i} className="h-[180px] w-full" />
                  ))}
                </div>
              ) : (
                <Skeleton className="h-[400px] w-full" />
              )
            ) : !items || items.length === 0 ? (
              <div className="text-center py-16 border rounded-md">
                <BoxesIcon className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                <h3 className="text-xl font-medium mb-2">No Barcodes Found</h3>
                <p className="text-muted-foreground">
                  This batch doesn't have any box items with barcodes.
                </p>
              </div>
            ) : (
              <TabsContent value="grid" className="mt-0">
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {items.map((item) => (
                    <div 
                      key={item.id}
                      className={`border rounded-lg p-4 cursor-pointer ${
                        selectedItems.includes(item.id) ? 'ring-2 ring-primary bg-primary/5' : ''
                      }`}
                      onClick={() => handleItemSelect(item.id)}
                    >
                      <BarcodePreview value={item.barcode} height={80} />
                      <div className="mt-2">
                        <p className="font-mono text-xs text-center">{item.barcode}</p>
                        <p className="text-xs text-center">Qty: {item.quantity}</p>
                        {(item.color || item.size) && (
                          <p className="text-xs text-center text-muted-foreground">
                            {[item.color, item.size].filter(Boolean).join(', ')}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </TabsContent>
            )}
            
            <TabsContent value="table" className="mt-0">
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">
                        <input 
                          type="checkbox" 
                          checked={selectAll}
                          onChange={() => setSelectAll(!selectAll)}
                          className="h-4 w-4 rounded border-gray-300"
                        />
                      </TableHead>
                      <TableHead>Barcode</TableHead>
                      <TableHead>Quantity</TableHead>
                      <TableHead>Details</TableHead>
                      <TableHead>Location</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoading ? (
                      Array.from({ length: 5 }).map((_, i) => (
                        <TableRow key={i}>
                          <TableCell colSpan={6}>
                            <Skeleton className="h-6 w-full" />
                          </TableCell>
                        </TableRow>
                      ))
                    ) : !items || items.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-10">
                          No barcodes found for this batch
                        </TableCell>
                      </TableRow>
                    ) : (
                      items.map((item) => (
                        <TableRow 
                          key={item.id}
                          className={selectedItems.includes(item.id) ? 'bg-primary/5' : ''}
                        >
                          <TableCell>
                            <input 
                              type="checkbox" 
                              checked={selectedItems.includes(item.id)}
                              onChange={() => handleItemSelect(item.id)}
                              className="h-4 w-4 rounded border-gray-300"
                            />
                          </TableCell>
                          <TableCell className="font-mono">{item.barcode}</TableCell>
                          <TableCell>{item.quantity}</TableCell>
                          <TableCell>
                            {(item.color || item.size) 
                              ? [item.color, item.size].filter(Boolean).join(', ') 
                              : 'N/A'
                            }
                          </TableCell>
                          <TableCell>
                            {item.warehouseName}, {item.locationDetails}
                          </TableCell>
                          <TableCell>
                            {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>
          </CardContent>
        </Card>
      </div>
      
      {/* Print-only content - optimized for printing */}
      <div className="hidden print:block">
        <h1 className="text-xl font-bold mb-2">
          Batch #{batchId?.substring(0, 8).toUpperCase()}
        </h1>
        <p className="text-sm mb-6">
          {batchDetails?.product?.name} - {items?.length || 0} boxes - 
          Printed on {new Date().toLocaleDateString()}
        </p>
        
        <div className="grid grid-cols-2 gap-4 print:grid-cols-3">
          {items?.map((item, index) => (
            <div key={item.id} className="border rounded-lg p-4 print:break-inside-avoid">
              <BarcodePreview value={item.barcode} height={80} />
              <div className="mt-2 text-center">
                <p className="font-mono text-xs">{item.barcode}</p>
                <p className="text-xs">
                  Qty: {item.quantity} {item.color ? `| ${item.color}` : ''} {item.size ? `| ${item.size}` : ''}
                </p>
                <p className="text-xs">Box {index + 1} of {items.length}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default BarcodePrintPage;
