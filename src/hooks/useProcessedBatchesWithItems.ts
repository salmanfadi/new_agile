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
}

// Hook to fetch processed batches with associated items and pagination
export const useProcessedBatchesWithItems = (options: UseProcessedBatchesWithItemsOptions = {}) => {
  const { page = 1, pageSize = 10, productId, warehouseId, locationId, startDate, endDate } = options;

  return useQuery(
    ['processed-batches-with-items', page, pageSize, productId, warehouseId, locationId, startDate, endDate],
    async () => {
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

        // Apply pagination
        const startIndex = (page - 1) * pageSize;
        const endIndex = startIndex + pageSize - 1;
        query = query.range(startIndex, endIndex);

        const { data, error, count } = await query;

        if (error) {
          console.error('Error fetching processed batches:', error);
          throw error;
        }

        // Map the data to include additional properties for UI display
        const batchesWithDetails: ProcessedBatch[] = data.map((batch) => {
          const productName = batch.products ? batch.products.name : 'Unknown Product';
          const productSku = batch.products ? batch.products.sku : 'N/A';
          const warehouseName = batch.warehouses ? batch.warehouses.name : 'Unknown Warehouse';
          const processorName = batch.profiles ? batch.profiles.name : undefined;
          const formattedProcessedAt = new Date(batch.processed_at).toLocaleDateString();
          const formattedCreatedAt = new Date(batch.created_at).toLocaleDateString();

          return {
            ...batch,
            productName,
            productSku,
            warehouseName,
            processorName,
            formattedProcessedAt,
            formattedCreatedAt,
          };
        }) as ProcessedBatch[];

        return {
          data: batchesWithDetails,
          total: count || 0,
          page,
          pageSize,
        };
      } catch (error) {
        console.error('Error in useProcessedBatchesWithItems hook:', error);
        throw error;
      }
    },
    { keepPreviousData: true }
  );
};
