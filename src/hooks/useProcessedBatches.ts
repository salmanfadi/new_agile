
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface ProcessedBatchType {
  id: string;
  stock_in_id: string;
  product_id: string;
  warehouse_id: string;
  status: string;
  processed_by: string;
  processed_at: string;
  total_boxes: number;
  total_quantity: number;
  source: string;
  notes: string;
  product: {
    id: string;
    name: string;
    sku: string;
    description?: string;
  };
  warehouse: {
    id: string;
    name: string;
    location?: string;
  };
  submitter: {
    id: string;
    name: string;
  };
  processor: {
    id: string;
    name: string;
  };
}

interface BatchItemType {
  id: string;
  batch_id: string;
  barcode: string;
  quantity: number;
  color?: string;
  size?: string;
  location_id?: string;
  warehouse_id?: string;
  created_at: string;
  locations?: {
    warehouse_id: string;
    floor?: number;
    zone?: string;
    position?: string;
    warehouse_name?: string;
  };
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
        warehouse:warehouse_id(*),
        submitter:submissions:stock_in_id(
          profiles:submitted_by(id, name)
        ),
        processor:profiles!processed_by(id, name)
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

    // Transform data to match the expected ProcessedBatchType format
    const transformedData: ProcessedBatchType[] = data.map(batch => {
      // Handle possible nested fields
      const submitterData = batch.submitter?.[0]?.profiles;
      const processorData = batch.processor;

      return {
        id: batch.id,
        stock_in_id: batch.stock_in_id,
        product_id: batch.product_id,
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
        } : { id: '', name: 'Unknown' },
        processor: processorData ? { 
          id: processorData.id || '',
          name: processorData.name || 'Unknown'
        } : { id: '', name: 'Unknown' }
      };
    });

    return transformedData;
  };

  return useQuery({
    queryKey: ['processedBatches', page, pageSize, filters],
    queryFn: fetchProcessedBatches
  });
};

export const useProcessedBatchDetails = (batchId: string) => {
  const fetchBatchDetails = async (): Promise<DetailedBatchType | null> => {
    // First fetch the batch details
    const { data: batchData, error: batchError } = await supabase
      .from('processed_batches')
      .select(`
        *,
        product:product_id(*),
        warehouse:warehouse_id(*),
        submitter:submissions:stock_in_id(
          profiles:submitted_by(id, name)
        ),
        processor:profiles!processed_by(id, name)
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

    // Transform the batch data similar to the above function
    const submitterData = batchData.submitter?.[0]?.profiles;
    const processorData = batchData.processor;

    // Then fetch the batch items
    const { data: itemsData, error: itemsError } = await supabase
      .from('batch_items')
      .select(`
        *,
        locations:location_id(
          warehouse_id,
          floor,
          zone,
          position,
          warehouse:warehouse_id(name)
        )
      `)
      .eq('batch_id', batchId);

    if (itemsError) {
      console.error('Error fetching batch items:', itemsError);
      throw itemsError;
    }

    const detailedBatch: DetailedBatchType = {
      id: batchData.id,
      stock_in_id: batchData.stock_in_id,
      product_id: batchData.product_id,
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
      } : { id: '', name: 'Unknown' },
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
