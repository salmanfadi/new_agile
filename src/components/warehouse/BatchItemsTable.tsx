
import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';

export interface BatchItemDisplay {
  id: string;
  batch_id: string;
  barcode: string;
  quantity: number;
  color: string | null;
  size: string | null;
  warehouse_id: string;
  location_id: string;
  status: string;
  created_at: string;
  updated_at?: string;
  // Computed properties for display
  warehouseName?: string;
  locationDetails?: string;
  warehouse?: { name: string };
  location?: { floor: string; zone: string };
}

interface BatchItemsTableProps {
  items: BatchItemDisplay[];
  isLoading?: boolean;
}

export const BatchItemsTable: React.FC<BatchItemsTableProps> = ({ items, isLoading }) => {
  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!items || items.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        No batch items found
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Barcode</TableHead>
          <TableHead>Quantity</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Attributes</TableHead>
          <TableHead>Location</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {items.map(item => (
          <TableRow key={item.id}>
            <TableCell className="font-mono text-xs">{item.barcode}</TableCell>
            <TableCell>{item.quantity}</TableCell>
            <TableCell>
              <Badge className={
                item.status === 'available' ? 'bg-green-500' :
                item.status === 'reserved' ? 'bg-blue-500' :
                item.status === 'sold' ? 'bg-purple-500' :
                item.status === 'damaged' ? 'bg-red-500' : ''
              }>
                {item.status}
              </Badge>
            </TableCell>
            <TableCell>
              {(item.color || item.size) ? (
                <div className="flex flex-wrap gap-1">
                  {item.color && <Badge variant="outline" className="text-xs">{item.color}</Badge>}
                  {item.size && <Badge variant="outline" className="text-xs">{item.size}</Badge>}
                </div>
              ) : '—'}
            </TableCell>
            <TableCell>
              <div>
                <div className="text-xs font-medium">
                  {item.warehouse?.name || item.warehouseName || 'Unknown Warehouse'}
                </div>
                <div className="text-xs text-muted-foreground">
                  {item.location ? `Floor ${item.location.floor} - Zone ${item.location.zone}` : 
                   item.locationDetails || 'Unknown Location'}
                </div>
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};

export default BatchItemsTable;
