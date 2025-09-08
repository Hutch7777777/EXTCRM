import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { createErrorResponse, checkRateLimit, getRequestMetadata } from '@/lib/api-helpers'
import { UserRole } from '@/types/supabase'

/**
 * Authentication middleware for API routes
 */
export async function withAuth<T = any>(
  request: NextRequest,
  handler: (request: NextRequest, context: AuthContext) => Promise<NextResponse>,
  options: AuthMiddlewareOptions = {}
): Promise<NextResponse> {
  try {
    // Rate limiting
    if (options.rateLimit) {
      const ip = getRequestMetadata(request).ipAddress || 'unknown'
      if (!checkRateLimit(ip, options.rateLimit.limit, options.rateLimit.windowMs)) {
        return createErrorResponse('Too many requests', 429)
      }
    }

    // Get authentication
    const adminSupabase = createAdminClient()
    const authHeader = request.headers.get('authorization')
    
    if (!authHeader?.startsWith('Bearer ')) {
      return createErrorResponse('Authentication required', 401)
    }

    const token = authHeader.substring(7)
    
    // Verify the JWT token
    const { data: { user }, error: authError } = await adminSupabase.auth.getUser(token)
    
    if (authError || !user) {
      return createErrorResponse('Invalid or expired token', 401)
    }

    // Get user data with organization
    const { data: userData, error: userError } = await adminSupabase
      .from('users')
      .select(`
        *,
        organization:organizations(*)
      `)
      .eq('id', user.id)
      .single()

    if (userError || !userData) {
      return createErrorResponse('User profile not found', 404)
    }

    // Check if user is active
    if (userData.status !== 'active') {
      return createErrorResponse('User account is not active', 403)
    }

    // Check organization status
    if (userData.organization.status !== 'active' && userData.organization.status !== 'trial') {
      return createErrorResponse('Organization is not active', 403)
    }

    // Role-based access control
    if (options.requiredRoles) {
      const roles = Array.isArray(options.requiredRoles) ? options.requiredRoles : [options.requiredRoles]
      if (!roles.includes(userData.role)) {
        return createErrorResponse('Insufficient permissions', 403)
      }
    }

    // Resource-based access control
    if (options.resourcePermission) {
      const { resource, action } = options.resourcePermission
      
      // Owners have all permissions
      if (userData.role !== 'owner') {
        const { data: permissions } = await adminSupabase
          .from('role_permissions')
          .select('*')
          .eq('role', userData.role)
          .eq('resource', resource)
          .eq('action', action)

        if (!permissions || permissions.length === 0) {
          return createErrorResponse(`Permission denied: ${action} on ${resource}`, 403)
        }
      }
    }

    // Create context for the handler
    const context: AuthContext = {
      user: userData as any,
      organization: userData.organization as any,
      supabase: adminSupabase,
      metadata: getRequestMetadata(request)
    }

    // Call the actual handler
    return await handler(request, context)

  } catch (error) {
    console.error('Auth middleware error:', error)
    return createErrorResponse('Authentication error', 500)
  }
}

/**
 * Organization-scoped middleware
 */
export async function withOrganization<T = any>(
  request: NextRequest,
  handler: (request: NextRequest, context: OrganizationContext) => Promise<NextResponse>,
  options: OrganizationMiddlewareOptions = {}
): Promise<NextResponse> {
  return withAuth(request, async (req, authContext) => {
    try {
      // Get organization stats if requested
      let organizationStats = null
      if (options.includeStats) {
        const { data: stats } = await authContext.supabase.rpc('get_organization_stats', {
          p_organization_id: authContext.organization.id
        })
        organizationStats = stats?.[0] || null
      }

      const orgContext: OrganizationContext = {
        ...authContext,
        organizationStats
      }

      return await handler(req, orgContext)
    } catch (error) {
      console.error('Organization middleware error:', error)
      return createErrorResponse('Organization access error', 500)
    }
  }, options)
}

/**
 * Simple authentication check for public endpoints
 */
export async function withOptionalAuth<T = any>(
  request: NextRequest,
  handler: (request: NextRequest, context: OptionalAuthContext) => Promise<NextResponse>
): Promise<NextResponse> {
  try {
    const authHeader = request.headers.get('authorization')
    let user = null
    let organization = null

    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.substring(7)
      const adminSupabase = createAdminClient()
      
      const { data: { user: authUser } } = await adminSupabase.auth.getUser(token)
      
      if (authUser) {
        const { data: userData } = await adminSupabase
          .from('users')
          .select(`
            *,
            organization:organizations(*)
          `)
          .eq('id', authUser.id)
          .single()

        if (userData && userData.status === 'active') {
          user = userData as any
          organization = userData.organization as any
        }
      }
    }

    const context: OptionalAuthContext = {
      user,
      organization,
      isAuthenticated: !!user,
      metadata: getRequestMetadata(request)
    }

    return await handler(request, context)
  } catch (error) {
    console.error('Optional auth middleware error:', error)
    return createErrorResponse('Authentication error', 500)
  }
}

// Type definitions
export interface AuthContext {
  user: {
    id: string
    organization_id: string
    email: string
    first_name: string
    last_name: string
    role: UserRole
    status: string
    is_admin: boolean
    [key: string]: any
  }
  organization: {
    id: string
    name: string
    slug: string
    status: string
    [key: string]: any
  }
  supabase: any
  metadata: {
    userAgent: string | null
    ipAddress: string | null
    timestamp: string
    url: string
    method: string
  }
}

export interface OrganizationContext extends AuthContext {
  organizationStats: {
    total_users: number
    active_users: number
    pending_invitations: number
    total_leads: number
    total_jobs: number
    total_estimates: number
  } | null
}

export interface OptionalAuthContext {
  user: AuthContext['user'] | null
  organization: AuthContext['organization'] | null
  isAuthenticated: boolean
  metadata: AuthContext['metadata']
}

export interface AuthMiddlewareOptions {
  requiredRoles?: UserRole | UserRole[]
  resourcePermission?: {
    resource: string
    action: string
  }
  rateLimit?: {
    limit: number
    windowMs: number
  }
}

export interface OrganizationMiddlewareOptions extends AuthMiddlewareOptions {
  includeStats?: boolean
}

/**
 * Helper to create middleware-wrapped API handlers
 */
export function createAuthenticatedHandler(
  handlers: {
    GET?: (req: NextRequest, ctx: AuthContext) => Promise<NextResponse>
    POST?: (req: NextRequest, ctx: AuthContext) => Promise<NextResponse>
    PUT?: (req: NextRequest, ctx: AuthContext) => Promise<NextResponse>
    PATCH?: (req: NextRequest, ctx: AuthContext) => Promise<NextResponse>
    DELETE?: (req: NextRequest, ctx: AuthContext) => Promise<NextResponse>
  },
  options: AuthMiddlewareOptions = {}
) {
  const wrappedHandlers: { [key: string]: any } = {}

  for (const [method, handler] of Object.entries(handlers)) {
    if (handler) {
      wrappedHandlers[method] = async (request: NextRequest) => {
        // Validate method
        if (request.method !== method) {
          return createErrorResponse('Method not allowed', 405)
        }

        return withAuth(request, handler, options)
      }
    }
  }

  // Add method not allowed handler for unsupported methods
  const supportedMethods = Object.keys(handlers)
  const allMethods = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE']
  
  for (const method of allMethods) {
    if (!supportedMethods.includes(method)) {
      wrappedHandlers[method] = () => createErrorResponse('Method not allowed', 405)
    }
  }

  return wrappedHandlers
}