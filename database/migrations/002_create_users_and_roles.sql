-- =============================================
-- Migration: 002_create_users_and_roles.sql
-- Description: Create users table with role-based permissions for multi-tenant CRM
-- Author: CRM Database Architect Agent
-- Date: 2025-09-05
-- =============================================

-- Create roles enumeration for type safety
CREATE TYPE user_role AS ENUM (
    'owner',              -- Full access to everything
    'operations_manager', -- Operations oversight, user management
    'sales_manager',      -- Sales team management, reporting
    'estimating_manager', -- Estimating team oversight, pricing
    'estimator',          -- Create estimates, manage assigned leads
    'field_management'    -- Job updates, crew management, mobile access
);

-- Create user status enumeration
CREATE TYPE user_status AS ENUM (
    'pending',    -- Invited but hasn't accepted
    'active',     -- Active user
    'inactive',   -- Temporarily disabled
    'suspended'   -- Account issues
);

-- Users table (extends Supabase auth.users)
CREATE TABLE users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    
    -- Basic information
    email VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    display_name VARCHAR(200) GENERATED ALWAYS AS (first_name || ' ' || last_name) STORED,
    
    -- Role and permissions
    role user_role NOT NULL,
    status user_status DEFAULT 'pending',
    
    -- Contact information
    phone VARCHAR(20),
    mobile VARCHAR(20),
    
    -- Work information
    title VARCHAR(100),
    department VARCHAR(100),
    hire_date DATE,
    
    -- Access control
    is_admin BOOLEAN DEFAULT false, -- Organization admin (can manage users)
    permissions JSONB DEFAULT '{}'::jsonb, -- Additional granular permissions
    
    -- Preferences
    timezone VARCHAR(50),
    notification_preferences JSONB DEFAULT '{
        "email_notifications": true,
        "mobile_push": true,
        "lead_assignments": true,
        "job_updates": true,
        "system_announcements": true
    }'::jsonb,
    
    -- Login tracking
    last_login_at TIMESTAMP WITH TIME ZONE,
    login_count INTEGER DEFAULT 0,
    
    -- System fields
    invited_by UUID REFERENCES users(id),
    invited_at TIMESTAMP WITH TIME ZONE,
    activated_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT users_email_format CHECK (email ~ '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
    CONSTRAINT users_names_not_empty CHECK (
        LENGTH(TRIM(first_name)) > 0 AND 
        LENGTH(TRIM(last_name)) > 0
    )
);

-- Role permissions mapping table
CREATE TABLE role_permissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    role user_role NOT NULL,
    resource VARCHAR(50) NOT NULL, -- e.g., 'leads', 'jobs', 'estimates', 'users'
    action VARCHAR(50) NOT NULL,   -- e.g., 'create', 'read', 'update', 'delete'
    conditions JSONB DEFAULT '{}'::jsonb, -- Additional conditions like 'own_only'
    
    UNIQUE(role, resource, action)
);

-- User sessions for tracking active users (optional, for analytics)
CREATE TABLE user_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    
    session_token VARCHAR(255),
    device_info JSONB,
    ip_address INET,
    user_agent TEXT,
    
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_activity_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    ended_at TIMESTAMP WITH TIME ZONE,
    
    is_active BOOLEAN DEFAULT true
);

-- Indexes for performance
CREATE INDEX idx_users_organization_id ON users(organization_id);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_status ON users(status);
CREATE INDEX idx_users_last_login ON users(last_login_at);
CREATE UNIQUE INDEX idx_users_org_email ON users(organization_id, email);

CREATE INDEX idx_role_permissions_role ON role_permissions(role);
CREATE INDEX idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX idx_user_sessions_active ON user_sessions(is_active, last_activity_at);

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE role_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for users table
CREATE POLICY users_tenant_isolation ON users
    USING (organization_id = (SELECT auth.jwt() ->> 'organization_id')::uuid);

-- RLS Policies for role_permissions (read-only, managed by system)
CREATE POLICY role_permissions_read_all ON role_permissions
    FOR SELECT USING (true);

-- RLS Policies for user_sessions
CREATE POLICY user_sessions_tenant_isolation ON user_sessions
    USING (organization_id = (SELECT auth.jwt() ->> 'organization_id')::uuid);

