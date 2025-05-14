
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
      .from('stock_in')
      .select(`
        id,
        product_id,
        submitted_by,
        processed_by,
        boxes,
        status,
        source,
        notes,
        created_at,
        completed_at,
        products:product_id (
          name,
          sku
        ),
        submitter:submitted_by (
          name
        ),
        processor:processed_by (
          name
        ),
        stock_in_details (
          id,
          quantity,
          warehouse_id,
          location_id,
          products:product_id (
            name
          )
        )
      `, { count: 'exact' })
      .eq('status', 'completed')
      .order('completed_at', { ascending: false });

    // Apply filters
    if (filters.searchTerm) {
      // Search across multiple fields
      const term = `%${filters.searchTerm}%`;
      query = query.or(`id.ilike.${term},products.name.ilike.${term},products.sku.ilike.${term}`);
    }

    if (filters.warehouse_id) {
      query = query.eq('stock_in_details.warehouse_id', filters.warehouse_id);
    }

    if (filters.location_id) {
      query = query.eq('stock_in_details.location_id', filters.location_id);
    }

    if (filters.fromDate) {
      query = query.gte('completed_at', filters.fromDate.toISOString());
    }

    if (filters.toDate) {
      const toDate = new Date(filters.toDate);
      toDate.setHours(23, 59, 59, 999);
      query = query.lte('completed_at', toDate.toISOString());
    }

    // Add pagination
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    // Execute the query
    const { data, error, count } = await query.range(from, to);

    if (error) throw error;

    // Transform the data
    const processedData = data.map((item: any) => {
      // Calculate total quantity across all boxes
      const totalQuantity = item.stock_in_details.reduce(
        (sum: number, detail: any) => sum + (detail.quantity || 0),
        0
      );

      // Get warehouse and location details from the first box
      // (assuming all boxes are stored in the same location)
      const firstBox = item.stock_in_details[0] || {};
      const warehouseId = firstBox.warehouse_id;
      const locationId = firstBox.location_id;

      return {
        id: item.id,
        product_id: item.product_id,
        submitted_by: item.submitted_by,
        processed_by: item.processed_by,
        boxes: item.boxes,
        status: item.status,
        source: item.source,
        notes: item.notes,
        created_at: item.created_at,
        completed_at: item.completed_at,
        product_name: item.products?.name || 'Unknown Product',
        product_sku: item.products?.sku || '',
        submitter_name: item.submitter?.name || 'Unknown Submitter',
        processor_name: item.processor?.name || 'Unknown Processor',
        total_quantity: totalQuantity,
        warehouse_id: warehouseId,
        location_id: locationId,
      };
    });

    return {
      data: processedData,
      count: count || 0,
    };
  } catch (error) {
    console.error('Error fetching processed batches:', error);
    throw error;
  }
};

const fetchBatchDetails = async (batchId: string): Promise<ProcessedBatchType | null> => {
  try {
    const { data, error } = await supabase
      .from('stock_in')
      .select(`
        id,
        product_id,
        submitted_by,
        processed_by,
        boxes,
        status,
        source,
        notes,
        created_at,
        completed_at,
        products:product_id (
          name,
          sku,
          description
        ),
        submitter:submitted_by (
          name
        ),
        processor:processed_by (
          name
        ),
        stock_in_details (
          id,
          quantity,
          warehouse_id,
          location_id
        )
      `)
      .eq('id', batchId)
      .single();

    if (error) throw error;
    if (!data) return null;

    // Calculate total quantity
    const totalQuantity = data.stock_in_details.reduce(
      (sum: number, detail: any) => sum + (detail.quantity || 0),
      0
    );

    // Get warehouse and location details from the first box
    const firstBox = data.stock_in_details[0] || {};
    const warehouseId = firstBox.warehouse_id;
    const locationId = firstBox.location_id;

    // Fetch warehouse and location details if they exist
    let warehouseName = null;
    let locationDetails = {};

    if (warehouseId) {
      const { data: warehouseData, error: warehouseError } = await supabase
        .from('warehouses')
        .select('name')
        .eq('id', warehouseId)
        .single();

      if (!warehouseError && warehouseData) {
        warehouseName = warehouseData.name;
      }
    }

    if (locationId) {
      const { data: locationData, error: locationError } = await supabase
        .from('warehouse_locations')
        .select('floor, zone, position')
        .eq('id', locationId)
        .single();

      if (!locationError && locationData) {
        locationDetails = {
          floor: locationData.floor,
          zone: locationData.zone,
          position: locationData.position
        };
      }
    }

    return {
      id: data.id,
      product_id: data.product_id,
      submitted_by: data.submitted_by,
      processed_by: data.processed_by,
      boxes: data.boxes,
      status: data.status,
      source: data.source,
      notes: data.notes,
      created_at: data.created_at,
      completed_at: data.completed_at,
      product_name: data.products?.name || 'Unknown Product',
      product_sku: data.products?.sku || '',
      submitter_name: data.submitter?.name || 'Unknown Submitter',
      processor_name: data.processor?.name || 'Unknown Processor',
      total_quantity: totalQuantity,
      warehouse_id: warehouseId,
      location_id: locationId,
      warehouse_name: warehouseName,
      location_details: locationDetails,
    };
  } catch (error) {
    console.error('Error fetching batch details:', error);
    throw error;
  }
};

const fetchBatchItems = async (batchId: string): Promise<BoxItemType[]> => {
  try {
    const { data, error } = await supabase
      .from('stock_in_details')
      .select(`
        id,
        stock_in_id,
        barcode,
        quantity,
        color,
        size,
        warehouse_id,
        location_id,
        product_id,
        products:product_id (
          name,
          sku, 
          description
        ),
        warehouses:warehouse_id (
          name
        ),
        locations:location_id (
          floor,
          zone,
          position
        )
      `)
      .eq('stock_in_id', batchId);

    if (error) throw error;

    const items: BoxItemType[] = data.map((item: any) => ({
      id: item.id,
      stock_in_id: item.stock_in_id,
      barcode: item.barcode,
      quantity: item.quantity,
      color: item.color,
      size: item.size,
      warehouse_id: item.warehouse_id,
      location_id: item.location_id,
      product_id: item.product_id,
      product_name: item.products?.name || 'Unknown Product',
      product_sku: item.products?.sku || '',
      product_description: item.products?.description || null,
      warehouse_name: item.warehouses?.name || null,
      zone: item.locations?.zone || null,
      floor: item.locations?.floor || null,
      position: item.locations?.position || null,
    }));

    return items;
  } catch (error) {
    console.error('Error fetching batch items:', error);
    throw error;
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
