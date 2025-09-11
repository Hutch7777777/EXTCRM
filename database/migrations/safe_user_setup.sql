-- =============================================
-- Safe User Setup for Authentication
-- Purpose: Create missing tables/functions safely (handles existing objects)
-- =============================================

-- Enable UUID extension (safe - won't error if exists)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create types only if they don't exist
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM (
        'owner',
        'operations_manager', 
        'sales_manager',
        'estimating_manager',
        'estimator',
        'field_management'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE user_status AS ENUM (
        'pending',
        'active', 
        'inactive',
        'suspended'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE organization_status AS ENUM (
        'active',
        'trial',
        'suspended',
        'cancelled'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create organizations table if it doesn't exist
CREATE TABLE IF NOT EXISTS organizations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(200) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    status organization_status DEFAULT 'trial',
    phone VARCHAR(20),
    address_line_1 VARCHAR(255),
    city VARCHAR(100),
    state VARCHAR(2),
    zip_code VARCHAR(10),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create users table if it doesn't exist
CREATE TABLE IF NOT EXISTS users (
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
    
    -- Contact information
    phone VARCHAR(20),
    mobile VARCHAR(20),
    
    -- Work information
    title VARCHAR(100),
    department VARCHAR(100),
    
    -- System fields
    is_admin BOOLEAN DEFAULT false,
    permissions JSONB DEFAULT '{}',
    notification_preferences JSONB DEFAULT '{"email": true, "browser": true, "mobile": false}',
    timezone VARCHAR(50) DEFAULT 'America/New_York',
    
    -- Audit fields
    invited_by UUID REFERENCES users(id),
    invited_at TIMESTAMPTZ,
    activated_at TIMESTAMPTZ,
    last_login_at TIMESTAMPTZ,
    login_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Constraints
    UNIQUE(organization_id, email)
);

-- Enable Row Level Security
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for organizations (only if they don't exist)
DO $$ BEGIN
    CREATE POLICY "Users can view their organization" ON organizations
        FOR SELECT USING (
            id IN (
                SELECT organization_id 
                FROM users 
                WHERE id = auth.uid()
            )
        );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create RLS policies for users (only if they don't exist)
DO $$ BEGIN
    CREATE POLICY "Users can view users in their organization" ON users
        FOR SELECT USING (
            organization_id IN (
                SELECT organization_id 
                FROM users 
                WHERE id = auth.uid()
            )
        );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE POLICY "Users can update their own profile" ON users
        FOR UPDATE USING (id = auth.uid());
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE POLICY "Authenticated users can insert their profile" ON users
        FOR INSERT WITH CHECK (id = auth.uid());
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create indexes if they don't exist
CREATE INDEX IF NOT EXISTS idx_users_organization_id ON users(organization_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_organizations_slug ON organizations(slug);

-- Create or replace the organization registration function
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
    
    -- Create the user profile
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
        new_user_id,
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

-- Create trigger function for updating timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for timestamp updates
DROP TRIGGER IF EXISTS update_organizations_updated_at ON organizations;
CREATE TRIGGER update_organizations_updated_at
    BEFORE UPDATE ON organizations
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();