'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/auth-context'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { TeamInvitationModal } from '@/components/auth/team-invitation-modal'
import { UserRole } from '@/types/supabase'

interface TeamMember {
  id: string
  first_name: string
  last_name: string
  email: string
  role: UserRole
  status: string
  last_login_at: string | null
}

interface PendingInvitation {
  id: string
  email: string
  role: UserRole
  invited_by: string
  expires_at: string
}

export function TeamManagement() {
  const { currentOrganization, hasPermission } = useAuth()
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([])
  const [pendingInvitations, setPendingInvitations] = useState<PendingInvitation[]>([])
  const [loading, setLoading] = useState(true)
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false)

  const canManageTeam = hasPermission('users', 'read')
  const canInviteUsers = hasPermission('users', 'create')

  useEffect(() => {
    if (currentOrganization && canManageTeam) {
      loadTeamData()
    } else {
      setLoading(false)
    }
  }, [currentOrganization, canManageTeam])

  const loadTeamData = async () => {
    try {
      setLoading(true)
      
      // Load team members (this would be a real API call)
      // For now, we'll use mock data
      const mockTeamMembers: TeamMember[] = [
        {
          id: '1',
          first_name: 'John',
          last_name: 'Doe', 
          email: 'john@example.com',
          role: 'owner',
          status: 'active',
          last_login_at: new Date().toISOString()
        }
      ]
      
      const mockInvitations: PendingInvitation[] = []
      
      setTeamMembers(mockTeamMembers)
      setPendingInvitations(mockInvitations)
      
    } catch (error) {
      console.error('Error loading team data:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatRole = (role: UserRole) => {
    return role.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ')
  }

  const formatLastLogin = (lastLogin: string | null) => {
    if (!lastLogin) return 'Never'
    
    const date = new Date(lastLogin)
    const now = new Date()
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60)
    
    if (diffInHours < 24) {
      return `${Math.floor(diffInHours)} hours ago`
    } else if (diffInHours < 168) { // 7 days
      return `${Math.floor(diffInHours / 24)} days ago`
    } else {
      return date.toLocaleDateString()
    }
  }

  if (!canManageTeam) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <p className="text-gray-500">You don't have permission to view team members.</p>
        </CardContent>
      </Card>
    )
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <div className="animate-spin h-6 w-6 border-2 border-blue-600 border-t-transparent rounded-full mx-auto mb-2" />
          <p className="text-gray-500">Loading team members...</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Team Members</CardTitle>
            <CardDescription>
              Manage your organization's team members and their roles
            </CardDescription>
          </div>
          {canInviteUsers && (
            <Button onClick={() => setIsInviteModalOpen(true)}>
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Invite User
            </Button>
          )}
        </CardHeader>

        <CardContent>
          <div className="space-y-4">
            {/* Active Team Members */}
            <div>
              <h3 className="text-lg font-semibold mb-3">Active Members ({teamMembers.length})</h3>
              <div className="space-y-2">
                {teamMembers.map((member) => (
                  <div key={member.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-semibold">
                        {member.first_name[0]}{member.last_name[0]}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">
                          {member.first_name} {member.last_name}
                        </p>
                        <p className="text-sm text-gray-500">{member.email}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {formatRole(member.role)}
                      </span>
                      <p className="text-xs text-gray-500 mt-1">
                        Last login: {formatLastLogin(member.last_login_at)}
                      </p>
                    </div>
                  </div>
                ))}
                
                {teamMembers.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    No team members found
                  </div>
                )}
              </div>
            </div>

            {/* Pending Invitations */}
            {pendingInvitations.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold mb-3">Pending Invitations ({pendingInvitations.length})</h3>
                <div className="space-y-2">
                  {pendingInvitations.map((invitation) => (
                    <div key={invitation.id} className="flex items-center justify-between p-3 border border-amber-200 bg-amber-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center">
                          <svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{invitation.email}</p>
                          <p className="text-sm text-gray-500">Invitation sent</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
                          {formatRole(invitation.role)}
                        </span>
                        <p className="text-xs text-gray-500 mt-1">
                          Expires: {new Date(invitation.expires_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Team Invitation Modal */}
      <TeamInvitationModal
        isOpen={isInviteModalOpen}
        onClose={() => setIsInviteModalOpen(false)}
        organizationId={currentOrganization?.id || ''}
        onInviteSent={() => {
          loadTeamData() // Refresh the team data
          console.log('Invitation sent successfully')
        }}
      />
    </div>
  )
}