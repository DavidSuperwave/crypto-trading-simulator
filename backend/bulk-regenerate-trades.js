const axios = require('axios');
const database = require('./database');

/**
 * Bulk Trade Regeneration Script
 * Regenerates trades for all existing users with new enhanced trade counts
 */

const API_BASE_URL = process.env.NODE_ENV === 'production' 
  ? 'https://crypto-trading-simulator-production.up.railway.app/api'
  : 'http://localhost:3001/api';

async function bulkRegeneratetrades() {
  try {
    console.log('🚀 Starting bulk trade regeneration...');
    
    // Get all users from database
    const users = await database.getAllUsers();
    const regularUsers = users.filter(u => u && u.role === 'user');
    
    console.log(`📊 Found ${regularUsers.length} users to regenerate trades for`);
    
    if (regularUsers.length === 0) {
      console.log('❌ No users found to regenerate trades for');
      return;
    }

    const today = new Date().toISOString().split('T')[0];
    const results = {
      success: [],
      errors: [],
      totalProcessed: 0
    };

    // Get admin token (you'll need to provide this)
    const adminEmail = 'admin@example.com'; // Update with actual admin email
    console.log('⚠️  You need to provide admin credentials to run this script');
    console.log('   1. Login as admin to get a token');
    console.log('   2. Set ADMIN_TOKEN environment variable');
    console.log('   3. Run: ADMIN_TOKEN=your_token node bulk-regenerate-trades.js');
    
    const adminToken = process.env.ADMIN_TOKEN;
    if (!adminToken) {
      console.log('❌ No ADMIN_TOKEN provided. Exiting...');
      return;
    }

    // Regenerate trades for each user
    for (let i = 0; i < regularUsers.length; i++) {
      const user = regularUsers[i];
      results.totalProcessed++;
      
      console.log(`🔄 [${i + 1}/${regularUsers.length}] Regenerating trades for ${user.email}...`);
      
      try {
        const response = await axios.post(`${API_BASE_URL}/compound-interest/admin/generate-trades`, {
          userId: user.id,
          date: today
        }, {
          headers: {
            'Authorization': `Bearer ${adminToken}`,
            'Content-Type': 'application/json'
          },
          timeout: 30000 // 30 second timeout
        });

        if (response.data.success) {
          const tradeCount = response.data.result?.dailyTrades?.tradeCount || 0;
          results.success.push({
            userId: user.id,
            email: user.email,
            tradeCount: tradeCount,
            balance: user.balance || 0
          });
          console.log(`✅ ${user.email}: Generated ${tradeCount} trades`);
        } else {
          throw new Error(response.data.message || 'Unknown error');
        }
      } catch (error) {
        results.errors.push({
          userId: user.id,
          email: user.email,
          error: error.message
        });
        console.log(`❌ ${user.email}: ${error.message}`);
      }

      // Small delay to prevent overwhelming the server
      if (i < regularUsers.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 1000)); // 1 second delay
      }
    }

    // Summary report
    console.log('\n📊 BULK REGENERATION SUMMARY:');
    console.log(`✅ Successful: ${results.success.length}`);
    console.log(`❌ Failed: ${results.errors.length}`);
    console.log(`📈 Total Processed: ${results.totalProcessed}`);

    if (results.success.length > 0) {
      console.log('\n🎯 SUCCESS DETAILS:');
      results.success.forEach(s => {
        console.log(`   ${s.email}: ${s.tradeCount} trades (Balance: $${s.balance})`);
      });
    }

    if (results.errors.length > 0) {
      console.log('\n❌ ERROR DETAILS:');
      results.errors.forEach(e => {
        console.log(`   ${e.email}: ${e.error}`);
      });
    }

    // Calculate average trade counts by balance tier
    if (results.success.length > 0) {
      console.log('\n📊 TRADE COUNT BY BALANCE TIER:');
      const tiers = {
        'Under $5K': results.success.filter(s => s.balance < 5000),
        '$5K-$15K': results.success.filter(s => s.balance >= 5000 && s.balance < 15000),
        '$15K-$50K': results.success.filter(s => s.balance >= 15000 && s.balance < 50000),
        '$50K+': results.success.filter(s => s.balance >= 50000)
      };

      Object.entries(tiers).forEach(([tier, users]) => {
        if (users.length > 0) {
          const avgTrades = users.reduce((sum, u) => sum + u.tradeCount, 0) / users.length;
          console.log(`   ${tier}: ${users.length} users, avg ${Math.round(avgTrades)} trades`);
        }
      });
    }

    console.log('\n🚀 Bulk regeneration complete!');
    console.log('💡 Users will now see enhanced trade counts with 5-6+ hours of content');

  } catch (error) {
    console.error('💥 Critical error in bulk regeneration:', error);
  }
}

// Run the script
if (require.main === module) {
  bulkRegeneratetrades()
    .then(() => {
      console.log('Script completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Script failed:', error);
      process.exit(1);
    });
}

module.exports = { bulkRegeneratetrades };