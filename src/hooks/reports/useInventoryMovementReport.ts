
import { useState, useEffect } from 'react';
import { ReportFilters, InventoryMovementData } from '@/types/reports';
import { supabase } from '@/lib/supabase';
import { InventoryMovement } from '@/types/inventory';

// Default filters for inventory movement report
const defaultFilters: ReportFilters = {
  dateRange: {
    from: new Date(new Date().setMonth(new Date().getMonth() - 1)),
    to: new Date()
  },
  warehouseId: undefined,
  productId: undefined,
  movementType: undefined
};

/**
 * Hook for fetching inventory movement report data
 */
export const useInventoryMovementReport = (initialFilters: Partial<ReportFilters> = {}) => {
  const [filters, setFilters] = useState<ReportFilters>({
    ...defaultFilters,
    ...initialFilters
  });
  
  const [reportData, setReportData] = useState<InventoryMovementData>({
    movements: [],
    totalIn: 0,
    totalOut: 0,
    netChange: 0,
    byProduct: {},
    byWarehouse: {}
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
        .from('inventory_movements')
        .select(`
          *,
          products:product_id(*),
          warehouses:warehouse_id(*),
          locations:location_id(*)
        `);
      
      // Apply date range filter if provided
      if (filters.dateRange.from) {
        query = query.gte('timestamp', filters.dateRange.from.toISOString());
      }
      
      if (filters.dateRange.to) {
        query = query.lte('timestamp', filters.dateRange.to.toISOString());
      }
      
      // Apply warehouse filter if provided
      if (filters.warehouseId) {
        query = query.eq('warehouse_id', filters.warehouseId);
      }
      
      // Apply product filter if provided
      if (filters.productId) {
        query = query.eq('product_id', filters.productId);
      }
      
      // Apply movement type filter if provided
      if (filters.movementType) {
        query = query.eq('movement_type', filters.movementType as string);
      }
      
      const { data, error: fetchError } = await query;
      
      if (fetchError) {
        throw new Error(`Error fetching inventory movement data: ${fetchError.message}`);
      }
      
      // Process data for the report
      if (data) {
        // Cast data to the correct type 
        const movementsData = data as unknown as InventoryMovement[];
        
        // Calculate summary statistics
        const inMovements = movementsData.filter(m => ['in', 'transfer_in', 'adjustment_in'].includes(m.movement_type));
        const outMovements = movementsData.filter(m => ['out', 'transfer_out', 'adjustment_out'].includes(m.movement_type));
        
        const totalIn = inMovements.reduce((sum, m) => sum + m.quantity, 0);
        const totalOut = outMovements.reduce((sum, m) => sum + m.quantity, 0);
        const netChange = totalIn - totalOut;
        
        // Group by product
        const byProduct: Record<string, number> = {};
        movementsData.forEach(m => {
          const productKey = m.product_id || 'unknown';
          const direction = ['in', 'transfer_in', 'adjustment_in'].includes(m.movement_type) ? 1 : -1;
          byProduct[productKey] = (byProduct[productKey] || 0) + (m.quantity * direction);
        });
        
        // Group by warehouse
        const byWarehouse: Record<string, number> = {};
        movementsData.forEach(m => {
          const warehouseKey = m.warehouse_id || 'unknown';
          const direction = ['in', 'transfer_in', 'adjustment_in'].includes(m.movement_type) ? 1 : -1;
          byWarehouse[warehouseKey] = (byWarehouse[warehouseKey] || 0) + (m.quantity * direction);
        });
        
        setReportData({
          movements: movementsData,
          totalIn,
          totalOut,
          netChange,
          byProduct,
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
    filters.dateRange.from?.toISOString(),
    filters.dateRange.to?.toISOString(),
    filters.warehouseId,
    filters.productId,
    filters.movementType
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
