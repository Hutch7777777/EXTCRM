import { createAdminClient, createRouteClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { UserRole, UserStatus } from '@/types/database'

interface AcceptInvitationRequest {
  invitationToken: string
  firstName: string
  lastName: string
  phone?: string
  mobile?: string
  timezone?: string
}

export async function POST(request: Request) {
  try {
    // Get the authenticated user from Supabase auth
    const supabase = createRouteClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ 
        error: 'Authentication required' 
      }, { status: 401 })
    }

    const body: AcceptInvitationRequest = await request.json()

    // Validate required fields
    const requiredFields = ['invitationToken', 'firstName', 'lastName']
    const missingFields = requiredFields.filter(field => 
      !body[field as keyof AcceptInvitationRequest] || 
      String(body[field as keyof AcceptInvitationRequest]).trim() === ''
    )

    if (missingFields.length > 0) {
      return NextResponse.json({
        error: 'Missing required fields',
        fields: missingFields
      }, { status: 400 })
    }

    // Use admin client to bypass RLS for invitation lookup
    const adminSupabase = createAdminClient()

    // Find the invitation by token
    const { data: invitation, error: invitationError } = await adminSupabase
      .from('user_invitations')
      .select(`
        *,
        organization:organizations(
          id,
          name,
          slug,
          status
        )
      `)
      .eq('invitation_token', body.invitationToken.trim())
      .is('accepted_at', null)
      .single()

    if (invitationError || !invitation) {
      return NextResponse.json({
        error: 'Invalid or expired invitation token'
      }, { status: 404 })
    }

    // Check if invitation has expired
    const expiresAt = new Date(invitation.expires_at)
    if (expiresAt <= new Date()) {
      return NextResponse.json({
        error: 'Invitation has expired'
      }, { status: 410 })
    }

    // Check if the authenticated user's email matches the invitation
    if (user.email?.toLowerCase() !== invitation.email.toLowerCase()) {
      return NextResponse.json({
        error: 'Invitation email does not match your authenticated email'
      }, { status: 403 })
    }

    // Check if organization is still active
    if (invitation.organization.status !== 'active' && invitation.organization.status !== 'trial') {
      return NextResponse.json({
        error: 'Organization is not active'
      }, { status: 403 })
    }

    // Check if user already exists in this organization
    const { data: existingUser } = await adminSupabase
      .from('users')
      .select('id, status')
      .eq('id', user.id)
      .eq('organization_id', invitation.organization_id)
      .single()

    if (existingUser) {
      if (existingUser.status === 'active') {
        return NextResponse.json({
          error: 'You are already a member of this organization'
        }, { status: 409 })
      }
    }

    // Start a transaction to create/update user and mark invitation as accepted
    const now = new Date().toISOString()

    // Create or update the user record
    const userData = {
      id: user.id,
      organization_id: invitation.organization_id,
      email: invitation.email.toLowerCase(),
      first_name: body.firstName.trim(),
      last_name: body.lastName.trim(),
      display_name: `${body.firstName.trim()} ${body.lastName.trim()}`,
      role: invitation.role as UserRole,
      status: 'active' as UserStatus,
      phone: body.phone?.trim() || null,
      mobile: body.mobile?.trim() || null,
      timezone: body.timezone?.trim() || null,
      is_admin: invitation.role === 'owner',
      permissions: {},
      notification_preferences: {
        email: true,
        browser: true,
        mobile: false
      },
      invited_by: invitation.invited_by,
      invited_at: invitation.created_at,
      activated_at: now,
      created_at: now,
      updated_at: now
    }

    // Use upsert to handle both creation and update scenarios
    const { data: newUser, error: userError } = await adminSupabase
      .from('users')
      .upsert(userData, { 
        onConflict: 'id,organization_id'
      })
      .select(`
        *,
        organization:organizations(*)
      `)
      .single()

    if (userError) {
      console.error('Error creating/updating user:', userError)
      return NextResponse.json({
        error: 'Failed to create user profile'
      }, { status: 500 })
    }

    // Mark invitation as accepted
    const { error: invitationUpdateError } = await adminSupabase
      .from('user_invitations')
      .update({
        accepted_at: now
      })
      .eq('id', invitation.id)

    if (invitationUpdateError) {
      console.error('Error updating invitation:', invitationUpdateError)
      // Don't fail the request if we can't update the invitation
      // The user was created successfully
    }

    // Track the user's first login
    const { error: loginError } = await adminSupabase
      .from('users')
      .update({
        last_login_at: now,
        login_count: 1
      })
      .eq('id', user.id)
      .eq('organization_id', invitation.organization_id)

    if (loginError) {
      console.error('Error tracking login:', loginError)
      // Don't fail the request
    }

    return NextResponse.json({
      success: true,
      message: 'Invitation accepted successfully',
      user: newUser,
      organization: invitation.organization
    }, { status: 200 })

  } catch (error) {
    console.error('Error accepting invitation:', error)
    
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

// Get invitation details by token (for displaying invitation info before acceptance)
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const token = searchParams.get('token')

    if (!token) {
      return NextResponse.json({
        error: 'Invitation token is required'
      }, { status: 400 })
    }

    const adminSupabase = createAdminClient()

    // Find the invitation by token
    const { data: invitation, error: invitationError } = await adminSupabase
      .from('user_invitations')
      .select(`
        id,
        email,
        role,
        expires_at,
        created_at,
        organization:organizations(
          name,
          slug,
          logo_url
        ),
        inviter:users!invited_by(
          first_name,
          last_name,
          email
        )
      `)
      .eq('invitation_token', token)
      .is('accepted_at', null)
      .single()

    if (invitationError || !invitation) {
      return NextResponse.json({
        error: 'Invalid invitation token'
      }, { status: 404 })
    }

    // Check if invitation has expired
    const expiresAt = new Date(invitation.expires_at)
    if (expiresAt <= new Date()) {
      return NextResponse.json({
        error: 'Invitation has expired'
      }, { status: 410 })
    }

    // Return invitation details (without sensitive information)
    return NextResponse.json({
      invitation: {
        email: invitation.email,
        role: invitation.role,
        expiresAt: invitation.expires_at,
        createdAt: invitation.created_at,
        organization: invitation.organization,
        inviter: invitation.inviter
      }
    })

  } catch (error) {
    console.error('Error fetching invitation details:', error)
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