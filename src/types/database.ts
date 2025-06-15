
export interface Product {
  id: string;
  name: string;
  description?: string;
  sku?: string;
  category?: string;
  barcode?: string;
  unit?: string;
  gst_category?: string;
  hsn_code?: string;
  gst_rate?: number;
  specifications?: any;
  min_stock_level?: number;
  active?: boolean;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
  created_by?: string;
  updated_by?: string;
  image_url?: string;
  is_out_of_stock?: boolean;
  in_stock_quantity?: number;
  image_file?: File;
}

export interface CartItem {
  id: string;
  product_id: string;
  quantity: number;
  price: number;
  product: Product;
  requirements?: string;
}

export interface StockInRequestData {
  id: string;
  product: { name: string; id: string | null; sku?: string | null };
  submitter: { name: string; username: string; id: string | null } | null;
  boxes: number;
  status: "pending" | "approved" | "rejected" | "completed" | "processing";
  created_at: string;
  source: string;
  notes?: string;
  rejection_reason?: string;
}

export interface SalesInquiry {
  id: string;
  customer_name: string;
  customer_email: string;
  customer_phone?: string;
  customer_company: string;
  message?: string;
  status: 'new' | 'in_progress' | 'completed';
  created_at: string;
  updated_at?: string;
  items?: SalesInquiryItem[];
  converted_to_order?: boolean;
}

export interface SalesInquiryItem {
  id: string;
  product?: Product;
  quantity: number;
  specific_requirements?: string;
}

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  message?: string;
  read: boolean;
  created_at: string;
  updated_at: string;
}

export interface Warehouse {
  id: string;
  name: string;
  code?: string;
  address?: string;
  contact_person?: string;
  contact_phone?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  location?: string;
}

export interface WarehouseLocation {
  id: string;
  zone: string;
  floor?: string;
  warehouse_id: string;
  created_at: string;
  updated_at: string;
}

export interface Profile {
  id: string;
  name?: string;
  username: string;
  role?: string;
  active: boolean;
  created_at: string;
  updated_at: string;
}
