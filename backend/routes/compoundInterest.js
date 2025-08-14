const express = require('express');
const router = express.Router();
const CompoundInterestSimulation = require('../services/compoundInterestSimulation');
const { authenticateToken } = require('../middleware/auth');
const database = require('../database');
const portfolioService = require('../services/portfolioBalanceService');
const PositionBalanceManager = require('../services/positionBalanceManager');

const compoundSim = new CompoundInterestSimulation();
const positionBalanceManager = new PositionBalanceManager(database);

/**
 * Get user's compound interest simulation status
 * GET /api/compound-interest/status
 */
router.get('/status', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    console.log(`📊 Getting compound interest simulation status for user ${userId}`);
    
    const status = await compoundSim.getSimulationStatus(userId);
    
    res.json({
      success: true,
      simulation: status
    });
  } catch (error) {
    console.error('Error getting simulation status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get simulation status',
      error: error.message
    });
  }
});

/**
 * Get detailed simulation plan for user
 * GET /api/compound-interest/plan
 */
router.get('/plan', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    console.log(`📋 Getting detailed simulation plan for user ${userId}`);
    
    const simulationPlan = await compoundSim.getUserSimulation(userId);
    
    if (!simulationPlan) {
      return res.status(404).json({
        success: false,
        message: 'No simulation plan found for user'
      });
    }

    // Calculate summary statistics
    const summary = {
      totalProjectedReturn: simulationPlan.totalProjectedReturn,
      totalDeposited: simulationPlan.totalDeposited,
      currentBalance: simulationPlan.currentBalance,
      monthsCompleted: simulationPlan.months.filter(m => m.status === 'completed').length,
      totalMonths: simulationPlan.months.length,
      averageMonthlyRate: simulationPlan.months.reduce((sum, m) => sum + m.lockedRate, 0) / simulationPlan.months.length
    };

    res.json({
      success: true,
      simulationPlan,
      summary
    });
  } catch (error) {
    console.error('Error getting simulation plan:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get simulation plan',
      error: error.message
    });
  }
});

/**
 * Get current month details and daily payout schedule
 * GET /api/compound-interest/current-month
 */
router.get('/current-month', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    console.log(`📅 Getting current month details for user ${userId}`);
    
    const simulationPlan = await compoundSim.getUserSimulation(userId);
    
    if (!simulationPlan) {
      return res.status(404).json({
        success: false,
        message: 'No simulation found for user'
      });
    }

    const currentMonth = simulationPlan.months.find(m => m.status === 'active');
    
    if (!currentMonth) {
      return res.status(404).json({
        success: false,
        message: 'No active month found'
      });
    }

    // Calculate current month progress
    const today = new Date();
    const dayOfMonth = today.getDate();
    const progressPercentage = currentMonth.projectedInterest > 0 
      ? (currentMonth.actualInterestPaid / currentMonth.projectedInterest) * 100 
      : 0;

    const monthDetails = {
      ...currentMonth,
      currentDay: dayOfMonth,
      progressPercentage,
      remainingDays: currentMonth.dailyPayoutSchedule?.remainingDays || 0,
      dailyPayout: currentMonth.dailyPayoutSchedule?.dailyPayout || 0,
      remainingAmount: currentMonth.dailyPayoutSchedule?.remainingAmount || 0
    };

    res.json({
      success: true,
      currentMonth: monthDetails
    });
  } catch (error) {
    console.error('Error getting current month:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get current month details',
      error: error.message
    });
  }
});

/**
 * Process manual daily payout (admin only)
 * POST /api/compound-interest/process-daily
 */
router.post('/process-daily', authenticateToken, async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Admin access required'
      });
    }

    const { userId, date } = req.body;
    const targetUserId = userId || req.user.id;
    const processDate = date || new Date().toISOString().split('T')[0];
    
    console.log(`💰 Manual daily payout processing for user ${targetUserId} on ${processDate}`);
    
    const result = await compoundSim.processDailyPayout(targetUserId, processDate);
    
    res.json({
      success: true,
      result,
      message: `Daily payout processed: $${result.payoutAmount?.toFixed(2) || 0}`
    });
  } catch (error) {
    console.error('Error processing manual daily payout:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process daily payout',
      error: error.message
    });
  }
});

/**
 * Simulate additional deposit (for testing purposes - admin only)
 * POST /api/compound-interest/simulate-deposit
 */
router.post('/simulate-deposit', authenticateToken, async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Admin access required'
      });
    }

    const { userId, amount, date } = req.body;
    
    if (!userId || !amount) {
      return res.status(400).json({
        success: false,
        message: 'User ID and amount are required'
      });
    }

    const depositDate = date || new Date().toISOString().split('T')[0];
    
    console.log(`💸 Simulating additional deposit for user ${userId}: $${amount} on ${depositDate}`);
    
    const result = await compoundSim.handleMidMonthDeposit(userId, parseFloat(amount), depositDate);
    
    res.json({
      success: true,
      result,
      message: `Additional deposit simulated: $${amount} processed`
    });
  } catch (error) {
    console.error('Error simulating additional deposit:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to simulate additional deposit',
      error: error.message
    });
  }
});

/**
 * Get simulation projection scenarios
 * POST /api/compound-interest/projection
 */
