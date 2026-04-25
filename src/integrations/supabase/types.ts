export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      categories: {
        Row: {
          created_at: string
          id: string
          name: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      dealer_inquiries: {
        Row: {
          created_at: string
          dealer_id: string
          id: string
          notes: string | null
          product_id: string
          product_name: string
          quantity: number
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          dealer_id: string
          id?: string
          notes?: string | null
          product_id: string
          product_name: string
          quantity?: number
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          dealer_id?: string
          id?: string
          notes?: string | null
          product_id?: string
          product_name?: string
          quantity?: number
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      order_items: {
        Row: {
          created_at: string
          id: string
          line_total: number
          order_id: string
          product_brand: string | null
          product_id: string
          product_image: string | null
          product_name: string
          qty: number
          unit_price: number
        }
        Insert: {
          created_at?: string
          id?: string
          line_total: number
          order_id: string
          product_brand?: string | null
          product_id: string
          product_image?: string | null
          product_name: string
          qty: number
          unit_price: number
        }
        Update: {
          created_at?: string
          id?: string
          line_total?: number
          order_id?: string
          product_brand?: string | null
          product_id?: string
          product_image?: string | null
          product_name?: string
          qty?: number
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          admin_notes: string | null
          created_at: string
          customer_email: string
          customer_name: string
          customer_phone: string
          id: string
          install_fee: number
          installation: boolean
          order_number: string
          payment_method: Database["public"]["Enums"]["payment_method"]
          payment_proof_url: string | null
          payment_reference: string | null
          shipping_address: string
          shipping_city: string
          shipping_fee: number
          shipping_landmark: string | null
          shipping_pincode: string
          shipping_speed: string
          shipping_state: string
          status: Database["public"]["Enums"]["order_status"]
          subtotal: number
          tax: number
          total: number
          updated_at: string
          user_id: string | null
        }
        Insert: {
          admin_notes?: string | null
          created_at?: string
          customer_email: string
          customer_name: string
          customer_phone: string
          id?: string
          install_fee?: number
          installation?: boolean
          order_number?: string
          payment_method: Database["public"]["Enums"]["payment_method"]
          payment_proof_url?: string | null
          payment_reference?: string | null
          shipping_address: string
          shipping_city: string
          shipping_fee?: number
          shipping_landmark?: string | null
          shipping_pincode: string
          shipping_speed?: string
          shipping_state: string
          status?: Database["public"]["Enums"]["order_status"]
          subtotal: number
          tax?: number
          total: number
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          admin_notes?: string | null
          created_at?: string
          customer_email?: string
          customer_name?: string
          customer_phone?: string
          id?: string
          install_fee?: number
          installation?: boolean
          order_number?: string
          payment_method?: Database["public"]["Enums"]["payment_method"]
          payment_proof_url?: string | null
          payment_reference?: string | null
          shipping_address?: string
          shipping_city?: string
          shipping_fee?: number
          shipping_landmark?: string | null
          shipping_pincode?: string
          shipping_speed?: string
          shipping_state?: string
          status?: Database["public"]["Enums"]["order_status"]
          subtotal?: number
          tax?: number
          total?: number
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      payment_settings: {
        Row: {
          bank_account_name: string | null
          bank_account_number: string | null
          bank_ifsc: string | null
          bank_name: string | null
          cod_enabled: boolean
          id: string
          notes: string | null
          paytm_id: string | null
          qr_code_url: string | null
          updated_at: string
          upi_id: string | null
        }
        Insert: {
          bank_account_name?: string | null
          bank_account_number?: string | null
          bank_ifsc?: string | null
          bank_name?: string | null
          cod_enabled?: boolean
          id?: string
          notes?: string | null
          paytm_id?: string | null
          qr_code_url?: string | null
          updated_at?: string
          upi_id?: string | null
        }
        Update: {
          bank_account_name?: string | null
          bank_account_number?: string | null
          bank_ifsc?: string | null
          bank_name?: string | null
          cod_enabled?: boolean
          id?: string
          notes?: string | null
          paytm_id?: string | null
          qr_code_url?: string | null
          updated_at?: string
          upi_id?: string | null
        }
        Relationships: []
      }
      products: {
        Row: {
          active: boolean
          brand: string
          bulk_available: boolean | null
          bulk_min_qty: number | null
          bulk_price: number | null
          category: string
          created_at: string
          cross_sell_ids: string[] | null
          dealer_price: number | null
          fast_delivery: boolean | null
          heavy: boolean | null
          id: string
          image_url: string | null
          installation: boolean | null
          low_stock_threshold: number
          mrp: number
          name: string
          price: number
          rating: number | null
          retail_price: number | null
          reviews: number | null
          sku: string
          stock: number
          updated_at: string
        }
        Insert: {
          active?: boolean
          brand: string
          bulk_available?: boolean | null
          bulk_min_qty?: number | null
          bulk_price?: number | null
          category: string
          created_at?: string
          cross_sell_ids?: string[] | null
          dealer_price?: number | null
          fast_delivery?: boolean | null
          heavy?: boolean | null
          id: string
          image_url?: string | null
          installation?: boolean | null
          low_stock_threshold?: number
          mrp: number
          name: string
          price: number
          rating?: number | null
          retail_price?: number | null
          reviews?: number | null
          sku: string
          stock?: number
          updated_at?: string
        }
        Update: {
          active?: boolean
          brand?: string
          bulk_available?: boolean | null
          bulk_min_qty?: number | null
          bulk_price?: number | null
          category?: string
          created_at?: string
          cross_sell_ids?: string[] | null
          dealer_price?: number | null
          fast_delivery?: boolean | null
          heavy?: boolean | null
          id?: string
          image_url?: string | null
          installation?: boolean | null
          low_stock_threshold?: number
          mrp?: number
          name?: string
          price?: number
          rating?: number | null
          retail_price?: number | null
          reviews?: number | null
          sku?: string
          stock?: number
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          business_name: string | null
          created_at: string
          dealer_status: Database["public"]["Enums"]["dealer_status"] | null
          email: string | null
          full_name: string | null
          gst_number: string | null
          id: string
          phone: string | null
          updated_at: string
        }
        Insert: {
          business_name?: string | null
          created_at?: string
          dealer_status?: Database["public"]["Enums"]["dealer_status"] | null
          email?: string | null
          full_name?: string | null
          gst_number?: string | null
          id: string
          phone?: string | null
          updated_at?: string
        }
        Update: {
          business_name?: string | null
          created_at?: string
          dealer_status?: Database["public"]["Enums"]["dealer_status"] | null
          email?: string | null
          full_name?: string | null
          gst_number?: string | null
          id?: string
          phone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_admin_products: {
        Args: never
        Returns: {
          active: boolean
          brand: string
          bulk_available: boolean
          bulk_min_qty: number
          bulk_price: number
          category: string
          cross_sell_ids: string[]
          dealer_price: number
          fast_delivery: boolean
          heavy: boolean
          id: string
          image_url: string
          installation: boolean
          low_stock_threshold: number
          mrp: number
          name: string
          price: number
          rating: number
          retail_price: number
          reviews: number
          sku: string
          stock: number
        }[]
      }
      get_visible_products: {
        Args: never
        Returns: {
          active: boolean
          brand: string
          bulk_available: boolean
          bulk_min_qty: number
          bulk_price: number
          category: string
          cross_sell_ids: string[]
          dealer_price: number
          fast_delivery: boolean
          heavy: boolean
          id: string
          image_url: string
          installation: boolean
          low_stock_threshold: number
          mrp: number
          name: string
          price: number
          rating: number
          retail_price: number
          reviews: number
          sku: string
          stock: number
        }[]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_approved_dealer: { Args: { _user_id: string }; Returns: boolean }
      place_order: {
        Args: {
          _customer_email: string
          _customer_name: string
          _customer_phone: string
          _installation: boolean
          _items: Json
          _payment_method: Database["public"]["Enums"]["payment_method"]
          _shipping_address: string
          _shipping_city: string
          _shipping_landmark: string
          _shipping_pincode: string
          _shipping_speed: string
          _shipping_state: string
        }
        Returns: string
      }
    }
    Enums: {
      app_role: "admin" | "customer" | "dealer"
      dealer_status: "pending" | "approved" | "rejected"
      order_status:
        | "pending_payment"
        | "awaiting_verification"
        | "paid"
        | "processing"
        | "shipped"
        | "delivered"
        | "cancelled"
        | "refunded"
      payment_method: "upi_qr" | "paytm" | "bank_transfer" | "cod"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "customer", "dealer"],
      dealer_status: ["pending", "approved", "rejected"],
      order_status: [
        "pending_payment",
        "awaiting_verification",
        "paid",
        "processing",
        "shipped",
        "delivered",
        "cancelled",
        "refunded",
      ],
      payment_method: ["upi_qr", "paytm", "bank_transfer", "cod"],
    },
  },
} as const
