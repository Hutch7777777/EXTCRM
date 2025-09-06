-- =============================================
-- Rollback Script for Multi-Tenant CRM Database
-- =============================================
-- 
-- WARNING: This script will completely remove all CRM database objects
-- Use this only if you need to start fresh or fix a failed deployment
-- 
-- CAUTION: This will delete ALL data in the CRM tables
-- Make sure to backup any important data before running this script

-- =============================================
-- DROP TRIGGERS FIRST
-- =============================================

DROP TRIGGER IF EXISTS update_organizations_updated_at ON organizations;
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
DROP TRIGGER IF EXISTS update_contacts_updated_at ON contacts;
DROP TRIGGER IF EXISTS update_leads_updated_at ON leads;
DROP TRIGGER IF EXISTS update_jobs_updated_at ON jobs;
DROP TRIGGER IF EXISTS update_estimates_updated_at ON estimates;

-- =============================================
-- DROP FUNCTIONS
-- =============================================

DROP FUNCTION IF EXISTS update_updated_at_column();
DROP FUNCTION IF EXISTS get_next_job_number(UUID);
DROP FUNCTION IF EXISTS get_next_estimate_number(UUID);

-- =============================================
-- DROP TABLES (in reverse dependency order)
-- =============================================

-- Drop CRM tables first (they have foreign key dependencies)
DROP TABLE IF EXISTS file_attachments CASCADE;
DROP TABLE IF EXISTS communications CASCADE;
DROP TABLE IF EXISTS estimate_line_items CASCADE;
DROP TABLE IF EXISTS estimates CASCADE;
DROP TABLE IF EXISTS jobs CASCADE;
DROP TABLE IF EXISTS leads CASCADE;
DROP TABLE IF EXISTS contacts CASCADE;

-- Drop user-related tables
DROP TABLE IF EXISTS user_sessions CASCADE;
DROP TABLE IF EXISTS role_permissions CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Drop organizations (tenant root)
DROP TABLE IF EXISTS organizations CASCADE;

-- Drop reference tables (these are shared, be careful)
DROP TABLE IF EXISTS ref_materials CASCADE;
DROP TABLE IF EXISTS ref_states CASCADE;

-- =============================================
-- DROP CUSTOM TYPES
-- =============================================

DROP TYPE IF EXISTS communication_type CASCADE;
DROP TYPE IF EXISTS estimate_status CASCADE;
DROP TYPE IF EXISTS job_status CASCADE;
DROP TYPE IF EXISTS division CASCADE;
DROP TYPE IF EXISTS lead_status CASCADE;
DROP TYPE IF EXISTS lead_source CASCADE;
DROP TYPE IF EXISTS contact_type CASCADE;
DROP TYPE IF EXISTS organization_status CASCADE;
DROP TYPE IF EXISTS user_status CASCADE;
DROP TYPE IF EXISTS user_role CASCADE;

-- =============================================
-- CLEANUP COMMENTS
-- =============================================

-- Remove any database comments
COMMENT ON DATABASE current_database() IS NULL;

-- =============================================
-- VERIFICATION QUERIES
-- =============================================

-- Run these queries after the rollback to verify cleanup
-- Uncomment to use:

-- Check for remaining CRM tables
-- SELECT table_name 
-- FROM information_schema.tables 
-- WHERE table_schema = 'public' 
-- AND table_name IN (
--   'organizations', 'users', 'role_permissions', 'user_sessions',
--   'contacts', 'leads', 'jobs', 'estimates', 'estimate_line_items',
--   'communications', 'file_attachments', 'ref_states', 'ref_materials'
-- );

-- Check for remaining custom types
-- SELECT typname 
-- FROM pg_type 
-- WHERE typname IN (
--   'user_role', 'user_status', 'organization_status', 'contact_type',
--   'lead_source', 'lead_status', 'division', 'job_status', 
--   'estimate_status', 'communication_type'
-- );

-- Check for remaining functions
-- SELECT proname 
-- FROM pg_proc 
-- WHERE proname IN (
--   'update_updated_at_column', 'get_next_job_number', 'get_next_estimate_number'
-- );

-- =============================================
-- ROLLBACK COMPLETE
-- =============================================

-- If all verification queries return empty results,
-- the rollback was successful and you can redeploy the schema