router.post('/projection', authenticateToken, async (req, res) => {
  try {
    const { additionalDeposits = [] } = req.body;
    const userId = req.user.id;
    
    console.log(`📈 Calculating projection scenarios for user ${userId}`);
    
    const simulationPlan = await compoundSim.getUserSimulation(userId);
    
    if (!simulationPlan) {
      return res.status(404).json({
        success: false,
        message: 'No simulation found for user'
      });
    }

    // Create projection scenarios
    const scenarios = {
      current: {
        name: 'Current Plan',
        description: 'Based on existing deposits only',
        finalBalance: simulationPlan.currentBalance + simulationPlan.totalProjectedReturn,
        totalReturn: simulationPlan.totalProjectedReturn,
        months: simulationPlan.months.map(m => ({
          month: m.monthNumber,
          startingBalance: m.startingBalance,
          interestEarned: m.projectedInterest,
          endingBalance: m.endingBalance
        }))
      }
    };

    // Calculate scenario with additional deposits
    if (additionalDeposits.length > 0) {
      // This would require more complex calculation
      // For now, return a simplified version
      scenarios.withAdditionalDeposits = {
        name: 'With Additional Deposits',
        description: 'Including planned additional deposits',
        additionalDeposits,
        message: 'Detailed calculation available after deposits are made'
      };
    }

    res.json({
      success: true,
      scenarios
    });
  } catch (error) {
    console.error('Error calculating projections:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to calculate projections',
      error: error.message
    });
  }
});

/**
 * Get admin overview with totals and user breakdown
 * GET /api/compound-interest/admin/overview
 */
router.get('/admin/overview', authenticateToken, async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Admin access required'
      });
    }

    console.log('📊 Getting compound interest admin overview');
    
    const users = await database.getAllUsers();
    const today = new Date();
    
    const stats = {
      totalDeposited: 0,
      activeSimulations: 0,
      projectedPayouts: {
        next7Days: 0,
        next30Days: 0,
        next12Months: 0
      },
      userBreakdown: []
    };

    for (const user of users) {
      const simulation = await compoundSim.getUserSimulation(user.id);
      if (simulation) {
        stats.totalDeposited += simulation.totalDeposited;
        
        const status = await compoundSim.getSimulationStatus(user.id);
        if (status.status === 'active') {
          stats.activeSimulations++;
        }

        // Calculate payout projections for this user
        const payoutProjections = calculateUserPayoutProjections(simulation, today);
        
        stats.projectedPayouts.next7Days += payoutProjections.next7Days;
        stats.projectedPayouts.next30Days += payoutProjections.next30Days;
        stats.projectedPayouts.next12Months += payoutProjections.next12Months;

        stats.userBreakdown.push({
          userId: user.id,
          email: user.email,
          deposited: simulation.totalDeposited,
          projectedPayouts: payoutProjections,
          status: status.status,
          joinDate: user.createdAt,
          simulationStartDate: simulation.startDate
        });
      }
    }

    res.json({
      success: true,
      stats
    });
  } catch (error) {
    console.error('Error getting admin overview:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get admin overview',
      error: error.message
    });
  }
});

/**
 * Get detailed user simulation for editing
 * GET /api/compound-interest/admin/user/:userId/details
 */
router.get('/admin/user/:userId/details', authenticateToken, async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Admin access required'
      });
    }

    const { userId } = req.params;
    console.log(`📋 Getting detailed simulation for user ${userId}`);
    
    const user = await database.getUserById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const simulation = await compoundSim.getUserSimulation(userId);
    if (!simulation) {
      return res.status(404).json({
        success: false,
        message: 'No simulation found for user'
      });
    }

    const status = await compoundSim.getSimulationStatus(userId);

    res.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        createdAt: user.createdAt
      },
      simulation,
      status
    });
  } catch (error) {
    console.error('Error getting user simulation details:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get user details',
      error: error.message
    });
  }
});

/**
 * Override monthly rate for a user's simulation
 * PUT /api/compound-interest/admin/user/:userId/override-rate
 */
router.put('/admin/user/:userId/override-rate', authenticateToken, async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Admin access required'
      });
    }

    const { userId } = req.params;
    const { month, newRate } = req.body;

    if (!month || !newRate || month < 1 || month > 12 || newRate < 0 || newRate > 1) {
      return res.status(400).json({
        success: false,
        message: 'Valid month (1-12) and rate (0-1) are required'
      });
    }

    console.log(`🔧 Overriding month ${month} rate to ${(newRate * 100).toFixed(2)}% for user ${userId}`);

    const simulation = await compoundSim.getUserSimulation(userId);
    if (!simulation) {
      return res.status(404).json({
        success: false,
        message: 'No simulation found for user'
      });
    }

    // Update the specific month's rate
    const monthIndex = month - 1;
    if (monthIndex >= simulation.months.length) {
      return res.status(400).json({
        success: false,
        message: 'Invalid month number'
      });
    }

    const oldRate = simulation.months[monthIndex].lockedRate;
    simulation.months[monthIndex].lockedRate = newRate;

    // Recalculate compound effect for this month and all subsequent months
    let runningBalance = simulation.months[monthIndex].startingBalance;
    
    for (let i = monthIndex; i < simulation.months.length; i++) {
      const month = simulation.months[i];
      const monthlyInterest = runningBalance * month.lockedRate;
      
      month.projectedInterest = monthlyInterest;
      month.endingBalance = runningBalance + monthlyInterest;
      
      // Recalculate daily payout schedule
      month.dailyPayoutSchedule = compoundSim.calculateDailyPayoutSchedule(
        monthlyInterest,
        month.daysInMonth
      );
      
      runningBalance += monthlyInterest;
    }

    // Update total projected return
    simulation.totalProjectedReturn = simulation.months.reduce(
      (sum, month) => sum + month.projectedInterest, 0
    );

    // Save updated simulation
    await compoundSim.saveSimulationPlan(simulation);

    const impactPreview = {
      oldRate: oldRate,
      newRate: newRate,
      oldMonthlyInterest: simulation.months[monthIndex].startingBalance * oldRate,
      newMonthlyInterest: simulation.months[monthIndex].projectedInterest,
      newTotalReturn: simulation.totalProjectedReturn,
      affectedMonths: simulation.months.length - monthIndex
    };

    res.json({
      success: true,
      message: `Month ${month} rate updated from ${(oldRate * 100).toFixed(2)}% to ${(newRate * 100).toFixed(2)}%`,
      impactPreview,
      updatedSimulation: simulation
    });

  } catch (error) {
    console.error('Error overriding monthly rate:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to override monthly rate',
      error: error.message
    });
  }
});

