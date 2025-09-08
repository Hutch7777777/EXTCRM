-- =============================================
-- Minimal User Setup for Authentication Testing
-- Purpose: Allow Supabase Auth to work while full schema is deployed
-- =============================================

-- Create minimal types needed for user table
CREATE TYPE user_role AS ENUM (
    'owner',
    'operations_manager', 
    'sales_manager',
    'estimating_manager',
    'estimator',
    'field_management'
);

CREATE TYPE user_status AS ENUM (
    'pending',
    'active', 
    'inactive',
    'suspended'
);

CREATE TYPE organization_status AS ENUM (
    'active',
    'trial',
    'suspended',
    'cancelled'
);

-- Create minimal organizations table
CREATE TABLE organizations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(200) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    status organization_status DEFAULT 'trial',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create minimal users table (extends Supabase auth.users)
CREATE TABLE users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    
    -- Basic information
    email VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    display_name VARCHAR(200) GENERATED ALWAYS AS (first_name || ' ' || last_name) STORED,
    
    -- Role and permissions
    role user_role NOT NULL DEFAULT 'owner',
    status user_status DEFAULT 'pending',
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Constraints
    UNIQUE(organization_id, email)
);

-- Create function to handle new user registration
CREATE OR REPLACE FUNCTION handle_new_user() 
RETURNS TRIGGER AS $$
BEGIN
    -- This function can be expanded later to handle user creation logic
    -- For now, it just allows the user to be created
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Enable Row Level Security
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Create basic RLS policies for organizations
CREATE POLICY "Users can view their organization" ON organizations
    FOR SELECT USING (
        id IN (
            SELECT organization_id 
            FROM users 
            WHERE id = auth.uid()
        )
    );

-- Create basic RLS policies for users
CREATE POLICY "Users can view users in their organization" ON users
    FOR SELECT USING (
        organization_id IN (
            SELECT organization_id 
            FROM users 
            WHERE id = auth.uid()
        )
    );

CREATE POLICY "Users can update their own profile" ON users
    FOR UPDATE USING (id = auth.uid());

-- Create indexes for performance
CREATE INDEX idx_users_organization_id ON users(organization_id);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_organizations_slug ON organizations(slug);

-- Create the organization registration function
CREATE OR REPLACE FUNCTION create_organization_registration(
    p_email VARCHAR(255),
    p_first_name VARCHAR(100),
    p_last_name VARCHAR(100),
    p_organization_data JSONB
) RETURNS UUID AS $$
DECLARE
    new_org_id UUID;
    new_user_id UUID;
BEGIN
    -- Get the authenticated user ID
    new_user_id := auth.uid();
    
    IF new_user_id IS NULL THEN
        RAISE EXCEPTION 'User must be authenticated';
    END IF;
    
    -- Create the organization
    INSERT INTO organizations (name, slug)
    VALUES (
        p_organization_data->>'name',
        p_organization_data->>'slug'
    )
    RETURNING id INTO new_org_id;
    
    -- Create the user profile
    INSERT INTO users (
        id,
        organization_id,
        email,
        first_name,
        last_name,
        role,
        status
    )
    VALUES (
        new_user_id,
        new_org_id,
        p_email,
        p_first_name,
        p_last_name,
        'owner',
        'active'
    );
    
    RETURN new_org_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;