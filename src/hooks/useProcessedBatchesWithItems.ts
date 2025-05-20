
import { useQuery, type QueryObserverResult } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { BatchItem } from "@/types/barcode";

export interface ProcessedBatchItemType {
  id: string;
  barcode: string;
  quantity: number;
  color?: string;
  size?: string;
  status: string;
  warehouseName?: string;
  locationDetails?: string;
}

export interface ProcessedBatchWithItems {
  id: string;
  product_id?: string;
  stock_in_id?: string;
  status: "processing" | "completed" | "failed" | "cancelled";
  created_at: string;
  totalBoxes: number;
  totalQuantity: number;
  processorName?: string; 
  source?: string;
  notes?: string;
  warehouseName?: string;
  locationDetails?: string;
  createdAt: string;
  progress: {
    percentage: number;
    status: string;
  };
  product?: {
    id: string;
    name: string;
    sku?: string;
  };
  items: ProcessedBatchItemType[];
}

export interface UseProcessedBatchesWithItemsProps {
  limit?: number;
  status?: string;
  productId?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  searchTerm?: string;
  warehouseId?: string;
  page?: number;
}

export interface ProcessedBatchesResult {
  batches: ProcessedBatchWithItems[];
  count: number;
}

export function useProcessedBatchesWithItems({
  limit = 10,
  status,
  productId,
  sortBy = 'created_at',
  sortOrder = 'desc',
  searchTerm,
  warehouseId,
  page = 1,
}: UseProcessedBatchesWithItemsProps = {}): QueryObserverResult<ProcessedBatchesResult, Error> {
  return useQuery({
    queryKey: ['processedBatches', { limit, status, productId, sortBy, sortOrder, searchTerm, warehouseId, page }],
    queryFn: async () => {
      try {
        let query = supabase
          .from('processed_batches')
          .select(`
            *,
            product:products(*),
            processed_by:users(name),
            warehouses:warehouses(name),
            locations:locations(zone, aisle, shelf)
          `)
          .order(sortBy, { ascending: sortOrder === 'asc' });

        if (status) {
          query = query.eq('status', status);
        }

        if (productId) {
          query = query.eq('product_id', productId);
        }

        if (searchTerm) {
          query = query.or(`product.name.ilike.%${searchTerm}%,product.sku.ilike.%${searchTerm}%`);
        }

        if (warehouseId) {
          query = query.eq('warehouse_id', warehouseId);
        }

        // Add pagination
        const from = (page - 1) * limit;
        const to = from + limit - 1;
        query = query.range(from, to);

        const { data: batchesData, error: batchesError } = await query;

        if (batchesError) {
          throw new Error(`Error fetching batches: ${batchesError.message}`);
        }

        // For each batch, get its items from batch_items rather than processed_batch_items
        const batchesWithItems = await Promise.all(
          batchesData.map(async (batch) => {
            const { data: itemsData, error: itemsError } = await supabase
              .from('batch_items')
              .select(`
                *,
                warehouses:warehouses(name),
                locations:locations(zone, shelf, aisle)
              `)
              .eq('batch_id', batch.id);

            if (itemsError) {
              console.error(`Error fetching items for batch ${batch.id}:`, itemsError);
              return {
                ...batch,
                items: [],
                totalBoxes: 0,
                totalQuantity: 0,
              };
            }

            // Transform data for frontend consumption
            const items = itemsData.map(item => ({
              id: item.id,
              barcode: item.barcode,
              quantity: item.quantity,
              color: item.color,
              size: item.size,
              status: item.status,
              warehouseName: item.warehouses?.name,
              locationDetails: item.locations 
                ? `${item.locations.zone || ''} ${item.locations.aisle || ''}-${item.locations.shelf || ''}`
                : undefined,
            }));

            // Calculate totals
            const totalBoxes = items.length;
            const totalQuantity = items.reduce((sum, item) => sum + (item.quantity || 0), 0);

            // Format processor name
            const processorName = batch.processed_by?.name || 'Unknown'; 

            // Process location details
            const warehouseName = batch.warehouses?.name || undefined;
            const locationDetails = batch.locations
              ? `${batch.locations.zone || ''} ${batch.locations.aisle || ''}-${batch.locations.shelf || ''}`
              : undefined;

            // Generate a progress object
            const progress = {
              percentage: batch.status === 'completed' ? 100 : (batch.status === 'failed' ? 0 : 75),
              status: batch.status === 'completed' ? 'Complete' : (batch.status === 'processing' ? 'In Progress' : batch.status)
            };

            return {
              ...batch,
              items,
              totalBoxes,
              totalQuantity,
              processorName,
              warehouseName,
              locationDetails,
              createdAt: batch.created_at,
              progress
            };
          })
        );

        // Get total count for pagination
        const { count } = await supabase
          .from('processed_batches')
          .select('*', { count: 'exact', head: true });

        return {
          batches: batchesWithItems as ProcessedBatchWithItems[],
          count: count || 0
        };
      } catch (error) {
        console.error("Error in useProcessedBatchesWithItems:", error);
        throw error;
      }
    }
  });
}

