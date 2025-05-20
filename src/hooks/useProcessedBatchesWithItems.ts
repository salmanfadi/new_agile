
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

export interface BatchItem {
  id: string;
  barcode: string;
  quantity: number;
  color: string | null;
  size: string | null;
  status: string;
  batch_id: string;
  location_id?: string | null;
  warehouse_id?: string | null;
  warehouses?: {
    name: string;
  } | null;
  locations?: {
    floor: number;
    zone: string;
  } | null;
  warehouseName?: string;
  locationDetails?: string;
}

export interface ProcessedBatchWithItems {
  id: string;
  stock_in_id: string | null;
  product_id: string | null;
  processedBy: string | null;
  processorName: string | null;
  totalBoxes: number;
  totalQuantity: number;
  status: "processing" | "completed" | "failed" | "cancelled";
  source: string | null;
  notes: string | null;
  createdAt: string;
  warehouseId: string | null;
  warehouseName: string | null;
  locationId: string | null;
  locationDetails: string | null;
  product: {
    name: string | null;
    sku: string | null;
  } | null;
  progress: {
    percentage: number;
    processed: number;
    total: number;
  };
  items: BatchItem[];
}

interface UseProcessedBatchesWithItemsProps {
  batchId?: string | null;
}

export function useProcessedBatchesWithItems({ batchId }: UseProcessedBatchesWithItemsProps = {}) {
  const [error, setError] = useState<Error | null>(null);

  const fetchProcessedBatchesWithItems = async () => {
    try {
      // 1. Fetch processed batches
      const { data: batches, error: batchesError } = await supabase
        .from('processed_batches')
        .select(`
          *,
          warehouse:warehouse_id (name),
          location:location_id (floor, zone),
          processor:processed_by (name)
        `)
        .order('processed_at', { ascending: false });

      if (batchesError) throw batchesError;

      if (!batches || batches.length === 0) {
        return [];
      }

      // 2. Fetch product information for all batches
      const productIds = batches
        .map(batch => batch.product_id)
        .filter(Boolean) as string[];

      const { data: products, error: productsError } = await supabase
        .from('products')
        .select('id, name, sku')
        .in('id', productIds);

      if (productsError) throw productsError;

      // Create a map of products for easy lookup
      const productMap = new Map();
      if (products) {
        products.forEach(product => {
          productMap.set(product.id, product);
        });
      }

      // 3. Batch IDs for fetching items
      const batchIds = batches.map(batch => batch.id);

      // 4. Fetch all batch items
      const { data: allBatchItems, error: itemsError } = await supabase
        .from('batch_items')
        .select(`
          *,
          warehouses:warehouse_id (name),
          locations:location_id (floor, zone)
        `)
        .in('batch_id', batchIds);

      if (itemsError) throw itemsError;

      // 5. Group batch items by batch_id
      const batchItemsMap = new Map();
      if (allBatchItems) {
        allBatchItems.forEach(item => {
          const id = item.batch_id;
          if (!batchItemsMap.has(id)) {
            batchItemsMap.set(id, []);
          }
          
          // Enhance the item with warehouse and location display info
          const enhancedItem = {
            ...item,
            warehouseName: item.warehouses?.name || 'Unknown',
            locationDetails: item.locations ? 
              `Floor ${item.locations.floor}, Zone ${item.locations.zone}` : 
              'Unknown'
          };
          
          batchItemsMap.get(id).push(enhancedItem);
        });
      }

      // 6. Create full batch objects with items
      const processedBatchesWithItems: ProcessedBatchWithItems[] = batches.map(batch => {
        const items = batchItemsMap.get(batch.id) || [];
        const product = batch.product_id ? productMap.get(batch.product_id) : null;
        
        return {
          id: batch.id,
          stock_in_id: batch.stock_in_id,
          product_id: batch.product_id,
          processedBy: batch.processed_by,
          processorName: batch.processor?.name || 'Unknown',
          totalBoxes: batch.total_boxes,
          totalQuantity: batch.total_quantity,
          status: (batch.status || 'completed') as "processing" | "completed" | "failed" | "cancelled",
          source: batch.source,
          notes: batch.notes,
          createdAt: batch.processed_at,
          warehouseId: batch.warehouse_id,
          warehouseName: batch.warehouse?.name || null,
          locationId: batch.location_id,
          locationDetails: batch.location ? 
            `Floor ${batch.location.floor}, Zone ${batch.location.zone}` : 
            null,
          product: product ? {
            name: product.name,
            sku: product.sku
          } : null,
          progress: {
            percentage: batch.total_boxes ? 100 : 0,
            processed: batch.total_boxes,
            total: batch.total_boxes
          },
          items
        };
      });

      // If batchId is provided, filter for just that batch
      if (batchId) {
        const foundBatch = processedBatchesWithItems.find(batch => batch.id === batchId);
        return foundBatch ? [foundBatch] : [];
      }

      return processedBatchesWithItems;
    } catch (err) {
      console.error('Error fetching processed batches with items:', err);
      setError(err as Error);
      return [];
    }
  };

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['processed-batches-with-items', batchId],
    queryFn: fetchProcessedBatchesWithItems
  });

  return {
    data,
    isLoading,
    error,
    refetch
  };
}

export function useBatchDetails(batchId?: string | null) {
  const { data, isLoading, error, refetch } = useProcessedBatchesWithItems({ batchId });
  return {
    data: data && data.length > 0 ? data[0] : null,
    isLoading,
    error,
    refetch
  };
}

export function useBatchItems(batchId?: string | null) {
  const { data, isLoading, error, refetch } = useProcessedBatchesWithItems({ batchId });
  return {
    data: data && data.length > 0 ? data[0].items : [],
    isLoading,
    error,
    refetch
  };
}
