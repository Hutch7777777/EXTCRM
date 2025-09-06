# Database Deployment Guide

## Overview
This guide provides step-by-step instructions to deploy the multi-tenant CRM database schema to Supabase.

## Pre-Deployment Checklist
- [ ] Supabase project created and accessible
- [ ] Access to Supabase Dashboard SQL Editor
- [ ] Migration file available: `database/migrations/001_initial_schema.sql`

## Manual Deployment Steps

### Step 1: Access Supabase SQL Editor
1. Open your Supabase dashboard: https://sgabdchcqcusqdybdrel.supabase.co
2. Navigate to the **SQL Editor** in the left sidebar
3. Click **New Query** to create a new SQL script

### Step 2: Deploy the Schema
1. Open the migration file: `/Users/anthonyhutchinson/GitHub Repos/EXTCRM/database/migrations/001_initial_schema.sql`
2. Copy the entire contents of the migration file
3. Paste it into the Supabase SQL Editor
4. Click **Run** to execute the migration
5. Wait for completion (should take 10-30 seconds)

### Step 3: Verify Deployment Success
After deployment, you should see:
- **Success message** in the SQL Editor
- **19+ tables created** in the Table Editor
- **No error messages** in the output

## Expected Database Structure

### Core Tables (19 total)
1. `organizations` - Tenant isolation root table
2. `users` - User management extending Supabase auth
3. `role_permissions` - RBAC system configuration
4. `user_sessions` - Session tracking and analytics
5. `contacts` - Customer, prospect, vendor, crew management
6. `leads` - Potential project tracking
7. `jobs` - Active project management
8. `estimates` - Quotes and proposals
9. `estimate_line_items` - Detailed estimate breakdown
10. `communications` - Email, calls, meetings, notes
11. `file_attachments` - File storage references
12. `ref_states` - US states reference data
13. `ref_materials` - Material catalog reference

### Custom Types Created
- `user_role` - 6 role types for RBAC
- `user_status` - User activation states
- `organization_status` - Tenant subscription states
- `contact_type` - Contact categorization
- `lead_source` - Lead origin tracking
- `lead_status` - Sales pipeline stages
- `division` - Business divisions (multi-family, single-family, R&R)
- `job_status` - Project lifecycle stages
- `estimate_status` - Quote lifecycle stages
- `communication_type` - Communication method types

### RLS Policies Created
- **11 tables** with Row Level Security enabled
- **Organization-scoped policies** for multi-tenant isolation
- **Role-based policies** for user access control
- **Admin policies** for management functions

### Indexes Created
- **Multi-tenant isolation indexes** on all organization_id columns
- **Business logic indexes** for status, assignments, and lookups
- **Performance indexes** for common query patterns
- **Time-based indexes** for reporting queries

### Functions Created
- `update_updated_at_column()` - Audit trail trigger function
- `get_next_job_number()` - Auto-generate job numbers
- `get_next_estimate_number()` - Auto-generate estimate numbers

### Triggers Created
- **Updated_at triggers** on 6 core tables for audit trails

### Reference Data Seeded
- **50 US states** in ref_states
- **10 material items** in ref_materials with categories
- **30+ role permissions** for complete RBAC setup

## Post-Deployment Verification

After deployment, run the verification script:

```bash
# From project root
node database/scripts/verify-deployment.js
```

This will test:
- Table creation and structure
- RLS policy enforcement
- Multi-tenant isolation
- Function availability
- Reference data integrity

## Troubleshooting

### Common Issues

**Error: Extension "uuid-ossp" not available**
- Solution: Supabase should have this enabled by default. If not, contact Supabase support.

**Error: Permission denied**
- Solution: Ensure you're using the service role key, not the anon key.

**Error: Relation already exists**
- Solution: The schema has already been deployed. Check verification script instead.

**RLS Policies Not Working**
- Verify that `auth.uid()` returns a valid UUID when authenticated
- Check that users have proper organization_id relationships

## Rollback Procedure

If deployment fails or needs to be reversed:

1. **Backup existing data** (if any):
   ```sql
   -- Export any existing data before rollback
   ```

2. **Drop all created objects**:
   ```sql
   -- Run the rollback script
   -- See database/scripts/rollback.sql
   ```

3. **Clean slate restart**:
   - Delete all custom tables from Supabase dashboard
   - Re-run deployment from Step 1

## Next Steps

After successful deployment:
1. Run verification script to confirm everything works
2. Set up application environment variables
3. Test authentication flow with Supabase Auth
4. Begin application development with confidence in the database foundation

## Support

If you encounter issues:
1. Check the verification script output for specific problems
2. Review Supabase logs for detailed error messages
3. Consult the troubleshooting section above
4. Refer to Supabase documentation for platform-specific issues