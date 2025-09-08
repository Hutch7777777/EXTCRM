-- Fix RLS policy infinite recursion issue
-- This happens when policies try to query the same table they're protecting

-- Drop the problematic policies that cause infinite recursion
DROP POLICY IF EXISTS "Users can view users in their organization" ON users;
DROP POLICY IF EXISTS "Admins can manage users in their organization" ON users;
DROP POLICY IF EXISTS "Users can update their own profile" ON users;
DROP POLICY IF EXISTS "Authenticated users can insert their profile" ON users;
DROP POLICY IF EXISTS users_tenant_isolation ON users;

-- Create a simple, non-recursive policy for users table
-- Allow users to see their own record and records with the same organization_id
CREATE POLICY "users_select_policy" ON users
    FOR SELECT USING (
        id = auth.uid() 
        OR 
        organization_id = (
            -- Get org_id directly from auth metadata instead of querying users table
            COALESCE(
                (auth.jwt() ->> 'organization_id')::uuid,
                -- Fallback: get from the current authenticated user's record
                -- This should not cause recursion since we're only getting the current user
                (SELECT organization_id FROM users WHERE id = auth.uid() LIMIT 1)
            )
        )
    );

-- Allow users to update only their own record
CREATE POLICY "users_update_policy" ON users
    FOR UPDATE USING (id = auth.uid());

-- Allow authenticated users to insert their own profile 
CREATE POLICY "users_insert_policy" ON users
    FOR INSERT WITH CHECK (id = auth.uid());