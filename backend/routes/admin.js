const express = require('express');
const router = express.Router();
const database = require('../database');
const interestService = require('../services/interestService');
const scheduler = require('../services/scheduler');

// Get dashboard overview
router.get('/dashboard', async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const users = await database.getAllUsers();
    const transactions = await database.getAllTransactions();
    const withdrawals = await database.getAllWithdrawals();
    const demos = await database.getAllDemos();
    const pendingDeposits = await database.getPendingDeposits();

    // Calculate overview statistics
    const totalUsers = users.filter(u => u.role === 'user').length;
    
    // Calculate total balance from pending + approved deposits
    const totalBalance = pendingDeposits
      .filter(d => d.status === 'pending' || d.status === 'approved')
      .reduce((sum, deposit) => sum + (deposit.amount || 0), 0);
    
    const pendingWithdrawals = withdrawals.filter(w => w.status === 'pending').length;
    const pendingDemos = demos.filter(d => d.status === 'requested').length;
    const pendingDepositsCount = pendingDeposits.filter(d => d.status === 'pending').length;
    const totalTransactions = transactions.length;

    // Calculate signup metrics
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const regularUsers = users.filter(u => u.role === 'user');
    const dailySignups = regularUsers.filter(u => {
      const userDate = new Date(u.createdAt);
      return userDate >= today;
    }).length;

    const weeklySignups = regularUsers.filter(u => {
      const userDate = new Date(u.createdAt);
      return userDate >= weekAgo;
    }).length;

    // Get pending messages count (messages from users to admin that are unread)
    const allChatMessages = await database.getAllChatMessages();
    const pendingMessages = allChatMessages.filter(msg => 
      msg.senderType === 'user' && !msg.isRead
    ).length;

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
router.get('/interest/stats', (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const stats = interestService.getInterestStats();
    const recentPayments = interestService.getAllInterestPayments()
      .slice(-20) // Last 20 payments
      .reverse(); // Most recent first

    res.json({
      stats,
      recentPayments
    });
  } catch (error) {
    console.error('Get interest stats error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get all interest payments
router.get('/interest/payments', (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const payments = interestService.getAllInterestPayments();
    res.json(payments);
  } catch (error) {
    console.error('Get interest payments error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Manually trigger interest processing (for testing)
router.post('/interest/trigger', async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    console.log(`Admin ${req.user.email} manually triggered interest processing`);
    const results = await interestService.triggerManualInterest();
    
    res.json({
      message: 'Interest processing completed successfully',
      results
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

module.exports = router;