import { createClient } from '@supabase/supabase-js'
import { getCurrentUser } from '@/lib/auth-helpers'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const { organizationId } = await request.json()

    if (!organizationId) {
      return NextResponse.json({ error: 'Organization ID is required' }, { status: 400 })
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
    
    // Verify user has access to this organization
    const { data: userOrgs, error: orgError } = await supabase
      .from('user_organization_roles')
      .select('*')
      .eq('user_id', user.id)
      .eq('organization_id', organizationId)
      .eq('is_active', true)

    if (orgError || !userOrgs || userOrgs.length === 0) {
      return NextResponse.json({ 
        error: 'You do not have access to this organization' 
      }, { status: 403 })
    }

    // Update user's current organization
    const { error: updateError } = await supabase
      .from('users')
      .update({ 
        organization_id: organizationId,
        updated_at: new Date().toISOString()
      })
      .eq('id', user.id)

    if (updateError) {
      console.error('Error switching organization:', updateError)
      return NextResponse.json({ error: 'Failed to switch organization' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error in organization switch:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}