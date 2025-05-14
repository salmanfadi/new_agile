
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface BatchItemType {
  id: string;
  batch_id: string;
  barcode: string;
  quantity: number;
  color: string;
  size: string;
  warehouse_id: string;
  location_id: string;
  status: string;
  created_at: string;
  product?: {
    id: string;
    name: string;
    sku: string;
  };
  warehouse?: {
    id: string;
    name: string;
    location: string;
  };
  location?: {
    id: string;
    floor: number;
    zone: string;
  };
}

export interface ProcessedBatchType {
  id: string;
  stock_in_id: string;
  processed_by: string;
  processed_at: string;
  product_id: string;
  total_quantity: number;
  total_boxes: number;
  warehouse_id: string;
  source: string;
  notes: string;
  status: string;
  product?: {
    id: string;
    name: string;
    sku: string;
  };
  warehouse?: {
    id: string;
    name: string;
    location: string;
  };
  submitter?: {
    id: string;
    name: string;
  };
  processor?: {
    id: string;
    name: string;
  };
}

// Hook to fetch all processed batches
export const useProcessedBatches = () => {
  return useQuery({
    queryKey: ['processed-batches'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('processed_batches')
        .select(`
          *,
          product:product_id (id, name, sku),
          warehouse:warehouse_id (id, name, location),
          submitter:stock_in!inner (
            submitted_by,
            submitter:submitted_by (id, name)
          ),
          processor:processed_by (id, name)
        `)
        .order('processed_at', { ascending: false });

      if (error) {
        console.error('Error fetching processed batches:', error);
        throw error;
      }

      // Process and format the data
      const formattedData = data.map(batch => {
        return {
          ...batch,
          submitter: batch.submitter?.submitter || null
        };
      });

      return formattedData as ProcessedBatchType[];
    }
  });
};

// Hook to fetch a single batch and its items
export const useBatch = (batchId: string | null) => {
  return useQuery({
    queryKey: ['batch', batchId],
    queryFn: async () => {
      if (!batchId) {
        return null;
      }

      const { data: batch, error: batchError } = await supabase
        .from('processed_batches')
        .select(`
          *,
          product:product_id (id, name, sku),
          warehouse:warehouse_id (id, name, location),
          submitter:stock_in!inner (
            submitted_by,
            submitter:submitted_by (id, name)
          ),
          processor:processed_by (id, name)
        `)
        .eq('id', batchId)
        .single();

      if (batchError) {
        console.error('Error fetching batch:', batchError);
        throw batchError;
      }

      return batch as ProcessedBatchType;
    },
    enabled: !!batchId
  });
};

// Hook to fetch items for a specific batch
export const useBatchItems = (batchId: string | null) => {
  return useQuery({
    queryKey: ['batch-items', batchId],
    queryFn: async () => {
      if (!batchId) {
        return [];
      }

      const { data, error } = await supabase
        .from('batch_items')
        .select(`
          *,
          product:processed_batches!inner (
            product_id,
            product:product_id (id, name, sku)
          ),
          warehouse:warehouse_id (id, name, location),
          location:location_id (id, floor, zone)
        `)
        .eq('batch_id', batchId);

      if (error) {
        console.error('Error fetching batch items:', error);
        throw error;
      }

      // Process and format the data
      const formattedItems = data.map(item => ({
        ...item,
        product: item.product?.product || null
      }));

      return formattedItems as BatchItemType[];
    },
    enabled: !!batchId
  });
};
