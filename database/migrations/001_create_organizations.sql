-- =============================================
-- Migration: 001_create_organizations.sql
-- Description: Create organizations table for multi-tenant architecture
-- Author: CRM Database Architect Agent
-- Date: 2025-09-05
-- =============================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create organizations table (tenant isolation root)
CREATE TABLE organizations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL, -- For URL-friendly organization identification
    description TEXT,
    
    -- Business information
    business_type VARCHAR(50) DEFAULT 'contractor', -- contractor, supplier, etc.
    industry_focus VARCHAR(100) DEFAULT 'exterior_finishing',
    
    -- Contact information
    primary_email VARCHAR(255),
    primary_phone VARCHAR(20),
    website VARCHAR(255),
    
    -- Address information
    street_address VARCHAR(255),
    city VARCHAR(100),
    state VARCHAR(50),
    zip_code VARCHAR(10),
    country VARCHAR(50) DEFAULT 'United States',
    
    -- Business settings
    business_divisions JSONB DEFAULT '["Multi-family", "Single-family", "R&R"]'::jsonb,
    services_offered JSONB DEFAULT '["siding", "windows", "painting", "gutters", "framing", "decking"]'::jsonb,
    timezone VARCHAR(50) DEFAULT 'America/New_York',
    currency VARCHAR(3) DEFAULT 'USD',
    
    -- Subscription and billing
    subscription_status VARCHAR(20) DEFAULT 'trial', -- trial, active, suspended, cancelled
    subscription_tier VARCHAR(50) DEFAULT 'starter', -- starter, professional, enterprise
    billing_email VARCHAR(255),
    max_users INTEGER DEFAULT 16,
    
    -- System fields
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT organizations_slug_format CHECK (slug ~ '^[a-z0-9-]+$'),
    CONSTRAINT organizations_subscription_status_check CHECK (subscription_status IN ('trial', 'active', 'suspended', 'cancelled')),
    CONSTRAINT organizations_max_users_check CHECK (max_users > 0 AND max_users <= 500)
);

-- Indexes for performance
CREATE INDEX idx_organizations_slug ON organizations(slug);
CREATE INDEX idx_organizations_subscription_status ON organizations(subscription_status);
CREATE INDEX idx_organizations_created_at ON organizations(created_at);

-- Enable Row Level Security
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can only see their own organization
CREATE POLICY organizations_tenant_isolation ON organizations
    USING (id = (SELECT auth.jwt() ->> 'organization_id')::uuid);

-- Update trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_organizations_updated_at
    BEFORE UPDATE ON organizations
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Comments for documentation
COMMENT ON TABLE organizations IS 'Multi-tenant organizations table - root of tenant isolation';
COMMENT ON COLUMN organizations.slug IS 'URL-friendly unique identifier for organization';
COMMENT ON COLUMN organizations.business_divisions IS 'JSON array of business divisions: Multi-family, Single-family, R&R';
COMMENT ON COLUMN organizations.services_offered IS 'JSON array of services offered by the organization';
COMMENT ON COLUMN organizations.max_users IS 'Maximum number of users allowed for this organization';