-- =============================================
-- Migration: 004_create_leads.sql
-- Description: Create lead management system with division tracking and workflow stages
-- Author: CRM Database Architect Agent
-- Date: 2025-09-05
-- =============================================

-- Create lead status enumeration (follows the workflow: Lead → Reach Out → Bid → Review → Propose → Contract → Schedule → Execute)
CREATE TYPE lead_status AS ENUM (
    'new',              -- New lead, not yet contacted
    'contacted',        -- Initial contact made
    'qualified',        -- Lead has been qualified as viable
    'site_visit_scheduled', -- Site visit scheduled
    'site_visit_completed', -- Site visit completed
    'estimating',       -- Estimate in progress
    'estimate_sent',    -- Estimate sent to customer
    'follow_up',        -- Following up on estimate
    'negotiating',      -- In negotiation phase
    'won',              -- Lead won, converting to job
    'lost',             -- Lead lost
    'on_hold',          -- Lead on hold
    'archived'          -- Archived lead
);

-- Create lead source enumeration
CREATE TYPE lead_source AS ENUM (
    'referral',         -- Referral from existing customer
    'website',          -- Website inquiry
    'social_media',     -- Social media lead
    'advertising',      -- Paid advertising
    'cold_call',        -- Cold calling
    'door_to_door',     -- Door-to-door sales
    'trade_show',       -- Trade show lead
    'partner',          -- Partner referral
    'repeat_customer',  -- Previous customer
    'other'            -- Other source
);

-- Create lead priority enumeration
CREATE TYPE lead_priority AS ENUM (
    'low',
    'medium',
    'high',
    'urgent'
);

-- Main leads table
CREATE TABLE leads (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    
    -- Lead identification
    lead_number VARCHAR(50) UNIQUE NOT NULL, -- Human-readable lead number (e.g., L-2025-001)
    
    -- Customer information
    customer_contact_id UUID REFERENCES contacts(id),
    
    -- Lead details
    title VARCHAR(255) NOT NULL,
    description TEXT,
    
    -- Business division and services
    division VARCHAR(50) NOT NULL, -- Multi-family, Single-family, R&R
    services_requested TEXT[] DEFAULT '{}', -- Array of requested services
    
    -- Status and workflow
    status lead_status DEFAULT 'new',
    priority lead_priority DEFAULT 'medium',
    source lead_source,
    source_details TEXT, -- Additional details about the source
    
    -- Assignment
    assigned_to UUID REFERENCES users(id), -- Primary sales person
    assigned_estimator UUID REFERENCES users(id), -- Assigned estimator
    
    -- Project details
    project_address VARCHAR(500), -- Job site address (may differ from customer address)
    project_city VARCHAR(100),
    project_state VARCHAR(50),
    project_zip_code VARCHAR(10),
    
    -- Estimated project details
    estimated_value DECIMAL(12,2), -- Estimated project value
    estimated_start_date DATE,
    estimated_duration_days INTEGER,
    
    -- Dates and timeline
    inquiry_date DATE NOT NULL DEFAULT CURRENT_DATE,
    first_contact_date DATE,
    site_visit_date DATE,
    estimate_due_date DATE,
    close_date DATE, -- When lead was won or lost
    
    -- Competition and market info
    competitors TEXT[], -- Known competitors bidding
    customer_timeline TEXT, -- Customer's desired timeline
    decision_makers JSONB DEFAULT '[]'::jsonb, -- Array of decision makers
    
    -- Lead scoring and qualification
    lead_score INTEGER DEFAULT 0, -- 0-100 lead score
    qualification_notes TEXT,
    budget_range VARCHAR(100), -- Customer's budget range
    decision_timeframe VARCHAR(100), -- When customer plans to decide
    
    -- Custom fields and tags
    tags TEXT[],
    custom_fields JSONB DEFAULT '{}'::jsonb,
    
    -- Internal notes
    notes TEXT,
    lost_reason TEXT, -- Why lead was lost
    
    -- System fields
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT leads_division_check CHECK (division IN ('Multi-family', 'Single-family', 'R&R')),
    CONSTRAINT leads_estimated_value_positive CHECK (estimated_value IS NULL OR estimated_value >= 0),
    CONSTRAINT leads_lead_score_range CHECK (lead_score >= 0 AND lead_score <= 100),
    CONSTRAINT leads_close_date_logic CHECK (
        (status IN ('won', 'lost') AND close_date IS NOT NULL) OR
        (status NOT IN ('won', 'lost') AND close_date IS NULL)
    )
);

