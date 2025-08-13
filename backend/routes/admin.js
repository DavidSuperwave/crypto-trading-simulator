const express = require('express');
const router = express.Router();
const database = require('../database');
// Note: interestService (real-time system) removed during migration to compound interest system
const CompoundInterestSimulation = require('../services/compoundInterestSimulation');
const scheduler = require('../services/scheduler');
const websocketService = require('../services/websocketService');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

// Apply authentication middleware to all admin routes
router.use(authenticateToken);
router.use(requireAdmin);

// Get dashboard overview
router.get('/dashboard', async (req, res) => {
  try {
    // Admin check is now handled by requireAdmin middleware

    const users = await database.getAllUsers();
    const transactions = await database.getAllTransactions();
    const withdrawals = await database.getAllWithdrawals();
    const demos = await database.getAllDemos();
    const pendingDeposits = await database.getPendingDeposits();

    // Calculate overview statistics with safety checks
    const safeUsers = Array.isArray(users) ? users : [];
    const safeTransactions = Array.isArray(transactions) ? transactions : [];
    const safeWithdrawals = Array.isArray(withdrawals) ? withdrawals : [];
    const safeDemos = Array.isArray(demos) ? demos : [];
    const safePendingDeposits = Array.isArray(pendingDeposits) ? pendingDeposits : [];
    
    const totalUsers = safeUsers.filter(u => u && u.role === 'user').length;
    
    // Calculate total balance from pending + approved deposits
    const totalBalance = safePendingDeposits
      .filter(d => d && (d.status === 'pending' || d.status === 'approved'))
      .reduce((sum, deposit) => sum + (parseFloat(deposit.amount) || 0), 0);
    
    const pendingWithdrawals = safeWithdrawals.filter(w => w && w.status === 'pending').length;
    const pendingDemos = safeDemos.filter(d => d && d.status === 'requested').length;
    const pendingDepositsCount = safePendingDeposits.filter(d => d && d.status === 'pending').length;
    const totalTransactions = safeTransactions.length;

    // Calculate signup metrics with safety checks
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const regularUsers = safeUsers.filter(u => u && u.role === 'user');
    const dailySignups = regularUsers.filter(u => {
      try {
        if (!u.createdAt) return false;
        const userDate = new Date(u.createdAt);
        return !isNaN(userDate.getTime()) && userDate >= today;
      } catch (error) {
        return false;
      }
    }).length;

    const weeklySignups = regularUsers.filter(u => {
      try {
        if (!u.createdAt) return false;
        const userDate = new Date(u.createdAt);
        return !isNaN(userDate.getTime()) && userDate >= weekAgo;
      } catch (error) {
        return false;
      }
    }).length;

    // Get pending messages count (messages from users to admin that are unread)
    let pendingMessages = 0;
    try {
      const allChatMessages = await database.getAllChatMessages();
      if (Array.isArray(allChatMessages)) {
        pendingMessages = allChatMessages.filter(msg => 
          msg && msg.senderType === 'user' && !msg.isRead
        ).length;
      }
    } catch (chatError) {
      console.error('Error fetching chat messages for dashboard:', chatError);
      // Set pendingMessages to 0 if chat messages can't be fetched
      pendingMessages = 0;
    }

    const overview = {
      totalUsers,
      totalBalance: totalBalance.toFixed(2),
      pendingWithdrawals,
      pendingDemos,
      pendingDeposits: pendingDepositsCount,
      totalTransactions,
      dailySignups,
      weeklySignups,
      pendingMessages
    };

    res.json({ overview });
  } catch (error) {
    console.error('Get dashboard overview error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get all pending deposits
router.get('/pending-deposits', async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const pendingDeposits = await database.getPendingDeposits();
    
    res.json({
      pendingDeposits: pendingDeposits.map(d => ({
        id: d.id,
        userId: d.userId,
        userEmail: d.userEmail,
        userName: d.userName,
        amount: d.amount,
        plan: d.plan,
        method: d.method,
        status: d.status,
        createdAt: d.createdAt,
        updatedAt: d.updatedAt,
        notes: d.notes
      }))
    });
  } catch (error) {
    console.error('Get pending deposits error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Approve pending deposit
router.put('/pending-deposits/:id/approve', async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const { id } = req.params;
    const adminId = req.user.id;

    const approvedDeposit = await database.approvePendingDeposit(id, adminId);
    
    if (!approvedDeposit) {
      return res.status(404).json({ error: 'Pending deposit not found or already processed' });
    }

    // Send real-time notification
    websocketService.notifyDepositStatusUpdate(approvedDeposit);

    res.json({
      message: 'Deposit approved successfully',
      deposit: approvedDeposit
    });
  } catch (error) {
    console.error('Approve deposit error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Reject pending deposit
router.put('/pending-deposits/:id/reject', async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const { id } = req.params;
    const { notes } = req.body;
    const adminId = req.user.id;

    const rejectedDeposit = await database.rejectPendingDeposit(id, adminId, notes);
    
    if (!rejectedDeposit) {
      return res.status(404).json({ error: 'Pending deposit not found' });
    }

    // Send real-time notification
    websocketService.notifyDepositStatusUpdate(rejectedDeposit);

    res.json({
      message: 'Deposit rejected',
      deposit: rejectedDeposit
    });
  } catch (error) {
    console.error('Reject deposit error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get all pending withdrawals
router.get('/pending-withdrawals', async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const withdrawals = await database.getAllWithdrawals();
    const pendingWithdrawals = withdrawals.filter(w => w.status === 'pending');
    
    res.json({
      pendingWithdrawals: pendingWithdrawals.map(w => ({
        id: w.id,
        userId: w.userId,
        userEmail: w.userEmail || 'N/A',
        userName: w.userName || 'N/A',
        amount: w.amount,
        method: w.method || 'bank',
        status: w.status,
        createdAt: w.createdAt,
        updatedAt: w.updatedAt
      }))
    });
  } catch (error) {
    console.error('Get pending withdrawals error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Approve withdrawal request
router.put('/pending-withdrawals/:id/approve', async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const { id } = req.params;
    const adminId = req.user.id;

    const withdrawal = await database.getWithdrawalById(id);
    if (!withdrawal || withdrawal.status !== 'pending') {
      return res.status(404).json({ error: 'Pending withdrawal not found or already processed' });
    }

    // Deduct funds from user account
    const user = await database.getUserById(withdrawal.userId);
    if (!user || user.balance < withdrawal.amount) {
      return res.status(400).json({ error: 'Insufficient user balance' });
    }

    const newBalance = user.balance - withdrawal.amount;
    await database.updateUser(withdrawal.userId, { balance: newBalance });

    // Update withdrawal status
    const updatedWithdrawal = await database.updateWithdrawal(id, {
      status: 'approved',
      processedAt: new Date().toISOString(),
      processedBy: adminId
    });

    // Create transaction record
    await database.createTransaction({
      type: 'withdrawal',
      amount: withdrawal.amount,
      userId: withdrawal.userId,
      status: 'completed',
      withdrawalId: id
    });

    // Send real-time notification
    websocketService.notifyWithdrawalStatusUpdate(updatedWithdrawal);

    res.json({
      message: 'Withdrawal approved successfully',
      withdrawal: updatedWithdrawal,
      newUserBalance: newBalance
    });
  } catch (error) {
    console.error('Approve withdrawal error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Reject withdrawal request
router.put('/pending-withdrawals/:id/reject', async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const { id } = req.params;
    const { notes } = req.body;
    const adminId = req.user.id;

    const updatedWithdrawal = await database.updateWithdrawal(id, {
      status: 'rejected',
      processedAt: new Date().toISOString(),
      processedBy: adminId,
      notes: notes || ''
    });

    if (!updatedWithdrawal) {
      return res.status(404).json({ error: 'Withdrawal request not found' });
    }

    // Send real-time notification
    websocketService.notifyWithdrawalStatusUpdate(updatedWithdrawal);

    res.json({
      message: 'Withdrawal rejected',
      withdrawal: updatedWithdrawal
    });
  } catch (error) {
    console.error('Reject withdrawal error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update withdrawal status (generic endpoint for frontend)
router.put('/withdrawals/:id', async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const { id } = req.params;
    const { status } = req.body;
    const adminId = req.user.id;

    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status. Must be approved or rejected' });
    }

    const withdrawal = await database.getWithdrawalById(id);
    if (!withdrawal || withdrawal.status !== 'pending') {
      return res.status(404).json({ error: 'Pending withdrawal not found or already processed' });
    }

    if (status === 'approved') {
      // Deduct funds from user account
      const user = await database.getUserById(withdrawal.userId);
      if (!user || user.balance < withdrawal.amount) {
        return res.status(400).json({ error: 'Insufficient user balance' });
      }

      const newBalance = user.balance - withdrawal.amount;
      await database.updateUser(withdrawal.userId, { balance: newBalance });

      // Create transaction record
      await database.createTransaction({
        type: 'withdrawal',
        amount: withdrawal.amount,
        userId: withdrawal.userId,
        status: 'completed',
        withdrawalId: id
      });
    }

    // Update withdrawal status
    const updatedWithdrawal = await database.updateWithdrawal(id, {
      status: status,
      processedAt: new Date().toISOString(),
      processedBy: adminId
    });

    res.json({
      message: `Withdrawal ${status} successfully`,
      withdrawal: updatedWithdrawal
    });
  } catch (error) {
    console.error('Update withdrawal error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get all users
router.get('/users', async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const users = await database.getAllUsers();
    res.json(users);
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create new user
router.post('/users', async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const { email, password, role } = req.body;

    if (!email || !password || !role) {
      return res.status(400).json({ error: 'Email, password, and role are required' });
    }

    if (!['admin', 'user'].includes(role)) {
      return res.status(400).json({ error: 'Role must be either "admin" or "user"' });
    }

    // Check if user already exists
    const existingUser = await database.getUserByEmail(email);
    if (existingUser) {
      return res.status(400).json({ error: 'User with this email already exists' });
    }

    // Create the user
    const bcrypt = require('bcryptjs');
    const hashedPassword = await bcrypt.hash(password, 12);
    
    const newUser = await database.createUser({
      email,
      password: hashedPassword,
      role,
      balance: 0,
      totalInterest: 0
    });

    // Return user without password
    const { password: _, ...userWithoutPassword } = newUser;
    
    res.status(201).json({
      message: 'User created successfully',
      user: userWithoutPassword
    });
  } catch (error) {
    console.error('Create user error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete user
router.delete('/users/:id', async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const { id } = req.params;

    // Prevent admin from deleting themselves
    if (id === req.user.id) {
      return res.status(400).json({ error: 'Cannot delete your own account' });
    }

    const user = await database.getUserById(id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Delete the user
    const deleted = await database.deleteUser(id);
    if (!deleted) {
      return res.status(500).json({ error: 'Failed to delete user' });
    }

    res.json({
      message: 'User deleted successfully',
      deletedUserId: id
    });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get all transactions
router.get('/transactions', async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const transactions = await database.getAllTransactions();
    res.json(transactions);
  } catch (error) {
    console.error('Get transactions error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get all withdrawals
router.get('/withdrawals', async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const withdrawals = await database.getAllWithdrawals();
    res.json(withdrawals);
  } catch (error) {
    console.error('Get withdrawals error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get all demo requests
router.get('/demos', async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const demos = await database.getAllDemos();
    res.json(demos);
  } catch (error) {
    console.error('Get demos error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update demo status
router.put('/demos/:id', async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const { id } = req.params;
    const updates = req.body;

    const updatedDemo = await database.updateDemo(id, updates);
    if (!updatedDemo) {
      return res.status(404).json({ error: 'Demo request not found' });
    }

    res.json(updatedDemo);
  } catch (error) {
    console.error('Update demo error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Interest Management Routes

// Get interest statistics and history
// Get interest processing statistics (migrated to compound interest system)
router.get('/interest/stats', async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const compoundSim = new CompoundInterestSimulation();
    
    // Get stats from compound interest system
    const users = await database.getAllUsers();
    const activeSimulations = users.filter(user => user.simulationActive).length;
    
    // Get recent transactions for compound interest
    const transactions = await database.getTransactions();
    const recentPayments = transactions
      .filter(t => t.type === 'interest' && t.metadata?.simulationType === 'compound_interest')
      .slice(-20)
      .reverse();

    const stats = {
      activeSimulations,
      totalUsers: users.length,
      recentPayments: recentPayments.length,
      systemType: 'compound_interest'
    };

    res.json({
      stats,
      recentPayments,
      migrationNote: 'Stats now from compound interest system (real-time system removed)'
    });
  } catch (error) {
    console.error('Get interest stats error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get all interest payments (migrated to compound interest system)
router.get('/interest/payments', async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    // Get all compound interest payments from transactions
    const transactions = await database.getTransactions();
    const payments = transactions
      .filter(t => t.type === 'interest' && t.metadata?.simulationType === 'compound_interest')
      .map(t => ({
        id: t.id,
        userId: t.userId,
        amount: t.amount,
        date: t.createdAt,
        description: t.description,
        systemType: 'compound_interest'
      }));

    res.json({
      payments,
      migrationNote: 'Payments now from compound interest system (real-time system removed)'
    });
  } catch (error) {
    console.error('Get interest payments error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Manually trigger interest processing (migrated to compound interest system)
router.post('/interest/trigger', async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    console.log(`Admin ${req.user.email} manually triggered compound interest processing`);
    
    // Use scheduler to trigger compound interest processing
    const results = await scheduler.runDailyInterest();
    
    res.json({
      message: 'Compound interest processing completed successfully',
      results,
      migrationNote: 'Now using compound interest system (real-time system removed)'
    });
  } catch (error) {
    console.error('Manual interest trigger error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get scheduler information
router.get('/scheduler/status', (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const tasks = scheduler.getTasksInfo();
    res.json({
      tasks,
      environment: process.env.NODE_ENV || 'development',
      serverTime: new Date().toISOString()
    });
  } catch (error) {
    console.error('Get scheduler status error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Manually trigger scheduled tasks
router.post('/scheduler/trigger/:taskName', async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const { taskName } = req.params;
    console.log(`Admin ${req.user.email} manually triggered task: ${taskName}`);
    
    const result = await scheduler.triggerTask(taskName);
    
    res.json({
      message: `Task ${taskName} completed successfully`,
      result
    });
  } catch (error) {
    console.error(`Manual task trigger error (${req.params.taskName}):`, error);
    res.status(500).json({ 
      error: error.message || 'Internal server error' 
    });
  }
});

// Get scheduler status and health
// Get detailed simulation data for admin dashboard
router.get('/simulation-data', async (req, res) => {
  try {
    console.log('📊 Admin requesting simulation data...');
    
    // Get all users with their simulation data
    const users = await database.getAllUsers();
    const simulationPlans = database.readFile('data/simulation_plans.json') || [];
    const simulatedTrades = database.readFile('data/simulated_trades.json') || [];
    
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const oneYearAgo = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
    
    const simulationData = users.filter(user => user.role === 'user').map(user => {
      const userPlan = simulationPlans.find(plan => plan.userId === user.id);
      const userTrades = simulatedTrades.filter(trade => trade.userId === user.id);
      
      // Calculate timeframe earnings from PROJECTED simulation plan (not actual trades)
      let sevenDayEarnings = 0;
      let thirtyDayEarnings = 0; 
      let yearEarnings = 0;
      
      if (userPlan && userPlan.months) {
        // 7-Day: First 7 daily targets from first month
        const firstMonth = userPlan.months[0];
        if (firstMonth && firstMonth.dailyTargets) {
          sevenDayEarnings = firstMonth.dailyTargets.slice(0, 7).reduce((sum, day) => sum + day.targetAmount, 0);
        }
        
        // 30-Day: First month target amount
        thirtyDayEarnings = firstMonth ? firstMonth.targetAmount : 0;
        
        // 12-Month: Total projected return
        yearEarnings = userPlan.totalProjectedReturn || 0;
      }
      
      return {
        ...user,
        simulationPlan: userPlan,
        tradeStats: {
          totalTrades: userTrades.length,
          sevenDayEarnings,
          thirtyDayEarnings,
          yearEarnings,
          sevenDayTrades: userTrades.filter(trade => new Date(trade.createdAt) >= sevenDaysAgo).length,
          thirtyDayTrades: userTrades.filter(trade => new Date(trade.createdAt) >= thirtyDaysAgo).length,
          yearTrades: userTrades.filter(trade => new Date(trade.createdAt) >= oneYearAgo).length
        }
      };
    });
    
    // Calculate platform totals from projected earnings
    const platformStats = {
      totalActiveSimulations: simulationData.filter(user => user.balance > 0).length,
      totalUsers: simulationData.length,
      sevenDayTotalEarnings: simulationData.reduce((sum, user) => sum + user.tradeStats.sevenDayEarnings, 0),
      thirtyDayTotalEarnings: simulationData.reduce((sum, user) => sum + user.tradeStats.thirtyDayEarnings, 0),
      yearTotalEarnings: simulationData.reduce((sum, user) => sum + user.tradeStats.yearEarnings, 0),
      totalTrades: simulationData.reduce((sum, user) => sum + (user.tradeStats.totalTrades || 0), 0)
    };
    
    console.log(`✅ Returning simulation data for ${simulationData.length} users`);
    console.log(`📊 Platform stats:`, platformStats);
    
    res.json({
      users: simulationData,
      platformStats,
      lastUpdated: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching simulation data:', error);
    res.status(500).json({ error: 'Failed to fetch simulation data' });
  }
});

router.get('/scheduler/status', async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const health = scheduler.getHealth();
    
    res.json({
      scheduler: health,
      system: {
        nodeVersion: process.version,
        platform: process.platform,
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Scheduler status error:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      details: error.message 
    });
  }
});

// Get detailed task information
router.get('/scheduler/tasks', async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const taskStatus = scheduler.getTaskStatus();
    
    res.json({
      tasks: taskStatus,
      summary: {
        totalTasks: Object.keys(taskStatus).length,
        runningTasks: Object.values(taskStatus).filter(task => task.isRunning).length,
        environment: process.env.NODE_ENV || 'development'
      }
    });
  } catch (error) {
    console.error('Scheduler tasks error:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      details: error.message 
    });
  }
});

// Manual scheduler task trigger (for testing)
router.post('/scheduler/trigger/:taskName', async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const { taskName } = req.params;
    
    // Only allow specific tasks for security
    const allowedTasks = ['daily-interest', 'weekly-cleanup'];
    if (!allowedTasks.includes(taskName)) {
      return res.status(400).json({ 
        error: 'Invalid task name',
        allowed: allowedTasks 
      });
    }

    console.log(`📋 Admin ${req.user.email} manually triggering task: ${taskName}`);

    let result;
    if (taskName === 'daily-interest') {
      result = await scheduler.runDailyInterest();
    } else if (taskName === 'weekly-cleanup') {
      result = await scheduler.runWeeklyCleanup();
    }

    res.json({
      success: true,
      message: `Task ${taskName} executed successfully`,
      triggeredBy: req.user.email,
      timestamp: new Date().toISOString(),
      result
    });

  } catch (error) {
    console.error(`Manual scheduler trigger error (${req.params.taskName}):`, error);
    res.status(500).json({ 
      error: error.message || 'Internal server error',
      taskName: req.params.taskName
    });
  }
});

module.exports = router;