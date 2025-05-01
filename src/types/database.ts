
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
}

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
  // Join fields
  product?: Product;
  warehouse?: Warehouse;
  warehouse_location?: WarehouseLocation;
}

export interface StockIn {
  id: string;
  product_id: string;
  submitted_by: string;
  processed_by: string | null;
  boxes: number;
  status: 'pending' | 'approved' | 'rejected' | 'completed' | 'processing';
  created_at: string;
  updated_at: string;
  // Join fields
  product?: Product;
  submitter?: Profile;
  processor?: Profile;
  details?: StockInDetail[];
}

export interface StockInDetail {
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
}

export interface StockOut {
  id: string;
  product_id: string;
  requested_by: string;
  approved_by: string | null;
  quantity: number;
  approved_quantity: number | null;
  destination: string;
  reason: string | null;
  status: 'pending' | 'approved' | 'rejected' | 'completed' | 'processing';
  invoice_number: string | null;
  packing_slip_number: string | null;
  verified_by: string | null;
  created_at: string;
  updated_at: string;
  // Join fields
  product?: Product;
  requester?: Profile;
  approver?: Profile;
  details?: StockOutDetail[];
}

export interface StockOutDetail {
  id: string;
  stock_out_id: string;
  inventory_id: string;
  quantity: number;
  created_at: string;
  updated_at: string;
}

export interface Profile {
  id: string;
  username: string;
  role: 'admin' | 'warehouse_manager' | 'field_operator';
  name: string | null;
  active: boolean;
  created_at: string;
  updated_at: string;
}
