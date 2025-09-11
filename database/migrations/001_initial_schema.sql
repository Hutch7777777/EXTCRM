-- =============================================
-- Multi-Tenant CRM Database Schema for Exterior Finishes
-- Created: 2025-01-05
-- Purpose: Complete foundation for multi-tenant SaaS CRM
-- =============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create custom types/enums
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

CREATE TYPE contact_type AS ENUM (
    'customer',
    'prospect',
    'vendor',
    'crew',
    'internal'
);

CREATE TYPE lead_source AS ENUM (
    'referral',
    'website',
    'advertising',
    'social_media',
    'direct_mail',
    'cold_call',
    'trade_show',
    'repeat_customer',
    'other'
);

CREATE TYPE lead_status AS ENUM (
    'new',
    'contacted',
    'qualified',
    'quoted',
    'proposal_sent',
    'follow_up',
    'won',
    'lost',
    'inactive'
);

CREATE TYPE division AS ENUM (
    'multi_family',
    'single_family',
    'repair_remodel'
);

CREATE TYPE job_status AS ENUM (
    'pending',
    'scheduled',
    'in_progress',
    'completed',
    'on_hold',
    'cancelled'
);

CREATE TYPE estimate_status AS ENUM (
    'draft',
    'sent',
    'viewed',
    'accepted',
    'rejected',
    'expired'
);

CREATE TYPE communication_type AS ENUM (
    'email',
    'phone',
    'text',
    'meeting',
    'note',
    'file'
);

-- =============================================
-- CORE TABLES
-- =============================================

-- Organizations table (tenant isolation root)
CREATE TABLE organizations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    status organization_status DEFAULT 'trial',
    logo_url TEXT,
    website_url TEXT,
    phone VARCHAR(20),
    address_line_1 TEXT,
    address_line_2 TEXT,
    city VARCHAR(100),
    state VARCHAR(50),
    zip_code VARCHAR(20),
    country VARCHAR(100) DEFAULT 'United States',
    tax_id VARCHAR(50),
    settings JSONB DEFAULT '{}',
    billing_info JSONB DEFAULT '{}',
    subscription_status VARCHAR(50),
    subscription_tier VARCHAR(50),
    trial_ends_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Users table (extends Supabase auth.users)
CREATE TABLE users (
    id UUID PRIMARY KEY, -- References auth.users.id
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    email VARCHAR(255) UNIQUE NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    display_name VARCHAR(200),
    role user_role NOT NULL,
    status user_status DEFAULT 'pending',
    phone VARCHAR(20),
    mobile VARCHAR(20),
    title VARCHAR(100),
    department VARCHAR(100),
    hire_date DATE,
    is_admin BOOLEAN DEFAULT FALSE,
    permissions JSONB DEFAULT '{}',
    timezone VARCHAR(50) DEFAULT 'America/New_York',
    notification_preferences JSONB DEFAULT '{"email": true, "push": false, "sms": false}',
    last_login_at TIMESTAMPTZ,
    login_count INTEGER DEFAULT 0,
    invited_by UUID REFERENCES users(id),
    invited_at TIMESTAMPTZ,
    activated_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Role permissions table (RBAC system)
CREATE TABLE role_permissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    role user_role NOT NULL,
    resource VARCHAR(100) NOT NULL, -- e.g., 'leads', 'estimates', 'jobs'
    action VARCHAR(50) NOT NULL,    -- e.g., 'create', 'read', 'update', 'delete'
    conditions JSONB DEFAULT '{}',  -- Additional conditions/constraints
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- User sessions table (for tracking and analytics)
CREATE TABLE user_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    session_token VARCHAR(255),
    device_info JSONB,
    ip_address INET,
    user_agent TEXT,
    started_at TIMESTAMPTZ DEFAULT NOW(),
    last_activity_at TIMESTAMPTZ DEFAULT NOW(),
    ended_at TIMESTAMPTZ,
    is_active BOOLEAN DEFAULT TRUE
);

-- =============================================
-- CRM CORE TABLES
-- =============================================

-- Contacts table (customers, prospects, vendors, crew, internal)
CREATE TABLE contacts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    type contact_type NOT NULL,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    company_name VARCHAR(200),
    display_name VARCHAR(200) NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(20),
    mobile VARCHAR(20),
    address_line_1 TEXT,
    address_line_2 TEXT,
    city VARCHAR(100),
    state VARCHAR(50),
    zip_code VARCHAR(20),
    country VARCHAR(100) DEFAULT 'United States',
    website_url TEXT,
    notes TEXT,
    tags TEXT[], -- Array of tags for categorization
    custom_fields JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT TRUE,
    created_by UUID NOT NULL REFERENCES users(id),
    updated_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Leads table (potential projects)
