
import React, { useState } from 'react';
import { StockInRequestData } from '@/hooks/useStockInRequests';
import { BoxData } from '@/hooks/useStockInBoxes';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useWarehouses } from '@/hooks/useWarehouses';
import { useLocations } from '@/hooks/useLocations';
import { Loader2, Printer } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import BarcodePreviewGrid from './BarcodePreviewGrid';

interface StockInStepPreviewProps {
  stockIn: StockInRequestData;
  boxesData: BoxData[];
  isSubmitting: boolean;
  onSubmit: () => void;
  onBack: () => void;
}

const StockInStepPreview: React.FC<StockInStepPreviewProps> = ({
  stockIn,
  boxesData,
  isSubmitting,
  onSubmit,
  onBack
}) => {
  const { warehouses } = useWarehouses();
  const [activeTab, setActiveTab] = useState<string>("summary");
  
  // Group boxes by warehouse/location
  const getBoxesByLocation = () => {
    const boxesByLocation: Record<string, {
      warehouseId: string;
      warehouseName: string;
      locationId: string;
      locationName: string;
      boxes: BoxData[];
      totalQuantity: number;
    }> = {};
    
    boxesData.forEach(box => {
      if (box.warehouse_id && box.location_id) {
        const key = `${box.warehouse_id}-${box.location_id}`;
        
        // Find warehouse name
        const warehouseName = warehouses?.find(w => w.id === box.warehouse_id)?.name || 'Unknown Warehouse';
        
        // Find location info
        let locationName = 'Unknown Location';
        const warehouse = warehouses?.find(w => w.id === box.warehouse_id);
        if (warehouse) {
          const { locations } = useLocations(box.warehouse_id);
          const location = locations?.find(l => l.id === box.location_id);
          if (location) {
            locationName = `Floor ${location.floor}, Zone ${location.zone}`;
          }
        }
        
        if (!boxesByLocation[key]) {
          boxesByLocation[key] = {
            warehouseId: box.warehouse_id,
            warehouseName,
            locationId: box.location_id,
            locationName,
            boxes: [],
            totalQuantity: 0
          };
        }
        
        boxesByLocation[key].boxes.push(box);
        boxesByLocation[key].totalQuantity += box.quantity || 0;
      }
    });
    
    return Object.values(boxesByLocation);
  };
  
  const batchGroups = getBoxesByLocation();
  
  // Calculate totals
  const totalBoxes = boxesData.length;
  const totalItems = boxesData.reduce((sum, box) => sum + (box.quantity || 0), 0);
  
  // Handle print functionality
  const handlePrintBarcodes = (selectedBarcodes: string[]) => {
    // In a real implementation, this would trigger printing
    console.log("Printing barcodes:", selectedBarcodes);
    
    // Create a print window with the barcodes
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    
    // Generate HTML for printing
    printWindow.document.write(`
      <html>
        <head>
          <title>Barcodes for Printing</title>
          <style>
            body { font-family: Arial, sans-serif; }
            .barcode-container {
              display: flex;
              flex-wrap: wrap;
              gap: 10px;
            }
            .barcode-item {
              border: 1px solid #ddd;
              padding: 10px;
              width: 200px;
              text-align: center;
              margin-bottom: 10px;
            }
            .barcode {
              height: 50px;
              margin: 10px 0;
              background-repeat: no-repeat;
              background-position: center;
            }
            @media print {
              @page { margin: 0.5cm; }
            }
          </style>
        </head>
        <body>
          <h3>Barcodes for Stock In - ${stockIn.id}</h3>
          <div class="barcode-container">
            ${selectedBarcodes.map(barcode => {
              const box = boxesData.find(b => b.barcode === barcode);
              const boxIndex = boxesData.findIndex(b => b.barcode === barcode);
              
              return `
                <div class="barcode-item">
                  <div style="font-weight: bold;">Box #${boxIndex + 1}</div>
                  <div class="barcode" style="background-image: url('data:image/svg+xml;base64,${btoa(`
                    <svg xmlns="http://www.w3.org/2000/svg" width="180" height="40">
                      ${Array.from({length: 40}, (_, i) => 
                        `<rect x="${i * 4.5}" y="0" width="${Math.random() > 0.5 ? 3 : 2}" height="40" fill="black" />`
                      ).join('')}
                    </svg>
                  `)}')"></div>
                  <div style="font-family: monospace; font-size: 12px;">${barcode}</div>
                  <div style="margin-top: 5px; font-size: 12px;">
                    Qty: ${box?.quantity || 0}
                    ${box?.color ? `, ${box.color}` : ''}
                    ${box?.size ? `, ${box.size}` : ''}
                  </div>
                </div>
              `;
            }).join('')}
          </div>
          <script>
            window.onload = function() {
              window.print();
              setTimeout(function() { window.close(); }, 500);
            };
          </script>
        </body>
      </html>
    `);
    
    printWindow.document.close();
  };

  return (
    <div className="space-y-6">
      <Card className="overflow-hidden border-0 shadow-none bg-muted/50">
        <CardContent className="p-6">
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-1">Product</h3>
              <p className="text-lg font-semibold">{stockIn.product?.name}</p>
              {stockIn.product?.sku && (
                <p className="text-sm text-muted-foreground">SKU: {stockIn.product.sku}</p>
              )}
            </div>
            
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-1">Source</h3>
              <p className="text-lg">{stockIn.source}</p>
            </div>
            
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-1">Total Items</h3>
              <p className="text-lg">{totalItems} items</p>
            </div>
            
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-1">Total Boxes</h3>
              <p className="text-lg">{totalBoxes} boxes</p>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="summary">Summary View</TabsTrigger>
          <TabsTrigger value="barcodes">Barcode Preview</TabsTrigger>
        </TabsList>
        
        <TabsContent value="summary" className="pt-4">
          <h2 className="text-xl font-semibold mb-4">Boxes by Location</h2>
          
          {batchGroups.map((group, index) => (
            <Card key={index} className="mb-6">
              <CardHeader className="bg-muted py-4">
                <CardTitle className="text-lg">
                  {group.warehouseName} - {group.locationName}
                </CardTitle>
                <CardDescription>
                  {group.boxes.length} {group.boxes.length === 1 ? 'box' : 'boxes'} | 
                  Total quantity: {group.totalQuantity} items
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-muted/50">
                      <tr>
                        <th className="py-3 px-4 text-left font-medium">Box #</th>
                        <th className="py-3 px-4 text-left font-medium">Barcode</th>
                        <th className="py-3 px-4 text-left font-medium">Quantity</th>
                        <th className="py-3 px-4 text-left font-medium">Color</th>
                        <th className="py-3 px-4 text-left font-medium">Size</th>
                      </tr>
                    </thead>
                    <tbody>
                      {group.boxes.map((box, boxIndex) => (
                        <tr key={boxIndex} className="border-t border-muted">
                          <td className="py-3 px-4">{boxesData.indexOf(box) + 1}</td>
                          <td className="py-3 px-4 font-mono text-xs">{box.barcode}</td>
                          <td className="py-3 px-4">{box.quantity}</td>
                          <td className="py-3 px-4">{box.color || '-'}</td>
                          <td className="py-3 px-4">{box.size || '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>
        
        <TabsContent value="barcodes" className="pt-4">
          <h2 className="text-xl font-semibold mb-4">Barcode Preview</h2>
          <BarcodePreviewGrid 
            boxesData={boxesData} 
            onPrint={handlePrintBarcodes} 
          />
        </TabsContent>
      </Tabs>
      
      <div className="flex justify-between pt-4">
        <Button variant="outline" onClick={onBack} disabled={isSubmitting}>
          Back
        </Button>
        <Button 
          onClick={onSubmit} 
          disabled={isSubmitting} 
          className="min-w-[200px]"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Processing...
            </>
          ) : (
            'Complete Processing'
          )}
        </Button>
      </div>
    </div>
  );
};

export default StockInStepPreview;
