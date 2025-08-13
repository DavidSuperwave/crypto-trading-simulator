const express = require('express');
const bcrypt = require('bcryptjs');
const database = require('../database');
const { authenticateToken } = require('../middleware/auth');
const websocketService = require('../services/websocketService');

const router = express.Router();

// All user routes require authentication
router.use(authenticateToken);

// Get user profile and balance
router.get('/profile', async (req, res) => {
  try {
    const user = await database.getUserById(req.user.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const { password, ...userProfile } = user;
    res.json(userProfile);
  } catch (error) {
    console.error('Profile fetch error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Send funds (deposit) - Creates pending request
router.post('/deposit', async (req, res) => {
  try {
    const { amount, plan, method } = req.body;
    const userId = req.user.id;

    if (!amount || amount <= 0) {
      return res.status(400).json({ error: 'Valid amount is required' });
    }

    // Get user info
    const user = await database.getUserById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Create pending deposit request instead of immediate deposit
    const pendingDeposit = await database.createPendingDeposit({
      userId,
      amount: parseFloat(amount),
      plan: plan || 'basic',
      method: method || 'bank_transfer',
      userEmail: user.email,
      userName: user.email.split('@')[0]
    });

    // Send real-time notification to admins
    websocketService.notifyNewDeposit(pendingDeposit);

    res.status(201).json({
      message: 'Deposit request submitted successfully. Funds will be available once verified by our team.',
      pendingDeposit: {
        id: pendingDeposit.id,
        amount: pendingDeposit.amount,
        plan: pendingDeposit.plan,
        status: pendingDeposit.status,
        createdAt: pendingDeposit.createdAt
      }
    });
  } catch (error) {
    console.error('Deposit request error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Make withdrawal request - Only creates request, doesn't deduct funds
router.post('/withdraw', async (req, res) => {
  try {
    const { amount, method, isForced = false } = req.body;
    const userId = req.user.id;

    if (!amount || amount <= 0) {
      return res.status(400).json({ error: 'Valid amount is required' });
    }

    if (!method) {
      return res.status(400).json({ error: 'Withdrawal method is required' });
    }

    const user = await database.getUserById(userId);
    if (user.balance < amount) {
      return res.status(400).json({ error: 'Insufficient balance' });
    }

    // Get portfolio state to validate available balance (20%)
    let availableBalance = user.balance * 0.2; // Fallback calculation
    let isRiskyWithdrawal = false;
    
    try {
      // Import compound interest simulation for portfolio calculation
      const compoundSim = require('../services/compoundInterestSimulation');
      const positionBalanceManager = require('../services/positionBalanceManager');
      
      // Get compound interest data
      const simulation = await compoundSim.getUserSimulation(userId);
      
      // Calculate base portfolio from deposits + compound interest
      const totalDeposited = user.depositedAmount || user.balance || 0;
      const compoundInterestEarned = user.simulatedInterest || 0;
      const basePortfolioValue = totalDeposited + compoundInterestEarned;
      
      // Get position data (open/closed trading positions)
      const positionData = await positionBalanceManager.getPortfolioSummary(userId);
      
      // Calculate comprehensive portfolio value (base + positions)
      const positionsPL = positionData ? (positionData.totalPortfolioValue - totalDeposited) : 0;
      const totalPortfolioValue = basePortfolioValue + positionsPL;
      
      // Available balance is 20% of total portfolio value
      availableBalance = totalPortfolioValue * 0.2;
      
      console.log(`💰 Withdrawal validation for ${user.email}: Portfolio=$${totalPortfolioValue.toFixed(2)}, Available=$${availableBalance.toFixed(2)} (20%)`);
    } catch (portfolioError) {
      console.log('⚠️ Could not calculate detailed portfolio state, using fallback calculation:', portfolioError.message);
    }

    // Check if withdrawal exceeds available balance (20%)
    if (amount > availableBalance && !isForced) {
      return res.status(400).json({ 
        error: 'Withdrawal amount exceeds available balance',
        details: {
          requestedAmount: amount,
          availableBalance: availableBalance,
          excessAmount: amount - availableBalance,
          requiresForced: true
        }
      });
    }

    // Flag risky withdrawals
    if (amount > availableBalance) {
      isRiskyWithdrawal = true;
    }

    // Create withdrawal request with enhanced data
    const withdrawal = await database.createWithdrawal({
      userId,
      amount: parseFloat(amount),
      method: method,
      status: 'pending',
      userEmail: user.email,
      userName: user.email.split('@')[0],
      isForced: isForced,
      isRisky: isRiskyWithdrawal,
      availableBalanceAtTime: availableBalance,
      notes: isRiskyWithdrawal ? 'FORCED LIQUIDATION - User confirmed risk of up to 70% loss' : null
    });

    // Send real-time notification to admins with risk flag
    websocketService.notifyNewWithdrawal({
      ...withdrawal,
      riskLevel: isRiskyWithdrawal ? 'HIGH' : 'NORMAL'
    });

    const message = isRiskyWithdrawal 
      ? 'FORCED withdrawal request submitted. This may result in position liquidation and potential losses. Funds will be processed within 5-7 business days.'
      : 'Withdrawal request submitted successfully. Funds will be processed within 5-7 business days.';

    res.status(201).json({
      message,
      withdrawal: {
        id: withdrawal.id,
        amount: withdrawal.amount,
        method: withdrawal.method,
        status: withdrawal.status,
        isForced: withdrawal.isForced,
        isRisky: withdrawal.isRisky,
        createdAt: withdrawal.createdAt
      }
    });
  } catch (error) {
    console.error('Withdrawal request error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get user transactions
router.get('/transactions', async (req, res) => {
  try {
    const userId = req.user.id;
    const transactions = await database.getTransactionsByUserId(userId);
    res.json(transactions);
  } catch (error) {
    console.error('Transactions fetch error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get user withdrawals
router.get('/withdrawals', async (req, res) => {
  try {
    const userId = req.user.id;
    const withdrawals = await database.getWithdrawalsByUserId(userId);
    res.json(withdrawals);
  } catch (error) {
    console.error('Withdrawals fetch error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get user pending deposits
router.get('/pending-deposits', async (req, res) => {
  try {
    const userId = req.user.id;
    const pendingDeposits = await database.getPendingDepositsByUserId(userId);
    
    res.json({
      pendingDeposits: pendingDeposits.map(d => ({
        id: d.id,
        amount: d.amount,
        plan: d.plan,
        method: d.method,
        status: d.status,
        createdAt: d.createdAt,
        updatedAt: d.updatedAt
      }))
    });
  } catch (error) {
    console.error('Get pending deposits error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Calculate and add interest (simulated AI trading gains)
router.post('/calculate-interest', async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await database.getUserById(userId);

    if (!user || user.balance <= 0) {
      return res.status(400).json({ error: 'No balance to calculate interest on' });
    }

    // Simulate AI trading interest (random between 0.1% to 2% daily)
    const interestRate = (Math.random() * 1.9 + 0.1) / 100; // 0.1% to 2%
    const interestAmount = user.balance * interestRate;

    // Create interest transaction
    const transaction = await database.createTransaction({
      type: 'interest',
      amount: interestAmount,
      userId,
      status: 'completed',
      description: `AI Trading Interest (${(interestRate * 100).toFixed(2)}%)`
    });

    // Update user balance and total interest
    const newBalance = user.balance + interestAmount;
    const newTotalInterest = user.totalInterest + interestAmount;
    await database.updateUser(userId, { 
      balance: newBalance, 
      totalInterest: newTotalInterest 
    });

    res.json({
      message: 'Interest calculated and added',
      interestAmount,
      interestRate: (interestRate * 100).toFixed(2) + '%',
      newBalance,
      totalInterest: newTotalInterest
    });
  } catch (error) {
    console.error('Interest calculation error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Change password
router.put('/change-password', async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user.id;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Current password and new password are required' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'New password must be at least 6 characters long' });
    }

    // Get user
    const user = await database.getUserById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Verify current password
    const isValidPassword = await bcrypt.compare(currentPassword, user.password);
    if (!isValidPassword) {
      return res.status(400).json({ error: 'Current password is incorrect' });
    }

    // Hash new password
    const saltRounds = 10;
    const hashedNewPassword = await bcrypt.hash(newPassword, saltRounds);

    // Update password
    await database.updateUser(userId, { password: hashedNewPassword });

    res.json({ message: 'Password changed successfully' });
  } catch (error) {
    console.error('Password change error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;