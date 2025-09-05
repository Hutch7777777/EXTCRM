import { createServerClient } from '@/lib/supabase/server'
import { createRouteClient } from '@/lib/supabase/server'
import { UserRole, Database } from '@/types/database'
import { cookies } from 'next/headers'

type Tables = Database['public']['Tables']
type UserRow = Tables['users']['Row']
type OrganizationRow = Tables['organizations']['Row']

export interface AuthUser extends UserRow {
  organization: OrganizationRow
}

/**
 * Get current authenticated user from server context
 */
export async function getCurrentUser(): Promise<AuthUser | null> {
  try {
    const supabase = createServerClient()
    
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return null
    }

    // Get user data with organization
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select(`
        *,
        organization:organizations(*)
      `)
      .eq('id', user.id)
      .single()

    if (userError || !userData) {
      console.error('Error fetching user data:', userError)
      return null
    }

    return userData as AuthUser
  } catch (error) {
    console.error('Error in getCurrentUser:', error)
    return null
  }
}

/**
 * Get current user's organization ID from server context
 */
export async function getCurrentOrganizationId(): Promise<string | null> {
  const user = await getCurrentUser()
  return user?.organization_id || null
}

/**
 * Check if current user has a specific role
 */
export async function hasRole(roles: UserRole | UserRole[]): Promise<boolean> {
  const user = await getCurrentUser()
  if (!user) return false
  
  const roleArray = Array.isArray(roles) ? roles : [roles]
  return roleArray.includes(user.role)
}

/**
 * Check if current user has a specific permission
 */
export async function hasPermission(resource: string, action: string): Promise<boolean> {
  const user = await getCurrentUser()
  if (!user) return false

  // Owners have all permissions
  if (user.role === 'owner') return true

  try {
    const supabase = createServerClient()
    
    const { data: permissions } = await supabase
      .from('role_permissions')
      .select('*')
      .eq('role', user.role)
      .eq('resource', resource)
      .eq('action', action)

    return (permissions && permissions.length > 0) || false
  } catch (error) {
    console.error('Error checking permission:', error)
    return false
  }
}

/**
 * Get user session data for API routes
 */
export async function getSession() {
  try {
    const supabase = createRouteClient()
    const { data: { session }, error } = await supabase.auth.getSession()
    
    if (error) {
      console.error('Session error:', error)
      return null
    }
    
    return session
  } catch (error) {
    console.error('Error getting session:', error)
    return null
  }
}

/**
 * Require authentication - throws error if not authenticated
 */
export async function requireAuth(): Promise<AuthUser> {
  const user = await getCurrentUser()
  
  if (!user) {
    throw new Error('Authentication required')
  }
  
  return user
}

/**
 * Require specific role - throws error if not authorized
 */
export async function requireRole(roles: UserRole | UserRole[]): Promise<AuthUser> {
  const user = await requireAuth()
  const roleArray = Array.isArray(roles) ? roles : [roles]
  
  if (!roleArray.includes(user.role)) {
    throw new Error(`Required role: ${roleArray.join(' or ')}`)
  }
  
  return user
}

/**
 * Require owner role - throws error if not owner
 */
export async function requireOwner(): Promise<AuthUser> {
  return await requireRole('owner')
}

/**
 * Create session tracking for analytics
 */
export async function trackSession(deviceInfo?: any) {
  try {
    const user = await getCurrentUser()
    if (!user) return

    const supabase = createRouteClient()
    
    // Get request info (this would be enhanced with actual request data)
    const sessionData = {
      user_id: user.id,
      organization_id: user.organization_id,
      device_info: deviceInfo || {},
      started_at: new Date().toISOString(),
      last_activity_at: new Date().toISOString(),
      is_active: true
    }

    const { error } = await supabase
      .from('user_sessions')
      .insert(sessionData)

    if (error) {
      console.error('Error tracking session:', error)
    }
  } catch (error) {
    console.error('Error in trackSession:', error)
  }
}

/**
 * Update user's last login timestamp
 */
export async function updateLastLogin(userId: string) {
  try {
    const supabase = createRouteClient()
    
    const { error } = await supabase
      .from('users')
      .update({ 
        last_login_at: new Date().toISOString(),
        login_count: supabase.rpc('increment_login_count', { user_id: userId })
      })
      .eq('id', userId)

    if (error) {
      console.error('Error updating last login:', error)
    }
  } catch (error) {
    console.error('Error in updateLastLogin:', error)
  }
}