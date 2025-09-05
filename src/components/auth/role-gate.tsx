'use client'

import React from 'react'
import { useAuth } from '@/contexts/auth-context'
import { UserRole } from '@/types/database'

interface RoleGateProps {
  children: React.ReactNode
  allowedRoles?: UserRole[]
  requiredPermissions?: Array<{
    resource: string
    action: string
  }>
  fallback?: React.ReactNode
  requireOwner?: boolean
  requireAdmin?: boolean
}

/**
 * Component that conditionally renders content based on user role/permissions
 */
export function RoleGate({
  children,
  allowedRoles,
  requiredPermissions,
  fallback = null,
  requireOwner = false,
  requireAdmin = false,
}: RoleGateProps) {
  const { hasRole, hasPermission, isOwner, isAdmin, loading, user } = useAuth()

  // Show loading state while auth is initializing
  if (loading) {
    return <div className="animate-pulse bg-gray-200 rounded h-4 w-full" />
  }

  // If no user, deny access
  if (!user) {
    return <>{fallback}</>
  }

  // Check owner requirement
  if (requireOwner && !isOwner) {
    return <>{fallback}</>
  }

  // Check admin requirement
  if (requireAdmin && !isAdmin) {
    return <>{fallback}</>
  }

  // Check role requirements
  if (allowedRoles && !hasRole(allowedRoles)) {
    return <>{fallback}</>
  }

  // Check permission requirements
  if (requiredPermissions) {
    const hasAllPermissions = requiredPermissions.every(({ resource, action }) =>
      hasPermission(resource, action)
    )
    
    if (!hasAllPermissions) {
      return <>{fallback}</>
    }
  }

  // All checks passed, render children
  return <>{children}</>
}

/**
 * HOC version of RoleGate for wrapping components
 */
export function withRoleGate<T extends object>(
  Component: React.ComponentType<T>,
  gateProps: Omit<RoleGateProps, 'children' | 'fallback'> & {
    fallback?: React.ComponentType
  }
) {
  const WrappedComponent = (props: T) => {
    const FallbackComponent = gateProps.fallback
    
    return (
      <RoleGate 
        {...gateProps} 
        fallback={FallbackComponent ? <FallbackComponent /> : null}
      >
        <Component {...props} />
      </RoleGate>
    )
  }
  
  WrappedComponent.displayName = `withRoleGate(${Component.displayName || Component.name})`
  
  return WrappedComponent
}