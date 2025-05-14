
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface BatchItemType {
  id: string;
  batch_id: string;
  barcode: string;
  quantity: number;
  color?: string | null;
  size?: string | null;
  location_id?: string | null;
  warehouse_id?: string | null;
  created_at: string;
  status: string;
  warehouses?: {
    name: string;
  };
  locations?: {
    warehouse_id: string;
    floor?: number;
    zone?: string;
    position?: string;
    warehouse_name?: string;
  };
}

export interface ProcessedBatchType {
  id: string;
  stock_in_id: string;
  product_id: string;
  warehouse_id: string | null;
  status: string;
  processed_by: string;
  processed_at: string;
  total_boxes: number;
  total_quantity: number;
  source: string | null;
  notes: string | null;
  product: {
    id: string;
    name: string;
    sku?: string | null;
    description?: string | null;
  };
  warehouse: {
    id: string;
    name: string;
    location?: string | null;
  };
  submitter?: {
    id: string;
    name: string;
  };
  processor: {
    id: string;
    name: string | null;
  };
  items?: BatchItemType[];
}

export interface DetailedBatchType extends ProcessedBatchType {
  items: BatchItemType[];
}

export const useProcessedBatches = (page = 1, pageSize = 10, filters: Record<string, any> = {}) => {
  const fetchProcessedBatches = async (): Promise<ProcessedBatchType[]> => {
    let query = supabase
      .from('processed_batches')
      .select(`
        *,
        product:product_id(*),
        warehouse:warehouse_id(*)
      `)
      .order('processed_at', { ascending: false })
      .range((page - 1) * pageSize, page * pageSize - 1);

    // Apply filters if any
    if (filters.status) {
      query = query.eq('status', filters.status);
    }
    
    if (filters.product_id) {
      query = query.eq('product_id', filters.product_id);
    }
    
    if (filters.warehouse_id) {
      query = query.eq('warehouse_id', filters.warehouse_id);
    }
    
    if (filters.date_from) {
      query = query.gte('processed_at', filters.date_from);
    }
    
    if (filters.date_to) {
      query = query.lte('processed_at', filters.date_to);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching processed batches:', error);
      throw error;
    }

    if (!data) return [];

    // Get processor details for each batch
    const processedBatches: ProcessedBatchType[] = await Promise.all(
      data.map(async (batch) => {
        // Get processor details
        const { data: processorData } = await supabase
          .from('profiles')
          .select('id, name')
          .eq('id', batch.processed_by)
          .single();

        // Get submitter details if stock_in_id exists
        let submitterData = null;
        if (batch.stock_in_id) {
          const { data: stockInData } = await supabase
            .from('stock_in')
            .select('submitted_by')
            .eq('id', batch.stock_in_id)
            .single();

          if (stockInData) {
            const { data: submitter } = await supabase
              .from('profiles')
              .select('id, name')
              .eq('id', stockInData.submitted_by)
              .single();
            
            submitterData = submitter;
          }
        }

        return {
          id: batch.id,
          stock_in_id: batch.stock_in_id || '',
          product_id: batch.product_id || '',
          warehouse_id: batch.warehouse_id,
          status: batch.status,
          processed_by: batch.processed_by,
          processed_at: batch.processed_at,
          total_boxes: batch.total_boxes,
          total_quantity: batch.total_quantity,
          source: batch.source,
          notes: batch.notes,
          product: batch.product || { id: '', name: 'Unknown', sku: '' },
          warehouse: batch.warehouse || { id: '', name: 'Unknown' },
          submitter: submitterData ? { 
            id: submitterData.id || '',
            name: submitterData.name || 'Unknown'
          } : undefined,
          processor: processorData ? { 
            id: processorData.id || '',
            name: processorData.name || 'Unknown'
          } : { id: '', name: 'Unknown' }
        };
      })
    );

    return processedBatches;
  };

  return useQuery({
    queryKey: ['processedBatches', page, pageSize, filters],
    queryFn: fetchProcessedBatches
  });
};

