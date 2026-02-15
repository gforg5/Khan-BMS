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
      profiles: {
        Row: {
          id: string
          business_name: string
          business_type: string | null
          phone: string | null
          subscription_tier: 'free' | 'standard' | 'premium'
          subscription_expiry: string | null
          language: 'en' | 'ur' | 'ps'
          is_active: boolean
          role: 'user' | 'admin'
          created_at: string
        }
        Insert: {
          id: string
          business_name: string
          business_type?: string | null
          phone?: string | null
          subscription_tier?: 'free' | 'standard' | 'premium'
          subscription_expiry?: string | null
          language?: 'en' | 'ur' | 'ps'
          is_active?: boolean
          role?: 'user' | 'admin'
          created_at?: string
        }
        Update: {
          id?: string
          business_name?: string
          business_type?: string | null
          phone?: string | null
          subscription_tier?: 'free' | 'standard' | 'premium'
          subscription_expiry?: string | null
          language?: 'en' | 'ur' | 'ps'
          is_active?: boolean
          role?: 'user' | 'admin'
          created_at?: string
        }
      }
      products: {
        Row: {
          id: string
          user_id: string
          name_en: string
          name_ur: string | null
          name_ps: string | null
          purchase_price: number
          selling_price: number
          quantity: number
          unit: string
          category: string | null
          supplier: string | null
          low_stock_threshold: number
          image_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name_en: string
          name_ur?: string | null
          name_ps?: string | null
          purchase_price?: number
          selling_price?: number
          quantity?: number
          unit?: string
          category?: string | null
          supplier?: string | null
          low_stock_threshold?: number
          image_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name_en?: string
          name_ur?: string | null
          name_ps?: string | null
          purchase_price?: number
          selling_price?: number
          quantity?: number
          unit?: string
          category?: string | null
          supplier?: string | null
          low_stock_threshold?: number
          image_url?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      sales: {
        Row: {
          id: string
          user_id: string
          total_amount: number
          profit: number
          payment_method: 'cash' | 'card' | 'online'
          customer_name: string | null
          customer_phone: string | null
          receipt_number: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          total_amount?: number
          profit?: number
          payment_method?: 'cash' | 'card' | 'online'
          customer_name?: string | null
          customer_phone?: string | null
          receipt_number?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          total_amount?: number
          profit?: number
          payment_method?: 'cash' | 'card' | 'online'
          customer_name?: string | null
          customer_phone?: string | null
          receipt_number?: string | null
          created_at?: string
        }
      }
      sale_items: {
        Row: {
          id: string
          sale_id: string
          product_id: string | null
          quantity: number
          unit_price: number
          subtotal: number
          profit: number
        }
        Insert: {
          id?: string
          sale_id: string
          product_id?: string | null
          quantity: number
          unit_price: number
          subtotal: number
          profit?: number
        }
        Update: {
          id?: string
          sale_id?: string
          product_id?: string | null
          quantity?: number
          unit_price?: number
          subtotal?: number
          profit?: number
        }
      }
      expenses: {
        Row: {
          id: string
          user_id: string
          description: string
          amount: number
          category: string | null
          expense_date: string
          notes: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          description: string
          amount: number
          category?: string | null
          expense_date?: string
          notes?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          description?: string
          amount?: number
          category?: string | null
          expense_date?: string
          notes?: string | null
          created_at?: string
        }
      }
      subscriptions: {
        Row: {
          id: string
          user_id: string
          tier: 'free' | 'standard' | 'premium'
          amount: number
          coupon_code: string | null
          payment_status: 'pending' | 'completed' | 'failed'
          start_date: string
          expiry_date: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          tier: 'free' | 'standard' | 'premium'
          amount?: number
          coupon_code?: string | null
          payment_status?: 'pending' | 'completed' | 'failed'
          start_date: string
          expiry_date: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          tier?: 'free' | 'standard' | 'premium'
          amount?: number
          coupon_code?: string | null
          payment_status?: 'pending' | 'completed' | 'failed'
          start_date?: string
          expiry_date?: string
          created_at?: string
        }
      }
      coupons: {
        Row: {
          id: string
          code: string
          discount_amount: number
          usage_limit: number
          used_count: number
          is_active: boolean
          expiry_date: string | null
          created_at: string
        }
        Insert: {
          id?: string
          code: string
          discount_amount: number
          usage_limit?: number
          used_count?: number
          is_active?: boolean
          expiry_date?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          code?: string
          discount_amount?: number
          usage_limit?: number
          used_count?: number
          is_active?: boolean
          expiry_date?: string | null
          created_at?: string
        }
      }
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
