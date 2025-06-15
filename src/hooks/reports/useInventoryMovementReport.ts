
import { useState, useCallback, useEffect } from 'react';
import { ReportFilters, InventoryMovement } from '@/types/reports';
import { supabase } from '@/lib/supabase';
import { format } from 'date-fns';

export function useInventoryMovementReport() {
  const [data, setData] = useState<{
    movements: InventoryMovement[];
    totalItems: number;
    byProductId: Record<string, number>;
    byWarehouseId: Record<string, number>;
    byMovementType: Record<string, number>;
  }>({
    movements: [],
    totalItems: 0,
    byProductId: {},
    byWarehouseId: {},
    byMovementType: {},
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [filters, setFilters] = useState<ReportFilters>({
    dateRange: {
      from: new Date(new Date().getFullYear(), new Date().getMonth() - 1, 1),
      to: new Date()
    },
    warehouse: 'all',
    product: 'all',
    movementType: 'all'
  });

  const updateFilters = useCallback((newFilters: Partial<ReportFilters>) => {
    setFilters(prevFilters => ({
      ...prevFilters,
      ...newFilters
    }));
  }, []);

  const resetFilters = useCallback(() => {
    setFilters({
      dateRange: {
        from: new Date(new Date().getFullYear(), new Date().getMonth() - 1, 1),
        to: new Date()
      },
      warehouse: 'all',
      product: 'all',
      movementType: 'all'
    });
  }, []);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      // In a real application, we would fetch data from Supabase
      // This is mock data for demonstration purposes
      const mockData: InventoryMovement[] = [
        {
          id: '1',
          inventory_id: 'inv-1',
          product_id: 'prod-1',
          quantity: 100,
          previous_quantity: 0,
          movement_type: 'stock-in',
          reference_id: 'ref-1',
          reference_table: 'stock_in',
          created_at: '2025-04-15T10:30:00',
          warehouse_id: 'wh-1',
          product_name: 'Product A',
          product_sku: 'PA-001',
          warehouse_name: 'Warehouse A'
        },
        {
          id: '2',
          inventory_id: 'inv-2',
          product_id: 'prod-2',
          quantity: -20,
          previous_quantity: 50,
          movement_type: 'stock-out',
          reference_id: 'ref-2',
          reference_table: 'stock_out',
          created_at: '2025-04-16T14:45:00',
          warehouse_id: 'wh-2',
          product_name: 'Product B',
          product_sku: 'PB-002',
          warehouse_name: 'Warehouse B'
        },
        {
          id: '3',
          inventory_id: 'inv-3',
          product_id: 'prod-1',
          quantity: 30,
          previous_quantity: 100,
          movement_type: 'transfer',
          reference_id: 'ref-3',
          reference_table: 'inventory_transfers',
          created_at: '2025-04-17T09:15:00',
          warehouse_id: 'wh-3',
          product_name: 'Product A',
          product_sku: 'PA-001',
          warehouse_name: 'Warehouse C'
        },
        {
          id: '4',
          inventory_id: 'inv-4',
          product_id: 'prod-3',
          quantity: -5,
          previous_quantity: 25,
          movement_type: 'adjustment',
          reference_id: 'ref-4',
          reference_table: 'inventory_adjustments',
          created_at: '2025-04-18T16:20:00',
          warehouse_id: 'wh-1',
          product_name: 'Product C',
          product_sku: 'PC-003',
          warehouse_name: 'Warehouse A'
        }
      ];

      // Apply filters
      const filteredData = mockData.filter(item => {
        const itemDate = new Date(item.created_at);
        const passesDateFilter = 
          (!filters.dateRange || 
          (itemDate >= filters.dateRange.from && 
          itemDate <= filters.dateRange.to));
          
        const passesWarehouseFilter = 
          filters.warehouse === 'all' || 
          item.warehouse_id === filters.warehouse;
          
        const passesProductFilter = 
          filters.product === 'all' || 
          item.product_id === filters.product;
          
        const passesMovementTypeFilter = 
          !filters.movementType || 
          filters.movementType === 'all' || 
          item.movement_type === filters.movementType;
          
        return passesDateFilter && 
               passesWarehouseFilter && 
               passesProductFilter && 
               passesMovementTypeFilter;
      });

      // Calculate aggregations
      const byProductId: Record<string, number> = {};
      const byWarehouseId: Record<string, number> = {};
      const byMovementType: Record<string, number> = {};

      filteredData.forEach(item => {
        // Product aggregation
        byProductId[item.product_id] = (byProductId[item.product_id] || 0) + Math.abs(item.quantity);
        
        // Warehouse aggregation
        byWarehouseId[item.warehouse_id] = (byWarehouseId[item.warehouse_id] || 0) + Math.abs(item.quantity);
        
        // Movement type aggregation
        byMovementType[item.movement_type] = (byMovementType[item.movement_type] || 0) + Math.abs(item.quantity);
      });

      setData({
        movements: filteredData,
        totalItems: filteredData.length,
        byProductId,
        byWarehouseId,
        byMovementType
      });
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch inventory movement data'));
    } finally {
      setLoading(false);
    }
  }, [filters]);

  // Refresh function to manually trigger data fetch
  const refresh = useCallback(async () => {
    await fetchData();
  }, [fetchData]);

  // Initial data fetch and when filters change
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    data,
    loading,
    error,
    filters,
    updateFilters,
    resetFilters,
    refresh
  };
}
