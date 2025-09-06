import { createAdminClient, createRouteClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { Database } from '@/types/database'

type Functions = Database['public']['Functions']

interface RegistrationRequest {
  organizationName: string
  organizationSlug: string
  ownerFirstName: string
  ownerLastName: string
  ownerEmail: string
  phone?: string
  addressLine1?: string
  city?: string
  state?: string
  zipCode?: string
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

    const body: RegistrationRequest = await request.json()

    // Validate required fields
    const requiredFields = [
      'organizationName', 
      'organizationSlug', 
      'ownerFirstName', 
      'ownerLastName', 
      'ownerEmail'
    ]
    
    const missingFields = requiredFields.filter(field => 
      !body[field as keyof RegistrationRequest] || 
      String(body[field as keyof RegistrationRequest]).trim() === ''
    )

    if (missingFields.length > 0) {
      return NextResponse.json({
        error: 'Missing required fields',
        fields: missingFields
      }, { status: 400 })
    }

    // Validate organization slug format
    const slugRegex = /^[a-z0-9-]+$/
    if (!slugRegex.test(body.organizationSlug)) {
      return NextResponse.json({
        error: 'Organization slug must contain only lowercase letters, numbers, and hyphens'
      }, { status: 400 })
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(body.ownerEmail)) {
      return NextResponse.json({
        error: 'Invalid email format'
      }, { status: 400 })
    }

    // Ensure the authenticated user's email matches the owner email
    if (user.email !== body.ownerEmail) {
      return NextResponse.json({
        error: 'Owner email must match your authenticated email'
      }, { status: 400 })
    }

    // Use admin client to call the database function
    const adminSupabase = createAdminClient()
    
    // Call the database function to create organization registration
    const { data, error: funcError } = await adminSupabase.rpc('create_organization_registration', {
      p_auth_user_id: user.id,
      p_organization_name: body.organizationName.trim(),
      p_organization_slug: body.organizationSlug.trim(),
      p_owner_first_name: body.ownerFirstName.trim(),
      p_owner_last_name: body.ownerLastName.trim(),
      p_owner_email: body.ownerEmail.trim(),
      p_phone: body.phone?.trim() || null,
      p_address_line_1: body.addressLine1?.trim() || null,
      p_city: body.city?.trim() || null,
      p_state: body.state?.trim() || null,
      p_zip_code: body.zipCode?.trim() || null
    } as Functions['create_organization_registration']['Args'])

    if (funcError) {
      console.error('Database function error:', funcError)
      
      // Handle specific database errors
      if (funcError.code === '23505') {
        return NextResponse.json({
          error: 'Organization slug already exists. Please choose a different one.'
        }, { status: 409 })
      }
      
      if (funcError.message?.includes('duplicate key')) {
        return NextResponse.json({
          error: 'Organization slug already exists or user already has a pending registration'
        }, { status: 409 })
      }

      return NextResponse.json({
        error: 'Failed to create organization registration'
      }, { status: 500 })
    }

    // Return success response with the organization ID
    return NextResponse.json({
      success: true,
      organizationId: data,
      message: 'Organization registration completed successfully'
    }, { status: 201 })

  } catch (error) {
    console.error('Error in organization registration:', error)
    
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
export async function GET() {
  return NextResponse.json({ 
    error: 'Method not allowed' 
  }, { status: 405 })
}

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