# Database Setup Instructions

## Quick Setup for Supabase

### 1. Prerequisites
- Supabase project created
- Database access (SQL Editor or direct connection)
- Admin privileges on the database

### 2. Migration Execution

#### Option A: Supabase SQL Editor (Recommended)
1. Open your Supabase project dashboard
2. Navigate to the SQL Editor
3. Execute migrations in order:

```sql
-- Copy and paste each migration file content in order:
-- 1. 001_create_organizations.sql
-- 2. 002_create_users_and_roles.sql
-- 3. 003_create_contacts.sql
-- 4. 004_create_leads.sql
-- 5. 005_create_jobs_and_estimates.sql
-- 6. 006_create_support_tables.sql
```

#### Option B: Command Line (psql)
```bash
# Connect to your Supabase database
psql "postgresql://postgres:[PASSWORD]@[HOST]:5432/postgres"

# Run migrations in order
\i database/migrations/001_create_organizations.sql
\i database/migrations/002_create_users_and_roles.sql
\i database/migrations/003_create_contacts.sql
\i database/migrations/004_create_leads.sql
\i database/migrations/005_create_jobs_and_estimates.sql
\i database/migrations/006_create_support_tables.sql
```

### 3. Verify Installation

After running all migrations, verify the setup:

```sql
-- Check that all tables were created
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_type = 'BASE TABLE'
ORDER BY table_name;

-- Check RLS is enabled on core tables
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND rowsecurity = true;

-- Check that role permissions were inserted
SELECT role, resource, action, COUNT(*) 
FROM role_permissions 
GROUP BY role, resource, action 
ORDER BY role, resource, action;
```

### 4. Create Your First Organization

```sql
-- Insert a test organization
INSERT INTO organizations (
    name, 
    slug, 
    description, 
    primary_email,
    business_divisions,
    services_offered
) VALUES (
    'Exterior Finishes LLC',
    'exterior-finishes',
    'Premier exterior finishing contractor',
    'admin@exteriorfinishes.com',
    '["Multi-family", "Single-family", "R&R"]'::jsonb,
    '["siding", "windows", "painting", "gutters", "framing", "decking"]'::jsonb
);

-- Get the organization ID for reference
SELECT id, name, slug FROM organizations WHERE slug = 'exterior-finishes';
```

### 5. Create Your First User

```sql
-- First, create the user in Supabase Auth (via dashboard or API)
-- Then link it to your users table:

INSERT INTO users (
    id, -- This should match the Supabase auth.users.id
    organization_id, -- Use the organization ID from step 4
    email,
    first_name,
    last_name,
    role,
    status,
    is_admin
) VALUES (
    '00000000-0000-0000-0000-000000000000', -- Replace with actual auth user ID
    '00000000-0000-0000-0000-000000000000', -- Replace with organization ID
    'admin@exteriorfinishes.com',
    'John',
    'Doe',
    'owner',
    'active',
    true
);
```

## Advanced Configuration

### Custom Organization Settings

```sql
-- Update organization settings for your specific needs
UPDATE organization_settings 
SET 
    default_overhead_percentage = 12.00,
    default_profit_margin_percentage = 18.00,
    estimate_validity_days = 45,
    job_number_prefix = 'EF',
    business_hours = '{
        "monday": {"start": "07:00", "end": "18:00", "is_working_day": true},
        "tuesday": {"start": "07:00", "end": "18:00", "is_working_day": true},
        "wednesday": {"start": "07:00", "end": "18:00", "is_working_day": true},
        "thursday": {"start": "07:00", "end": "18:00", "is_working_day": true},
        "friday": {"start": "07:00", "end": "18:00", "is_working_day": true},
        "saturday": {"start": "08:00", "end": "16:00", "is_working_day": true},
        "sunday": {"start": "09:00", "end": "15:00", "is_working_day": false}
    }'::jsonb
WHERE organization_id = 'YOUR_ORGANIZATION_ID';
```

### Sample Data Creation

