import React from 'react';
import { StockInRequestData } from '@/hooks/useStockInRequests';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DefaultValuesType } from './StockInWizard';

interface StockInStepReviewProps {
  stockIn: StockInRequestData;
  onContinue: () => Promise<void>;
  onCancel: () => void;
  warehouseId: string;
  setWarehouseId: React.Dispatch<React.SetStateAction<string>>;
  locationId: string;
  setLocationId: React.Dispatch<React.SetStateAction<string>>;
  defaultValues: DefaultValuesType;
  setDefaultValues: React.Dispatch<React.SetStateAction<DefaultValuesType>>;
  confirmedBoxes: number;
  setConfirmedBoxes: React.Dispatch<React.SetStateAction<number>>;
  isLoading: boolean;
}

const StockInStepReview: React.FC<StockInStepReviewProps> = ({
  stockIn,
  onContinue,
  onCancel,
  warehouseId,
  setWarehouseId,
  locationId,
  setLocationId,
  defaultValues,
  setDefaultValues,
  confirmedBoxes,
  setConfirmedBoxes,
  isLoading
}) => {
  // This step is read-only, no data fetching needed
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Review Stock In Request</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4">
            <div>
              <h3 className="font-medium mb-2">Product</h3>
              <p>{stockIn.product.name}</p>
              {stockIn.product.sku && (
                <p className="text-sm text-gray-500">SKU: {stockIn.product.sku}</p>
              )}
            </div>
            <div>
              <h3 className="font-medium mb-2">Number of Boxes</h3>
              <p>{stockIn.number_of_boxes}</p>
            </div>
            <div>
              <h3 className="font-medium mb-2">Source</h3>
              <p>{stockIn.source}</p>
            </div>
            {stockIn.notes && (
              <div>
                <h3 className="font-medium mb-2">Notes</h3>
                <p>{stockIn.notes}</p>
              </div>
            )}
            <div>
              <h3 className="font-medium mb-2">Status</h3>
              <Badge>{stockIn.status}</Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-between">
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button onClick={onContinue} disabled={isLoading}>
          Continue
        </Button>
      </div>
    </div>
  );
};

export default StockInStepReview; 