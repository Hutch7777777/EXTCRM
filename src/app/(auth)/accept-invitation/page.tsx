'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import Link from 'next/link'

interface InvitationData {
  email: string
  organizationName: string
  role: string
  invitedBy: string
  expiresAt: string
}

export default function AcceptInvitationPage() {
  const [invitationData, setInvitationData] = useState<InvitationData | null>(null)
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [validatingToken, setValidatingToken] = useState(true)
  
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get('token')

  // Validate invitation token on component mount
  useEffect(() => {
    const validateInvitation = async () => {
      if (!token) {
        setError('Invalid invitation link')
        setValidatingToken(false)
        return
      }

      try {
        const response = await fetch(`/api/auth/validate-invitation?token=${token}`)
        const data = await response.json()

        if (!response.ok) {
          throw new Error(data.error || 'Invalid invitation')
        }

        setInvitationData(data.invitation)
      } catch (err) {
        console.error('Invitation validation error:', err)
        setError(err instanceof Error ? err.message : 'Failed to validate invitation')
      } finally {
        setValidatingToken(false)
      }
    }

    validateInvitation()
  }, [token])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    // Validation
    if (password.length < 8) {
      setError('Password must be at least 8 characters long')
      return
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    setLoading(true)

    try {
      const response = await fetch('/api/auth/accept-invitation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token,
          password
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to accept invitation')
      }

      // Redirect to login page with success message
      router.push('/auth/login?message=invitation_accepted')
      
    } catch (err) {
      console.error('Accept invitation error:', err)
      setError(err instanceof Error ? err.message : 'An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  const formatRole = (role: string) => {
    return role.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ')
  }

  const isExpired = invitationData && new Date(invitationData.expiresAt) < new Date()

  if (validatingToken) {
    return (
      <Card className="w-full">
        <CardContent className="flex items-center justify-center py-12">
          <div className="text-center space-y-3">
            <div className="animate-spin h-8 w-8 border-2 border-blue-600 border-t-transparent rounded-full mx-auto" />
            <p className="text-gray-600">Validating invitation...</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error || !invitationData) {
    return (
      <Card className="w-full">
        <CardHeader className="text-center">
          <CardTitle className="text-xl font-bold text-red-600">Invalid Invitation</CardTitle>
          <CardDescription>
            {error || 'This invitation link is not valid'}
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <div className="w-16 h-16 mx-auto bg-red-100 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <div className="space-y-2">
            <p className="text-gray-600">
              The invitation link may have expired or is invalid.
            </p>
            <p className="text-sm text-gray-500">
              Please contact your team administrator for a new invitation.
            </p>
          </div>
          <Button asChild className="mt-4">
            <Link href="/auth/login">
              Go to Sign In
            </Link>
          </Button>
        </CardContent>
      </Card>
    )
  }

  if (isExpired) {
    return (
      <Card className="w-full">
        <CardHeader className="text-center">
          <CardTitle className="text-xl font-bold text-amber-600">Invitation Expired</CardTitle>
          <CardDescription>
            This invitation has expired
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <div className="w-16 h-16 mx-auto bg-amber-100 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div className="space-y-2">
            <p className="text-gray-600">
              This invitation expired on {new Date(invitationData.expiresAt).toLocaleDateString()}.
            </p>
            <p className="text-sm text-gray-500">
              Please contact your team administrator for a new invitation.
            </p>
          </div>
          <Button asChild className="mt-4">
            <Link href="/auth/login">
              Go to Sign In
            </Link>
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-bold">Accept Invitation</CardTitle>
        <CardDescription>
          You've been invited to join {invitationData.organizationName}
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Invitation Details */}
        <div className="bg-blue-50 border border-blue-200 rounded-md p-4 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Email:</span>
            <span className="font-medium">{invitationData.email}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Organization:</span>
            <span className="font-medium">{invitationData.organizationName}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Role:</span>
            <span className="font-medium">{formatRole(invitationData.role)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Invited by:</span>
            <span className="font-medium">{invitationData.invitedBy}</span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-3">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              Create a password to complete your account setup:
            </p>

            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-medium text-gray-700">
                Password *
              </label>
              <Input
                id="password"
                type="password"
                placeholder="At least 8 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
                required
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="confirmPassword" className="text-sm font-medium text-gray-700">
                Confirm Password *
              </label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="Confirm your password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                disabled={loading}
                required
              />
            </div>
          </div>

          <div className="flex justify-between pt-4">
            <Button asChild variant="outline">
              <Link href="/auth/login">
                Cancel
              </Link>
            </Button>

            <Button
              type="submit"
              disabled={loading || !password || !confirmPassword}
            >
              {loading ? 'Accepting...' : 'Accept Invitation'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}