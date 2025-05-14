
import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Eye } from 'lucide-react';
import { 
  useProcessedBatches, 
  ProcessedBatchType
} from '@/hooks/useProcessedBatches';
import { format } from 'date-fns';

interface ProcessedBatchesTableProps {
  filters: Record<string, any>;
  isAdmin?: boolean;
}

export const ProcessedBatchesTable: React.FC<ProcessedBatchesTableProps> = ({ 
  filters,
  isAdmin = false 
}) => {
  const navigate = useNavigate();
  const pageSize = 10; // Define pageSize here
  const { data: processedBatches, isLoading, error } = useProcessedBatches(1, pageSize, filters);

  if (isLoading) {
    return (
      <Card className="p-8 text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-2 text-gray-500">Loading processed batches...</p>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="p-8 text-center bg-red-50">
        <p className="text-red-600">Error loading processed batches</p>
        <p className="text-sm text-red-500 mt-2">{error.message}</p>
      </Card>
    );
  }

  if (!processedBatches || processedBatches.length === 0) {
    return (
      <Card className="p-8 text-center">
        <p className="text-gray-500">No processed batches found.</p>
      </Card>
    );
  }

  const handleViewDetails = (batchId: string) => {
    const basePath = isAdmin ? '/admin' : '/manager';
    navigate(`${basePath}/inventory/barcodes/${batchId}`);
  };

  return (
    <div className="rounded-md border overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[100px]">Batch ID</TableHead>
            <TableHead>Product</TableHead>
            <TableHead>Warehouse</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Processed At</TableHead>
            <TableHead className="text-right">Total</TableHead>
            <TableHead className="text-center">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {processedBatches.map((batch: ProcessedBatchType) => (
            <TableRow key={batch.id}>
              <TableCell className="font-mono text-xs">{batch.id.slice(0, 8)}</TableCell>
              <TableCell>{batch.product?.name}</TableCell>
              <TableCell>{batch.warehouse?.name}</TableCell>
              <TableCell>
                <Badge variant="secondary">{batch.status}</Badge>
              </TableCell>
              <TableCell>{format(new Date(batch.processed_at), 'MMM d, yyyy h:mm a')}</TableCell>
              <TableCell className="text-right">
                <div>
                  <div>{batch.total_quantity} items</div>
                  <div className="text-xs text-gray-500">{batch.total_boxes} boxes</div>
                </div>
              </TableCell>
              <TableCell>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleViewDetails(batch.id)}
                  className="w-full"
                >
                  <Eye className="h-4 w-4 mr-2" />
                  View Barcodes
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};
