
import { RawBatchData, ProcessedBatch, BatchesQueryResult } from '@/types/processedBatches';

/**
 * Transforms raw batch data into the format needed for enhanced inventory view
 * @param rawData Raw batch data from the database
 * @param page Current page number
 * @param limit Limit per page
 * @returns Formatted data for enhanced inventory view
 */
export function transformToEnhancedView(
  rawData: RawBatchData[],
  page: number,
  limit: number,
  count: number
): BatchesQueryResult {
  const batchesFormatted = rawData.map(batch => ({
    id: batch.id,
    product_name: batch.products?.name || 'Unknown Product',
    product_sku: batch.products?.sku,
    warehouse_name: batch.warehouses?.name || 'Unknown Warehouse',
    total_quantity: batch.total_quantity,
    total_boxes: batch.total_boxes,
    processor_name: batch.profiles?.name,
    processed_at: batch.processed_at || new Date().toISOString()
  }));

  return {
    batches: batchesFormatted,
    count: count || 0,
    page,
    limit
  };
}

/**
 * Transforms raw batch data into processed batch format
 * @param rawData Raw batch data from the database
 * @returns Processed batch objects
 */
export function transformToProcessedBatches(rawData: RawBatchData[]): ProcessedBatch[] {
  return rawData.map(batch => {
    const formattedBatch: ProcessedBatch = {
      id: batch.id,
      product_id: batch.product_id,
      stock_in_id: batch.stock_in_id,
      processed_by: batch.processed_by,
      processed_at: batch.processed_at,
      source: batch.source,
      notes: batch.notes,
      status: batch.status,
      total_quantity: batch.total_quantity,
      total_boxes: batch.total_boxes,
      warehouse_id: batch.warehouse_id,
      productName: batch.products?.name || 'Unknown Product',
      productSku: batch.products?.sku || 'N/A',
      warehouseName: batch.warehouses?.name || 'Unknown Warehouse',
      processorName: batch.profiles?.name || undefined,
      formattedProcessedAt: batch.processed_at 
        ? new Date(batch.processed_at).toLocaleDateString() 
        : '',
      formattedCreatedAt: batch.created_at 
        ? new Date(batch.created_at).toLocaleDateString() 
        : '',
      created_at: batch.created_at || new Date().toISOString()
    };
    
    return formattedBatch;
  });
}
