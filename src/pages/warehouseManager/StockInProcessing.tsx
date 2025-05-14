
import React, { useState, useEffect } from 'react';
import { PageHeader } from '@/components/ui/PageHeader';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { StockInRequestsTable } from '@/components/warehouse/StockInRequestsTable';
import { ProcessedBatchesTable } from '@/components/warehouse/ProcessedBatchesTable';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { useStockInRequests, StockInRequestData } from '@/hooks/useStockInRequests';
import { useProcessedBatches } from '@/hooks/useProcessedBatches';
import { StockInFilters } from '@/components/warehouse/StockInFilters';
import { ProcessedBatchesFilters } from '@/components/warehouse/ProcessedBatchesFilters';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { Plus, RefreshCw } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { useQueryClient } from '@tanstack/react-query';

interface StockInUpdate {
  id: string;
  status: string;
  [key: string]: any;
}

const StockInProcessing: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('pending');
  const [stockInFilters, setStockInFilters] = useState<Record<string, any>>({ status: 'pending' });
  const [processedFilters, setProcessedFilters] = useState<Record<string, any>>({});
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // Use the filters directly in the hooks
  const { refetch: refetchStockIn } = useStockInRequests(stockInFilters);
  const { refetch: refetchProcessed } = useProcessedBatches(1, 10, processedFilters);

  // Handle real-time updates for stock in requests
  useEffect(() => {
    // Create a channel for real-time updates
    const channel = supabase
      .channel('stock-in-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'stock_in'
        },
        (payload) => {
          console.log('Stock in change received:', payload);
          
          // Check if the payload has necessary data
          const newRecord = payload.new as StockInUpdate;
          
          if (newRecord && newRecord.status) {
            // Determine which query to invalidate based on the status
            if (newRecord.status === 'pending' || newRecord.status === 'processing') {
              queryClient.invalidateQueries({ queryKey: ['stock-in-requests'] });
              toast({
                title: 'Stock In Request Updated',
                description: `A stock in request has been updated to ${newRecord.status}`,
              });
            } else if (newRecord.status === 'completed') {
              queryClient.invalidateQueries({ queryKey: ['processedBatches'] });
              toast({
                title: 'Stock In Processing Complete',
                description: 'A stock in request has been processed and completed.',
              });
            }
          }
        }
      )
      .subscribe();
      
    // Setup subscription for stock_in_details to catch batch processing
    const detailsChannel = supabase
      .channel('stock-in-details-changes')
      .on('postgres_changes',
          { event: '*', schema: 'public', table: 'stock_in_details' },
          (payload) => {
            console.log('Realtime update for stock_in_details:', payload);
            
            // Invalidate both stock-in requests and inventory data
            queryClient.invalidateQueries({ queryKey: ['stock-in-requests'] });
            queryClient.invalidateQueries({ queryKey: ['inventory-data'] });
          }
      )
      .subscribe();

    // Clean up subscription when component unmounts or dependencies change
    return () => {
      supabase.removeChannel(channel);
      supabase.removeChannel(detailsChannel);
    };
  }, [queryClient]);
  
  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      if (activeTab === 'pending' || activeTab === 'processing') {
        await refetchStockIn();
      } else {
        await refetchProcessed();
      }
      toast({
        title: 'Refreshed',
        description: 'Data has been refreshed successfully',
      });
    } catch (error) {
      console.error('Error refreshing data:', error);
      toast({
        title: 'Refresh Failed',
        description: 'Failed to refresh data. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    // Update filters based on active tab
    if (value === 'pending') {
      setStockInFilters(prev => ({ ...prev, status: 'pending' }));
    } else if (value === 'processing') {
      setStockInFilters(prev => ({ ...prev, status: 'processing' }));
    }
  };

  const handleProcess = (stockIn: StockInRequestData) => {
    navigate(`/manager/stock-in/batch/${stockIn.id}`);
  };

  return (
    <div className="space-y-6 p-6">
      <PageHeader 
        title="Stock-In Processing" 
        description="Manage stock-in requests and view processed batches"
        actions={
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={handleRefresh}
              disabled={isRefreshing}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button size="sm" onClick={() => navigate('/manager/stock-in/batch')}>
              <Plus className="h-4 w-4 mr-2" />
              Process New Batch
            </Button>
          </div>
        }
      />

      <Tabs defaultValue="pending" onValueChange={handleTabChange}>
        <div className="flex items-center justify-between mb-4">
          <TabsList className="grid grid-cols-3 w-[400px]">
            <TabsTrigger value="pending">Pending</TabsTrigger>
            <TabsTrigger value="processing">Processing</TabsTrigger>
            <TabsTrigger value="completed">Completed</TabsTrigger>
          </TabsList>
        </div>
        
        <TabsContent value="pending" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Pending Stock-In Requests</CardTitle>
              <CardDescription>View and process pending stock-in requests submitted by field operators</CardDescription>
            </CardHeader>
            <CardContent>
              <StockInFilters 
                onFilterChange={(filters) => setStockInFilters({...filters, status: 'pending'})}
                showStatus={false}
                defaultStatus="pending"
              />
              <StockInRequestsTable 
                status="pending" 
                filters={stockInFilters}
                onProcess={handleProcess} 
              />
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="processing" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>In-Progress Stock-In Requests</CardTitle>
              <CardDescription>Continue processing stock-in requests that are in progress</CardDescription>
            </CardHeader>
            <CardContent>
              <StockInFilters 
                onFilterChange={(filters) => setStockInFilters({...filters, status: 'processing'})}
                showStatus={false} 
                defaultStatus="processing"
              />
              <StockInRequestsTable 
                status="processing" 
                filters={stockInFilters}
                onProcess={handleProcess}
              />
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="completed" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Processed Batches</CardTitle>
              <CardDescription>View all processed stock-in batches</CardDescription>
            </CardHeader>
            <CardContent>
              <ProcessedBatchesFilters onFilterChange={setProcessedFilters} />
              <ProcessedBatchesTable filters={processedFilters} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default StockInProcessing;
