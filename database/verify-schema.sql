
-- Schema Verification Queries
-- Run these after deployment to verify the schema was created correctly

-- Check if core tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('organizations', 'users', 'contacts', 'leads', 'jobs', 'estimates')
ORDER BY table_name;

-- Check if enums were created
SELECT typname 
FROM pg_type 
WHERE typname IN ('user_role', 'user_status', 'organization_status', 'contact_type', 'lead_status', 'job_status', 'estimate_status')
ORDER BY typname;

-- Check row level security is enabled
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('organizations', 'users', 'contacts', 'leads', 'jobs', 'estimates')
AND rowsecurity = true;

-- Check if indexes were created
SELECT indexname, tablename 
FROM pg_indexes 
WHERE schemaname = 'public' 
AND indexname LIKE 'idx_%'
ORDER BY tablename, indexname;

-- Check if functions were created
SELECT routine_name 
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name IN ('get_next_job_number', 'get_next_estimate_number', 'update_updated_at_column');

-- Sample data check - these should return data if seed data was loaded
SELECT COUNT(*) as states_count FROM ref_states;
SELECT COUNT(*) as materials_count FROM ref_materials;
SELECT COUNT(*) as permissions_count FROM role_permissions;
