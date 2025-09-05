-- =============================================
-- Migration: 005_create_jobs_and_estimates.sql
-- Description: Create job and estimate tracking with workflow support
-- Author: CRM Database Architect Agent
-- Date: 2025-09-05
-- =============================================

-- Create job status enumeration
CREATE TYPE job_status AS ENUM (
    'pending',          -- Job created but not yet started
    'scheduled',        -- Job scheduled
    'in_progress',      -- Job in progress
    'on_hold',          -- Job temporarily on hold
    'completed',        -- Job completed
    'cancelled',        -- Job cancelled
    'warranty'          -- Warranty work
);

-- Create estimate status enumeration
CREATE TYPE estimate_status AS ENUM (
    'draft',            -- Draft estimate, not yet sent
    'pending_review',   -- Pending internal review
    'sent',             -- Sent to customer
    'viewed',           -- Customer has viewed estimate
    'approved',         -- Customer approved estimate
    'rejected',         -- Customer rejected estimate
    'expired',          -- Estimate expired
    'revised'           -- Estimate needs revision
);

-- Jobs table (created from won leads)
CREATE TABLE jobs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    
    -- Job identification
    job_number VARCHAR(50) UNIQUE NOT NULL,
    
    -- Related records
    lead_id UUID REFERENCES leads(id), -- Original lead that created this job
    customer_contact_id UUID NOT NULL REFERENCES contacts(id),
    
    -- Job details
    title VARCHAR(255) NOT NULL,
    description TEXT,
    
    -- Business division and services
    division VARCHAR(50) NOT NULL,
    services TEXT[] DEFAULT '{}', -- Services being provided
    
    -- Status and workflow
    status job_status DEFAULT 'pending',
    
    -- Assignment
    project_manager UUID REFERENCES users(id),
    field_supervisor UUID REFERENCES users(id),
    sales_rep UUID REFERENCES users(id),
    
    -- Project details
    project_address VARCHAR(500) NOT NULL,
    project_city VARCHAR(100) NOT NULL,
    project_state VARCHAR(50) NOT NULL,
    project_zip_code VARCHAR(10) NOT NULL,
    
    -- Financial information
    contract_value DECIMAL(12,2) NOT NULL,
    cost_estimate DECIMAL(12,2),
    actual_cost DECIMAL(12,2),
    gross_margin DECIMAL(12,2) GENERATED ALWAYS AS (contract_value - COALESCE(actual_cost, cost_estimate)) STORED,
    
    -- Dates and timeline
    contract_date DATE NOT NULL,
    scheduled_start_date DATE,
    actual_start_date DATE,
    scheduled_completion_date DATE,
    actual_completion_date DATE,
    
    -- Progress tracking
    percent_complete INTEGER DEFAULT 0,
    milestone_status JSONB DEFAULT '{}'::jsonb, -- Track completion of various milestones
    
    -- Quality and safety
    safety_notes TEXT,
    quality_checklist JSONB DEFAULT '{}'::jsonb,
    customer_satisfaction_score INTEGER, -- 1-10 rating
    
    -- Weather and conditions
    weather_delays INTEGER DEFAULT 0, -- Days delayed due to weather
    weather_notes TEXT,
    
    -- Custom fields and tags
    tags TEXT[],
    custom_fields JSONB DEFAULT '{}'::jsonb,
    
    -- Notes
    notes TEXT,
    completion_notes TEXT,
    
    -- System fields
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT jobs_division_check CHECK (division IN ('Multi-family', 'Single-family', 'R&R')),
    CONSTRAINT jobs_contract_value_positive CHECK (contract_value > 0),
    CONSTRAINT jobs_percent_complete_range CHECK (percent_complete >= 0 AND percent_complete <= 100),
    CONSTRAINT jobs_satisfaction_score_range CHECK (customer_satisfaction_score IS NULL OR (customer_satisfaction_score >= 1 AND customer_satisfaction_score <= 10)),
    CONSTRAINT jobs_completion_logic CHECK (
        (status = 'completed' AND actual_completion_date IS NOT NULL AND percent_complete = 100) OR
        (status != 'completed')
    )
);

