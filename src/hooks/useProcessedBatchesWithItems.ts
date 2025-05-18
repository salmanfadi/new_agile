
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface ProcessedBatchWithItems {
  id: string;
  stock_in_id: string;
  product_id: string;
  product_name?: string;
  product_sku?: string;
  processed_by: string;
  processor_name?: string;
  total_quantity: number;
  total_boxes: number;
  warehouse_id: string;
  warehouse_name?: string;
  status: string;
  processed_at: string;
  itemCount: number;
}

interface UseProcessedBatchesOptions {
  warehouseId?: string;
  productId?: string;
  status?: string;
  searchTerm?: string;
  limit?: number;
  page?: number;
}

export const useProcessedBatchesWithItems = ({
  warehouseId,
  productId,
  status = 'completed',
  searchTerm,
  limit = 10,
  page = 1
}: UseProcessedBatchesOptions = {}) => {
  
  return useQuery({
    queryKey: ['processed-batches-with-items', warehouseId, productId, status, searchTerm, page, limit],
    queryFn: async () => {
      try {
        let query = supabase
          .from('processed_batches')
          .select(`
            *,
            products (
              id,
              name,
              sku
            ),
            profiles:processed_by (
              id,
              name
            ),
            warehouses (
              id,
              name
            ),
            batch_items_count:batch_items(count)
          `);
        
        if (status) {
          query = query.eq('status', status);
        }
        
        if (warehouseId) {
          query = query.eq('warehouse_id', warehouseId);
        }
        
        if (productId) {
          query = query.eq('product_id', productId);
        }
        
        if (searchTerm) {
          // Use ilike for case-insensitive search on product name through joined table
          query = query.textSearch('products.name', searchTerm);
        }
        
        const { data, error, count } = await query
          .order('processed_at', { ascending: false })
          .range((page - 1) * limit, page * limit - 1)
          .throwOnError();
        
        if (error) throw error;
        
        // Count total records for pagination
        const { count: totalCount } = await supabase
          .from('processed_batches')
          .select('*', { count: 'exact', head: true });
        
        const batches: ProcessedBatchWithItems[] = (data || []).map(batch => {
          // Handle possible null values with type checks
          const products = batch.products && typeof batch.products === 'object' ? batch.products : null;
          const profiles = batch.profiles && typeof batch.profiles === 'object' ? batch.profiles : null;
          const warehouses = batch.warehouses && typeof batch.warehouses === 'object' ? batch.warehouses : null;
          
          // Default values for product information
          let productName = 'Unknown Product';
          let productSku: string | undefined = undefined;
          
          // Check products exists and has the expected structure
          if (products) {
            // Type guard for products.name
            if ('name' in products && products.name !== null && products.name !== undefined) {
              productName = String(products.name);
            }
            
            // Type guard for products.sku
            if ('sku' in products && products.sku !== null && products.sku !== undefined) {
              productSku = String(products.sku);
            }
          }
          
          // Default value for processor name
          let processorName = 'Unknown User';
          
          // Check profiles exists and has the expected structure
          if (profiles) {
            // Type guard for profiles.name
            if ('name' in profiles && profiles.name !== null && profiles.name !== undefined) {
              processorName = String(profiles.name);
            }
          }
          
          // Default value for warehouse name
          let warehouseName = 'Unknown Warehouse';
          
          // Check warehouses exists and has the expected structure
          if (warehouses) {
            // Type guard for warehouses.name
            if ('name' in warehouses && warehouses.name !== null && warehouses.name !== undefined) {
              warehouseName = String(warehouses.name);
            }
          }
          
          return {
            id: batch.id,
            stock_in_id: batch.stock_in_id,
            product_id: batch.product_id,
            product_name: productName,
            product_sku: productSku,
            processed_by: batch.processed_by,
            processor_name: processorName, 
            total_quantity: batch.total_quantity || 0,
            total_boxes: batch.total_boxes || 0,
            warehouse_id: batch.warehouse_id,
            warehouse_name: warehouseName, 
            status: batch.status || 'completed',
            processed_at: batch.processed_at || new Date().toISOString(),
            itemCount: batch.batch_items_count?.length || 0
          };
        });
        
        return {
          batches,
          count: totalCount || 0,
          page,
          pageSize: limit
        };
      } catch (error) {
        console.error('Error fetching processed batches:', error);
        throw error;
      }
    }
  });
};
