
/**
 * Types related to processed batches and inventory management
 */

// Basic processed batch information
export interface ProcessedBatch {
  id: string;
  product_id: string;
  stock_in_id: string;
  processed_by: string;
  processed_at: string | null;
  source: string;
  notes: string | null;
  status: string;
  total_quantity: number;
  total_boxes: number;
  warehouse_id: string;
  
  // Derived fields
  productName: string;
  productSku: string;
  warehouseName: string;
  processorName?: string;
  formattedProcessedAt: string;
  formattedCreatedAt: string;
  created_at: string;
}

// Options for fetching processed batches
export interface ProcessedBatchesOptions {
  page?: number;
  pageSize?: number;
  productId?: string;
  warehouseId?: string;
  locationId?: string;
  startDate?: string;
  endDate?: string;
  searchTerm?: string;
  limit?: number;
}

// Result type for paginated processed batches
export interface ProcessedBatchesResult {
  data: ProcessedBatch[];
  total: number;
  page: number;
  pageSize: number;
}

// Result type for the enhanced inventory view
export interface BatchesQueryResult {
  batches: Array<{
    id: string;
    product_name: string;
    product_sku?: string;
    warehouse_name: string;
    total_quantity: number;
    total_boxes: number;
    processor_name?: string;
    processed_at: string;
  }>;
  count: number;
  page: number;
  limit: number;
}

// Raw data from database before processing
export interface RawBatchData {
  id: string;
  product_id: string;
  stock_in_id: string;
  processed_by: string;
  processed_at: string | null;
  source: string;
  notes: string | null;
  status: string;
  total_quantity: number;
  total_boxes: number;
  warehouse_id: string;
  created_at?: string;
  products?: {
    name: string;
    sku?: string;
  };
  warehouses?: {
    name: string;
  };
  profiles?: {
    name?: string;
  } | null;
}
