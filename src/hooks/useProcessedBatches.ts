import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useState } from 'react';

export type BoxItemType = {
  id: string;
  stock_in_id: string;
  barcode: string;
  quantity: number;
  color: string | null;
  size: string | null;
  warehouse_id: string | null;
  location_id: string | null;
  product_id: string;
  product_name: string;
  product_sku: string;
  product_description: string | null;
  warehouse_name: string | null;
  zone: string | null;
  floor: number | null;
  position: string | null;
};

// Add BatchItemType export that was missing and causing several errors
export type BatchItemType = {
  id: string;
  barcode: string;
  quantity: number;
  color?: string | null;
  size?: string | null;
  status: string;
  warehouses?: {
    name: string;
  };
  locations?: {
    floor: number;
    zone: string;
  };
};

export type ProcessedBatchType = {
  id: string;
  product_id: string;
  submitted_by: string;
  processed_by: string;
  boxes: number;
  status: 'completed' | 'rejected';
  source: string | null;
  notes: string | null;
  created_at: string;
  completed_at: string | null;
  product_name: string;
  product_sku: string;
  submitter_name: string;
  processor_name: string;
  total_quantity: number;
  warehouse_id?: string;
  location_id?: string;
  warehouse_name?: string;
  location_details?: {
    floor?: number;
    zone?: string;
    position?: string;
  };
};

interface ProcessedBatchesFilters {
  searchTerm?: string;
  warehouse_id?: string;
  location_id?: string;
  fromDate?: Date;
  toDate?: Date;
}

const fetchProcessedBatches = async (
  page = 1,
  pageSize = 10,
  filters: ProcessedBatchesFilters = {}
): Promise<{
  data: ProcessedBatchType[];
  count: number;
}> => {
  try {
    // Start with the base query
    let query = supabase
      .from('processed_batches')
      .select(`
        id,
        product_id,
        submitted_by,
        processed_by,
        total_boxes,
        status,
        source,
        notes,
        processed_at,
        total_quantity,
        warehouse_id,
        products:product_id (
          name,
          sku
        ),
        processor:processed_by (
          name
        )
      `, { count: 'exact' })
      .eq('status', 'completed')
      .order('processed_at', { ascending: false });

    // Apply filters
    if (filters.searchTerm) {
      // Search across multiple fields
      const term = `%${filters.searchTerm}%`;
      query = query.or(`id.ilike.${term},products.name.ilike.${term},products.sku.ilike.${term}`);
    }

    if (filters.warehouse_id) {
      query = query.eq('warehouse_id', filters.warehouse_id);
    }

    if (filters.fromDate) {
      query = query.gte('processed_at', filters.fromDate.toISOString());
    }

    if (filters.toDate) {
      const toDate = new Date(filters.toDate);
      toDate.setHours(23, 59, 59, 999);
      query = query.lte('processed_at', toDate.toISOString());
    }

    // Add pagination
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    // Execute the query
    const { data, error, count } = await query.range(from, to);

    if (error) throw error;

    // Transform the data
    const processedData = data ? data.map((item: any) => {
      return {
        id: item.id,
        product_id: item.product_id,
        submitted_by: item.submitted_by || '',
        processed_by: item.processed_by || '',
        boxes: item.total_boxes || 0,
        status: item.status,
        source: item.source,
        notes: item.notes,
        created_at: item.processed_at,
        completed_at: item.processed_at,
        product_name: item.products?.name || 'Unknown Product',
        product_sku: item.products?.sku || '',
        submitter_name: item.submitter?.name || 'Unknown Submitter',
        processor_name: item.processor?.name || 'Unknown Processor',
        total_quantity: item.total_quantity || 0,
        warehouse_id: item.warehouse_id,
      };
    }) : [];

    return {
      data: processedData,
      count: count || 0,
    };
  } catch (error) {
    console.error('Error fetching processed batches:', error);
    throw error;
  }
};

// Add this function to fix the useProcessedBatchDetails reference error
export const fetchBatchDetails = async (batchId: string | null): Promise<any> => {
  if (!batchId) return null;
  
  try {
    const { data, error } = await supabase
      .from('processed_batches')
      .select(`
        id,
        product_id,
        processed_by,
        total_boxes,
        status,
        source,
        notes,
        processed_at,
        total_quantity,
        warehouse_id,
        products:product_id (
          name,
          sku,
          description
        ),
        processor:processed_by (
          name
        )
      `)
      .eq('id', batchId)
      .single();

    if (error) throw error;
    if (!data) return null;

    // Get warehouse details if it exists
    let warehouseName = null;
    let locationDetails = {};

    if (data.warehouse_id) {
      const { data: warehouseData } = await supabase
        .from('warehouses')
        .select('name')
        .eq('id', data.warehouse_id)
        .single();

      if (warehouseData) {
        warehouseName = warehouseData.name;
      }
    }

    return {
      id: data.id,
      product: {
        id: data.product_id,
        name: data.products?.name || 'Unknown Product',
        sku: data.products?.sku || ''
      },
      processed_by: data.processor?.name || 'Unknown',
      total_boxes: data.total_boxes || 0,
      status: data.status,
      source: data.source,
      notes: data.notes,
      processed_at: data.processed_at,
      total_quantity: data.total_quantity,
      warehouse_name: warehouseName,
    };
  } catch (error) {
    console.error('Error fetching batch details:', error);
    throw error;
  }
};

const fetchBatchItems = async (batchId: string): Promise<BatchItemType[]> => {
  try {
    const { data, error } = await supabase
      .from('batch_items')
      .select(`
        id,
        barcode,
        quantity,
        color,
        size,
        warehouse_id,
        location_id,
        status,
        warehouses:warehouse_id (
          name
        ),
        locations:location_id (
          floor,
          zone
        )
      `)
      .eq('batch_id', batchId);

    if (error) throw error;

    return data as BatchItemType[];
  } catch (error) {
    console.error('Error fetching batch items:', error);
    return [];
  }
};

export const useProcessedBatches = (
  page: number = 1,
  pageSize: number = 10,
  filters: ProcessedBatchesFilters = {}
) => {
  const [currentPageSize, setCurrentPageSize] = useState<number>(pageSize);

  const query = useQuery({
    queryKey: ['processedBatches', page, currentPageSize, filters],
    queryFn: () => fetchProcessedBatches(page, currentPageSize, filters),
  });

  const setPageSize = (newSize: number) => {
    setCurrentPageSize(newSize);
  };

  return {
    ...query,
    pageSize: currentPageSize,
    setPageSize,
  };
};

export const useBatchDetails = (batchId: string | undefined) => {
  return useQuery({
    queryKey: ['batchDetails', batchId],
    queryFn: () => (batchId ? fetchBatchDetails(batchId) : null),
    enabled: !!batchId,
  });
};

export const useBatchItems = (batchId: string | undefined) => {
  const query = useQuery({
    queryKey: ['batchItems', batchId],
    queryFn: () => (batchId ? fetchBatchItems(batchId) : []),
    enabled: !!batchId,
  });

  return query;
};

// Add this function to fix the useProcessedBatchDetails reference error
export const useProcessedBatchDetails = (batchId: string | null) => {
  return useQuery({
    queryKey: ['processedBatchDetails', batchId],
    queryFn: () => fetchBatchDetails(batchId),
    enabled: !!batchId,
  });
};
