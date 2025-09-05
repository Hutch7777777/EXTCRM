'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/auth-context'
import { UserRole } from '@/types/database'

interface ProtectedRouteProps {
  children: React.ReactNode
  requiredRoles?: UserRole[]
  requiredPermissions?: Array<{
    resource: string
    action: string
  }>
  redirectTo?: string
  requireOwner?: boolean
  requireAdmin?: boolean
}

/**
 * Component that protects routes based on authentication and authorization
 */
export function ProtectedRoute({
  children,
  requiredRoles,
  requiredPermissions,
  redirectTo = '/auth/login',
  requireOwner = false,
  requireAdmin = false,
}: ProtectedRouteProps) {
  const { user, hasRole, hasPermission, isOwner, isAdmin, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (loading) return // Wait for auth to initialize

    // Redirect to login if not authenticated
    if (!user) {
      router.push(redirectTo)
      return
    }

    // Check owner requirement
    if (requireOwner && !isOwner) {
      router.push('/dashboard') // Redirect to safe page
      return
    }

    // Check admin requirement
    if (requireAdmin && !isAdmin) {
      router.push('/dashboard') // Redirect to safe page
      return
    }

    // Check role requirements
    if (requiredRoles && !hasRole(requiredRoles)) {
      router.push('/dashboard') // Redirect to safe page
      return
    }

    // Check permission requirements
    if (requiredPermissions) {
      const hasAllPermissions = requiredPermissions.every(({ resource, action }) =>
        hasPermission(resource, action)
      )
      
      if (!hasAllPermissions) {
        router.push('/dashboard') // Redirect to safe page
        return
      }
    }
  }, [
    user, 
    hasRole, 
    hasPermission, 
    isOwner, 
    isAdmin, 
    loading, 
    router, 
    redirectTo,
    requireOwner,
    requireAdmin,
    requiredRoles,
    requiredPermissions
  ])

  // Show loading while checking auth
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    )
  }

  // Don't render anything while redirecting
  if (!user) {
    return null
  }

  // Check access requirements (same logic as useEffect for consistency)
  if (requireOwner && !isOwner) return null
  if (requireAdmin && !isAdmin) return null
  if (requiredRoles && !hasRole(requiredRoles)) return null
  
  if (requiredPermissions) {
    const hasAllPermissions = requiredPermissions.every(({ resource, action }) =>
      hasPermission(resource, action)
    )
    if (!hasAllPermissions) return null
  }

  // All checks passed, render children
  return <>{children}</>
}