import type { Product } from './database';

export interface ReserveStock {
  id: string;
  product_id: string;
  quantity: number;
  customer_id: string;
  start_date: string;
  end_date: string;
  status: 'pending' | 'active' | 'completed' | 'cancelled';
  created_at: string;
  updated_at: string;
}

export interface ReserveStockWithDetails extends ReserveStock {
  product: {
    id: string;
    name: string;
    sku: string;
  };
  customer: {
    id: string;
    name: string;
  };
}

export interface CreateReserveStockDTO {
  product_id: string;
  quantity: number;
  customer_id: string;
  start_date: string;
  end_date: string;
}

export interface ReservedItem {
  id: string;
  product: Product;
  quantity: number;
  customer: string;
  startDate: string;
  endDate: string;
  status: 'Active' | 'Expired' | 'Cancelled' | 'Processing Stock Out';
} 