// Helper function to calculate payout projections
function calculateUserPayoutProjections(simulation, today) {
  const projections = {
    next7Days: 0,
    next30Days: 0,
    next12Months: 0
  };

  const currentMonth = simulation.months.find(m => m.status === 'active');
  if (!currentMonth) {
    return projections;
  }

  const dailyPayout = currentMonth.dailyPayoutSchedule?.dailyPayout || 0;
  
  // Calculate remaining days in current month
  const currentDate = new Date(today);
  const daysInMonth = currentMonth.daysInMonth;
  const dayOfMonth = currentDate.getDate();
  const remainingDaysInMonth = daysInMonth - dayOfMonth + 1;

  // Next 7 days
  projections.next7Days = dailyPayout * Math.min(7, remainingDaysInMonth);
  
  // Next 30 days
  projections.next30Days = dailyPayout * Math.min(30, remainingDaysInMonth);
  
  // If 30 days extends beyond current month, add from next months
  if (remainingDaysInMonth < 30) {
    const daysFromNextMonths = 30 - remainingDaysInMonth;
    const nextMonth = simulation.months.find(m => m.monthNumber === currentMonth.monthNumber + 1);
    if (nextMonth) {
      const nextMonthDailyPayout = nextMonth.dailyPayoutSchedule?.dailyPayout || 0;
      projections.next30Days += nextMonthDailyPayout * Math.min(daysFromNextMonths, nextMonth.daysInMonth);
    }
  }

  // Next 12 months (remaining simulation)
  projections.next12Months = simulation.months
    .filter(m => m.monthNumber >= currentMonth.monthNumber)
    .reduce((sum, month) => sum + month.projectedInterest, 0);

  return projections;
}

/**
 * Get compound interest statistics (admin only)
 * GET /api/compound-interest/admin/stats
 */
router.get('/admin/stats', authenticateToken, async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Admin access required'
      });
    }

    console.log('📊 Getting compound interest statistics for admin');
    
    const users = await database.getAllUsers();
    const stats = {
      totalUsers: 0,
      activeSimulations: 0,
      totalDeposited: 0,
      totalProjectedReturns: 0,
      totalInterestPaid: 0,
      averageMonthlyRate: 0,
      userSimulations: []
    };

    let totalRates = 0;
    let rateCount = 0;

    for (const user of users) {
      const simulation = await compoundSim.getUserSimulation(user.id);
      if (simulation) {
        stats.totalUsers++;
        stats.totalDeposited += simulation.totalDeposited;
        stats.totalProjectedReturns += simulation.totalProjectedReturn;
        
        let userInterestPaid = 0;
        simulation.months.forEach(month => {
          userInterestPaid += month.actualInterestPaid || 0;
          totalRates += month.lockedRate;
          rateCount++;
        });
        
        stats.totalInterestPaid += userInterestPaid;
        
        const status = await compoundSim.getSimulationStatus(user.id);
        if (status.status === 'active') {
          stats.activeSimulations++;
        }
        
        stats.userSimulations.push({
          userId: user.id,
          email: user.email,
          totalDeposited: simulation.totalDeposited,
          projectedReturn: simulation.totalProjectedReturn,
          interestPaid: userInterestPaid,
          status: status.status
        });
      }
    }

    stats.averageMonthlyRate = rateCount > 0 ? (totalRates / rateCount) : 0;

    res.json({
      success: true,
      stats
    });
  } catch (error) {
    console.error('Error getting compound interest stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get statistics',
      error: error.message
    });
  }
});

/**
 * Get daily trades for a user and date
 * GET /api/compound-interest/daily-trades?date=YYYY-MM-DD
 */
router.get('/daily-trades', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { date } = req.query;
    const targetDate = date || new Date().toISOString().split('T')[0];
    
    console.log(`📊 Getting daily trades for user ${userId} on ${targetDate}`);
    
    const dailyTrades = await compoundSim.getDailyTrades(userId, targetDate);
    
    if (!dailyTrades || !dailyTrades.trades) {
      // Provide fallback demo trades for users without trading data
      console.log(`❌ No daily trades found for user ${userId} on ${targetDate}`);
      return res.json({
        success: true,
        dailyTrades: {
          date: targetDate,
          tradeCount: 0,
          trades: [],
          summary: {
            totalAmount: 0,
            totalProfit: 0,
            winRate: 0
          }
        }
      });
    }

    console.log(`✅ Found daily trades for user ${userId}: ${dailyTrades.tradeCount} trades`)

    res.json({
      success: true,
      dailyTrades
    });
  } catch (error) {
    console.error('Error getting daily trades:', error);
    
    // Provide fallback data instead of 500 error
    const targetDate = req.query.date || new Date().toISOString().split('T')[0];
    res.json({
      success: true,
      dailyTrades: {
        date: targetDate,
        tradeCount: 0,
        trades: [],
        summary: {
          totalAmount: 0,
          totalProfit: 0,
          winRate: 0
        }
      },
      warning: 'Using fallback data due to error'
    });
  }
});

/**
 * Get daily volatility pattern for current month
 * GET /api/compound-interest/volatility-pattern
 */
