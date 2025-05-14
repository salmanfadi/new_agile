
import { Profile, Product, Warehouse, WarehouseLocation } from '@/types/database';

export interface BatchData {
  id?: string;
  product_id: string;
  warehouse_id: string;
  location_id: string;
  boxes_count: number;
  quantity_per_box: number;
  color?: string;
  size?: string;
  created_by: string;
  barcodes?: string[];
}

export interface BatchFormData {
  product: Product | null;
  warehouse: Warehouse | null;
  location: WarehouseLocation | null;
  boxes_count: number;
  quantity_per_box: number;
  color: string;
  size: string;
}

export interface ProcessedBatch extends BatchData {
  product?: Product;
  warehouse?: Warehouse;
  warehouseLocation?: WarehouseLocation;
  submitter?: Profile;
  created_at?: string;
}

export interface StockInBatchSubmission {
  stockInId?: string;
  productId: string;
  source: string;
  notes?: string;
  submittedBy: string;
  batches: BatchData[];
}