CREATE TABLE leads (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    contact_id UUID REFERENCES contacts(id) ON DELETE SET NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    source lead_source NOT NULL,
    status lead_status DEFAULT 'new',
    division division NOT NULL,
    estimated_value DECIMAL(12,2),
    probability INTEGER CHECK (probability >= 0 AND probability <= 100),
    expected_close_date DATE,
    address_line_1 TEXT,
    address_line_2 TEXT,
    city VARCHAR(100),
    state VARCHAR(50),
    zip_code VARCHAR(20),
    priority INTEGER DEFAULT 3 CHECK (priority >= 1 AND priority <= 5),
    tags TEXT[],
    custom_fields JSONB DEFAULT '{}',
    assigned_to UUID REFERENCES users(id),
    created_by UUID NOT NULL REFERENCES users(id),
    updated_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Jobs table (active projects)
CREATE TABLE jobs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    lead_id UUID REFERENCES leads(id) ON DELETE SET NULL,
    contact_id UUID NOT NULL REFERENCES contacts(id) ON DELETE RESTRICT,
    job_number VARCHAR(50) NOT NULL, -- Human-readable job reference
    title VARCHAR(255) NOT NULL,
    description TEXT,
    division division NOT NULL,
    status job_status DEFAULT 'pending',
    contract_value DECIMAL(12,2),
    start_date DATE,
    scheduled_completion DATE,
    actual_completion DATE,
    address_line_1 TEXT,
    address_line_2 TEXT,
    city VARCHAR(100),
    state VARCHAR(50),
    zip_code VARCHAR(20),
    project_manager_id UUID REFERENCES users(id),
    field_manager_id UUID REFERENCES users(id),
    notes TEXT,
    tags TEXT[],
    custom_fields JSONB DEFAULT '{}',
    created_by UUID NOT NULL REFERENCES users(id),
    updated_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(organization_id, job_number) -- Ensure job numbers are unique per org
);

-- Estimates table (quotes and proposals)
CREATE TABLE estimates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    lead_id UUID REFERENCES leads(id) ON DELETE SET NULL,
    contact_id UUID NOT NULL REFERENCES contacts(id) ON DELETE RESTRICT,
    estimate_number VARCHAR(50) NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    division division NOT NULL,
    status estimate_status DEFAULT 'draft',
    subtotal DECIMAL(12,2) NOT NULL DEFAULT 0,
    tax_rate DECIMAL(5,4) DEFAULT 0,
    tax_amount DECIMAL(12,2) DEFAULT 0,
    total_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
    valid_until DATE,
    terms TEXT,
    notes TEXT,
    sent_at TIMESTAMPTZ,
    viewed_at TIMESTAMPTZ,
    accepted_at TIMESTAMPTZ,
    rejected_at TIMESTAMPTZ,
    prepared_by UUID NOT NULL REFERENCES users(id),
    approved_by UUID REFERENCES users(id),
    created_by UUID NOT NULL REFERENCES users(id),
    updated_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(organization_id, estimate_number) -- Ensure estimate numbers are unique per org
);

-- Estimate line items
CREATE TABLE estimate_line_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    estimate_id UUID NOT NULL REFERENCES estimates(id) ON DELETE CASCADE,
    sort_order INTEGER DEFAULT 0,
    item_type VARCHAR(50) DEFAULT 'item', -- 'item', 'heading', 'subtotal'
    description TEXT NOT NULL,
    quantity DECIMAL(10,3) DEFAULT 1,
    unit VARCHAR(20) DEFAULT 'ea',
    unit_price DECIMAL(10,2) DEFAULT 0,
    line_total DECIMAL(12,2) DEFAULT 0,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Communications table (emails, calls, meetings, notes)
CREATE TABLE communications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    contact_id UUID REFERENCES contacts(id) ON DELETE SET NULL,
    lead_id UUID REFERENCES leads(id) ON DELETE SET NULL,
    job_id UUID REFERENCES jobs(id) ON DELETE SET NULL,
    type communication_type NOT NULL,
    direction VARCHAR(20), -- 'inbound', 'outbound'
    subject VARCHAR(500),
    content TEXT,
    scheduled_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    duration_minutes INTEGER,
    follow_up_required BOOLEAN DEFAULT FALSE,
    follow_up_date DATE,
    participants JSONB DEFAULT '[]', -- Array of participant info
    attachments JSONB DEFAULT '[]', -- Array of file references
    created_by UUID NOT NULL REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- File attachments table
