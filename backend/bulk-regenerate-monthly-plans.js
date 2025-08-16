const database = require('./database');
const CompoundInterestSimulation = require('./services/compoundInterestSimulation');

/**
 * Bulk Monthly Plan Regeneration Script
 * Updates all existing monthly simulation plans to use new portfolio-based trade counts (300-400)
 * Fixes users who are stuck with old account balance-based trade counts
 */

async function bulkRegenerateMonthlyPlans() {
  try {
    console.log('🚀 Starting bulk monthly plan regeneration...');
    
    const compoundSim = new CompoundInterestSimulation();
    
    // Get all users from database
    const users = await database.getAllUsers();
    const regularUsers = users.filter(u => u && u.role === 'user' && u.simulationActive);
    
    console.log(`📊 Found ${regularUsers.length} users with active simulations`);
    
    if (regularUsers.length === 0) {
      console.log('❌ No users with active simulations found');
      return;
    }

    const results = {
      success: [],
      errors: [],
      totalProcessed: 0
    };

    // Process each user's simulation
    for (let i = 0; i < regularUsers.length; i++) {
      const user = regularUsers[i];
      results.totalProcessed++;
      
      console.log(`🔄 [${i + 1}/${regularUsers.length}] Regenerating monthly plan for ${user.email}...`);
      
      try {
        // Get existing simulation
        const existingSimulation = await compoundSim.getUserSimulation(user.id);
        
        if (!existingSimulation) {
          results.errors.push({
            userId: user.id,
            email: user.email,
            error: 'No existing simulation found'
          });
          console.log(`❌ ${user.email}: No simulation found`);
          continue;
        }

        // Update trade counts in all months using new portfolio-based logic
        let updatedMonths = 0;
        let totalOldTrades = 0;
        let totalNewTrades = 0;

        for (let monthData of existingSimulation.months) {
          const oldTradeCount = monthData.tradeCount || 0;
          
          // Use new portfolio-based trade count (300-400 for all users)
          const newTradeCount = compoundSim.tradeService.getTradeCount(monthData.startingBalance);
          
          if (oldTradeCount !== newTradeCount) {
            monthData.tradeCount = newTradeCount;
            updatedMonths++;
            totalOldTrades += oldTradeCount;
            totalNewTrades += newTradeCount;
          }
        }

        // Save updated simulation plan
        await compoundSim.saveSimulationPlan(existingSimulation);

        results.success.push({
          userId: user.id,
          email: user.email,
          monthsUpdated: updatedMonths,
          oldTradeCount: Math.round(totalOldTrades / 12), // Average
          newTradeCount: Math.round(totalNewTrades / 12), // Average
          balance: user.balance || 0
        });

        console.log(`✅ ${user.email}: Updated ${updatedMonths} months (${Math.round(totalOldTrades/12)} → ${Math.round(totalNewTrades/12)} avg trades/month)`);

        // Small delay to prevent overwhelming the system
        if (i < regularUsers.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 500)); // 500ms delay
        }

      } catch (error) {
        results.errors.push({
          userId: user.id,
          email: user.email,
          error: error.message
        });
        console.log(`❌ ${user.email}: ${error.message}`);
      }
    }

    // Summary report
    console.log('\n📊 BULK MONTHLY PLAN REGENERATION SUMMARY:');
    console.log(`✅ Successful: ${results.success.length}`);
    console.log(`❌ Failed: ${results.errors.length}`);
    console.log(`📈 Total Processed: ${results.totalProcessed}`);

    if (results.success.length > 0) {
      console.log('\n🎯 SUCCESS DETAILS:');
      results.success.forEach(s => {
        console.log(`   ${s.email}: ${s.oldTradeCount} → ${s.newTradeCount} trades/month (Balance: $${s.balance})`);
      });

      // Calculate average improvements
      const avgOldTrades = results.success.reduce((sum, s) => sum + s.oldTradeCount, 0) / results.success.length;
      const avgNewTrades = results.success.reduce((sum, s) => sum + s.newTradeCount, 0) / results.success.length;
      const improvement = ((avgNewTrades - avgOldTrades) / avgOldTrades * 100);

      console.log('\n📈 IMPROVEMENT METRICS:');
      console.log(`   Average Old: ${Math.round(avgOldTrades)} trades/month`);
      console.log(`   Average New: ${Math.round(avgNewTrades)} trades/month`);
      console.log(`   Improvement: +${improvement.toFixed(1)}% more content`);
    }

    if (results.errors.length > 0) {
      console.log('\n❌ ERROR DETAILS:');
      results.errors.forEach(e => {
        console.log(`   ${e.email}: ${e.error}`);
      });
    }

    console.log('\n🚀 Monthly plan regeneration complete!');
    console.log('💡 All users now have portfolio-based trade counts (300-400 trades)');
    console.log('💡 Next step: Run trade regeneration to apply new counts immediately');

  } catch (error) {
    console.error('💥 Critical error in monthly plan regeneration:', error);
  }
}

// Run the script
if (require.main === module) {
  bulkRegenerateMonthlyPlans()
    .then(() => {
      console.log('Script completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Script failed:', error);
      process.exit(1);
    });
}

module.exports = { bulkRegenerateMonthlyPlans };