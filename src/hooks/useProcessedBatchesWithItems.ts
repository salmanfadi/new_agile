
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { format } from 'date-fns';

// Define types for batch items with proper nullable handling
export interface BatchItem {
  id: string;
  batch_id: string;
  barcode: string;
  quantity: number;
  color: string | null;
  size: string | null;
  warehouse_id: string;
  location_id: string;
  status: 'available' | 'reserved' | 'sold' | 'damaged' | 'in_transit';
  created_at: string;
  warehouseName?: string;
  locationDetails?: string;
}

// Define comprehensive batch type with null safety
export interface ProcessedBatchWithItems {
  id: string;
  stock_in_id: string | null;
  product_id: string;
  processedBy: string;
  processorName: string | null;
  totalBoxes: number;
  totalQuantity: number;
  items: BatchItem[];
  status: 'completed' | 'processing' | 'failed' | 'cancelled';
  source: string | null;
  notes: string | null;
  createdAt: string;
  warehouseId: string | null;
  warehouseName: string | null;
  productName: string | null;
  productSku: string | null;
  progress: {
    completed: number;
    total: number;
    percentage: number;
  };
}

interface FetchOptions {
  page?: number;
  limit?: number;
  warehouseId?: string;
  productId?: string;
  searchTerm?: string;
  fromDate?: Date;
  toDate?: Date;
}

/**
 * Fetches processed batches with their items from the database
 */