router.get('/volatility-pattern', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    console.log(`📈 Getting volatility pattern for user ${userId}`);
    
    const simulationPlan = await compoundSim.getUserSimulation(userId);
    
    if (!simulationPlan) {
      return res.status(404).json({
        success: false,
        message: 'No simulation found for user'
      });
    }

    const currentMonth = simulationPlan.months.find(m => m.status === 'active');
    
    if (!currentMonth) {
      return res.status(404).json({
        success: false,
        message: 'No active month found'
      });
    }

    res.json({
      success: true,
      volatilityPattern: currentMonth.dailyVolatility,
      monthContext: {
        monthNumber: currentMonth.monthNumber,
        monthName: currentMonth.monthName,
        lockedRate: currentMonth.lockedRate,
        tradeCount: currentMonth.tradeCount
      }
    });
  } catch (error) {
    console.error('Error getting volatility pattern:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get volatility pattern',
      error: error.message
    });
  }
});

/**
 * Get live trading activity for user
 * GET /api/compound-interest/live-activity
 */
router.get('/live-activity', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const today = new Date().toISOString().split('T')[0];
    
    console.log(`📺 Getting live trading activity for user ${userId} on ${today}`);
    
    // Get today's trades
    const todaysTrades = await compoundSim.getDailyTrades(userId, today);
    
    console.log(`📺 Live activity result:`, todaysTrades ? `Found ${todaysTrades.tradeCount} trades` : 'No trades found');
    
    if (!todaysTrades || !todaysTrades.trades || todaysTrades.trades.length === 0) {
      console.log(`❌ Live activity: Setting hasActivity = false because no trades found`);
      return res.json({
        success: true,
        liveActivity: {
          hasActivity: false,
          date: today,
          totalTrades: 0,
          marketStatus: 'closed',
          message: 'No trading activity for today'
        }
      });
    }

    // Get recent trades (last 30 minutes)
    const now = new Date();
    const thirtyMinutesAgo = new Date(now.getTime() - 30 * 60 * 1000);
    
    const recentTrades = todaysTrades.trades.filter(trade => {
      const tradeTime = new Date(trade.timestamp);
      return tradeTime >= thirtyMinutesAgo && tradeTime <= now;
    });

    // Calculate next trade ETA
    const avgInterval = 480 / todaysTrades.tradeCount; // 8 hours / trade count in minutes
    const nextTradeETA = Math.floor(Math.random() * avgInterval * 2);

    res.json({
      success: true,
      liveActivity: {
        hasActivity: true,
        date: today,
        totalTrades: todaysTrades.tradeCount,
        recentTrades,
        nextTradeETA, // minutes
        dailySummary: todaysTrades.summary,
        marketStatus: 'open' // Crypto markets are 24/7
      }
    });
  } catch (error) {
    console.error('Error getting live activity:', error);
    // Always return success with fallback data, never 500
    const today = new Date().toISOString().split('T')[0];
    res.json({
      success: true,
      liveActivity: {
        hasActivity: false,
        date: today,
        totalTrades: 0,
        recentTrades: [],
        nextTradeETA: 0,
        dailySummary: { totalAmount: 0, winningTrades: 0, losingTrades: 0, winRate: 0 },
        marketStatus: 'closed'
      }
    });
  }
});

/**
 * Manually generate daily trades (admin only)
 * POST /api/compound-interest/admin/generate-trades
 */
router.post('/admin/generate-trades', authenticateToken, async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Admin access required'
      });
    }

    const { userId, date } = req.body;
    const targetUserId = userId || req.user.id;
    const targetDate = date || new Date().toISOString().split('T')[0];
    
    console.log(`🎯 Manual trade generation for user ${targetUserId} on ${targetDate}`);
    
    const result = await compoundSim.generateDailyTrades(targetUserId, targetDate);
    
    res.json({
      success: true,
      result,
      message: `Generated ${result.dailyTrades?.tradeCount || 0} trades for ${targetDate}`
    });
  } catch (error) {
    console.error('Error generating manual trades:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate trades',
      error: error.message
    });
  }
});

/**
 * Get trading statistics overview (admin only)
 * GET /api/compound-interest/admin/trading-stats
 */
router.get('/admin/trading-stats', authenticateToken, async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Admin access required'
      });
    }

    console.log('📊 Getting trading statistics overview');
    
    const today = new Date().toISOString().split('T')[0];
    const users = await database.getAllUsers();
    
    const stats = {
      date: today,
      totalUsers: 0,
      activeTraders: 0,
      totalTradesToday: 0,
      totalVolumeToday: 0,
      userBreakdown: []
    };

    for (const user of users) {
      const simulation = await compoundSim.getUserSimulation(user.id);
      if (simulation) {
        stats.totalUsers++;
        
        const dailyTrades = await compoundSim.getDailyTrades(user.id, today);
        if (dailyTrades) {
          stats.activeTraders++;
          stats.totalTradesToday += dailyTrades.tradeCount;
          stats.totalVolumeToday += Math.abs(dailyTrades.validation.actualTotal);
          
          stats.userBreakdown.push({
            userId: user.id,
            email: user.email,
            tradesCount: dailyTrades.tradeCount,
            dailyTarget: dailyTrades.dailyTargetAmount,
            accountBalance: dailyTrades.accountBalance,
            winRate: dailyTrades.summary.winRate
          });
        }
      }
    }

    res.json({
      success: true,
      stats
    });
  } catch (error) {
    console.error('Error getting trading statistics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get trading statistics',
      error: error.message
    });
  }
});

// =====================================================
// PORTFOLIO BALANCE ENDPOINTS
// =====================================================



