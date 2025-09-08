'use client'

import { createClient } from '@/lib/supabase/client'
import { Database, UserRole } from '@/types/supabase'

type Tables = Database['public']['Tables']

/**
 * API client for multi-tenant database operations
 * Automatically applies organization context to all queries
 */
export class ApiClient {
  private supabase = createClient()
  private organizationId: string | null = null

  constructor(organizationId?: string) {
    this.organizationId = organizationId || null
  }

  /**
   * Set the organization context for all subsequent queries
   */
  setOrganizationId(organizationId: string) {
    this.organizationId = organizationId
  }

  /**
   * Get the current organization ID
   */
  getOrganizationId(): string | null {
    return this.organizationId
  }

  /**
   * Get current user with organization data
   */
  async getCurrentUser() {
    const { data: { user }, error: authError } = await this.supabase.auth.getUser()
    
    if (authError || !user) {
      throw new Error('Not authenticated')
    }

    const { data: userData, error: userError } = await this.supabase
      .from('users')
      .select(`
        *,
        organization:organizations(*)
      `)
      .eq('id', user.id)
      .single()

    if (userError) {
      throw new Error('Failed to fetch user data')
    }

    return userData
  }

  /**
   * Generic query builder with organization context
   */
  private query<T extends keyof Tables>(table: T) {
    const query = this.supabase.from(table)
    
    // Apply organization filter if context is set
    if (this.organizationId) {
      return query.eq('organization_id', this.organizationId)
    }
    
    return query
  }

  /**
   * Users API
   */
  users = {
    list: async (filters?: { role?: UserRole; status?: string }) => {
      let query = this.query('users').select(`
        *,
        organization:organizations(*)
      `)

      if (filters?.role) {
        query = query.eq('role', filters.role)
      }

      if (filters?.status) {
        query = query.eq('status', filters.status)
      }

      const { data, error } = await query.order('created_at', { ascending: false })
      
      if (error) throw error
      return data
    },

    get: async (id: string) => {
      const { data, error } = await this.query('users')
        .select(`
          *,
          organization:organizations(*)
        `)
        .eq('id', id)
        .single()

      if (error) throw error
      return data
    },

    create: async (userData: Tables['users']['Insert']) => {
      if (this.organizationId) {
        userData.organization_id = this.organizationId
      }

      const { data, error } = await this.supabase
        .from('users')
        .insert(userData)
        .select()
        .single()

      if (error) throw error
      return data
    },

    update: async (id: string, userData: Tables['users']['Update']) => {
      const { data, error } = await this.query('users')
        .update(userData)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return data
    },

    delete: async (id: string) => {
      const { error } = await this.query('users')
        .delete()
        .eq('id', id)

      if (error) throw error
    }
  }

  /**
   * Organizations API
   */
  organizations = {
    getCurrent: async () => {
      if (!this.organizationId) {
        throw new Error('Organization context not set')
      }

      const { data, error } = await this.supabase
        .from('organizations')
        .select('*')
        .eq('id', this.organizationId)
        .single()

      if (error) throw error
      return data
    },

    update: async (organizationData: Tables['organizations']['Update']) => {
      if (!this.organizationId) {
        throw new Error('Organization context not set')
      }

      const { data, error } = await this.supabase
        .from('organizations')
        .update(organizationData)
        .eq('id', this.organizationId)
        .select()
        .single()

      if (error) throw error
      return data
    }
  }

  /**
   * Generic CRUD operations for any table with organization_id
   */
  table<T extends keyof Tables>(tableName: T) {
    return {
      list: async (filters?: Record<string, any>) => {
        let query = this.query(tableName).select('*')

        if (filters) {
          Object.entries(filters).forEach(([key, value]) => {
            query = query.eq(key, value)
          })
        }

        const { data, error } = await query.order('created_at', { ascending: false })
        if (error) throw error
        return data
      },

      get: async (id: string) => {
        const { data, error } = await this.query(tableName)
          .select('*')
          .eq('id', id)
          .single()

        if (error) throw error
        return data
      },

      create: async (recordData: Tables[T]['Insert']) => {
        if (this.organizationId && 'organization_id' in recordData) {
          (recordData as any).organization_id = this.organizationId
        }

        const { data, error } = await this.supabase
          .from(tableName)
          .insert(recordData)
          .select()
          .single()

        if (error) throw error
        return data
      },

      update: async (id: string, recordData: Tables[T]['Update']) => {
        const { data, error } = await this.query(tableName)
          .update(recordData)
          .eq('id', id)
          .select()
          .single()

        if (error) throw error
        return data
      },

      delete: async (id: string) => {
        const { error } = await this.query(tableName)
          .delete()
          .eq('id', id)

        if (error) throw error
      }
    }
  }

  /**
   * Execute raw SQL with organization context
   */
  async sql<T = any>(query: string, params?: Record<string, any>): Promise<T[]> {
    const finalParams = {
      ...params,
      organization_id: this.organizationId
    }

    const { data, error } = await this.supabase.rpc('execute_sql', {
      sql_query: query,
      params: finalParams
    })

    if (error) throw error
    return data
  }
}

/**
 * Create an API client instance with organization context
 */
export function createApiClient(organizationId?: string): ApiClient {
  return new ApiClient(organizationId)
}

/**
 * Hook to get API client with current user's organization context
 */
export function useApiClient(): ApiClient {
  // This would be enhanced to automatically get organization from auth context
  return new ApiClient()
}