const express = require('express');
const { authenticateToken } = require('../middleware/auth');
const EnhancedIntradayTradeService = require('../services/enhancedIntradayTradeService');
const PositionBalanceManager = require('../services/positionBalanceManager');
const database = require('../database');

const router = express.Router();

// Initialize services
const enhancedTradeService = new EnhancedIntradayTradeService(database);
const positionManager = new PositionBalanceManager(database);

/**
 * GET /enhanced-trading/status
 * Get enhanced trading system status and daily progress
 */
router.get('/status', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Get user's compound interest status for daily target
    const user = await database.getUserById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    // Get current portfolio status
    const portfolioSummary = await positionManager.getPortfolioSummary(userId);
    
    // TODO: Replace with actual daily target from compound interest simulation
    const dailyTarget = 105.95; // This should come from the user's active simulation
    const currentProgress = portfolioSummary.dailyPL;
    const progressPercent = dailyTarget > 0 ? (currentProgress / dailyTarget) * 100 : 0;

    // Simulate enhanced trading data
    const enhancedTradingStatus = {
      isActive: true,
      dailyTarget,
      currentProgress,
      progressPercent: Math.min(progressPercent, 100),
      totalTrades: 75, // This would come from today's trade count
      completedTrades: 75,
      activeTrades: portfolioSummary.openPositionsCount,
      portfolio: {
        totalValue: portfolioSummary.totalPortfolioValue,
        availableBalance: portfolioSummary.availableBalance,
        lockedCapital: portfolioSummary.lockedCapital,
        dailyPL: portfolioSummary.dailyPL,
        dailyPLPercent: portfolioSummary.dailyPLPercent,
        utilizationPercent: portfolioSummary.utilizationPercent
      },
      volatilityProfile: 'aggressive',
      todaysStats: {
        maxGain: 1.1,
        maxDrawdown: -0.3,
        volatilityRange: 1.4,
        winRate: 58.7,
        avgTradeSize: 1.41
      },
      lastUpdated: new Date().toISOString()
    };

    res.json({
      success: true,
      data: enhancedTradingStatus
    });

  } catch (error) {
    console.error('Error getting enhanced trading status:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get enhanced trading status'
    });
  }
});

/**
 * GET /enhanced-trading/positions
 * Get current position data and history
 */
router.get('/positions', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Get portfolio summary and position history
    const [portfolioSummary, positionHistory] = await Promise.all([
      positionManager.getPortfolioSummary(userId),
      positionManager.getPositionHistory(userId, 20)
    ]);

    const positionData = {
      userId,
      availableBalance: portfolioSummary.availableBalance,
      lockedCapital: portfolioSummary.lockedCapital,
      totalPortfolioValue: portfolioSummary.totalPortfolioValue,
      dailyPL: portfolioSummary.dailyPL,
      dailyPLPercent: portfolioSummary.dailyPLPercent,
      openPositions: portfolioSummary.openPositions,
      utilizationPercent: portfolioSummary.utilizationPercent,
      maxUtilization: 18.8, // TODO: Calculate actual max utilization for today
      positionHistory: positionHistory.map(h => ({
        id: h.id,
        symbol: h.symbol,
        type: h.action === 'open' ? 'long' : 'short', // Simplified for display
        capitalLocked: h.capitalLocked,
        currentPL: h.finalPL || 0,
        expectedPL: h.finalPL || 0,
        openTime: h.timestamp,
        duration: 120, // TODO: Calculate actual duration
        status: h.action === 'close' ? 'closed' : 'open',
        variance: 'medium' // TODO: Get actual variance from trade data
      })),
      lastUpdated: new Date().toISOString()
    };

    res.json({
      success: true,
      data: positionData
    });

  } catch (error) {
    console.error('Error getting position data:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get position data'
    });
  }
});

/**
 * GET /enhanced-trading/recent-trades
 * Get recent trading activity
 */
router.get('/recent-trades', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const limit = parseInt(req.query.limit) || 10;
    
    // Get recent position history
    const positionHistory = await positionManager.getPositionHistory(userId, limit);
    
    const recentTrades = positionHistory
      .filter(h => h.action === 'close') // Only closed positions
      .map(h => ({
        id: h.id,
        symbol: h.symbol,
        type: Math.random() > 0.5 ? 'long' : 'short', // TODO: Get actual trade type
        profitLoss: h.finalPL || 0,
        timestamp: h.timestamp,
        status: 'closed'
      }));

    res.json({
      success: true,
      data: recentTrades
    });

  } catch (error) {
    console.error('Error getting recent trades:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get recent trades'
    });
  }
});

/**
 * POST /enhanced-trading/generate-daily-trades
 * Generate enhanced daily trades for a user
 */
router.post('/generate-daily-trades', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { dailyTargetAmount, accountBalance, date } = req.body;

    if (!dailyTargetAmount || !accountBalance) {
      return res.status(400).json({
        success: false,
        error: 'dailyTargetAmount and accountBalance are required'
      });
    }

    // Generate enhanced daily trades
    const dailySchedule = await enhancedTradeService.generateEnhancedDailyTrades({
      dailyTargetAmount,
      accountBalance,
      userId,
      date: date || new Date().toISOString().split('T')[0]
    });

    res.json({
      success: true,
      data: dailySchedule
    });

  } catch (error) {
    console.error('Error generating daily trades:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate daily trades'
    });
  }
});

/**
 * POST /enhanced-trading/execute-daily-trades
 * Execute the generated daily trades
 */
router.post('/execute-daily-trades', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { dailySchedule } = req.body;

    if (!dailySchedule) {
      return res.status(400).json({
        success: false,
        error: 'dailySchedule is required'
      });
    }

    // Execute the daily trades
    const executionResult = await enhancedTradeService.executeDailyTrades(dailySchedule);

    res.json({
      success: true,
      data: executionResult
    });

  } catch (error) {
    console.error('Error executing daily trades:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to execute daily trades'
    });
  }
});

/**
 * GET /enhanced-trading/analytics
 * Get comprehensive portfolio analytics
 */
router.get('/analytics', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Get portfolio analytics
    const analytics = await positionManager.getPortfolioAnalytics(userId);

    res.json({
      success: true,
      data: analytics
    });

  } catch (error) {
    console.error('Error getting portfolio analytics:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get portfolio analytics'
    });
  }
});

/**
 * POST /enhanced-trading/reset-daily
 * Reset daily tracking (typically called at start of new day)
 */
router.post('/reset-daily', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Reset daily tracking
    const updatedPortfolio = await positionManager.resetDailyTracking(userId);

    res.json({
      success: true,
      data: updatedPortfolio
    });

  } catch (error) {
    console.error('Error resetting daily tracking:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to reset daily tracking'
    });
  }
});

/**
 * GET /enhanced-trading/test-system
 * Test the enhanced trading system (development only)
 */
router.get('/test-system', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Test parameters
    const testParams = {
      dailyTargetAmount: 105.95,
      accountBalance: 10000,
      userId,
      date: new Date().toISOString().split('T')[0]
    };

    // Generate and execute test trades
    const dailySchedule = await enhancedTradeService.generateEnhancedDailyTrades(testParams);
    const executionResult = await enhancedTradeService.executeDailyTrades(dailySchedule);

    res.json({
      success: true,
      data: {
        dailySchedule,
        executionResult,
        message: 'Enhanced trading system test completed successfully'
      }
    });

  } catch (error) {
    console.error('Error testing enhanced trading system:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to test enhanced trading system'
    });
  }
});

module.exports = router;