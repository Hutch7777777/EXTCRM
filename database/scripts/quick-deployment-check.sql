-- =============================================
-- Quick Deployment Verification Queries
-- =============================================
-- 
-- Run these queries in Supabase SQL Editor after deployment
-- to quickly verify the database schema is correctly deployed

-- =============================================
-- 1. CHECK TABLE CREATION (Expected: 13+ tables)
-- =============================================

SELECT 
    'Table Count' as check_type,
    COUNT(*) as count,
    CASE 
        WHEN COUNT(*) >= 13 THEN '✅ PASS'
        ELSE '❌ FAIL - Expected 13+ tables'
    END as status
FROM information_schema.tables 
WHERE table_schema = 'public'
AND table_name IN (
    'organizations', 'users', 'role_permissions', 'user_sessions',
    'contacts', 'leads', 'jobs', 'estimates', 'estimate_line_items',
    'communications', 'file_attachments', 'ref_states', 'ref_materials'
);

-- =============================================
-- 2. CHECK CUSTOM TYPES (Expected: 10 types)
-- =============================================

SELECT 
    'Custom Types' as check_type,
    COUNT(*) as count,
    CASE 
        WHEN COUNT(*) >= 10 THEN '✅ PASS'
        ELSE '❌ FAIL - Expected 10+ custom types'
    END as status
FROM pg_type 
WHERE typname IN (
    'user_role', 'user_status', 'organization_status', 'contact_type',
    'lead_source', 'lead_status', 'division', 'job_status', 
    'estimate_status', 'communication_type'
);

-- =============================================
-- 3. CHECK RLS ENABLED (Expected: 11 tables)
-- =============================================

SELECT 
    'RLS Enabled Tables' as check_type,
    COUNT(*) as count,
    CASE 
        WHEN COUNT(*) >= 11 THEN '✅ PASS'
        ELSE '❌ FAIL - Expected 11+ tables with RLS'
    END as status
FROM pg_class 
WHERE relname IN (
    'organizations', 'users', 'role_permissions', 'user_sessions',
    'contacts', 'leads', 'jobs', 'estimates', 'estimate_line_items',
    'communications', 'file_attachments'
)
AND relrowsecurity = true;

-- =============================================
-- 4. CHECK CRITICAL INDEXES (Expected: 5+ indexes)
-- =============================================

SELECT 
    'Critical Indexes' as check_type,
    COUNT(*) as count,
    CASE 
        WHEN COUNT(*) >= 5 THEN '✅ PASS'
        ELSE '❌ FAIL - Expected 5+ critical indexes'
    END as status
FROM pg_indexes
WHERE indexname IN (
    'idx_users_organization_id',
    'idx_contacts_organization_id', 
    'idx_leads_organization_id',
    'idx_jobs_organization_id',
    'idx_estimates_organization_id'
);

-- =============================================
-- 5. CHECK FUNCTIONS (Expected: 3 functions)
-- =============================================

SELECT 
    'Business Functions' as check_type,
    COUNT(*) as count,
    CASE 
        WHEN COUNT(*) >= 3 THEN '✅ PASS'
        ELSE '❌ FAIL - Expected 3+ functions'
    END as status
FROM pg_proc 
WHERE proname IN (
    'update_updated_at_column', 
    'get_next_job_number', 
    'get_next_estimate_number'
);

-- =============================================
-- 6. CHECK REFERENCE DATA
-- =============================================

-- US States (Expected: 50 states)
SELECT 
    'US States Data' as check_type,
    COUNT(*) as count,
    CASE 
        WHEN COUNT(*) = 50 THEN '✅ PASS'
        ELSE '❌ FAIL - Expected 50 US states'
    END as status
FROM ref_states;

-- Materials (Expected: 10+ materials)
SELECT 
    'Materials Data' as check_type,
    COUNT(*) as count,
    CASE 
        WHEN COUNT(*) >= 10 THEN '✅ PASS'
        ELSE '❌ FAIL - Expected 10+ materials'
    END as status
FROM ref_materials;

-- Role Permissions (Expected: 30+ permissions)
SELECT 
    'Role Permissions' as check_type,
    COUNT(*) as count,
    CASE 
        WHEN COUNT(*) >= 30 THEN '✅ PASS'
        ELSE '❌ FAIL - Expected 30+ role permissions'
    END as status
FROM role_permissions;

-- =============================================
-- 7. CHECK MULTI-TENANT STRUCTURE
-- =============================================

-- Verify organization_id columns exist on multi-tenant tables
SELECT 
    'Multi-tenant Columns' as check_type,
    COUNT(*) as count,
    CASE 
        WHEN COUNT(*) >= 9 THEN '✅ PASS'
        ELSE '❌ FAIL - Expected 9+ tables with organization_id'
    END as status
FROM information_schema.columns
WHERE column_name = 'organization_id'
AND table_name IN (
    'users', 'contacts', 'leads', 'jobs', 'estimates', 
    'estimate_line_items', 'communications', 'file_attachments', 'user_sessions'
);

-- =============================================
-- 8. SAMPLE DATA STRUCTURE CHECK
-- =============================================

-- Show table schemas for manual verification
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name IN ('organizations', 'users', 'contacts', 'leads', 'jobs')
ORDER BY table_name, ordinal_position;

-- =============================================
-- 9. RLS POLICIES CHECK
-- =============================================

-- Count RLS policies (should be multiple policies per table)
SELECT 
    schemaname,
    tablename,
    COUNT(*) as policy_count
FROM pg_policies
WHERE schemaname = 'public'
GROUP BY schemaname, tablename
ORDER BY tablename;

-- =============================================
-- DEPLOYMENT STATUS SUMMARY
-- =============================================

-- Run this at the end for a final summary
SELECT 
    '🎯 DEPLOYMENT VERIFICATION COMPLETE' as message,
    'Run all queries above to see detailed results' as instructions,
    'All status should show ✅ PASS for successful deployment' as expected_result;

-- =============================================
-- TROUBLESHOOTING GUIDE
-- =============================================

-- If any checks fail:
-- 1. ❌ Table Count: Re-run the migration SQL
-- 2. ❌ Custom Types: Check for SQL syntax errors in type definitions
-- 3. ❌ RLS Tables: Verify RLS ENABLE statements executed
-- 4. ❌ Indexes: Check for constraint violations during index creation
-- 5. ❌ Functions: Look for PL/pgSQL syntax errors
-- 6. ❌ Reference Data: Check INSERT statements for constraint violations
-- 7. ❌ Multi-tenant Structure: Verify foreign key relationships