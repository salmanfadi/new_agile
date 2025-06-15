
import type { Product } from './products';

export interface CustomerInquiry {
  id: string;
  customer_name: string;
  customer_email: string;
  customer_company: string;
  customer_phone: string | null;
  status: 'new' | 'in_progress' | 'completed';
  notes: string | null;
  converted_to_order: boolean;
  created_at: string;
  updated_at: string;
  items?: CustomerInquiryItem[];
  message?: string | null; // Optional for compatibility with SalesInquiry
}

export interface CustomerInquiryItem {
  id: string;
  inquiry_id: string;
  product_id: string | null;
  quantity: number;
  price: number | null;
  specific_requirements: string | null;
  created_at: string;
  product?: Product | null;
}

export interface SalesInquiry {
  id: string;
  customer_name: string;
  customer_email: string;
  customer_company: string;
  customer_phone: string | null;
  status: 'new' | 'in_progress' | 'completed';
  message: string | null; // Required for SalesInquiry
  notes: string | null; // Added to match CustomerInquiry
  converted_to_order: boolean;
  created_at: string;
  updated_at: string;
  items?: SalesInquiryItem[];
}

export interface SalesInquiryItem {
  id: string;
  inquiry_id: string;
  product_id: string | null;
  quantity: number;
  specific_requirements: string | null;
  created_at: string;
  product?: Product | null;
}
