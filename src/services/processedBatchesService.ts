
import { supabase } from '@/integrations/supabase/client';
import { RawBatchData, ProcessedBatchesOptions } from '@/types/processedBatches';

/**
 * Fetches processed batches data from the database with filtering and pagination
 * @param options Query options including filters and pagination
 * @returns Query result with data, count and error if any
 */
export async function fetchProcessedBatchesData(options: ProcessedBatchesOptions) {
  const { 
    page = 1, 
    pageSize = 10, 
    productId, 
    warehouseId, 
    locationId, 
    startDate, 
    endDate, 
    searchTerm, 
    limit 
  } = options;

  // Build the query with all fields needed
  let query = supabase
    .from('processed_batches')
    .select(
      `
      id,
      product_id,
      stock_in_id,
      processed_by,
      processed_at,
      source,
      notes,
      status,
      total_quantity,
      total_boxes,
      warehouse_id,
      products (
        name,
        sku
      ),
      warehouses (
        name
      ),
      profiles (
        name
      )
    `,
      { count: 'exact' }
    )
    .order('processed_at', { ascending: false });

  // Apply filters
  if (productId) {
    query = query.eq('product_id', productId);
  }
  if (warehouseId) {
    query = query.eq('warehouse_id', warehouseId);
  }
  if (locationId) {
    query = query.eq('location_id', locationId);
  }
  if (startDate) {
    query = query.gte('processed_at', startDate);
  }
  if (endDate) {
    query = query.lte('processed_at', endDate);
  }
  if (searchTerm) {
    query = query.or(`source.ilike.%${searchTerm}%,id.ilike.%${searchTerm}%`);
  }

  // Apply pagination
  const actualLimit = limit || pageSize;
  const startIndex = (page - 1) * actualLimit;
  const endIndex = startIndex + actualLimit - 1;
  query = query.range(startIndex, endIndex);

  // Execute the query
  const { data, error, count } = await query;

  // Explicitly define the return type to avoid deep type instantiation
  type QueryResult = {
    data: RawBatchData[];
    error: any;
    count: number | null;
    page: number;
    actualLimit: number;
  };

  return {
    data: data as RawBatchData[],
    error,
    count,
    page,
    actualLimit
  } as QueryResult;
}
