export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      batch_items: {
        Row: {
          barcode: string
          batch_id: string | null
          color: string | null
          created_at: string | null
          id: string
          location_id: string | null
          quantity: number
          size: string | null
          status: string
          warehouse_id: string | null
        }
        Insert: {
          barcode: string
          batch_id?: string | null
          color?: string | null
          created_at?: string | null
          id?: string
          location_id?: string | null
          quantity: number
          size?: string | null
          status?: string
          warehouse_id?: string | null
        }
        Update: {
          barcode?: string
          batch_id?: string | null
          color?: string | null
          created_at?: string | null
          id?: string
          location_id?: string | null
          quantity?: number
          size?: string | null
          status?: string
          warehouse_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "batch_items_batch_id_fkey"
            columns: ["batch_id"]
            isOneToOne: false
            referencedRelation: "processed_batches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "batch_items_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "warehouse_locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "batch_items_warehouse_id_fkey"
            columns: ["warehouse_id"]
            isOneToOne: false
            referencedRelation: "warehouses"
            referencedColumns: ["id"]
          },
        ]
      }
      inventory: {
        Row: {
          barcode: string
          batch_id: string | null
          color: string | null
          created_at: string
          id: string
          location_id: string
          product_id: string
          quantity: number
          size: string | null
          status: string
          stock_in_detail_id: string | null
          stock_in_id: string | null
          updated_at: string
          warehouse_id: string
        }
        Insert: {
          barcode: string
          batch_id?: string | null
          color?: string | null
          created_at?: string
          id?: string
          location_id: string
          product_id: string
          quantity?: number
          size?: string | null
          status?: string
          stock_in_detail_id?: string | null
          stock_in_id?: string | null
          updated_at?: string
          warehouse_id: string
        }
        Update: {
          barcode?: string
          batch_id?: string | null
          color?: string | null
          created_at?: string
          id?: string
          location_id?: string
          product_id?: string
          quantity?: number
          size?: string | null
          status?: string
          stock_in_detail_id?: string | null
          stock_in_id?: string | null
          updated_at?: string
          warehouse_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_inventory_batch_id"
            columns: ["batch_id"]
            isOneToOne: false
            referencedRelation: "processed_batches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_inventory_location"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "warehouse_locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_inventory_product"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "product_inventory_summary"
            referencedColumns: ["product_id"]
          },
          {
            foreignKeyName: "fk_inventory_product"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_inventory_stock_in"
            columns: ["stock_in_id"]
            isOneToOne: false
            referencedRelation: "stock_in"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_inventory_stock_in_detail_id"
            columns: ["stock_in_detail_id"]
            isOneToOne: false
            referencedRelation: "stock_in_details"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_inventory_warehouse"
            columns: ["warehouse_id"]
            isOneToOne: false
            referencedRelation: "warehouses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "warehouse_locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "product_inventory_summary"
            referencedColumns: ["product_id"]
          },
          {
            foreignKeyName: "inventory_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_stock_in_detail_id_fkey"
            columns: ["stock_in_detail_id"]
            isOneToOne: false
            referencedRelation: "stock_in_details"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_stock_in_id_fkey"
            columns: ["stock_in_id"]
            isOneToOne: false
            referencedRelation: "stock_in"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_warehouse_id_fkey"
            columns: ["warehouse_id"]
            isOneToOne: false
            referencedRelation: "warehouses"
            referencedColumns: ["id"]
          },
        ]
      }
      inventory_movements: {
        Row: {
          created_at: string
          details: Json | null
          id: string
          location_id: string
          movement_type: Database["public"]["Enums"]["movement_type"]
          performed_by: string
          product_id: string
          quantity: number
          reference_id: string | null
          reference_table: string | null
          status: Database["public"]["Enums"]["movement_status"]
          transfer_reference_id: string | null
          warehouse_id: string
        }
        Insert: {
          created_at?: string
          details?: Json | null
          id?: string
          location_id: string
          movement_type: Database["public"]["Enums"]["movement_type"]
          performed_by: string
          product_id: string
          quantity: number
          reference_id?: string | null
          reference_table?: string | null
          status?: Database["public"]["Enums"]["movement_status"]
          transfer_reference_id?: string | null
          warehouse_id: string
        }
        Update: {
          created_at?: string
          details?: Json | null
          id?: string
          location_id?: string
          movement_type?: Database["public"]["Enums"]["movement_type"]
          performed_by?: string
          product_id?: string
          quantity?: number
          reference_id?: string | null
          reference_table?: string | null
          status?: Database["public"]["Enums"]["movement_status"]
          transfer_reference_id?: string | null
          warehouse_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "inventory_movements_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "warehouse_locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_movements_performed_by_fkey"
            columns: ["performed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_movements_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "product_inventory_summary"
            referencedColumns: ["product_id"]
          },
          {
            foreignKeyName: "inventory_movements_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_movements_warehouse_id_fkey"
            columns: ["warehouse_id"]
            isOneToOne: false
            referencedRelation: "warehouses"
            referencedColumns: ["id"]
          },
        ]
      }
      inventory_transfers: {
        Row: {
          approved_by: string | null
          created_at: string
          destination_location_id: string
          destination_warehouse_id: string
          id: string
          initiated_by: string
          notes: string | null
          product_id: string
          quantity: number
          source_location_id: string
          source_warehouse_id: string
          status: string
          transfer_reason: string | null
          updated_at: string
        }
        Insert: {
          approved_by?: string | null
          created_at?: string
          destination_location_id: string
          destination_warehouse_id: string
          id?: string
          initiated_by: string
          notes?: string | null
          product_id: string
          quantity: number
          source_location_id: string
          source_warehouse_id: string
          status?: string
          transfer_reason?: string | null
          updated_at?: string
        }
        Update: {
          approved_by?: string | null
          created_at?: string
          destination_location_id?: string
          destination_warehouse_id?: string
          id?: string
          initiated_by?: string
          notes?: string | null
          product_id?: string
          quantity?: number
          source_location_id?: string
          source_warehouse_id?: string
          status?: string
          transfer_reason?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "inventory_transfers_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_transfers_destination_location_id_fkey"
            columns: ["destination_location_id"]
            isOneToOne: false
            referencedRelation: "warehouse_locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_transfers_destination_warehouse_id_fkey"
            columns: ["destination_warehouse_id"]
            isOneToOne: false
            referencedRelation: "warehouses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_transfers_initiated_by_fkey"
            columns: ["initiated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_transfers_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "product_inventory_summary"
            referencedColumns: ["product_id"]
          },
          {
            foreignKeyName: "inventory_transfers_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_transfers_source_location_id_fkey"
            columns: ["source_location_id"]
            isOneToOne: false
            referencedRelation: "warehouse_locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_transfers_source_warehouse_id_fkey"
            columns: ["source_warehouse_id"]
            isOneToOne: false
            referencedRelation: "warehouses"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          action_type: string
          created_at: string
          id: string
          is_read: boolean
          metadata: Json
          role: string
          user_id: string
        }
        Insert: {
          action_type: string
          created_at?: string
          id?: string
          is_read?: boolean
          metadata?: Json
          role: string
          user_id: string
        }
        Update: {
          action_type?: string
          created_at?: string
          id?: string
          is_read?: boolean
          metadata?: Json
          role?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      processed_batches: {
        Row: {
          id: string
          location_id: string | null
          notes: string | null
          processed_at: string | null
          processed_by: string | null
          product_id: string | null
          source: string | null
          status: string
          stock_in_id: string | null
          total_boxes: number
          total_quantity: number
          warehouse_id: string | null
        }
        Insert: {
          id?: string
          location_id?: string | null
          notes?: string | null
          processed_at?: string | null
          processed_by?: string | null
          product_id?: string | null
          source?: string | null
          status?: string
          stock_in_id?: string | null
          total_boxes?: number
          total_quantity?: number
          warehouse_id?: string | null
        }
        Update: {
          id?: string
          location_id?: string | null
          notes?: string | null
          processed_at?: string | null
          processed_by?: string | null
          product_id?: string | null
          source?: string | null
          status?: string
          stock_in_id?: string | null
          total_boxes?: number
          total_quantity?: number
          warehouse_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "processed_batches_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "warehouse_locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "processed_batches_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "product_inventory_summary"
            referencedColumns: ["product_id"]
          },
          {
            foreignKeyName: "processed_batches_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "processed_batches_stock_in_id_fkey"
            columns: ["stock_in_id"]
            isOneToOne: false
            referencedRelation: "stock_in"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "processed_batches_warehouse_id_fkey"
            columns: ["warehouse_id"]
            isOneToOne: false
            referencedRelation: "warehouses"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          category: string | null
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          image_url: string | null
          is_active: boolean
          name: string
          sku: string
          specifications: string | null
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          category?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          name: string
          sku: string
          specifications?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          category?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          name?: string
          sku?: string
          specifications?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "products_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "products_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          active: boolean
          created_at: string
          created_by: string | null
          id: string
          name: string | null
          role: Database["public"]["Enums"]["user_role"]
          updated_at: string
          username: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          created_by?: string | null
          id: string
          name?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
          username: string
        }
        Update: {
          active?: boolean
          created_at?: string
          created_by?: string | null
          id?: string
          name?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
          username?: string
        }
        Relationships: []
      }
      sales_inquiries: {
        Row: {
          created_at: string
          customer_company: string
          customer_email: string
          customer_name: string
          customer_phone: string | null
          id: string
          message: string | null
          response: string | null
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          customer_company: string
          customer_email: string
          customer_name: string
          customer_phone?: string | null
          id?: string
          message?: string | null
          response?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          customer_company?: string
          customer_email?: string
          customer_name?: string
          customer_phone?: string | null
          id?: string
          message?: string | null
          response?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      sales_inquiry_items: {
        Row: {
          created_at: string
          id: string
          inquiry_id: string
          product_id: string
          quantity: number
          specific_requirements: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          inquiry_id: string
          product_id: string
          quantity: number
          specific_requirements?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          inquiry_id?: string
          product_id?: string
          quantity?: number
          specific_requirements?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "sales_inquiry_items_inquiry_id_fkey"
            columns: ["inquiry_id"]
            isOneToOne: false
            referencedRelation: "sales_inquiries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_inquiry_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "product_inventory_summary"
            referencedColumns: ["product_id"]
          },
          {
            foreignKeyName: "sales_inquiry_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      stock_in: {
        Row: {
          batch_id: string | null
          boxes: number
          created_at: string
          id: string
          notes: string | null
          processed_by: string | null
          processing_completed_at: string | null
          processing_started_at: string | null
          product_id: string
          rejection_reason: string | null
          source: string
          status: Database["public"]["Enums"]["stock_status"]
          submitted_by: string
          updated_at: string
        }
        Insert: {
          batch_id?: string | null
          boxes: number
          created_at?: string
          id?: string
          notes?: string | null
          processed_by?: string | null
          processing_completed_at?: string | null
          processing_started_at?: string | null
          product_id: string
          rejection_reason?: string | null
          source: string
          status?: Database["public"]["Enums"]["stock_status"]
          submitted_by: string
          updated_at?: string
        }
        Update: {
          batch_id?: string | null
          boxes?: number
          created_at?: string
          id?: string
          notes?: string | null
          processed_by?: string | null
          processing_completed_at?: string | null
          processing_started_at?: string | null
          product_id?: string
          rejection_reason?: string | null
          source?: string
          status?: Database["public"]["Enums"]["stock_status"]
          submitted_by?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "stock_in_processed_by_fkey"
            columns: ["processed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_in_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "product_inventory_summary"
            referencedColumns: ["product_id"]
          },
          {
            foreignKeyName: "stock_in_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_in_submitted_by_fkey"
            columns: ["submitted_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      stock_in_details: {
        Row: {
          barcode: string
          batch_number: string | null
          color: string | null
          created_at: string
          error_message: string | null
          id: string
          inventory_id: string | null
          location_id: string
          processed_at: string | null
          processing_order: number | null
          product_id: string | null
          quantity: number
          size: string | null
          status: string | null
          stock_in_id: string
          updated_at: string
          warehouse_id: string
        }
        Insert: {
          barcode: string
          batch_number?: string | null
          color?: string | null
          created_at?: string
          error_message?: string | null
          id?: string
          inventory_id?: string | null
          location_id: string
          processed_at?: string | null
          processing_order?: number | null
          product_id?: string | null
          quantity: number
          size?: string | null
          status?: string | null
          stock_in_id: string
          updated_at?: string
          warehouse_id: string
        }
        Update: {
          barcode?: string
          batch_number?: string | null
          color?: string | null
          created_at?: string
          error_message?: string | null
          id?: string
          inventory_id?: string | null
          location_id?: string
          processed_at?: string | null
          processing_order?: number | null
          product_id?: string | null
          quantity?: number
          size?: string | null
          status?: string | null
          stock_in_id?: string
          updated_at?: string
          warehouse_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_stock_in_details_stock_in"
            columns: ["stock_in_id"]
            isOneToOne: false
            referencedRelation: "stock_in"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_in_details_inventory_id_fkey"
            columns: ["inventory_id"]
            isOneToOne: false
            referencedRelation: "inventory"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_in_details_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "warehouse_locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_in_details_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "product_inventory_summary"
            referencedColumns: ["product_id"]
          },
          {
            foreignKeyName: "stock_in_details_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_in_details_stock_in_id_fkey"
            columns: ["stock_in_id"]
            isOneToOne: false
            referencedRelation: "stock_in"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_in_details_warehouse_id_fkey"
            columns: ["warehouse_id"]
            isOneToOne: false
            referencedRelation: "warehouses"
            referencedColumns: ["id"]
          },
        ]
      }
      stock_out: {
        Row: {
          approved_by: string | null
          approved_quantity: number | null
          created_at: string
          destination: string
          id: string
          invoice_number: string | null
          packing_slip_number: string | null
          product_id: string
          quantity: number
          reason: string | null
          requested_by: string
          status: Database["public"]["Enums"]["stock_status"]
          updated_at: string
          verified_by: string | null
        }
        Insert: {
          approved_by?: string | null
          approved_quantity?: number | null
          created_at?: string
          destination: string
          id?: string
          invoice_number?: string | null
          packing_slip_number?: string | null
          product_id: string
          quantity: number
          reason?: string | null
          requested_by: string
          status?: Database["public"]["Enums"]["stock_status"]
          updated_at?: string
          verified_by?: string | null
        }
        Update: {
          approved_by?: string | null
          approved_quantity?: number | null
          created_at?: string
          destination?: string
          id?: string
          invoice_number?: string | null
          packing_slip_number?: string | null
          product_id?: string
          quantity?: number
          reason?: string | null
          requested_by?: string
          status?: Database["public"]["Enums"]["stock_status"]
          updated_at?: string
          verified_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "stock_out_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_out_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "product_inventory_summary"
            referencedColumns: ["product_id"]
          },
          {
            foreignKeyName: "stock_out_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_out_requested_by_fkey"
            columns: ["requested_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      stock_out_details: {
        Row: {
          created_at: string
          id: string
          inventory_id: string
          quantity: number
          stock_out_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          inventory_id: string
          quantity: number
          stock_out_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          inventory_id?: string
          quantity?: number
          stock_out_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "stock_out_details_inventory_id_fkey"
            columns: ["inventory_id"]
            isOneToOne: false
            referencedRelation: "inventory"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_out_details_stock_out_id_fkey"
            columns: ["stock_out_id"]
            isOneToOne: false
            referencedRelation: "stock_out"
            referencedColumns: ["id"]
          },
        ]
      }
      warehouse_locations: {
        Row: {
          created_at: string
          floor: number
          id: string
          updated_at: string
          warehouse_id: string
          zone: string
        }
        Insert: {
          created_at?: string
          floor: number
          id?: string
          updated_at?: string
          warehouse_id: string
          zone: string
        }
        Update: {
          created_at?: string
          floor?: number
          id?: string
          updated_at?: string
          warehouse_id?: string
          zone?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_warehouse_locations_warehouse"
            columns: ["warehouse_id"]
            isOneToOne: false
            referencedRelation: "warehouses"
            referencedColumns: ["id"]
          },
        ]
      }
      warehouses: {
        Row: {
          created_at: string
          id: string
          location: string | null
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          location?: string | null
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          location?: string | null
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      product_inventory_summary: {
        Row: {
          last_updated: string | null
          location_breakdown: Json | null
          location_count: number | null
          product_category: string | null
          product_id: string | null
          product_name: string | null
          product_sku: string | null
          total_quantity: number | null
          warehouse_count: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      begin_transaction: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      commit_transaction: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      find_inventory_by_barcode: {
        Args: { search_barcode: string }
        Returns: {
          inventory_id: string
          product_name: string
          product_sku: string
          warehouse_name: string
          warehouse_location: string
          floor: number
          zone: string
          quantity: number
          barcode: string
          color: string
          size: string
          batch_id: string
          status: string
        }[]
      }
      generate_unique_barcode: {
        Args: { prefix?: string; batch_identifier?: string }
        Returns: string
      }
      get_inventory_details: {
        Args: { item_id: string }
        Returns: {
          inventory_id: string
          product_name: string
          product_sku: string
          warehouse_name: string
          warehouse_location: string
          floor: number
          zone: string
          quantity: number
          barcode: string
          color: string
          size: string
          batch_id: string
          status: string
        }[]
      }
      get_inventory_levels: {
        Args: Record<PropertyKey, never>
        Returns: {
          product_id: string
          product_name: string
          product_sku: string
          warehouse_id: string
          warehouse_name: string
          location_id: string
          location_name: string
          stock_level: number
          last_updated: string
        }[]
      }
      get_product_inventory_details: {
        Args: { product_id_param: string }
        Returns: {
          warehouse_id: string
          warehouse_name: string
          location_id: string
          location_name: string
          quantity: number
          available_quantity: number
          reserved_quantity: number
          batch_count: number
          last_movement_date: string
        }[]
      }
      get_user_role: {
        Args: { user_id: string }
        Returns: Database["public"]["Enums"]["user_role"]
      }
      migrate_stock_in_data: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      process_stock_in_detail: {
        Args:
          | {
              p_detail_id: string
              p_status: Database["public"]["Enums"]["stock_in_detail_status"]
              p_error_message?: string
            }
          | {
              p_stock_in_id: string
              p_detail_id: string
              p_status: string
              p_error?: string
            }
        Returns: undefined
      }
      rollback_transaction: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      validate_barcode: {
        Args: { barcode: string }
        Returns: boolean
      }
    }
    Enums: {
      movement_status: "pending" | "approved" | "rejected" | "in_transit"
      movement_type:
        | "in"
        | "out"
        | "adjustment"
        | "reserve"
        | "release"
        | "transfer"
      stock_in_detail_status: "pending" | "processing" | "completed" | "failed"
      stock_in_status:
        | "pending"
        | "processing"
        | "completed"
        | "approved"
        | "rejected"
      stock_status:
        | "pending"
        | "approved"
        | "rejected"
        | "completed"
        | "processing"
      user_role:
        | "admin"
        | "warehouse_manager"
        | "field_operator"
        | "sales_operator"
        | "customer"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      movement_status: ["pending", "approved", "rejected", "in_transit"],
      movement_type: [
        "in",
        "out",
        "adjustment",
        "reserve",
        "release",
        "transfer",
      ],
      stock_in_detail_status: ["pending", "processing", "completed", "failed"],
      stock_in_status: [
        "pending",
        "processing",
        "completed",
        "approved",
        "rejected",
      ],
      stock_status: [
        "pending",
        "approved",
        "rejected",
        "completed",
        "processing",
      ],
      user_role: [
        "admin",
        "warehouse_manager",
        "field_operator",
        "sales_operator",
        "customer",
      ],
    },
  },
} as const
