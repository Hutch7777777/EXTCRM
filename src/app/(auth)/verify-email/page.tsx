import Link from 'next/link'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

export default function VerifyEmailPage() {
  return (
    <Card className="w-full">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl font-bold">Check Your Email</CardTitle>
        <CardDescription>
          We've sent you a confirmation link
        </CardDescription>
      </CardHeader>
      
      <CardContent className="text-center space-y-4">
        <div className="w-16 h-16 mx-auto bg-blue-100 rounded-full flex items-center justify-center">
          <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
        </div>
        
        <div className="space-y-2">
          <p className="text-gray-600">
            Please check your email and click the confirmation link to activate your account.
          </p>
          <p className="text-sm text-gray-500">
            The link will expire in 24 hours.
          </p>
        </div>
        
        <div className="bg-gray-50 rounded-md p-4">
          <p className="text-sm text-gray-600">
            <strong>Didn't receive the email?</strong>
          </p>
          <p className="text-sm text-gray-500 mt-1">
            Check your spam folder or contact support if you continue to have issues.
          </p>
        </div>
      </CardContent>
      
      <CardFooter className="justify-center">
        <Button asChild variant="outline">
          <Link href="/auth/login">
            Back to Sign In
          </Link>
        </Button>
      </CardFooter>
    </Card>
  )
}