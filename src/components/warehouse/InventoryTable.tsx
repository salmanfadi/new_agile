
import React, { useRef, useEffect } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { InventoryItem } from '@/hooks/useInventoryData';
import { Badge } from '@/components/ui/badge';

interface InventoryTableProps {
  inventoryItems: InventoryItem[];
  isLoading: boolean;
  error: Error | null;
  highlightedBarcode: string | null;
}

export const InventoryTable: React.FC<InventoryTableProps> = ({
  inventoryItems,
  isLoading,
  error,
  highlightedBarcode,
}) => {
  const highlightedRowRef = useRef<HTMLTableRowElement>(null);

  useEffect(() => {
    // Scroll to highlighted row when it changes
    if (highlightedRowRef.current) {
      highlightedRowRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      });
    }
  }, [highlightedBarcode]);

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
        <div className="ml-2">Loading inventory data...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8 text-red-500">
        Error loading inventory data: {error.message}
      </div>
    );
  }

  if (inventoryItems.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        No inventory items found
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Product</TableHead>
            <TableHead>Barcode</TableHead>
            <TableHead>Quantity</TableHead>
            <TableHead>Warehouse</TableHead>
            <TableHead>Location</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Color</TableHead>
            <TableHead>Size</TableHead>
            <TableHead>Batch ID</TableHead>
            <TableHead className="text-right">Last Updated</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {inventoryItems.map((item) => (
            <TableRow 
              key={item.id}
              ref={item.barcode === highlightedBarcode ? highlightedRowRef : null}
              className={item.barcode === highlightedBarcode ? "bg-blue-50 dark:bg-blue-900/20" : ""}
            >
              <TableCell className="font-medium">{item.productName}</TableCell>
              <TableCell>
                {item.barcode === highlightedBarcode ? (
                  <Badge variant="default" className="bg-blue-600 hover:bg-blue-700">
                    {item.barcode}
                  </Badge>
                ) : (
                  item.barcode
                )}
              </TableCell>
              <TableCell>{item.quantity}</TableCell>
              <TableCell>{item.warehouseName}</TableCell>
              <TableCell>{item.locationDetails}</TableCell>
              <TableCell><StatusBadge status={item.status} /></TableCell>
              <TableCell>{item.color || '-'}</TableCell>
              <TableCell>{item.size || '-'}</TableCell>
              <TableCell>
                {item.batchId ? (
                  <span className="text-xs font-mono bg-slate-100 px-2 py-1 rounded">
                    {item.batchId.substring(0, 8)}...
                  </span>
                ) : (
                  '-'
                )}
              </TableCell>
              <TableCell className="text-right">{item.lastUpdated}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};