export function useBatchDetails(batchId?: string) {
  return useQuery({
    queryKey: ['batchDetails', batchId],
    queryFn: async () => {
      if (!batchId) {
        throw new Error('Batch ID is required');
      }

      const { data: batch, error: batchError } = await supabase
        .from('processed_batches')
        .select(`
          *,
          product:products(*),
          processed_by:users(name),
          warehouses:warehouses(name),
          locations:locations(zone, aisle, shelf)
        `)
        .eq('id', batchId)
        .single();

      if (batchError) {
        throw new Error(`Error fetching batch: ${batchError.message}`);
      }

      if (!batch) {
        throw new Error('Batch not found');
      }

      // Get batch items
      const { data: itemsData, error: itemsError } = await supabase
        .from('batch_items')
        .select(`
          *,
          warehouses:warehouses(name),
          locations:locations(zone, shelf, aisle)
        `)
        .eq('batch_id', batchId);

      if (itemsError) {
        throw new Error(`Error fetching batch items: ${itemsError.message}`);
      }

      // Transform data for frontend consumption
      const items = itemsData.map(item => ({
        id: item.id,
        barcode: item.barcode,
        quantity: item.quantity,
        color: item.color,
        size: item.size,
        status: item.status,
        warehouseName: item.warehouses?.name,
        locationDetails: item.locations 
          ? `${item.locations.zone || ''} ${item.locations.aisle || ''}-${item.locations.shelf || ''}`
          : undefined,
      }));

      // Calculate totals
      const totalBoxes = items.length;
      const totalQuantity = items.reduce((sum, item) => sum + (item.quantity || 0), 0);

      // Format processor name
      const processorName = batch.processed_by?.name || 'Unknown'; 

      // Process location details
      const warehouseName = batch.warehouses?.name || undefined;
      const locationDetails = batch.locations
        ? `${batch.locations.zone || ''} ${batch.locations.aisle || ''}-${batch.locations.shelf || ''}`
        : undefined;

      // Generate a progress object
      const progress = {
        percentage: batch.status === 'completed' ? 100 : (batch.status === 'failed' ? 0 : 75),
        status: batch.status === 'completed' ? 'Complete' : (batch.status === 'processing' ? 'In Progress' : batch.status)
      };

      return {
        ...batch,
        items,
        totalBoxes,
        totalQuantity,
        processorName,
        warehouseName,
        locationDetails,
        createdAt: batch.created_at,
        progress
      } as ProcessedBatchWithItems;
    },
    enabled: !!batchId
  });
}

export function useBatchItems(batchId?: string) {
  return useQuery({
    queryKey: ['batchItems', batchId],
    queryFn: async () => {
      if (!batchId) {
        throw new Error('Batch ID is required');
      }

      const { data, error } = await supabase
        .from('batch_items')
        .select(`
          *,
          warehouses:warehouses(name),
          locations:locations(zone, shelf, aisle)
        `)
        .eq('batch_id', batchId);

      if (error) {
        throw new Error(`Error fetching batch items: ${error.message}`);
      }

      return data.map(item => ({
        id: item.id,
        barcode: item.barcode,
        batch_id: item.batch_id,
        quantity: item.quantity,
        color: item.color,
        size: item.size,
        status: item.status,
        warehouseName: item.warehouses?.name || 'Unknown',
        locationDetails: item.locations 
          ? `${item.locations.zone || ''} ${item.locations.aisle || ''}-${item.locations.shelf || ''}`
          : 'Unknown',
      }));
    },
    enabled: !!batchId
  });
}