export const useProcessedBatchesWithItems = (options: FetchOptions = {}) => {
  const {
    page = 1,
    limit = 10,
    warehouseId,
    productId,
    searchTerm,
    fromDate,
    toDate
  } = options;

  const [batches, setBatches] = useState<ProcessedBatchWithItems[]>([]);
  const [count, setCount] = useState<number>(0);
  
  const fetchBatchesWithItems = async (): Promise<{
    batches: ProcessedBatchWithItems[];
    count: number;
  }> => {
    try {
      // 1. First get count of batches for pagination
      let countQuery = supabase
        .from('processed_batches')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'completed');
        
      if (warehouseId) {
        countQuery = countQuery.eq('warehouse_id', warehouseId);
      }
      
      if (productId) {
        countQuery = countQuery.eq('product_id', productId);
      }
      
      if (fromDate) {
        countQuery = countQuery.gte('processed_at', fromDate.toISOString());
      }
      
      if (toDate) {
        const endDate = new Date(toDate);
        endDate.setHours(23, 59, 59, 999);
        countQuery = countQuery.lte('processed_at', endDate.toISOString());
      }
      
      if (searchTerm) {
        // Add search term filter
        const { data: productIds } = await supabase
          .from('products')
          .select('id')
          .ilike('name', `%${searchTerm}%`);
          
        const productIdList = productIds?.map(p => p.id) || [];
        
        if (productIdList.length > 0) {
          countQuery = countQuery.in('product_id', productIdList);
        } else {
          // If no products match the search term, return empty results
          return { batches: [], count: 0 };
        }
      }
      
      const { count: totalCount, error: countError } = await countQuery;
      if (countError) throw countError;

      // 2. Get batches with pagination
      const from = (page - 1) * limit;
      const to = from + limit - 1;
      
      let batchesQuery = supabase
        .from('processed_batches')
        .select(`
          id,
          stock_in_id,
          product_id,
          processed_by,
          warehouse_id,
          total_boxes,
          total_quantity,
          status,
          source,
          notes,
          processed_at,
          products:product_id (
            name,
            sku
          ),
          processor:processed_by (name),
          warehouses:warehouse_id (name)
        `)
        .eq('status', 'completed')
        .order('processed_at', { ascending: false })
        .range(from, to);
        
      // Apply the same filters as count query
      if (warehouseId) {
        batchesQuery = batchesQuery.eq('warehouse_id', warehouseId);
      }
      
      if (productId) {
        batchesQuery = batchesQuery.eq('product_id', productId);
      }
      
      if (fromDate) {
        batchesQuery = batchesQuery.gte('processed_at', fromDate.toISOString());
      }
      
      if (toDate) {
        const endDate = new Date(toDate);
        endDate.setHours(23, 59, 59, 999);
        batchesQuery = batchesQuery.lte('processed_at', endDate.toISOString());
      }
      
      if (searchTerm) {
        const { data: productIds } = await supabase
          .from('products')
          .select('id')
          .ilike('name', `%${searchTerm}%`);
          
        const productIdList = productIds?.map(p => p.id) || [];
        
        if (productIdList.length > 0) {
          batchesQuery = batchesQuery.in('product_id', productIdList);
        } else {
          // If no products match the search term, return empty results
          return { batches: [], count: 0 };
        }
      }
      
      const { data: batchesData, error: batchesError } = await batchesQuery;
      if (batchesError) throw batchesError;

      // Process each batch to get its items
      const processedBatches: ProcessedBatchWithItems[] = [];
      for (const batch of batchesData || []) {
        // Get items for this batch
        const { data: itemsData } = await supabase
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
            warehouses:warehouse_id (name),
            locations:location_id (floor, zone)
          `)
          .eq('batch_id', batch.id);

        // Transform items
        const items = (itemsData || []).map(item => {
          // Safely construct location details with null checks
          const floor = item.locations?.floor;
          const zone = item.locations?.zone;
          const locationDetails = (floor !== null && zone !== null) 
            ? `Floor ${floor}, Zone ${zone}` 
            : 'Unknown Location';

          return {
            id: item.id,
            batch_id: item.batch_id,
            barcode: item.barcode,
            quantity: item.quantity,
            color: item.color,
            size: item.size,
            warehouse_id: item.warehouse_id,
            location_id: item.location_id,
            status: item.status,
            created_at: item.created_at,
            warehouseName: item.warehouses?.name || 'Unknown Warehouse',
            locationDetails
          } as BatchItem;
        });

        // Calculate progress stats
        const totalItems = items.length;
        const completedItems = items.filter(item => 
          item.status === 'available' || item.status === 'reserved' || 
          item.status === 'sold').length;
        
        const percentageComplete = totalItems > 0 
          ? Math.round((completedItems / totalItems) * 100) 
          : 0;

        // Build the processed batch object with proper null handling
        const processedBatch: ProcessedBatchWithItems = {
          id: batch.id,
          stock_in_id: batch.stock_in_id,
          product_id: batch.product_id,
          processedBy: batch.processed_by || '',
          processorName: batch.processor?.name || null,
          totalBoxes: batch.total_boxes || 0,
          totalQuantity: batch.total_quantity || 0,
          items,
          status: batch.status,
          source: batch.source,
          notes: batch.notes,
          createdAt: batch.processed_at || new Date().toISOString(),
          warehouseId: batch.warehouse_id || null,
          warehouseName: batch.warehouses?.name || null,
          productName: batch.products?.name || null,
          productSku: batch.products?.sku || null,
          progress: {
            completed: completedItems,
            total: totalItems,
            percentage: percentageComplete
          }
        };

        processedBatches.push(processedBatch);
      }

      return {
        batches: processedBatches,
        count: totalCount || 0
      };
    } catch (error) {
      console.error('Error fetching processed batches with items:', error);
      throw error;
    }
  };

  const queryResult = useQuery({
    queryKey: [
      'processed-batches-with-items', 
      page, 
      limit, 
      warehouseId, 
      productId, 
      searchTerm,
      fromDate?.toISOString(),
      toDate?.toISOString()
    ],
    queryFn: fetchBatchesWithItems,
    refetchInterval: 300000, // Refetch every 5 minutes
  });

  return {
    batches: queryResult.data?.batches || [],
    count: queryResult.data?.count || 0,
    isLoading: queryResult.isLoading,
    error: queryResult.error,
    refetch: queryResult.refetch,
  };
};
