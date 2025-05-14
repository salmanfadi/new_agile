
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { ProcessedBatch, Product, Profile } from '@/types/database';

export interface ProcessedBatchData extends ProcessedBatch {
  productName: string;
  productSku?: string;
  processorName?: string;
}

export const useProcessedBatches = (productFilter?: string) => {
  return useQuery({
    queryKey: ['processed-batches', productFilter],
    queryFn: async () => {
      try {
        // Build the base query
        let query = supabase
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
            status
          `);

        // Apply filters if provided
        if (productFilter) {
          query = query.eq('product_id', productFilter);
        }

        // Order by most recently processed first
        query = query.order('processed_at', { ascending: false });

        // Execute the query
        const { data: batchesData, error } = await query;

        if (error) {
          console.error('Error fetching processed batches:', error);
          throw error;
        }

        if (!batchesData || batchesData.length === 0) {
          return [];
        }

        // Extract unique IDs for related data
        const productIds = [...new Set(batchesData.map(batch => batch.product_id))];
        const userIds = [...new Set(batchesData.map(batch => batch.processed_by))];

        // Fetch related data
        const [productsResponse, profilesResponse] = await Promise.all([
          supabase.from('products').select('id, name, sku').in('id', productIds),
          supabase.from('profiles').select('id, name, username').in('id', userIds)
        ]);

        // Create lookup maps
        const productMap: Record<string, Product> = {};
        const profileMap: Record<string, Profile> = {};

        if (productsResponse.data) {
          productsResponse.data.forEach(product => {
            productMap[product.id] = product;
          });
        }

        if (profilesResponse.data) {
          profilesResponse.data.forEach(profile => {
            profileMap[profile.id] = profile;
          });
        }

        // Map batches with related entity data
        const enrichedBatches: ProcessedBatchData[] = batchesData.map(batch => {
          const product = productMap[batch.product_id];
          const processor = profileMap[batch.processed_by];

          return {
            ...batch,
            productName: product?.name || 'Unknown Product',
            productSku: product?.sku,
            processorName: processor?.name || 'Unknown User'
          };
        });

        return enrichedBatches;
      } catch (error) {
        console.error('Error in processed batches query:', error);
        toast({
          variant: 'destructive',
          title: 'Error loading batches',
          description: error instanceof Error ? error.message : 'An unknown error occurred'
        });
        throw error;
      }
    },
    staleTime: 1000 * 60, // Data is fresh for 1 minute
    refetchInterval: 1000 * 60 * 5 // Refetch every 5 minutes
  });
};

export const useBatchItems = (batchId: string | null) => {
  return useQuery({
    queryKey: ['batch-items', batchId],
    queryFn: async () => {
      if (!batchId) return [];
      
      try {
        const { data, error } = await supabase
          .from('batch_items')
          .select(`
            id,
            batch_id,
            barcode,
            quantity,
            color,
            size,
            warehouse_id,
            location_id,
            status,
            created_at,
            warehouses:warehouse_id(id, name),
            locations:location_id(id, floor, zone)
          `)
          .eq('batch_id', batchId);
          
        if (error) {
          console.error('Error fetching batch items:', error);
          throw error;
        }
        
        return data || [];
      } catch (error) {
        console.error('Error in batch items query:', error);
        toast({
          variant: 'destructive',
          title: 'Error loading batch items',
          description: error instanceof Error ? error.message : 'An unknown error occurred'
        });
        throw error;
      }
    },
    enabled: !!batchId
  });
};
