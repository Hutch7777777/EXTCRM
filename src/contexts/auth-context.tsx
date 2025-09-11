'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
import { User, AuthError } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/client'
import { UserRole, Database } from '@/types/supabase'

type Tables = Database['public']['Tables']
type UserRow = Tables['users']['Row']
type OrganizationRow = Tables['organizations']['Row']

export interface AuthUser extends UserRow {
  organizations?: Array<{
    id: string
    name: string
    slug: string
    role: UserRole
    is_active: boolean
  }>
  current_organization?: OrganizationRow
}

interface AuthContextType {
  user: AuthUser | null
  supabaseUser: User | null
  currentOrganization: OrganizationRow | null
  currentRole: UserRole | null
  organizations: AuthUser['organizations']
  loading: boolean
  
  // Auth methods
  signIn: (email: string, password: string) => Promise<{ error: AuthError | null }>
  signOut: () => Promise<void>
  signUp: (email: string, password: string, userData: {
    first_name: string
    last_name: string
    organization_name?: string
  }) => Promise<{ error: AuthError | null }>
  
  // Organization methods
  switchOrganization: (organizationId: string) => Promise<void>
  refreshUser: () => Promise<void>
  
  // Permission methods
  hasPermission: (resource: string, action: string) => boolean
  hasRole: (role: UserRole | UserRole[]) => boolean
  isOwner: boolean
  isAdmin: boolean
}

const AuthContext = createContext<AuthContextType | null>(null)

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

interface AuthProviderProps {
  children: React.ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [supabaseUser, setSupabaseUser] = useState<User | null>(null)
  const [currentOrganization, setCurrentOrganization] = useState<OrganizationRow | null>(null)
  const [loading, setLoading] = useState(true)
  
  const supabase = createClient()

  // Load user data including organizations and current context
  const loadUserData = async (supabaseUser: User | null) => {
    console.log('🔄 [AuthContext] Loading user data for:', supabaseUser?.email || 'null')
    
    if (!supabaseUser) {
      console.log('❌ [AuthContext] No supabase user found')
      setUser(null)
      setCurrentOrganization(null)
      setLoading(false)
      return
    }

    try {
      console.log('🔄 [AuthContext] Fetching user data from API...')
      
      // Use the API endpoint to get complete user + org info
      const response = await fetch('/api/auth/user', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
        }
      })

      console.log('📋 [AuthContext] API response status:', response.status)

      if (!response.ok) {
        // If user not found in our system, they may need to complete registration
        if (response.status === 404) {
          console.log('❌ [AuthContext] User not found in system (404) - may need registration')
          setUser(null)
          setCurrentOrganization(null)
          setSupabaseUser(supabaseUser)
          setLoading(false)
          return
        }
        
        // Handle database/server errors gracefully during setup
        if (response.status >= 500) {
          console.warn('⚠️ [AuthContext] Server error during auth setup, proceeding with basic auth:', response.status)
          setUser(null)
          setCurrentOrganization(null)
          setSupabaseUser(supabaseUser)
          setLoading(false)
          return
        }
        
        throw new Error(`Failed to load user data: ${response.status}`)
      }

      const { user: userData, organization: currentOrg } = await response.json()
      console.log('📋 [AuthContext] API data received:', { 
        hasUser: !!userData, 
        hasOrg: !!currentOrg,
        userRole: userData?.role 
      })

      if (!userData) {
        setUser(null)
        setCurrentOrganization(null)
        setSupabaseUser(supabaseUser)
        setLoading(false)
        return
      }

      // Create organizations array (in the future this would include multiple orgs)
      const organizations = currentOrg ? [{
        id: currentOrg.id,
        name: currentOrg.name,
        slug: currentOrg.slug,
        role: userData.role,
        is_active: true
      }] : []

      const authUser: AuthUser = {
        ...userData,
        organizations,
        current_organization: currentOrg
      }

      console.log('✅ [AuthContext] User data loaded successfully:', authUser.email, authUser.role)
      
      setUser(authUser)
      setCurrentOrganization(currentOrg)
      setSupabaseUser(supabaseUser)
      
