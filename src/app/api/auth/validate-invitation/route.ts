import { NextRequest, NextResponse } from 'next/server'
import { createRouteClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const token = searchParams.get('token')

    if (!token) {
      return NextResponse.json(
        { error: 'Invitation token is required' },
        { status: 400 }
      )
    }

    const supabase = await createRouteClient()

    // Get invitation details
    const { data: invitation, error } = await supabase
      .from('user_invitations')
      .select(`
        email,
        role,
        expires_at,
        accepted_at,
        organization:organizations(name),
        inviter:users!user_invitations_invited_by_fkey(first_name, last_name)
      `)
      .eq('invitation_token', token)
      .single()

    if (error || !invitation) {
      return NextResponse.json(
        { error: 'Invalid invitation token' },
        { status: 404 }
      )
    }

    // Check if already accepted
    if (invitation.accepted_at) {
      return NextResponse.json(
        { error: 'This invitation has already been accepted' },
        { status: 400 }
      )
    }

    // Check if expired
    if (new Date(invitation.expires_at) < new Date()) {
      return NextResponse.json(
        { error: 'This invitation has expired' },
        { status: 400 }
      )
    }

    // Return invitation data
    return NextResponse.json({
      invitation: {
        email: invitation.email,
        role: invitation.role,
        organizationName: invitation.organization?.name || 'Unknown Organization',
        invitedBy: invitation.inviter ? 
          `${invitation.inviter.first_name} ${invitation.inviter.last_name}` : 
          'Unknown User',
        expiresAt: invitation.expires_at
      }
    })

  } catch (error) {
    console.error('Validate invitation error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}