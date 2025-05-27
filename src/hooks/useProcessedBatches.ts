import { useQuery } from '@tanstack/react-query';
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
    // 1. Get the total count (without range or joins)
    let countQuery = supabase
      .from('processed_batches')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'completed');
    if (filters.warehouse_id) {
      countQuery = countQuery.eq('warehouse_id', filters.warehouse_id);
    }
    if (filters.fromDate) {
      countQuery = countQuery.gte('processed_at', filters.fromDate.toISOString());
    }
    if (filters.toDate) {
      const toDate = new Date(filters.toDate);
      toDate.setHours(23, 59, 59, 999);
      countQuery = countQuery.lte('processed_at', toDate.toISOString());
    }
    const { count: totalCount, error: countError } = await countQuery;
    if (countError) throw countError;

    // 2. Get the paginated data with joins
    let dataQuery = supabase
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
          sku
        )
      `)
      .eq('status', 'completed')
      .order('processed_at', { ascending: false });
    if (filters.warehouse_id) {
      dataQuery = dataQuery.eq('warehouse_id', filters.warehouse_id);
    }
    if (filters.fromDate) {
      dataQuery = dataQuery.gte('processed_at', filters.fromDate.toISOString());
    }
    if (filters.toDate) {
      const toDate = new Date(filters.toDate);
      toDate.setHours(23, 59, 59, 999);
      dataQuery = dataQuery.lte('processed_at', toDate.toISOString());
    }
    // Pagination
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;
    dataQuery = dataQuery.range(from, to);
    const { data, error } = await dataQuery;
    if (error) throw error;

    // Transform the data
    const processedData = data ? data.map((item: any) => {
      return {
        id: item.id || '',
        product_id: item.product_id || '',
        processed_by: item.processed_by || '',
        boxes: item.total_boxes || 0,
        status: item.status || 'completed',
        source: item.source || '',
        notes: item.notes || '',
        created_at: item.processed_at || new Date().toISOString(),
        completed_at: item.processed_at || null,
        product_name: item.products?.name || 'Unknown Product',
        product_sku: item.products?.sku || '',
        processor_name: item.processed_by || '',
        total_quantity: item.total_quantity || 0,
        warehouse_id: item.warehouse_id || '',
      };
    }) : [];

    return {
      data: processedData,
      count: totalCount || 0,
    };
  } catch (error) {
    console.error('Error fetching processed batches:', error);
    throw error;
  }
};

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
        processor:processed_by (name),
        warehouses:warehouse_id (name)
      `)
      .eq('id', batchId)
      .single();

    if (error) throw error;
    if (!data) return null;
    
    // Get processor name if available
    let processorName = "Unknown";
    if (data.processed_by) {
      try {
        const { data: profileData } = await supabase
          .from('profiles')
          .select('name')
          .eq('id', data.processed_by)
          .maybeSingle();
        
        if (profileData) {
          processorName = profileData.name || "Unknown";
        }
      } catch (error) {
        console.error("Error getting processor name:", error);
        // Continue execution even if we can't get the processor name
      }
    }

    // Get warehouse details if it exists
    let warehouseName = null;
    let locationDetails = {};

    if (data.warehouse_id) {
      try {
        const { data: warehouseData } = await supabase
          .from('warehouses')
          .select('name')
          .eq('id', data.warehouse_id)
          .single();

        if (warehouseData) {
          warehouseName = warehouseData.name;
        }
      } catch (error) {
        console.error("Error getting warehouse details:", error);
        // Continue execution even if we can't get the warehouse details
      }
    }

    return {
      id: data.id,
      product: {
        id: data.product_id,
        name: data.products?.name || 'Unknown Product',
        sku: data.products?.sku || ''
      },
      processed_by: processorName,
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
    refetchInterval: 5000,
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

export const useProcessedBatchDetails = (batchId: string | null) => {
  return useQuery({
    queryKey: ['processedBatchDetails', batchId],
    queryFn: () => fetchBatchDetails(batchId),
    enabled: !!batchId,
  });
};