      // Store current organization in localStorage for persistence
      if (currentOrg) {
        localStorage.setItem('current_organization_id', currentOrg.id)
        console.log('💾 [AuthContext] Stored current organization:', currentOrg.name)
      }
      
    } catch (error) {
      console.error('Error in loadUserData:', error)
      // On error, still set supabaseUser so we can handle incomplete registrations
      setUser(null)
      setCurrentOrganization(null)
      setSupabaseUser(supabaseUser)
    } finally {
      setLoading(false)
    }
  }

  // Initialize auth state
  useEffect(() => {
    // Get initial session
    const getInitialSession = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      await loadUserData(session?.user || null)
    }

    getInitialSession()

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('🔄 [AuthContext] Auth state change:', event, session?.user?.email || 'no user')
      
      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        await loadUserData(session?.user || null)
      } else if (event === 'SIGNED_OUT') {
        console.log('👋 [AuthContext] User signed out, clearing state')
        setUser(null)
        setSupabaseUser(null)
        setCurrentOrganization(null)
        localStorage.removeItem('current_organization_id')
        setLoading(false)
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  // Auth methods
  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    return { error }
  }

  const signOut = async () => {
    const { error } = await supabase.auth.signOut()
    if (error) {
      console.error('Error signing out:', error)
    }
  }

  const signUp = async (email: string, password: string, userData: {
    first_name: string
    last_name: string
    organization_name?: string
  }) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: userData
      }
    })
    return { error }
  }

  // Organization methods
  const switchOrganization = async (organizationId: string) => {
    if (!user) return

    try {
      // Use the API endpoint for organization switching
      const response = await fetch('/api/auth/switch-organization', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
        },
        body: JSON.stringify({ organization_id: organizationId })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to switch organization')
      }

      // Refresh user data
      await refreshUser()
    } catch (error) {
      console.error('Error switching organization:', error)
      throw error
    }
  }

  const refreshUser = async () => {
    if (supabaseUser) {
      await loadUserData(supabaseUser)
    }
  }

  // Permission methods
  const hasPermission = (resource: string, action: string): boolean => {
    if (!user || !user.role) return false

    // Owners have all permissions
    if (user.role === 'owner') return true

    // Check specific permissions based on role
    // This would be enhanced with the role_permissions table data
    const rolePermissions: Record<UserRole, string[]> = {
      owner: ['*'],
      operations_manager: [
        'users:create', 'users:read', 'users:update',
        'contacts:create', 'contacts:read', 'contacts:update',
        'leads:read', 'leads:update',
        'jobs:read', 'jobs:update',
        'estimates:read'
      ],
      sales_manager: [
        'contacts:create', 'contacts:read', 'contacts:update',
        'leads:create', 'leads:read', 'leads:update',
        'jobs:read', 'estimates:read'
      ],
      estimating_manager: [
        'contacts:read', 'leads:read', 'leads:update',
        'jobs:read', 'estimates:create', 'estimates:read', 'estimates:update'
      ],
      estimator: [
        'contacts:read', 'leads:read', 'leads:update',
        'estimates:create', 'estimates:read', 'estimates:update'
      ],
      field_management: [
        'contacts:read', 'jobs:read', 'jobs:update'
      ]
    }

    const permissions = rolePermissions[user.role] || []
    const permission = `${resource}:${action}`
    
    return permissions.includes('*') || permissions.includes(permission)
  }

  const hasRole = (roles: UserRole | UserRole[]): boolean => {
    if (!user || !user.role) return false
    const roleArray = Array.isArray(roles) ? roles : [roles]
    return roleArray.includes(user.role)
  }

  const isOwner = user?.role === 'owner'
  const isAdmin = user?.is_admin === true || isOwner

  const currentRole = user?.role || null
  const organizations = user?.organizations || []

  const value: AuthContextType = {
    user,
    supabaseUser,
    currentOrganization,
    currentRole,
    organizations,
    loading,
    
    signIn,
    signOut,
    signUp,
    
    switchOrganization,
    refreshUser,
    
    hasPermission,
    hasRole,
    isOwner,
    isAdmin,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}