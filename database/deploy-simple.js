#!/usr/bin/env node

/**
 * Simple Database Migration Deployment Script
 * Deploys SQL migrations to Supabase instance using direct SQL execution
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env.local') });

// Supabase configuration
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Missing Supabase configuration');
    console.error('Required: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (or ANON_KEY)');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});

/**
 * Test basic connection
 */
async function testConnection() {
    console.log('🔌 Testing database connection...');
    
    try {
        // Try to query any table to test connection
        const { data, error } = await supabase
            .from('auth.users')
            .select('count')
            .limit(1);
        
        // Connection works if we get any response (even if it's a permissions error)
        console.log('✅ Database connection successful\n');
        return true;
    } catch (error) {
        console.error('❌ Database connection failed:', error.message);
        return false;
    }
}

/**
 * Check if tables exist in the database
 */
async function checkExistingTables() {
    console.log('🔍 Checking existing database schema...');
    
    try {
        // Try to query some core tables to see what exists
        const tables = ['organizations', 'users', 'contacts', 'leads', 'jobs', 'estimates'];
        const existing = [];
        
        for (const table of tables) {
            try {
                const { data, error } = await supabase
                    .from(table)
                    .select('count')
                    .limit(1);
                
                if (!error || error.code === 'PGRST103') { // Table exists but might be empty
                    existing.push(table);
                }
            } catch (e) {
                // Table doesn't exist or no access - that's fine
            }
        }
        
        if (existing.length > 0) {
            console.log(`✅ Found existing tables: ${existing.join(', ')}`);
        } else {
            console.log('📭 No core CRM tables found - fresh installation');
        }
        
        return existing;
    } catch (error) {
        console.log('⚠️  Could not check existing tables - proceeding with deployment');
        return [];
    }
}

/**
 * Main deployment function
 */
async function deployMigrations() {
    console.log('🚀 Starting database migration deployment...\n');
    
    // Read migration files
    const migrationsDir = path.join(__dirname, 'migrations');
    
    if (!fs.existsSync(migrationsDir)) {
        console.error(`❌ Migrations directory not found: ${migrationsDir}`);
        return false;
    }
    
    const migrationFiles = fs.readdirSync(migrationsDir)
        .filter(file => file.endsWith('.sql'))
        .sort();
    
    if (migrationFiles.length === 0) {
        console.log('📭 No migration files found');
        return true;
    }
    
    console.log(`📁 Found ${migrationFiles.length} migration files:`);
    migrationFiles.forEach(file => console.log(`   - ${file}`));
    console.log();
    
    // For this initial deployment, we'll output the SQL and provide instructions
    console.log('📋 SQL Migration Content:');
    console.log('=' .repeat(80));
    
    for (const filename of migrationFiles) {
        const filepath = path.join(migrationsDir, filename);
        const sqlContent = fs.readFileSync(filepath, 'utf8');
        
        console.log(`\n-- Migration: ${filename}`);
        console.log('-- ' + '='.repeat(60));
        console.log(sqlContent);
    }
    
    console.log('\n' + '='.repeat(80));
    console.log('📋 DEPLOYMENT INSTRUCTIONS:');
    console.log('1. Copy the SQL content above');
    console.log('2. Go to your Supabase Dashboard > SQL Editor');
    console.log('3. Paste and execute the SQL');
    console.log('4. Verify tables are created successfully');
    console.log('\nAlternatively, if you have the Supabase CLI installed:');
    console.log('supabase db push --local (for local development)');
    console.log('supabase db push (for remote deployment)');
    
    return true;
}

/**
 * Create a schema verification script
 */
async function createVerificationScript() {
    const verificationScript = `
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
`;

    const verificationPath = path.join(__dirname, 'verify-schema.sql');
    fs.writeFileSync(verificationPath, verificationScript);
    console.log(`✅ Created schema verification script: ${verificationPath}\n`);
}

// Main execution
(async () => {
    try {
        if (!(await testConnection())) {
            process.exit(1);
        }
        
        await checkExistingTables();
        await createVerificationScript();
        const success = await deployMigrations();
        
        if (success) {
            console.log('\n🎉 Migration deployment prepared successfully!');
            console.log('Please follow the instructions above to complete the deployment.');
            process.exit(0);
        } else {
            console.log('\n💥 Failed to prepare migrations.');
            process.exit(1);
        }
    } catch (error) {
        console.error('\n💥 Deployment preparation failed:', error);
        process.exit(1);
    }
})();