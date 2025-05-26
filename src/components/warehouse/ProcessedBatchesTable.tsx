
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
import { useProcessedBatches } from '@/hooks/useProcessedBatches';
import { ProcessedBatchWithItems } from '@/hooks/useProcessedBatchesWithItems';

export interface ProcessedBatchesTableProps {
  filters?: Record<string, any>;
  onViewDetails?: (batchId: string) => void;
  onPrintBarcodes?: (batchId: string) => void;
  page?: number;
  pageSize?: number;
  onPageChange?: (page: number) => void;
  // New props to match what pages are passing
  batches?: ProcessedBatchWithItems[];
  isLoading?: boolean;
  error?: Error | null;
  currentPage?: number;
  totalPages?: number;
  searchTerm?: string;
  onSearchChange?: (term: string) => void;
  statusFilter?: string;
  onStatusChange?: (status: string) => void;
  warehouseFilter?: string;
  onWarehouseChange?: (warehouse: string) => void;
}

export const ProcessedBatchesTable: React.FC<ProcessedBatchesTableProps> = ({ 
  filters = {},
  onViewDetails,
  onPrintBarcodes,
  page = 1,
  pageSize = 10,
  onPageChange,
  // Use the passed props if available, otherwise fetch data
  batches: passedBatches,
  isLoading: passedIsLoading,
  error: passedError,
  currentPage,
  totalPages,
  searchTerm,
  onSearchChange,
  statusFilter,
  onStatusChange,
  warehouseFilter,
  onWarehouseChange
}) => {
  const navigate = useNavigate();
  
  // Only use the hook if batches aren't passed as props
  const shouldFetchData = !passedBatches;
  
  // Conditionally call the hook based on whether we need to fetch data
  const hookResult = shouldFetchData 
    ? useProcessedBatches(page, pageSize, filters)
    : { data: null, isLoading: false, isError: false, error: null, refetch: () => {} };
  
  const { 
    data, 
    isLoading: hookIsLoading, 
    isError, 
    error: hookError,
    refetch
  } = hookResult;

  // Use passed props or hook data
  const batches = passedBatches || data?.data || [];
  const isLoading = passedIsLoading ?? hookIsLoading;
  const error = passedError || (isError ? hookError : null);
  const totalCount = data?.count || 0;
  const calculatedTotalPages = totalPages || Math.ceil(totalCount / pageSize);
  
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

  // Add refresh button
  const handleRefresh = () => {
    if (refetch) {
      refetch();
    }
  };
  
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-40">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="bg-red-50 p-4 rounded">
        <p className="text-red-500">{error instanceof Error ? error.message : 'An error occurred while fetching data'}</p>
        <Button onClick={handleRefresh} variant="outline" className="mt-2">
          Try Again
        </Button>
      </div>
    );
  }
  
  if (!batches || batches.length === 0) {
    return (
      <div className="text-center p-8 border rounded bg-gray-50">
        <p className="text-gray-500">No processed batches found</p>
        <Button onClick={handleRefresh} variant="outline" className="mt-2">
          Refresh Data
        </Button>
      </div>
    );
  }
  
  return (
    <div className="space-y-4">
      <div className="flex justify-end mb-4">
        <Button onClick={handleRefresh} variant="outline" size="sm">
          Refresh Data
        </Button>
      </div>
      
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Batch ID</TableHead>
              <TableHead>Product</TableHead>
              <TableHead>Quantity</TableHead>
              <TableHead>Boxes</TableHead>
              <TableHead>Processor</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Processed Date</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {batches.map((batch) => (
              <TableRow key={batch.id}>
                <TableCell className="font-medium">{batch.id.slice(0, 8)}</TableCell>
                <TableCell>
                  <div>
                    <div className="font-medium">{batch.product?.name || 'Unknown Product'}</div>
                    <div className="text-sm text-muted-foreground">SKU: {batch.product?.sku || 'N/A'}</div>
                  </div>
                </TableCell>
                <TableCell>{batch.totalQuantity}</TableCell>
                <TableCell>{batch.totalBoxes}</TableCell>
                <TableCell>{batch.processorName || 'Unknown'}</TableCell>
                <TableCell>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    batch.status === 'completed' ? 'bg-green-100 text-green-800' :
                    batch.status === 'processing' ? 'bg-blue-100 text-blue-800' :
                    batch.status === 'failed' ? 'bg-red-100 text-red-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {batch.status}
                  </span>
                </TableCell>
                <TableCell>
                  {batch.created_at ? format(new Date(batch.created_at), 'MMM d, yyyy h:mm a') : 'N/A'}
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
      
      {/* Pagination Controls */}
      {calculatedTotalPages > 1 && (
        <div className="flex justify-center items-center gap-2 py-4">
          <Button 
            size="sm" 
            variant="outline" 
            onClick={() => onPageChange && onPageChange((currentPage || page) - 1)} 
            disabled={(currentPage || page) === 1}
          >
            Previous
          </Button>
          <span>Page {currentPage || page} of {calculatedTotalPages}</span>
          <Button 
            size="sm" 
            variant="outline" 
            onClick={() => onPageChange && onPageChange((currentPage || page) + 1)} 
            disabled={(currentPage || page) === calculatedTotalPages}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
};

export default ProcessedBatchesTable;
