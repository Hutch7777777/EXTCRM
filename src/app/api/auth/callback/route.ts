import { createRouteClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/dashboard'

  if (code) {
    const supabase = createRouteClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    
    if (!error) {
      // Redirect to the intended page or dashboard
      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  // If there was an error or no code, redirect to login
  return NextResponse.redirect(`${origin}/auth/login`)
}