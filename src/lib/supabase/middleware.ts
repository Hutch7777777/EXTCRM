import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import { Database } from '@/types/database'

import type { NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: any) {
          request.cookies.set({
            name,
            value,
            ...options,
          })
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({
            name,
            value,
            ...options,
          })
        },
        remove(name: string, options: any) {
          request.cookies.set({
            name,
            value: '',
            ...options,
          })
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({
            name,
            value: '',
            ...options,
          })
        },
      },
    }
  )

  // Refresh session if expired - required for Server Components
  const { data: { session }, error } = await supabase.auth.getSession()

  if (error) {
    console.error('Middleware auth error:', error)
    return response
  }

  // If user is signed in but not on a public route, continue
  if (session) {
    // Check if user has completed organization setup
    if (!request.nextUrl.pathname.startsWith('/auth/') && 
        !request.nextUrl.pathname.startsWith('/api/') &&
        !request.nextUrl.pathname.startsWith('/_next/') &&
        request.nextUrl.pathname !== '/' &&
        request.nextUrl.pathname !== '/setup') {
      
      // Get user's organization data
      const { data: userData } = await supabase
        .from('users')
        .select(`
          *,
          organization:organizations(*)
        `)
        .eq('id', session.user.id)
        .single()

      if (!userData?.organization) {
        // Redirect to setup if user doesn't have an organization
        return NextResponse.redirect(new URL('/setup', request.url))
      }
    }
    
    return response
  }

  // If user is not signed in and trying to access protected route
  if (!session && 
      !request.nextUrl.pathname.startsWith('/auth/') && 
      !request.nextUrl.pathname.startsWith('/api/') &&
      !request.nextUrl.pathname.startsWith('/_next/') &&
      request.nextUrl.pathname !== '/') {
    
    return NextResponse.redirect(new URL('/auth/login', request.url))
  }

  return response
}