/**
 * Get current portfolio state with real-time balance calculation
 * GET /api/compound-interest/portfolio-state
 */
router.get('/portfolio-state', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Get compound interest data
    const user = await database.getUserById(userId);
    const simulation = await compoundSim.getUserSimulation(userId);
    
    // Calculate base portfolio from deposits + compound interest
    const totalDeposited = Number(user.depositedAmount || user.balance || 0);
    // Use actual accumulated interest from transactions (most accurate)
    const compoundInterestEarned = Number(user.simulatedInterest || 0);
    
    const basePortfolioValue = totalDeposited + compoundInterestEarned;
    
    console.log(`📊 Portfolio calculation for ${user.email}:`, {
      'user.depositedAmount': user.depositedAmount,
      'user.balance': user.balance,
      'user.simulatedInterest': user.simulatedInterest,
      totalDeposited: typeof totalDeposited + ' = ' + totalDeposited,
      compoundInterestEarned: typeof compoundInterestEarned + ' = ' + compoundInterestEarned,
      basePortfolioValue: typeof basePortfolioValue + ' = ' + basePortfolioValue
    });
    
    // Get position data (open/closed trading positions)
    let positionData = null;
    let positionsPL = 0;
    
    try {
      positionData = await positionBalanceManager.getPortfolioSummary(userId);
      
      // TEMPORARY FIX: Skip position calculations if they seem wrong
      if (positionData && positionData.totalPortfolioValue < totalDeposited * 0.5) {
        console.log(`⚠️ Position data seems invalid (${positionData.totalPortfolioValue} < ${totalDeposited * 0.5}), using base portfolio only`);
        positionsPL = 0;
      } else {
        positionsPL = positionData ? (Number(positionData.totalPortfolioValue) - Number(totalDeposited)) : 0;
      }
      
      console.log(`📊 Position data:`, {
        positionData: positionData ? {
          totalPortfolioValue: typeof positionData.totalPortfolioValue + ' = ' + positionData.totalPortfolioValue,
          openPositionsCount: positionData.openPositionsCount
        } : null,
        positionsPL: typeof positionsPL + ' = ' + positionsPL
      });
    } catch (positionError) {
      // Position manager error - continue with base portfolio value
      console.log(`⚠️ Position manager error:`, positionError.message);
      positionsPL = 0;
    }
    
    // Calculate comprehensive portfolio value (base + positions)
    const totalPortfolioValue = Number(basePortfolioValue) + Number(positionsPL); // Include compound interest + positions
    
    console.log(`📊 Final calculation:`, {
      basePortfolioValue: typeof basePortfolioValue + ' = ' + basePortfolioValue,
      positionsPL: typeof positionsPL + ' = ' + positionsPL,
      totalPortfolioValue: typeof totalPortfolioValue + ' = ' + totalPortfolioValue
    });
    // Locked capital is always 80% of total portfolio value (simulation design)
    const lockedCapital = Number(totalPortfolioValue) * 0.8;
    const availableBalance = Number(totalPortfolioValue) - Number(lockedCapital); // 20% available
    
    // Calculate today's compound interest earnings for daily P&L
    const todayDate = new Date().toISOString().split('T')[0];
    const userTransactions = await database.getTransactionsByUserId(userId);
    const todayCompoundInterest = userTransactions
      .filter(t => t.type === 'interest' && t.createdAt.startsWith(todayDate))
      .reduce((sum, t) => sum + t.amount, 0);
    
    const tradingDailyPL = positionData ? positionData.dailyPL : 0;
    const dailyPL = tradingDailyPL + todayCompoundInterest; // Include both trading and compound interest
    const openPositionsCount = positionData ? positionData.openPositionsCount : 0;
    
    const portfolioState = {
      totalPortfolioValue,
      availableBalance,
      lockedCapital,
      dailyPL,
      dailyPLPercent: totalDeposited > 0 ? (dailyPL / totalDeposited * 100) : 0,
      compoundInterestEarned,
      totalDeposited,
      portfolioGrowthPercent: totalDeposited > 0 ? ((totalPortfolioValue - totalDeposited) / totalDeposited * 100) : 0,
      utilizationPercent: totalPortfolioValue > 0 ? (lockedCapital / totalPortfolioValue * 100) : 0,
      openPositionsCount,
      totalInterestEarned: compoundInterestEarned
    };
    


    console.log(`📤 API Response totalPortfolioValue:`, typeof portfolioState.totalPortfolioValue, '=', portfolioState.totalPortfolioValue);
    
    res.json({
      success: true,
      portfolioState
    });
  } catch (error) {
    console.error('Error getting portfolio state:', error);
    
    // Provide fallback data even if there's an error
    try {
      const user = await database.getUserById(req.user.id);
      const fallbackPortfolioValue = user?.balance || 0;
    
      res.json({
      success: true,
      portfolioState: {
        totalPortfolioValue: fallbackPortfolioValue,
        availableBalance: fallbackPortfolioValue * 0.2,
        lockedCapital: fallbackPortfolioValue * 0.8,
        dailyPL: 0,
        dailyPLPercent: 0,
        compoundInterestEarned: user?.simulatedInterest || 0,
        totalDeposited: user?.depositedAmount || user?.balance || 0,
        portfolioGrowthPercent: 0,
        utilizationPercent: 80,
        openPositionsCount: 0,
        totalInterestEarned: user?.simulatedInterest || 0
      },
      warning: 'Using fallback data due to calculation error'
    });
    } catch (fallbackError) {
      // If even fallback fails, return minimal safe data
      res.status(500).json({
        success: false,
        message: 'Failed to get portfolio state',
        error: error.message
      });
    }
  }
});

