
import React from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { StockInData } from '@/hooks/useStockInBoxes';

interface StockInDetailsProps {
  stockInData: StockInData;
}

export const StockInDetails: React.FC<StockInDetailsProps> = ({ stockInData }) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Stock In Details</CardTitle>
        <CardDescription>Review the details of this stock in request</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-2">
          <div className="font-medium">Product: {stockInData.product?.name}</div>
          <div className="text-sm text-gray-500">Total Boxes: {stockInData.boxes}</div>
          <div className="text-sm text-gray-500">
            Submitted By: {stockInData.submitter ? `${stockInData.submitter.name} (${stockInData.submitter.username})` : 'Unknown'}
          </div>
          <div className="text-sm text-gray-500">
            Source: {stockInData.source}
          </div>
          {stockInData.notes && (
            <div className="text-sm text-gray-500">
              Notes: {stockInData.notes}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