-- Estimates table
CREATE TABLE estimates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    
    -- Estimate identification
    estimate_number VARCHAR(50) UNIQUE NOT NULL,
    
    -- Related records
    lead_id UUID REFERENCES leads(id),
    job_id UUID REFERENCES jobs(id), -- If estimate becomes a job
    customer_contact_id UUID NOT NULL REFERENCES contacts(id),
    
    -- Estimate details
    title VARCHAR(255) NOT NULL,
    description TEXT,
    
    -- Business division and services
    division VARCHAR(50) NOT NULL,
    services TEXT[] DEFAULT '{}',
    
    -- Status
    status estimate_status DEFAULT 'draft',
    
    -- Assignment
    created_by_estimator UUID REFERENCES users(id),
    reviewed_by UUID REFERENCES users(id),
    
    -- Project details
    project_address VARCHAR(500) NOT NULL,
    project_city VARCHAR(100) NOT NULL,
    project_state VARCHAR(50) NOT NULL,
    project_zip_code VARCHAR(10) NOT NULL,
    
    -- Financial breakdown
    labor_cost DECIMAL(12,2) DEFAULT 0,
    material_cost DECIMAL(12,2) DEFAULT 0,
    equipment_cost DECIMAL(12,2) DEFAULT 0,
    subcontractor_cost DECIMAL(12,2) DEFAULT 0,
    overhead_percentage DECIMAL(5,2) DEFAULT 10.00, -- Overhead as percentage
    overhead_amount DECIMAL(12,2) GENERATED ALWAYS AS ((labor_cost + material_cost + equipment_cost + subcontractor_cost) * overhead_percentage / 100) STORED,
    profit_margin_percentage DECIMAL(5,2) DEFAULT 15.00, -- Profit margin as percentage
    
    -- Calculated totals
    subtotal DECIMAL(12,2) GENERATED ALWAYS AS (labor_cost + material_cost + equipment_cost + subcontractor_cost + overhead_amount) STORED,
    profit_amount DECIMAL(12,2) GENERATED ALWAYS AS (subtotal * profit_margin_percentage / 100) STORED,
    total_amount DECIMAL(12,2) GENERATED ALWAYS AS (subtotal + profit_amount) STORED,
    
    -- Timeline estimates
    estimated_duration_days INTEGER,
    estimated_start_date DATE,
    
    -- Terms and conditions
    payment_terms TEXT,
    warranty_terms TEXT,
    terms_and_conditions TEXT,
    
    -- Validity and expiration
    valid_until DATE,
    
    -- Customer interaction
    sent_date DATE,
    viewed_date DATE,
    customer_response_date DATE,
    customer_notes TEXT,
    
    -- Internal notes
    estimator_notes TEXT,
    revision_notes TEXT,
    
    -- System fields
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT estimates_division_check CHECK (division IN ('Multi-family', 'Single-family', 'R&R')),
    CONSTRAINT estimates_costs_non_negative CHECK (
        labor_cost >= 0 AND material_cost >= 0 AND 
        equipment_cost >= 0 AND subcontractor_cost >= 0
    ),
    CONSTRAINT estimates_percentages_valid CHECK (
        overhead_percentage >= 0 AND overhead_percentage <= 100 AND
        profit_margin_percentage >= 0 AND profit_margin_percentage <= 100
    )
);

-- Estimate line items for detailed breakdown
CREATE TABLE estimate_line_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    estimate_id UUID NOT NULL REFERENCES estimates(id) ON DELETE CASCADE,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    
    -- Line item details
    category VARCHAR(100) NOT NULL, -- labor, materials, equipment, subcontractor
    item_name VARCHAR(255) NOT NULL,
    description TEXT,
    
    -- Quantities and costs
    quantity DECIMAL(10,2) DEFAULT 1,
    unit VARCHAR(50) DEFAULT 'each', -- each, sf, lf, hours, etc.
    unit_cost DECIMAL(10,2) NOT NULL,
    total_cost DECIMAL(12,2) GENERATED ALWAYS AS (quantity * unit_cost) STORED,
    
    -- Metadata
    sort_order INTEGER DEFAULT 0,
    is_optional BOOLEAN DEFAULT false,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Job activities/timeline
CREATE TABLE job_activities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    
    -- Activity details
    activity_type VARCHAR(50) NOT NULL, -- status_change, progress_update, inspection, issue, etc.
    title VARCHAR(255) NOT NULL,
    description TEXT,
    
    -- Progress information
    percent_complete_before INTEGER,
    percent_complete_after INTEGER,
    
    -- Activity metadata
    performed_by UUID REFERENCES users(id),
    occurred_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Location and crew
    crew_members TEXT[], -- Array of crew member names/IDs
    equipment_used TEXT[],
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Job photos and attachments
CREATE TABLE job_attachments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    
    -- File details
    filename VARCHAR(255) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    file_size INTEGER,
    file_type VARCHAR(100),
    mime_type VARCHAR(100),
    
    -- Photo/attachment metadata
    title VARCHAR(255),
    description TEXT,
    category VARCHAR(50), -- progress_photo, before_photo, after_photo, document, invoice, etc.
    
    -- Location data (for photos)
    gps_coordinates POINT,
    photo_date TIMESTAMP WITH TIME ZONE,
    
    -- System fields
    uploaded_by UUID REFERENCES users(id),
    uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Functions to generate numbers
