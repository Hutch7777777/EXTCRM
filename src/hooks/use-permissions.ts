'use client'

import { useAuth } from '@/contexts/auth-context'
import { UserRole } from '@/types/database'

export interface PermissionCheck {
  resource: string
  action: string
  conditions?: Record<string, any>
}

export function usePermissions() {
  const { user, hasPermission, hasRole, isOwner, isAdmin } = useAuth()

  /**
   * Check if user can perform multiple actions
   */
  const canPerformAll = (permissions: PermissionCheck[]): boolean => {
    return permissions.every(({ resource, action }) => 
      hasPermission(resource, action)
    )
  }

  /**
   * Check if user can perform any of the given actions
   */
  const canPerformAny = (permissions: PermissionCheck[]): boolean => {
    return permissions.some(({ resource, action }) => 
      hasPermission(resource, action)
    )
  }

  /**
   * Get list of permissions for current user's role
   */
  const getUserPermissions = (): string[] => {
    if (!user?.role) return []

    const rolePermissions: Record<UserRole, string[]> = {
      owner: [
        'organizations:read',
        'organizations:update',
        'users:create',
        'users:read', 
        'users:update',
        'users:delete',
        'contacts:create',
        'contacts:read',
        'contacts:update',
        'contacts:delete',
        'leads:create',
        'leads:read',
        'leads:update',
        'leads:delete',
        'jobs:create',
        'jobs:read',
        'jobs:update',
        'jobs:delete',
        'estimates:create',
        'estimates:read',
        'estimates:update',
        'estimates:delete',
        'reports:read',
        'settings:read',
        'settings:update'
      ],
      operations_manager: [
        'users:create',
        'users:read',
        'users:update',
        'contacts:create',
        'contacts:read',
        'contacts:update',
        'leads:read',
        'leads:update',
        'jobs:read',
        'jobs:update',
        'estimates:read',
        'reports:read'
      ],
      sales_manager: [
        'contacts:create',
        'contacts:read',
        'contacts:update',
        'leads:create',
        'leads:read',
        'leads:update',
        'jobs:read',
        'estimates:read',
        'reports:read'
      ],
      estimating_manager: [
        'contacts:read',
        'leads:read',
        'leads:update',
        'jobs:read',
        'estimates:create',
        'estimates:read',
        'estimates:update',
        'reports:read'
      ],
      estimator: [
        'contacts:read',
        'leads:read',
        'leads:update',
        'estimates:create',
        'estimates:read',
        'estimates:update'
      ],
      field_management: [
        'contacts:read',
        'jobs:read',
        'jobs:update'
      ]
    }

    return rolePermissions[user.role] || []
  }

  /**
   * Check if user can manage users (create, update, delete)
   */
  const canManageUsers = (): boolean => {
    return hasRole(['owner', 'operations_manager'])
  }

  /**
   * Check if user can manage leads
   */
  const canManageLeads = (): boolean => {
    return hasRole(['owner', 'operations_manager', 'sales_manager'])
  }

  /**
   * Check if user can create leads
   */
  const canCreateLeads = (): boolean => {
    return hasRole(['owner', 'sales_manager'])
  }

  /**
   * Check if user can manage estimates
   */
  const canManageEstimates = (): boolean => {
    return hasRole(['owner', 'estimating_manager', 'estimator'])
  }

  /**
   * Check if user can manage jobs
   */
  const canManageJobs = (): boolean => {
    return hasRole(['owner', 'operations_manager', 'estimating_manager'])
  }

  /**
   * Check if user can update job status (field management)
   */
  const canUpdateJobStatus = (): boolean => {
    return hasRole(['owner', 'operations_manager', 'field_management'])
  }

  /**
   * Check if user can view reports
   */
  const canViewReports = (): boolean => {
    return !hasRole(['field_management']) // Everyone except field management
  }

  /**
   * Check if user can manage organization settings
   */
  const canManageSettings = (): boolean => {
    return isOwner
  }

  /**
   * Check if user can view all data (organization-wide access)
   */
  const canViewAllData = (): boolean => {
    return hasRole(['owner', 'operations_manager'])
  }

  /**
   * Check if user has limited access (can only see assigned items)
   */
  const hasLimitedAccess = (): boolean => {
    return hasRole(['estimator', 'field_management'])
  }

  return {
    // Basic permission checks
    hasPermission,
    hasRole,
    isOwner,
    isAdmin,
    
    // Multi-permission checks
    canPerformAll,
    canPerformAny,
    
    // Permission utilities
    getUserPermissions,
    
    // Specific domain checks
    canManageUsers,
    canManageLeads,
    canCreateLeads,
    canManageEstimates,
    canManageJobs,
    canUpdateJobStatus,
    canViewReports,
    canManageSettings,
    canViewAllData,
    hasLimitedAccess,
  }
}