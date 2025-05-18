
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { useQueryClient } from '@tanstack/react-query';
import { 
  TableHeader, 
  TableRow, 
  TableHead, 
  TableBody, 
  TableCell, 
  Table 
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Box, AlertTriangle } from 'lucide-react';
import { useStockInRequests, StockInRequestData } from '@/hooks/useStockInRequests';
import { StatusBadge } from '@/components/ui/status-badge';
import ProcessStockInForm from './ProcessStockInForm';
import { useToast } from '@/hooks/use-toast';

interface StockInRequestsTableProps {
  status?: string;
  filters?: Record<string, any>;
  onReject?: (stockIn: StockInRequestData) => void;
  userId?: string;
  adminMode?: boolean;
}

export const StockInRequestsTable: React.FC<StockInRequestsTableProps> = ({
  status = '',
  filters = {},
  onReject,
  userId,
  adminMode = false,
}) => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  // State for the process form dialog
  const [selectedStockIn, setSelectedStockIn] = useState<StockInRequestData | null>(null);
  const [isProcessFormOpen, setIsProcessFormOpen] = useState(false);
  
  // Use the shared hook for stock in requests
  const { 
    data: stockInRequests, 
    isLoading, 
    error,
    refetch 
  } = useStockInRequests({
    status: status || undefined,
    ...filters
  });
  
  // Handle process button click - Open the form dialog
  const handleProcess = (stockIn: StockInRequestData) => {
    console.log("Opening process form for stock in with ID:", stockIn.id);
    
    // Validate that userId is available
    if (!userId) {
      console.error("User ID is missing when trying to process stock in");
      toast({
        title: "Authentication error",
        description: "Unable to identify the current user. Please try logging in again.",
        variant: "destructive"
      });
      return;
    }
    
    setSelectedStockIn(stockIn);
    setIsProcessFormOpen(true);
  };
  
  // Log when the dialog opens/closes
  useEffect(() => {
    console.log("Process dialog state changed:", { 
      isOpen: isProcessFormOpen, 
      selectedStockIn: selectedStockIn?.id
    });
  }, [isProcessFormOpen, selectedStockIn]);
  
  // Handle continue processing for requests that are already in processing status
  const handleContinueProcessing = (stockIn: StockInRequestData) => {
    console.log("Continuing processing with ID:", stockIn.id);
    // Redirect to the unified batch processing page with the correct route based on user role
    const baseUrl = adminMode ? 
      '/admin/stock-in/unified/' : 
      '/manager/stock-in/unified/';
    
    navigate(`${baseUrl}${stockIn.id}`);
  };

  const handleReject = (stockIn: StockInRequestData) => {
    console.log("Rejecting stock in with ID:", stockIn.id);
    if (onReject) {
      onReject(stockIn);
    }
  };
  
  if (isLoading) {
    return (
      <div className="w-full py-10 flex justify-center">
        <div className="animate-pulse flex space-x-4">
          <div className="flex-1 space-y-4 py-1">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="space-y-2">
              <div className="h-4 bg-gray-200 rounded"></div>
              <div className="h-4 bg-gray-200 rounded w-5/6"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="w-full py-10 text-center">
        <AlertTriangle className="mx-auto h-8 w-8 text-red-500 mb-2" />
        <p className="text-lg font-medium">Error loading stock in requests</p>
        <Button onClick={() => refetch()} className="mt-4">Try Again</Button>
      </div>
    );
  }
  
  if (!stockInRequests || stockInRequests.length === 0) {
    return (
      <div className="w-full py-10 text-center border rounded-md bg-gray-50">
        <Box className="mx-auto h-8 w-8 text-gray-400 mb-2" />
        <p className="text-lg font-medium text-gray-600">No stock in requests found</p>
        <p className="text-gray-500 mt-1">
          {status ? `No ${status} requests available.` : 'Try adjusting your filters.'}
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Status</TableHead>
              <TableHead>Product</TableHead>
              <TableHead>Boxes</TableHead>
              <TableHead>Submitted By</TableHead>
              <TableHead>Source</TableHead>
              <TableHead>Date</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {stockInRequests.map((item) => (
              <TableRow key={item.id}>
                <TableCell>
                  <StatusBadge status={item.status} />
                </TableCell>
                <TableCell>
                  <div className="font-medium">{item.product?.name || 'Unknown Product'}</div>
                  <div className="text-xs text-gray-500">
                    {item.product?.sku && `SKU: ${item.product.sku}`}
                  </div>
                </TableCell>
                <TableCell>{item.boxes}</TableCell>
                <TableCell>
                  {item.submitter ? (
                    <div>
                      <div>{item.submitter.name}</div>
                      <div className="text-xs text-gray-500">{item.submitter.username}</div>
                    </div>
                  ) : (
                    'Unknown'
                  )}
                </TableCell>
                <TableCell>{item.source}</TableCell>
                <TableCell>
                  {item.created_at ? (
                    format(new Date(item.created_at), 'MMM d, yyyy')
                  ) : (
                    'Unknown date'
                  )}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    {item.status === 'pending' && (
                      <Button 
                        variant="default"
                        size="sm"
                        onClick={() => handleProcess(item)}
                      >
                        <Box className="mr-1 h-4 w-4" />
                        Process
                      </Button>
                    )}
                    
                    {item.status === 'processing' && (
                      <Button
                        variant="default"
                        size="sm"
                        onClick={() => handleContinueProcessing(item)}
                      >
                        Continue Processing
                      </Button>
                    )}
                    
                    {item.status === 'pending' && onReject && (
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => handleReject(item)}
                      >
                        Reject
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Process Stock In Form Dialog */}
      <ProcessStockInForm
        open={isProcessFormOpen}
        onOpenChange={setIsProcessFormOpen}
        stockIn={selectedStockIn}
        userId={userId}
        adminMode={adminMode}
      />
    </>
  );
};