CREATE SEQUENCE job_number_seq;
CREATE SEQUENCE estimate_number_seq;

CREATE OR REPLACE FUNCTION generate_job_number()
RETURNS TEXT AS $$
DECLARE
    year_str TEXT;
    seq_num TEXT;
BEGIN
    year_str := EXTRACT(YEAR FROM CURRENT_DATE)::TEXT;
    seq_num := LPAD(nextval('job_number_seq')::TEXT, 4, '0');
    RETURN 'J-' || year_str || '-' || seq_num;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION generate_estimate_number()
RETURNS TEXT AS $$
DECLARE
    year_str TEXT;
    seq_num TEXT;
BEGIN
    year_str := EXTRACT(YEAR FROM CURRENT_DATE)::TEXT;
    seq_num := LPAD(nextval('estimate_number_seq')::TEXT, 4, '0');
    RETURN 'E-' || year_str || '-' || seq_num;
END;
$$ LANGUAGE plpgsql;

-- Set default numbers
ALTER TABLE jobs ALTER COLUMN job_number SET DEFAULT generate_job_number();
ALTER TABLE estimates ALTER COLUMN estimate_number SET DEFAULT generate_estimate_number();

-- Indexes for performance
CREATE INDEX idx_jobs_organization_id ON jobs(organization_id);
CREATE INDEX idx_jobs_job_number ON jobs(job_number);
CREATE INDEX idx_jobs_lead_id ON jobs(lead_id);
CREATE INDEX idx_jobs_customer_contact_id ON jobs(customer_contact_id);
CREATE INDEX idx_jobs_status ON jobs(status);
CREATE INDEX idx_jobs_project_manager ON jobs(project_manager);
CREATE INDEX idx_jobs_field_supervisor ON jobs(field_supervisor);
CREATE INDEX idx_jobs_division ON jobs(division);
CREATE INDEX idx_jobs_contract_date ON jobs(contract_date);
CREATE INDEX idx_jobs_scheduled_start_date ON jobs(scheduled_start_date);
CREATE INDEX idx_jobs_tags ON jobs USING GIN(tags);
CREATE INDEX idx_jobs_services ON jobs USING GIN(services);

CREATE INDEX idx_estimates_organization_id ON estimates(organization_id);
CREATE INDEX idx_estimates_estimate_number ON estimates(estimate_number);
CREATE INDEX idx_estimates_lead_id ON estimates(lead_id);
CREATE INDEX idx_estimates_customer_contact_id ON estimates(customer_contact_id);
CREATE INDEX idx_estimates_status ON estimates(status);
CREATE INDEX idx_estimates_created_by_estimator ON estimates(created_by_estimator);
CREATE INDEX idx_estimates_division ON estimates(division);
CREATE INDEX idx_estimates_created_at ON estimates(created_at);
CREATE INDEX idx_estimates_valid_until ON estimates(valid_until);

CREATE INDEX idx_estimate_line_items_estimate_id ON estimate_line_items(estimate_id);
CREATE INDEX idx_estimate_line_items_category ON estimate_line_items(category);
CREATE INDEX idx_estimate_line_items_sort_order ON estimate_line_items(sort_order);

CREATE INDEX idx_job_activities_job_id ON job_activities(job_id);
CREATE INDEX idx_job_activities_organization_id ON job_activities(organization_id);
CREATE INDEX idx_job_activities_activity_type ON job_activities(activity_type);
CREATE INDEX idx_job_activities_occurred_at ON job_activities(occurred_at);

CREATE INDEX idx_job_attachments_job_id ON job_attachments(job_id);
CREATE INDEX idx_job_attachments_category ON job_attachments(category);
CREATE INDEX idx_job_attachments_uploaded_at ON job_attachments(uploaded_at);

-- Enable Row Level Security
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE estimates ENABLE ROW LEVEL SECURITY;
ALTER TABLE estimate_line_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_attachments ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY jobs_tenant_isolation ON jobs
    USING (organization_id = (SELECT auth.jwt() ->> 'organization_id')::uuid);

CREATE POLICY estimates_tenant_isolation ON estimates
    USING (organization_id = (SELECT auth.jwt() ->> 'organization_id')::uuid);

