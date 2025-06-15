
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

// Define the type here to avoid import issues
interface DefaultValuesType {
  warehouse_id: string;
  location_id: string;
  color: string;
  size: string;
  quantity: number;
}

interface BoxData {
  id: string;
  barcode: string;
  quantity: number;
  color: string;
  size: string;
  warehouse_id: string;
  location_id: string;
}

interface StockInStepReviewProps {
  boxes: BoxData[];
  defaultValues: DefaultValuesType;
  warehouses: Array<{ id: string; name: string }>;
  locations: Array<{ id: string; warehouse_id: string; zone: string; floor: string }>;
}

export const StockInStepReview: React.FC<StockInStepReviewProps> = ({
  boxes,
  defaultValues,
  warehouses,
  locations
}) => {
  const getWarehouseName = (warehouseId: string) => {
    return warehouses.find(w => w.id === warehouseId)?.name || 'Unknown Warehouse';
  };

  const getLocationName = (locationId: string) => {
    const location = locations.find(l => l.id === locationId);
    return location ? `Floor ${location.floor} - Zone ${location.zone}` : 'Unknown Location';
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Review Stock In Details</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div>
              <h4 className="font-medium mb-2">Default Values Applied</h4>
              <div className="space-y-2 text-sm">
                <p><span className="font-medium">Warehouse:</span> {getWarehouseName(defaultValues.warehouse_id)}</p>
                <p><span className="font-medium">Location:</span> {getLocationName(defaultValues.location_id)}</p>
                <p><span className="font-medium">Color:</span> {defaultValues.color || 'Not set'}</p>
                <p><span className="font-medium">Size:</span> {defaultValues.size || 'Not set'}</p>
                <p><span className="font-medium">Quantity per box:</span> {defaultValues.quantity}</p>
              </div>
            </div>
            <div>
              <h4 className="font-medium mb-2">Summary</h4>
              <div className="space-y-2 text-sm">
                <p><span className="font-medium">Total Boxes:</span> {boxes.length}</p>
                <p><span className="font-medium">Total Items:</span> {boxes.reduce((sum, box) => sum + box.quantity, 0)}</p>
              </div>
            </div>
          </div>

          <div>
            <h4 className="font-medium mb-2">Boxes to be processed</h4>
            <div className="max-h-64 overflow-y-auto">
              <div className="grid gap-2">
                {boxes.map((box, index) => (
                  <div key={box.id} className="flex items-center justify-between p-2 border rounded">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-sm">{box.barcode}</span>
                      <Badge variant="outline">Qty: {box.quantity}</Badge>
                      {box.color && <Badge variant="outline">{box.color}</Badge>}
                      {box.size && <Badge variant="outline">{box.size}</Badge>}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {getWarehouseName(box.warehouse_id)} - {getLocationName(box.location_id)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default StockInStepReview;
