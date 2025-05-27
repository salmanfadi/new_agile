import React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Printer, Eye } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';

export interface BatchItem {
  id: string;
  batch_id: string;
  barcode: string;
  quantity: number;
  color?: string;
  size?: string;
  warehouse_id: string;
  warehouseName?: string;
  location_id: string;
  locationDetails?: string;
  status: string;
  created_at: string;
}

interface BatchItemsTableProps {
  items: BatchItem[];
  isLoading?: boolean;
  error?: Error | null;
  onPrintBarcode?: (barcode: string) => void;
  onViewDetails?: (itemId: string) => void;
}

const BatchItemsTable: React.FC<BatchItemsTableProps> = ({
  items,
  isLoading = false,
  error = null,
  onPrintBarcode,
  onViewDetails,
}) => {
  if (isLoading) {
    return (
      <div className="flex justify-center items-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-md text-red-600">
        <p>Error loading batch items: {error.message}</p>
      </div>
    );
  }

  if (!items || items.length === 0) {
    return (
      <div className="p-6 text-center border rounded-md bg-gray-50">
        <p className="text-gray-500">No batch items found.</p>
      </div>
    );
  }

  // Function to get status badge color based on status
  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case 'available':
        return <Badge className="bg-green-500">Available</Badge>;
      case 'reserved':
        return <Badge className="bg-blue-500">Reserved</Badge>;
      case 'sold':
        return <Badge className="bg-purple-500">Sold</Badge>;
      case 'damaged':
        return <Badge className="bg-red-500">Damaged</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  return (
    <div className="overflow-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Barcode</TableHead>
            <TableHead>Quantity</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Attributes</TableHead>
            <TableHead>Location</TableHead>
            <TableHead>Created</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((item) => (
            <TableRow key={item.id}>
              <TableCell className="font-medium">{item.barcode}</TableCell>
              <TableCell>{item.quantity}</TableCell>
              <TableCell>{getStatusBadge(item.status)}</TableCell>
              <TableCell>
                {item.color && item.size ? (
                  <>
                    <span className="text-xs bg-gray-100 rounded-full px-2 py-1 mr-1">
                      Color: {item.color}
                    </span>
                    <span className="text-xs bg-gray-100 rounded-full px-2 py-1">
                      Size: {item.size}
                    </span>
                  </>
                ) : item.color ? (
                  <span className="text-xs bg-gray-100 rounded-full px-2 py-1">
                    Color: {item.color}
                  </span>
                ) : item.size ? (
                  <span className="text-xs bg-gray-100 rounded-full px-2 py-1">
                    Size: {item.size}
                  </span>
                ) : (
                  <span className="text-gray-400">—</span>
                )}
              </TableCell>
              <TableCell>
                {item.warehouseName} - {item.locationDetails || 'Unknown Location'}
              </TableCell>
              <TableCell>
                {format(new Date(item.created_at), 'MMM d, yyyy')}
              </TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end space-x-2">
                  {onViewDetails && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onViewDetails(item.id)}
                    >
                      <Eye className="mr-1 h-4 w-4" />
                      Details
                    </Button>
                  )}
                  {onPrintBarcode && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onPrintBarcode(item.barcode)}
                    >
                      <Printer className="mr-1 h-4 w-4" />
                      Barcode
                    </Button>
                  )}
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default BatchItemsTable;
