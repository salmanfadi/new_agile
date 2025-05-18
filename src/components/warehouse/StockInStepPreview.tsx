
import React from 'react';
import { StockInRequestData } from '@/hooks/useStockInRequests';
import { BoxData } from '@/hooks/useStockInBoxes';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface StockInStepPreviewProps {
  stockIn: StockInRequestData;
  boxesData: BoxData[];
  isSubmitting: boolean;
  onSubmit: () => void;
  onBack: () => void;
}

interface WarehouseInfo {
  id: string;
  name: string;
}

interface LocationInfo {
  id: string;
  floor: number;
  zone: string;
}

const StockInStepPreview: React.FC<StockInStepPreviewProps> = ({
  stockIn,
  boxesData,
  isSubmitting,
  onSubmit,
  onBack,
}) => {
  // Calculate totals
  const totalBoxes = boxesData.length;
  const totalQuantity = boxesData.reduce((sum, box) => sum + (box.quantity || 0), 0);
  
  // Get warehouse and location information
  const { data: warehouses } = useQuery({
    queryKey: ['warehouses-preview'],
    queryFn: async () => {
      const { data } = await supabase.from('warehouses').select('*');
      return data as WarehouseInfo[];
    },
  });
  
  const { data: locations } = useQuery({
    queryKey: ['locations-preview'],
    queryFn: async () => {
      const { data } = await supabase.from('warehouse_locations').select('*');
      return data as LocationInfo[];
    },
  });
  
  // Get warehouse name from ID
  const getWarehouseName = (id: string) => {
    const warehouse = warehouses?.find(w => w.id === id);
    return warehouse?.name || 'Unknown Warehouse';
  };
  
  // Get location name from ID
  const getLocationName = (id: string) => {
    const location = locations?.find(l => l.id === id);
    return location ? `Floor ${location.floor}, Zone ${location.zone}` : 'Unknown Location';
  };
  
  // Group boxes by warehouse and location
  const boxesByLocation: Record<string, BoxData[]> = {};
  
  boxesData.forEach(box => {
    const key = `${box.warehouse_id}-${box.location_id}`;
    if (!boxesByLocation[key]) {
      boxesByLocation[key] = [];
    }
    boxesByLocation[key].push(box);
  });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold mb-4">Review Stock In Details</h2>
        
        {/* Summary Card */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">Product</h3>
                <p className="font-medium">{stockIn.product?.name || 'Unknown Product'}</p>
                {stockIn.product?.sku && (
                  <p className="text-sm text-muted-foreground">SKU: {stockIn.product.sku}</p>
                )}
              </div>
              
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">Source</h3>
                <p>{stockIn.source}</p>
              </div>
              
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">Total Items</h3>
                <p className="font-medium">{totalQuantity} items</p>
              </div>
              
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">Total Boxes</h3>
                <p className="font-medium">{totalBoxes} {totalBoxes === 1 ? 'box' : 'boxes'}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Boxes by Location */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium">Boxes by Location</h3>
        
        {Object.entries(boxesByLocation).map(([key, boxes]) => {
          const [warehouseId, locationId] = key.split('-');
          const warehouseName = getWarehouseName(warehouseId);
          const locationName = getLocationName(locationId);
          const locationTotal = boxes.reduce((sum, box) => sum + (box.quantity || 0), 0);
          
          return (
            <Card key={key} className="overflow-hidden">
              <div className="bg-muted p-4">
                <h4 className="font-medium">
                  {warehouseName} - {locationName}
                </h4>
                <p className="text-sm text-muted-foreground">
                  {boxes.length} {boxes.length === 1 ? 'box' : 'boxes'}, 
                  {' '}{locationTotal} {locationTotal === 1 ? 'item' : 'items'}
                </p>
              </div>
              <CardContent className="p-0">
                <table className="w-full">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="text-left py-2 px-4 text-sm font-medium">Box #</th>
                      <th className="text-left py-2 px-4 text-sm font-medium">Barcode</th>
                      <th className="text-left py-2 px-4 text-sm font-medium">Qty</th>
                      <th className="text-left py-2 px-4 text-sm font-medium">Color</th>
                      <th className="text-left py-2 px-4 text-sm font-medium">Size</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {boxes.map((box, idx) => (
                      <tr key={box.id}>
                        <td className="py-2 px-4">{idx + 1}</td>
                        <td className="py-2 px-4 font-mono text-sm">{box.barcode}</td>
                        <td className="py-2 px-4">{box.quantity}</td>
                        <td className="py-2 px-4">{box.color || '-'}</td>
                        <td className="py-2 px-4">{box.size || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </CardContent>
            </Card>
          );
        })}
      </div>
      
      <div className="flex justify-between pt-6">
        <Button variant="outline" onClick={onBack} disabled={isSubmitting}>
          Back
        </Button>
        
        <Button 
          onClick={onSubmit} 
          disabled={isSubmitting}
          className="min-w-[150px]"
        >
          {isSubmitting ? 'Processing...' : 'Complete Processing'}
        </Button>
      </div>
    </div>
  );
};

export default StockInStepPreview;
