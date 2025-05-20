
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export interface BatchDetailsViewProps {
  batchData: {
    id: string;
    stockId?: string;
    productId?: string;
    productName: string;
    productSku?: string;
    status: string;
    totalBoxes: number;
    totalQuantity: number;
    processedBy: string;
    source: string;
    notes?: string;
    warehouseName: string;
    locationDetails: string;
    createdAt: string | Date;
    progress?: {
      percentage: number;
      status: string;
    };
  };
}

export const BatchDetailsView: React.FC<BatchDetailsViewProps> = ({ batchData }) => {
  // Format the date for display
  const formattedDate = typeof batchData.createdAt === 'string' 
    ? new Date(batchData.createdAt).toLocaleDateString() 
    : batchData.createdAt.toLocaleDateString();

  // Get appropriate status badge color
  const getBadgeVariant = (status: string): "default" | "destructive" | "outline" | "secondary" | "success" => {
    switch (status.toLowerCase()) {
      case 'completed':
        return 'success';
      case 'processing':
        return 'secondary';
      case 'failed':
        return 'destructive';
      case 'cancelled':
        return 'outline';
      default:
        return 'default';
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="pb-2">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <CardTitle className="text-xl font-bold mb-1">
                Batch #{batchData.id.substring(0, 8).toUpperCase()}
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Created on {formattedDate}
              </p>
            </div>
            <Badge variant={getBadgeVariant(batchData.status)} className="capitalize">
              {batchData.status}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
            <div>
              <h3 className="text-sm font-medium text-muted-foreground">Product</h3>
              <p className="text-base">{batchData.productName}</p>
              {batchData.productSku && (
                <p className="text-xs text-muted-foreground">SKU: {batchData.productSku}</p>
              )}
            </div>

            <div>
              <h3 className="text-sm font-medium text-muted-foreground">Total Items</h3>
              <p className="text-base">{batchData.totalQuantity} items in {batchData.totalBoxes} boxes</p>
            </div>

            <div>
              <h3 className="text-sm font-medium text-muted-foreground">Location</h3>
              <p className="text-base">{batchData.warehouseName}</p>
              <p className="text-xs text-muted-foreground">{batchData.locationDetails}</p>
            </div>

            <div>
              <h3 className="text-sm font-medium text-muted-foreground">Processed By</h3>
              <p className="text-base">{batchData.processedBy}</p>
            </div>

            {batchData.source && (
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">Source</h3>
                <p className="text-base">{batchData.source}</p>
              </div>
            )}

            {batchData.stockId && (
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">Stock In Reference</h3>
                <p className="text-base">#{batchData.stockId.substring(0, 8).toUpperCase()}</p>
              </div>
            )}
          </div>

          {batchData.notes && (
            <div className="mt-6">
              <h3 className="text-sm font-medium text-muted-foreground mb-1">Notes</h3>
              <p className="text-sm p-3 bg-muted rounded-md">{batchData.notes}</p>
            </div>
          )}

          {batchData.progress && (
            <div className="mt-6">
              <h3 className="text-sm font-medium text-muted-foreground mb-1">Processing Progress</h3>
              <div className="w-full bg-gray-200 rounded-full h-2.5 mb-1">
                <div 
                  className="bg-blue-600 h-2.5 rounded-full" 
                  style={{ width: `${batchData.progress.percentage}%` }}
                ></div>
              </div>
              <p className="text-xs text-right text-muted-foreground">
                {batchData.progress.percentage}% - {batchData.progress.status}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default BatchDetailsView;
