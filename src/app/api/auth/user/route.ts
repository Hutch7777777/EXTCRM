import { createRouteClient, createAdminClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/auth-helpers'
import { NextResponse } from 'next/server'
import { Database } from '@/types/supabase'

type Functions = Database['public']['Functions']

export async function GET() {
  try {
    const user = await getCurrentUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    // Use the database function to get comprehensive user organization info
    const adminSupabase = await createAdminClient()
    
    // Try to use the database function, but fallback if it doesn't exist yet
    try {
      const { data: userOrgInfo, error: funcError } = await adminSupabase.rpc('get_user_org_info', {
        p_user_id: user.id
      } as Functions['get_user_org_info']['Args'])

      if (funcError) {
        // If function doesn't exist (database not fully deployed), use basic query
        if (funcError.code === '42883' || funcError.message?.includes('function') || funcError.message?.includes('does not exist')) {
          console.warn('Database function not available, using basic query')
          
          // Fallback to basic user query
          const { data: userData, error: userError } = await adminSupabase
            .from('users')
            .select(`
              *,
              organization:organizations(*)
            `)
            .eq('id', user.id)
            .single()

          if (userError) {
            console.error('Basic user query failed:', userError)
            return NextResponse.json({ user }, { status: 200 })
          }

          return NextResponse.json({ 
            user: userData,
            organization: userData.organization
          })
        }
        
        console.error('Error fetching user org info:', funcError)
        return NextResponse.json({ user })
      }

      // Include the function result with the user data
      return NextResponse.json({ 
        user,
        organizations: userOrgInfo || []
      })
    } catch (dbError) {
      console.warn('Database error during user fetch, returning basic user:', dbError)
      return NextResponse.json({ user })
    }
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
      'display_name',
      'phone',
      'mobile',
      'title',
      'department',
      'timezone',
      'notification_preferences'
    ]

    const sanitizedUpdates = Object.fromEntries(
      Object.entries(updates).filter(([key]) => allowedFields.includes(key))
    )

    // Validate specific fields
    if (sanitizedUpdates.first_name && typeof sanitizedUpdates.first_name !== 'string') {
      return NextResponse.json({ 
        error: 'First name must be a string' 
      }, { status: 400 })
    }

    if (sanitizedUpdates.last_name && typeof sanitizedUpdates.last_name !== 'string') {
      return NextResponse.json({ 
        error: 'Last name must be a string' 
      }, { status: 400 })
    }

    if (sanitizedUpdates.phone && typeof sanitizedUpdates.phone !== 'string') {
      return NextResponse.json({ 
        error: 'Phone must be a string' 
      }, { status: 400 })
    }

    if (sanitizedUpdates.mobile && typeof sanitizedUpdates.mobile !== 'string') {
      return NextResponse.json({ 
        error: 'Mobile must be a string' 
      }, { status: 400 })
    }

    // Auto-generate display_name if first_name or last_name is being updated
    if (sanitizedUpdates.first_name || sanitizedUpdates.last_name) {
      const firstName = sanitizedUpdates.first_name || user.first_name
      const lastName = sanitizedUpdates.last_name || user.last_name
      sanitizedUpdates.display_name = `${firstName} ${lastName}`.trim()
    }

    const supabase = await createRouteClient()
    
    const { data, error } = await supabase
      .from('users')
      .update({
        ...sanitizedUpdates,
        updated_at: new Date().toISOString()
      })
      .eq('id', user.id)
      .eq('organization_id', user.organization_id)
      .select(`
        *,
        organization:organizations(*)
      `)
      .single()

    if (error) {
      console.error('Error updating user:', error)
      
      // Handle specific database errors
      if (error.code === 'PGRST116') {
        return NextResponse.json({ 
          error: 'User not found or access denied' 
        }, { status: 404 })
      }
      
      return NextResponse.json({ 
        error: 'Failed to update user' 
      }, { status: 500 })
    }

    return NextResponse.json({ user: data })
  } catch (error) {
    console.error('Error in user update:', error)
    
    if (error instanceof SyntaxError) {
      return NextResponse.json({ 
        error: 'Invalid JSON in request body' 
      }, { status: 400 })
    }
    
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 })
  }
}

// Update user's last login and track session activity
export async function POST(request: Request) {
  try {
    const user = await getCurrentUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const body = await request.json()
    const { action } = body

    if (action === 'track-login') {
      const supabase = await createRouteClient()
      const now = new Date().toISOString()
      
      // Update login tracking
      const { error: loginError } = await supabase
        .from('users')
        .update({
          last_login_at: now,
          login_count: user.login_count + 1
        })
        .eq('id', user.id)
        .eq('organization_id', user.organization_id)

      if (loginError) {
        console.error('Error tracking login:', loginError)
        return NextResponse.json({ 
          error: 'Failed to track login' 
        }, { status: 500 })
      }

      // Create session record for analytics
      const sessionData = {
        user_id: user.id,
        organization_id: user.organization_id,
        device_info: body.deviceInfo || {},
        ip_address: body.ipAddress || null,
        user_agent: body.userAgent || null,
        started_at: now,
        last_activity_at: now,
        is_active: true
      }

      const { error: sessionError } = await supabase
        .from('user_sessions')
        .insert(sessionData)

      if (sessionError) {
        console.error('Error creating session:', sessionError)
        // Don't fail the request for session tracking errors
      }

      return NextResponse.json({ 
        success: true,
        message: 'Login tracked successfully'
      })
    }

    return NextResponse.json({ 
      error: 'Invalid action' 
    }, { status: 400 })

  } catch (error) {
    console.error('Error in user POST:', error)
    
    if (error instanceof SyntaxError) {
      return NextResponse.json({ 
        error: 'Invalid JSON in request body' 
      }, { status: 400 })
    }
    
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 })
  }
}

// Handle unsupported methods
export async function PUT() {
  return NextResponse.json({ 
    error: 'Method not allowed' 
  }, { status: 405 })
}

export async function DELETE() {
  return NextResponse.json({ 
    error: 'Method not allowed' 
  }, { status: 405 })
}