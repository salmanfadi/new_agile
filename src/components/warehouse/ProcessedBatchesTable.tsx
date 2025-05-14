
import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Eye, Printer } from 'lucide-react';
import { format } from 'date-fns';
import { ProcessedBatchType } from '@/hooks/useProcessedBatches';
import { useProcessedBatches } from '@/hooks/useProcessedBatches';

export interface ProcessedBatchesTableProps {
  filters?: Record<string, any>;
  onViewDetails?: (batchId: string) => void;
  onPrintBarcodes?: (batchId: string) => void;
}

export const ProcessedBatchesTable: React.FC<ProcessedBatchesTableProps> = ({ 
  filters = {},
  onViewDetails,
  onPrintBarcodes
}) => {
  const navigate = useNavigate();
  const { 
    data, 
    isLoading, 
    isError, 
    error 
  } = useProcessedBatches(1, 10, filters);
  
  // Handle batch details view
  const handleViewDetails = (batchId: string) => {
    if (onViewDetails) {
      onViewDetails(batchId);
    } else {
      navigate(`/manager/stock-in/batch/${batchId}`);
    }
  };
  
  // Handle printing barcodes
  const handlePrintBarcodes = (batchId: string) => {
    if (onPrintBarcodes) {
      onPrintBarcodes(batchId);
    } else {
      navigate(`/manager/inventory/barcodes/${batchId}`);
    }
  };
  
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-40">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }
  
  if (isError) {
    return (
      <div className="bg-red-50 p-4 rounded">
        <p className="text-red-500">{error instanceof Error ? error.message : 'An error occurred while fetching data'}</p>
      </div>
    );
  }
  
  if (!data?.data || data.data.length === 0) {
    return (
      <div className="text-center p-8 border rounded bg-gray-50">
        <p className="text-gray-500">No processed batches found</p>
      </div>
    );
  }
  
  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Batch ID</TableHead>
            <TableHead>Product</TableHead>
            <TableHead>Quantity</TableHead>
            <TableHead>Boxes</TableHead>
            <TableHead>Processed By</TableHead>
            <TableHead>Processed Date</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.data.map((batch: ProcessedBatchType) => (
            <TableRow key={batch.id}>
              <TableCell className="font-medium">{batch.id.slice(0, 8)}</TableCell>
              <TableCell>
                <div>
                  <div className="font-medium">{batch.product_name}</div>
                  <div className="text-sm text-muted-foreground">SKU: {batch.product_sku}</div>
                </div>
              </TableCell>
              <TableCell>{batch.total_quantity}</TableCell>
              <TableCell>{batch.boxes}</TableCell>
              <TableCell>{batch.processor_name}</TableCell>
              <TableCell>
                {batch.completed_at ? format(new Date(batch.completed_at), 'MMM d, yyyy h:mm a') : 'N/A'}
              </TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end space-x-2">
                  <Button 
                    variant="ghost"
                    size="sm"
                    onClick={() => handleViewDetails(batch.id)}
                  >
                    <Eye className="h-4 w-4 mr-1" />
                    Details
                  </Button>
                  <Button 
                    variant="outline"
                    size="sm"
                    onClick={() => handlePrintBarcodes(batch.id)}
                  >
                    <Printer className="h-4 w-4 mr-1" />
                    Barcodes
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default ProcessedBatchesTable;
