-- Remove the problematic auth trigger that's causing signup failures
-- This trigger was expecting organization_registrations records that don't exist during signup

-- Drop the trigger that fires on new auth user creation
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Drop the function that was causing the issue (we'll use our API-based approach instead)
DROP FUNCTION IF EXISTS handle_new_user();

-- Keep our manual create_organization_registration function for API use
-- (No changes needed to that function)

-- Add a comment explaining the change
COMMENT ON FUNCTION create_organization_registration(UUID, VARCHAR, VARCHAR, VARCHAR, JSONB) IS 
'Creates organization and user profile via API call after successful auth signup. Replaces the problematic trigger-based approach.';

-- This migration removes the automatic trigger-based user creation that was failing
-- and keeps the manual API-based approach that gives us better control over the flow.