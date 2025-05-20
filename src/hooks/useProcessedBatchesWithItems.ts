
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

// Define BatchItem type directly here since it's not exported from batchStockIn
export interface BatchItem {
  id: string;
  barcode: string;
  quantity: number;
  status: string;
  batch_id: string;
  warehouses?: { name: string };
  locations?: { floor: number; zone: string };
  color?: string;
  size?: string;
}

export interface ProcessedBatchWithItems {
  id: string;
  createdAt: string;
  status: string;
  totalBoxes: number;
  totalQuantity: number;
  productName: string;
  warehouseName: string;
  processedBy: string;
  items: BatchItem[];
}

// Define parameter interface for the hook
export interface ProcessedBatchesParams {
  batchId?: string;
  warehouseId?: string;
  searchTerm?: string;
  page?: number;
  limit?: number;
}

export const useProcessedBatchesWithItems = (params?: string | ProcessedBatchesParams) => {
  // Handle both string (legacy) and object params
  const batchId = typeof params === 'string' ? params : params?.batchId;
  const warehouseId = typeof params === 'object' ? params?.warehouseId : undefined;
  const searchTerm = typeof params === 'object' ? params?.searchTerm : undefined;
  const page = typeof params === 'object' ? params?.page : 1;
  const limit = typeof params === 'object' ? params?.limit : 10;
  
  const [currentPage, setCurrentPage] = useState(page || 1);
  const [pageSize, setPageSize] = useState(limit || 10);
  
  const fetchBatchesWithItems = async (): Promise<{
    batches: ProcessedBatchWithItems[];
    count: number;
  }> => {
    try {
      // Start building the query
      // First, get the batches with product and warehouse info
      let batchQuery = supabase
        .from('processed_batches')
        .select(`
          *,
          products (id, name, sku),
          warehouses (id, name, location)
        `, { count: 'exact' });
      
      // Then, we'll fetch the user profiles separately if needed
      const fetchUserProfile = async (userId: string | null) => {
        if (!userId) return null;
        const { data, error } = await supabase
          .from('profiles')
          .select('id, name, username')
          .eq('id', userId)
          .single();
        return error ? null : data;
      };

      // Apply filters based on parameters
      if (batchId) {
        batchQuery = batchQuery.eq('id', batchId);
      }
      
      if (warehouseId) {
        batchQuery = batchQuery.eq('warehouse_id', warehouseId);
      }
      
      if (searchTerm) {
        batchQuery = batchQuery.or(`products.name.ilike.%${searchTerm}%,products.sku.ilike.%${searchTerm}%`);
      }
      
      // Apply ordering and pagination
      batchQuery = batchQuery
        .order('processed_at', { ascending: false })
        .range((currentPage - 1) * pageSize, currentPage * pageSize - 1);

      const { data: batches, error: batchesError, count } = await batchQuery;

      if (batchesError) {
        console.error('Error fetching batches:', batchesError);
        throw batchesError;
      }

      if (!batches || batches.length === 0) {
        return { batches: [], count: 0 };
      }

      // Process batches and fetch user profiles in parallel
      const batchesWithItems = await Promise.all(
        batches.map(async (batch) => {
          // Fetch user profile for this batch
          const processedByUser = batch.processed_by ? await fetchUserProfile(batch.processed_by) : null;
          
          // Fetch items for this batch
          const { data: items, error: itemsError } = await supabase
            .from('batch_items')
            .select('*')
            .eq('batch_id', batch.id);

          if (itemsError) {
            console.error(`Error fetching items for batch ${batch.id}:`, itemsError);
            return {
              id: batch.id,
              createdAt: batch.processed_at || batch.created_at || '',
              status: batch.status,
              totalBoxes: batch.total_boxes || 0,
              totalQuantity: batch.total_quantity || 0,
              productName: batch.products?.name || 'Unknown Product',
              warehouseName: batch.warehouses?.name || 'Unknown Warehouse',
              // Use the fetched user profile
              processedBy: processedByUser?.name || processedByUser?.username || 'System',
              items: [],
            };
          }

          return {
            id: batch.id,
            createdAt: batch.processed_at || batch.created_at || '',
            status: batch.status,
            totalBoxes: batch.total_boxes || 0,
            totalQuantity: batch.total_quantity || 0,
            productName: batch.products?.name || 'Unknown Product',
            warehouseName: batch.warehouses?.name || 'Unknown Warehouse',
            // Use the fetched user profile
            processedBy: processedByUser?.name || processedByUser?.username || 'System',
            items: items || [],
          };
        })
      );

      return { batches: batchesWithItems, count: count || 0 };
    } catch (error) {
      console.error('Error in useProcessedBatchesWithItems:', error);
      throw error;
    }
  };

  const {
    data,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['processed-batches-with-items', batchId, warehouseId, searchTerm, currentPage, pageSize],
    queryFn: fetchBatchesWithItems,
  });

  return {
    batches: data?.batches || [],
    count: data?.count || 0,
    isLoading,
    error,
    refetch,
    pagination: {
      currentPage,
      pageSize,
      setCurrentPage,
      setPageSize,
    },
  };
};
