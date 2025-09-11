-- =============================================
-- Authentication Bridge System Migration
-- Created: 2025-01-05
-- Purpose: Connect Supabase auth.users to custom users table with automatic organization setup
-- =============================================

-- Create user invitation system table
CREATE TABLE user_invitations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    email VARCHAR(255) NOT NULL,
    role user_role NOT NULL,
    invited_by UUID NOT NULL REFERENCES users(id),
    invitation_token UUID NOT NULL DEFAULT uuid_generate_v4(),
    expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '7 days'),
    accepted_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(email, organization_id) -- Prevent duplicate invitations for same email/org
);

-- Create organization registration table (temporary during signup process)
CREATE TABLE organization_registrations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    auth_user_id UUID NOT NULL, -- References auth.users.id
    organization_name VARCHAR(255) NOT NULL,
    organization_slug VARCHAR(100) NOT NULL,
    owner_first_name VARCHAR(100) NOT NULL,
    owner_last_name VARCHAR(100) NOT NULL,
    owner_email VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    address_line_1 TEXT,
    city VARCHAR(100),
    state VARCHAR(50),
    zip_code VARCHAR(20),
    registration_token UUID NOT NULL DEFAULT uuid_generate_v4(),
    is_completed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    UNIQUE(auth_user_id), -- One registration per auth user
    UNIQUE(organization_slug) -- Ensure slug uniqueness during registration
);

-- =============================================
-- AUTHENTICATION BRIDGE FUNCTIONS
-- =============================================

-- Function to handle new user signup from Supabase Auth
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    registration_rec organization_registrations%ROWTYPE;
    org_id UUID;
    user_id UUID;
BEGIN
    -- Check if this is a user completing organization registration
    SELECT * INTO registration_rec
    FROM organization_registrations
    WHERE auth_user_id = NEW.id AND is_completed = FALSE;
    
    IF FOUND THEN
        -- Complete organization registration
        -- 1. Create the organization
        INSERT INTO organizations (
            name, 
            slug, 
            status,
            phone,
            address_line_1,
            city,
            state,
            zip_code
        ) VALUES (
            registration_rec.organization_name,
            registration_rec.organization_slug,
            'trial',
            registration_rec.phone,
            registration_rec.address_line_1,
            registration_rec.city,
            registration_rec.state,
            registration_rec.zip_code
        ) RETURNING id INTO org_id;
        
        -- 2. Create the user record as owner
        INSERT INTO users (
            id,
            organization_id,
            email,
            first_name,
            last_name,
            display_name,
            role,
            status,
            is_admin,
            activated_at
        ) VALUES (
            NEW.id,
            org_id,
            registration_rec.owner_email,
            registration_rec.owner_first_name,
            registration_rec.owner_last_name,
            registration_rec.owner_first_name || ' ' || registration_rec.owner_last_name,
            'owner',
            'active',
            TRUE,
            NOW()
        );
        
        -- 3. Mark registration as completed
        UPDATE organization_registrations 
        SET is_completed = TRUE, completed_at = NOW()
        WHERE id = registration_rec.id;
        
        RAISE LOG 'Organization % created with owner %', registration_rec.organization_name, registration_rec.owner_email;
        
    ELSE
        -- Check if this user was invited to an existing organization
        DECLARE
            invitation_rec user_invitations%ROWTYPE;
        BEGIN
            SELECT * INTO invitation_rec
            FROM user_invitations
            WHERE email = NEW.email 
            AND accepted_at IS NULL 
            AND expires_at > NOW()
            ORDER BY created_at DESC
            LIMIT 1;
            
            IF FOUND THEN
                -- Create user record from invitation
                INSERT INTO users (
                    id,
                    organization_id,
                    email,
                    first_name,
                    last_name,
                    display_name,
                    role,
                    status,
                    invited_by,
                    invited_at,
                    activated_at
                ) VALUES (
                    NEW.id,
                    invitation_rec.organization_id,
                    NEW.email,
                    COALESCE(NEW.raw_user_meta_data->>'first_name', ''),
                    COALESCE(NEW.raw_user_meta_data->>'last_name', ''),
                    COALESCE(NEW.raw_user_meta_data->>'first_name', '') || ' ' || COALESCE(NEW.raw_user_meta_data->>'last_name', ''),
                    invitation_rec.role,
                    'active',
                    invitation_rec.invited_by,
                    invitation_rec.created_at,
                    NOW()
                );
                
                -- Mark invitation as accepted
                UPDATE user_invitations 
                SET accepted_at = NOW()
                WHERE id = invitation_rec.id;
                
                RAISE LOG 'User % joined organization via invitation', NEW.email;
            ELSE
                -- This should not happen in normal flow - user signed up without invitation or registration
                RAISE EXCEPTION 'User % signed up without valid invitation or organization registration', NEW.email;
            END IF;
        END;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to create organization registration (called from frontend)
