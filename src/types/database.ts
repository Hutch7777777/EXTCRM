export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type UserRole = 
  | 'owner'
  | 'operations_manager'
  | 'sales_manager'
  | 'estimating_manager'
  | 'estimator'
  | 'field_management'

export type UserStatus = 
  | 'pending'
  | 'active'
  | 'inactive'
  | 'suspended'

export type OrganizationStatus = 
  | 'active'
  | 'trial'
  | 'suspended'
  | 'cancelled'

export interface Database {
  public: {
    Tables: {
      organizations: {
        Row: {
          id: string
          name: string
          slug: string
          status: OrganizationStatus
          logo_url: string | null
          website_url: string | null
          phone: string | null
          address_line_1: string | null
          address_line_2: string | null
          city: string | null
          state: string | null
          zip_code: string | null
          country: string
          tax_id: string | null
          settings: Json
          billing_info: Json
          subscription_status: string | null
          subscription_tier: string | null
          trial_ends_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          slug: string
          status?: OrganizationStatus
          logo_url?: string | null
          website_url?: string | null
          phone?: string | null
          address_line_1?: string | null
          address_line_2?: string | null
          city?: string | null
          state?: string | null
          zip_code?: string | null
          country?: string
          tax_id?: string | null
          settings?: Json
          billing_info?: Json
          subscription_status?: string | null
          subscription_tier?: string | null
          trial_ends_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          slug?: string
          status?: OrganizationStatus
          logo_url?: string | null
          website_url?: string | null
          phone?: string | null
          address_line_1?: string | null
          address_line_2?: string | null
          city?: string | null
          state?: string | null
          zip_code?: string | null
          country?: string
          tax_id?: string | null
          settings?: Json
          billing_info?: Json
          subscription_status?: string | null
          subscription_tier?: string | null
          trial_ends_at?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      users: {
        Row: {
          id: string
          organization_id: string
          email: string
          first_name: string
          last_name: string
          display_name: string | null
          role: UserRole
          status: UserStatus
          phone: string | null
          mobile: string | null
          title: string | null
          department: string | null
          hire_date: string | null
          is_admin: boolean
          permissions: Json
          timezone: string | null
          notification_preferences: Json
          last_login_at: string | null
          login_count: number
          invited_by: string | null
          invited_at: string | null
          activated_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          organization_id: string
          email: string
          first_name: string
          last_name: string
          display_name?: string | null
          role: UserRole
          status?: UserStatus
          phone?: string | null
          mobile?: string | null
          title?: string | null
          department?: string | null
          hire_date?: string | null
          is_admin?: boolean
          permissions?: Json
          timezone?: string | null
          notification_preferences?: Json
          last_login_at?: string | null
          login_count?: number
          invited_by?: string | null
          invited_at?: string | null
          activated_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          organization_id?: string
          email?: string
          first_name?: string
          last_name?: string
          display_name?: string | null
          role?: UserRole
          status?: UserStatus
          phone?: string | null
          mobile?: string | null
          title?: string | null
          department?: string | null
          hire_date?: string | null
          is_admin?: boolean
          permissions?: Json
          timezone?: string | null
          notification_preferences?: Json
          last_login_at?: string | null
          login_count?: number
          invited_by?: string | null
          invited_at?: string | null
          activated_at?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      role_permissions: {
        Row: {
          id: string
          role: UserRole
          resource: string
          action: string
          conditions: Json
        }
        Insert: {
          id?: string
          role: UserRole
          resource: string
          action: string
          conditions?: Json
        }
        Update: {
          id?: string
          role?: UserRole
          resource?: string
          action?: string
          conditions?: Json
        }
      }
      user_sessions: {
        Row: {
          id: string
          user_id: string
          organization_id: string
          session_token: string | null
          device_info: Json | null
          ip_address: string | null
          user_agent: string | null
          started_at: string
          last_activity_at: string
          ended_at: string | null
          is_active: boolean
        }
        Insert: {
          id?: string
          user_id: string
          organization_id: string
          session_token?: string | null
          device_info?: Json | null
          ip_address?: string | null
          user_agent?: string | null
          started_at?: string
          last_activity_at?: string
          ended_at?: string | null
          is_active?: boolean
        }
        Update: {
          id?: string
          user_id?: string
          organization_id?: string
          session_token?: string | null
          device_info?: Json | null
          ip_address?: string | null
          user_agent?: string | null
          started_at?: string
          last_activity_at?: string
          ended_at?: string | null
          is_active?: boolean
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
      user_role: UserRole
      user_status: UserStatus
      organization_status: OrganizationStatus
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}