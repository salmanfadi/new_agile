
import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { ReportFilters, ProcessedBatch } from '@/types/reports';

export function useBatchTrackingReport() {
  const [data, setData] = useState<{
    batches: ProcessedBatch[];
    totalBatches: number;
    totalQuantity: number;
    byStatus: Record<string, number>;
    byWarehouse: Record<string, number>;
    byProduct: Record<string, number>;
  }>({
    batches: [],
    totalBatches: 0,
    totalQuantity: 0,
    byStatus: {},
    byWarehouse: {},
    byProduct: {}
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
    status: 'all'
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
      status: 'all'
    });
  }, []);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      // In a real application, we would fetch data from Supabase
      // This is mock data for demonstration purposes
      const mockBatches: ProcessedBatch[] = Array(20).fill(null).map((_, i) => ({
        id: `batch-${i + 1}`,
        stock_in_id: `si-${i + 1}`,
        created_at: new Date(2025, 3, i + 1).toISOString(),
        updated_at: new Date(2025, 3, i + 2).toISOString(),
        status: ['completed', 'processing', 'pending', 'rejected', 'completed'][i % 5],
        quantity: Math.floor(Math.random() * 100) + 50,
        boxes: Math.floor(Math.random() * 10) + 1,
        notes: i % 3 === 0 ? `Sample note for batch ${i + 1}` : undefined,
        submitted_by: `user-${(i % 3) + 1}`,
        processed_by: i % 5 !== 2 ? `user-${(i % 2) + 4}` : '',
        processing_time: i % 5 !== 2 ? `${i % 3 + 1}d ${i % 12}h` : undefined,
        productId: `prod-${(i % 5) + 1}`,
        productName: `Product ${String.fromCharCode(65 + (i % 5))}`,
        productSku: `P${String.fromCharCode(65 + (i % 5))}-${1000 + i}`,
        warehouse_id: `wh-${(i % 3) + 1}`,
        warehouseName: `Warehouse ${String.fromCharCode(65 + (i % 3))}`,
        submittedByName: `User ${(i % 3) + 1}`,
        processedByName: i % 5 !== 2 ? `User ${(i % 2) + 4}` : '',
      }));

      // Apply filters
      const filteredBatches = mockBatches.filter(batch => {
        const batchDate = new Date(batch.created_at);
        const passesDateFilter = 
          (!filters.dateRange || 
          (batchDate >= filters.dateRange.from && 
          batchDate <= filters.dateRange.to));
          
        const passesWarehouseFilter = 
          filters.warehouse === 'all' || 
          batch.warehouse_id === filters.warehouse;
          
        const passesProductFilter = 
          filters.product === 'all' || 
          batch.productId === filters.product;
          
        const passesStatusFilter = 
          filters.status === 'all' || 
          batch.status === filters.status;
          
        return passesDateFilter && 
               passesWarehouseFilter && 
               passesProductFilter && 
               passesStatusFilter;
      });

      // Calculate aggregations
      const totalQuantity = filteredBatches.reduce((sum, batch) => sum + batch.quantity, 0);
      
      const byStatus: Record<string, number> = {};
      const byWarehouse: Record<string, number> = {};
      const byProduct: Record<string, number> = {};
      
      filteredBatches.forEach(batch => {
        // Status aggregation
        byStatus[batch.status] = (byStatus[batch.status] || 0) + 1;
        
        // Warehouse aggregation
        byWarehouse[batch.warehouse_id] = (byWarehouse[batch.warehouse_id] || 0) + batch.quantity;
        
        // Product aggregation
        byProduct[batch.productId] = (byProduct[batch.productId] || 0) + batch.quantity;
      });

      setData({
        batches: filteredBatches,
        totalBatches: filteredBatches.length,
        totalQuantity,
        byStatus,
        byWarehouse,
        byProduct
      });
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch batch tracking data'));
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
