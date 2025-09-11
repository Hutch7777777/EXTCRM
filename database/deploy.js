#!/usr/bin/env node

/**
 * Database Migration Deployment Script
 * Deploys SQL migrations to Supabase instance
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
    console.error('Required: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Migration tracking table
const CREATE_MIGRATIONS_TABLE = `
CREATE TABLE IF NOT EXISTS _migrations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    filename VARCHAR(255) NOT NULL UNIQUE,
    checksum VARCHAR(64) NOT NULL,
    executed_at TIMESTAMPTZ DEFAULT NOW()
);
`;

/**
 * Calculate MD5 checksum of file content
 */
function calculateChecksum(content) {
    const crypto = require('crypto');
    return crypto.createHash('md5').update(content).digest('hex');
}

/**
 * Execute SQL migration
 */
async function executeMigration(filename, sqlContent) {
    console.log(`🔄 Executing migration: ${filename}`);
    
    try {
        const { data, error } = await supabase.rpc('exec_sql', { sql: sqlContent });
        
        if (error) {
            throw error;
        }
        
        console.log(`✅ Migration ${filename} executed successfully`);
        return true;
    } catch (error) {
        console.error(`❌ Migration ${filename} failed:`, error.message);
        return false;
    }
}

/**
 * Record migration execution
 */
async function recordMigration(filename, checksum) {
    const { error } = await supabase
        .from('_migrations')
        .insert({ filename, checksum });
    
    if (error) {
        console.error(`❌ Failed to record migration ${filename}:`, error.message);
        return false;
    }
    
    return true;
}

/**
 * Check if migration already executed
 */
async function isMigrationExecuted(filename, checksum) {
    const { data, error } = await supabase
        .from('_migrations')
        .select('checksum')
        .eq('filename', filename)
        .single();
    
    if (error && error.code !== 'PGRST116') { // Not found error is OK
        console.error(`❌ Failed to check migration status:`, error.message);
        return false;
    }
    
    if (data) {
        if (data.checksum === checksum) {
            console.log(`⏭️  Migration ${filename} already executed (checksum matches)`);
            return true;
        } else {
            console.warn(`⚠️  Migration ${filename} checksum changed! Manual intervention required.`);
            return false;
        }
    }
    
    return false; // Not executed yet
}

/**
 * Deploy all migrations
 */
async function deployMigrations() {
    console.log('🚀 Starting database migration deployment...\n');
    
    // Ensure migrations table exists
    console.log('📋 Setting up migration tracking table...');
    try {
        const { error } = await supabase.rpc('exec_sql', { sql: CREATE_MIGRATIONS_TABLE });
        if (error) {
            console.error('❌ Failed to create migrations table:', error.message);
            return false;
        }
        console.log('✅ Migration tracking table ready\n');
    } catch (error) {
        console.error('❌ Failed to create migrations table:', error.message);
        return false;
    }
    
    // Read migration files
    const migrationsDir = path.join(__dirname, 'migrations');
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
    
    let successCount = 0;
    let errorCount = 0;
    
    // Process each migration
    for (const filename of migrationFiles) {
        const filepath = path.join(migrationsDir, filename);
        const sqlContent = fs.readFileSync(filepath, 'utf8');
        const checksum = calculateChecksum(sqlContent);
        
        // Check if already executed
        if (await isMigrationExecuted(filename, checksum)) {
            successCount++;
            continue;
        }
        
        // Execute migration
        if (await executeMigration(filename, sqlContent)) {
            if (await recordMigration(filename, checksum)) {
                successCount++;
            } else {
                errorCount++;
            }
        } else {
            errorCount++;
        }
    }
    
    // Summary
    console.log('\n📊 Migration deployment summary:');
    console.log(`   ✅ Successful: ${successCount}`);
    console.log(`   ❌ Failed: ${errorCount}`);
    console.log(`   📁 Total: ${migrationFiles.length}`);
    
    return errorCount === 0;
}

/**
 * Test database connection
 */
async function testConnection() {
    console.log('🔌 Testing database connection...');
    
    try {
        const { data, error } = await supabase.from('_migrations').select('count').limit(1);
        
        if (error && error.code !== 'PGRST116' && error.code !== '42P01') {
            throw error;
        }
        
        console.log('✅ Database connection successful\n');
        return true;
    } catch (error) {
        console.error('❌ Database connection failed:', error.message);
        return false;
    }
}

// Main execution
(async () => {
    try {
        if (!(await testConnection())) {
            process.exit(1);
        }
        
        const success = await deployMigrations();
        
        if (success) {
            console.log('\n🎉 All migrations deployed successfully!');
            process.exit(0);
        } else {
            console.log('\n💥 Some migrations failed. Please review and fix errors.');
            process.exit(1);
        }
    } catch (error) {
        console.error('\n💥 Deployment failed with unexpected error:', error);
        process.exit(1);
    }
})();