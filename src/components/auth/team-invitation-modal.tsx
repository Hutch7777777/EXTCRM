'use client'

import { useState, FormEvent } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { UserRole } from '@/types/supabase'

interface TeamInvitationModalProps {
  isOpen: boolean
  onClose: () => void
  organizationId: string
  onInviteSent: () => void
}

const ROLE_DESCRIPTIONS = {
  owner: 'Full access to all features and settings',
  operations_manager: 'Manage users, contacts, leads, and jobs',
  sales_manager: 'Manage contacts and leads, view jobs',
  estimating_manager: 'Manage estimates and pricing',
  estimator: 'Create and manage estimates',
  field_management: 'Update job progress and status'
}

const ROLE_LABELS = {
  owner: 'Owner',
  operations_manager: 'Operations Manager',
  sales_manager: 'Sales Manager', 
  estimating_manager: 'Estimating Manager',
  estimator: 'Estimator',
  field_management: 'Field Management'
}

export function TeamInvitationModal({ 
  isOpen, 
  onClose, 
  organizationId, 
  onInviteSent 
}: TeamInvitationModalProps) {
  const [email, setEmail] = useState('')
  const [role, setRole] = useState<UserRole | ''>('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    
    // Validation
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Please enter a valid email address')
      return
    }
    
    if (!role) {
      setError('Please select a role')
      return
    }

    setLoading(true)

    try {
      const response = await fetch('/api/auth/invite-user', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          organizationId,
          email: email.trim(),
          role
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to send invitation')
      }

      setSuccess(true)
      setEmail('')
      setRole('')
      
      // Notify parent component
      onInviteSent()
      
      // Auto close after showing success
      setTimeout(() => {
        setSuccess(false)
        onClose()
      }, 2000)
      
    } catch (err) {
      console.error('Invitation error:', err)
      setError(err instanceof Error ? err.message : 'An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    if (!loading) {
      setEmail('')
      setRole('')
      setError(null)
      setSuccess(false)
      onClose()
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <div className="flex justify-between items-center">
            <CardTitle className="text-xl font-bold">Invite Team Member</CardTitle>
            <button
              onClick={handleClose}
              disabled={loading}
              className="text-gray-400 hover:text-gray-600 text-xl leading-none"
            >
              ×
            </button>
          </div>
          <CardDescription>
            Send an invitation to join your organization
          </CardDescription>
        </CardHeader>

        <CardContent>
          {success ? (
            <div className="text-center py-4 space-y-3">
              <div className="w-12 h-12 mx-auto bg-green-100 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Invitation Sent!</h3>
                <p className="text-sm text-gray-600 mt-1">
                  We've sent an invitation to {email}
                </p>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-md p-3">
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              )}

              <div className="space-y-2">
                <label htmlFor="email" className="text-sm font-medium text-gray-700">
                  Email Address *
                </label>
                <Input
                  id="email"
                  type="email"
                  placeholder="colleague@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loading}
                  autoFocus
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="role" className="text-sm font-medium text-gray-700">
                  Role *
                </label>
                <Select value={role} onValueChange={(value: UserRole) => setRole(value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a role" />
                  </SelectTrigger>
                  <SelectContent>
                    {(Object.keys(ROLE_LABELS) as UserRole[])
                      .filter(roleKey => roleKey !== 'owner') // Don't allow inviting additional owners
                      .map((roleKey) => (
                        <SelectItem key={roleKey} value={roleKey}>
                          <div>
                            <div className="font-medium">{ROLE_LABELS[roleKey]}</div>
                            <div className="text-xs text-gray-500 truncate">
                              {ROLE_DESCRIPTIONS[roleKey]}
                            </div>
                          </div>
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
                {role && (
                  <p className="text-xs text-gray-500 mt-1">
                    {ROLE_DESCRIPTIONS[role as UserRole]}
                  </p>
                )}
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleClose}
                  disabled={loading}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={loading || !email.trim() || !role}
                >
                  {loading ? 'Sending...' : 'Send Invitation'}
                </Button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  )
}