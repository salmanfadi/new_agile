
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import BatchItemsTable, { BatchItem } from './BatchItemsTable';

interface BatchDetailViewProps {
  batch: {
    id: string;
    product?: {
      name: string;
      sku?: string;
    };
    totalBoxes: number;
    totalQuantity: number;
    status: string;
    createdAt: string;
    processorName?: string;
    warehouseName?: string;
    locationDetails?: string;
    source?: string;
    notes?: string;
  };
  items: any[];
  isLoading?: boolean;
  error?: Error | null;
  onPrintBarcode?: (barcode: string) => void;
  onViewItemDetails?: (itemId: string) => void;
}

const BatchDetailView: React.FC<BatchDetailViewProps> = ({
  batch,
  items,
  isLoading = false,
  error = null,
  onPrintBarcode,
  onViewItemDetails,
}) => {
  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
        return <Badge className="bg-green-500">Completed</Badge>;
      case 'processing':
        return <Badge className="bg-blue-500">Processing</Badge>;
      case 'failed':
        return <Badge className="bg-red-500">Failed</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  // Transform items to match BatchItem interface
  const transformedItems: BatchItem[] = items.map(item => ({
    id: item.id,
    batch_id: item.batch_id || batch.id,
    barcode: item.barcode,
    quantity: item.quantity,
    color: item.color,
    size: item.size,
    warehouse_id: item.warehouse_id,
    warehouseName: item.warehouseName,
    location_id: item.location_id,
    locationDetails: item.locationDetails,
    status: item.status,
    created_at: item.created_at || batch.createdAt || new Date().toISOString(),
  }));

  return (
    <div className="space-y-6">
      {/* Batch Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Batch Details</span>
            {getStatusBadge(batch.status)}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="font-medium text-gray-900">Product Information</h4>
              <p className="text-sm text-gray-600">
                <strong>Name:</strong> {batch.product?.name || 'Unknown Product'}
              </p>
              {batch.product?.sku && (
                <p className="text-sm text-gray-600">
                  <strong>SKU:</strong> {batch.product.sku}
                </p>
              )}
            </div>
            
            <div>
              <h4 className="font-medium text-gray-900">Batch Information</h4>
              <p className="text-sm text-gray-600">
                <strong>Total Boxes:</strong> {batch.totalBoxes}
              </p>
              <p className="text-sm text-gray-600">
                <strong>Total Quantity:</strong> {batch.totalQuantity}
              </p>
              <p className="text-sm text-gray-600">
                <strong>Created:</strong> {format(new Date(batch.createdAt), 'MMM d, yyyy h:mm a')}
              </p>
            </div>
          </div>

          {batch.processorName && (
            <div>
              <h4 className="font-medium text-gray-900">Processing Information</h4>
              <p className="text-sm text-gray-600">
                <strong>Processed by:</strong> {batch.processorName}
              </p>
            </div>
          )}

          {(batch.warehouseName || batch.locationDetails) && (
            <div>
              <h4 className="font-medium text-gray-900">Location Information</h4>
              {batch.warehouseName && (
                <p className="text-sm text-gray-600">
                  <strong>Warehouse:</strong> {batch.warehouseName}
                </p>
              )}
              {batch.locationDetails && (
                <p className="text-sm text-gray-600">
                  <strong>Location:</strong> {batch.locationDetails}
                </p>
              )}
            </div>
          )}

          {(batch.source || batch.notes) && (
            <div>
              <h4 className="font-medium text-gray-900">Additional Information</h4>
              {batch.source && (
                <p className="text-sm text-gray-600">
                  <strong>Source:</strong> {batch.source}
                </p>
              )}
              {batch.notes && (
                <p className="text-sm text-gray-600">
                  <strong>Notes:</strong> {batch.notes}
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Batch Items */}
      <Card>
        <CardHeader>
          <CardTitle>Batch Items</CardTitle>
        </CardHeader>
        <CardContent>
          <BatchItemsTable
            items={transformedItems}
            isLoading={isLoading}
            error={error}
            onPrintBarcode={onPrintBarcode}
            onViewDetails={onViewItemDetails}
          />
        </CardContent>
      </Card>
    </div>
  );
};

export default BatchDetailView;