-- Update triggers
CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Insert default role permissions
INSERT INTO role_permissions (role, resource, action, conditions) VALUES
-- Owner permissions (full access)
('owner', 'organizations', 'read', '{}'),
('owner', 'organizations', 'update', '{}'),
('owner', 'users', 'create', '{}'),
('owner', 'users', 'read', '{}'),
('owner', 'users', 'update', '{}'),
('owner', 'users', 'delete', '{}'),
('owner', 'contacts', 'create', '{}'),
('owner', 'contacts', 'read', '{}'),
('owner', 'contacts', 'update', '{}'),
('owner', 'contacts', 'delete', '{}'),
('owner', 'leads', 'create', '{}'),
('owner', 'leads', 'read', '{}'),
('owner', 'leads', 'update', '{}'),
('owner', 'leads', 'delete', '{}'),
('owner', 'jobs', 'create', '{}'),
('owner', 'jobs', 'read', '{}'),
('owner', 'jobs', 'update', '{}'),
('owner', 'jobs', 'delete', '{}'),
('owner', 'estimates', 'create', '{}'),
('owner', 'estimates', 'read', '{}'),
('owner', 'estimates', 'update', '{}'),
('owner', 'estimates', 'delete', '{}'),

-- Operations Manager permissions
('operations_manager', 'users', 'create', '{}'),
('operations_manager', 'users', 'read', '{}'),
('operations_manager', 'users', 'update', '{}'),
('operations_manager', 'contacts', 'create', '{}'),
('operations_manager', 'contacts', 'read', '{}'),
('operations_manager', 'contacts', 'update', '{}'),
('operations_manager', 'leads', 'read', '{}'),
('operations_manager', 'leads', 'update', '{}'),
('operations_manager', 'jobs', 'read', '{}'),
('operations_manager', 'jobs', 'update', '{}'),
('operations_manager', 'estimates', 'read', '{}'),

-- Sales Manager permissions
('sales_manager', 'contacts', 'create', '{}'),
('sales_manager', 'contacts', 'read', '{}'),
('sales_manager', 'contacts', 'update', '{}'),
('sales_manager', 'leads', 'create', '{}'),
('sales_manager', 'leads', 'read', '{}'),
('sales_manager', 'leads', 'update', '{}'),
('sales_manager', 'jobs', 'read', '{}'),
('sales_manager', 'estimates', 'read', '{}'),

-- Estimating Manager permissions
('estimating_manager', 'contacts', 'read', '{}'),
('estimating_manager', 'leads', 'read', '{}'),
('estimating_manager', 'leads', 'update', '{}'),
('estimating_manager', 'jobs', 'read', '{}'),
('estimating_manager', 'estimates', 'create', '{}'),
('estimating_manager', 'estimates', 'read', '{}'),
('estimating_manager', 'estimates', 'update', '{}'),

-- Estimator permissions
('estimator', 'contacts', 'read', '{}'),
('estimator', 'leads', 'read', '{"condition": "assigned_to_user"}'),
('estimator', 'leads', 'update', '{"condition": "assigned_to_user"}'),
('estimator', 'estimates', 'create', '{}'),
('estimator', 'estimates', 'read', '{"condition": "created_by_user"}'),
('estimator', 'estimates', 'update', '{"condition": "created_by_user"}'),

-- Field Management permissions
('field_management', 'contacts', 'read', '{}'),
('field_management', 'jobs', 'read', '{"condition": "assigned_to_user"}'),
('field_management', 'jobs', 'update', '{"condition": "assigned_to_user"}');

-- Comments for documentation
COMMENT ON TABLE users IS 'Users table with role-based permissions for multi-tenant CRM';
COMMENT ON COLUMN users.role IS 'User role determining permissions and access level';
COMMENT ON COLUMN users.permissions IS 'Additional granular permissions beyond role defaults';
COMMENT ON COLUMN users.notification_preferences IS 'User preferences for various notification types';
COMMENT ON TABLE role_permissions IS 'Defines what actions each role can perform on resources';
COMMENT ON TABLE user_sessions IS 'Tracks user sessions for analytics and security';