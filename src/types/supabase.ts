export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type UserRole = 'owner' | 'operations_manager' | 'sales_manager' | 'estimating_manager' | 'estimator' | 'field_management'

export type UserStatus = 'active' | 'inactive' | 'pending'

export type OrganizationStatus = 'active' | 'inactive' | 'suspended'

export interface Database {
  public: {
    Tables: {
      user_invitations: {
        Row: {
          accepted_at: string | null
          created_at: string
          email: string
          expires_at: string
          id: string
          invited_by: string
          invitation_token: string
          organization_id: string
          role: Database["public"]["Enums"]["user_role"]
          status: string
        }
        Insert: {
          accepted_at?: string | null
          created_at?: string
          email: string
          expires_at: string
          id?: string
          invited_by: string
          invitation_token: string
          organization_id: string
          role: Database["public"]["Enums"]["user_role"]
          status?: string
        }
        Update: {
          accepted_at?: string | null
          created_at?: string
          email?: string
          expires_at?: string
          id?: string
          invited_by?: string
          invitation_token?: string
          organization_id?: string
          role?: Database["public"]["Enums"]["user_role"]
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_invitations_invited_by_fkey"
            columns: ["invited_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_invitations_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      user_sessions: {
        Row: {
          device_info: Json | null
          ended_at: string | null
          id: string
          ip_address: string | null
          is_active: boolean
          last_activity_at: string
          organization_id: string
          session_token: string | null
          started_at: string
          user_agent: string | null
          user_id: string
        }
        Insert: {
          device_info?: Json | null
          ended_at?: string | null
          id?: string
          ip_address?: string | null
          is_active?: boolean
          last_activity_at?: string
          organization_id: string
          session_token?: string | null
          started_at?: string
          user_agent?: string | null
          user_id: string
        }
        Update: {
          device_info?: Json | null
          ended_at?: string | null
          id?: string
          ip_address?: string | null
          is_active?: boolean
          last_activity_at?: string
          organization_id?: string
          session_token?: string | null
          started_at?: string
          user_agent?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_sessions_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_sessions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          activated_at: string | null
          created_at: string
          department: string | null
          display_name: string | null
          email: string
          first_name: string
          hire_date: string | null
          id: string
          invited_at: string | null
          invited_by: string | null
          is_admin: boolean
          last_login_at: string | null
          last_name: string
          login_count: number
          mobile: string | null
          notification_preferences: Json | null
          organization_id: string
          permissions: Json | null
          phone: string | null
          role: Database["public"]["Enums"]["user_role"]
          status: Database["public"]["Enums"]["user_status"]
          timezone: string | null
          title: string | null
          updated_at: string
        }
        Insert: {
          activated_at?: string | null
          created_at?: string
          department?: string | null
          display_name?: string | null
          email: string
          first_name: string
          hire_date?: string | null
          id: string
          invited_at?: string | null
          invited_by?: string | null
          is_admin?: boolean
          last_login_at?: string | null
          last_name: string
          login_count?: number
          mobile?: string | null
          notification_preferences?: Json | null
          organization_id: string
          permissions?: Json | null
          phone?: string | null
          role: Database["public"]["Enums"]["user_role"]
          status?: Database["public"]["Enums"]["user_status"]
          timezone?: string | null
          title?: string | null
          updated_at?: string
        }
        Update: {
          activated_at?: string | null
          created_at?: string
          department?: string | null
          display_name?: string | null
          email?: string
          first_name?: string
          hire_date?: string | null
          id?: string
          invited_at?: string | null
          invited_by?: string | null
          is_admin?: boolean
          last_login_at?: string | null
          last_name?: string
          login_count?: number
          mobile?: string | null
          notification_preferences?: Json | null
          organization_id?: string
          permissions?: Json | null
          phone?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          status?: Database["public"]["Enums"]["user_status"]
          timezone?: string | null
          title?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "users_invited_by_fkey"
            columns: ["invited_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "users_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organizations: {
        Row: {
          address_line_1: string | null
          address_line_2: string | null
          billing_info: Json | null
          city: string | null
          country: string | null
          created_at: string
          id: string
          logo_url: string | null
          name: string
          phone: string | null
          settings: Json | null
          slug: string
          state: string | null
          status: Database["public"]["Enums"]["organization_status"]
          subscription_status: string | null
          subscription_tier: string | null
          tax_id: string | null
          trial_ends_at: string | null
          updated_at: string
          website_url: string | null
          zip_code: string | null
        }
        Insert: {
          address_line_1?: string | null
          address_line_2?: string | null
          billing_info?: Json | null
          city?: string | null
          country?: string | null
          created_at?: string
          id?: string
          logo_url?: string | null
          name: string
          phone?: string | null
          settings?: Json | null
          slug: string
          state?: string | null
          status?: Database["public"]["Enums"]["organization_status"]
          subscription_status?: string | null
          subscription_tier?: string | null
          tax_id?: string | null
          trial_ends_at?: string | null
          updated_at?: string
          website_url?: string | null
          zip_code?: string | null
        }
        Update: {
          address_line_1?: string | null
          address_line_2?: string | null
          billing_info?: Json | null
          city?: string | null
          country?: string | null
          created_at?: string
          id?: string
          logo_url?: string | null
          name?: string
          phone?: string | null
          settings?: Json | null
          slug?: string
          state?: string | null
          status?: Database["public"]["Enums"]["organization_status"]
          subscription_status?: string | null
          subscription_tier?: string | null
          tax_id?: string | null
          trial_ends_at?: string | null
          updated_at?: string
          website_url?: string | null
          zip_code?: string | null
        }
        Relationships: []
      }
      organization_registrations: {
        Row: {
          created_at: string
          email: string
          first_name: string
          id: string
          last_name: string
          organization_data: Json
          processed_at: string | null
          registration_token: string
          status: string
        }
        Insert: {
          created_at?: string
          email: string
          first_name: string
          id?: string
          last_name: string
          organization_data: Json
          processed_at?: string | null
          registration_token: string
          status?: string
        }
        Update: {
          created_at?: string
          email?: string
          first_name?: string
          id?: string
          last_name?: string
          organization_data?: Json
          processed_at?: string | null
          registration_token?: string
          status?: string
        }
        Relationships: []
      }
      contacts: {
        Row: {
          address_line_1: string | null
          address_line_2: string | null
          city: string | null
          company_name: string | null
          country: string | null
          created_at: string
          created_by: string
          custom_fields: Json | null
          display_name: string
          email: string | null
          first_name: string | null
          id: string
          is_active: boolean
          last_name: string | null
          mobile: string | null
          notes: string | null
          organization_id: string
          phone: string | null
          state: string | null
          tags: string[] | null
          type: Database["public"]["Enums"]["contact_type"]
          updated_at: string
          updated_by: string | null
          website_url: string | null
          zip_code: string | null
        }
        Insert: {
          address_line_1?: string | null
          address_line_2?: string | null
          city?: string | null
          company_name?: string | null
          country?: string | null
          created_at?: string
          created_by: string
          custom_fields?: Json | null
          display_name: string
          email?: string | null
          first_name?: string | null
          id?: string
          is_active?: boolean
          last_name?: string | null
          mobile?: string | null
          notes?: string | null
          organization_id: string
          phone?: string | null
          state?: string | null
          tags?: string[] | null
          type: Database["public"]["Enums"]["contact_type"]
          updated_at?: string
          updated_by?: string | null
          website_url?: string | null
          zip_code?: string | null
        }
        Update: {
          address_line_1?: string | null
          address_line_2?: string | null
          city?: string | null
          company_name?: string | null
          country?: string | null
          created_at?: string
          created_by?: string
          custom_fields?: Json | null
          display_name?: string
          email?: string | null
          first_name?: string | null
          id?: string
          is_active?: boolean
          last_name?: string | null
          mobile?: string | null
          notes?: string | null
          organization_id?: string
          phone?: string | null
          state?: string | null
          tags?: string[] | null
          type?: Database["public"]["Enums"]["contact_type"]
          updated_at?: string
          updated_by?: string | null
          website_url?: string | null
          zip_code?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "contacts_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contacts_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contacts_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      leads: {
        Row: {
          address_line_1: string | null
          address_line_2: string | null
          assigned_to: string | null
          city: string | null
          contact_id: string | null
          created_at: string
          created_by: string
          custom_fields: Json | null
          description: string | null
          division: Database["public"]["Enums"]["division"]
          estimated_value: number | null
          expected_close_date: string | null
          id: string
          organization_id: string
          priority: number | null
          probability: number | null
          source: Database["public"]["Enums"]["lead_source"]
          state: string | null
          status: Database["public"]["Enums"]["lead_status"]
          tags: string[] | null
          title: string
          updated_at: string
          updated_by: string | null
          zip_code: string | null
        }
        Insert: {
          address_line_1?: string | null
          address_line_2?: string | null
          assigned_to?: string | null
          city?: string | null
          contact_id?: string | null
          created_at?: string
          created_by: string
          custom_fields?: Json | null
          description?: string | null
          division: Database["public"]["Enums"]["division"]
          estimated_value?: number | null
          expected_close_date?: string | null
          id?: string
          organization_id: string
          priority?: number | null
          probability?: number | null
          source: Database["public"]["Enums"]["lead_source"]
          state?: string | null
          status?: Database["public"]["Enums"]["lead_status"]
          tags?: string[] | null
          title: string
          updated_at?: string
          updated_by?: string | null
          zip_code?: string | null
        }
        Update: {
          address_line_1?: string | null
          address_line_2?: string | null
          assigned_to?: string | null
          city?: string | null
          contact_id?: string | null
          created_at?: string
          created_by?: string
          custom_fields?: Json | null
          description?: string | null
          division?: Database["public"]["Enums"]["division"]
          estimated_value?: number | null
          expected_close_date?: string | null
          id?: string
          organization_id?: string
          priority?: number | null
          probability?: number | null
          source?: Database["public"]["Enums"]["lead_source"]
          state?: string | null
          status?: Database["public"]["Enums"]["lead_status"]
          tags?: string[] | null
          title?: string
          updated_at?: string
          updated_by?: string | null
          zip_code?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "leads_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leads_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leads_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leads_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leads_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      jobs: {
        Row: {
          actual_completion: string | null
          address_line_1: string | null
          address_line_2: string | null
          city: string | null
          contact_id: string
          contract_value: number | null
          created_at: string
          created_by: string
          custom_fields: Json | null
          description: string | null
          division: Database["public"]["Enums"]["division"]
          field_manager_id: string | null
          id: string
          job_number: string
          lead_id: string | null
          notes: string | null
          organization_id: string
          project_manager_id: string | null
          scheduled_completion: string | null
          start_date: string | null
          state: string | null
          status: Database["public"]["Enums"]["job_status"]
          tags: string[] | null
          title: string
          updated_at: string
          updated_by: string | null
          zip_code: string | null
        }
        Insert: {
          actual_completion?: string | null
          address_line_1?: string | null
          address_line_2?: string | null
          city?: string | null
          contact_id: string
          contract_value?: number | null
          created_at?: string
          created_by: string
          custom_fields?: Json | null
          description?: string | null
          division: Database["public"]["Enums"]["division"]
          field_manager_id?: string | null
          id?: string
          job_number: string
          lead_id?: string | null
          notes?: string | null
          organization_id: string
          project_manager_id?: string | null
          scheduled_completion?: string | null
          start_date?: string | null
          state?: string | null
          status?: Database["public"]["Enums"]["job_status"]
          tags?: string[] | null
          title: string
          updated_at?: string
          updated_by?: string | null
          zip_code?: string | null
        }
        Update: {
          actual_completion?: string | null
          address_line_1?: string | null
          address_line_2?: string | null
          city?: string | null
          contact_id?: string
          contract_value?: number | null
          created_at?: string
          created_by?: string
          custom_fields?: Json | null
          description?: string | null
          division?: Database["public"]["Enums"]["division"]
          field_manager_id?: string | null
          id?: string
          job_number?: string
          lead_id?: string | null
          notes?: string | null
          organization_id?: string
          project_manager_id?: string | null
          scheduled_completion?: string | null
          start_date?: string | null
          state?: string | null
          status?: Database["public"]["Enums"]["job_status"]
          tags?: string[] | null
          title?: string
          updated_at?: string
          updated_by?: string | null
          zip_code?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "jobs_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "jobs_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "jobs_field_manager_id_fkey"
            columns: ["field_manager_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "jobs_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "jobs_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "jobs_project_manager_id_fkey"
            columns: ["project_manager_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "jobs_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      estimates: {
        Row: {
          accepted_at: string | null
          approved_by: string | null
          contact_id: string
          created_at: string
          created_by: string
          description: string | null
          division: Database["public"]["Enums"]["division"]
          estimate_number: string
          id: string
          lead_id: string | null
          notes: string | null
          organization_id: string
          prepared_by: string
          rejected_at: string | null
          sent_at: string | null
          status: Database["public"]["Enums"]["estimate_status"]
          subtotal: number
          tax_amount: number | null
          tax_rate: number | null
          terms: string | null
          title: string
          total_amount: number
          updated_at: string
          updated_by: string | null
          valid_until: string | null
          viewed_at: string | null
        }
        Insert: {
          accepted_at?: string | null
          approved_by?: string | null
          contact_id: string
          created_at?: string
          created_by: string
          description?: string | null
          division: Database["public"]["Enums"]["division"]
          estimate_number: string
          id?: string
          lead_id?: string | null
          notes?: string | null
          organization_id: string
          prepared_by: string
          rejected_at?: string | null
          sent_at?: string | null
          status?: Database["public"]["Enums"]["estimate_status"]
          subtotal?: number
          tax_amount?: number | null
          tax_rate?: number | null
          terms?: string | null
          title: string
          total_amount?: number
          updated_at?: string
          updated_by?: string | null
          valid_until?: string | null
          viewed_at?: string | null
        }
        Update: {
          accepted_at?: string | null
          approved_by?: string | null
          contact_id?: string
          created_at?: string
          created_by?: string
          description?: string | null
          division?: Database["public"]["Enums"]["division"]
          estimate_number?: string
          id?: string
          lead_id?: string | null
          notes?: string | null
          organization_id?: string
          prepared_by?: string
          rejected_at?: string | null
          sent_at?: string | null
          status?: Database["public"]["Enums"]["estimate_status"]
          subtotal?: number
          tax_amount?: number | null
          tax_rate?: number | null
          terms?: string | null
          title?: string
          total_amount?: number
          updated_at?: string
          updated_by?: string | null
          valid_until?: string | null
          viewed_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "estimates_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "estimates_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "estimates_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "estimates_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "estimates_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "estimates_prepared_by_fkey"
            columns: ["prepared_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "estimates_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      role_permissions: {
        Row: {
          action: string
          conditions: Json
          created_at: string
          id: string
          resource: string
          role: "owner" | "operations_manager" | "sales_manager" | "estimating_manager" | "estimator" | "field_management"
        }
        Insert: {
          action: string
          conditions?: Json
          created_at?: string
          id?: string
          resource: string
          role: "owner" | "operations_manager" | "sales_manager" | "estimating_manager" | "estimator" | "field_management"
        }
        Update: {
          action?: string
          conditions?: Json
          created_at?: string
          id?: string
          resource?: string
          role?: "owner" | "operations_manager" | "sales_manager" | "estimating_manager" | "estimator" | "field_management"
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      create_organization_registration: {
        Args: {
          p_email: string
          p_first_name: string
          p_last_name: string
          p_organization_data: Json
        }
        Returns: {
          registration_id: string
          registration_token: string
        }
      }
      get_user_org_info: {
        Args: {
          p_user_id: string
        }
        Returns: {
          user_id: string
          email: string
          first_name: string
          last_name: string
          display_name: string
          role: string
          status: string
          organization_id: string
          organization_name: string
          organization_slug: string
          organization_status: string
          permissions: Json
          last_login_at: string
          login_count: number
        }[]
      }
      invite_user_to_organization: {
        Args: {
          p_organization_id: string
          p_email: string
          p_role: Database["public"]["Enums"]["user_role"]
          p_invited_by: string
        }
        Returns: {
          invitation_id: string
          invitation_token: string
          expires_at: string
        }
      }
      switch_user_organization: {
        Args: {
          p_user_id: string
          p_organization_id: string
        }
        Returns: {
          success: boolean
          message: string
        }
      }
      increment_login_count: {
        Args: {
          user_id: string
        }
        Returns: number
      }
    }
    Enums: {
      communication_type: "email" | "phone" | "text" | "meeting" | "note" | "file"
      contact_type: "customer" | "prospect" | "vendor" | "crew" | "internal"
      division: "multi_family" | "single_family" | "repair_remodel"
      estimate_status: "draft" | "sent" | "viewed" | "accepted" | "rejected" | "expired"
      job_status: "pending" | "scheduled" | "in_progress" | "completed" | "on_hold" | "cancelled"
      lead_source: "referral" | "website" | "advertising" | "social_media" | "direct_mail" | "cold_call" | "trade_show" | "repeat_customer" | "other"
      lead_status: "new" | "contacted" | "qualified" | "quoted" | "proposal_sent" | "follow_up" | "won" | "lost" | "inactive"
      organization_status: "active" | "trial" | "suspended" | "cancelled"
      user_role: "owner" | "operations_manager" | "sales_manager" | "estimating_manager" | "estimator" | "field_management"
      user_status: "pending" | "active" | "inactive" | "suspended"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}