// Add the useBatchItems hook for batch details
export const useBatchItems = (batchId: string | null) => {
  const fetchBatchItems = async (): Promise<BatchItemType[]> => {
    if (!batchId) return [];

    const { data, error } = await supabase
      .from('batch_items')
      .select(`
        *,
        warehouses:warehouse_id(name),
        locations:location_id(
          warehouse_id,
          floor,
          zone,
          position
        )
      `)
      .eq('batch_id', batchId);

    if (error) {
      console.error('Error fetching batch items:', error);
      throw error;
    }

    return data || [];
  };

  return useQuery({
    queryKey: ['batchItems', batchId],
    queryFn: fetchBatchItems,
    enabled: !!batchId
  });
};

export const useProcessedBatchDetails = (batchId: string | null) => {
  const fetchBatchDetails = async (): Promise<DetailedBatchType | null> => {
    if (!batchId) return null;
    
    // First fetch the batch details
    const { data: batchData, error: batchError } = await supabase
      .from('processed_batches')
      .select(`
        *,
        product:product_id(*),
        warehouse:warehouse_id(*)
      `)
      .eq('id', batchId)
      .single();

    if (batchError) {
      console.error('Error fetching batch details:', batchError);
      throw batchError;
    }

    if (!batchData) {
      return null;
    }

    // Get processor details
    const { data: processorData } = await supabase
      .from('profiles')
      .select('id, name')
      .eq('id', batchData.processed_by)
      .single();

    // Get submitter details if stock_in_id exists
    let submitterData = null;
    if (batchData.stock_in_id) {
      const { data: stockInData } = await supabase
        .from('stock_in')
        .select('submitted_by')
        .eq('id', batchData.stock_in_id)
        .single();

      if (stockInData) {
        const { data: submitter } = await supabase
          .from('profiles')
          .select('id, name')
          .eq('id', stockInData.submitted_by)
          .single();
        
        submitterData = submitter;
      }
    }

    // Then fetch the batch items
    const { data: itemsData } = await useBatchItems(batchId).queryFn();

    const detailedBatch: DetailedBatchType = {
      id: batchData.id,
      stock_in_id: batchData.stock_in_id || '',
      product_id: batchData.product_id || '',
      warehouse_id: batchData.warehouse_id,
      status: batchData.status,
      processed_by: batchData.processed_by,
      processed_at: batchData.processed_at,
      total_boxes: batchData.total_boxes,
      total_quantity: batchData.total_quantity,
      source: batchData.source,
      notes: batchData.notes,
      product: batchData.product || { id: '', name: 'Unknown', sku: '' },
      warehouse: batchData.warehouse || { id: '', name: 'Unknown' },
      submitter: submitterData ? { 
        id: submitterData.id || '',
        name: submitterData.name || 'Unknown'
      } : undefined,
      processor: processorData ? { 
        id: processorData.id || '',
        name: processorData.name || 'Unknown'
      } : { id: '', name: 'Unknown' },
      items: itemsData || []
    };

    return detailedBatch;
  };

  return useQuery({
    queryKey: ['processedBatch', batchId],
    queryFn: fetchBatchDetails,
    enabled: !!batchId
  });
};

export const useProcessedBatchCount = (filters: Record<string, any> = {}) => {
  const fetchBatchCount = async (): Promise<number> => {
    let query = supabase
      .from('processed_batches')
      .select('id', { count: 'exact', head: true });

    // Apply the same filters as the main query
    if (filters.status) {
      query = query.eq('status', filters.status);
    }
    
    if (filters.product_id) {
      query = query.eq('product_id', filters.product_id);
    }
    
    if (filters.warehouse_id) {
      query = query.eq('warehouse_id', filters.warehouse_id);
    }
    
    if (filters.date_from) {
      query = query.gte('processed_at', filters.date_from);
    }
    
    if (filters.date_to) {
      query = query.lte('processed_at', filters.date_to);
    }

    const { count, error } = await query;

    if (error) {
      console.error('Error fetching batch count:', error);
      throw error;
    }

    return count || 0;
  };

  return useQuery({
    queryKey: ['processedBatchCount', filters],
    queryFn: fetchBatchCount
  });
};
