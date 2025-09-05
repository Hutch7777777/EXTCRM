-- =============================================
-- Migration: 006_create_support_tables.sql
-- Description: Create supporting tables for system configuration and audit
-- Author: CRM Database Architect Agent
-- Date: 2025-09-05
-- =============================================

-- System audit log for tracking changes
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    
    -- What was changed
    table_name VARCHAR(100) NOT NULL,
    record_id UUID NOT NULL,
    action VARCHAR(20) NOT NULL, -- INSERT, UPDATE, DELETE
    
    -- Who made the change
    user_id UUID REFERENCES users(id),
    user_email VARCHAR(255),
    
    -- When and where
    occurred_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    ip_address INET,
    user_agent TEXT,
    
    -- What changed
    old_values JSONB,
    new_values JSONB,
    changed_fields TEXT[], -- Array of field names that changed
    
    -- Context
    context VARCHAR(100), -- web, mobile, api, system
    session_id VARCHAR(255),
    
    CONSTRAINT audit_logs_action_check CHECK (action IN ('INSERT', 'UPDATE', 'DELETE'))
);

-- System notifications
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    
    -- Target user
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Notification details
    title VARCHAR(255) NOT NULL,
    message TEXT,
    type VARCHAR(50) NOT NULL, -- lead_assigned, job_update, estimate_approved, etc.
    
    -- Related records
    related_table VARCHAR(100),
    related_id UUID,
    
    -- Status
    is_read BOOLEAN DEFAULT false,
    read_at TIMESTAMP WITH TIME ZONE,
    
    -- Delivery
    delivery_method VARCHAR(50) DEFAULT 'in_app', -- in_app, email, sms, push
    delivered_at TIMESTAMP WITH TIME ZONE,
    delivery_status VARCHAR(20) DEFAULT 'pending', -- pending, delivered, failed
    
    -- Metadata
    metadata JSONB DEFAULT '{}'::jsonb,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE,
    
    CONSTRAINT notifications_delivery_status_check CHECK (delivery_status IN ('pending', 'delivered', 'failed'))
);

-- System settings per organization
CREATE TABLE organization_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    
    -- Business settings
    business_hours JSONB DEFAULT '{
        "monday": {"start": "08:00", "end": "17:00", "is_working_day": true},
        "tuesday": {"start": "08:00", "end": "17:00", "is_working_day": true},
        "wednesday": {"start": "08:00", "end": "17:00", "is_working_day": true},
        "thursday": {"start": "08:00", "end": "17:00", "is_working_day": true},
        "friday": {"start": "08:00", "end": "17:00", "is_working_day": true},
        "saturday": {"start": "09:00", "end": "15:00", "is_working_day": false},
        "sunday": {"start": "09:00", "end": "15:00", "is_working_day": false}
    }'::jsonb,
    
    -- Estimating settings
    default_overhead_percentage DECIMAL(5,2) DEFAULT 10.00,
    default_profit_margin_percentage DECIMAL(5,2) DEFAULT 15.00,
    estimate_validity_days INTEGER DEFAULT 30,
    
    -- Lead settings
    lead_auto_assignment BOOLEAN DEFAULT false,
    lead_follow_up_days INTEGER DEFAULT 3,
    lead_expiry_days INTEGER DEFAULT 90,
    
    -- Job settings
    job_number_prefix VARCHAR(10) DEFAULT 'J',
    estimate_number_prefix VARCHAR(10) DEFAULT 'E',
    lead_number_prefix VARCHAR(10) DEFAULT 'L',
    
    -- Notification settings
    email_notifications_enabled BOOLEAN DEFAULT true,
    daily_digest_enabled BOOLEAN DEFAULT true,
    weekly_report_enabled BOOLEAN DEFAULT true,
    
    -- Integration settings
    outlook_integration_enabled BOOLEAN DEFAULT false,
    quickbooks_integration_enabled BOOLEAN DEFAULT false,
    
    -- Custom settings (flexible JSON)
    custom_settings JSONB DEFAULT '{}'::jsonb,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Ensure one settings record per organization
    UNIQUE(organization_id)
);

-- Document templates (for estimates, contracts, etc.)
CREATE TABLE document_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    
    -- Template details
    name VARCHAR(255) NOT NULL,
    description TEXT,
    type VARCHAR(50) NOT NULL, -- estimate, contract, proposal, invoice, etc.
    
    -- Template content
    template_content TEXT NOT NULL, -- HTML or markdown template
    css_styles TEXT, -- Custom CSS for PDF generation
    
    -- Settings
    is_default BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    
    -- Metadata
    variables_required TEXT[], -- Array of required template variables
    paper_size VARCHAR(20) DEFAULT 'letter', -- letter, a4, legal
    orientation VARCHAR(20) DEFAULT 'portrait', -- portrait, landscape
    
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- File storage tracking (for Supabase storage integration)
CREATE TABLE file_storage (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    
    -- File details
    filename VARCHAR(255) NOT NULL,
    original_filename VARCHAR(255) NOT NULL,
    file_path VARCHAR(500) NOT NULL, -- Path in Supabase storage
    bucket_name VARCHAR(100) NOT NULL DEFAULT 'crm-files',
    
    -- File metadata
    file_size INTEGER NOT NULL,
    mime_type VARCHAR(100),
    file_extension VARCHAR(10),
    
    -- Categorization
    category VARCHAR(50), -- estimate, job_photo, document, etc.
    tags TEXT[],
    
    -- Related records
    related_table VARCHAR(100), -- Which table this file belongs to
    related_id UUID, -- ID of the related record
    
    -- Access control
    is_public BOOLEAN DEFAULT false,
    uploaded_by UUID REFERENCES users(id),
    
    -- System fields
    uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_accessed_at TIMESTAMP WITH TIME ZONE,
    access_count INTEGER DEFAULT 0,
    
    -- Cleanup
    is_deleted BOOLEAN DEFAULT false,
    deleted_at TIMESTAMP WITH TIME ZONE,
    deleted_by UUID REFERENCES users(id)
);

