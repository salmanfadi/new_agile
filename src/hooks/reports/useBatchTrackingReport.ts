
import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { ReportFilters, BatchTrackingData } from '@/types/reports';
import { ProcessedBatch } from '@/types/database';
import { format, parseISO } from 'date-fns';

export const useBatchTrackingReport = (initialFilters: ReportFilters) => {
  const [filters, setFilters] = useState<ReportFilters>(initialFilters);
  
  // Fetch processed batches
  const batchesQuery = useQuery({
    queryKey: ['batch-tracking-report', filters],
    queryFn: async () => {
      try {
        let queryBuilder = supabase
          .from('processed_batches')
          .select(`
            id,
            stock_in_id,
            processed_by,
            processed_at,
            product_id,
            total_quantity,
            total_boxes,
            warehouse_id,
            source,
            notes,
            status,
            created_at,
            products:product_id (
              name,
              sku
            ),
            warehouses:warehouse_id (
              name
            ),
            profiles:processed_by (
              name,
              username
            )
          `);
        
        // Apply filters
        if (filters.warehouseId) {
          queryBuilder = queryBuilder.eq('warehouse_id', filters.warehouseId);
        }
        
        if (filters.productId) {
          queryBuilder = queryBuilder.eq('product_id', filters.productId);
        }
        
        if (filters.status) {
          queryBuilder = queryBuilder.eq('status', filters.status);
        }
        
        if (filters.dateRange.from) {
          queryBuilder = queryBuilder.gte('processed_at', filters.dateRange.from.toISOString());
        }
        
        if (filters.dateRange.to) {
          queryBuilder = queryBuilder.lte('processed_at', filters.dateRange.to.toISOString());
        }
        
        queryBuilder = queryBuilder.order('processed_at', { ascending: false });
        
        const { data, error } = await queryBuilder;
        
        if (error) {
          throw new Error(`Failed to fetch batch tracking data: ${error.message}`);
        }
        
        return data || [];
      } catch (err) {
        console.error('Error fetching batch tracking report:', err);
        throw err;
      }
    }
  });

  // Process and memoize the data
  const reportData: BatchTrackingData = useMemo(() => {
    const batches = batchesQuery.data || [];
    
    // Calculate totals
    const totalBatches = batches.length;
    const totalQuantity = batches.reduce((sum, batch) => sum + (batch.total_quantity || 0), 0);
    
    // Group by status
    const byStatus = batches.reduce((acc: Record<string, number>, batch) => {
      const status = batch.status || 'unknown';
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {});
    
    // Group by source
    const bySource = batches.reduce((acc: Record<string, number>, batch) => {
      const source = batch.source || 'Unknown';
      acc[source] = (acc[source] || 0) + (batch.total_quantity || 0);
      return acc;
    }, {});
    
    // Transform batches for display
    const transformedBatches: ProcessedBatch[] = batches.map(batch => ({
      id: batch.id,
      stock_in_id: batch.stock_in_id,
      processed_by: batch.processed_by,
      processed_at: batch.processed_at,
      product_id: batch.product_id,
      total_quantity: batch.total_quantity || 0,
      total_boxes: batch.total_boxes || 0,
      warehouse_id: batch.warehouse_id,
      status: batch.status,
      notes: batch.notes,
      source: batch.source,
      created_at: batch.created_at,
      // Additional computed properties for UI display
      productName: batch.products?.name || 'Unknown Product',
      productSku: batch.products?.sku,
      warehouseName: batch.warehouses?.name || 'Unknown Warehouse',
      processorName: batch.profiles?.name || batch.profiles?.username || 'Unknown',
      formattedProcessedAt: format(parseISO(batch.processed_at), 'yyyy-MM-dd HH:mm:ss'),
      formattedCreatedAt: format(parseISO(batch.created_at), 'yyyy-MM-dd HH:mm:ss')
    }));
    
    return {
      batches: transformedBatches,
      totalBatches,
      totalQuantity,
      byStatus,
      bySource
    };
  }, [batchesQuery.data]);

  return {
    data: reportData,
    isLoading: batchesQuery.isLoading,
    error: batchesQuery.error,
    filters,
    setFilters,
    refetch: batchesQuery.refetch
  };
};
