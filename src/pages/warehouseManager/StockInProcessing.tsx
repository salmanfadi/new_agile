
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '@/components/ui/PageHeader';
import { Button } from '@/components/ui/button';
import { ArrowLeft, RefreshCw } from 'lucide-react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { useAuth } from '@/context/AuthContext';
import { StockInRequestsTable } from '@/components/warehouse/StockInRequestsTable';
import { RejectStockInDialog } from '@/components/warehouse/RejectStockInDialog';
import { ProcessStockInDialog } from '@/components/warehouse/ProcessStockInDialog'; 
import { useStockInRequests, StockInRequestData } from '@/hooks/useStockInRequests';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { RealtimeChannel } from '@supabase/supabase-js';

const StockInProcessing: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  const [selectedStockIn, setSelectedStockIn] = useState<StockInRequestData | null>(null);
  const [isRejectDialogOpen, setIsRejectDialogOpen] = useState(false);
  const [isProcessDialogOpen, setIsProcessDialogOpen] = useState(false);

  // Fetch stock in requests with improved query to get submitter name
  const { 
    data: stockInRequests, 
    isLoading, 
    error, 
    refetch 
  } = useStockInRequests('pending');

  // Force refresh when component mounts
  useEffect(() => {
    console.log("StockInProcessing component mounted, refreshing data");
    queryClient.invalidateQueries({ queryKey: ['stock-in-requests'] });
  }, [queryClient]);

  // Setup Supabase real-time subscription for completed batch processing
  useEffect(() => {
    console.log("Setting up batch processing status subscription");
    
    // Subscribe to stock-in status changes
    const channel: RealtimeChannel = supabase
      .channel('stock-in-status-changes')
      .on(
        'postgres_changes', 
        { event: '*', schema: 'public', table: 'stock_in' }, 
        (payload) => {
          console.log('Stock-in status changed:', payload);
          
          // Immediately refetch the data when stock-in status changes
          queryClient.invalidateQueries({ queryKey: ['stock-in-requests'] });
          
          // Show toast notification for completed processing
          if (payload.new && payload.new.status === 'completed') {
            toast({
              title: 'Stock In Completed',
              description: 'A stock in request has been processed and completed',
            });
          }
        }
      )
      .subscribe((response) => {
        if (response) {
          console.log("Subscription response received:", response);
          // Type-safe access of status property
          if (typeof response === 'object' && response !== null && 'status' in response) {
            console.log("Subscription status:", response.status);
          }
        }
      });

    // Subscribe to processed batches
    const batchesChannel: RealtimeChannel = supabase
      .channel('processed-batches-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'processed_batches' },
        (payload) => {
          console.log('Processed batch change detected:', payload);
          
          // Invalidate the processed batches data
          queryClient.invalidateQueries({ queryKey: ['processed-batches'] });
          
          if (payload.eventType === 'INSERT') {
            toast({
              title: 'New Batch Processed',
              description: 'A new batch has been successfully processed',
            });
          }
        }
      )
      .subscribe();

    // Clean up the subscriptions when component unmounts
    return () => {
      console.log("Cleaning up stock-in status subscription");
      supabase.removeChannel(channel);
      supabase.removeChannel(batchesChannel);
    };
  }, [queryClient]);

  // Navigate to batch processing page with the stock in ID
  const handleProcess = (stockIn: StockInRequestData) => {
    console.log("Navigating to batch processing for stock in:", stockIn.id);
    navigate(`/manager/stock-in/batch/${stockIn.id}`);
  };

  // Open dialog for immediate processing
  const handleQuickProcess = (stockIn: StockInRequestData) => {
    console.log("Opening quick process dialog for stock in:", stockIn.id);
    setSelectedStockIn(stockIn);
    setIsProcessDialogOpen(true);
  };

  const handleReject = (stockIn: StockInRequestData) => {
    setSelectedStockIn(stockIn);
    setIsRejectDialogOpen(true);
  };
  
  const handleManualRefresh = () => {
    console.log("Manual refresh requested");
    toast({
      title: "Refreshing data",
      description: "Getting the latest stock in requests..."
    });
    queryClient.invalidateQueries({ queryKey: ['stock-in-requests'] });
    refetch();
  };

  return (
    <div className="space-y-6 p-6">
      <PageHeader 
        title="Stock In Processing" 
        description="Process incoming stock requests"
      />
      
      <Button
        variant="ghost"
        size="sm"
        onClick={() => navigate('/manager')}
        className="mb-4"
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Dashboard
      </Button>
      
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-medium">Pending Requests</h2>
        <Button 
          variant="outline" 
          size="sm"
          onClick={handleManualRefresh}
          className="flex items-center gap-2"
        >
          <RefreshCw className="h-4 w-4" />
          Refresh
        </Button>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Stock In Requests</CardTitle>
          <CardDescription>Review and process incoming stock requests</CardDescription>
        </CardHeader>
        <CardContent>
          {error ? (
            <div className="p-4 text-red-500">
              Error loading stock in requests. Please try again.
            </div>
          ) : (
            <StockInRequestsTable 
              stockInRequests={stockInRequests || []}
              isLoading={isLoading}
              onProcess={handleProcess}
              onQuickProcess={handleQuickProcess}
              onReject={handleReject}
              userId={user?.id}
              onRefresh={handleManualRefresh}
            />
          )}
        </CardContent>
      </Card>

      {/* Rejection Dialog */}
      <RejectStockInDialog
        open={isRejectDialogOpen}
        onOpenChange={setIsRejectDialogOpen}
        selectedStockIn={selectedStockIn}
        userId={user?.id}
      />
      
      {/* Process Dialog for quick processing */}
      <ProcessStockInDialog 
        open={isProcessDialogOpen}
        onOpenChange={setIsProcessDialogOpen}
        selectedStockIn={selectedStockIn}
        userId={user?.id}
      />
    </div>
  );
};

export default StockInProcessing;
