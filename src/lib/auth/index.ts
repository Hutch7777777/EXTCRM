// Authentication system exports
// Centralized imports for the authentication system

// Context and hooks
export { AuthProvider, useAuth } from '@/contexts/auth-context'
export { usePermissions } from '@/hooks/use-permissions'

// Components
export { RoleGate, withRoleGate } from '@/components/auth/role-gate'
export { ProtectedRoute } from '@/components/auth/protected-route'

// Server-side helpers
export {
  getCurrentUser,
  getCurrentOrganizationId,
  hasRole,
  hasPermission,
  requireAuth,
  requireRole,
  requireOwner,
  getSession,
  trackSession,
  updateLastLogin
} from '@/lib/auth-helpers'

// Supabase clients
export { createClient, supabase } from '@/lib/supabase/client'
export { 
  createServerClient, 
  createServerActionClient, 
  createRouteClient, 
  createAdminClient 
} from '@/lib/supabase/server'

// API client
export { createApiClient, useApiClient, ApiClient } from '@/lib/api-client'

// Types
export type { 
  UserRole, 
  UserStatus, 
  OrganizationStatus, 
  Database 
} from '@/types/supabase'

export type { AuthUser } from '@/contexts/auth-context'