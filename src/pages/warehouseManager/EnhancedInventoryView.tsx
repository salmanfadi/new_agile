
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from '@/hooks/use-toast';
import { InventoryFiltersPanel } from '@/components/warehouse/InventoryFiltersPanel';
import { useInventoryFilters } from '@/hooks/useInventoryFilters';
import { useInventoryData } from '@/hooks/useInventoryData';
import { InventoryTable } from '@/components/warehouse/InventoryTable';
import { useProcessedBatchesWithItems } from '@/hooks/useProcessedBatchesWithItems';
import { 
  Table, TableBody, TableCell, TableHead, 
  TableHeader, TableRow 
} from '@/components/ui/table';
import { format } from 'date-fns';
import { Eye, BoxesIcon, Package, ArrowLeft } from 'lucide-react';
import { InventoryTableContainer } from '@/components/warehouse/InventoryTableContainer';

const EnhancedInventoryView: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<string>('inventory');
  const [highlightedBarcode, setHighlightedBarcode] = useState<string | null>(null);
  const [batchPage, setBatchPage] = useState<number>(1);
  
  // Get filters with enhanced hook
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
  
  // Inventory data
  const { 
    data: inventoryData, 
    isLoading: isLoadingInventory, 
    error: inventoryError, 
    refetch: refetchInventory
  } = useInventoryData(
    filters.warehouseFilter, 
    filters.batchFilter, 
    filters.statusFilter, 
    filters.searchTerm
  );
  
  // Extract inventory items from data
  const inventoryItems = inventoryData?.data || [];
  
  // Batches data
  const {
    batches,
    count: batchesCount,
    isLoading: isLoadingBatchesData,
    error: batchesError
  } = useProcessedBatchesWithItems({
    warehouseId: filters.warehouseFilter,
    searchTerm: filters.searchTerm,
    page: batchPage,
    limit: 10
  });
  
  // Check for navigation state from batch processing
  useEffect(() => {
    if (location.state?.fromBatchProcessing) {
      console.log("Detected navigation from batch processing, refreshing inventory data");
      queryClient.invalidateQueries({ queryKey: ['inventory-data'] });
      queryClient.invalidateQueries({ queryKey: ['processed-batches-with-items'] });
      
      // If we have a batch ID, set it as a filter
      if (location.state.batchId) {
        console.log("Setting batch filter from navigation:", location.state.batchId);
        setBatchFilter(location.state.batchId);
        setActiveTab('batches');
      }
      
      toast({
        title: 'Inventory Updated',
        description: 'Showing latest inventory after batch processing',
      });
    }
  }, [location, queryClient, setBatchFilter]);
  
  // Handle barcode scanned
  const handleBarcodeScanned = async (barcode: string) => {
    setHighlightedBarcode(barcode);
    setActiveTab('inventory'); // Switch to inventory tab when barcode is scanned
    
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
      
      setTimeout(() => {
        refetchInventory();
      }, 1000);
    }
  };
  
  // Handle refresh
  const handleRefresh = () => {
    console.log("Refreshing inventory data...");
    queryClient.invalidateQueries({ queryKey: ['batch-ids'] });
    queryClient.invalidateQueries({ queryKey: ['warehouses'] });
    queryClient.invalidateQueries({ queryKey: ['inventory-data'] });
    queryClient.invalidateQueries({ queryKey: ['processed-batches-with-items'] });
    
    toast({
      title: 'Refreshing Inventory',
      description: 'Getting the latest inventory data...'
    });
  };
  
  // Handle view batch details
  const handleViewBatchDetails = (batchId: string) => {
    navigate(`/manager/inventory/batch/${batchId}`);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Enhanced Inventory Management"
        description="View and manage inventory items and batches across all warehouses"
      />
      
      <div className="flex justify-between items-center">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate('/manager')}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Dashboard
        </Button>
      </div>

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
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="inventory">
            <Package className="mr-2 h-4 w-4" />
            Items View
          </TabsTrigger>
          <TabsTrigger value="batches">
            <BoxesIcon className="mr-2 h-4 w-4" />
            Batches View
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="inventory">
          <InventoryTableContainer 
            warehouseFilter={filters.warehouseFilter}
            batchFilter={filters.batchFilter}
            statusFilter={filters.statusFilter}
            searchTerm={filters.searchTerm}
            highlightedBarcode={highlightedBarcode}
            title="Inventory Items"
          />
        </TabsContent>
        
        <TabsContent value="batches">
          <Card>
            <CardHeader>
              <CardTitle>Inventory Batches</CardTitle>
              <CardDescription>
                View batches of inventory processed into the system
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingBatchesData ? (
                <div className="flex justify-center items-center p-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : batchesError ? (
                <div className="p-4 bg-red-50 border border-red-200 rounded text-red-600">
                  <p>Error loading batches: {batchesError instanceof Error ? batchesError.message : 'Unknown error'}</p>
                </div>
              ) : !batches?.length ? (
                <div className="p-6 text-center border rounded bg-gray-50">
                  <BoxesIcon className="mx-auto h-8 w-8 text-gray-400 mb-2" />
                  <p className="text-gray-500">No batch data available.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Batch ID</TableHead>
                          <TableHead>Product</TableHead>
                          <TableHead>Quantity</TableHead>
                          <TableHead>Boxes</TableHead>
                          <TableHead>Warehouse</TableHead>
                          <TableHead>Processed By</TableHead>
                          <TableHead>Date</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {batches.map((batch) => (
                          <TableRow key={batch.id}>
                            <TableCell className="font-medium">
                              {batch.id.substring(0, 8)}...
                            </TableCell>
                            <TableCell>
                              <div>
                                <div>{batch.productName}</div>
                                {/* Previous this was using batch.product_sku which doesn't exist in the standardized interface */}
                                <div className="text-xs text-gray-500">
                                  {batch.items.length} items
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>{batch.totalQuantity}</TableCell>
                            <TableCell>{batch.totalBoxes}</TableCell>
                            <TableCell>{batch.warehouseName}</TableCell>
                            <TableCell>{batch.processedBy}</TableCell>
                            <TableCell>
                              {format(new Date(batch.createdAt), 'MMM d, yyyy')}
                            </TableCell>
                            <TableCell className="text-right">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleViewBatchDetails(batch.id)}
                              >
                                <Eye className="mr-1 h-4 w-4" />
                                Details
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                  
                  {/* Pagination */}
                  {batchesCount > 0 && (
                    <div className="flex items-center justify-center space-x-2 py-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setBatchPage(prev => Math.max(1, prev - 1))}
                        disabled={batchPage === 1}
                      >
                        Previous
                      </Button>
                      <span className="text-sm">
                        Page {batchPage} of{' '}
                        {Math.ceil(batchesCount / 10)}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setBatchPage(prev => prev + 1)}
                        disabled={
                          batchPage >= Math.ceil(batchesCount / 10)
                        }
                      >
                        Next
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default EnhancedInventoryView;
