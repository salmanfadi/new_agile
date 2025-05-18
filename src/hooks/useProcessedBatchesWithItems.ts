
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { ProcessedBatch } from '@/types/database';

// Define more specific types to avoid excessive type instantiation
interface UseProcessedBatchesWithItemsOptions {
  page?: number;
  pageSize?: number;
  productId?: string;
  warehouseId?: string;
  locationId?: string;
  startDate?: string;
  endDate?: string;
  searchTerm?: string;
  limit?: number;
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

// Define a type for raw batch data from the database
interface RawBatchData {
  id: string;
  product_id: string;
  stock_in_id: string;
  processed_by: string;
  processed_at: string | null;
  source: string;
  notes: string | null;
  status: string;
  total_quantity: number;
  total_boxes: number;
  warehouse_id: string;
  created_at?: string;
  products?: {
    name: string;
    sku?: string;
  };
  warehouses?: {
    name: string;
  };
  profiles?: {
    name?: string;
  } | null;
}

// Hook to fetch processed batches with associated items and pagination
export const useProcessedBatchesWithItems = (options: UseProcessedBatchesWithItemsOptions = {}) => {
  const { 
    page = 1, 
    pageSize = 10, 
    productId, 
    warehouseId, 
    locationId, 
    startDate, 
    endDate, 
    searchTerm, 
    limit 
  } = options;

  return useQuery({
    queryKey: ['processed-batches-with-items', page, pageSize, productId, warehouseId, locationId, startDate, endDate, searchTerm, limit],
    queryFn: async () => {
      try {
        // Build the query
        let query = supabase
          .from('processed_batches')
          .select(
            `
            id,
            product_id,
            stock_in_id,
            processed_by,
            processed_at,
            source,
            notes,
            status,
            total_quantity,
            total_boxes,
            warehouse_id,
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

        // Apply filters
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
          query = query.or(`source.ilike.%${searchTerm}%,id.ilike.%${searchTerm}%`);
        }

        // Apply pagination
        const actualLimit = limit || pageSize;
        const startIndex = (page - 1) * actualLimit;
        const endIndex = startIndex + actualLimit - 1;
        query = query.range(startIndex, endIndex);

        // Execute the query
        const { data, error, count } = await query;

        if (error) {
          console.error('Error fetching processed batches:', error);
          throw error;
        }

        // Cast data to RawBatchData[] to avoid excessive type instantiation
        const rawData: RawBatchData[] = data as RawBatchData[];
        
        // Handle different return formats based on whether limit is provided
        if (limit) {
          // Format for EnhancedInventoryView
          const batchesFormatted = rawData.map(batch => ({
            id: batch.id,
            product_name: batch.products?.name || 'Unknown Product',
            product_sku: batch.products?.sku,
            warehouse_name: batch.warehouses?.name || 'Unknown Warehouse',
            total_quantity: batch.total_quantity,
            total_boxes: batch.total_boxes,
            processor_name: batch.profiles?.name,
            processed_at: batch.processed_at || new Date().toISOString()
          }));

          return {
            batches: batchesFormatted,
            count: count || 0,
            page,
            limit: actualLimit
          } as BatchesQueryResult;
        }

        // Format for default view with explicit mapping
        const processedBatches = rawData.map(batch => {
          const formattedBatch: ProcessedBatch = {
            id: batch.id,
            product_id: batch.product_id,
            stock_in_id: batch.stock_in_id,
            processed_by: batch.processed_by,
            processed_at: batch.processed_at,
            source: batch.source,
            notes: batch.notes,
            status: batch.status,
            total_quantity: batch.total_quantity,
            total_boxes: batch.total_boxes,
            warehouse_id: batch.warehouse_id,
            productName: batch.products?.name || 'Unknown Product',
            productSku: batch.products?.sku || 'N/A',
            warehouseName: batch.warehouses?.name || 'Unknown Warehouse',
            processorName: batch.profiles?.name || undefined,
            formattedProcessedAt: batch.processed_at 
              ? new Date(batch.processed_at).toLocaleDateString() 
              : '',
            formattedCreatedAt: batch.created_at 
              ? new Date(batch.created_at).toLocaleDateString() 
              : '',
            created_at: batch.created_at || new Date().toISOString()
          };
          
          return formattedBatch;
        });

        return {
          data: processedBatches,
          total: count || 0,
          page,
          pageSize: actualLimit
        } as ProcessedBatchesResult;
      } catch (error) {
        console.error('Error in useProcessedBatchesWithItems hook:', error);
        throw error;
      }
    },
    placeholderData: (previousData) => previousData
  });
};
