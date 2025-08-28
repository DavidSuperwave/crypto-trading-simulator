const path = require('path');
process.chdir(__dirname);

const CompoundInterestSimulation = require('./backend/services/compoundInterestSimulation');

async function showCompletePayouts() {
  try {
    console.log('📅 COMPLETE AUGUST 2025 PAYOUT SCHEDULE');
    console.log('=' .repeat(60));
    
    const userId = '5b30e95c-2d49-43be-9676-ebb52bd35daa';
    const compoundSim = new CompoundInterestSimulation();
    const simulation = await compoundSim.getUserSimulation(userId);
    
    const currentMonth = simulation.months.find(m => m.status === 'active');
    
    console.log(`\n🏦 USER: user@cryptosim.com`);
    console.log(`💰 MONTHLY TARGET: $${currentMonth.projectedInterest.toFixed(2)} (${(currentMonth.lockedRate * 100).toFixed(2)}%)`);
    console.log(`📅 ACCOUNT CREATED: ${new Date(simulation.startDate).toLocaleDateString()}`);
    
    console.log('\n📊 ALL AUGUST 2025 DAILY PAYOUTS:');
    console.log('Date       | Day | Amount | Status  | Paid Time');
    console.log('-'.repeat(55));
    
    let runningTotal = 0;
    let paidTotal = 0;
    
    currentMonth.dailyPayouts.forEach(payout => {
      const status = payout.status === 'paid' ? '✅ Paid' : '⏳ Pending';
      const amount = `$${payout.amount.toFixed(2)}`;
      const day = payout.day.toString().padStart(2, ' ');
      const paidTime = payout.paidAt ? 
        new Date(payout.paidAt).toLocaleString('en-US', { 
          month: 'short', day: 'numeric', 
          hour: 'numeric', minute: '2-digit', hour12: true 
        }) : '---';
      
      runningTotal += payout.amount;
      if (payout.status === 'paid') {
        paidTotal += payout.amount;
      }
      
      console.log(`${payout.date} | ${day}  | ${amount.padStart(6)} | ${status.padEnd(10)} | ${paidTime}`);
    });
    
    console.log('-'.repeat(55));
    console.log(`TOTALS:    |     | $${runningTotal.toFixed(2)} |            |`);
    
    console.log('\n📈 SUMMARY:');
    console.log(`Total August Payouts: $${runningTotal.toFixed(2)}`);
    console.log(`Amount Already Paid:  $${paidTotal.toFixed(2)}`);
    console.log(`Amount Remaining:     $${(runningTotal - paidTotal).toFixed(2)}`);
    console.log(`Progress:             ${Math.round((paidTotal / runningTotal) * 100)}%`);
    
    // Show payouts by week for clarity
    console.log('\n📆 WEEKLY BREAKDOWN:');
    
    const weeks = [
      { name: 'Week 1 (Aug 1-7)', days: [1,2,3,4,5,6,7] },
      { name: 'Week 2 (Aug 8-14)', days: [8,9,10,11,12,13,14] },
      { name: 'Week 3 (Aug 15-21)', days: [15,16,17,18,19,20,21] },
      { name: 'Week 4 (Aug 22-28)', days: [22,23,24,25,26,27,28] },
      { name: 'Week 5 (Aug 29-31)', days: [29,30,31] }
    ];
    
    weeks.forEach(week => {
      let weekTotal = 0;
      let weekPaid = 0;
      let weekCount = 0;
      
      week.days.forEach(day => {
        const payout = currentMonth.dailyPayouts.find(p => p.day === day);
        if (payout) {
          weekTotal += payout.amount;
          weekCount++;
          if (payout.status === 'paid') {
            weekPaid += payout.amount;
          }
        }
      });
      
      const status = weekPaid === weekTotal ? '✅ Complete' : 
                    weekPaid > 0 ? '🔄 Partial' : '⏳ Pending';
      
      console.log(`${week.name}: $${weekTotal.toFixed(2)} (${weekCount} days) - ${status}`);
    });
    
    console.log('\n🎯 CURRENT STATUS:');
    const today = new Date().toISOString().split('T')[0];
    const todaysPayout = currentMonth.dailyPayouts.find(p => p.date === today);
    
    if (todaysPayout) {
      console.log(`Today (${today}): $${todaysPayout.amount} - ${todaysPayout.status}`);
    }
    
    // Show next few pending payouts
    const pendingPayouts = currentMonth.dailyPayouts
      .filter(p => p.status === 'pending')
      .slice(0, 5);
    
    console.log('\n⏭️  NEXT PENDING PAYOUTS:');
    pendingPayouts.forEach(payout => {
      console.log(`${payout.date}: $${payout.amount.toFixed(2)}`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    process.exit(0);
  }
}

showCompletePayouts();
