import { createAdminClient } from '@/lib/supabase/server'
import { getCurrentUser, requireRole } from '@/lib/auth-helpers'
import { NextResponse } from 'next/server'
import { UserRole, Database } from '@/types/supabase'

type Functions = Database['public']['Functions']

interface InviteUserRequest {
  email: string
  role: UserRole
  firstName?: string
  lastName?: string
}

export async function POST(request: Request) {
  try {
    // Check authentication and require owner or management role
    const currentUser = await requireRole(['owner', 'operations_manager', 'sales_manager'])
    
    if (!currentUser.organization_id) {
      return NextResponse.json({
        error: 'User must belong to an organization'
      }, { status: 400 })
    }

    const body: InviteUserRequest = await request.json()

    // Validate required fields
    if (!body.email || body.email.trim() === '') {
      return NextResponse.json({
        error: 'Email is required'
      }, { status: 400 })
    }

    if (!body.role) {
      return NextResponse.json({
        error: 'Role is required'
      }, { status: 400 })
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(body.email)) {
      return NextResponse.json({
        error: 'Invalid email format'
      }, { status: 400 })
    }

    // Validate role
    const validRoles: UserRole[] = [
      'owner', 
      'operations_manager', 
      'sales_manager', 
      'estimating_manager', 
      'estimator', 
      'field_management'
    ]
    
    if (!validRoles.includes(body.role)) {
      return NextResponse.json({
        error: 'Invalid role specified'
      }, { status: 400 })
    }

    // Only owners can invite other owners
    if (body.role === 'owner' && currentUser.role !== 'owner') {
      return NextResponse.json({
        error: 'Only organization owners can invite other owners'
      }, { status: 403 })
    }

    // Non-owners can only invite roles below management level
    if (currentUser.role !== 'owner' && 
        ['owner', 'operations_manager', 'sales_manager', 'estimating_manager'].includes(body.role)) {
      return NextResponse.json({
        error: 'Insufficient permissions to invite management-level roles'
      }, { status: 403 })
    }

    // Use admin client to bypass RLS
    const adminSupabase = await createAdminClient()

    // Check if user is already in the organization
    const { data: existingUser } = await adminSupabase
      .from('users')
      .select('id, status')
      .eq('email', body.email.toLowerCase().trim())
      .eq('organization_id', currentUser.organization_id)
      .single()

    if (existingUser) {
      const status = existingUser.status
      if (status === 'active') {
        return NextResponse.json({
          error: 'User is already a member of this organization'
        }, { status: 409 })
      }
      if (status === 'pending') {
        return NextResponse.json({
          error: 'User already has a pending invitation to this organization'
        }, { status: 409 })
      }
    }

    // Check if there's an existing pending invitation
    const { data: existingInvitation } = await adminSupabase
      .from('user_invitations')
      .select('id, expires_at')
      .eq('email', body.email.toLowerCase().trim())
      .eq('organization_id', currentUser.organization_id)
      .is('accepted_at', null)
      .single()

    if (existingInvitation) {
      // Check if invitation is still valid
      const expiresAt = new Date(existingInvitation.expires_at)
      if (expiresAt > new Date()) {
        return NextResponse.json({
          error: 'An active invitation already exists for this email'
        }, { status: 409 })
      }
    }

    // Call the database function to create the invitation
    const { data: invitationToken, error: funcError } = await adminSupabase.rpc('invite_user_to_organization', {
      p_organization_id: currentUser.organization_id,
      p_email: body.email.toLowerCase().trim(),
      p_role: body.role,
      p_invited_by: currentUser.id
    } as Functions['invite_user_to_organization']['Args'])

    if (funcError) {
      console.error('Database function error:', funcError)
      
      if (funcError.message?.includes('duplicate')) {
        return NextResponse.json({
          error: 'An invitation already exists for this email'
        }, { status: 409 })
      }

      return NextResponse.json({
        error: 'Failed to create user invitation'
      }, { status: 500 })
    }

    // TODO: Send invitation email here
    // This would typically integrate with an email service like SendGrid, Resend, etc.
    // For now, we'll return the token for testing purposes
    console.log(`Invitation created for ${body.email} with token: ${invitationToken}`)

    return NextResponse.json({
      success: true,
      message: 'User invitation sent successfully',
      // Remove token from response in production
      invitationToken: process.env.NODE_ENV === 'development' ? invitationToken : undefined
    }, { status: 201 })

  } catch (error) {
    console.error('Error in user invitation:', error)
    
    // Handle auth errors
    if (error instanceof Error && error.message.includes('Authentication required')) {
      return NextResponse.json({
        error: 'Authentication required'
      }, { status: 401 })
    }
    
    if (error instanceof Error && error.message.includes('Required role')) {
      return NextResponse.json({
        error: 'Insufficient permissions. Management role required.'
      }, { status: 403 })
    }

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

// Get pending invitations for the current organization
export async function GET() {
  try {
    const currentUser = await requireRole(['owner', 'operations_manager', 'sales_manager'])
    
    if (!currentUser.organization_id) {
      return NextResponse.json({
        error: 'User must belong to an organization'
      }, { status: 400 })
    }

    const adminSupabase = await createAdminClient()

    const { data: invitations, error } = await adminSupabase
      .from('user_invitations')
      .select(`
        id,
        email,
        role,
        invited_by,
        invitation_token,
        expires_at,
        created_at,
        inviter:users!invited_by(
          first_name,
          last_name,
          email
        )
      `)
      .eq('organization_id', currentUser.organization_id)
      .is('accepted_at', null)
      .gte('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching invitations:', error)
      return NextResponse.json({
        error: 'Failed to fetch invitations'
      }, { status: 500 })
    }

    return NextResponse.json({
      invitations: invitations || []
    })

  } catch (error) {
    console.error('Error in get invitations:', error)
    
    if (error instanceof Error && error.message.includes('Authentication required')) {
      return NextResponse.json({
        error: 'Authentication required'
      }, { status: 401 })
    }
    
    if (error instanceof Error && error.message.includes('Required role')) {
      return NextResponse.json({
        error: 'Insufficient permissions'
      }, { status: 403 })
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