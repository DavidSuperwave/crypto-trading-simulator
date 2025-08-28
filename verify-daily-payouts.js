const path = require('path');
process.chdir(__dirname);

const CompoundInterestSimulation = require('./backend/services/compoundInterestSimulation');

async function verifyDailyPayouts() {
  try {
    console.log('📊 DAILY PAYOUT VERIFICATION FOR USER@CRYPTOSIM.COM');
    console.log('=' .repeat(60));
    
    const userId = '5b30e95c-2d49-43be-9676-ebb52bd35daa';
    const compoundSim = new CompoundInterestSimulation();
    const simulation = await compoundSim.getUserSimulation(userId);
    
    if (!simulation) {
      console.log('❌ No simulation found');
      return;
    }
    
    const currentMonth = simulation.months.find(m => m.status === 'active');
    if (!currentMonth) {
      console.log('❌ No active month found');
      return;
    }
    
    console.log('\n🏦 ACCOUNT SUMMARY:');
    console.log(`   Account Created: ${simulation.startDate}`);
    console.log(`   Initial Deposit: $${simulation.initialDeposit.toLocaleString()}`);
    console.log(`   Monthly Target:  $${currentMonth.projectedInterest.toFixed(2)} (${(currentMonth.lockedRate * 100).toFixed(2)}%)`);
    console.log(`   Month:           ${currentMonth.monthName}`);
    console.log(`   Days in Month:   ${currentMonth.daysInMonth}`);
    
    console.log('\n📅 DAILY PAYOUT SCHEDULE:');
    console.log('   Date       | Day | Amount | Status  | Paid At');
    console.log('   ' + '-'.repeat(50));
    
    let totalExpected = 0;
    let totalPaid = 0;
    let paidCount = 0;
    let pendingCount = 0;
    
    currentMonth.dailyPayouts.forEach(payout => {
      const status = payout.status.padEnd(7);
      const amount = `$${payout.amount.toFixed(2)}`.padStart(7);
      const day = payout.day.toString().padStart(2);
      const paidAt = payout.paidAt ? new Date(payout.paidAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : '---';
      
      console.log(`   ${payout.date} | ${day}  | ${amount} | ${status} | ${paidAt}`);
      
      totalExpected += payout.amount;
      if (payout.status === 'paid') {
        totalPaid += payout.amount;
        paidCount++;
      } else {
        pendingCount++;
      }
    });
    
    console.log('   ' + '-'.repeat(50));
    console.log(`   TOTALS:    |     | $${totalExpected.toFixed(2)} |         |`);
    
    console.log('\n💰 PAYOUT SUMMARY:');
    console.log(`   Expected Total:     $${totalExpected.toFixed(2)}`);
    console.log(`   Monthly Target:     $${currentMonth.projectedInterest.toFixed(2)}`);
    console.log(`   Difference:         $${(totalExpected - currentMonth.projectedInterest).toFixed(2)}`);
    console.log(`   Target Match:       ${Math.abs(totalExpected - currentMonth.projectedInterest) < 0.01 ? '✅ YES' : '❌ NO'}`);
    
    console.log('\n📈 PAYMENT STATUS:');
    console.log(`   Payments Made:      ${paidCount} days`);
    console.log(`   Pending Payments:   ${pendingCount} days`);
    console.log(`   Total Paid:         $${totalPaid.toFixed(2)}`);
    console.log(`   Remaining:          $${(totalExpected - totalPaid).toFixed(2)}`);
    console.log(`   Progress:           ${((totalPaid / totalExpected) * 100).toFixed(1)}%`);
    
    // Verify the account creation date logic
    const accountCreated = new Date(simulation.startDate);
    const firstPayout = currentMonth.dailyPayouts.find(p => p.status === 'paid');
    
    console.log('\n🕒 TIMING VERIFICATION:');
    console.log(`   Account Created:    ${accountCreated.toISOString().split('T')[0]}`);
    console.log(`   First Paid Day:     ${firstPayout ? firstPayout.date : 'None'}`);
    
    if (firstPayout) {
      const firstPayoutDate = new Date(firstPayout.date);
      const daysDiff = Math.ceil((firstPayoutDate - accountCreated) / (1000 * 60 * 60 * 24));
      console.log(`   Days Between:       ${daysDiff} days`);
      console.log(`   Logic Correct:      ${daysDiff >= -1 && daysDiff <= 1 ? '✅ YES' : '❌ NO'}`);
    }
    
    // Today's payout info
    const today = new Date().toISOString().split('T')[0];
    const todaysPayout = currentMonth.dailyPayouts.find(p => p.date === today);
    
    console.log('\n🎯 TODAY\'S PAYOUT:');
    console.log(`   Today's Date:       ${today}`);
    console.log(`   Payout Available:   ${todaysPayout ? '✅ YES' : '❌ NO'}`);
    if (todaysPayout) {
      console.log(`   Amount:             $${todaysPayout.amount.toFixed(2)}`);
      console.log(`   Status:             ${todaysPayout.status}`);
      console.log(`   Should Show in UI:  ${todaysPayout.status === 'pending' ? '✅ PENDING' : '✅ PAID'}`);
    }
    
    // Validate daily amounts distribution
    console.log('\n🔍 PAYOUT DISTRIBUTION ANALYSIS:');
    const amounts = currentMonth.dailyPayouts.map(p => p.amount);
    const minAmount = Math.min(...amounts);
    const maxAmount = Math.max(...amounts);
    const avgAmount = amounts.reduce((a, b) => a + b, 0) / amounts.length;
    const variance = amounts.reduce((sum, amount) => sum + Math.pow(amount - avgAmount, 2), 0) / amounts.length;
    const stdDev = Math.sqrt(variance);
    
    console.log(`   Min Daily Amount:   $${minAmount.toFixed(2)}`);
    console.log(`   Max Daily Amount:   $${maxAmount.toFixed(2)}`);
    console.log(`   Average Amount:     $${avgAmount.toFixed(2)}`);
    console.log(`   Standard Deviation: $${stdDev.toFixed(2)}`);
    console.log(`   Variance Range:     ${((stdDev / avgAmount) * 100).toFixed(1)}%`);
    console.log(`   Distribution OK:    ${stdDev / avgAmount < 0.3 ? '✅ YES (Good variance)' : '⚠️  High variance'}`);
    
    console.log('\n' + '='.repeat(60));
    console.log('✅ VERIFICATION COMPLETE');
    
  } catch (error) {
    console.error('❌ Verification failed:', error);
  } finally {
    process.exit(0);
  }
}

verifyDailyPayouts();
