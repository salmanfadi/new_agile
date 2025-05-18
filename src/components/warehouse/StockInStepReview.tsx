import React from 'react';
import { StockInRequestData } from '@/hooks/useStockInRequests';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface StockInStepReviewProps {
  stockIn: StockInRequestData;
  onContinue: () => void;
  onCancel: () => void;
}

const StockInStepReview: React.FC<StockInStepReviewProps> = ({ stockIn, onContinue, onCancel }) => {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Stock-In Request Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="text-sm text-muted-foreground">Product</p>
            <p className="font-medium">{stockIn.product?.name}</p>
            {stockIn.product?.sku && <p className="text-xs text-muted-foreground">SKU: {stockIn.product.sku}</p>}
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Status</p>
            <Badge variant="outline">{stockIn.status}</Badge>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Submitted By</p>
            <p>{stockIn.submitter?.name}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Boxes</p>
            <p>{stockIn.boxes}</p>
          </div>
          {stockIn.notes && (
            <div>
              <p className="text-sm text-muted-foreground">Notes</p>
              <p>{stockIn.notes}</p>
            </div>
          )}
        </CardContent>
      </Card>
      <div className="flex justify-end space-x-4">
        <Button variant="outline" onClick={onCancel}>Cancel</Button>
        <Button onClick={onContinue}>Continue</Button>
      </div>
    </div>
  );
};

export default StockInStepReview; 