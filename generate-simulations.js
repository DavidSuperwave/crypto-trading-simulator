const path = require('path');
process.chdir(__dirname);

const CompoundInterestSimulation = require('./backend/services/compoundInterestSimulation');
const database = require('./backend/database');

async function generateSimulationsForExistingUsers() {
  try {
    console.log('🔄 Generating simulation data for existing users...');
    
    const compoundSim = new CompoundInterestSimulation();
    const users = await database.getAllUsers();
    
    const eligibleUsers = users.filter(user => 
      (user.role === 'user' || (user.role === 'admin' && user.depositedAmount)) &&
      user.depositedAmount > 0
    );
    
    console.log(`📊 Found ${eligibleUsers.length} eligible users for simulation generation`);
    
    for (const user of eligibleUsers) {
      try {
        console.log(`\n👤 Processing user: ${user.email}`);
        console.log(`💰 Deposit amount: $${user.depositedAmount}`);
        console.log(`📅 Account created: ${user.createdAt}`);
        
        // Check if user already has simulation
        const existingSimulation = await compoundSim.getUserSimulation(user.id);
        if (existingSimulation) {
          console.log(`⏭️  User ${user.email} already has simulation - skipping`);
          continue;
        }
        
        // Use account creation date as simulation start date
        const accountCreationDate = new Date(user.createdAt);
        
        // Generate simulation starting from account creation date
        const simulation = await compoundSim.generateSimulationWithStartDate(
          user.id, 
          user.depositedAmount,
          accountCreationDate
        );
        
        if (simulation) {
          console.log(`✅ Generated simulation for ${user.email}`);
          console.log(`   - Start date: ${accountCreationDate.toISOString().split('T')[0]}`);
          console.log(`   - Initial deposit: $${user.depositedAmount}`);
          console.log(`   - Total months: ${simulation.months.length}`);
          
          // Process any daily payouts that should have happened between creation date and now
          await compoundSim.catchUpDailyPayouts(user.id, accountCreationDate);
          
        } else {
          console.log(`❌ Failed to generate simulation for ${user.email}`);
        }
        
      } catch (error) {
        console.error(`❌ Error processing user ${user.email}:`, error.message);
      }
    }
    
    console.log('\n✅ Simulation generation completed');
    
  } catch (error) {
    console.error('❌ Error generating simulations:', error);
  } finally {
    process.exit(0);
  }
}

generateSimulationsForExistingUsers();
