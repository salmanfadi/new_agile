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
}

export const ProcessedBatchesTable: React.FC<ProcessedBatchesTableProps> = ({ filters }) => {
  const navigate = useNavigate();
  const pageSize = 10; // Define pageSize here
  const { data: processedBatches, isLoading, error } = useProcessedBatches(1, pageSize, filters);

  if (isLoading) {
    return <Card>Loading processed batches...</Card>;
  }

  if (error) {
    return <Card>Error: {error.message}</Card>;
  }

  const handleViewDetails = (batchId: string) => {
    navigate(`/manager/inventory/barcodes/${batchId}`);
  };

  return (
    <Card>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Batch ID</TableHead>
            <TableHead>Product</TableHead>
            <TableHead>Warehouse</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Processed At</TableHead>
            <TableHead>Total Boxes</TableHead>
            <TableHead>Total Quantity</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {processedBatches?.map((batch: ProcessedBatchType) => (
            <TableRow key={batch.id}>
              <TableCell>{batch.id}</TableCell>
              <TableCell>{batch.product?.name}</TableCell>
              <TableCell>{batch.warehouse?.name}</TableCell>
              <TableCell>
                <Badge variant="secondary">{batch.status}</Badge>
              </TableCell>
              <TableCell>{format(new Date(batch.processed_at), 'MMM d, yyyy h:mm a')}</TableCell>
              <TableCell>{batch.total_boxes}</TableCell>
              <TableCell>{batch.total_quantity}</TableCell>
              <TableCell>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleViewDetails(batch.id)}
                >
                  <Eye className="h-4 w-4 mr-2" />
                  View Details
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Card>
  );
};
