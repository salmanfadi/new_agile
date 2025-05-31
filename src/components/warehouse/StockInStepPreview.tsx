import React from 'react';
import { StockInRequestData } from '@/hooks/useStockInRequests';
import { BoxData } from '@/hooks/useStockInBoxes';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useWarehouses } from '@/hooks/useWarehouses';
import { useLocations } from '@/hooks/useLocations';
import { Loader2 } from 'lucide-react';

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
  const { locations } = useLocations('');

  const getWarehouseName = (id: string) => {
    return warehouses?.find(w => w.id === id)?.name || id;
  };

  const getLocationName = (id: string) => {
    return locations?.find(l => l.id === id)?.name || id;
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Preview Stock In Details</CardTitle>
          <CardDescription>
            Review the details before submitting. Total boxes: {stockIn.number_of_boxes}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h3 className="font-medium mb-2">Product</h3>
              <p>{stockIn.product.name}</p>
              {stockIn.product.sku && (
                <p className="text-sm text-gray-500">SKU: {stockIn.product.sku}</p>
              )}
            </div>
            
            <div>
              <h3 className="font-medium mb-2">Box Allocations</h3>
              <div className="space-y-2">
                {boxesData.map((box, index) => (
                  <div key={index} className="p-2 bg-muted rounded-lg">
                    <p>Box {index + 1}</p>
                    <p className="text-sm text-gray-500">
                      Warehouse: {getWarehouseName(box.warehouse_id)}
                    </p>
                    <p className="text-sm text-gray-500">
                      Location: {getLocationName(box.location_id)}
                    </p>
                    {box.color && (
                      <p className="text-sm text-gray-500">Color: {box.color}</p>
                    )}
                    {box.size && (
                      <p className="text-sm text-gray-500">Size: {box.size}</p>
                    )}
            </div>
                ))}
            </div>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <div className="flex justify-between">
        <Button variant="outline" onClick={onBack}>
          Back
        </Button>
        <Button onClick={onSubmit} disabled={isSubmitting}>
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Submitting...
            </>
          ) : (
            'Submit'
          )}
        </Button>
      </div>
    </div>
  );
};

export default StockInStepPreview;