-- Weather data cache (for tracking weather delays)
CREATE TABLE weather_data (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Location
    city VARCHAR(100) NOT NULL,
    state VARCHAR(50) NOT NULL,
    zip_code VARCHAR(10),
    coordinates POINT,
    
    -- Date
    weather_date DATE NOT NULL,
    
    -- Weather conditions
    temperature_high INTEGER,
    temperature_low INTEGER,
    precipitation_inches DECIMAL(5,2) DEFAULT 0,
    wind_speed_mph INTEGER,
    conditions VARCHAR(100), -- sunny, rainy, snowy, etc.
    
    -- Work suitability
    suitable_for_exterior_work BOOLEAN,
    work_impact_score INTEGER, -- 1-10, 10 being perfect conditions
    
    -- Data source
    data_source VARCHAR(50) DEFAULT 'weather_api',
    retrieved_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    UNIQUE(city, state, weather_date),
    CONSTRAINT weather_work_impact_score_range CHECK (work_impact_score IS NULL OR (work_impact_score >= 1 AND work_impact_score <= 10))
);

-- Indexes for performance
CREATE INDEX idx_audit_logs_organization_id ON audit_logs(organization_id);
CREATE INDEX idx_audit_logs_table_record ON audit_logs(table_name, record_id);
CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_occurred_at ON audit_logs(occurred_at);

CREATE INDEX idx_notifications_organization_id ON notifications(organization_id);
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_is_read ON notifications(is_read);
CREATE INDEX idx_notifications_type ON notifications(type);
CREATE INDEX idx_notifications_created_at ON notifications(created_at);

CREATE INDEX idx_organization_settings_organization_id ON organization_settings(organization_id);

CREATE INDEX idx_document_templates_organization_id ON document_templates(organization_id);
CREATE INDEX idx_document_templates_type ON document_templates(type);
CREATE INDEX idx_document_templates_is_active ON document_templates(is_active);

CREATE INDEX idx_file_storage_organization_id ON file_storage(organization_id);
CREATE INDEX idx_file_storage_related ON file_storage(related_table, related_id);
CREATE INDEX idx_file_storage_category ON file_storage(category);
CREATE INDEX idx_file_storage_uploaded_at ON file_storage(uploaded_at);
CREATE INDEX idx_file_storage_tags ON file_storage USING GIN(tags);

CREATE INDEX idx_weather_data_location_date ON weather_data(city, state, weather_date);
CREATE INDEX idx_weather_data_date ON weather_data(weather_date);
CREATE INDEX idx_weather_data_zip_code ON weather_data(zip_code);

-- Enable Row Level Security
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE file_storage ENABLE ROW LEVEL SECURITY;
-- Weather data is global, no RLS needed

-- RLS Policies
CREATE POLICY audit_logs_tenant_isolation ON audit_logs
    USING (organization_id = (SELECT auth.jwt() ->> 'organization_id')::uuid);

CREATE POLICY notifications_tenant_isolation ON notifications
    USING (organization_id = (SELECT auth.jwt() ->> 'organization_id')::uuid);

CREATE POLICY organization_settings_tenant_isolation ON organization_settings
    USING (organization_id = (SELECT auth.jwt() ->> 'organization_id')::uuid);

CREATE POLICY document_templates_tenant_isolation ON document_templates
    USING (organization_id = (SELECT auth.jwt() ->> 'organization_id')::uuid);

CREATE POLICY file_storage_tenant_isolation ON file_storage
    USING (organization_id = (SELECT auth.jwt() ->> 'organization_id')::uuid);

-- Update triggers
CREATE TRIGGER update_organization_settings_updated_at
    BEFORE UPDATE ON organization_settings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_document_templates_updated_at
    BEFORE UPDATE ON document_templates
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Function to create default organization settings
CREATE OR REPLACE FUNCTION create_default_organization_settings()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO organization_settings (organization_id)
    VALUES (NEW.id);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to create default settings when organization is created
CREATE TRIGGER create_default_organization_settings_trigger
    AFTER INSERT ON organizations
    FOR EACH ROW
    EXECUTE FUNCTION create_default_organization_settings();

-- Function to clean up old notifications
CREATE OR REPLACE FUNCTION cleanup_old_notifications()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM notifications 
    WHERE (expires_at IS NOT NULL AND expires_at < NOW()) 
       OR (expires_at IS NULL AND created_at < NOW() - INTERVAL '90 days');
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Function to mark notification as read
CREATE OR REPLACE FUNCTION mark_notification_read(notification_id UUID, user_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
    UPDATE notifications 
    SET is_read = true, read_at = NOW()
    WHERE id = notification_id 
    AND user_id = user_uuid 
    AND organization_id = (SELECT auth.jwt() ->> 'organization_id')::uuid;
    
    RETURN FOUND;
END;
$$ LANGUAGE plpgsql;

-- Comments for documentation
COMMENT ON TABLE audit_logs IS 'Comprehensive audit trail for all system changes';
COMMENT ON TABLE notifications IS 'System notifications for users with delivery tracking';
COMMENT ON TABLE organization_settings IS 'Organization-specific configuration and preferences';
COMMENT ON TABLE document_templates IS 'Custom document templates for estimates, contracts, etc.';
COMMENT ON TABLE file_storage IS 'File storage tracking and metadata for Supabase integration';
COMMENT ON TABLE weather_data IS 'Weather data cache for tracking weather-related job delays';