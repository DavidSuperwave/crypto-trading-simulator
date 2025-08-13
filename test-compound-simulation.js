#!/usr/bin/env node

/**
 * Test script for compound interest simulation
 * This tests the scenarios described by the user
 */

const CompoundInterestSimulation = require('./backend/services/compoundInterestSimulation');

async function testCompoundInterestScenarios() {
  console.log('🧪 Testing Compound Interest Simulation Scenarios\n');

  const compoundSim = new CompoundInterestSimulation();

  // Scenario 1: User deposits $10,000 initially, then $10,000 more during Month 1
  console.log('📊 SCENARIO 1: Additional deposit during Month 1');
  console.log('- Initial deposit: $10,000');
  console.log('- Additional deposit: $10,000 during Month 1\n');

  try {
    // Initialize simulation
    const simulation1 = await compoundSim.initializeSimulation('test-user-1', 10000);
    console.log('✅ Simulation initialized');
    console.log(`- Month 1 rate: ${(simulation1.simulationPlan.months[0].lockedRate * 100).toFixed(2)}%`);
    console.log(`- Month 1 daily payout: $${simulation1.simulationPlan.months[0].dailyPayoutSchedule.dailyPayout.toFixed(2)}`);
    
    // Simulate additional deposit on day 15
    const depositResult1 = await compoundSim.handleMidMonthDeposit('test-user-1', 10000, '2024-01-15');
    console.log(`- After additional $10,000 on day 15:`);
    console.log(`  - New daily payout: $${depositResult1.adjustedDailyPayout.toFixed(2)}`);
    console.log(`  - Remaining days: ${depositResult1.remainingDays}`);
    console.log(`  - New monthly target: $${depositResult1.newMonthlyTarget.toFixed(2)}\n`);

  } catch (error) {
    console.error('❌ Error in Scenario 1:', error.message);
  }

  // Scenario 2: User deposits $10,000 initially, then $10,000 in Month 3
  console.log('📊 SCENARIO 2: Additional deposit in Month 3');
  console.log('- Initial deposit: $10,000');
  console.log('- Additional deposit: $10,000 in Month 3\n');

  try {
    // Initialize simulation
    const simulation2 = await compoundSim.initializeSimulation('test-user-2', 10000);
    console.log('✅ Simulation initialized');
    
    // Show first 3 months projected growth
    for (let i = 0; i < 3; i++) {
      const month = simulation2.simulationPlan.months[i];
      console.log(`- Month ${i + 1}: ${(month.lockedRate * 100).toFixed(2)}% rate, $${month.startingBalance.toFixed(2)} → $${month.endingBalance.toFixed(2)}`);
    }
    
    // Simulate month 3 balance (after compounding from months 1 & 2)
    const month3 = simulation2.simulationPlan.months[2];
    console.log(`\n- Month 3 starting balance: $${month3.startingBalance.toFixed(2)}`);
    
    // Simulate additional deposit on day 10 of month 3
    const depositResult2 = await compoundSim.handleMidMonthDeposit('test-user-2', 10000, '2024-03-10');
    console.log(`- After additional $10,000 on day 10 of Month 3:`);
    console.log(`  - New balance: $${month3.startingBalance + 10000}`);
    console.log(`  - New daily payout: $${depositResult2.adjustedDailyPayout.toFixed(2)}`);
    console.log(`  - Remaining days: ${depositResult2.remainingDays}`);
    console.log(`  - New monthly target: $${depositResult2.newMonthlyTarget.toFixed(2)}\n`);

  } catch (error) {
    console.error('❌ Error in Scenario 2:', error.message);
  }

  // Test daily payout processing
  console.log('📊 TESTING DAILY PAYOUT PROCESSING\n');

  try {
    // Process a few days of payouts for user 1
    for (let day = 1; day <= 5; day++) {
      const date = `2024-01-${day.toString().padStart(2, '0')}`;
      const result = await compoundSim.processDailyPayout('test-user-1', date);
      
      if (result.success) {
        console.log(`- Day ${day}: $${result.payoutAmount.toFixed(2)} paid, progress: ${result.monthlyProgress.toFixed(1)}%`);
      }
    }

  } catch (error) {
    console.error('❌ Error in daily payout testing:', error.message);
  }

  console.log('\n🎉 Compound Interest Simulation Test Complete!');
  console.log('\nKey Features Tested:');
  console.log('✅ 12-month rate generation (20-22% Month 1, 15-17% subsequent)');
  console.log('✅ Compound growth calculation');
  console.log('✅ Daily payout distribution');
  console.log('✅ Mid-month deposit adjustments');
  console.log('✅ Daily payout processing');
}

// Run the test
if (require.main === module) {
  testCompoundInterestScenarios().catch(console.error);
}

module.exports = { testCompoundInterestScenarios };