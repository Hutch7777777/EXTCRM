import { createRouteClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/dashboard'

  if (code) {
    const supabase = await createRouteClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    
    if (!error) {
      // Check if this is a new user who needs organization setup
      const { data: { user } } = await supabase.auth.getUser()
      
      if (user) {
        // Check if user already has an organization
        const { data: existingUser } = await supabase
          .from('users')
          .select('organization_id')
          .eq('id', user.id)
          .single()
        
        // If no existing user record, they need organization setup
        if (!existingUser) {
          console.log('🔄 [Auth Callback] New user needs organization setup')
          return NextResponse.redirect(`${origin}/complete-registration`)
        }
      }
      
      // Redirect to the intended page or dashboard
      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  // If there was an error or no code, redirect to login
  return NextResponse.redirect(`${origin}/login`)
}