
import { useState, useEffect } from 'react';
import { ReportFilters } from '@/types/reports';
import { supabase } from '@/lib/supabase';
import { InventoryItem } from '@/hooks/useInventoryData';

// Default filters for inventory status report
const defaultFilters: ReportFilters = {
  dateRange: {
    from: null, // Current status doesn't need date filtering typically
    to: null
  },
  warehouseId: undefined,
  productId: undefined,
  locationId: undefined
};

/**
 * Hook for fetching inventory status report data
 */
export const useInventoryStatusReport = (initialFilters: Partial<ReportFilters> = {}) => {
  const [filters, setFilters] = useState<ReportFilters>({
    ...defaultFilters,
    ...initialFilters
  });
  
  const [reportData, setReportData] = useState({
    items: [] as InventoryItem[],
    totalItems: 0,
    totalQuantity: 0,
    byStatus: {} as Record<string, number>,
    byWarehouse: {} as Record<string, number>
  });
  
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);
  
  // Function to fetch data based on current filters
  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Build query with filters
      let query = supabase
        .from('inventory')
        .select(`
          *,
          products!inner(*),
          warehouses!inner(*),
          locations:warehouse_locations!inner(*)
        `);
      
      // Apply warehouse filter if provided
      if (filters.warehouseId) {
        query = query.eq('warehouse_id', filters.warehouseId);
      }
      
      // Apply product filter if provided
      if (filters.productId) {
        query = query.eq('product_id', filters.productId);
      }
      
      // Apply location filter if provided
      if (filters.locationId) {
        query = query.eq('location_id', filters.locationId);
      }
      
      const { data, error: fetchError } = await query;
      
      if (fetchError) {
        throw new Error(`Error fetching inventory status data: ${fetchError.message}`);
      }
      
      // Process data for the report
      if (data) {
        // Cast to the correct type using type assertion
        const typedData = data as any[];
        
        // Map data to our expected format
        const inventoryItems: InventoryItem[] = typedData.map(item => ({
          id: item.id,
          product_id: item.product_id,
          warehouse_id: item.warehouse_id,
          location_id: item.location_id,
          quantity: item.quantity,
          barcode: item.barcode,
          color: item.color,
          size: item.size,
          status: item.status || 'available',
          created_at: item.created_at,
          updated_at: item.updated_at,
          // Include joined data
          product_name: item.products?.name || 'Unknown',
          product_sku: item.products?.sku || 'N/A',
          // Format location details
          warehouse_name: item.warehouses?.name || 'Unknown',
          location_name: item.locations ? 
            `Floor ${item.locations.floor || '?'}, Zone ${item.locations.zone || '?'}` : 
            'Unknown',
        }));
        
        // Calculate summary statistics
        const totalItems = inventoryItems.length;
        const totalQuantity = inventoryItems.reduce((sum, item) => sum + item.quantity, 0);
        
        // Group by status
        const byStatus: Record<string, number> = {};
        inventoryItems.forEach(item => {
          const status = item.status || 'unknown';
          byStatus[status] = (byStatus[status] || 0) + item.quantity;
        });
        
        // Group by warehouse
        const byWarehouse: Record<string, number> = {};
        inventoryItems.forEach(item => {
          const warehouse = item.warehouse_id;
          byWarehouse[warehouse] = (byWarehouse[warehouse] || 0) + item.quantity;
        });
        
        setReportData({
          items: inventoryItems,
          totalItems,
          totalQuantity,
          byStatus,
          byWarehouse
        });
      }
      
    } catch (err: any) {
      setError(err instanceof Error ? err : new Error(String(err)));
    } finally {
      setLoading(false);
    }
  };
  
  // Update filters
  const updateFilters = (newFilters: Partial<ReportFilters>) => {
    setFilters(prev => ({
      ...prev,
      ...newFilters
    }));
  };
  
  // Reset filters to default
  const resetFilters = () => {
    setFilters(defaultFilters);
  };
  
  // Fetch data when filters change
  useEffect(() => {
    fetchData();
  }, [
    filters.warehouseId,
    filters.productId,
    filters.locationId
  ]);
  
  return {
    data: reportData,
    loading,
    error,
    filters,
    updateFilters,
    resetFilters,
    refresh: fetchData
  };
};
