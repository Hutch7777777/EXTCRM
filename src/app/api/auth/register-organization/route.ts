import { createAdminClient, createRouteClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { Database } from '@/types/supabase'

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
    console.log('🔍 [Register Organization] Starting authentication check...')
    
    // Get the authenticated user from Supabase auth
    const supabase = await createRouteClient()
    console.log('✅ [Register Organization] Supabase client created successfully')
    
    // Try to get the user from the session
    let { data: { user }, error: authError } = await supabase.auth.getUser()
    
    // If no user found via cookies, try the Authorization header
    if (!user && !authError) {
      const authHeader = request.headers.get('authorization')
      if (authHeader?.startsWith('Bearer ')) {
        const token = authHeader.substring(7)
        const { data, error } = await supabase.auth.getUser(token)
        user = data.user
        authError = error
        console.log('🔍 [Register Organization] Using Authorization header token')
      }
    }
    
    console.log('🔍 [Register Organization] Authentication result:', {
      hasUser: !!user,
      userEmail: user?.email || 'N/A',
      authError: authError?.message || 'None'
    })
    
    if (authError) {
      console.error('❌ [Register Organization] Auth error:', authError)
      return NextResponse.json({ 
        error: 'Authentication failed',
        details: authError.message
      }, { status: 401 })
    }
    
    if (!user) {
      console.error('❌ [Register Organization] No user found')
      return NextResponse.json({ 
        error: 'Authentication required - no user found' 
      }, { status: 401 })
    }
    
    console.log('✅ [Register Organization] User authenticated:', user.email)

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
    const adminSupabase = await createAdminClient()
    
    // Call the database function to create organization registration
    const organizationData = {
      name: body.organizationName.trim(),
      slug: body.organizationSlug.trim(),
      phone: body.phone?.trim() || null,
      address_line_1: body.addressLine1?.trim() || null,
      city: body.city?.trim() || null,
      state: body.state?.trim() || null,
      zip_code: body.zipCode?.trim() || null
    }

    // Call the database function with the updated signature
    // Note: TypeScript types haven't been updated yet, so we bypass them
    const { data, error: funcError } = await adminSupabase.rpc('create_organization_registration', {
      p_auth_user_id: user.id,  // Pass the authenticated user's ID
      p_email: body.ownerEmail.trim(),
      p_first_name: body.ownerFirstName.trim(),
      p_last_name: body.ownerLastName.trim(),
      p_organization_data: organizationData
    } as any)

    if (funcError) {
      console.error('❌ Database function error details:', {
        message: funcError.message,
        code: funcError.code,
        details: funcError.details,
        hint: funcError.hint,
        fullError: funcError
      })
      
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
        error: `Database error saving new user: ${funcError.message}`,
        details: funcError.details || 'No additional details available'
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