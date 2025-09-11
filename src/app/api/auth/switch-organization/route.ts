import { createAdminClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/auth-helpers'
import { NextResponse } from 'next/server'
import { Database } from '@/types/supabase'

type Functions = Database['public']['Functions']

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const { organization_id } = await request.json()

    if (!organization_id || typeof organization_id !== 'string') {
      return NextResponse.json({ 
        error: 'Valid organization ID is required' 
      }, { status: 400 })
    }

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    if (!uuidRegex.test(organization_id)) {
      return NextResponse.json({
        error: 'Invalid organization ID format'
      }, { status: 400 })
    }

    const adminSupabase = await createAdminClient()
    
    // Use the database function to switch organizations
    const { data: success, error: funcError } = await adminSupabase.rpc('switch_user_organization', {
      p_user_id: user.id,
      p_organization_id: organization_id
    } as Functions['switch_user_organization']['Args'])

    if (funcError) {
      console.error('Database function error:', funcError)
      
      // Handle specific errors
      if (funcError.message?.includes('not found') || funcError.message?.includes('access')) {
        return NextResponse.json({
          error: 'You do not have access to this organization'
        }, { status: 403 })
      }
      
      return NextResponse.json({
        error: 'Failed to switch organization'
      }, { status: 500 })
    }

    if (!success) {
      return NextResponse.json({
        error: 'You do not have access to this organization'
      }, { status: 403 })
    }

    // Get updated user info with new organization
    const { data: updatedUserOrgInfo, error: userInfoError } = await adminSupabase.rpc('get_user_org_info', {
      p_user_id: user.id
    } as Functions['get_user_org_info']['Args'])

    if (userInfoError) {
      console.error('Error fetching updated user info:', userInfoError)
      // Still return success since the switch worked
      return NextResponse.json({ 
        success: true,
        message: 'Organization switched successfully'
      })
    }

    // Find the current organization info
    const currentOrgInfo = updatedUserOrgInfo?.find(
      (org: any) => org.organization_id === organization_id
    )

    return NextResponse.json({ 
      success: true,
      message: 'Organization switched successfully',
      currentOrganization: currentOrgInfo || null,
      allOrganizations: updatedUserOrgInfo || []
    })

  } catch (error) {
    console.error('Error in organization switch:', error)
    
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

// Get all organizations the current user has access to
export async function GET() {
  try {
    const user = await getCurrentUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const adminSupabase = await createAdminClient()
    
    // Get all organizations for this user
    const { data: userOrgInfo, error: funcError } = await adminSupabase.rpc('get_user_org_info', {
      p_user_id: user.id
    } as Functions['get_user_org_info']['Args'])

    if (funcError) {
      console.error('Error fetching user organizations:', funcError)
      return NextResponse.json({
        error: 'Failed to fetch organizations'
      }, { status: 500 })
    }

    return NextResponse.json({
      organizations: userOrgInfo || [],
      currentOrganization: userOrgInfo?.find((org: any) => org.organization_id === user.organization_id) || null
    })

  } catch (error) {
    console.error('Error fetching user organizations:', error)
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

export async function PATCH() {
  return NextResponse.json({ 
    error: 'Method not allowed' 
  }, { status: 405 })
}