import { Product, Profile } from './database';

export type StockInStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'approved' | 'rejected';
export type StockInDetailStatus = 'pending' | 'processing' | 'completed' | 'failed';
export type InventoryStatus = 'available' | 'reserved' | 'sold' | 'damaged';

export interface StockInDetail {
  id: string;
  stock_in_id: string;
  warehouse_id: string;
  location_id: string;
  barcode: string;
  quantity: number;
  color?: string;
  size?: string;
  product_id: string;
  status: StockInDetailStatus;
  batch_number?: string;
  processing_order?: number;
  processed_at?: string;
  created_at?: string;
  updated_at?: string;
  error_message?: string;
}

export interface Inventory {
  id: string;
  product_id: string;
  warehouse_id: string;
  location_id: string;
  barcode: string;
  quantity: number;
  color?: string;
  size?: string;
  status: InventoryStatus;
  batch_id: string;
  created_at?: string;
  updated_at?: string;
}

export interface BatchStockInData {
  number_of_boxes: number;
  quantity_per_box: number;
  warehouse_id: string;
  location_id: string;
  color?: string;
  size?: string;
}

export interface StockIn {
  id: string;
  product_id: string;
  source: string;
  notes?: string;
  status: StockInStatus;
  submitted_by: string;
  processed_by?: string;
  batch_id?: string;
  processing_started_at?: string;
  processing_completed_at?: string;
  created_at?: string;
  updated_at?: string;
}

export interface StockInData {
  id: string;
  product: Product;
  boxes: number;
  source: string;
  notes: string;
  submitter: Profile;
  status: StockInStatus;
  created_at: string;
}
