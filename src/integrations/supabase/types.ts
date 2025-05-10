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
      barcode_logs: {
        Row: {
          action: string
          barcode: string
          batch_id: string | null
          details: Json | null
          event_type: string | null
          id: string
          timestamp: string
          user_id: string
        }
        Insert: {
          action: string
          barcode: string
          batch_id?: string | null
          details?: Json | null
          event_type?: string | null
          id?: string
          timestamp?: string
          user_id: string
        }
        Update: {
          action?: string
          barcode?: string
          batch_id?: string | null
          details?: Json | null
          event_type?: string | null
          id?: string
          timestamp?: string
          user_id?: string
        }
        Relationships: []
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
          updated_at?: string
          warehouse_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_inventory_stock_in_details"
            columns: ["batch_id"]
            isOneToOne: false
            referencedRelation: "stock_in_details"
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
            referencedRelation: "products"
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
      otp_tokens: {
        Row: {
          created_at: string | null
          email: string
          expires_at: string
          id: string
          token: string
          used: boolean | null
        }
        Insert: {
          created_at?: string | null
          email: string
          expires_at: string
          id?: string
          token: string
          used?: boolean | null
        }
        Update: {
          created_at?: string | null
          email?: string
          expires_at?: string
          id?: string
          token?: string
          used?: boolean | null
        }
        Relationships: []
      }
      pricing_inquiries: {
        Row: {
          company: string | null
          created_at: string
          customer_email: string
          customer_name: string
          id: string
          products: Json
          status: string
          updated_at: string
        }
        Insert: {
          company?: string | null
          created_at?: string
          customer_email: string
          customer_name: string
          id?: string
          products: Json
          status?: string
          updated_at?: string
        }
        Update: {
          company?: string | null
          created_at?: string
          customer_email?: string
          customer_name?: string
          id?: string
          products?: Json
          status?: string
          updated_at?: string
        }
        Relationships: []
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
          sku: string | null
          specifications: string | null
          updated_at: string
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
          sku?: string | null
          specifications?: string | null
          updated_at?: string
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
          sku?: string | null
          specifications?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "products_created_by_fkey"
            columns: ["created_by"]
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
          id: string
          name: string | null
          role: Database["public"]["Enums"]["user_role"]
          updated_at: string
          username: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          id: string
          name?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
          username: string
        }
        Update: {
          active?: boolean
          created_at?: string
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
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      stock_in: {
        Row: {
          boxes: number
          created_at: string
          id: string
          notes: string | null
          processed_by: string | null
          product_id: string
          rejection_reason: string | null
          source: string
          status: Database["public"]["Enums"]["stock_status"]
          submitted_by: string
          updated_at: string
        }
        Insert: {
          boxes: number
          created_at?: string
          id?: string
          notes?: string | null
          processed_by?: string | null
          product_id: string
          rejection_reason?: string | null
          source: string
          status?: Database["public"]["Enums"]["stock_status"]
          submitted_by: string
          updated_at?: string
        }
        Update: {
          boxes?: number
          created_at?: string
          id?: string
          notes?: string | null
          processed_by?: string | null
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
          color: string | null
          created_at: string
          id: string
          inventory_id: string | null
          location_id: string
          quantity: number
          size: string | null
          stock_in_id: string
          updated_at: string
          warehouse_id: string
        }
        Insert: {
          barcode: string
          color?: string | null
          created_at?: string
          id?: string
          inventory_id?: string | null
          location_id: string
          quantity: number
          size?: string | null
          stock_in_id: string
          updated_at?: string
          warehouse_id: string
        }
        Update: {
          barcode?: string
          color?: string | null
          created_at?: string
          id?: string
          inventory_id?: string | null
          location_id?: string
          quantity?: number
          size?: string | null
          stock_in_id?: string
          updated_at?: string
          warehouse_id?: string
        }
        Relationships: [
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
            foreignKeyName: "warehouse_locations_warehouse_id_fkey"
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
      [_ in never]: never
    }
    Functions: {
      get_user_role: {
        Args: { user_id: string }
        Returns: Database["public"]["Enums"]["user_role"]
      }
    }
    Enums: {
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