CREATE TABLE file_attachments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    filename VARCHAR(255) NOT NULL,
    original_filename VARCHAR(255) NOT NULL,
    file_size BIGINT NOT NULL,
    mime_type VARCHAR(100) NOT NULL,
    storage_path TEXT NOT NULL,
    description TEXT,
    uploaded_by UUID NOT NULL REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- REFERENCE TABLES (Shared across tenants)
-- =============================================

-- US States for addresses
CREATE TABLE ref_states (
    code VARCHAR(2) PRIMARY KEY,
    name VARCHAR(50) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE
);

-- Material types for estimates
CREATE TABLE ref_materials (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    category VARCHAR(100) NOT NULL,
    name VARCHAR(200) NOT NULL,
    unit VARCHAR(20) DEFAULT 'ea',
    base_cost DECIMAL(10,2),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- INDEXES FOR PERFORMANCE
-- =============================================

-- Multi-tenant isolation indexes
CREATE INDEX idx_users_organization_id ON users(organization_id);
CREATE INDEX idx_contacts_organization_id ON contacts(organization_id);
CREATE INDEX idx_leads_organization_id ON leads(organization_id);
CREATE INDEX idx_jobs_organization_id ON jobs(organization_id);
CREATE INDEX idx_estimates_organization_id ON estimates(organization_id);
CREATE INDEX idx_communications_organization_id ON communications(organization_id);
CREATE INDEX idx_file_attachments_organization_id ON file_attachments(organization_id);
CREATE INDEX idx_estimate_line_items_organization_id ON estimate_line_items(organization_id);
CREATE INDEX idx_user_sessions_organization_id ON user_sessions(organization_id);

-- Business logic indexes
CREATE INDEX idx_leads_status ON leads(status);
CREATE INDEX idx_leads_assigned_to ON leads(assigned_to);
CREATE INDEX idx_jobs_status ON jobs(status);
CREATE INDEX idx_jobs_project_manager ON jobs(project_manager_id);
CREATE INDEX idx_estimates_status ON estimates(status);
CREATE INDEX idx_communications_contact_lead_job ON communications(contact_id, lead_id, job_id);
CREATE INDEX idx_contacts_type ON contacts(type);
CREATE INDEX idx_contacts_active ON contacts(is_active);

-- Lookup indexes
CREATE INDEX idx_organizations_slug ON organizations(slug);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_contacts_email ON contacts(email);

-- Time-based indexes for reporting
CREATE INDEX idx_leads_created_at ON leads(created_at);
CREATE INDEX idx_jobs_created_at ON jobs(created_at);
CREATE INDEX idx_estimates_created_at ON estimates(created_at);

-- =============================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =============================================

-- Enable RLS on all multi-tenant tables
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE role_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE estimates ENABLE ROW LEVEL SECURITY;
ALTER TABLE estimate_line_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE communications ENABLE ROW LEVEL SECURITY;
ALTER TABLE file_attachments ENABLE ROW LEVEL SECURITY;

-- Organizations: Users can only see their own organization
CREATE POLICY "Users can view their own organization" ON organizations
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.organization_id = organizations.id
        )
    );

CREATE POLICY "Users can update their own organization" ON organizations
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.organization_id = organizations.id
            AND users.role IN ('owner', 'operations_manager')
        )
    );

-- Users: Can see users in their organization
CREATE POLICY "Users can view users in their organization" ON users
    FOR SELECT USING (
        organization_id = (
            SELECT organization_id FROM users WHERE id = auth.uid()
        )
    );

CREATE POLICY "Admins can manage users in their organization" ON users
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users current_user
            WHERE current_user.id = auth.uid()
            AND current_user.organization_id = users.organization_id
            AND current_user.role IN ('owner', 'operations_manager')
        )
    );

-- Contacts: Organization-scoped access
CREATE POLICY "Users can access contacts in their organization" ON contacts
    FOR ALL USING (
        organization_id = (
            SELECT organization_id FROM users WHERE id = auth.uid()
        )
    );

-- Leads: Organization-scoped access
CREATE POLICY "Users can access leads in their organization" ON leads
    FOR ALL USING (
        organization_id = (
            SELECT organization_id FROM users WHERE id = auth.uid()
        )
    );

