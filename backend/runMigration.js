const fs = require('fs');
const path = require('path');
const database = require('./database');

/**
 * Migration Runner for Simulation System
 * Executes the database migration to add simulation tables and fields
 */
async function runSimulationMigration() {
  try {
    console.log('🚀 Starting simulation system migration...');

    // Check if we're using PostgreSQL
    if (!database.usePostgreSQL) {
      console.log('📝 Using JSON files - creating simulation data files...');
      
      // Create simulation data files for JSON mode
      const dataDir = path.join(__dirname, 'data');
      
      // Create empty JSON files if they don't exist
      const simulationFiles = [
        'monthly_targets.json',
        'daily_records.json', 
        'simulated_trades.json',
        'simulation_parameters.json'
      ];

      for (const file of simulationFiles) {
        const filePath = path.join(dataDir, file);
        if (!fs.existsSync(filePath)) {
          fs.writeFileSync(filePath, '[]');
          console.log(`✅ Created ${file}`);
        }
      }

      // Add simulation parameters for JSON mode
      const paramsPath = path.join(dataDir, 'simulation_parameters.json');
      const defaultParams = [
        { id: '1', parameter_name: 'min_monthly_target', parameter_value: '0.15', parameter_type: 'number', description: 'Minimum monthly target percentage (15%)' },
        { id: '2', parameter_name: 'max_monthly_target', parameter_value: '0.21', parameter_type: 'number', description: 'Maximum monthly target percentage (21%)' },
        { id: '3', parameter_name: 'min_daily_trades', parameter_value: '3', parameter_type: 'number', description: 'Minimum trades per day' },
        { id: '4', parameter_name: 'max_daily_trades', parameter_value: '8', parameter_type: 'number', description: 'Maximum trades per day' },
        { id: '5', parameter_name: 'win_rate_min', parameter_value: '0.60', parameter_type: 'number', description: 'Minimum win rate (60%)' },
        { id: '6', parameter_name: 'win_rate_max', parameter_value: '0.85', parameter_type: 'number', description: 'Maximum win rate (85%)' },
        { id: '7', parameter_name: 'crypto_symbols', parameter_value: '["BTC", "ETH", "ADA", "SOL", "DOT", "LINK", "UNI", "AAVE"]', parameter_type: 'json', description: 'Available crypto symbols for simulation' },
        { id: '8', parameter_name: 'simulation_enabled', parameter_value: 'true', parameter_type: 'boolean', description: 'Global simulation system toggle' },
        { id: '9', parameter_name: 'weekend_trading', parameter_value: 'false', parameter_type: 'boolean', description: 'Whether to simulate trades on weekends' }
      ];
      
      fs.writeFileSync(paramsPath, JSON.stringify(defaultParams, null, 2));
      console.log('✅ Added default simulation parameters');

      // Update existing users.json to add simulation fields
      const usersPath = path.join(dataDir, 'users.json');
      if (fs.existsSync(usersPath)) {
        const users = JSON.parse(fs.readFileSync(usersPath, 'utf8'));
        let updated = false;

        for (const user of users) {
          if (!user.hasOwnProperty('depositedAmount')) {
            user.depositedAmount = user.balance || 0;
            user.simulatedInterest = 0;
            user.currentMonthlyTarget = 0;
            user.simulationStartDate = new Date().toISOString().split('T')[0];
            user.lastSimulationUpdate = new Date().toISOString();
            user.simulationActive = true;
            updated = true;
          }
        }

        if (updated) {
          fs.writeFileSync(usersPath, JSON.stringify(users, null, 2));
          console.log('✅ Updated existing users with simulation fields');
        }
      }

      console.log('🎉 JSON simulation system setup complete!');
      return;
    }

    // PostgreSQL migration
    console.log('🗄️ Running PostgreSQL migration...');

    // Read the migration file
    const migrationPath = path.join(__dirname, 'migrations', 'add_simulation_system.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

    // Split the migration into individual statements
    const statements = migrationSQL
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));

    // Execute each statement
    let executed = 0;
    for (const statement of statements) {
      try {
        if (statement.toUpperCase().includes('COMMIT')) continue; // Skip COMMIT statements
        
        await database.query(statement);
        executed++;
        
        // Log progress for major operations
        if (statement.includes('CREATE TABLE')) {
          const tableName = statement.match(/CREATE TABLE (?:IF NOT EXISTS )?(\w+)/i)?.[1];
          console.log(`✅ Created table: ${tableName}`);
        } else if (statement.includes('ALTER TABLE')) {
          const tableName = statement.match(/ALTER TABLE (\w+)/i)?.[1];
          console.log(`✅ Altered table: ${tableName}`);
        } else if (statement.includes('CREATE INDEX')) {
          console.log(`✅ Created index`);
        } else if (statement.includes('CREATE OR REPLACE VIEW')) {
          const viewName = statement.match(/CREATE OR REPLACE VIEW (\w+)/i)?.[1];
          console.log(`✅ Created view: ${viewName}`);
        } else if (statement.includes('CREATE OR REPLACE FUNCTION')) {
          const funcName = statement.match(/CREATE OR REPLACE FUNCTION (\w+)/i)?.[1];
          console.log(`✅ Created function: ${funcName}`);
        } else if (statement.includes('CREATE TRIGGER')) {
          const triggerName = statement.match(/CREATE TRIGGER (\w+)/i)?.[1];
          console.log(`✅ Created trigger: ${triggerName}`);
        }
      } catch (error) {
        console.error(`❌ Error executing statement: ${error.message}`);
        console.error(`Statement: ${statement.substring(0, 100)}...`);
        // Continue with other statements
      }
    }

    console.log(`📊 Migration complete! Executed ${executed} statements.`);

    // Verify the migration by checking if tables exist
    console.log('🔍 Verifying migration...');
    
    const verificationQueries = [
      { name: 'monthly_simulation_targets', query: "SELECT COUNT(*) FROM monthly_simulation_targets" },
      { name: 'daily_simulation_records', query: "SELECT COUNT(*) FROM daily_simulation_records" },
      { name: 'simulated_trades', query: "SELECT COUNT(*) FROM simulated_trades" },
      { name: 'simulation_parameters', query: "SELECT COUNT(*) FROM simulation_parameters" }
    ];

    for (const check of verificationQueries) {
      try {
        const result = await database.query(check.query);
        console.log(`✅ Table '${check.name}' verified: ${result.rows[0].count} records`);
      } catch (error) {
        console.error(`❌ Table '${check.name}' verification failed: ${error.message}`);
      }
    }

    console.log('🎉 Simulation system migration completed successfully!');

  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

// Run migration if this file is executed directly
if (require.main === module) {
  runSimulationMigration()
    .then(() => {
      console.log('✅ Migration runner finished');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Migration runner failed:', error);
      process.exit(1);
    });
}

module.exports = { runSimulationMigration };