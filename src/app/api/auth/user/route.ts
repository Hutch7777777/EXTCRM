import { createRouteClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/auth-helpers'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const user = await getCurrentUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    return NextResponse.json({ user })
  } catch (error) {
    console.error('Error fetching user:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(request: Request) {
  try {
    const user = await getCurrentUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const updates = await request.json()
    
    // Validate and sanitize updates
    const allowedFields = [
      'first_name',
      'last_name',
      'phone',
      'mobile',
      'title',
      'timezone',
      'notification_preferences'
    ]

    const sanitizedUpdates = Object.fromEntries(
      Object.entries(updates).filter(([key]) => allowedFields.includes(key))
    )

    const supabase = createRouteClient()
    
    const { data, error } = await supabase
      .from('users')
      .update({
        ...sanitizedUpdates,
        updated_at: new Date().toISOString()
      })
      .eq('id', user.id)
      .select(`
        *,
        organization:organizations(*)
      `)
      .single()

    if (error) {
      console.error('Error updating user:', error)
      return NextResponse.json({ error: 'Failed to update user' }, { status: 500 })
    }

    return NextResponse.json({ user: data })
  } catch (error) {
    console.error('Error in user update:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}