#!/usr/bin/env node

/**
 * Database Migration Runner
 * Runs the add_user_fields.sql migration on PostgreSQL
 * 
 * Usage:
 * node runMigration.js [migration-file]
 * 
 * Environment Variables Required:
 * - DATABASE_URL or DB_* variables for PostgreSQL connection
 */

const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');

// Load environment variables
require('dotenv').config();

async function runMigration(migrationFile = 'create_production_tables.sql') {
  console.log(`🗄️ Starting database migration: ${migrationFile}`);
  
  // Database connection
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL || {
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 5432,
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME || 'crypto_trading_simulator',
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
    }
  });

  try {
    // Test connection
    console.log('🔌 Testing database connection...');
    const client = await pool.connect();
    console.log('✅ Database connected successfully');
    client.release();

    // Read migration file
    const migrationPath = path.join(__dirname, 'migrations', migrationFile);
    console.log(`📁 Reading migration file: ${migrationPath}`);
    
    if (!fs.existsSync(migrationPath)) {
      throw new Error(`Migration file not found: ${migrationPath}`);
    }

    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    console.log(`📝 Migration SQL loaded (${migrationSQL.length} characters)`);

    // Execute migration
    console.log('🚀 Executing migration...');
    const result = await pool.query(migrationSQL);
    console.log('✅ Migration completed successfully!');
    
    // Verify new columns exist
    console.log('🔍 Verifying migration...');
    const verifyResult = await pool.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'users' 
      AND column_name IN ('first_name', 'last_name', 'phone', 'deposited_amount', 'simulation_active')
      ORDER BY column_name;
    `);
    
    if (verifyResult.rows.length > 0) {
      console.log('✅ Migration verification successful! New columns:');
      verifyResult.rows.forEach(row => {
        console.log(`   - ${row.column_name} (${row.data_type})`);
      });
    } else {
      console.log('⚠️ Warning: Could not verify new columns');
    }

    // Show user count
    const userCountResult = await pool.query('SELECT COUNT(*) as count FROM users');
    console.log(`📊 Total users in database: ${userCountResult.rows[0].count}`);

  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    console.error('📋 Full error details:', error);
    process.exit(1);
  } finally {
    await pool.end();
    console.log('🔌 Database connection closed');
  }
}

// CLI usage
if (require.main === module) {
  const migrationFile = process.argv[2] || 'add_user_fields.sql';
  
  console.log('🗄️ Database Migration Runner');
  console.log('==============================');
  console.log(`Migration: ${migrationFile}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log('');
  
  runMigration(migrationFile)
    .then(() => {
      console.log('');
      console.log('🎉 Migration completed successfully!');
      console.log('Your database schema has been updated.');
      process.exit(0);
    })
    .catch(error => {
      console.error('💥 Migration runner failed:', error);
      process.exit(1);
    });
}

module.exports = { runMigration };