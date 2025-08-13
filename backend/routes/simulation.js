const express = require('express');
const router = express.Router();
const MonthlySimulationService = require('../services/monthlySimulationService');
const database = require('../database');
const { authenticateToken } = require('../middleware/auth');

const simulationService = new MonthlySimulationService();

/**
 * Simulation Management API Routes
 * Provides endpoints for managing the monthly simulation system
 */

// =========================================
// USER ENDPOINTS
// =========================================

/**
 * GET /api/simulation/status
 * Get current simulation status for authenticated user
 */
router.get('/status', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await database.getUserById(userId);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1;

    // Get current monthly target
    const monthlyTarget = await simulationService.getMonthlyTarget(userId, year, month);
    
    // Get recent daily records
    const recentRecords = await getRecentDailyRecords(userId, 7); // Last 7 days
    
    // Calculate current month progress
    const totalSimulatedInterest = await simulationService.calculateTotalSimulatedInterest(userId);

    const response = {
      user: {
        id: user.id,
        email: user.email,
        depositedAmount: user.depositedAmount || user.balance || 0,
        simulatedInterest: totalSimulatedInterest,
        totalBalance: (user.depositedAmount || user.balance || 0) + totalSimulatedInterest,
        simulationActive: user.simulationActive !== false
      },
      currentMonth: {
        target: monthlyTarget,
        progress: monthlyTarget ? {
          targetPercentage: monthlyTarget.targetPercentage,
          targetAmount: monthlyTarget.targetAmount,
          achievedAmount: monthlyTarget.achievedAmount || 0,
          progressPercentage: monthlyTarget.targetAmount > 0 ? 
            ((monthlyTarget.achievedAmount || 0) / monthlyTarget.targetAmount * 100) : 0,
          daysInMonth: monthlyTarget.daysInMonth,
          daysRemaining: new Date(year, month, 0).getDate() - now.getDate()
        } : null
      },
      recentActivity: recentRecords,
      lastUpdate: user.lastSimulationUpdate
    };

    res.json(response);

  } catch (error) {
    console.error('Error getting simulation status:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/simulation/trades
 * Get simulated trades for today
 */
router.get('/trades', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const date = new Date().toISOString().split('T')[0];

    const dailyRecord = await simulationService.getDailyRecord(userId, date);
    
    if (!dailyRecord) {
      return res.status(404).json({ error: 'No trading data found for this date' });
    }

    // Get trades for this daily record
    const trades = await getTradesForDailyRecord(dailyRecord.id);

    res.json({
      date: date,
      summary: {
        totalEarnings: dailyRecord.achievedAmount || 0,
        numberOfTrades: dailyRecord.numberOfTrades || 0,
        winRate: dailyRecord.winRate || 0,
        largestWin: dailyRecord.largestWin || 0,
        largestLoss: dailyRecord.largestLoss || 0,
        status: dailyRecord.status
      },
      trades: trades
    });

  } catch (error) {
    console.error('Error getting trades:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/simulation/trades/:date
 * Get simulated trades for a specific date
 */
router.get('/trades/:date', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const date = req.params.date;

    // Validate date format
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return res.status(400).json({ error: 'Invalid date format. Use YYYY-MM-DD' });
    }

    const dailyRecord = await simulationService.getDailyRecord(userId, date);
    
    if (!dailyRecord) {
      return res.status(404).json({ error: 'No trading data found for this date' });
    }

    // Get trades for this daily record
    const trades = await getTradesForDailyRecord(dailyRecord.id);

    res.json({
      date: date,
      summary: {
        totalEarnings: dailyRecord.achievedAmount || 0,
        numberOfTrades: dailyRecord.numberOfTrades || 0,
        winRate: dailyRecord.winRate || 0,
        largestWin: dailyRecord.largestWin || 0,
        largestLoss: dailyRecord.largestLoss || 0,
        status: dailyRecord.status
      },
      trades: trades
    });

  } catch (error) {
    console.error('Error getting trades:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * POST /api/simulation/initialize
 * Initialize monthly simulation for current user
 */
router.post('/initialize', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await database.getUserById(userId);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const currentBalance = user.depositedAmount || user.balance || 0;
    
    if (currentBalance < 100) {
      return res.status(400).json({ 
        error: 'Minimum balance of $100 required for simulation',
        currentBalance: currentBalance
      });
    }

    const monthlyTarget = await simulationService.initializeMonthlySimulation(userId, currentBalance);
    
    if (!monthlyTarget) {
      return res.status(400).json({ error: 'Failed to initialize simulation or already exists' });
    }

    // Update user simulation status
    await database.updateUser(userId, {
      currentMonthlyTarget: monthlyTarget.targetPercentage,
      simulationActive: true,
      lastSimulationUpdate: new Date().toISOString()
    });

    res.status(201).json({
      message: 'Monthly simulation initialized successfully',
      monthlyTarget: {
        targetPercentage: monthlyTarget.targetPercentage,
        targetAmount: monthlyTarget.targetAmount,
        daysInMonth: monthlyTarget.daysInMonth,
        startingBalance: monthlyTarget.startingBalance
      }
    });

  } catch (error) {
    console.error('Error initializing simulation:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// =========================================
// ADMIN ENDPOINTS
// =========================================

/**
 * GET /api/simulation/admin/overview
 * Get system-wide simulation overview (admin only)
 */
router.get('/admin/overview', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1;

    // Get all active users
    const users = await database.getAllUsers();
    const activeUsers = users.filter(user => 
      user.role === 'user' && 
      user.simulationActive !== false &&
      (user.depositedAmount || user.balance || 0) >= 100
    );

    // Get monthly targets for current month
    const monthlyTargets = await getAllMonthlyTargets(year, month);
    
    // Calculate system totals
    const totalDeposited = activeUsers.reduce((sum, user) => 
      sum + (user.depositedAmount || user.balance || 0), 0);
    
    const totalSimulatedInterest = await calculateTotalSystemSimulatedInterest();
    
    const overview = {
      systemStats: {
        totalActiveUsers: activeUsers.length,
        totalDeposited: totalDeposited,
        totalSimulatedInterest: totalSimulatedInterest,
        totalSystemBalance: totalDeposited + totalSimulatedInterest,
        averageMonthlyTarget: monthlyTargets.length > 0 ? 
          monthlyTargets.reduce((sum, target) => sum + target.targetPercentage, 0) / monthlyTargets.length : 0
      },
      currentMonth: {
        year: year,
        month: month,
        activeTargets: monthlyTargets.length,
        totalTargetAmount: monthlyTargets.reduce((sum, target) => sum + target.targetAmount, 0),
        totalAchievedAmount: monthlyTargets.reduce((sum, target) => sum + (target.achievedAmount || 0), 0)
      },
      users: activeUsers.map(user => ({
        id: user.id,
        email: user.email,
        depositedAmount: user.depositedAmount || user.balance || 0,
        simulatedInterest: user.simulatedInterest || 0,
        currentMonthlyTarget: user.currentMonthlyTarget || 0,
        lastUpdate: user.lastSimulationUpdate,
        simulationActive: user.simulationActive !== false
      }))
    };

    res.json(overview);

  } catch (error) {
    console.error('Error getting admin overview:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/simulation/admin/parameters
 * Get simulation parameters (admin only)
 */
router.get('/admin/parameters', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const parameters = await getAllSimulationParameters();
    res.json(parameters);

  } catch (error) {
    console.error('Error getting simulation parameters:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * PUT /api/simulation/admin/parameters/:paramName
 * Update simulation parameter (admin only)
 */
router.put('/admin/parameters/:paramName', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const { paramName } = req.params;
    const { value } = req.body;

    if (!value) {
      return res.status(400).json({ error: 'Parameter value is required' });
    }

    // Validate parameter name
    const validParams = [
      'min_monthly_target', 'max_monthly_target', 'min_daily_trades', 
      'max_daily_trades', 'win_rate_min', 'win_rate_max', 'weekend_trading', 
      'simulation_enabled', 'crypto_symbols'
    ];

    if (!validParams.includes(paramName)) {
      return res.status(400).json({ error: 'Invalid parameter name' });
    }

    const updated = await updateSimulationParameter(paramName, value, req.user.id);
    
    if (!updated) {
      return res.status(404).json({ error: 'Parameter not found' });
    }

    res.json({
      message: 'Parameter updated successfully',
      parameter: {
        name: paramName,
        value: value,
        updatedBy: req.user.id,
        updatedAt: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Error updating simulation parameter:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * POST /api/simulation/admin/process-daily
 * Manually trigger daily simulation processing (admin only)
 */
// Route removed - functionality migrated to compound interest system
// Admin can use /admin/interest/trigger instead
router.post('/admin/process-daily', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    res.status(410).json({
      error: 'Endpoint deprecated during system migration',
      message: 'Real-time simulation system has been replaced with compound interest system',
      newEndpoint: '/admin/interest/trigger',
      migrationComplete: true
    });

  } catch (error) {
    console.error('Error processing daily simulation:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// =========================================
// HELPER FUNCTIONS
// =========================================

async function getRecentDailyRecords(userId, days = 7) {
  try {
    if (database.usePostgreSQL) {
      const query = `
        SELECT * FROM daily_simulation_records 
        WHERE user_id = $1 AND simulation_date >= CURRENT_DATE - INTERVAL '${days} days'
        ORDER BY simulation_date DESC
      `;
      const result = await database.query(query, [userId]);
      return result.rows;
    } else {
      // JSON implementation
      const dailyRecords = database.readFile('backend/data/daily_records.json') || [];
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - days);
      
      return dailyRecords
        .filter(record => 
          record.userId === userId && 
          new Date(record.simulationDate) >= cutoffDate
        )
        .sort((a, b) => new Date(b.simulationDate) - new Date(a.simulationDate));
    }
  } catch (error) {
    console.error('Error getting recent daily records:', error);
    return [];
  }
}

async function getTradesForDailyRecord(dailyRecordId) {
  try {
    if (database.usePostgreSQL) {
      const query = `
        SELECT * FROM simulated_trades 
        WHERE daily_record_id = $1 
        ORDER BY trade_timestamp ASC
      `;
      const result = await database.query(query, [dailyRecordId]);
      return result.rows;
    } else {
      // JSON implementation
      const simulatedTrades = database.readFile('backend/data/simulated_trades.json') || [];
      return simulatedTrades
        .filter(trade => trade.dailyRecordId === dailyRecordId)
        .sort((a, b) => new Date(a.tradeTimestamp) - new Date(b.tradeTimestamp));
    }
  } catch (error) {
    console.error('Error getting trades for daily record:', error);
    return [];
  }
}

async function getAllMonthlyTargets(year, month) {
  try {
    if (database.usePostgreSQL) {
      const query = `
        SELECT * FROM monthly_simulation_targets 
        WHERE year = $1 AND month = $2 AND status = 'active'
        ORDER BY created_at DESC
      `;
      const result = await database.query(query, [year, month]);
      return result.rows;
    } else {
      // JSON implementation
      const monthlyTargets = database.readFile('backend/data/monthly_targets.json') || [];
      return monthlyTargets.filter(target => 
        target.year === year && 
        target.month === month && 
        target.status === 'active'
      );
    }
  } catch (error) {
    console.error('Error getting monthly targets:', error);
    return [];
  }
}

async function calculateTotalSystemSimulatedInterest() {
  try {
    if (database.usePostgreSQL) {
      const query = `
        SELECT COALESCE(SUM(achieved_amount), 0) as total_interest
        FROM daily_simulation_records 
        WHERE status = 'completed'
      `;
      const result = await database.query(query);
      return parseFloat(result.rows[0].total_interest) || 0;
    } else {
      // JSON implementation
      const dailyRecords = database.readFile('backend/data/daily_records.json') || [];
      return dailyRecords
        .filter(record => record.status === 'completed')
        .reduce((total, record) => total + (record.achievedAmount || 0), 0);
    }
  } catch (error) {
    console.error('Error calculating total system simulated interest:', error);
    return 0;
  }
}

async function getAllSimulationParameters() {
  try {
    if (database.usePostgreSQL) {
      const query = `SELECT * FROM simulation_parameters ORDER BY parameter_name`;
      const result = await database.query(query);
      return result.rows.map(row => ({
        name: row.parameter_name,
        value: row.parameter_value,
        type: row.parameter_type,
        description: row.description,
        updatedAt: row.updated_at,
        updatedBy: row.updated_by
      }));
    } else {
      // JSON implementation
      const parameters = database.readFile('backend/data/simulation_parameters.json') || [];
      return parameters.map(param => ({
        name: param.parameter_name,
        value: param.parameter_value,
        type: param.parameter_type,
        description: param.description,
        updatedAt: param.updated_at,
        updatedBy: param.updated_by
      }));
    }
  } catch (error) {
    console.error('Error getting simulation parameters:', error);
    return [];
  }
}

async function updateSimulationParameter(paramName, value, updatedBy) {
  try {
    if (database.usePostgreSQL) {
      const query = `
        UPDATE simulation_parameters 
        SET parameter_value = $1, updated_by = $2, updated_at = NOW()
        WHERE parameter_name = $3
        RETURNING *
      `;
      const result = await database.query(query, [value, updatedBy, paramName]);
      return result.rows[0] || null;
    } else {
      // JSON implementation
      const parameters = database.readFile('backend/data/simulation_parameters.json') || [];
      const paramIndex = parameters.findIndex(param => param.parameter_name === paramName);
      
      if (paramIndex !== -1) {
        parameters[paramIndex].parameter_value = value;
        parameters[paramIndex].updated_by = updatedBy;
        parameters[paramIndex].updated_at = new Date().toISOString();
        
        database.writeFile('backend/data/simulation_parameters.json', parameters);
        return parameters[paramIndex];
      }
      return null;
    }
  } catch (error) {
    console.error('Error updating simulation parameter:', error);
    return null;
  }
}

module.exports = router;