-- Jobs: Organization-scoped access
CREATE POLICY "Users can access jobs in their organization" ON jobs
    FOR ALL USING (
        organization_id = (
            SELECT organization_id FROM users WHERE id = auth.uid()
        )
    );

-- Estimates: Organization-scoped access
CREATE POLICY "Users can access estimates in their organization" ON estimates
    FOR ALL USING (
        organization_id = (
            SELECT organization_id FROM users WHERE id = auth.uid()
        )
    );

-- Estimate line items: Through estimates relationship
CREATE POLICY "Users can access estimate line items in their organization" ON estimate_line_items
    FOR ALL USING (
        organization_id = (
            SELECT organization_id FROM users WHERE id = auth.uid()
        )
    );

-- Communications: Organization-scoped access
CREATE POLICY "Users can access communications in their organization" ON communications
    FOR ALL USING (
        organization_id = (
            SELECT organization_id FROM users WHERE id = auth.uid()
        )
    );

-- File attachments: Organization-scoped access
CREATE POLICY "Users can access files in their organization" ON file_attachments
    FOR ALL USING (
        organization_id = (
            SELECT organization_id FROM users WHERE id = auth.uid()
        )
    );

-- User sessions: Own sessions + admin visibility
CREATE POLICY "Users can view their own sessions" ON user_sessions
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Admins can view all sessions in their organization" ON user_sessions
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.organization_id = user_sessions.organization_id
            AND users.role IN ('owner', 'operations_manager')
        )
    );

-- Role permissions: Global read access (needed for permission checking)
CREATE POLICY "All authenticated users can view role permissions" ON role_permissions
    FOR SELECT USING (auth.uid() IS NOT NULL);

-- =============================================
-- TRIGGERS FOR AUDIT TRAILS
-- =============================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at trigger to relevant tables
CREATE TRIGGER update_organizations_updated_at 
    BEFORE UPDATE ON organizations 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_users_updated_at 
    BEFORE UPDATE ON users 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_contacts_updated_at 
    BEFORE UPDATE ON contacts 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_leads_updated_at 
    BEFORE UPDATE ON leads 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_jobs_updated_at 
    BEFORE UPDATE ON jobs 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_estimates_updated_at 
    BEFORE UPDATE ON estimates 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- BUSINESS LOGIC FUNCTIONS
-- =============================================

-- Function to generate next job number for organization
CREATE OR REPLACE FUNCTION get_next_job_number(org_id UUID)
RETURNS VARCHAR(50) AS $$
DECLARE
    next_num INTEGER;
    current_year INTEGER;
    job_number VARCHAR(50);
BEGIN
    current_year := EXTRACT(YEAR FROM NOW());
    
    -- Get the highest job number for this year and organization
    SELECT COALESCE(MAX(
        CAST(SUBSTRING(job_number FROM '[0-9]+$') AS INTEGER)
    ), 0) + 1
    INTO next_num
    FROM jobs 
    WHERE organization_id = org_id 
    AND job_number LIKE current_year || '-%';
    
    job_number := current_year || '-' || LPAD(next_num::TEXT, 4, '0');
    RETURN job_number;
END;
$$ LANGUAGE plpgsql;

-- Function to generate next estimate number for organization
CREATE OR REPLACE FUNCTION get_next_estimate_number(org_id UUID)
RETURNS VARCHAR(50) AS $$
DECLARE
    next_num INTEGER;
    current_year INTEGER;
    estimate_number VARCHAR(50);
BEGIN
    current_year := EXTRACT(YEAR FROM NOW());
    
    -- Get the highest estimate number for this year and organization
    SELECT COALESCE(MAX(
        CAST(SUBSTRING(estimate_number FROM '[0-9]+$') AS INTEGER)
    ), 0) + 1
    INTO next_num
    FROM estimates 
    WHERE organization_id = org_id 
    AND estimate_number LIKE 'EST-' || current_year || '-%';
    
    estimate_number := 'EST-' || current_year || '-' || LPAD(next_num::TEXT, 4, '0');
    RETURN estimate_number;
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- SEED DATA FOR REFERENCE TABLES
-- =============================================

