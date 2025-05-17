
import { useState, useEffect } from 'react';
import { ReportFilters, BatchTrackingData } from '@/types/reports';
import { supabase } from '@/lib/supabase';
import { ProcessedBatch } from '@/types/database';

// Default filters for batch tracking report
const defaultFilters: ReportFilters = {
  dateRange: {
    from: new Date(new Date().setMonth(new Date().getMonth() - 1)),
    to: new Date()
  },
  warehouseId: undefined,
  productId: undefined,
  status: undefined
};

/**
 * Hook for fetching batch tracking report data
 */
export const useBatchTrackingReport = (initialFilters: Partial<ReportFilters> = {}) => {
  const [filters, setFilters] = useState<ReportFilters>({
    ...defaultFilters,
    ...initialFilters
  });
  
  const [reportData, setReportData] = useState<BatchTrackingData>({
    batches: [],
    totalBatches: 0,
    totalQuantity: 0,
    byStatus: {},
    bySource: {}
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
        .from('processed_batches')
        .select(`
          *,
          products:product_id(*),
          warehouses:warehouse_id(*),
          profiles:processed_by(*)
        `);
      
      // Apply date range filter if provided
      if (filters.dateRange.from) {
        query = query.gte('processed_at', filters.dateRange.from.toISOString());
      }
      
      if (filters.dateRange.to) {
        query = query.lte('processed_at', filters.dateRange.to.toISOString());
      }
      
      // Apply warehouse filter if provided
      if (filters.warehouseId) {
        query = query.eq('warehouse_id', filters.warehouseId);
      }
      
      // Apply product filter if provided
      if (filters.productId) {
        query = query.eq('product_id', filters.productId);
      }
      
      // Apply status filter if provided
      if (filters.status) {
        query = query.eq('status', filters.status);
      }
      
      const { data, error: fetchError } = await query;
      
      if (fetchError) {
        throw new Error(`Error fetching batch tracking data: ${fetchError.message}`);
      }
      
      // Process data for the report
      if (data) {
        // Create a typed array for processed batches
        const batchesData = data as unknown as ProcessedBatch[];
        
        // Calculate summary statistics
        const totalBatches = batchesData.length;
        const totalQuantity = batchesData.reduce((sum, batch) => sum + (batch.total_quantity || 0), 0);
        
        // Group by status
        const byStatus: Record<string, number> = {};
        batchesData.forEach(batch => {
          if (batch.status) {
            byStatus[batch.status] = (byStatus[batch.status] || 0) + 1;
          }
        });
        
        // Group by source
        const bySource: Record<string, number> = {};
        batchesData.forEach(batch => {
          if (batch.source) {
            bySource[batch.source] = (bySource[batch.source] || 0) + (batch.total_quantity || 0);
          }
        });
        
        // Map data to our expected format with proper typing
        const processedBatches: ProcessedBatch[] = batchesData.map(batch => ({
          id: batch.id || '',
          stock_in_id: batch.stock_in_id || '',
          processed_by: batch.processed_by || '',
          processed_at: batch.processed_at || '',
          product_id: batch.product_id || '',
          total_quantity: batch.total_quantity || 0,
          total_boxes: batch.total_boxes || 0,
          warehouse_id: batch.warehouse_id || '',
          status: batch.status || '',
          notes: batch.notes || '',
          source: batch.source || '',
          created_at: batch.created_at || '',
          // Include joined data with proper nullish coalescing
          products: batch.products || null,
          product_name: batch.products?.name || '',
          warehouses: batch.warehouses || null,
          processed_by_name: batch.profiles?.name || '',
          processed_at_formatted: batch.processed_at ? new Date(batch.processed_at).toLocaleDateString() : '',
          created_at_formatted: batch.created_at ? new Date(batch.created_at).toLocaleDateString() : '',
        }));
        
        setReportData({
          batches: processedBatches,
          totalBatches,
          totalQuantity,
          byStatus,
          bySource
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
    filters.status
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
