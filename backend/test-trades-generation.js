const CompoundInterestSimulation = require('./services/compoundInterestSimulation');
const fs = require('fs');

const sim = new CompoundInterestSimulation();

async function initializeAndGenerateTradesForUser() {
  try {
    console.log('🎯 Initializing simulation for a test user...');
    
    // Get users
    const users = JSON.parse(fs.readFileSync('./data/users.json', 'utf8'));
    const testUser = users.find(u => u.balance && u.balance > 1000); // Find user with decent balance
    
    if (!testUser) {
      console.log('❌ No users with sufficient balance found');
      console.log('Available users:', users.map(u => ({ email: u.email, balance: u.balance })));
      return;
    }
    
    console.log('👤 Test user:', testUser.email, 'Balance:', testUser.balance);
    
    // Initialize simulation 
    console.log('🔄 Initializing simulation...');
    const initResult = await sim.initializeSimulation(testUser.id, testUser.balance);
    
    if (initResult.success) {
      console.log('✅ Simulation initialized successfully');
      
      // Now generate daily trades
      console.log('🎯 Generating daily trades...');
      const tradesResult = await sim.generateDailyTrades(testUser.id);
      
      if (tradesResult.success) {
        console.log('✅ Generated', tradesResult.dailyTrades.tradeCount, 'trades');
        console.log('📊 Sample trades:');
        tradesResult.dailyTrades.trades.slice(0, 5).forEach((trade, i) => {
          console.log(`  ${i+1}. ${trade.timestamp} ${trade.symbol} ${trade.type} $${trade.profitLoss.toFixed(2)}`);
        });
        
        console.log('🕒 Trade time range:', 
          tradesResult.dailyTrades.trades[0]?.timestamp,
          'to',
          tradesResult.dailyTrades.trades[tradesResult.dailyTrades.trades.length - 1]?.timestamp
        );
      } else {
        console.log('❌ Failed to generate trades:', tradesResult.message);
      }
    } else {
      console.log('❌ Failed to initialize simulation:', initResult.message);
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
  }
}

initializeAndGenerateTradesForUser();