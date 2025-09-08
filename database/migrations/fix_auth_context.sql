-- Fix authentication context issue in create_organization_registration
-- This version accepts the user ID as a parameter instead of relying on auth.uid()

CREATE OR REPLACE FUNCTION create_organization_registration(
    p_auth_user_id UUID,
    p_email VARCHAR(255),
    p_first_name VARCHAR(100),
    p_last_name VARCHAR(100),
    p_organization_data JSONB
) RETURNS UUID AS $$
DECLARE
    new_org_id UUID;
BEGIN
    -- Validate that user ID is provided
    IF p_auth_user_id IS NULL THEN
        RAISE EXCEPTION 'User ID must be provided';
    END IF;
    
    -- Check if organization slug is unique
    IF EXISTS (SELECT 1 FROM organizations WHERE slug = p_organization_data->>'slug') THEN
        RAISE EXCEPTION 'Organization slug already exists';
    END IF;
    
    -- Create the organization
    INSERT INTO organizations (
        name, 
        slug,
        phone,
        address_line_1,
        city,
        state,
        zip_code
    )
    VALUES (
        p_organization_data->>'name',
        p_organization_data->>'slug',
        p_organization_data->>'phone',
        p_organization_data->>'address_line_1',
        p_organization_data->>'city',
        p_organization_data->>'state',
        p_organization_data->>'zip_code'
    )
    RETURNING id INTO new_org_id;
    
    -- Create the user profile using the provided user ID
    INSERT INTO users (
        id,
        organization_id,
        email,
        first_name,
        last_name,
        role,
        status,
        is_admin,
        activated_at
    )
    VALUES (
        p_auth_user_id,
        new_org_id,
        p_email,
        p_first_name,
        p_last_name,
        'owner',
        'active',
        true,
        NOW()
    );
    
    RETURN new_org_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;