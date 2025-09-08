'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default function CompleteRegistrationPage() {
  const [status, setStatus] = useState<'loading' | 'creating' | 'success' | 'error'>('loading')
  const [error, setError] = useState<string>('')
  const router = useRouter()

  useEffect(() => {
    completeRegistration()
  }, [])

  async function completeRegistration() {
    try {
      console.log('🔄 [Complete Registration] Starting...')
      setStatus('loading')

      const supabase = createClient()
      
      // Check if user is authenticated
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      
      if (authError || !user) {
        console.error('❌ [Complete Registration] Not authenticated:', authError)
        router.push('/login')
        return
      }

      // Get pending organization data from localStorage
      const pendingDataStr = localStorage.getItem('pending_organization_registration')
      
      if (!pendingDataStr) {
        console.error('❌ [Complete Registration] No pending organization data found')
        setError('No pending organization registration found. Please register again.')
        setStatus('error')
        return
      }

      const orgData = JSON.parse(pendingDataStr)
      console.log('📋 [Complete Registration] Found pending data:', orgData.organizationName)

      setStatus('creating')

      // Create the organization
      const registrationResponse = await fetch('/api/auth/register-organization', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(orgData),
      })

      const registrationData = await registrationResponse.json()

      if (!registrationResponse.ok) {
        console.error('❌ [Complete Registration] Organization creation failed:', registrationData)
        setError(registrationData.error || 'Failed to create organization')
        setStatus('error')
        return
      }

      console.log('✅ [Complete Registration] Organization created successfully!')
      
      // Clear the pending data
      localStorage.removeItem('pending_organization_registration')
      
      setStatus('success')
      
      // Wait for auth context to refresh before redirecting
      setTimeout(async () => {
        console.log('🔄 [Complete Registration] Waiting for auth refresh before redirect...')
        await new Promise(resolve => setTimeout(resolve, 1000))
        console.log('🔄 [Complete Registration] Redirecting to dashboard...')
        router.push('/dashboard')
        router.refresh()
      }, 2000)
      
    } catch (err) {
      console.error('❌ [Complete Registration] Error:', err)
      setError(err instanceof Error ? err.message : 'An unexpected error occurred')
      setStatus('error')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">
            {status === 'loading' && 'Completing Setup...'}
            {status === 'creating' && 'Creating Organization...'}
            {status === 'success' && 'Welcome!'}
            {status === 'error' && 'Setup Error'}
          </CardTitle>
          <CardDescription>
            {status === 'loading' && 'Setting up your account...'}
            {status === 'creating' && 'Creating your organization and user profile...'}
            {status === 'success' && 'Your organization has been created successfully!'}
            {status === 'error' && 'There was an issue completing your registration'}
          </CardDescription>
        </CardHeader>
        
        <CardContent className="text-center space-y-4">
          {status === 'loading' && (
            <div className="w-16 h-16 mx-auto">
              <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-200 border-t-blue-600"></div>
            </div>
          )}
          
          {status === 'creating' && (
            <div className="w-16 h-16 mx-auto">
              <div className="animate-pulse rounded-full h-16 w-16 bg-blue-100 flex items-center justify-center">
                <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
            </div>
          )}
          
          {status === 'success' && (
            <div className="w-16 h-16 mx-auto bg-green-100 rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
          )}
          
          {status === 'error' && (
            <div className="space-y-4">
              <div className="w-16 h-16 mx-auto bg-red-100 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <p className="text-red-600 text-sm">{error}</p>
              <button 
                onClick={() => router.push('/signup')} 
                className="text-blue-600 hover:text-blue-500 text-sm underline"
              >
                Try registering again
              </button>
            </div>
          )}
          
          {status === 'success' && (
            <div className="space-y-2">
              <p className="text-green-600 text-sm font-medium">
                Setup complete! Redirecting to dashboard...
              </p>
              <div className="w-32 h-1 mx-auto bg-gray-200 rounded-full overflow-hidden">
                <div className="h-full bg-green-500 rounded-full animate-pulse"></div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}