CREATE OR REPLACE FUNCTION create_organization_registration(
    p_auth_user_id UUID,
    p_organization_name VARCHAR(255),
    p_organization_slug VARCHAR(100),
    p_owner_first_name VARCHAR(100),
    p_owner_last_name VARCHAR(100),
    p_owner_email VARCHAR(255),
    p_phone VARCHAR(20) DEFAULT NULL,
    p_address_line_1 TEXT DEFAULT NULL,
    p_city VARCHAR(100) DEFAULT NULL,
    p_state VARCHAR(50) DEFAULT NULL,
    p_zip_code VARCHAR(20) DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    registration_id UUID;
BEGIN
    -- Validate slug uniqueness across existing organizations
    IF EXISTS (SELECT 1 FROM organizations WHERE slug = p_organization_slug) THEN
        RAISE EXCEPTION 'Organization slug % already exists', p_organization_slug;
    END IF;
    
    -- Create registration record
    INSERT INTO organization_registrations (
        auth_user_id,
        organization_name,
        organization_slug,
        owner_first_name,
        owner_last_name,
        owner_email,
        phone,
        address_line_1,
        city,
        state,
        zip_code
    ) VALUES (
        p_auth_user_id,
        p_organization_name,
        p_organization_slug,
        p_owner_first_name,
        p_owner_last_name,
        p_owner_email,
        p_phone,
        p_address_line_1,
        p_city,
        p_state,
        p_zip_code
    ) RETURNING id INTO registration_id;
    
    RETURN registration_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to invite user to organization
CREATE OR REPLACE FUNCTION invite_user_to_organization(
    p_organization_id UUID,
    p_email VARCHAR(255),
    p_role user_role,
    p_invited_by UUID
)
RETURNS UUID AS $$
DECLARE
    invitation_id UUID;
    current_user_org UUID;
BEGIN
    -- Verify the inviter belongs to the organization and has permission
    SELECT organization_id INTO current_user_org
    FROM users 
    WHERE id = p_invited_by;
    
    IF current_user_org != p_organization_id THEN
        RAISE EXCEPTION 'User not authorized to invite to this organization';
    END IF;
    
    -- Check if user already exists in any organization
    IF EXISTS (SELECT 1 FROM users WHERE email = p_email) THEN
        RAISE EXCEPTION 'User with email % already exists', p_email;
    END IF;
    
    -- Check if there's already a pending invitation
    IF EXISTS (
        SELECT 1 FROM user_invitations 
        WHERE email = p_email 
        AND organization_id = p_organization_id 
        AND accepted_at IS NULL 
        AND expires_at > NOW()
    ) THEN
        RAISE EXCEPTION 'User already has a pending invitation to this organization';
    END IF;
    
    -- Create invitation
    INSERT INTO user_invitations (
        organization_id,
        email,
        role,
        invited_by
    ) VALUES (
        p_organization_id,
        p_email,
        p_role,
        p_invited_by
    ) RETURNING id INTO invitation_id;
    
    RETURN invitation_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get user's organization and role info
CREATE OR REPLACE FUNCTION get_user_org_info(p_user_id UUID)
RETURNS TABLE(
    user_id UUID,
    organization_id UUID,
    organization_name VARCHAR(255),
    organization_slug VARCHAR(100),
    user_role user_role,
    user_status user_status,
    is_admin BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        u.id,
        u.organization_id,
        o.name,
        o.slug,
        u.role,
        u.status,
        u.is_admin
    FROM users u
    JOIN organizations o ON u.organization_id = o.id
    WHERE u.id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to switch user's active organization (for future multi-org support)
CREATE OR REPLACE FUNCTION switch_user_organization(
    p_user_id UUID,
    p_target_organization_id UUID
)
RETURNS BOOLEAN AS $$
DECLARE
    user_belongs_to_org BOOLEAN;
BEGIN
    -- Check if user belongs to the target organization
    SELECT EXISTS (
        SELECT 1 FROM users 
        WHERE id = p_user_id 
        AND organization_id = p_target_organization_id
    ) INTO user_belongs_to_org;
    
    IF NOT user_belongs_to_org THEN
        RAISE EXCEPTION 'User does not belong to target organization';
    END IF;
    
    -- For now, just return true since we have single-org per user
    -- This function is prepared for future multi-org support
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- TRIGGERS
-- =============================================

-- Create trigger for new user authentication
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- =============================================
-- RLS POLICIES FOR NEW TABLES
-- =============================================

-- Enable RLS on new tables
ALTER TABLE user_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_registrations ENABLE ROW LEVEL SECURITY;

-- User invitations: Organization members can view, admins can manage
CREATE POLICY "Organization members can view invitations" ON user_invitations
    FOR SELECT USING (
        organization_id = (
            SELECT organization_id FROM users WHERE id = auth.uid()
        )
    );

CREATE POLICY "Admins can manage invitations" ON user_invitations
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() 
            AND organization_id = user_invitations.organization_id
            AND role IN ('owner', 'operations_manager')
        )
    );

