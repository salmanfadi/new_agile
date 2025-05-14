
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
import { Printer, Eye, Boxes } from 'lucide-react';
import { ProcessedBatchData } from '@/hooks/useProcessedBatches';

interface ProcessedBatchesTableProps {
  batches: ProcessedBatchData[];
  isLoading: boolean;
  onViewDetails: (batchId: string) => void;
  onPrintBarcodes: (batchId: string) => void;
}

export const ProcessedBatchesTable: React.FC<ProcessedBatchesTableProps> = ({
  batches,
  isLoading,
  onViewDetails,
  onPrintBarcodes
}) => {
  const navigate = useNavigate();

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!batches || batches.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <p>No processed batches found</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Batch ID</TableHead>
            <TableHead>Product</TableHead>
            <TableHead>Date Processed</TableHead>
            <TableHead>Quantity</TableHead>
            <TableHead>Boxes</TableHead>
            <TableHead>Source</TableHead>
            <TableHead>Processor</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {batches.map((batch) => (
            <TableRow key={batch.id} className="hover:bg-slate-50">
              <TableCell className="font-mono text-xs">{batch.id.substring(0, 8)}...</TableCell>
              <TableCell>
                <div>
                  <span className="font-medium">{batch.productName}</span>
                  {batch.productSku && (
                    <span className="block text-xs text-slate-500">SKU: {batch.productSku}</span>
                  )}
                </div>
              </TableCell>
              <TableCell>{new Date(batch.processed_at).toLocaleDateString()}</TableCell>
              <TableCell>{batch.total_quantity}</TableCell>
              <TableCell>{batch.total_boxes}</TableCell>
              <TableCell>{batch.source || '-'}</TableCell>
              <TableCell>{batch.processorName}</TableCell>
              <TableCell className="text-right space-x-1">
                <Button 
                  size="sm" 
                  variant="outline"
                  className="text-blue-600"
                  onClick={() => onViewDetails(batch.id)}
                >
                  <Eye className="h-4 w-4 mr-1" />
                  Details
                </Button>
                <Button 
                  size="sm" 
                  variant="outline"
                  className="text-green-600"
                  onClick={() => onPrintBarcodes(batch.id)}
                >
                  <Printer className="h-4 w-4 mr-1" />
                  Barcodes
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="text-purple-600"
                  onClick={() => navigate(`/inventory?batchId=${batch.id}`)}
                >
                  <Boxes className="h-4 w-4 mr-1" />
                  Inventory
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};
