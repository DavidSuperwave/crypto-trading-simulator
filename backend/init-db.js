#!/usr/bin/env node

/**
 * Database Initialization Script
 * Initializes PostgreSQL database with schema and seed data
 */

require('dotenv').config();
const PostgreSQLDatabase = require('./database-pg');

async function initializeDatabase() {
  console.log('🔄 Initializing database...');
  
  const db = new PostgreSQLDatabase();
  
  try {
    // Test connection
    await db.query('SELECT NOW()');
    console.log('✅ Database connection successful');
    
    // Create tables
    console.log('🏗️  Creating database schema...');
    await db.initializeTables();
    console.log('✅ Database schema created');
    
    // Seed initial data
    console.log('🌱 Seeding initial data...');
    await db.seedInitialData();
    console.log('✅ Initial data seeded');
    
    console.log('🎉 Database initialization complete!');
    console.log('');
    console.log('📋 Default Admin Account:');
    console.log('   Email: admin@cryptosim.com');
    console.log('   Password: admin123');
    console.log('   ⚠️  CHANGE THIS PASSWORD IN PRODUCTION!');
    
  } catch (error) {
    console.error('❌ Database initialization failed:', error.message);
    process.exit(1);
  }
  
  process.exit(0);
}

// Run if called directly
if (require.main === module) {
  initializeDatabase();
}

module.exports = { initializeDatabase };