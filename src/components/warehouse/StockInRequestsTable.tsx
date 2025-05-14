
import React, { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/ui/StatusBadge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { StockInRequestData } from '@/hooks/useStockInRequests';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { RefreshCw, CheckCircle2, XCircle } from 'lucide-react';

interface StockInRequestsTableProps {
  stockInRequests: StockInRequestData[];
  isLoading: boolean;
  onProcess: (stockIn: StockInRequestData) => void;
  onQuickProcess?: (stockIn: StockInRequestData) => void; // Added for quick processing
  onReject: (stockIn: StockInRequestData) => void;
  userId: string | undefined;
  onRefresh?: () => void; // Added callback for manual refresh
}

export const StockInRequestsTable: React.FC<StockInRequestsTableProps> = ({
  stockInRequests,
  isLoading,
  onProcess,
  onQuickProcess,
  onReject,
  userId,
  onRefresh,
}) => {
  const queryClient = useQueryClient();

  // Force refetch data if needed
  const refreshData = () => {
    console.log("Manually refreshing stock-in requests data");
    queryClient.invalidateQueries({ queryKey: ['stock-in-requests'] });
    if (onRefresh) onRefresh();
    toast({
      title: 'Refreshing data...',
      description: 'Updating stock-in requests list'
    });
  };

  // Setup Supabase real-time subscription on component mount with improved error handling
  useEffect(() => {
    console.log("Setting up real-time subscription for stock_in table");
    let channel;
    
    try {
      channel = supabase
        .channel('stock_in_table_changes')
        .on('postgres_changes', 
          { event: '*', schema: 'public', table: 'stock_in' }, 
          (payload) => {
            console.log('Real-time update received for stock-in table:', payload);
            
            // Show toast based on status updates
            if (payload.eventType === 'UPDATE' && payload.new && payload.old) {
              const oldStatus = payload.old.status;
              const newStatus = payload.new.status;
              
              if (oldStatus !== newStatus) {
                let message = '';
                let title = '';
                
                switch (newStatus) {
                  case 'completed':
                    title = 'Stock In Completed';
                    message = 'A stock in request has been fully processed';
                    break;
                  case 'processing':
                    title = 'Stock In Processing';
                    message = 'A stock in request is being processed';
                    break;
                  case 'approved':
                    title = 'Stock In Approved';
                    message = 'A stock in request has been approved';
                    break;
                  case 'rejected':
                    title = 'Stock In Rejected';
                    message = 'A stock in request has been rejected';
                    break;
                }
                
                if (message) {
                  toast({
                    title,
                    description: message,
                  });
                }
              }
            }
            
            // Always invalidate the query to refresh data
            queryClient.invalidateQueries({ queryKey: ['stock-in-requests'] });
          }
        )
        .subscribe((status) => {
          console.log("Supabase channel status:", status);
          if (status !== 'SUBSCRIBED') {
            console.warn("Failed to subscribe to real-time updates:", status);
          }
        });
    } catch (err) {
      console.error("Error setting up real-time subscription:", err);
    }

    return () => {
      console.log('Unsubscribing from stock-in table changes');
      if (channel) supabase.removeChannel(channel);
    };
  }, [queryClient]);

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
      </div>
    );
  }
  
  if (!stockInRequests || stockInRequests.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <p>No pending stock in requests</p>
        <Button 
          variant="outline" 
          size="sm"
          className="mt-4" 
          onClick={refreshData}
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh Data
        </Button>
      </div>
    );
  }
  
  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button 
          variant="outline" 
          size="sm" 
          onClick={refreshData}
          className="text-xs flex items-center gap-1"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          Refresh
        </Button>
      </div>

      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Product</TableHead>
              <TableHead>User</TableHead>
              <TableHead>Source</TableHead>
              <TableHead>Boxes</TableHead>
              <TableHead>Submission Date</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {stockInRequests.map((stockIn) => (
              <TableRow key={stockIn.id} className={stockIn.status === 'pending' ? "bg-green-50" : undefined}>
                <TableCell className="font-medium">
                  {stockIn.product?.name || 'Unknown Product'}
                  {stockIn.product?.sku && <span className="block text-xs text-slate-500">SKU: {stockIn.product.sku}</span>}
                </TableCell>
                <TableCell>
                  {stockIn.submitter ? (
                    <div className="flex flex-col">
                      <span className="font-medium">{stockIn.submitter.name}</span>
                      <span className="text-sm text-gray-600">@{stockIn.submitter.username}</span>
                    </div>
                  ) : (
                    <span className="text-amber-500">Unknown User</span>
                  )}
                </TableCell>
                <TableCell>{stockIn.source}</TableCell>
                <TableCell>{stockIn.boxes}</TableCell>
                <TableCell>{new Date(stockIn.created_at).toLocaleString()}</TableCell>
                <TableCell>
                  <StatusBadge status={stockIn.status} />
                </TableCell>
                <TableCell className="text-right space-x-2">
                  {stockIn.status === 'pending' && (
                    <>
                      <Button 
                        size="sm" 
                        variant="default"
                        onClick={() => {
                          console.log(`Processing stock in with ID: ${stockIn.id}`);
                          onProcess(stockIn);
                        }}
                        className="relative overflow-hidden transition-all hover:shadow-lg hover:shadow-blue-200 group"
                      >
                        <span className="absolute right-0 top-0 h-full w-8 translate-x-12 transform bg-blue-600 opacity-10 transition-all duration-1000 group-hover:-translate-x-40"></span>
                        Batch Process
                      </Button>
                      
                      {onQuickProcess && (
                        <Button 
                          size="sm"
                          variant="outline"
                          onClick={() => onQuickProcess(stockIn)}
                          className="text-green-600 border-green-200 hover:bg-green-50"
                        >
                          <CheckCircle2 className="h-4 w-4 mr-1" />
                          Quick Process
                        </Button>
                      )}
                      
                      <Button 
                        size="sm" 
                        variant="outline"
                        className="text-red-600"
                        onClick={() => onReject(stockIn)}
                      >
                        <XCircle className="h-4 w-4 mr-1" />
                        Reject
                      </Button>
                    </>
                  )}
                  {stockIn.status === 'rejected' && stockIn.rejection_reason && (
                    <div className="text-xs text-red-600">
                      Reason: {stockIn.rejection_reason}
                    </div>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};
