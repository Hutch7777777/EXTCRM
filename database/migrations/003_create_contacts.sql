-- =============================================
-- Migration: 003_create_contacts.sql
-- Description: Create comprehensive contact management system
-- Author: CRM Database Architect Agent
-- Date: 2025-09-05
-- =============================================

-- Create contact type enumeration
CREATE TYPE contact_type AS ENUM (
    'customer',     -- End customers/prospects
    'vendor',       -- Suppliers, subcontractors
    'crew',         -- Field crews and workers
    'internal',     -- Internal team members not in users table
    'referral'      -- Referral sources
);

-- Create contact status enumeration
CREATE TYPE contact_status AS ENUM (
    'active',       -- Active contact
    'inactive',     -- Temporarily inactive
    'blacklisted',  -- Do not contact
    'prospect',     -- Potential customer
    'archived'      -- Archived/historical
);

-- Main contacts table
CREATE TABLE contacts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    
    -- Basic information
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    company_name VARCHAR(255),
    display_name VARCHAR(300) GENERATED ALWAYS AS (
        CASE 
            WHEN company_name IS NOT NULL AND first_name IS NOT NULL 
            THEN first_name || ' ' || COALESCE(last_name, '') || ' (' || company_name || ')'
            WHEN company_name IS NOT NULL 
            THEN company_name
            ELSE first_name || ' ' || COALESCE(last_name, '')
        END
    ) STORED,
    
    -- Contact classification
    type contact_type NOT NULL,
    status contact_status DEFAULT 'active',
    
    -- Contact information
    primary_email VARCHAR(255),
    secondary_email VARCHAR(255),
    primary_phone VARCHAR(20),
    secondary_phone VARCHAR(20),
    mobile_phone VARCHAR(20),
    fax VARCHAR(20),
    
    -- Address information
    street_address VARCHAR(255),
    street_address_2 VARCHAR(255),
    city VARCHAR(100),
    state VARCHAR(50),
    zip_code VARCHAR(10),
    country VARCHAR(50) DEFAULT 'United States',
    
    -- Business information (for companies)
    title VARCHAR(100),
    department VARCHAR(100),
    website VARCHAR(255),
    tax_id VARCHAR(50), -- For vendors
    license_number VARCHAR(100), -- For contractors/crews
    
    -- Relationship information
    source VARCHAR(100), -- How we got this contact
    referral_source VARCHAR(255),
    assigned_to UUID REFERENCES users(id), -- Sales rep or account manager
    
    -- Custom fields and tags
    tags TEXT[], -- Array of tags for categorization
    custom_fields JSONB DEFAULT '{}'::jsonb,
    
    -- Notes and communication preferences
    notes TEXT,
    communication_preferences JSONB DEFAULT '{
        "preferred_contact_method": "email",
        "best_time_to_call": "business_hours",
        "do_not_call": false,
        "do_not_email": false
    }'::jsonb,
    
    -- System fields
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_contact_date TIMESTAMP WITH TIME ZONE,
    
    -- Constraints
    CONSTRAINT contacts_name_or_company_required CHECK (
        first_name IS NOT NULL OR company_name IS NOT NULL
    ),
    CONSTRAINT contacts_email_format CHECK (
        primary_email IS NULL OR primary_email ~ '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'
    ),
    CONSTRAINT contacts_secondary_email_format CHECK (
        secondary_email IS NULL OR secondary_email ~ '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'
    )
);

-- Contact addresses (for contacts with multiple addresses)
CREATE TABLE contact_addresses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    contact_id UUID NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    
    -- Address details
    address_type VARCHAR(50) NOT NULL, -- billing, shipping, job_site, etc.
    label VARCHAR(100), -- Custom label like "Main Office", "Warehouse"
    
    street_address VARCHAR(255) NOT NULL,
    street_address_2 VARCHAR(255),
    city VARCHAR(100) NOT NULL,
    state VARCHAR(50) NOT NULL,
    zip_code VARCHAR(10) NOT NULL,
    country VARCHAR(50) DEFAULT 'United States',
    
    -- Metadata
    is_primary BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    notes TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Contact communication log
CREATE TABLE contact_communications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    contact_id UUID NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    
    -- Communication details
    type VARCHAR(50) NOT NULL, -- email, phone, meeting, text, etc.
    direction VARCHAR(10) NOT NULL, -- inbound, outbound
    subject VARCHAR(500),
    content TEXT,
    
    -- Metadata
    initiated_by UUID REFERENCES users(id),
    occurred_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    duration_minutes INTEGER, -- For calls/meetings
    
    -- Integration data
    external_id VARCHAR(255), -- For email/calendar integration
    external_metadata JSONB DEFAULT '{}'::jsonb,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT contact_communications_direction_check CHECK (direction IN ('inbound', 'outbound'))
);

