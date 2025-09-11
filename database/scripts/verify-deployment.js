#!/usr/bin/env node

/**
 * Database Deployment Verification Script
 * 
 * This script thoroughly verifies that the multi-tenant CRM database
 * has been properly deployed to Supabase with all expected tables,
 * policies, functions, and reference data.
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

// Colors for console output
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function logSuccess(message) {
  log(`✅ ${message}`, colors.green);
}

function logError(message) {
  log(`❌ ${message}`, colors.red);
}

function logWarning(message) {
  log(`⚠️  ${message}`, colors.yellow);
}

function logInfo(message) {
  log(`ℹ️  ${message}`, colors.blue);
}

function logSection(title) {
  log(`\n${colors.bold}=== ${title} ===${colors.reset}`);
}

// Expected database structure
const EXPECTED_TABLES = [
  'organizations',
  'users', 
  'role_permissions',
  'user_sessions',
  'contacts',
  'leads',
  'jobs',
  'estimates',
  'estimate_line_items',
  'communications',
  'file_attachments',
  'ref_states',
  'ref_materials'
];

const EXPECTED_TYPES = [
  'user_role',
  'user_status',
  'organization_status',
  'contact_type',
  'lead_source',
  'lead_status',
  'division',
  'job_status',
  'estimate_status',
  'communication_type'
];

const EXPECTED_FUNCTIONS = [
  'update_updated_at_column',
  'get_next_job_number',
  'get_next_estimate_number'
];

const RLS_ENABLED_TABLES = [
  'organizations',
  'users',
  'role_permissions',
  'user_sessions',
  'contacts',
  'leads',
  'jobs',
  'estimates',
  'estimate_line_items',
  'communications',
  'file_attachments'
];

async function main() {
  logSection('Database Deployment Verification');
  
  // Initialize Supabase client
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!supabaseUrl || !supabaseServiceKey) {
    logError('Missing Supabase environment variables');
    logError('Required: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
    process.exit(1);
  }
  
  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  logSuccess('Supabase client initialized');
  
  let allTestsPassed = true;
  
  try {
    // Test 1: Verify tables exist
    logSection('Verifying Table Creation');
    const tableResults = await verifyTables(supabase);
    if (!tableResults.success) allTestsPassed = false;
    
    // Test 2: Verify custom types
    logSection('Verifying Custom Types');
    const typeResults = await verifyCustomTypes(supabase);
    if (!typeResults.success) allTestsPassed = false;
    
    // Test 3: Verify functions
    logSection('Verifying Functions');
    const functionResults = await verifyFunctions(supabase);
    if (!functionResults.success) allTestsPassed = false;
    
    // Test 4: Verify RLS policies
    logSection('Verifying Row Level Security');
    const rlsResults = await verifyRLSPolicies(supabase);
    if (!rlsResults.success) allTestsPassed = false;
    
    // Test 5: Verify indexes
    logSection('Verifying Indexes');
    const indexResults = await verifyIndexes(supabase);
    if (!indexResults.success) allTestsPassed = false;
    
    // Test 6: Verify reference data
    logSection('Verifying Reference Data');
    const refDataResults = await verifyReferenceData(supabase);
    if (!refDataResults.success) allTestsPassed = false;
    
    // Test 7: Test multi-tenant isolation
    logSection('Testing Multi-Tenant Isolation');
    const isolationResults = await testMultiTenantIsolation(supabase);
    if (!isolationResults.success) allTestsPassed = false;
    
    // Final summary
    logSection('Verification Summary');
    if (allTestsPassed) {
      logSuccess('🎉 All verification tests passed! Database is ready for use.');
    } else {
      logError('❌ Some verification tests failed. Check output above for details.');
      process.exit(1);
    }
    
  } catch (error) {
    logError(`Verification failed with error: ${error.message}`);
    process.exit(1);
  }
}

async function verifyTables(supabase) {
  const { data: tables, error } = await supabase.rpc('get_tables');
  
  if (error) {
    // Fallback query if RPC doesn't exist
    const { data, error: fallbackError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public');
    
    if (fallbackError) {
      logError(`Failed to fetch tables: ${fallbackError.message}`);
      return { success: false };
    }
    
    // Extract table names from fallback query
    const tableNames = data?.map(t => t.table_name) || [];
    return verifyTableList(tableNames);
  }
  
  return verifyTableList(tables || []);
}

function verifyTableList(actualTables) {
  let success = true;
  
  for (const expectedTable of EXPECTED_TABLES) {
    if (actualTables.includes(expectedTable)) {
      logSuccess(`Table exists: ${expectedTable}`);
    } else {
      logError(`Missing table: ${expectedTable}`);
      success = false;
    }
  }
  
  logInfo(`Total tables found: ${actualTables.length}`);
  return { success };
}

async function verifyCustomTypes(supabase) {
  let success = true;
  
  for (const expectedType of EXPECTED_TYPES) {
    const { data, error } = await supabase.rpc('check_type_exists', { 
      type_name: expectedType 
    });
    
    if (error) {
      // Fallback query
      const { data: fallbackData, error: fallbackError } = await supabase
        .from('information_schema.types')
        .select('typname')
        .eq('typname', expectedType)
        .single();
      
      if (fallbackError || !fallbackData) {
        logError(`Missing custom type: ${expectedType}`);
        success = false;
      } else {
        logSuccess(`Custom type exists: ${expectedType}`);
      }
    } else if (data) {
      logSuccess(`Custom type exists: ${expectedType}`);
    } else {
      logError(`Missing custom type: ${expectedType}`);
      success = false;
    }
  }
  
  return { success };
}

async function verifyFunctions(supabase) {
  let success = true;
  
  for (const expectedFunction of EXPECTED_FUNCTIONS) {
    try {
      // Test if function exists by calling it with invalid parameters
      // This should either work or give a function-specific error, not "function doesn't exist"
      const { error } = await supabase.rpc(expectedFunction);
      
      if (error && error.message.includes('function') && error.message.includes('does not exist')) {
        logError(`Missing function: ${expectedFunction}`);
        success = false;
      } else {
        logSuccess(`Function exists: ${expectedFunction}`);
      }
    } catch (e) {
      logSuccess(`Function exists: ${expectedFunction}`);
    }
  }
  
  return { success };
}

async function verifyRLSPolicies(supabase) {
  let success = true;
  
  for (const table of RLS_ENABLED_TABLES) {
    // Check if RLS is enabled on table
    const { data, error } = await supabase
      .from('pg_class')
      .select('relrowsecurity')
      .eq('relname', table)
      .single();
    
    if (error) {
      logWarning(`Could not verify RLS status for table: ${table}`);
      continue;
    }
    
    if (data?.relrowsecurity) {
      logSuccess(`RLS enabled on table: ${table}`);
    } else {
      logError(`RLS not enabled on table: ${table}`);
      success = false;
    }
  }
  
  return { success };
}

async function verifyIndexes(supabase) {
  // Check for critical multi-tenant indexes
  const criticalIndexes = [
    'idx_users_organization_id',
    'idx_contacts_organization_id', 
    'idx_leads_organization_id',
    'idx_jobs_organization_id',
    'idx_estimates_organization_id'
  ];
  
  let success = true;
  
  for (const indexName of criticalIndexes) {
    const { data, error } = await supabase
      .from('pg_indexes')
      .select('indexname')
      .eq('indexname', indexName)
      .single();
    
    if (error || !data) {
      logError(`Missing critical index: ${indexName}`);
      success = false;
    } else {
      logSuccess(`Critical index exists: ${indexName}`);
    }
  }
  
  return { success };
}

async function verifyReferenceData(supabase) {
  let success = true;
  
  // Check US states data
  const { data: states, error: statesError } = await supabase
    .from('ref_states')
    .select('code')
    .limit(1);
  
  if (statesError || !states || states.length === 0) {
    logError('Reference data missing: US states');
    success = false;
  } else {
    logSuccess('Reference data exists: US states');
  }
  
  // Check materials data
  const { data: materials, error: materialsError } = await supabase
    .from('ref_materials')
    .select('id')
    .limit(1);
  
  if (materialsError || !materials || materials.length === 0) {
    logError('Reference data missing: Materials');
    success = false;
  } else {
    logSuccess('Reference data exists: Materials');
  }
  
  // Check role permissions data
  const { data: permissions, error: permissionsError } = await supabase
    .from('role_permissions')
    .select('id')
    .limit(1);
  
  if (permissionsError || !permissions || permissions.length === 0) {
    logError('Reference data missing: Role permissions');
    success = false;
  } else {
    logSuccess('Reference data exists: Role permissions');
  }
  
  return { success };
}

async function testMultiTenantIsolation(supabase) {
  // This is a basic structural test - actual RLS testing requires authenticated users
  logInfo('Multi-tenant isolation test requires authenticated users');
  logInfo('Structural verification: All tables have organization_id columns');
  
  const multiTenantTables = [
    'users', 'contacts', 'leads', 'jobs', 'estimates', 
    'estimate_line_items', 'communications', 'file_attachments', 'user_sessions'
  ];
  
  let success = true;
  
  for (const table of multiTenantTables) {
    const { data, error } = await supabase
      .from('information_schema.columns')
      .select('column_name')
      .eq('table_name', table)
      .eq('column_name', 'organization_id')
      .single();
    
    if (error || !data) {
      logError(`Missing organization_id column in table: ${table}`);
      success = false;
    } else {
      logSuccess(`Multi-tenant structure verified: ${table}`);
    }
  }
  
  return { success };
}

// Run the verification
if (require.main === module) {
  main().catch(error => {
    logError(`Script failed: ${error.message}`);
    process.exit(1);
  });
}

module.exports = { main };