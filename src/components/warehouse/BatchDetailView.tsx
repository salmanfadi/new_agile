
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Download, 
  Printer, 
  Package, 
  MapPin, 
  Calendar,
  User,
  FileText,
  Hash
} from 'lucide-react';
import { BatchItemsTable } from './BatchItemsTable';
import { ProcessedBatchWithItems } from '@/hooks/useProcessedBatchesWithItems';
import { format } from 'date-fns';

interface BatchDetailViewProps {
  batch: ProcessedBatchWithItems;
  onClose: () => void;
}

export const BatchDetailView: React.FC<BatchDetailViewProps> = ({ batch, onClose }) => {
  const [activeTab, setActiveTab] = useState('summary');

  const handleExportCSV = () => {
    const csvContent = [
      ['Barcode', 'Quantity', 'Color', 'Size', 'Status', 'Warehouse', 'Location'],
      ...batch.items.map(item => [
        item.barcode,
        item.quantity.toString(),
        item.color || '',
        item.size || '',
        item.status,
        item.warehouseName || '',
        item.locationDetails || ''
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `batch-${batch.id}-items.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const handlePrintBarcodes = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const barcodeHtml = batch.items.map(item => `
      <div style="margin: 10px; text-align: center;">
        <div style="font-family: 'Courier New', monospace; font-size: 16px; border: 1px solid #000; padding: 10px;">
          ${item.barcode}
        </div>
        <div style="font-size: 12px; margin-top: 5px;">
          ${item.color || ''} ${item.size || ''} - Qty: ${item.quantity}
        </div>
      </div>
    `).join('');

    printWindow.document.write(`
      <html>
        <head><title>Batch ${batch.id} - Barcodes</title></head>
        <body>
          <h2>Batch ${batch.id} - Barcodes</h2>
          <div style="display: flex; flex-wrap: wrap;">
            ${barcodeHtml}
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'processing': return 'bg-blue-100 text-blue-800';
      case 'failed': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-6xl w-full max-h-[90vh] overflow-hidden">
        <div className="p-6 border-b flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold">Batch Details</h2>
            <p className="text-gray-600">Batch ID: {batch.id}</p>
          </div>
          <div className="flex gap-2">
            <Button onClick={handleExportCSV} variant="outline" size="sm">
              <Download className="w-4 h-4 mr-2" />
              Export CSV
            </Button>
            <Button onClick={handlePrintBarcodes} variant="outline" size="sm">
              <Printer className="w-4 h-4 mr-2" />
              Print Barcodes
            </Button>
            <Button onClick={onClose} variant="outline" size="sm">
              Close
            </Button>
          </div>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="summary">Summary</TabsTrigger>
              <TabsTrigger value="items">Items ({batch.items.length})</TabsTrigger>
              <TabsTrigger value="barcodes">Barcodes</TabsTrigger>
            </TabsList>

            <TabsContent value="summary" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium flex items-center">
                      <Package className="w-4 h-4 mr-2" />
                      Batch Status
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Badge className={getStatusColor(batch.status)}>
                      {batch.status}
                    </Badge>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium flex items-center">
                      <Hash className="w-4 h-4 mr-2" />
                      Total Items
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{batch.totalBoxes}</div>
                    <div className="text-sm text-gray-500">
                      Qty: {batch.totalQuantity}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium flex items-center">
                      <Calendar className="w-4 h-4 mr-2" />
                      Created
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-sm">
                      {format(new Date(batch.createdAt), 'MMM d, yyyy')}
                    </div>
                    <div className="text-xs text-gray-500">
                      {format(new Date(batch.createdAt), 'h:mm a')}
                    </div>
                  </CardContent>
                </Card>

                {batch.product && (
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium flex items-center">
                        <Package className="w-4 h-4 mr-2" />
                        Product
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="font-medium">{batch.product.name}</div>
                      {batch.product.sku && (
                        <div className="text-sm text-gray-500">SKU: {batch.product.sku}</div>
                      )}
                    </CardContent>
                  </Card>
                )}

                {batch.warehouseName && (
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium flex items-center">
                        <MapPin className="w-4 h-4 mr-2" />
                        Location
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="font-medium">{batch.warehouseName}</div>
                      {batch.locationDetails && (
                        <div className="text-sm text-gray-500">{batch.locationDetails}</div>
                      )}
                    </CardContent>
                  </Card>
                )}

                {batch.processorName && (
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium flex items-center">
                        <User className="w-4 h-4 mr-2" />
                        Processed By
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="font-medium">{batch.processorName}</div>
                    </CardContent>
                  </Card>
                )}
              </div>

              {batch.notes && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm font-medium flex items-center">
                      <FileText className="w-4 h-4 mr-2" />
                      Notes
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm">{batch.notes}</p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="items">
              <BatchItemsTable 
                items={batch.items} 
                isLoading={false}
                error={null}
              />
            </TabsContent>

            <TabsContent value="barcodes">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {batch.items.map((item) => (
                  <Card key={item.id} className="p-4">
                    <div className="text-center">
                      <div className="font-mono text-lg font-bold border-2 border-gray-300 p-2 mb-2">
                        {item.barcode}
                      </div>
                      <div className="text-sm text-gray-600">
                        {item.color} {item.size} - Qty: {item.quantity}
                      </div>
                      <Badge variant="outline" className="mt-2">
                        {item.status}
                      </Badge>
                    </div>
                  </Card>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};