-- Lead activities/timeline table
CREATE TABLE lead_activities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    
    -- Activity details
    activity_type VARCHAR(50) NOT NULL, -- call, email, meeting, site_visit, status_change, etc.
    title VARCHAR(255) NOT NULL,
    description TEXT,
    
    -- Activity metadata
    performed_by UUID REFERENCES users(id),
    occurred_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    duration_minutes INTEGER,
    
    -- Status change tracking
    old_status lead_status,
    new_status lead_status,
    
    -- External integration data
    external_id VARCHAR(255),
    external_metadata JSONB DEFAULT '{}'::jsonb,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Lead attachments/files
CREATE TABLE lead_attachments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    
    -- File details
    filename VARCHAR(255) NOT NULL,
    file_path VARCHAR(500) NOT NULL, -- Path to file in storage
    file_size INTEGER,
    file_type VARCHAR(100),
    mime_type VARCHAR(100),
    
    -- Metadata
    title VARCHAR(255),
    description TEXT,
    category VARCHAR(50), -- photo, document, estimate, contract, etc.
    
    -- System fields
    uploaded_by UUID REFERENCES users(id),
    uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Lead follow-ups/reminders
CREATE TABLE lead_follow_ups (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    
    -- Follow-up details
    title VARCHAR(255) NOT NULL,
    description TEXT,
    
    -- Scheduling
    due_date DATE NOT NULL,
    due_time TIME,
    
    -- Assignment
    assigned_to UUID NOT NULL REFERENCES users(id),
    
    -- Status
    is_completed BOOLEAN DEFAULT false,
    completed_at TIMESTAMP WITH TIME ZONE,
    completed_by UUID REFERENCES users(id),
    completion_notes TEXT,
    
    -- System fields
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Function to generate lead numbers
CREATE SEQUENCE lead_number_seq;

CREATE OR REPLACE FUNCTION generate_lead_number()
RETURNS TEXT AS $$
DECLARE
    org_prefix TEXT;
    year_str TEXT;
    seq_num TEXT;
BEGIN
    -- Get organization info for prefix (optional customization)
    year_str := EXTRACT(YEAR FROM CURRENT_DATE)::TEXT;
    seq_num := LPAD(nextval('lead_number_seq')::TEXT, 4, '0');
    
    RETURN 'L-' || year_str || '-' || seq_num;
END;
$$ LANGUAGE plpgsql;

-- Set default lead number
ALTER TABLE leads ALTER COLUMN lead_number SET DEFAULT generate_lead_number();

-- Indexes for performance
CREATE INDEX idx_leads_organization_id ON leads(organization_id);
CREATE INDEX idx_leads_lead_number ON leads(lead_number);
CREATE INDEX idx_leads_customer_contact_id ON leads(customer_contact_id);
CREATE INDEX idx_leads_status ON leads(status);
CREATE INDEX idx_leads_assigned_to ON leads(assigned_to);
CREATE INDEX idx_leads_assigned_estimator ON leads(assigned_estimator);
CREATE INDEX idx_leads_division ON leads(division);
CREATE INDEX idx_leads_source ON leads(source);
CREATE INDEX idx_leads_priority ON leads(priority);
CREATE INDEX idx_leads_inquiry_date ON leads(inquiry_date);
CREATE INDEX idx_leads_estimated_value ON leads(estimated_value);
CREATE INDEX idx_leads_tags ON leads USING GIN(tags);
CREATE INDEX idx_leads_services_requested ON leads USING GIN(services_requested);
CREATE INDEX idx_leads_created_at ON leads(created_at);

CREATE INDEX idx_lead_activities_lead_id ON lead_activities(lead_id);
CREATE INDEX idx_lead_activities_organization_id ON lead_activities(organization_id);
CREATE INDEX idx_lead_activities_activity_type ON lead_activities(activity_type);
CREATE INDEX idx_lead_activities_occurred_at ON lead_activities(occurred_at);

CREATE INDEX idx_lead_attachments_lead_id ON lead_attachments(lead_id);
CREATE INDEX idx_lead_attachments_organization_id ON lead_attachments(organization_id);
CREATE INDEX idx_lead_attachments_category ON lead_attachments(category);

CREATE INDEX idx_lead_follow_ups_lead_id ON lead_follow_ups(lead_id);
CREATE INDEX idx_lead_follow_ups_organization_id ON lead_follow_ups(organization_id);
CREATE INDEX idx_lead_follow_ups_assigned_to ON lead_follow_ups(assigned_to);
CREATE INDEX idx_lead_follow_ups_due_date ON lead_follow_ups(due_date);
CREATE INDEX idx_lead_follow_ups_is_completed ON lead_follow_ups(is_completed);

-- Full-text search for leads
CREATE INDEX idx_leads_search ON leads USING GIN(
    to_tsvector('english',
        COALESCE(title, '') || ' ' ||
        COALESCE(description, '') || ' ' ||
        COALESCE(project_address, '') || ' ' ||
        COALESCE(notes, '')
    )
);

-- Enable Row Level Security
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE lead_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE lead_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE lead_follow_ups ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY leads_tenant_isolation ON leads
    USING (organization_id = (SELECT auth.jwt() ->> 'organization_id')::uuid);

CREATE POLICY lead_activities_tenant_isolation ON lead_activities
    USING (organization_id = (SELECT auth.jwt() ->> 'organization_id')::uuid);

CREATE POLICY lead_attachments_tenant_isolation ON lead_attachments
    USING (organization_id = (SELECT auth.jwt() ->> 'organization_id')::uuid);

CREATE POLICY lead_follow_ups_tenant_isolation ON lead_follow_ups
    USING (organization_id = (SELECT auth.jwt() ->> 'organization_id')::uuid);

-- Update triggers
CREATE TRIGGER update_leads_updated_at
    BEFORE UPDATE ON leads
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_lead_follow_ups_updated_at
    BEFORE UPDATE ON lead_follow_ups
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Function to log status changes
CREATE OR REPLACE FUNCTION log_lead_status_change()
RETURNS TRIGGER AS $$
BEGIN
    -- Only log if status actually changed
    IF OLD.status IS DISTINCT FROM NEW.status THEN
        INSERT INTO lead_activities (
            lead_id,
            organization_id,
            activity_type,
            title,
            description,
            old_status,
            new_status,
            performed_by
        ) VALUES (
            NEW.id,
            NEW.organization_id,
            'status_change',
            'Status changed from ' || OLD.status || ' to ' || NEW.status,
            CASE 
                WHEN NEW.status = 'lost' AND NEW.lost_reason IS NOT NULL 
                THEN 'Reason: ' || NEW.lost_reason
                ELSE NULL
            END,
            OLD.status,
            NEW.status,
            (SELECT auth.jwt() ->> 'user_id')::uuid
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER log_lead_status_change_trigger
    AFTER UPDATE ON leads
    FOR EACH ROW
    EXECUTE FUNCTION log_lead_status_change();

-- Comments for documentation
COMMENT ON TABLE leads IS 'Lead management with division tracking and workflow stages';
COMMENT ON COLUMN leads.division IS 'Business division: Multi-family, Single-family, or R&R';
COMMENT ON COLUMN leads.services_requested IS 'Array of requested services (siding, windows, etc.)';
COMMENT ON COLUMN leads.lead_score IS 'Lead scoring from 0-100 for prioritization';
COMMENT ON TABLE lead_activities IS 'Timeline of all activities and interactions for each lead';
COMMENT ON TABLE lead_attachments IS 'Files and documents attached to leads';
COMMENT ON TABLE lead_follow_ups IS 'Scheduled follow-up tasks and reminders for leads';