/**
 * Get portfolio balance timeline for chart
 * GET /api/compound-interest/balance-timeline?date=YYYY-MM-DD
 */
router.get('/balance-timeline', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { date } = req.query;
    const targetDate = date || new Date().toISOString().split('T')[0];
    
    console.log(`📈 Getting balance timeline for user ${userId} on ${targetDate}`);
    
    const timeline = await portfolioService.getBalanceTimeline(userId, targetDate);
    
    res.json({
      success: true,
      timeline,
      date: targetDate
    });
  } catch (error) {
    console.error('Error getting balance timeline:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get balance timeline',
      error: error.message
    });
  }
});

/**
 * Get portfolio summary with historical context
 * GET /api/compound-interest/portfolio-summary
 */
router.get('/portfolio-summary', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    console.log(`💰 Getting portfolio summary for user ${userId}`);
    
    const summary = await portfolioService.getPortfolioSummary(userId);
    
    if (!summary) {
      return res.status(404).json({
        success: false,
        message: 'No portfolio data found for user'
      });
    }

    res.json({
      success: true,
      summary
    });
  } catch (error) {
    console.error('Error getting portfolio summary:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get portfolio summary',
      error: error.message
    });
  }
});

/**
 * Get real-time portfolio updates (for polling)
 * GET /api/compound-interest/portfolio-updates
 */
router.get('/portfolio-updates', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    
    const currentState = await portfolioService.calculatePortfolioState(userId);
    const timeline = await portfolioService.getBalanceTimeline(userId);
    
    // Get the most recent event
    const recentEvents = timeline.slice(-3); // Last 3 events
    
    // Calculate next expected event
    const now = new Date();
    const futureEvents = timeline.filter(event => new Date(event.time) > now);
    const nextEvent = futureEvents.length > 0 ? futureEvents[0] : null;

    res.json({
      success: true,
      updates: {
        currentState,
        recentEvents,
        nextEvent,
        lastUpdated: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Error getting portfolio updates:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get portfolio updates',
      error: error.message
    });
  }
});

/**
 * GET /api/compound-interest/total-earnings
 * Calculate total lifetime earnings for a user from all sources
 */
router.get('/total-earnings', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    console.log(`📊 Calculating total lifetime earnings for user ${userId}`);

    const user = await database.getUserById(userId);
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        error: 'User not found' 
      });
    }

    let totalEarnings = 0;
    const earningsSources = {
      legacyInterest: 0,
      compoundInterest: 0,
      interestPayments: 0,
      realizedTradeProfits: 0
    };

    // 1. Legacy Interest from user.totalInterest field
    earningsSources.legacyInterest = user.totalInterest || 0;
    totalEarnings += earningsSources.legacyInterest;

    // 2. Compound Interest from simulation data
    const compoundSim = new CompoundInterestSimulation();
    const simulation = await compoundSim.getUserSimulation(userId);
    
    if (simulation) {
      let compoundInterestTotal = 0;
      simulation.months.forEach(month => {
        compoundInterestTotal += month.actualInterestPaid || 0;
      });
      earningsSources.compoundInterest = compoundInterestTotal;
      totalEarnings += compoundInterestTotal;
    }

    // 3. Interest Payments from interest_payments.json
    let interestPayments = [];
    try {
      if (database.usePostgreSQL) {
        // PostgreSQL implementation would go here
        // For now, use 0 as we don't have the table structure
        earningsSources.interestPayments = 0;
      } else {
        // JSON file implementation
        interestPayments = database.readFile('data/interest_payments.json') || [];
        const userInterestPayments = interestPayments.filter(payment => payment.userId === userId);
        earningsSources.interestPayments = userInterestPayments.reduce((sum, payment) => sum + payment.amount, 0);
        totalEarnings += earningsSources.interestPayments;
      }
    } catch (error) {
      console.warn('Could not read interest payments file:', error.message);
      earningsSources.interestPayments = 0;
    }

    // 4. Realized Trade Profits (from completed trades with profits)
    // Note: This would need to be implemented when we have actual trade closing functionality
    // For now, we're using simulated trades which don't have realized P/L until closed
    earningsSources.realizedTradeProfits = 0;

    console.log(`💰 Total earnings calculated for ${user.email}:`, {
      totalEarnings: totalEarnings.toFixed(2),
      breakdown: {
        legacyInterest: earningsSources.legacyInterest.toFixed(2),
        compoundInterest: earningsSources.compoundInterest.toFixed(2),
        interestPayments: earningsSources.interestPayments.toFixed(2),
        realizedTradeProfits: earningsSources.realizedTradeProfits.toFixed(2)
      }
    });

    res.json({
      success: true,
      userId,
      userEmail: user.email,
      totalEarnings,
      earningsSources,
      memberSince: user.createdAt,
      lastCalculated: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Error calculating total earnings:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to calculate total earnings',
      details: error.message 
    });
  }
});

/**
 * GET /api/compound-interest/invested-amount
 * Calculate total amount currently invested in active trading positions
 */
