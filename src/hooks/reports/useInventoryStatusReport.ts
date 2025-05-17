
import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { ReportFilters, InventoryStatusData } from '@/types/reports';
import { toast } from '@/hooks/use-toast';

export const useInventoryStatusReport = (initialFilters: ReportFilters) => {
  const [filters, setFilters] = useState<ReportFilters>(initialFilters);
  
  const queryResult = useQuery({
    queryKey: ['inventory-status-report', filters],
    queryFn: async () => {
      try {
        // Build query with explicit column selection
        let queryBuilder = supabase
          .from('inventory')
          .select(`
            id,
            product_id,
            warehouse_id,
            location_id,
            barcode,
            quantity,
            color,
            size,
            status,
            batch_id,
            created_at,
            updated_at,
            products:product_id (
              name,
              sku
            ),
            warehouses:warehouse_id (
              name
            ),
            warehouse_locations:location_id (
              floor,
              zone
            )
          `);
        
        // Apply filters
        if (filters.warehouseId) {
          queryBuilder = queryBuilder.eq('warehouse_id', filters.warehouseId);
        }
        
        if (filters.productId) {
          queryBuilder = queryBuilder.eq('product_id', filters.productId);
        }
        
        if (filters.locationId) {
          queryBuilder = queryBuilder.eq('location_id', filters.locationId);
        }
        
        if (filters.status) {
          queryBuilder = queryBuilder.eq('status', filters.status);
        }
        
        if (filters.dateRange.from) {
          queryBuilder = queryBuilder.gte('updated_at', filters.dateRange.from.toISOString());
        }
        
        if (filters.dateRange.to) {
          queryBuilder = queryBuilder.lte('updated_at', filters.dateRange.to.toISOString());
        }
        
        const { data, error } = await queryBuilder;
        
        if (error) {
          throw new Error(`Failed to fetch inventory data: ${error.message}`);
        }

        return data || [];
      } catch (err) {
        console.error('Error fetching inventory status report:', err);
        throw err;
      }
    }
  });

  // Memoize and transform the data for the report
  const reportData: InventoryStatusData = useMemo(() => {
    const items = queryResult.data || [];
    
    // Calculate totals
    const totalItems = items.length;
    const totalQuantity = items.reduce((sum, item) => sum + (item.quantity || 0), 0);
    
    // Group by status
    const byStatus = items.reduce((acc: Record<string, number>, item) => {
      const status = item.status || 'unknown';
      acc[status] = (acc[status] || 0) + (item.quantity || 0);
      return acc;
    }, {});
    
    // Group by warehouse
    const byWarehouse = items.reduce((acc: Record<string, number>, item) => {
      const warehouse = item.warehouses?.name || 'Unknown Warehouse';
      acc[warehouse] = (acc[warehouse] || 0) + (item.quantity || 0);
      return acc;
    }, {});
    
    return {
      items: items.map(item => ({
        id: item.id,
        productId: item.product_id,
        productName: item.products?.name || 'Unknown Product',
        productSku: item.products?.sku,
        warehouseId: item.warehouse_id,
        warehouseName: item.warehouses?.name || 'Unknown Warehouse',
        locationId: item.location_id,
        locationDetails: `Floor ${item.warehouse_locations?.floor || '?'}, Zone ${item.warehouse_locations?.zone || '?'}`,
        barcode: item.barcode,
        quantity: item.quantity || 0,
        color: item.color,
        size: item.size,
        status: item.status,
        batchId: item.batch_id,
        lastUpdated: item.updated_at,
      })),
      totalItems,
      totalQuantity,
      byStatus,
      byWarehouse
    };
  }, [queryResult.data]);

  return {
    data: reportData,
    isLoading: queryResult.isLoading,
    error: queryResult.error,
    filters,
    setFilters,
    refetch: queryResult.refetch
  };
};
