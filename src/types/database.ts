import { DateRange } from 'react-day-picker';

export interface Warehouse {
  id: string;
  name: string;
  location: string | null;
  created_at: string;
  updated_at: string;
}

export interface WarehouseLocation {
  id: string;
  warehouse_id: string;
  name: string;
  description: string | null;
  created_at: string;
}

export interface Product {
  id: string;
  name: string;
  sku: string;
  category: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  created_by: string;
  updated_by: string;
  description: string;
}

// Updated enums to match PostgreSQL types
export type InventoryStatus = 'available' | 'reserved' | 'sold' | 'damaged';
export type BatchStatus = 'completed' | 'processing' | 'failed' | 'cancelled';
export type StockStatus = 'pending' | 'approved' | 'rejected' | 'completed';
export type TransferStatus = 'pending' | 'approved' | 'rejected' | 'in_transit' | 'completed' | 'cancelled';
export type MovementType = 'in' | 'out' | 'transfer' | 'adjustment' | 'reserve' | 'release'; 
export type MovementStatus = 'pending' | 'approved' | 'rejected' | 'in_transit';

export interface Inventory {
  id: string;
  barcode: string;
  product_id: string;
  quantity: number;
  box_id?: string;
  batch_id?: string;
  product?: Product;
  location_id: string;
  warehouse_id: string;
  warehouse_location_id: string;
  status: string;
  created_at: string;
}

export interface StockInRequest {
  id: string;
  product_id: string;
  submitted_by: string;
  processed_by: string | null;
  boxes: number;
  status: StockStatus;
  created_at: string;
  updated_at: string;
  source: string;
  notes: string | null;
  created_by?: string | null;
  updated_by?: string | null;
  rejection_reason?: string | null;
  // Join fields
  product?: Product;
  submitter?: Profile;
  processor?: Profile;
  details?: StockInItem[];
}

export interface StockInItem {
  id: string;
  stock_in_id: string;
  inventory_id: string | null;
  barcode: string;
  quantity: number;
  color: string | null;
  size: string | null;
  warehouse_id: string;
  location_id: string;
  created_at: string;
  updated_at: string;
  created_by?: string | null;
  updated_by?: string | null;
  product_id?: string;
}

// Interface for processed batches
export interface ProcessedBatch {
  id: string;
  created_at: string;
  processed_at: string;
  processed_by: string;
  submitted_by: string;
  product_id: string;
  total_quantity: number;
  total_boxes: number;
  status: string;
  notes: string;
  warehouse_id: string;
  source: string;
  product_name: string;
}

// Interface for batch items
export interface BatchItem {
  id: string;
  batch_id: string;
  product_id: string;
  quantity: number;
  product?: Product;
}

export interface StockOutRequest {
  id: string;
  created_at: string;
  requested_by: string;
  approved_by?: string;
  status: StockStatus;
  destination: string;
  notes?: string;
  type: 'batch' | 'box' | 'item';
  batch_id?: string;
  box_ids?: string[];
  product?: Product;
  quantity: number;
  requester?: Profile;
  approver?: Profile;
}

export interface StockOutItem {
  id: string;
  stock_out_id: string;
  inventory_id: string;
  quantity: number;
  created_at: string;
  updated_at: string;
  created_by?: string | null;
  updated_by?: string | null;
}

export interface Profile {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'warehouse_manager' | 'field_operator';
}

export interface InventoryTransfer {
  id: string;
  source_warehouse_id: string;
  source_location_id: string;
  destination_warehouse_id: string;
  destination_location_id: string;
  product_id: string;
  quantity: number;
  status: TransferStatus;
  transfer_reason?: string | null;
  notes?: string | null;
  initiated_by: string;
  approved_by?: string | null;
  created_at: string;
  updated_at: string;
  created_by?: string | null;
  updated_by?: string | null;
  // Join fields
  products?: Product;
  source_warehouse?: Warehouse;
  source_location?: WarehouseLocation;
  destination_warehouse?: Warehouse;
  destination_location?: WarehouseLocation;
  initiator?: Profile;
  approver?: Profile;
}

export interface SalesInquiry {
  id: string;
  customer_name: string;
  customer_email: string;
  notes: string;
  product_id: string;
  quantity: number;
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  created_at: string;
  updated_at: string;
  user_id: string;
  items?: SalesInquiryItem[];
}

export interface SalesInquiryItem {
  id: string;
  inquiry_id: string;
  product_id: string;
  quantity: number;
  created_at: string;
  product?: Product;
}

export interface CartItem {
  productId: string;
  product: Product;
  quantity: number;
  requirements?: string;
}

export interface InventoryMovement {
  id: string;
  product_id: string;
  warehouse_id: string;
  location_id: string;
  movement_type: MovementType;
  quantity: number;
  status: MovementStatus;
  reference_table?: string;
  reference_id?: string;
  performed_by: string;
  created_at: string;
  transfer_reference_id?: string;
  details?: {
    [key: string]: any;
    barcode?: string;
    color?: string;
    size?: string;
    source?: string;
    notes?: string;
    direction?: 'in' | 'out';
    from_warehouse_id?: string;
    from_location_id?: string;
    to_warehouse_id?: string;
    to_location_id?: string;
  };
  
  // Join fields
  products?: {
    name: string;
    sku?: string;
  };
  warehouse?: {
    name: string;
    location?: string;
  };
  location?: {
    floor: number;
    zone: string;
  };
  performer?: {
    name: string;
    username: string;
  };
}

// Interface for batch items with barcodes view
export interface BatchItemWithBarcode {
  id: string;
  batch_id: string;
  product_id: string;
  warehouse_id: string;
  location_id: string;
  barcode_id: string;
  barcode: string;
  color: string | null;
  size: string | null;
  quantity: number;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface InventoryProduct {
  id: string;
  name: string;
  sku: string;
  category: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  created_by: string;
  updated_by: string;
  description: string;
}