router.get('/invested-amount', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    console.log(`🔄 Calculating 80% portfolio utilization for user ${userId}`);

    const user = await database.getUserById(userId);
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        error: 'User not found' 
      });
    }

    // 🔄 NEW: 80% Rolling Lock System - Calculate from TOTAL portfolio value
    const totalDeposited = user.depositedAmount || user.balance || 0;
    
    // Get user's compound interest simulation and actual interest earned
    const simulation = await compoundSim.getUserSimulation(userId);
    // Use actual accumulated interest from user data (most accurate)
    const compoundInterestTotal = user.simulatedInterest || 0;
    
    const basePortfolioValue = totalDeposited + compoundInterestTotal;
    
    // Get comprehensive portfolio value including positions
    const positionData = await positionBalanceManager.getPortfolioSummary(userId);
    const positionsPL = positionData ? (positionData.totalPortfolioValue - totalDeposited) : 0;
    const totalPortfolioValue = basePortfolioValue + positionsPL; // Include compound interest + positions
    
    console.log(`🔍 Complete portfolio calculation:`, {
      totalDeposited,
      actualInterestEarned: compoundInterestTotal,
      baseValue: basePortfolioValue,
      positionsPL,
      finalPortfolioValue: totalPortfolioValue
    });
    
    const targetLockedCapital = totalPortfolioValue * 0.80; // 80% of TOTAL portfolio
    
    let totalInvestedAmount = targetLockedCapital; // Default to 80%
    let activeTrades = 0;
    let averageTradeSize = 0;
    let currentLockedCapital = 0;

    try {
      // Get today's trades with position data from rolling lock system
      const today = new Date().toISOString().split('T')[0];
      const todaysTrades = await compoundSim.getDailyTrades(userId, today);
      
      if (todaysTrades && todaysTrades.trades && todaysTrades.trades.length > 0) {
        const currentTime = new Date();
        
        // Calculate currently locked capital from active positions
        for (const trade of todaysTrades.trades) {
          const unlockTime = trade.unlockTime ? new Date(trade.unlockTime) : null;
          
          if (trade.isLocked && unlockTime && unlockTime > currentTime) {
            // Position is still locked - use positionSize if available
            const positionSize = trade.positionSize || Math.abs(trade.amount);
            currentLockedCapital += positionSize;
            activeTrades++;
          }
        }
        
        // 🎯 ALWAYS use 80% target for simulation display
        totalInvestedAmount = targetLockedCapital;
        
        // If no active locked positions, estimate based on total trades generated
        if (activeTrades === 0) {
          activeTrades = Math.floor(todaysTrades.tradeCount * 0.3); // ~30% typically locked at once
          averageTradeSize = totalInvestedAmount / Math.max(1, activeTrades);
        } else {
          averageTradeSize = totalInvestedAmount / activeTrades;
        }
      } else {
        // No trades today - use 80% target with estimated positions
        totalInvestedAmount = targetLockedCapital;
        activeTrades = Math.floor(targetLockedCapital / 75); // $75 average position
        averageTradeSize = 75;
      }

    } catch (tradeError) {
      console.warn('🔄 Using 80% default allocation due to trade data error:', tradeError.message);
      
      // Fallback: Use 80% target allocation
      totalInvestedAmount = targetLockedCapital;
      activeTrades = Math.floor(targetLockedCapital / 75); // Estimated positions
      averageTradeSize = 75;
    }

    console.log(`🎯 80% Portfolio Target for ${user.email}: $${totalInvestedAmount.toFixed(2)} (${((totalInvestedAmount/totalPortfolioValue)*100).toFixed(1)}%) of $${totalPortfolioValue.toFixed(2)} total portfolio`);

    res.json({
      success: true,
      userId,
      userEmail: user.email,
      totalInvestedAmount: parseFloat(totalInvestedAmount.toFixed(2)),
      activeTrades,
      averageTradeSize: parseFloat(averageTradeSize.toFixed(2)),
      // 🔄 NEW: 80% Rolling Lock System Data
      totalDeposited: parseFloat(totalDeposited.toFixed(2)),
      totalPortfolioValue: parseFloat(totalPortfolioValue.toFixed(2)),
      targetLockedCapital: parseFloat(targetLockedCapital.toFixed(2)),
      currentLockedCapital: parseFloat(currentLockedCapital.toFixed(2)),
      utilizationPercent: parseFloat(((totalInvestedAmount / totalPortfolioValue) * 100).toFixed(1)),
      availableBalance: parseFloat((totalPortfolioValue - targetLockedCapital).toFixed(2)),
      openPositionsCount: positionData ? positionData.openPositionsCount : 0,
      dailyPL: positionData ? positionData.dailyPL : 0,
      compoundInterestEarned: parseFloat(compoundInterestTotal.toFixed(2)),
      systemType: 'rolling_80_percent_lock',
      calculationMethod: '80_percent_total_portfolio_always',
      lastCalculated: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Error calculating invested amount:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to calculate invested amount',
      details: error.message 
    });
  }
});

// ==============================================
// FRONTEND COMPATIBILITY ENDPOINTS
// These endpoints provide the same interface as the old simulation system
// but use the compound interest system as the backend
// ==============================================

/**
 * Frontend compatibility endpoint for simulation status
 * Maps to compound interest status with same response format
 * GET /api/compound-interest/simulation/status
 */
