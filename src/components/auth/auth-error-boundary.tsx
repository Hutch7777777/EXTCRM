'use client'

import React, { Component, ErrorInfo, ReactNode } from 'react'
import { AlertCircle, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
  error?: Error
  errorInfo?: ErrorInfo
}

export class AuthErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Auth Error Boundary caught an error:', error, errorInfo)
    this.setState({ errorInfo })

    // Log to monitoring service in production
    if (process.env.NODE_ENV === 'production') {
      // Add your error reporting service here
      console.error('Production error:', { error, errorInfo })
    }
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined })
  }

  handleReload = () => {
    window.location.reload()
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-md">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-red-100 flex items-center justify-center">
                <AlertCircle className="h-6 w-6 text-red-600" />
              </div>
              <CardTitle className="text-xl font-semibold text-gray-900">
                Authentication Error
              </CardTitle>
              <CardDescription>
                Something went wrong with the authentication system.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-sm text-gray-600 bg-gray-100 p-3 rounded-lg">
                <p className="font-medium">Error Details:</p>
                <p className="mt-1 font-mono text-xs">
                  {this.state.error?.message || 'Unknown authentication error'}
                </p>
              </div>
              
              <div className="flex flex-col gap-2">
                <Button onClick={this.handleRetry} className="w-full">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Try Again
                </Button>
                <Button 
                  variant="outline" 
                  onClick={this.handleReload}
                  className="w-full"
                >
                  Reload Page
                </Button>
              </div>

              {process.env.NODE_ENV === 'development' && this.state.errorInfo && (
                <details className="text-xs text-gray-500 bg-gray-50 p-2 rounded">
                  <summary className="cursor-pointer">Debug Info (Dev Mode)</summary>
                  <pre className="mt-2 whitespace-pre-wrap">
                    {this.state.error?.stack}
                  </pre>
                </details>
              )}
            </CardContent>
          </Card>
        </div>
      )
    }

    return this.props.children
  }
}

// Hook for handling async authentication errors
export function useAuthErrorHandler() {
  const handleAuthError = (error: unknown, context?: string) => {
    console.error(`Auth error ${context ? `in ${context}` : ''}:`, error)

    // Return user-friendly error message
    if (error instanceof Error) {
      // Handle specific authentication errors
      if (error.message.includes('Invalid login credentials')) {
        return 'Invalid email or password. Please check your credentials and try again.'
      }
      if (error.message.includes('Email not confirmed')) {
        return 'Please check your email and click the verification link before signing in.'
      }
      if (error.message.includes('Too many requests')) {
        return 'Too many login attempts. Please wait a few minutes before trying again.'
      }
      if (error.message.includes('User not found')) {
        return 'No account found with this email address.'
      }
      if (error.message.includes('Organization not found')) {
        return 'Organization not found. Please contact support.'
      }
      if (error.message.includes('Permission denied')) {
        return 'You do not have permission to perform this action.'
      }
      if (error.message.includes('expired')) {
        return 'Your session has expired. Please sign in again.'
      }
      if (error.message.includes('network') || error.message.includes('fetch')) {
        return 'Network error. Please check your connection and try again.'
      }
      
      // Return generic message for unknown errors
      return error.message || 'An unexpected error occurred. Please try again.'
    }

    return 'An unexpected error occurred. Please try again.'
  }

  return { handleAuthError }
}