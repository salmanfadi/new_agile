
import React, { useState } from 'react';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card } from '@/components/ui/card';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from '@/hooks/use-toast';
import { useInventoryData } from '@/hooks/useInventoryData';
import { InventoryTable } from '@/components/warehouse/InventoryTable';
import { useInventoryFilters } from '@/hooks/useInventoryFilters';
import { InventoryFiltersPanel } from '@/components/warehouse/InventoryFiltersPanel';

const InventoryView: React.FC = () => {
  const [highlightedBarcode, setHighlightedBarcode] = useState<string | null>(null);
  const queryClient = useQueryClient();
  
  // Get filters 
  const {
    filters,
    setSearchTerm,
    setWarehouseFilter,
    setBatchFilter,
    setStatusFilter,
    warehouses,
    batchIds,
    availableStatuses
  } = useInventoryFilters();
  
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
    }
  };
  
  const handleRefresh = () => {
    refetch();
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
