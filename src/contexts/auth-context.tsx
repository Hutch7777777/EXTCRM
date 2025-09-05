'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
import { User, AuthError } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/client'
import { UserRole, Database } from '@/types/database'

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
  signIn: (email: string, password: string) => Promise<{ error?: AuthError }>
  signOut: () => Promise<void>
  signUp: (email: string, password: string, userData: {
    first_name: string
    last_name: string
    organization_name?: string
  }) => Promise<{ error?: AuthError }>
  
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
    if (!supabaseUser) {
      setUser(null)
      setCurrentOrganization(null)
      setLoading(false)
      return
    }

    try {
      // Get user data with organization
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select(`
          *,
          organization:organizations(*)
        `)
        .eq('id', supabaseUser.id)
        .single()

      if (userError) {
        console.error('Error loading user data:', userError)
        setLoading(false)
        return
      }

      if (!userData) {
        setLoading(false)
        return
      }

      // For now, create organizations array with current organization
      // In production, you'd query user_organization_roles table
      const organizations = userData.organization ? [{
        id: userData.organization.id,
        name: userData.organization.name,
        slug: userData.organization.slug,
        role: userData.role,
        is_active: true
      }] : []

      // Set current organization (primary organization from users table)
      const currentOrg = userData.organization || null

      const authUser: AuthUser = {
        ...userData,
        organizations,
        current_organization: currentOrg
      }

      setUser(authUser)
      setCurrentOrganization(currentOrg)
      setSupabaseUser(supabaseUser)
      
      // Store current organization in localStorage for persistence
      if (currentOrg) {
        localStorage.setItem('current_organization_id', currentOrg.id)
      }
      
    } catch (error) {
      console.error('Error in loadUserData:', error)
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
      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        await loadUserData(session?.user || null)
      } else if (event === 'SIGNED_OUT') {
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

    // Find the organization in user's organizations
    const targetOrg = user.organizations?.find(org => org.id === organizationId)
    if (!targetOrg) {
      throw new Error('Organization not found in user organizations')
    }

    // Update user's current organization
    const { error } = await supabase
      .from('users')
      .update({ organization_id: organizationId })
      .eq('id', user.id)

    if (error) {
      console.error('Error switching organization:', error)
      throw error
    }

    // Refresh user data
    await refreshUser()
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