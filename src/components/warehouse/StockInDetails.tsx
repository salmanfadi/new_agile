
import React from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { StockInData } from '@/hooks/useStockInBoxes';
import { Badge } from '@/components/ui/badge';
import { AtSign, User } from 'lucide-react';

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
          
          <div className="text-sm">
            <span className="font-medium">User:</span>
            {stockInData.submitter ? (
              <div className="ml-2 mt-1 p-2 bg-slate-50 rounded-md border border-slate-100">
                <div className="font-medium flex items-center">
                  <User className="h-4 w-4 mr-1 text-slate-500" />
                  {stockInData.submitter.name}
                </div>
                <div className="text-sm text-blue-600 flex items-center mt-1">
                  <AtSign className="h-3 w-3 mr-1" />
                  {stockInData.submitter.username}
                </div>
              </div>
            ) : (
              <span className="ml-2 text-amber-500">Unknown</span>
            )}
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
