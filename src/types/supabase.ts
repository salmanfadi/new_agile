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
      inventory: {
        Row: {
          id: string
          product_id: string
          warehouse_id: string
          warehouse_location_id: string
          quantity: number
          barcode: string | null
          status: string
          last_updated_by: string
          last_updated_at: string
          created_at: string
          updated_at: string
          batch_id: string | null
          color: string | null
          size: string | null
        }
        Insert: {
          id?: string
          product_id: string
          warehouse_id: string
          warehouse_location_id: string
          quantity: number
          barcode?: string | null
          status?: string
          last_updated_by: string
          last_updated_at?: string
          created_at?: string
          updated_at?: string
          batch_id?: string | null
          color?: string | null
          size?: string | null
        }
        Update: {
          id?: string
          product_id?: string
          warehouse_id?: string
          warehouse_location_id?: string
          quantity?: number
          barcode?: string | null
          status?: string
          last_updated_by?: string
          last_updated_at?: string
          created_at?: string
          updated_at?: string
          batch_id?: string | null
          color?: string | null
          size?: string | null
        }
      }
      batch_operations: {
        Row: {
          id: string
          batch_number: string
          operation_type: string
          status: string
          source_warehouse_id: string | null
          destination_warehouse_id: string | null
          created_by: string
          created_at: string
          updated_at: string
          completed_at: string | null
          notes: string | null
        }
        Insert: {
          id?: string
          batch_number: string
          operation_type: string
          status?: string
          source_warehouse_id?: string | null
          destination_warehouse_id?: string | null
          created_by: string
          created_at?: string
          updated_at?: string
          completed_at?: string | null
          notes?: string | null
        }
        Update: {
          id?: string
          batch_number?: string
          operation_type?: string
          status?: string
          source_warehouse_id?: string | null
          destination_warehouse_id?: string | null
          created_by?: string
          created_at?: string
          updated_at?: string
          completed_at?: string | null
          notes?: string | null
        }
      }
      // Add other tables as needed
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}