-- Contact relationships (for modeling complex relationships)
CREATE TABLE contact_relationships (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    
    primary_contact_id UUID NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
    related_contact_id UUID NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
    relationship_type VARCHAR(50) NOT NULL, -- employee_of, partner, referral_source, etc.
    
    is_active BOOLEAN DEFAULT true,
    notes TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Prevent self-relationships and duplicates
    CONSTRAINT contact_relationships_no_self_reference CHECK (primary_contact_id != related_contact_id),
    CONSTRAINT contact_relationships_unique UNIQUE (primary_contact_id, related_contact_id, relationship_type)
);

-- Indexes for performance
CREATE INDEX idx_contacts_organization_id ON contacts(organization_id);
CREATE INDEX idx_contacts_type ON contacts(type);
CREATE INDEX idx_contacts_status ON contacts(status);
CREATE INDEX idx_contacts_assigned_to ON contacts(assigned_to);
CREATE INDEX idx_contacts_primary_email ON contacts(primary_email);
CREATE INDEX idx_contacts_company_name ON contacts(company_name);
CREATE INDEX idx_contacts_last_contact_date ON contacts(last_contact_date);
CREATE INDEX idx_contacts_tags ON contacts USING GIN(tags);
CREATE INDEX idx_contacts_created_at ON contacts(created_at);

CREATE INDEX idx_contact_addresses_contact_id ON contact_addresses(contact_id);
CREATE INDEX idx_contact_addresses_organization_id ON contact_addresses(organization_id);
CREATE INDEX idx_contact_addresses_type ON contact_addresses(address_type);

CREATE INDEX idx_contact_communications_contact_id ON contact_communications(contact_id);
CREATE INDEX idx_contact_communications_organization_id ON contact_communications(organization_id);
CREATE INDEX idx_contact_communications_type ON contact_communications(type);
CREATE INDEX idx_contact_communications_occurred_at ON contact_communications(occurred_at);

CREATE INDEX idx_contact_relationships_primary_contact ON contact_relationships(primary_contact_id);
CREATE INDEX idx_contact_relationships_related_contact ON contact_relationships(related_contact_id);
CREATE INDEX idx_contact_relationships_organization_id ON contact_relationships(organization_id);

-- Full-text search index for contact search
CREATE INDEX idx_contacts_search ON contacts USING GIN(
    to_tsvector('english', 
        COALESCE(first_name, '') || ' ' || 
        COALESCE(last_name, '') || ' ' || 
        COALESCE(company_name, '') || ' ' ||
        COALESCE(primary_email, '')
    )
);

-- Enable Row Level Security
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE contact_addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE contact_communications ENABLE ROW LEVEL SECURITY;
ALTER TABLE contact_relationships ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY contacts_tenant_isolation ON contacts
    USING (organization_id = (SELECT auth.jwt() ->> 'organization_id')::uuid);

CREATE POLICY contact_addresses_tenant_isolation ON contact_addresses
    USING (organization_id = (SELECT auth.jwt() ->> 'organization_id')::uuid);

CREATE POLICY contact_communications_tenant_isolation ON contact_communications
    USING (organization_id = (SELECT auth.jwt() ->> 'organization_id')::uuid);

CREATE POLICY contact_relationships_tenant_isolation ON contact_relationships
    USING (organization_id = (SELECT auth.jwt() ->> 'organization_id')::uuid);

-- Update triggers
CREATE TRIGGER update_contacts_updated_at
    BEFORE UPDATE ON contacts
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_contact_addresses_updated_at
    BEFORE UPDATE ON contact_addresses
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_contact_relationships_updated_at
    BEFORE UPDATE ON contact_relationships
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Function to update last_contact_date when communication is logged
CREATE OR REPLACE FUNCTION update_contact_last_contact_date()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE contacts 
    SET last_contact_date = NEW.occurred_at
    WHERE id = NEW.contact_id 
    AND (last_contact_date IS NULL OR last_contact_date < NEW.occurred_at);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_contact_last_contact_date_trigger
    AFTER INSERT ON contact_communications
    FOR EACH ROW
    EXECUTE FUNCTION update_contact_last_contact_date();

-- Comments for documentation
COMMENT ON TABLE contacts IS 'Comprehensive contact management for customers, vendors, crews, and internal team';
COMMENT ON COLUMN contacts.type IS 'Classification of contact: customer, vendor, crew, internal, referral';
COMMENT ON COLUMN contacts.tags IS 'Array of tags for flexible categorization and filtering';
COMMENT ON COLUMN contacts.custom_fields IS 'JSON object for organization-specific custom fields';
COMMENT ON TABLE contact_addresses IS 'Multiple addresses per contact (billing, shipping, job sites, etc.)';
COMMENT ON TABLE contact_communications IS 'Log of all communications with contacts';
COMMENT ON TABLE contact_relationships IS 'Models relationships between contacts (employee_of, partner, etc.)';