
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { ProcessedBatch } from '@/types/database';

// Define a type for the options, including pagination
interface UseProcessedBatchesWithItemsOptions {
  page?: number;
  pageSize?: number;
  productId?: string;
  warehouseId?: string;
  locationId?: string;
  startDate?: string;
  endDate?: string;
  searchTerm?: string; // Adding searchTerm property
  limit?: number; // Adding limit property
}

// Define a return type for the processed batches query
interface ProcessedBatchesResult {
  data: ProcessedBatch[];
  total: number;
  page: number;
  pageSize: number;
}

// Define a return type for the EnhancedInventoryView structure
interface BatchesQueryResult {
  batches: Array<{
    id: string;
    product_name: string;
    product_sku?: string;
    warehouse_name: string;
    total_quantity: number;
    total_boxes: number;
    processor_name?: string;
    processed_at: string;
  }>;
  count: number;
  page: number;
  limit: number;
}

// Hook to fetch processed batches with associated items and pagination
export const useProcessedBatchesWithItems = (options: UseProcessedBatchesWithItemsOptions = {}) => {
  const { page = 1, pageSize = 10, productId, warehouseId, locationId, startDate, endDate, searchTerm, limit } = options;

  return useQuery({
    queryKey: ['processed-batches-with-items', page, pageSize, productId, warehouseId, locationId, startDate, endDate, searchTerm],
    queryFn: async (): Promise<ProcessedBatchesResult | BatchesQueryResult> => {
      try {
        let query = supabase
          .from('processed_batches')
          .select(
            `
            *,
            products (
              name,
              sku
            ),
            warehouses (
              name
            ),
            profiles (
              name
            )
          `,
            { count: 'exact' }
          )
          .order('processed_at', { ascending: false });

        // Apply filters based on options
        if (productId) {
          query = query.eq('product_id', productId);
        }
        if (warehouseId) {
          query = query.eq('warehouse_id', warehouseId);
        }
        if (locationId) {
          query = query.eq('location_id', locationId);
        }
        if (startDate) {
          query = query.gte('processed_at', startDate);
        }
        if (endDate) {
          query = query.lte('processed_at', endDate);
        }
        if (searchTerm) {
          // Search in product name or other relevant fields
          query = query.textSearch('products.name', searchTerm);
        }

        // Apply pagination - use limit if provided, otherwise use pageSize
        const actualLimit = limit || pageSize;
        const startIndex = (page - 1) * actualLimit;
        const endIndex = startIndex + actualLimit - 1;
        query = query.range(startIndex, endIndex);

        const { data, error, count } = await query;

        if (error) {
          console.error('Error fetching processed batches:', error);
          throw error;
        }

        // Check if we're returning data for EnhancedInventoryView
        if (limit) {
          // Format for EnhancedInventoryView
          const batchesData = data.map(batch => ({
            id: batch.id,
            product_name: batch.products?.name || 'Unknown Product',
            product_sku: batch.products?.sku,
            warehouse_name: batch.warehouses?.name || 'Unknown Warehouse',
            total_quantity: batch.total_quantity,
            total_boxes: batch.total_boxes,
            processor_name: batch.profiles?.name,
            processed_at: batch.processed_at
          }));

          return {
            batches: batchesData,
            count: count || 0,
            page,
            limit: actualLimit
          };
        }

        // Map the data to include additional properties for UI display
        const batchesWithDetails = data.map((batch) => {
          const productName = batch.products?.name || 'Unknown Product';
          const productSku = batch.products?.sku || 'N/A';
          const warehouseName = batch.warehouses?.name || 'Unknown Warehouse';
          const processorName = batch.profiles?.name;
          const formattedProcessedAt = batch.processed_at ? new Date(batch.processed_at).toLocaleDateString() : '';
          const formattedCreatedAt = batch.created_at ? new Date(batch.created_at).toLocaleDateString() : '';

          return {
            ...batch,
            productName,
            productSku,
            warehouseName,
            processorName,
            formattedProcessedAt,
            formattedCreatedAt,
            // Ensure created_at is present for ProcessedBatch type
            created_at: batch.created_at || new Date().toISOString()
          } as ProcessedBatch;
        });

        return {
          data: batchesWithDetails,
          total: count || 0,
          page,
          pageSize: actualLimit
        };
      } catch (error) {
        console.error('Error in useProcessedBatchesWithItems hook:', error);
        throw error;
      }
    },
    keepPreviousData: true
  });
};