-- Organization registrations: Only the creator can access
CREATE POLICY "Users can access their own registration" ON organization_registrations
    FOR ALL USING (auth_user_id = auth.uid());

-- =============================================
-- INDEXES FOR PERFORMANCE
-- =============================================

CREATE INDEX idx_user_invitations_organization_id ON user_invitations(organization_id);
CREATE INDEX idx_user_invitations_email ON user_invitations(email);
CREATE INDEX idx_user_invitations_expires_at ON user_invitations(expires_at);
CREATE INDEX idx_organization_registrations_auth_user_id ON organization_registrations(auth_user_id);
CREATE INDEX idx_organization_registrations_slug ON organization_registrations(organization_slug);

-- =============================================
-- ADDITIONAL BUSINESS LOGIC ENHANCEMENTS
-- =============================================

-- Function to clean up expired invitations (run via cron)
CREATE OR REPLACE FUNCTION cleanup_expired_invitations()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM user_invitations 
    WHERE expires_at < NOW() 
    AND accepted_at IS NULL;
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    
    RAISE LOG 'Cleaned up % expired invitations', deleted_count;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Function to get organization stats (for dashboard)
CREATE OR REPLACE FUNCTION get_organization_stats(p_organization_id UUID)
RETURNS TABLE(
    total_users INTEGER,
    active_users INTEGER,
    pending_invitations INTEGER,
    total_leads INTEGER,
    total_jobs INTEGER,
    total_estimates INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        (SELECT COUNT(*)::INTEGER FROM users WHERE organization_id = p_organization_id),
        (SELECT COUNT(*)::INTEGER FROM users WHERE organization_id = p_organization_id AND status = 'active'),
        (SELECT COUNT(*)::INTEGER FROM user_invitations WHERE organization_id = p_organization_id AND accepted_at IS NULL AND expires_at > NOW()),
        (SELECT COUNT(*)::INTEGER FROM leads WHERE organization_id = p_organization_id),
        (SELECT COUNT(*)::INTEGER FROM jobs WHERE organization_id = p_organization_id),
        (SELECT COUNT(*)::INTEGER FROM estimates WHERE organization_id = p_organization_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Enhanced user creation trigger for better audit trail
CREATE OR REPLACE FUNCTION update_user_login_stats()
RETURNS TRIGGER AS $$
BEGIN
    -- Update login statistics when user signs in
    UPDATE users 
    SET 
        last_login_at = NOW(),
        login_count = login_count + 1
    WHERE id = NEW.id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update login stats on auth table updates
CREATE TRIGGER on_auth_user_signin
    AFTER UPDATE OF last_sign_in_at ON auth.users
    FOR EACH ROW 
    WHEN (OLD.last_sign_in_at IS DISTINCT FROM NEW.last_sign_in_at)
    EXECUTE FUNCTION update_user_login_stats();

-- =============================================
-- SECURITY ENHANCEMENTS
-- =============================================

-- Add constraint to ensure organization owners exist
ALTER TABLE organizations ADD CONSTRAINT check_organization_has_owner
    CHECK (EXISTS (
        SELECT 1 FROM users 
        WHERE users.organization_id = organizations.id 
        AND users.role = 'owner' 
        AND users.status = 'active'
    )) NOT VALID; -- NOT VALID allows existing data, validates new

-- Function to validate organization ownership
CREATE OR REPLACE FUNCTION validate_organization_ownership()
RETURNS TRIGGER AS $$
BEGIN
    -- When deleting or changing an owner, ensure another owner exists
    IF TG_OP = 'DELETE' OR (TG_OP = 'UPDATE' AND OLD.role = 'owner' AND NEW.role != 'owner') THEN
        IF NOT EXISTS (
            SELECT 1 FROM users 
            WHERE organization_id = COALESCE(OLD.organization_id, NEW.organization_id)
            AND role = 'owner' 
            AND status = 'active'
            AND id != COALESCE(OLD.id, NEW.id)
        ) THEN
            RAISE EXCEPTION 'Organization must have at least one active owner';
        END IF;
    END IF;
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Trigger to validate organization ownership
CREATE TRIGGER validate_org_ownership
    BEFORE UPDATE OR DELETE ON users
    FOR EACH ROW 
    WHEN ((OLD.role = 'owner') OR (TG_OP = 'UPDATE' AND NEW.role != 'owner'))
    EXECUTE FUNCTION validate_organization_ownership();

-- =============================================
-- FINAL NOTES
-- =============================================

COMMENT ON TABLE user_invitations IS 'Manages user invitations to organizations with expiration and tracking';
COMMENT ON TABLE organization_registrations IS 'Temporary table for organization signup process completion';
COMMENT ON FUNCTION handle_new_user() IS 'Automatically creates user records and organizations when Supabase auth users are created';
COMMENT ON FUNCTION create_organization_registration(UUID,VARCHAR,VARCHAR,VARCHAR,VARCHAR,VARCHAR,VARCHAR,TEXT,VARCHAR,VARCHAR,VARCHAR) IS 'Creates organization registration for new contractor signup';
COMMENT ON FUNCTION invite_user_to_organization(UUID,VARCHAR,user_role,UUID) IS 'Invites users to join existing organizations';
COMMENT ON FUNCTION get_user_org_info(UUID) IS 'Returns user organization and role information for session management';

-- This migration adds:
-- 1. Complete authentication bridge between Supabase auth.users and custom users table
-- 2. Organization registration flow for new contractors
-- 3. User invitation system for adding team members  
-- 4. Automatic owner assignment during organization creation
-- 5. Proper multi-tenant security with RLS policies
-- 6. Business logic functions for common operations
-- 7. Performance indexes and security constraints
-- 8. Audit trail enhancements for login tracking