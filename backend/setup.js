const bcrypt = require('bcryptjs');
const database = require('./database');

async function setupDemoData() {
  console.log('🚀 Setting up demo data for CryptoSim AI...\n');

  try {
    // Create admin user
    const adminPassword = await bcrypt.hash('admin123', 12);
    const adminUser = database.createUser({
      email: 'admin@cryptosim.com',
      password: adminPassword,
      role: 'admin',
      balance: 0,
      totalInterest: 0
    });
    console.log('✅ Created admin user: admin@cryptosim.com / admin123');

    // Create demo user
    const userPassword = await bcrypt.hash('user123', 12);
    const demoUser = database.createUser({
      email: 'user@cryptosim.com',
      password: userPassword,
      role: 'user',
      balance: 5000,
      totalInterest: 245.67
    });
    console.log('✅ Created demo user: user@cryptosim.com / user123');

    // Create sample transactions for demo user
    const sampleTransactions = [
      {
        type: 'deposit',
        amount: 5000,
        userId: demoUser.id,
        status: 'completed',
        description: 'Initial deposit'
      },
      {
        type: 'interest',
        amount: 125.50,
        userId: demoUser.id,
        status: 'completed',
        description: 'AI Trading Interest (2.51%)'
      },
      {
        type: 'interest',
        amount: 89.20,
        userId: demoUser.id,
        status: 'completed',
        description: 'AI Trading Interest (1.78%)'
      },
      {
        type: 'interest',
        amount: 30.97,
        userId: demoUser.id,
        status: 'completed',
        description: 'AI Trading Interest (0.62%)'
      }
    ];

    sampleTransactions.forEach(transaction => {
      database.createTransaction(transaction);
    });
    console.log('✅ Created sample transactions');

    // Create sample demo requests
    const sampleDemos = [
      {
        name: 'John Smith',
        email: 'john.smith@techcorp.com',
        company: 'TechCorp Solutions',
        phone: '+1-555-0123',
        message: 'Interested in AI trading solutions for our investment fund.',
        status: 'requested'
      },
      {
        name: 'Sarah Johnson',
        email: 'sarah.j@financeplus.com',
        company: 'Finance Plus',
        phone: '+1-555-0456',
        message: 'Looking for automated trading platform for our clients.',
        status: 'scheduled'
      },
      {
        name: 'Mike Wilson',
        email: 'mike.wilson@crypto-invest.io',
        company: 'Crypto Invest',
        phone: '+1-555-0789',
        message: 'Want to explore AI-powered crypto trading for institutional clients.',
        status: 'completed'
      }
    ];

    sampleDemos.forEach(demo => {
      database.createDemo(demo);
    });
    console.log('✅ Created sample demo requests');

    // Create sample withdrawal request
    database.createWithdrawal({
      userId: demoUser.id,
      amount: 1000,
      status: 'pending'
    });
    console.log('✅ Created sample withdrawal request');

    console.log('\n🎉 Demo data setup complete!');
    console.log('\n📱 Access URLs:');
    console.log('   Demo Dashboard: http://localhost:3000/demo');
    console.log('   User Dashboard: http://localhost:3000/user');
    console.log('   Admin Dashboard: http://localhost:3000/admin');
    console.log('   Login Page: http://localhost:3000/login');

    console.log('\n🔐 Demo Credentials:');
    console.log('   Admin: admin@cryptosim.com / admin123');
    console.log('   User:  user@cryptosim.com / user123');

    console.log('\n💡 Next Steps:');
    console.log('   1. Start the backend: npm run dev');
    console.log('   2. Start the frontend: cd ../frontend && npm start');
    console.log('   3. Visit http://localhost:3000/demo to see the live demo');

  } catch (error) {
    console.error('❌ Error setting up demo data:', error);
    
    // Check if users already exist
    if (error.message && error.message.includes('already exists')) {
      console.log('\n⚠️  Demo users already exist. You can still use the credentials above.');
    }
  }
}

// Run setup if called directly
if (require.main === module) {
  setupDemoData().then(() => {
    process.exit(0);
  }).catch((error) => {
    console.error('Setup failed:', error);
    process.exit(1);
  });
}

module.exports = { setupDemoData };