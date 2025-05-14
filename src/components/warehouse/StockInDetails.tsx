
import React from 'react';
import { StockIn, StockInDetail } from '@/types/stockIn';
import { StockInData } from '@/hooks/useStockInBoxes';
import { StockInDetailItem } from './StockInDetailItem';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { StockInProcessingStatus } from './StockInProcessingStatus';

export interface StockInDetailsProps {
  stockInData: StockInData;
  stockIn: StockIn;
  details: StockInDetail[];
}

export const StockInDetails: React.FC<StockInDetailsProps> = ({
  stockInData,
  stockIn,
  details
}) => {
  return (
    <div className="space-y-6">
      {/* Stock In Request Information */}
      <Card>
        <CardHeader>
          <CardTitle>Stock In Request Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium">Product</p>
              <p>{stockInData.product.name}</p>
            </div>
            <div>
              <p className="text-sm font-medium">Requested Boxes</p>
              <p>{stockInData.boxes}</p>
            </div>
            <div>
              <p className="text-sm font-medium">Source</p>
              <p>{stockInData.source}</p>
            </div>
            <div>
              <p className="text-sm font-medium">Status</p>
              <p>{stockInData.status}</p>
            </div>
            <div>
              <p className="text-sm font-medium">Submitter</p>
              <p>{stockInData.submitter.name}</p>
            </div>
            <div>
              <p className="text-sm font-medium">Created At</p>
              <p>{new Date(stockInData.created_at).toLocaleString()}</p>
            </div>
            {stockInData.notes && (
              <div className="col-span-2">
                <p className="text-sm font-medium">Notes</p>
                <p>{stockInData.notes}</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Processing Status */}
      <StockInProcessingStatus stockIn={stockIn} details={details} />

      {/* Stock In Details */}
      <Card>
        <CardHeader>
          <CardTitle>Stock In Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4">
            {details.map((detail) => (
              <StockInDetailItem key={detail.id} detail={detail} />
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
