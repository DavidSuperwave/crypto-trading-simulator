const axios = require('axios');

async function testNewAPI() {
  try {
    console.log('🧪 Testing NEW Daily Payout API...\n');
    
    // Login first
    const loginResponse = await axios.post('http://localhost:5000/api/auth/login', {
      email: 'user@cryptosim.com',
      password: 'user123'
    });
    
    const token = loginResponse.data.token;
    
    // Test daily payouts endpoint
    const payoutResponse = await axios.get('http://localhost:5000/api/compound-interest/daily-payouts', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    const data = payoutResponse.data.payouts;
    
    console.log('📊 API Response Structure:');
    console.log(`✅ Has currentMonth: ${!!data.currentMonth}`);
    console.log(`✅ Has todaysPayout: ${!!data.todaysPayout}`);
    console.log(`✅ Has allPayouts: ${!!data.allPayouts}`);
    console.log(`❌ Has recentPayouts (old): ${!!data.recentPayouts}\n`);
    
    if (data.allPayouts) {
      console.log(`📅 All Payouts Count: ${data.allPayouts.length}`);
      console.log('🔍 First few payouts:');
      data.allPayouts.slice(0, 5).forEach(payout => {
        console.log(`   ${payout.date} (Day ${payout.day}): $${payout.amount.toFixed(2)} - ${payout.status}`);
      });
    }
    
    if (data.recentPayouts) {
      console.log(`\n⚠️  OLD Recent Payouts still exists: ${data.recentPayouts.length} items`);
    }
    
  } catch (error) {
    console.error('❌ API Test Error:', error.response?.data || error.message);
  }
}

testNewAPI();
