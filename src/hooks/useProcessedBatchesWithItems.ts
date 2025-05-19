
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { BatchItem } from '@/types/batchStockIn';

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

export const useProcessedBatchesWithItems = (batchId?: string) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  
  const fetchBatchesWithItems = async (): Promise<ProcessedBatchWithItems[]> => {
    try {
      // If a specific batch ID is provided, fetch only that batch
      const batchQuery = batchId
        ? supabase
            .from('processed_batches')
            .select(`
              *,
              products (id, name, sku),
              profiles (id, name, username),
              warehouses (id, name, location)
            `)
            .eq('id', batchId)
            .order('processed_at', { ascending: false })
        : supabase
            .from('processed_batches')
            .select(`
              *,
              products (id, name, sku),
              profiles (id, name, username),
              warehouses (id, name, location)
            `)
            .order('processed_at', { ascending: false })
            .range((currentPage - 1) * pageSize, currentPage * pageSize - 1);

      const { data: batches, error: batchesError } = await batchQuery;

      if (batchesError) {
        console.error('Error fetching batches:', batchesError);
        throw batchesError;
      }

      if (!batches || batches.length === 0) {
        return [];
      }

      const batchesWithItems = await Promise.all(
        batches.map(async (batch) => {
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
              // Add proper null checks for profiles
              processedBy: batch.profiles?.name || batch.profiles?.username || 'Unknown User',
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
            // Add proper null checks for profiles
            processedBy: batch.profiles?.name || batch.profiles?.username || 'Unknown User',
            items: items || [],
          };
        })
      );

      return batchesWithItems;
    } catch (error) {
      console.error('Error in useProcessedBatchesWithItems:', error);
      throw error;
    }
  };

  const {
    data: batches,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['processed-batches-with-items', batchId, currentPage, pageSize],
    queryFn: fetchBatchesWithItems,
  });

  return {
    batches: batches || [],
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
