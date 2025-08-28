const path = require('path');
process.chdir(__dirname);

const CompoundInterestSimulation = require('./backend/services/compoundInterestSimulation');
const database = require('./backend/database');

async function testDailyPayoutAPI() {
  try {
    console.log('🧪 Testing Daily Payout API Logic...\n');
    
    const userId = '5b30e95c-2d49-43be-9676-ebb52bd35daa';
    const compoundSim = new CompoundInterestSimulation();
    
    console.log('📊 Getting simulation for user:', userId);
    const simulation = await compoundSim.getUserSimulation(userId);
    
    if (!simulation) {
      console.log('❌ No simulation found');
      return;
    }
    
    console.log('✅ Simulation found');
    console.log('   - Start Date:', simulation.startDate);
    console.log('   - Initial Deposit:', simulation.initialDeposit);
    console.log('   - Total Months:', simulation.months.length);
    
    const currentMonth = simulation.months.find(m => m.status === 'active');
    if (!currentMonth) {
      console.log('❌ No active month found');
      return;
    }
    
    console.log('\n🗓️  Current Active Month:');
    console.log('   - Month:', currentMonth.monthName);
    console.log('   - Monthly Target:', currentMonth.projectedInterest);
    console.log('   - Total Paid:', currentMonth.totalPaid || 0);
    console.log('   - Remaining Target:', currentMonth.remainingTarget || currentMonth.projectedInterest);
    console.log('   - Days in Month:', currentMonth.daysInMonth);
    console.log('   - Daily Payouts:', currentMonth.dailyPayouts.length);
    
    const today = new Date().toISOString().split('T')[0];
    const todaysPayout = currentMonth.dailyPayouts.find(p => p.date === today);
    
    console.log('\n💰 Today\'s Payout Info:');
    console.log('   - Today\'s Date:', today);
    console.log('   - Found Today\'s Payout:', !!todaysPayout);
    
    if (todaysPayout) {
      console.log('   - Amount:', todaysPayout.amount);
      console.log('   - Status:', todaysPayout.status);
      console.log('   - Paid At:', todaysPayout.paidAt);
    }
    
    // Get recent payouts (last 7 days, paid only)
    const recentPayouts = currentMonth.dailyPayouts
      .filter(p => p.status === 'paid')
      .slice(-7)
      .reverse();
    
    console.log('\n📈 Recent Payouts (Last 7 Paid):');
    recentPayouts.forEach(payout => {
      console.log(`   - ${payout.date}: $${payout.amount} (${payout.status})`);
    });
    
    // Simulate the API response structure
    const payoutData = {
      currentMonth: {
        monthNumber: currentMonth.monthNumber,
        monthName: currentMonth.monthName,
        totalTarget: currentMonth.projectedInterest,
        totalPaid: currentMonth.totalPaid || 0,
        remainingTarget: currentMonth.remainingTarget || currentMonth.projectedInterest,
        dailyPayouts: currentMonth.dailyPayouts
      },
      todaysPayout: todaysPayout || null,
      recentPayouts: recentPayouts
    };
    
    console.log('\n🔍 API Response Structure:');
    console.log('   - Current Month Target:', payoutData.currentMonth.totalTarget);
    console.log('   - Current Month Paid:', payoutData.currentMonth.totalPaid);
    console.log('   - Today\'s Payout Available:', !!payoutData.todaysPayout);
    console.log('   - Recent Payouts Count:', payoutData.recentPayouts.length);
    
    if (payoutData.todaysPayout) {
      console.log('   - Today\'s Amount:', payoutData.todaysPayout.amount);
      console.log('   - Today\'s Status:', payoutData.todaysPayout.status);
    }
    
    console.log('\n✅ Daily Payout API test completed successfully!');
    console.log('\n📝 Summary:');
    console.log(`   - User has active simulation: YES`);
    console.log(`   - Monthly progress: $${payoutData.currentMonth.totalPaid}/$${payoutData.currentMonth.totalTarget}`);
    console.log(`   - Progress percentage: ${((payoutData.currentMonth.totalPaid / payoutData.currentMonth.totalTarget) * 100).toFixed(1)}%`);
    console.log(`   - Today's payout ready: ${payoutData.todaysPayout ? 'YES' : 'NO'}`);
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    process.exit(0);
  }
}

testDailyPayoutAPI();