```sql
-- Create a sample customer contact
INSERT INTO contacts (
    organization_id,
    first_name,
    last_name,
    company_name,
    type,
    primary_email,
    primary_phone,
    street_address,
    city,
    state,
    zip_code,
    created_by
) VALUES (
    'YOUR_ORGANIZATION_ID',
    'Jane',
    'Smith',
    'Smith Residential',
    'customer',
    'jane@smithresidential.com',
    '(555) 123-4567',
    '123 Main Street',
    'Anytown',
    'NY',
    '12345',
    'YOUR_USER_ID'
);

-- Create a sample lead
INSERT INTO leads (
    organization_id,
    customer_contact_id,
    title,
    description,
    division,
    services_requested,
    project_address,
    project_city,
    project_state,
    project_zip_code,
    estimated_value,
    assigned_to,
    created_by
) VALUES (
    'YOUR_ORGANIZATION_ID',
    'CUSTOMER_CONTACT_ID_FROM_ABOVE',
    'Siding Replacement - Smith Residence',
    'Complete siding replacement for two-story colonial home',
    'Single-family',
    ARRAY['siding', 'windows'],
    '123 Main Street',
    'Anytown',
    'NY',
    '12345',
    25000.00,
    'YOUR_USER_ID',
    'YOUR_USER_ID'
);
```

## Supabase-Specific Configuration

### 1. Enable Required Extensions
Make sure these extensions are enabled in your Supabase project:
- `uuid-ossp` (for UUID generation)
- `pgcrypto` (for encryption functions)

### 2. Authentication Integration
Configure your Supabase Auth to work with the users table:

```sql
-- Create a function to handle new user signups
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    -- You'll customize this based on how you want to handle new signups
    -- For now, new users will need to be manually assigned to organizations
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to handle new auth users (customize as needed)
-- CREATE TRIGGER on_auth_user_created
--     AFTER INSERT ON auth.users
--     FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

### 3. Storage Bucket Setup
Create storage buckets for file uploads:

1. Go to Storage in your Supabase dashboard
2. Create buckets:
   - `crm-files` (for general files)
   - `job-photos` (for job site photos)
   - `estimates` (for estimate documents)

### 4. API Permissions
Set up your Supabase API permissions to work with the RLS policies.

## Troubleshooting

### Common Issues

1. **RLS Policy Errors**: Make sure your JWT contains the `organization_id` claim
2. **Foreign Key Violations**: Ensure you create organizations before users
3. **Permission Denied**: Check that RLS policies are correctly configured
4. **Migration Fails**: Run migrations in the exact order specified

### Checking Migration Status

```sql
-- See which migrations have been applied
SELECT * FROM schema_migrations ORDER BY applied_at;

-- Count tables created
SELECT COUNT(*) as table_count 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_type = 'BASE TABLE';
```

### Reset Database (Development Only)

```sql
-- WARNING: This will delete all data!
-- Only use in development environments

DROP SCHEMA public CASCADE;
CREATE SCHEMA public;
GRANT ALL ON SCHEMA public TO postgres;
GRANT ALL ON SCHEMA public TO public;

-- Then re-run all migrations
```

## Next Steps

After successful database setup:

1. **Configure Supabase Auth**: Set up authentication flows
2. **Set up Storage**: Configure file upload buckets and policies
3. **API Testing**: Test your API endpoints with the new schema
4. **Frontend Integration**: Connect your Next.js application
5. **Data Migration**: Import existing data if migrating from another system

## Security Checklist

- [ ] RLS enabled on all multi-tenant tables
- [ ] JWT contains organization_id claim
- [ ] Storage buckets have appropriate policies
- [ ] API keys are properly secured
- [ ] Database connection uses SSL
- [ ] Backup strategy is configured

## Support

For issues with this database schema:
1. Check the SCHEMA_DESIGN.md documentation
2. Verify migration files ran successfully
3. Test with sample data queries
4. Check Supabase logs for detailed error messages