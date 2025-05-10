
import React, { useState, useEffect } from 'react';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card } from '@/components/ui/card';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from '@/hooks/use-toast';
import { useInventoryData } from '@/hooks/useInventoryData';
import { InventoryTable } from '@/components/warehouse/InventoryTable';
import { useInventoryFilters } from '@/hooks/useInventoryFilters';
import { InventoryFiltersPanel } from '@/components/warehouse/InventoryFiltersPanel';
import { useLocation } from 'react-router-dom';

const InventoryView: React.FC = () => {
  const [highlightedBarcode, setHighlightedBarcode] = useState<string | null>(null);
  const queryClient = useQueryClient();
  const location = useLocation();
  
  // Get filters 
  const {
    filters,
    setSearchTerm,
    setWarehouseFilter,
    setBatchFilter,
    setStatusFilter,
    resetFilters,
    warehouses,
    batchIds,
    availableStatuses,
    isLoadingBatches,
    isLoadingWarehouses
  } = useInventoryFilters();
  
  // Check for navigation state that might indicate we came from batch processing
  useEffect(() => {
    if (location.state?.fromBatchProcessing) {
      console.log("Detected navigation from batch processing, refreshing inventory data");
      queryClient.invalidateQueries({ queryKey: ['inventory-data'] });
      
      // If we have a batch ID, set it as a filter
      if (location.state.batchId) {
        console.log("Setting batch filter from navigation:", location.state.batchId);
        setBatchFilter(location.state.batchId);
      }
      
      toast({
        title: 'Inventory Updated',
        description: 'Showing latest inventory after batch processing',
      });
    }
  }, [location, queryClient, setBatchFilter]);
  
  // Force a refresh when component mounts to ensure we have fresh data
  useEffect(() => {
    console.log("InventoryView mounted, refreshing data");
    queryClient.invalidateQueries({ queryKey: ['inventory-data'] });
    queryClient.invalidateQueries({ queryKey: ['batch-ids'] });
  }, [queryClient]);
  
  // Use shared inventory hook with filters
  const { 
    inventoryItems, 
    isLoading, 
    error, 
    refetch 
  } = useInventoryData(
    filters.warehouseFilter, 
    filters.batchFilter, 
    filters.statusFilter, 
    filters.searchTerm
  );
  
  // Handle barcode scanned
  const handleBarcodeScanned = async (barcode: string) => {
    setHighlightedBarcode(barcode);
    
    // Clear existing filters to ensure we see the item
    resetFilters();
    setSearchTerm(barcode);
    
    // Invalidate query to ensure we have the latest data
    await queryClient.invalidateQueries({ queryKey: ['inventory-data'] });
    
    // Find item matching barcode
    const item = inventoryItems?.find(item => item.barcode === barcode);
    
    if (item) {
      toast({
        title: 'Item Found',
        description: `Found ${item.productName} in ${item.warehouseName}`,
      });
    } else {
      toast({
        title: 'Item Not Found',
        description: `No inventory item with barcode ${barcode} was found.`,
        variant: 'destructive'
      });
      
      // After a brief delay, refresh again to make sure we check database
      setTimeout(() => {
        refetch();
      }, 1000);
    }
  };
  
  const handleRefresh = () => {
    console.log("Refreshing inventory data...");
    queryClient.invalidateQueries({ queryKey: ['batch-ids'] });
    queryClient.invalidateQueries({ queryKey: ['warehouses'] });
    queryClient.invalidateQueries({ queryKey: ['inventory-data'] });
    toast({
      title: 'Refreshing Inventory',
      description: 'Getting the latest inventory data...'
    });
  };

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Inventory" 
        description="View inventory across all warehouses"
      />
      
      <InventoryFiltersPanel
        onBarcodeScanned={handleBarcodeScanned}
        onRefresh={handleRefresh}
        searchTerm={filters.searchTerm}
        setSearchTerm={setSearchTerm}
        warehouseFilter={filters.warehouseFilter}
        setWarehouseFilter={setWarehouseFilter}
        batchFilter={filters.batchFilter}
        setBatchFilter={setBatchFilter}
        statusFilter={filters.statusFilter}
        setStatusFilter={setStatusFilter}
        warehouses={warehouses}
        batchIds={batchIds}
        availableStatuses={availableStatuses}
        onResetFilters={resetFilters}
        isLoadingBatches={isLoadingBatches}
        isLoadingWarehouses={isLoadingWarehouses}
      />
      
      <Card>
        <InventoryTable 
          inventoryItems={inventoryItems} 
          isLoading={isLoading} 
          error={error as Error | null}
          highlightedBarcode={highlightedBarcode}
        />
      </Card>
    </div>
  );
};

export default InventoryView;
