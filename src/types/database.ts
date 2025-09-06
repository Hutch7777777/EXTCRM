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

export type ContactType = 
  | 'customer'
  | 'prospect'
  | 'vendor'
  | 'crew'
  | 'internal'

export type LeadSource = 
  | 'referral'
  | 'website'
  | 'advertising'
  | 'social_media'
  | 'direct_mail'
  | 'cold_call'
  | 'trade_show'
  | 'repeat_customer'
  | 'other'

export type LeadStatus = 
  | 'new'
  | 'contacted'
  | 'qualified'
  | 'quoted'
  | 'proposal_sent'
  | 'follow_up'
  | 'won'
  | 'lost'
  | 'inactive'

export type Division = 
  | 'multi_family'
  | 'single_family'
  | 'repair_remodel'

export type JobStatus = 
  | 'pending'
  | 'scheduled'
  | 'in_progress'
  | 'completed'
  | 'on_hold'
  | 'cancelled'

export type EstimateStatus = 
  | 'draft'
  | 'sent'
  | 'viewed'
  | 'accepted'
  | 'rejected'
  | 'expired'

export type CommunicationType = 
  | 'email'
  | 'phone'
  | 'text'
  | 'meeting'
  | 'note'
  | 'file'

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
      user_invitations: {
        Row: {
          id: string
          organization_id: string
          email: string
          role: UserRole
          invited_by: string
          invitation_token: string
          expires_at: string
          accepted_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          organization_id: string
          email: string
          role: UserRole
          invited_by: string
          invitation_token?: string
          expires_at?: string
          accepted_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          organization_id?: string
          email?: string
          role?: UserRole
          invited_by?: string
          invitation_token?: string
          expires_at?: string
          accepted_at?: string | null
          created_at?: string
        }
      }
      organization_registrations: {
        Row: {
          id: string
          auth_user_id: string
          organization_name: string
          organization_slug: string
          owner_first_name: string
          owner_last_name: string
          owner_email: string
          phone: string | null
          address_line_1: string | null
          city: string | null
          state: string | null
          zip_code: string | null
          registration_token: string
          is_completed: boolean
          created_at: string
          completed_at: string | null
        }
        Insert: {
          id?: string
          auth_user_id: string
          organization_name: string
          organization_slug: string
          owner_first_name: string
          owner_last_name: string
          owner_email: string
          phone?: string | null
          address_line_1?: string | null
          city?: string | null
          state?: string | null
          zip_code?: string | null
          registration_token?: string
          is_completed?: boolean
          created_at?: string
          completed_at?: string | null
        }
        Update: {
          id?: string
          auth_user_id?: string
          organization_name?: string
          organization_slug?: string
          owner_first_name?: string
          owner_last_name?: string
          owner_email?: string
          phone?: string | null
          address_line_1?: string | null
          city?: string | null
          state?: string | null
          zip_code?: string | null
          registration_token?: string
          is_completed?: boolean
          created_at?: string
          completed_at?: string | null
        }
      }
      contacts: {
        Row: {
          id: string
          organization_id: string
          type: ContactType
          first_name: string | null
          last_name: string | null
          company_name: string | null
          display_name: string
          email: string | null
          phone: string | null
          mobile: string | null
          address_line_1: string | null
          address_line_2: string | null
          city: string | null
          state: string | null
          zip_code: string | null
          country: string
          website_url: string | null
          notes: string | null
          tags: string[]
          custom_fields: Json
          is_active: boolean
          created_by: string
          updated_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          organization_id: string
          type: ContactType
          first_name?: string | null
          last_name?: string | null
          company_name?: string | null
          display_name: string
          email?: string | null
          phone?: string | null
          mobile?: string | null
          address_line_1?: string | null
          address_line_2?: string | null
          city?: string | null
          state?: string | null
          zip_code?: string | null
          country?: string
          website_url?: string | null
          notes?: string | null
          tags?: string[]
          custom_fields?: Json
          is_active?: boolean
          created_by: string
          updated_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          organization_id?: string
          type?: ContactType
          first_name?: string | null
          last_name?: string | null
          company_name?: string | null
          display_name?: string
          email?: string | null
          phone?: string | null
          mobile?: string | null
          address_line_1?: string | null
          address_line_2?: string | null
          city?: string | null
          state?: string | null
          zip_code?: string | null
          country?: string
          website_url?: string | null
          notes?: string | null
          tags?: string[]
          custom_fields?: Json
          is_active?: boolean
          created_by?: string
          updated_by?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      leads: {
        Row: {
          id: string
          organization_id: string
          contact_id: string | null
          title: string
          description: string | null
          source: LeadSource
          status: LeadStatus
          division: Division
          estimated_value: number | null
          probability: number | null
          expected_close_date: string | null
          address_line_1: string | null
          address_line_2: string | null
          city: string | null
          state: string | null
          zip_code: string | null
          priority: number
          tags: string[]
          custom_fields: Json
          assigned_to: string | null
          created_by: string
          updated_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          organization_id: string
          contact_id?: string | null
          title: string
          description?: string | null
          source: LeadSource
          status?: LeadStatus
          division: Division
          estimated_value?: number | null
          probability?: number | null
          expected_close_date?: string | null
          address_line_1?: string | null
          address_line_2?: string | null
          city?: string | null
          state?: string | null
          zip_code?: string | null
          priority?: number
          tags?: string[]
          custom_fields?: Json
          assigned_to?: string | null
          created_by: string
          updated_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          organization_id?: string
          contact_id?: string | null
          title?: string
          description?: string | null
          source?: LeadSource
          status?: LeadStatus
          division?: Division
          estimated_value?: number | null
          probability?: number | null
          expected_close_date?: string | null
          address_line_1?: string | null
          address_line_2?: string | null
          city?: string | null
          state?: string | null
          zip_code?: string | null
          priority?: number
          tags?: string[]
          custom_fields?: Json
          assigned_to?: string | null
          created_by?: string
          updated_by?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      jobs: {
        Row: {
          id: string
          organization_id: string
          lead_id: string | null
          contact_id: string
          job_number: string
          title: string
          description: string | null
          division: Division
          status: JobStatus
          contract_value: number | null
          start_date: string | null
          scheduled_completion: string | null
          actual_completion: string | null
          address_line_1: string | null
          address_line_2: string | null
          city: string | null
          state: string | null
          zip_code: string | null
          project_manager_id: string | null
          field_manager_id: string | null
          notes: string | null
          tags: string[]
          custom_fields: Json
          created_by: string
          updated_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          organization_id: string
          lead_id?: string | null
          contact_id: string
          job_number: string
          title: string
          description?: string | null
          division: Division
          status?: JobStatus
          contract_value?: number | null
          start_date?: string | null
          scheduled_completion?: string | null
          actual_completion?: string | null
          address_line_1?: string | null
          address_line_2?: string | null
          city?: string | null
          state?: string | null
          zip_code?: string | null
          project_manager_id?: string | null
          field_manager_id?: string | null
          notes?: string | null
          tags?: string[]
          custom_fields?: Json
          created_by: string
          updated_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          organization_id?: string
          lead_id?: string | null
          contact_id?: string
          job_number?: string
          title?: string
          description?: string | null
          division?: Division
          status?: JobStatus
          contract_value?: number | null
          start_date?: string | null
          scheduled_completion?: string | null
          actual_completion?: string | null
          address_line_1?: string | null
          address_line_2?: string | null
          city?: string | null
          state?: string | null
          zip_code?: string | null
          project_manager_id?: string | null
          field_manager_id?: string | null
          notes?: string | null
          tags?: string[]
          custom_fields?: Json
          created_by?: string
          updated_by?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      estimates: {
        Row: {
          id: string
          organization_id: string
          lead_id: string | null
          contact_id: string
          estimate_number: string
          title: string
          description: string | null
          division: Division
          status: EstimateStatus
          subtotal: number
          tax_rate: number
          tax_amount: number
          total_amount: number
          valid_until: string | null
          terms: string | null
          notes: string | null
          sent_at: string | null
          viewed_at: string | null
          accepted_at: string | null
          rejected_at: string | null
          prepared_by: string
          approved_by: string | null
          created_by: string
          updated_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          organization_id: string
          lead_id?: string | null
          contact_id: string
          estimate_number: string
          title: string
          description?: string | null
          division: Division
          status?: EstimateStatus
          subtotal?: number
          tax_rate?: number
          tax_amount?: number
          total_amount?: number
          valid_until?: string | null
          terms?: string | null
          notes?: string | null
          sent_at?: string | null
          viewed_at?: string | null
          accepted_at?: string | null
          rejected_at?: string | null
          prepared_by: string
          approved_by?: string | null
          created_by: string
          updated_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          organization_id?: string
          lead_id?: string | null
          contact_id?: string
          estimate_number?: string
          title?: string
          description?: string | null
          division?: Division
          status?: EstimateStatus
          subtotal?: number
          tax_rate?: number
          tax_amount?: number
          total_amount?: number
          valid_until?: string | null
          terms?: string | null
          notes?: string | null
          sent_at?: string | null
          viewed_at?: string | null
          accepted_at?: string | null
          rejected_at?: string | null
          prepared_by?: string
          approved_by?: string | null
          created_by?: string
          updated_by?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      estimate_line_items: {
        Row: {
          id: string
          organization_id: string
          estimate_id: string
          sort_order: number
          item_type: string
          description: string
          quantity: number
          unit: string
          unit_price: number
          line_total: number
          notes: string | null
          created_at: string
        }
        Insert: {
          id?: string
          organization_id: string
          estimate_id: string
          sort_order?: number
          item_type?: string
          description: string
          quantity?: number
          unit?: string
          unit_price?: number
          line_total?: number
          notes?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          organization_id?: string
          estimate_id?: string
          sort_order?: number
          item_type?: string
          description?: string
          quantity?: number
          unit?: string
          unit_price?: number
          line_total?: number
          notes?: string | null
          created_at?: string
        }
      }
      communications: {
        Row: {
          id: string
          organization_id: string
          contact_id: string | null
          lead_id: string | null
          job_id: string | null
          type: CommunicationType
          direction: string | null
          subject: string | null
          content: string | null
          scheduled_at: string | null
          completed_at: string | null
          duration_minutes: number | null
          follow_up_required: boolean
          follow_up_date: string | null
          participants: Json
          attachments: Json
          created_by: string
          created_at: string
        }
        Insert: {
          id?: string
          organization_id: string
          contact_id?: string | null
          lead_id?: string | null
          job_id?: string | null
          type: CommunicationType
          direction?: string | null
          subject?: string | null
          content?: string | null
          scheduled_at?: string | null
          completed_at?: string | null
          duration_minutes?: number | null
          follow_up_required?: boolean
          follow_up_date?: string | null
          participants?: Json
          attachments?: Json
          created_by: string
          created_at?: string
        }
        Update: {
          id?: string
          organization_id?: string
          contact_id?: string | null
          lead_id?: string | null
          job_id?: string | null
          type?: CommunicationType
          direction?: string | null
          subject?: string | null
          content?: string | null
          scheduled_at?: string | null
          completed_at?: string | null
          duration_minutes?: number | null
          follow_up_required?: boolean
          follow_up_date?: string | null
          participants?: Json
          attachments?: Json
          created_by?: string
          created_at?: string
        }
      }
      file_attachments: {
        Row: {
          id: string
          organization_id: string
          filename: string
          original_filename: string
          file_size: number
          mime_type: string
          storage_path: string
          description: string | null
          uploaded_by: string
          created_at: string
        }
        Insert: {
          id?: string
          organization_id: string
          filename: string
          original_filename: string
          file_size: number
          mime_type: string
          storage_path: string
          description?: string | null
          uploaded_by: string
          created_at?: string
        }
        Update: {
          id?: string
          organization_id?: string
          filename?: string
          original_filename?: string
          file_size?: number
          mime_type?: string
          storage_path?: string
          description?: string | null
          uploaded_by?: string
          created_at?: string
        }
      }
      role_permissions: {
        Row: {
          id: string
          role: UserRole
          resource: string
          action: string
          conditions: Json
          created_at: string
        }
        Insert: {
          id?: string
          role: UserRole
          resource: string
          action: string
          conditions?: Json
          created_at?: string
        }
        Update: {
          id?: string
          role?: UserRole
          resource?: string
          action?: string
          conditions?: Json
          created_at?: string
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
      ref_states: {
        Row: {
          code: string
          name: string
          is_active: boolean
        }
        Insert: {
          code: string
          name: string
          is_active?: boolean
        }
        Update: {
          code?: string
          name?: string
          is_active?: boolean
        }
      }
      ref_materials: {
        Row: {
          id: string
          category: string
          name: string
          unit: string
          base_cost: number | null
          is_active: boolean
          created_at: string
        }
        Insert: {
          id?: string
          category: string
          name: string
          unit?: string
          base_cost?: number | null
          is_active?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          category?: string
          name?: string
          unit?: string
          base_cost?: number | null
          is_active?: boolean
          created_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_next_job_number: {
        Args: {
          org_id: string
        }
        Returns: string
      }
      get_next_estimate_number: {
        Args: {
          org_id: string
        }
        Returns: string
      }
      create_organization_registration: {
        Args: {
          p_auth_user_id: string
          p_organization_name: string
          p_organization_slug: string
          p_owner_first_name: string
          p_owner_last_name: string
          p_owner_email: string
          p_phone?: string
          p_address_line_1?: string
          p_city?: string
          p_state?: string
          p_zip_code?: string
        }
        Returns: string
      }
      invite_user_to_organization: {
        Args: {
          p_organization_id: string
          p_email: string
          p_role: UserRole
          p_invited_by: string
        }
        Returns: string
      }
      get_user_org_info: {
        Args: {
          p_user_id: string
        }
        Returns: {
          user_id: string
          organization_id: string
          organization_name: string
          organization_slug: string
          user_role: UserRole
          user_status: UserStatus
          is_admin: boolean
        }[]
      }
      switch_user_organization: {
        Args: {
          p_user_id: string
          p_target_organization_id: string
        }
        Returns: boolean
      }
      cleanup_expired_invitations: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      get_organization_stats: {
        Args: {
          p_organization_id: string
        }
        Returns: {
          total_users: number
          active_users: number
          pending_invitations: number
          total_leads: number
          total_jobs: number
          total_estimates: number
        }[]
      }
    }
    Enums: {
      user_role: UserRole
      user_status: UserStatus
      organization_status: OrganizationStatus
      contact_type: ContactType
      lead_source: LeadSource
      lead_status: LeadStatus
      division: Division
      job_status: JobStatus
      estimate_status: EstimateStatus
      communication_type: CommunicationType
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}