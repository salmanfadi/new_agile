import React from 'react';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import type { ReservedItem } from '@/types/reserve-stock';

interface ReserveStockDetailsProps {
  item: ReservedItem;
  onPushToStockOut: (id: string) => void;
  onCancel: (id: string) => void;
}

export const ReserveStockDetails: React.FC<ReserveStockDetailsProps> = ({
  item,
  onPushToStockOut,
  onCancel,
}) => {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <h4 className="font-medium text-sm">Product</h4>
          <p>{item.product.name}</p>
          {item.product.sku && (
            <p className="text-sm text-muted-foreground">SKU: {item.product.sku}</p>
          )}
        </div>
        <div>
          <h4 className="font-medium text-sm">Quantity</h4>
          <p>{item.quantity}</p>
        </div>
        <div>
          <h4 className="font-medium text-sm">Customer</h4>
          <p>{item.customer}</p>
        </div>
        <div>
          <h4 className="font-medium text-sm">Status</h4>
          <p>{item.status}</p>
        </div>
        <div>
          <h4 className="font-medium text-sm">Start Date</h4>
          <p>{format(new Date(item.startDate), 'MMM d, yyyy')}</p>
        </div>
        <div>
          <h4 className="font-medium text-sm">End Date</h4>
          <p>{format(new Date(item.endDate), 'MMM d, yyyy')}</p>
        </div>
      </div>

      {item.status === 'Active' && (
        <div className="flex justify-end gap-2">
          <Button
            variant="outline"
            onClick={() => onPushToStockOut(item.id)}
          >
            Push to Stock Out
          </Button>
          <Button
            variant="destructive"
            onClick={() => onCancel(item.id)}
          >
            Cancel Reservation
          </Button>
        </div>
      )}
    </div>
  );
}; 