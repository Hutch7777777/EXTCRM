# Manual Database Deployment Instructions

Since automated deployment requires special RPC functions, please deploy the database migrations manually:

## 🔗 Supabase SQL Editor
**URL**: https://supabase.com/dashboard/project/sgabdchcqcusqdybdrel/sql

## 📋 Migration Files to Execute (in order)

### 1. First Migration: `001_initial_schema.sql`
- This should already be deployed
- Contains the basic CRM tables (organizations, users, contacts, etc.)

### 2. Authentication Bridge: `002_auth_bridge_system.sql` 
**File Location**: `/Users/anthonyhutchinson/GitHub Repos/EXTCRM/database/migrations/002_auth_bridge_system.sql`

Copy the entire content of this file and paste it into the Supabase SQL Editor, then click "Run".

## 🎯 Verification Steps

After running the migrations, verify they worked by running these queries in the SQL Editor:

```sql
-- Check if new tables exist
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('user_invitations', 'organization_registrations', 'user_sessions');

-- Check if new functions exist  
SELECT routine_name FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name IN ('create_organization_registration', 'invite_user_to_organization', 'get_user_org_info');

-- Check if triggers are created
SELECT trigger_name FROM information_schema.triggers 
WHERE event_object_table IN ('organizations', 'users');
```

Expected results:
- 3 new tables: `user_invitations`, `organization_registrations`, `user_sessions`  
- 5+ new functions including the main auth bridge functions
- Triggers for automatic user creation

## 🚀 After Deployment

1. **Test the API endpoints**: `npm run dev`
2. **Try the signup flow**: Visit http://localhost:3000/signup
3. **Check for TypeScript errors**: `npm run type-check`
4. **Run the build**: `npm run build`

## 🆘 If You Encounter Errors

- **Permission denied**: Make sure you're using the service role key
- **Function already exists**: Some functions may already exist, that's OK
- **Table already exists**: That's normal if you've run migrations before
- **Syntax errors**: Double-check you copied the entire SQL file content

The authentication bridge system will be fully functional once these migrations are deployed!