CREATE POLICY estimate_line_items_tenant_isolation ON estimate_line_items
    USING (organization_id = (SELECT auth.jwt() ->> 'organization_id')::uuid);

CREATE POLICY job_activities_tenant_isolation ON job_activities
    USING (organization_id = (SELECT auth.jwt() ->> 'organization_id')::uuid);

CREATE POLICY job_attachments_tenant_isolation ON job_attachments
    USING (organization_id = (SELECT auth.jwt() ->> 'organization_id')::uuid);

-- Update triggers
CREATE TRIGGER update_jobs_updated_at
    BEFORE UPDATE ON jobs
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_estimates_updated_at
    BEFORE UPDATE ON estimates
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_estimate_line_items_updated_at
    BEFORE UPDATE ON estimate_line_items
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Function to log job status changes
CREATE OR REPLACE FUNCTION log_job_status_change()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD.status IS DISTINCT FROM NEW.status THEN
        INSERT INTO job_activities (
            job_id,
            organization_id,
            activity_type,
            title,
            description,
            performed_by
        ) VALUES (
            NEW.id,
            NEW.organization_id,
            'status_change',
            'Job status changed from ' || OLD.status || ' to ' || NEW.status,
            CASE 
                WHEN NEW.status = 'completed' THEN 'Job completed successfully'
                WHEN NEW.status = 'cancelled' THEN 'Job cancelled'
                ELSE NULL
            END,
            (SELECT auth.jwt() ->> 'user_id')::uuid
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER log_job_status_change_trigger
    AFTER UPDATE ON jobs
    FOR EACH ROW
    EXECUTE FUNCTION log_job_status_change();

-- Function to create job from approved estimate
CREATE OR REPLACE FUNCTION create_job_from_estimate(estimate_uuid UUID)
RETURNS UUID AS $$
DECLARE
    new_job_id UUID;
    est_record estimates%ROWTYPE;
BEGIN
    -- Get the estimate record
    SELECT * INTO est_record FROM estimates WHERE id = estimate_uuid;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Estimate not found: %', estimate_uuid;
    END IF;
    
    IF est_record.status != 'approved' THEN
        RAISE EXCEPTION 'Only approved estimates can be converted to jobs';
    END IF;
    
    -- Create the job
    INSERT INTO jobs (
        organization_id,
        lead_id,
        customer_contact_id,
        title,
        description,
        division,
        services,
        project_address,
        project_city,
        project_state,
        project_zip_code,
        contract_value,
        cost_estimate,
        contract_date,
        estimated_start_date,
        scheduled_completion_date,
        created_by
    ) VALUES (
        est_record.organization_id,
        est_record.lead_id,
        est_record.customer_contact_id,
        est_record.title,
        est_record.description,
        est_record.division,
        est_record.services,
        est_record.project_address,
        est_record.project_city,
        est_record.project_state,
        est_record.project_zip_code,
        est_record.total_amount,
        est_record.subtotal,
        CURRENT_DATE,
        est_record.estimated_start_date,
        CASE 
            WHEN est_record.estimated_start_date IS NOT NULL AND est_record.estimated_duration_days IS NOT NULL
            THEN est_record.estimated_start_date + INTERVAL '1 day' * est_record.estimated_duration_days
            ELSE NULL
        END,
        (SELECT auth.jwt() ->> 'user_id')::uuid
    ) RETURNING id INTO new_job_id;
    
    -- Update the estimate to reference the job
    UPDATE estimates SET job_id = new_job_id WHERE id = estimate_uuid;
    
    -- Update the original lead to won status
    IF est_record.lead_id IS NOT NULL THEN
        UPDATE leads SET status = 'won', close_date = CURRENT_DATE WHERE id = est_record.lead_id;
    END IF;
    
    RETURN new_job_id;
END;
$$ LANGUAGE plpgsql;

-- Comments for documentation
COMMENT ON TABLE jobs IS 'Job tracking with workflow support for exterior finishing projects';
COMMENT ON TABLE estimates IS 'Detailed estimates with financial breakdown and line items';
COMMENT ON TABLE estimate_line_items IS 'Detailed line items for estimates with quantities and costs';
COMMENT ON TABLE job_activities IS 'Timeline of all activities and progress updates for jobs';
COMMENT ON TABLE job_attachments IS 'Photos and documents attached to jobs with GPS and metadata';
COMMENT ON FUNCTION create_job_from_estimate IS 'Converts an approved estimate into a job and updates related records';