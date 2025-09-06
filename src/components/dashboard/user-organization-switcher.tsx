'use client'

import { useState } from 'react'
import { useAuth } from '@/contexts/auth-context'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { TeamInvitationModal } from '@/components/auth/team-invitation-modal'
import { UserRole } from '@/types/database'

export function UserOrganizationSwitcher() {
  const { 
    user, 
    currentOrganization, 
    organizations, 
    switchOrganization, 
    signOut,
    hasPermission,
    currentRole
  } = useAuth()

  const [isOrgSwitching, setIsOrgSwitching] = useState(false)
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false)

  const handleOrgSwitch = async (organizationId: string) => {
    if (organizationId === currentOrganization?.id) return
    
    setIsOrgSwitching(true)
    try {
      await switchOrganization(organizationId)
    } catch (error) {
      console.error('Failed to switch organization:', error)
    } finally {
      setIsOrgSwitching(false)
    }
  }

  const handleSignOut = async () => {
    try {
      await signOut()
    } catch (error) {
      console.error('Sign out error:', error)
    }
  }

  const canInviteUsers = hasPermission('users', 'create')
  
  const formatRole = (role: UserRole) => {
    return role.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ')
  }

  if (!user || !currentOrganization) {
    return null
  }

  return (
    <div className="flex items-center space-x-4">
      {/* Organization Switcher */}
      {organizations && organizations.length > 1 && (
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-600">Org:</span>
          <Select 
            value={currentOrganization.id}
            onValueChange={handleOrgSwitch}
            disabled={isOrgSwitching}
          >
            <SelectTrigger className="w-48">
              <SelectValue>
                {isOrgSwitching ? 'Switching...' : currentOrganization.name}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {organizations.map((org) => (
                <SelectItem key={org.id} value={org.id}>
                  <div className="flex flex-col">
                    <span className="font-medium">{org.name}</span>
                    <span className="text-xs text-gray-500">
                      {formatRole(org.role)}
                    </span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Invite Team Member Button */}
      {canInviteUsers && (
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsInviteModalOpen(true)}
        >
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          Invite User
        </Button>
      )}

      {/* User Menu */}
      <div className="relative group">
        <Button variant="ghost" className="flex items-center space-x-2 px-3">
          <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white text-sm font-semibold">
            {user.first_name[0]}{user.last_name[0]}
          </div>
          <div className="text-left hidden md:block">
            <div className="text-sm font-medium text-gray-900">
              {user.first_name} {user.last_name}
            </div>
            <div className="text-xs text-gray-500">
              {formatRole(currentRole as UserRole)}
            </div>
          </div>
          <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </Button>

        {/* Dropdown Menu */}
        <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50 border border-gray-200 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
          <div className="px-4 py-2 border-b border-gray-100">
            <p className="text-sm font-medium text-gray-900">{user.first_name} {user.last_name}</p>
            <p className="text-xs text-gray-500">{user.email}</p>
          </div>
          
          <button
            onClick={() => {/* TODO: Navigate to profile */}}
            className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
          >
            Your Profile
          </button>
          
          <button
            onClick={() => {/* TODO: Navigate to organization settings */}}
            className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
          >
            Organization Settings
          </button>
          
          <hr className="my-1" />
          
          <button
            onClick={handleSignOut}
            className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
          >
            Sign Out
          </button>
        </div>
      </div>

      {/* Team Invitation Modal */}
      <TeamInvitationModal
        isOpen={isInviteModalOpen}
        onClose={() => setIsInviteModalOpen(false)}
        organizationId={currentOrganization.id}
        onInviteSent={() => {
          // Could refresh team data here if needed
          console.log('Invitation sent successfully')
        }}
      />
    </div>
  )
}