export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      stock_in: {
        Row: {
          id: string;
          product_id: string;
          source: string;
          notes: string | null;
          status: 'pending' | 'processing' | 'completed' | 'failed';
          submitted_by: string;
          processed_by: string | null;
          batch_id: string | null;
          processing_started_at: string | null;
          processing_completed_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          product_id: string;
          source: string;
          notes?: string | null;
          status?: 'pending' | 'processing' | 'completed' | 'failed';
          submitted_by: string;
          processed_by?: string | null;
          batch_id?: string | null;
          processing_started_at?: string | null;
          processing_completed_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          product_id?: string;
          source?: string;
          notes?: string | null;
          status?: 'pending' | 'processing' | 'completed' | 'failed';
          submitted_by?: string;
          processed_by?: string | null;
          batch_id?: string | null;
          processing_started_at?: string | null;
          processing_completed_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      stock_in_details: {
        Row: {
          id: string;
          stock_in_id: string;
          warehouse_id: string;
          location_id: string;
          barcode: string;
          quantity: number;
          color: string | null;
          size: string | null;
          product_id: string;
          status: 'pending' | 'processing' | 'completed' | 'failed';
          batch_number: string | null;
          processing_order: number | null;
          processed_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          stock_in_id: string;
          warehouse_id: string;
          location_id: string;
          barcode: string;
          quantity: number;
          color?: string | null;
          size?: string | null;
          product_id: string;
          status?: 'pending' | 'processing' | 'completed' | 'failed';
          batch_number?: string | null;
          processing_order?: number | null;
          processed_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          stock_in_id?: string;
          warehouse_id?: string;
          location_id?: string;
          barcode?: string;
          quantity?: number;
          color?: string | null;
          size?: string | null;
          product_id?: string;
          status?: 'pending' | 'processing' | 'completed' | 'failed';
          batch_number?: string | null;
          processing_order?: number | null;
          processed_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      inventory: {
        Row: {
          id: string;
          product_id: string;
          warehouse_id: string;
          location_id: string;
          barcode: string;
          quantity: number;
          color: string | null;
          size: string | null;
          status: 'available' | 'reserved' | 'sold' | 'damaged';
          batch_id: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          product_id: string;
          warehouse_id: string;
          location_id: string;
          barcode: string;
          quantity: number;
          color?: string | null;
          size?: string | null;
          status?: 'available' | 'reserved' | 'sold' | 'damaged';
          batch_id: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          product_id?: string;
          warehouse_id?: string;
          location_id?: string;
          barcode?: string;
          quantity?: number;
          color?: string | null;
          size?: string | null;
          status?: 'available' | 'reserved' | 'sold' | 'damaged';
          batch_id?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      locations: {
        Row: {
          id: string;
          warehouse_id: string;
          name: string;
          description: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          warehouse_id: string;
          name: string;
          description?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          warehouse_id?: string;
          name?: string;
          description?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      warehouses: {
        Row: {
          id: string;
          name: string;
          description: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          description?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          description?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      warehouse_locations: {
        Row: {
          id: string;
          warehouse_id: string;
          floor: number;
          zone: string;
          description: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          warehouse_id: string;
          floor: number;
          zone: string;
          description?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          warehouse_id?: string;
          floor?: number;
          zone?: string;
          description?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
    };
  };
}

export type Location = Database['public']['Tables']['locations']['Row'];
export type Warehouse = Database['public']['Tables']['warehouses']['Row'];
export type WarehouseLocation = Database['public']['Tables']['warehouse_locations']['Row'];
