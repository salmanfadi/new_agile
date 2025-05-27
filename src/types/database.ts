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
  floor: number;
  zone: string;
  created_at: string;
  updated_at: string;
}

export interface Product {
  id: string;
  name: string;
  description: string | null;
  created_at: string;
  updated_at: string;
  image_url?: string | null;
  sku?: string | null;
  specifications?: string | null;
  is_active?: boolean;
  in_stock_quantity?: number;
  is_out_of_stock?: boolean;
  category?: string | null;
}

// Updated enums to match PostgreSQL types
export type InventoryStatus = 'available' | 'reserved' | 'sold' | 'damaged';
export type BatchStatus = 'completed' | 'processing' | 'failed' | 'cancelled';
export type StockStatus = 'pending' | 'approved' | 'rejected' | 'completed' | 'processing' | 'failed';
export type TransferStatus = 'pending' | 'approved' | 'rejected' | 'in_transit' | 'completed' | 'cancelled';
export type MovementType = 'in' | 'out' | 'transfer' | 'adjustment' | 'reserve' | 'release'; 
export type MovementStatus = 'pending' | 'approved' | 'rejected' | 'in_transit';

export interface Inventory {
  id: string;
  product_id: string;
  warehouse_id: string;
  location_id: string;
  barcode: string;
  quantity: number;
  color: string | null;
  size: string | null;
  created_at: string;
  updated_at: string;
  status: InventoryStatus;
  batch_id: string | null;
  created_by?: string | null;
  updated_by?: string | null;
  // Join fields
  product?: Product;
  warehouse?: Warehouse;
  warehouse_location?: WarehouseLocation;
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
  stock_in_id: string;
  processed_by: string;
  processed_at: string;
  product_id: string;
  total_quantity: number;
  total_boxes: number;
  warehouse_id: string;
  status: string;
  notes?: string;
  source?: string;
  created_at: string;
  // Additional properties for UI display
  productName?: string;
  productSku?: string;
  warehouseName?: string;
  processorName?: string;
  formattedProcessedAt?: string;
  formattedCreatedAt?: string;
}

// Interface for batch items
export interface BatchItem {
  id: string;
  batch_id: string;
  barcode: string;
  quantity: number;
  color: string | null;
  size: string | null;
  warehouse_id: string;
  location_id: string;
  status: InventoryStatus;
  created_at: string;
  updated_at?: string;
  created_by?: string | null;
  updated_by?: string | null;
  // Join fields
  warehouse?: Warehouse;
  location?: WarehouseLocation;
}

export interface StockOutRequest {
  id: string;
  product_id: string;
  requested_by: string;
  approved_by: string | null;
  quantity: number;
  approved_quantity: number | null;
  destination: string;
  reason: string | null;
  status: StockStatus;
  invoice_number: string | null;
  packing_slip_number: string | null;
  verified_by: string | null;
  created_at: string;
  updated_at: string;
  created_by?: string | null;
  updated_by?: string | null;
  // Join fields
  product?: Product;
  requester?: Profile;
  approver?: Profile;
  details?: StockOutItem[];
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
  username: string;
  role: 'admin' | 'warehouse_manager' | 'field_operator' | 'sales_operator' | 'customer';
  name: string | null;
  active: boolean;
  created_at: string;
  updated_at: string;
  company_name?: string | null;
  gstin?: string | null;
  phone?: string | null;
  business_type?: string | null;
  address?: string | null;
  business_reg_number?: string | null;
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
  customer_company: string;
  customer_phone: string | null;
  message: string | null;
  status: string;
  created_at: string;
  updated_at: string;
  items?: SalesInquiryItem[];
}

export interface SalesInquiryItem {
  id: string;
  inquiry_id: string;
  product_id: string;
  quantity: number;
  specific_requirements: string | null;
  created_at: string;
  updated_at: string;
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