router.get('/simulation/status', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    console.log(`📊 [COMPAT] Getting simulation status for user ${userId}`);
    
    const user = await database.getUserById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const status = await compoundSim.getSimulationStatus(userId);
    
    // Format response to match old simulation system format
    const response = {
      user: {
        id: user.id,
        email: user.email,
        depositedAmount: status.totalDeposited || user.balance || 0,
        simulatedInterest: status.totalInterestEarned || 0,
        totalBalance: status.totalDeposited + (status.totalInterestEarned || 0),
        simulationActive: status.hasSimulation
      },
      currentMonth: {
        target: status.hasSimulation ? {
          targetPercentage: status.currentMonthRate * 100,
          targetAmount: status.projectedMonthlyReturn,
          achievedAmount: status.currentMonthEarned || 0,
          progressPercentage: status.projectedMonthlyReturn > 0 ? 
            ((status.currentMonthEarned || 0) / status.projectedMonthlyReturn * 100) : 0,
          daysInMonth: status.daysInCurrentMonth || 30,
          daysRemaining: status.daysRemainingInMonth || 15
        } : null,
        progress: status.hasSimulation ? {
          targetPercentage: status.currentMonthRate * 100,
          targetAmount: status.projectedMonthlyReturn,
          achievedAmount: status.currentMonthEarned || 0,
          progressPercentage: status.projectedMonthlyReturn > 0 ? 
            ((status.currentMonthEarned || 0) / status.projectedMonthlyReturn * 100) : 0,
          daysInMonth: status.daysInCurrentMonth || 30,
          daysRemaining: status.daysRemainingInMonth || 15
        } : null
      },
      recentActivity: [], // TODO: Add recent daily records from compound system
      lastUpdate: status.lastUpdated || new Date().toISOString()
    };

    res.json(response);

  } catch (error) {
    console.error('Error getting simulation status:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * Frontend compatibility endpoint for daily trades
 * Maps to compound interest daily trades
 * GET /api/compound-interest/simulation/trades
 */
router.get('/simulation/trades', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const date = new Date().toISOString().split('T')[0]; // Today
    console.log(`📊 [COMPAT] Getting trades for user ${userId} on ${date}`);

    const dailyTrades = await compoundSim.getDailyTrades(userId, date);
    
    if (!dailyTrades || !dailyTrades.trades || dailyTrades.trades.length === 0) {
      return res.status(404).json({ error: 'No trading data found for this date' });
    }

    // Format response to match old simulation system format
    const response = {
      date: date,
      summary: {
        totalEarnings: dailyTrades.validation?.actualTotal || 0,
        numberOfTrades: dailyTrades.tradeCount || 0,
        winRate: ((dailyTrades.summary?.winningTrades || 0) / (dailyTrades.tradeCount || 1) * 100),
        largestWin: Math.max(...dailyTrades.trades.filter(t => t.profitLoss > 0).map(t => t.profitLoss), 0),
        largestLoss: Math.min(...dailyTrades.trades.filter(t => t.profitLoss < 0).map(t => t.profitLoss), 0),
        status: 'completed'
      },
      trades: dailyTrades.trades.map(trade => ({
        id: trade.id,
        cryptoSymbol: trade.cryptoSymbol,
        cryptoName: trade.cryptoName,
        profitLoss: trade.profitLoss,
        tradeTimestamp: trade.timestamp || trade.tradeTimestamp,
        tradeType: trade.tradeType,
        tradeDurationMinutes: trade.duration || 60,
        amount: trade.amount
      }))
    };

    res.json(response);

  } catch (error) {
    console.error('Error getting trades:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * Frontend compatibility endpoint for trades on specific date
 * GET /api/compound-interest/simulation/trades/:date
 */
router.get('/simulation/trades/:date', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const date = req.params.date;
    console.log(`📊 [COMPAT] Getting trades for user ${userId} on ${date}`);

    // Validate date format
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return res.status(400).json({ error: 'Invalid date format. Use YYYY-MM-DD' });
    }

    const dailyTrades = await compoundSim.getDailyTrades(userId, date);
    
    if (!dailyTrades || !dailyTrades.trades || dailyTrades.trades.length === 0) {
      return res.status(404).json({ error: 'No trading data found for this date' });
    }

    // Format response to match old simulation system format
    const response = {
      date: date,
      summary: {
        totalEarnings: dailyTrades.validation?.actualTotal || 0,
        numberOfTrades: dailyTrades.tradeCount || 0,
        winRate: ((dailyTrades.summary?.winningTrades || 0) / (dailyTrades.tradeCount || 1) * 100),
        largestWin: Math.max(...dailyTrades.trades.filter(t => t.profitLoss > 0).map(t => t.profitLoss), 0),
        largestLoss: Math.min(...dailyTrades.trades.filter(t => t.profitLoss < 0).map(t => t.profitLoss), 0),
        status: 'completed'
      },
      trades: dailyTrades.trades.map(trade => ({
        id: trade.id,
        cryptoSymbol: trade.cryptoSymbol,
        cryptoName: trade.cryptoName,
        profitLoss: trade.profitLoss,
        tradeTimestamp: trade.timestamp || trade.tradeTimestamp,
        tradeType: trade.tradeType,
        tradeDurationMinutes: trade.duration || 60,
        amount: trade.amount
      }))
    };

    res.json(response);

  } catch (error) {
    console.error('Error getting trades:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * Frontend compatibility endpoint for simulation initialization
 * Maps to compound interest simulation initialization
 * POST /api/compound-interest/simulation/initialize
 */
router.post('/simulation/initialize', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    console.log(`📊 [COMPAT] Initializing simulation for user ${userId}`);
    
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

    // Check if user already has a simulation
    const existingStatus = await compoundSim.getSimulationStatus(userId);
    if (existingStatus.hasSimulation) {
      return res.status(400).json({ 
        error: 'User already has an active simulation',
        existingSimulation: existingStatus
      });
    }

    // Initialize compound interest simulation
    const simulation = await compoundSim.initializeUserSimulation(userId, currentBalance);
    
    if (!simulation) {
      return res.status(500).json({ error: 'Failed to initialize simulation' });
    }

    // Update user simulation status
    await database.updateUser(userId, {
      simulationActive: true,
      lastSimulationUpdate: new Date().toISOString()
    });

    // Format response to match old simulation system format
    res.status(201).json({
      message: 'Monthly simulation initialized successfully',
      monthlyTarget: {
        targetPercentage: (simulation.firstMonthRate * 100).toFixed(2),
        targetAmount: simulation.projectedReturn,
        daysInMonth: 30,
        startingBalance: currentBalance
      }
    });

  } catch (error) {
    console.error('Error initializing simulation:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;