
import React, { useState } from 'react';
import { PageHeader } from '@/components/ui/PageHeader';
import BatchStockInComponent from '@/components/warehouse/BatchStockInComponent';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { StockInRequestsTable } from '@/components/warehouse/StockInRequestsTable';
import { ProcessedBatchesTable } from '@/components/warehouse/ProcessedBatchesTable';
import { StockInFilters } from '@/components/warehouse/StockInFilters';
import { ProcessedBatchesFilters } from '@/components/warehouse/ProcessedBatchesFilters';
import { useAuth } from '@/context/AuthContext';
import { DateRange } from 'react-day-picker';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';

const StockInProcessing: React.FC = () => {
  const { user } = useAuth();
  const userId = user?.id || '';
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  
  // Tab state
  const [activeTab, setActiveTab] = useState<string>('pending');
  
  // Filters state for stock in requests
  const [pendingFilters, setPendingFilters] = useState<Record<string, any>>({});
  const [processingFilters, setProcessingFilters] = useState<Record<string, any>>({});
  const [completedFilters, setCompletedFilters] = useState<Record<string, any>>({});
  const [rejectedFilters, setRejectedFilters] = useState<Record<string, any>>({});
  
  // Filters state for processed batches
  const [batchFilters, setBatchFilters] = useState<Record<string, any>>({});
  const [batchSearchTerm, setBatchSearchTerm] = useState<string>('');
  const [batchDateRange, setBatchDateRange] = useState<DateRange | undefined>(undefined);
  
  // Sheet state for batch processing
  const [isSheetOpen, setIsSheetOpen] = useState<boolean>(false);
  const [selectedStockInId, setSelectedStockInId] = useState<string | null>(null);
  
  // Stock in table actions
  const handleProcess = (stockIn: any) => {
    const stockInId = stockIn.id;
    navigate(`/manager/stock-in/process/${stockInId}`);
  };
  
  const handleQuickProcess = (stockIn: any) => {
    // Set the stock in ID and open the sheet
    setSelectedStockInId(stockIn.id);
    setIsSheetOpen(true);
  };
  
  const handleReject = (stockIn: any) => {
    navigate(`/manager/stock-in/reject/${stockIn.id}`);
  };
  
  // Filter handlers for stock in requests
  const handleStockInFilterChange = (status: string, filters: Record<string, any>) => {
    switch (status) {
      case 'pending':
        setPendingFilters(filters);
        break;
      case 'processing':
        setProcessingFilters(filters);
        break;
      case 'completed':
        setCompletedFilters(filters);
        break;
      case 'rejected':
        setRejectedFilters(filters);
        break;
    }
  };
  
  // Filter handlers for processed batches
  const handleBatchSearch = (searchTerm: string) => {
    setBatchSearchTerm(searchTerm);
    setBatchFilters(prev => ({ ...prev, searchTerm }));
  };
  
  const handleBatchDateChange = (dateRange: DateRange | undefined) => {
    setBatchDateRange(dateRange);
    
    if (dateRange) {
      const { from, to } = dateRange;
      setBatchFilters(prev => ({
        ...prev,
        fromDate: from,
        toDate: to
      }));
    } else {
      const { fromDate, toDate, ...rest } = batchFilters;
      setBatchFilters(rest);
    }
  };
  
  const handleBatchFilterReset = () => {
    setBatchSearchTerm('');
    setBatchDateRange(undefined);
    setBatchFilters({});
  };

  const handleFilterChange = (filters: Record<string, any>) => {
    setBatchFilters(prev => ({ ...prev, ...filters }));
  };
  
  const handleSheetClose = () => {
    setIsSheetOpen(false);
    setSelectedStockInId(null);
    
    // Refresh data after closing the sheet
    queryClient.invalidateQueries({ queryKey: ['stock-in-requests'] });
    queryClient.invalidateQueries({ queryKey: ['processed-batches'] });
  };
  
  return (
    <div className="container mx-auto">
      <PageHeader 
        title="Stock In Processing"
        description="Manage incoming stock requests and process new inventory"
      />
      
      <Tabs defaultValue="pending" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-5 mb-6">
          <TabsTrigger value="pending">Pending</TabsTrigger>
          <TabsTrigger value="processing">In Progress</TabsTrigger>
          <TabsTrigger value="completed">Completed</TabsTrigger>
          <TabsTrigger value="rejected">Rejected</TabsTrigger>
          <TabsTrigger value="batches">Processed Batches</TabsTrigger>
        </TabsList>
        
        <div className="mb-6">
          {activeTab === 'batches' ? (
            <ProcessedBatchesFilters 
              onSearch={handleBatchSearch}
              onDateChange={handleBatchDateChange}
              onReset={handleBatchFilterReset}
              onFilterChange={handleFilterChange}
            />
          ) : (
            <StockInFilters 
              onFilterChange={(filters) => handleStockInFilterChange(activeTab, filters)}
            />
          )}
        </div>
        
        <TabsContent value="pending" className="mt-0">
          <StockInRequestsTable 
            status="pending" 
            filters={pendingFilters} 
            onProcess={handleProcess}
            onQuickProcess={handleQuickProcess}
            onReject={handleReject}
            userId={userId}
          />
        </TabsContent>
        
        <TabsContent value="processing" className="mt-0">
          <StockInRequestsTable 
            status="processing" 
            filters={processingFilters}
            onProcess={handleProcess}
            userId={userId}
          />
        </TabsContent>
        
        <TabsContent value="completed" className="mt-0">
          <StockInRequestsTable 
            status="completed" 
            filters={completedFilters}
            userId={userId}
          />
        </TabsContent>
        
        <TabsContent value="rejected" className="mt-0">
          <StockInRequestsTable 
            status="rejected" 
            filters={rejectedFilters}
            userId={userId}
          />
        </TabsContent>
        
        <TabsContent value="batches" className="mt-0">
          <ProcessedBatchesTable 
            filters={batchFilters}
          />
        </TabsContent>
      </Tabs>
      
      <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
        <SheetContent className="sm:max-w-xl md:max-w-2xl lg:max-w-4xl xl:max-w-6xl overflow-y-scroll">
          <SheetHeader>
            <SheetTitle>Process Stock In Request</SheetTitle>
            <SheetDescription>
              Create batches and inventory for this stock in request
            </SheetDescription>
          </SheetHeader>
          {selectedStockInId && (
            <div className="mt-6">
              <BatchStockInComponent 
                sheetMode={true} 
                onClose={handleSheetClose}
              />
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
};

export default StockInProcessing;