-- Insert US States
INSERT INTO ref_states (code, name) VALUES
('AL', 'Alabama'), ('AK', 'Alaska'), ('AZ', 'Arizona'), ('AR', 'Arkansas'),
('CA', 'California'), ('CO', 'Colorado'), ('CT', 'Connecticut'), ('DE', 'Delaware'),
('FL', 'Florida'), ('GA', 'Georgia'), ('HI', 'Hawaii'), ('ID', 'Idaho'),
('IL', 'Illinois'), ('IN', 'Indiana'), ('IA', 'Iowa'), ('KS', 'Kansas'),
('KY', 'Kentucky'), ('LA', 'Louisiana'), ('ME', 'Maine'), ('MD', 'Maryland'),
('MA', 'Massachusetts'), ('MI', 'Michigan'), ('MN', 'Minnesota'), ('MS', 'Mississippi'),
('MO', 'Missouri'), ('MT', 'Montana'), ('NE', 'Nebraska'), ('NV', 'Nevada'),
('NH', 'New Hampshire'), ('NJ', 'New Jersey'), ('NM', 'New Mexico'), ('NY', 'New York'),
('NC', 'North Carolina'), ('ND', 'North Dakota'), ('OH', 'Ohio'), ('OK', 'Oklahoma'),
('OR', 'Oregon'), ('PA', 'Pennsylvania'), ('RI', 'Rhode Island'), ('SC', 'South Carolina'),
('SD', 'South Dakota'), ('TN', 'Tennessee'), ('TX', 'Texas'), ('UT', 'Utah'),
('VT', 'Vermont'), ('VA', 'Virginia'), ('WA', 'Washington'), ('WV', 'West Virginia'),
('WI', 'Wisconsin'), ('WY', 'Wyoming');

-- Insert basic material categories
INSERT INTO ref_materials (category, name, unit, base_cost) VALUES
('Siding', 'Vinyl Siding - Standard', 'sq ft', 3.50),
('Siding', 'Fiber Cement Siding', 'sq ft', 5.75),
('Siding', 'Cedar Shingles', 'sq ft', 8.25),
('Windows', 'Standard Double Hung Window', 'ea', 450.00),
('Windows', 'Casement Window', 'ea', 525.00),
('Trim', 'PVC Trim Board - 1x4', 'ln ft', 2.25),
('Trim', 'Cedar Trim Board - 1x6', 'ln ft', 3.75),
('Labor', 'Siding Installation', 'sq ft', 2.50),
('Labor', 'Window Installation', 'ea', 125.00),
('Labor', 'Trim Installation', 'ln ft', 1.25);

-- Insert default role permissions
INSERT INTO role_permissions (role, resource, action) VALUES
-- Owner permissions (full access)
('owner', '*', '*'),
-- Operations Manager permissions  
('operations_manager', 'organizations', 'read'),
('operations_manager', 'organizations', 'update'),
('operations_manager', 'users', '*'),
('operations_manager', 'contacts', '*'),
('operations_manager', 'leads', '*'),
('operations_manager', 'jobs', '*'),
('operations_manager', 'estimates', '*'),
('operations_manager', 'communications', '*'),
-- Sales Manager permissions
('sales_manager', 'contacts', '*'),
('sales_manager', 'leads', '*'),
('sales_manager', 'estimates', 'read'),
('sales_manager', 'estimates', 'update'),
('sales_manager', 'jobs', 'read'),
('sales_manager', 'communications', '*'),
-- Estimating Manager permissions
('estimating_manager', 'contacts', 'read'),
('estimating_manager', 'leads', 'read'),
('estimating_manager', 'leads', 'update'),
('estimating_manager', 'estimates', '*'),
('estimating_manager', 'jobs', 'read'),
('estimating_manager', 'communications', '*'),
-- Estimator permissions
('estimator', 'contacts', 'read'),
('estimator', 'leads', 'read'),
('estimator', 'estimates', 'create'),
('estimator', 'estimates', 'read'),
('estimator', 'estimates', 'update'),
('estimator', 'communications', 'create'),
('estimator', 'communications', 'read'),
-- Field Management permissions
('field_management', 'contacts', 'read'),
('field_management', 'jobs', 'read'),
('field_management', 'jobs', 'update'),
('field_management', 'communications', '*');

-- =============================================
-- FINAL NOTES
-- =============================================

-- This schema provides:
-- 1. Complete multi-tenant isolation with organization_id
-- 2. Row Level Security for data protection
-- 3. Role-based access control system
-- 4. Core CRM functionality for exterior finishing contractors
-- 5. Audit trails and business logic functions
-- 6. Performance optimized with proper indexing
-- 7. Scalable architecture for SaaS deployment

COMMENT ON DATABASE current_database() IS 'Multi-tenant CRM for Exterior Finishes contractors - Initial schema v1.0';