const { v4: uuidv4 } = require('uuid');
const VolatilityTradeGenerator = require('./volatilityTradeGenerator');
const PositionBalanceManager = require('./positionBalanceManager');

/**
 * Enhanced Intraday Trade Service
 * Integrates high-volatility trade generation with position-based balance management
 * 
 * Key Features:
 * - Mathematical precision to exact daily targets
 * - High-volatility trading with dramatic swings
 * - Position-based capital locking and management
 * - Real-time balance tracking
 * - 24/7 crypto market simulation
 */
class EnhancedIntradayTradeService {
  constructor(database = null) {
    this.database = database;
    this.volatilityGenerator = new VolatilityTradeGenerator();
    this.positionManager = new PositionBalanceManager(database);
    
    // Enhanced trading parameters
    this.tradingProfile = 'aggressive'; // Future: user-selectable profiles
    this.enablePositionTracking = true;
    this.enableRealTimeUpdates = true;
  }

  /**
   * Generate complete daily trading schedule with position management
   * @param {Object} params - { dailyTargetAmount, accountBalance, userId, date }
   * @returns {Object} Complete enhanced trading schedule
   */
  async generateEnhancedDailyTrades(params) {
    const {
      dailyTargetAmount,
      accountBalance,
      userId,
      date = new Date().toISOString().split('T')[0],
      profile = this.tradingProfile
    } = params;

    console.log(`🚀 Enhanced Trading Generation for ${date}`);
    console.log(`💰 Account: $${accountBalance.toLocaleString()} | Target: $${dailyTargetAmount.toFixed(2)} | Profile: ${profile}`);

    try {
      // Step 1: Generate high-volatility trades with exact target precision
      const volatilityResult = this.volatilityGenerator.generateVolatilityTrades({
        dailyTargetAmount,
        accountBalance,
        date,
        profile
      });

      console.log(`🎢 Generated ${volatilityResult.totalTrades} high-volatility trades`);
      console.log(`📊 Swing Range: ${volatilityResult.summary.portfolioSwingRange.totalSwingRange.toFixed(1)}%`);

      // Step 2: Enhanced position management integration
      const enhancedTrades = await this.enhanceTradesWithPositionManagement(
        volatilityResult.trades,
        userId,
        accountBalance
      );

      // Step 3: Validate enhanced system
      const enhancedValidation = this.validateEnhancedTrades(enhancedTrades, dailyTargetAmount);

      // Step 4: Calculate portfolio statistics
      const portfolioStats = this.calculatePortfolioStatistics(enhancedTrades, accountBalance);

      // Step 5: Generate intraday balance simulation
      const balanceSimulation = await this.generateIntradayBalanceSimulation(
        enhancedTrades,
        userId,
        accountBalance
      );

      console.log(`✅ Enhanced generation complete: ${enhancedValidation.actualTotal.toFixed(2)} total (target: ${dailyTargetAmount.toFixed(2)})`);
      console.log(`📈 Max swing: +${portfolioStats.maxSwingUpPercent.toFixed(1)}% | Min swing: ${portfolioStats.maxSwingDownPercent.toFixed(1)}%`);

      return {
        date,
        userId,
        dailyTargetAmount,
        accountBalance,
        profile,
        
        // Core trade data
        totalTrades: enhancedTrades.length,
        trades: enhancedTrades,
        
        // Validation and precision
        validation: enhancedValidation,
        originalVolatilityResult: volatilityResult,
        
        // Position management
        portfolioStats,
        balanceSimulation,
        
        // System info
        enhancedFeatures: {
          volatilityTradeGeneration: true,
          positionBasedBalanceManagement: true,
          realTimeBalanceTracking: true,
          mathematicalPrecision: enhancedValidation.mathematicalPrecision
        },
        
        // Summary metrics
        summary: {
          totalAmount: enhancedValidation.actualTotal,
          winningTrades: enhancedTrades.filter(t => t.profitLoss > 0).length,
          losingTrades: enhancedTrades.filter(t => t.profitLoss < 0).length,
          winRate: enhancedTrades.filter(t => t.profitLoss > 0).length / enhancedTrades.length,
          avgTradeSize: Math.abs(enhancedValidation.actualTotal) / enhancedTrades.length,
          maxWin: Math.max(...enhancedTrades.map(t => t.profitLoss)),
          maxLoss: Math.min(...enhancedTrades.map(t => t.profitLoss)),
          portfolioSwingRange: portfolioStats.totalSwingRange,
          maximumDrawdown: portfolioStats.maxSwingDownPercent,
          maximumGain: portfolioStats.maxSwingUpPercent,
          volatilityLevel: portfolioStats.totalSwingRange > 30 ? 'HIGH' : portfolioStats.totalSwingRange > 15 ? 'MEDIUM' : 'LOW'
        },
        
        generatedAt: new Date().toISOString()
      };

    } catch (error) {
      console.error('❌ Error in enhanced trade generation:', error);
      throw error;
    }
  }

  /**
   * Enhance trades with position management data
   * @param {Array} trades - Basic trades from volatility generator
   * @param {string} userId - User ID
   * @param {number} accountBalance - Account balance
   * @returns {Array} Enhanced trades with position data
   */
  async enhanceTradesWithPositionManagement(trades, userId, accountBalance) {
    const enhancedTrades = [];
    
    // Initialize or get user portfolio
    await this.positionManager.getUserPortfolio(userId);
    
    for (let i = 0; i < trades.length; i++) {
      const trade = trades[i];
      
      // Enhanced trade object with position management
      const enhancedTrade = {
        ...trade,
        
        // Position management fields
        positionManagement: {
          capitalRequired: trade.positionSize,
          willLockCapital: true,
          estimatedLockDuration: trade.duration,
          expectedReturn: trade.profitLoss,
          riskLevel: trade.variance,
          utilizationImpact: (trade.positionSize / accountBalance) * 100
        },
        
        // Execution phases
        executionPhases: {
          open: {
            timestamp: trade.timestamp,
            action: 'open_position',
            capitalLocked: trade.positionSize,
            availableBalanceAfter: null // Will be calculated during execution
          },
          close: {
            timestamp: trade.lockEndTime,
            action: 'close_position',
            profitLoss: trade.profitLoss,
            capitalReturned: trade.positionSize + trade.profitLoss,
            availableBalanceAfter: null // Will be calculated during execution
          }
        },
        
        // Real-time tracking
        realTimeTracking: {
          positionId: null, // Will be set when position is opened
          currentStatus: 'pending',
          currentPL: 0,
          balanceImpact: 0
        }
      };
      
      enhancedTrades.push(enhancedTrade);
    }
    
    return enhancedTrades;
  }

  /**
   * Validate enhanced trades for mathematical precision
   * @param {Array} enhancedTrades - Enhanced trades
   * @param {number} expectedTotal - Expected total
   * @returns {Object} Enhanced validation result
   */
  validateEnhancedTrades(enhancedTrades, expectedTotal) {
    const actualTotal = enhancedTrades.reduce((sum, trade) => sum + trade.profitLoss, 0);
    const difference = Math.abs(actualTotal - expectedTotal);
    
    // Position management validation
    const totalCapitalRequired = enhancedTrades.reduce((sum, trade) => 
      sum + trade.positionManagement.capitalRequired, 0
    );
    
    const winningTrades = enhancedTrades.filter(trade => trade.profitLoss > 0).length;
    const losingTrades = enhancedTrades.length - winningTrades;
    
    return {
      // Mathematical precision
      isValid: difference < 0.01,
      expectedTotal,
      actualTotal,
      difference,
      mathematicalPrecision: difference < 0.001 ? 'perfect' : difference < 0.01 ? 'excellent' : 'good',
      
      // Trade statistics
      tradeCount: enhancedTrades.length,
      winningTrades,
      losingTrades,
      winRate: winningTrades / enhancedTrades.length,
      avgTradeSize: Math.abs(actualTotal) / enhancedTrades.length,
      maxWin: Math.max(...enhancedTrades.map(t => t.profitLoss)),
      maxLoss: Math.min(...enhancedTrades.map(t => t.profitLoss)),
      
      // Position management validation
      totalCapitalRequired,
      averagePositionSize: totalCapitalRequired / enhancedTrades.length,
      largestPosition: Math.max(...enhancedTrades.map(t => t.positionManagement.capitalRequired)),
      
      // Enhanced features confirmation
      enhancedFeatures: {
        volatilityGeneration: true,
        positionManagement: true,
        realTimeTracking: true,
        mathematicalPrecision: true
      }
    };
  }

  /**
   * Calculate portfolio statistics including swing analysis
   * @param {Array} trades - All trades
   * @param {number} startingBalance - Starting balance
   * @returns {Object} Portfolio statistics
   */
  calculatePortfolioStatistics(trades, startingBalance) {
    let runningBalance = startingBalance;
    let availableBalance = startingBalance;
    let minBalance = startingBalance;
    let maxBalance = startingBalance;
    let maxLockedCapital = 0;
    
    const balanceHistory = [{ timestamp: trades[0]?.timestamp, balance: startingBalance }];
    
    for (const trade of trades) {
      // Simulate opening position
      availableBalance -= trade.positionManagement.capitalRequired;
      const currentLockedCapital = startingBalance - availableBalance + (runningBalance - startingBalance);
      maxLockedCapital = Math.max(maxLockedCapital, currentLockedCapital);
      
      // Simulate closing position  
      availableBalance += trade.positionManagement.capitalRequired + trade.profitLoss;
      runningBalance += trade.profitLoss;
      
      minBalance = Math.min(minBalance, runningBalance);
      maxBalance = Math.max(maxBalance, runningBalance);
      
      balanceHistory.push({
        timestamp: trade.lockEndTime,
        balance: runningBalance,
        availableBalance,
        change: trade.profitLoss
      });
    }
    
    const maxSwingUp = ((maxBalance - startingBalance) / startingBalance) * 100;
    const maxSwingDown = ((minBalance - startingBalance) / startingBalance) * 100;
    const totalSwingRange = maxSwingUp - maxSwingDown;
    const maxUtilization = (maxLockedCapital / startingBalance) * 100;
    
    return {
      startingBalance,
      endingBalance: runningBalance,
      minBalance,
      maxBalance,
      maxSwingUpPercent: maxSwingUp,
      maxSwingDownPercent: maxSwingDown,
      totalSwingRange,
      maxUtilization,
      maxLockedCapital,
      balanceHistory
    };
  }

  /**
   * Generate intraday balance simulation for real-time tracking
   * @param {Array} trades - All trades
   * @param {string} userId - User ID
   * @param {number} startingBalance - Starting balance
   * @returns {Object} Balance simulation data
   */
  async generateIntradayBalanceSimulation(trades, userId, startingBalance) {
    const simulation = {
      userId,
      startingBalance,
      currentBalance: startingBalance,
      availableBalance: startingBalance,
      lockedCapital: 0,
      dailyPL: 0,
      openPositions: [],
      balanceUpdates: [],
      positionHistory: []
    };
    
    // Reset daily tracking for user
    await this.positionManager.resetDailyTracking(userId);
    
    // Simulate each trade execution
    for (let i = 0; i < trades.length; i++) {
      const trade = trades[i];
      
      // Simulate opening position
      const openResult = await this.simulatePositionOpen(trade, simulation);
      
      // Add intermediate balance updates for realism
      const intermediateUpdates = this.generateIntermediateUpdates(trade, openResult.balanceAfterOpen);
      simulation.balanceUpdates.push(...intermediateUpdates);
      
      // Simulate closing position
      const closeResult = await this.simulatePositionClose(trade, simulation);
      
      simulation.balanceUpdates.push({
        timestamp: trade.lockEndTime,
        action: 'position_closed',
        trade: {
          symbol: trade.cryptoSymbol,
          type: trade.tradeType,
          profitLoss: trade.profitLoss
        },
        balances: {
          available: closeResult.availableBalance,
          total: closeResult.totalBalance,
          dailyPL: closeResult.dailyPL
        }
      });
    }
    
    return simulation;
  }

  /**
   * Simulate opening a position
   * @param {Object} trade - Trade object
   * @param {Object} simulation - Current simulation state
   * @returns {Object} Open result
   */
  async simulatePositionOpen(trade, simulation) {
    const capitalLocked = trade.positionManagement.capitalRequired;
    
    simulation.availableBalance -= capitalLocked;
    simulation.lockedCapital += capitalLocked;
    
    const position = {
      id: uuidv4(),
      tradeId: trade.id,
      symbol: trade.cryptoSymbol,
      type: trade.tradeType,
      capitalLocked,
      expectedPL: trade.profitLoss,
      openTime: trade.timestamp,
      status: 'open'
    };
    
    simulation.openPositions.push(position);
    
    simulation.balanceUpdates.push({
      timestamp: trade.timestamp,
      action: 'position_opened',
      trade: {
        symbol: trade.cryptoSymbol,
        type: trade.tradeType,
        capitalLocked
      },
      balances: {
        available: simulation.availableBalance,
        locked: simulation.lockedCapital,
        total: simulation.currentBalance
      }
    });
    
    return {
      balanceAfterOpen: simulation.availableBalance,
      positionId: position.id
    };
  }

  /**
   * Simulate closing a position
   * @param {Object} trade - Trade object
   * @param {Object} simulation - Current simulation state
   * @returns {Object} Close result
   */
  async simulatePositionClose(trade, simulation) {
    const position = simulation.openPositions.find(p => p.tradeId === trade.id);
    if (!position) {
      throw new Error(`Position not found for trade ${trade.id}`);
    }
    
    const capitalReturned = position.capitalLocked + trade.profitLoss;
    
    simulation.availableBalance += capitalReturned;
    simulation.lockedCapital -= position.capitalLocked;
    simulation.currentBalance += trade.profitLoss;
    simulation.dailyPL += trade.profitLoss;
    
    // Remove from open positions
    simulation.openPositions = simulation.openPositions.filter(p => p.id !== position.id);
    
    // Add to position history
    simulation.positionHistory.push({
      ...position,
      closeTime: trade.lockEndTime,
      finalPL: trade.profitLoss,
      status: 'closed'
    });
    
    return {
      availableBalance: simulation.availableBalance,
      totalBalance: simulation.currentBalance,
      dailyPL: simulation.dailyPL
    };
  }

  /**
   * Generate intermediate balance updates for realism
   * @param {Object} trade - Trade object
   * @param {number} currentBalance - Current balance
   * @returns {Array} Intermediate updates
   */
  generateIntermediateUpdates(trade, currentBalance) {
    const updates = [];
    const steps = Math.min(5, Math.floor(trade.duration / 30)); // Update every 30 minutes, max 5 updates
    
    if (steps < 2) return updates;
    
    const openTime = new Date(trade.timestamp);
    const closeTime = new Date(trade.lockEndTime);
    const durationMs = closeTime - openTime;
    const stepDuration = durationMs / steps;
    
    for (let i = 1; i < steps; i++) {
      const timestamp = new Date(openTime.getTime() + (stepDuration * i));
      const progress = i / steps;
      const currentPL = trade.profitLoss * progress * (0.7 + Math.random() * 0.6); // Add some variance
      
      updates.push({
        timestamp: timestamp.toISOString(),
        action: 'position_update',
        trade: {
          symbol: trade.cryptoSymbol,
          type: trade.tradeType,
          currentPL: currentPL,
          progress: (progress * 100).toFixed(1) + '%'
        },
        balances: {
          unrealizedPL: currentPL,
          estimatedTotal: currentBalance + currentPL
        }
      });
    }
    
    return updates;
  }

  /**
   * Execute daily trades with real position management
   * @param {Object} dailyTradeSchedule - Schedule from generateEnhancedDailyTrades
   * @returns {Object} Execution result
   */
  async executeDailyTrades(dailyTradeSchedule) {
    const { userId, trades } = dailyTradeSchedule;
    
    console.log(`🎬 Executing ${trades.length} trades for user ${userId}`);
    
    const executionResults = [];
    
    for (const trade of trades) {
      try {
        // Open position
        const openResult = await this.positionManager.openPosition(userId, {
          symbol: trade.cryptoSymbol,
          type: trade.tradeType,
          capitalLocked: trade.positionSize,
          expectedPL: trade.profitLoss,
          tradeId: trade.id,
          timestamp: trade.timestamp
        });
        
        if (!openResult.success) {
          console.error(`❌ Failed to open position for trade ${trade.id}:`, openResult.error);
          continue;
        }
        
        // Update position P&L during trade lifetime (simulate market movement)
        await this.positionManager.updatePositionPL(
          userId, 
          openResult.position.id, 
          trade.profitLoss * 0.8 // 80% of final P&L during trade
        );
        
        // Close position with final P&L
        const closeResult = await this.positionManager.closePosition(
          userId, 
          openResult.position.id, 
          trade.profitLoss
        );
        
        if (!closeResult.success) {
          console.error(`❌ Failed to close position for trade ${trade.id}:`, closeResult.error);
          continue;
        }
        
        executionResults.push({
          trade,
          openResult,
          closeResult,
          success: true
        });
        
      } catch (error) {
        console.error(`❌ Error executing trade ${trade.id}:`, error);
        executionResults.push({
          trade,
          error: error.message,
          success: false
        });
      }
    }
    
    // Get final portfolio summary
    const finalPortfolio = await this.positionManager.getPortfolioSummary(userId);
    
    console.log(`✅ Executed ${executionResults.filter(r => r.success).length}/${trades.length} trades successfully`);
    
    return {
      userId,
      executionResults,
      finalPortfolio,
      summary: {
        totalTrades: trades.length,
        successfulTrades: executionResults.filter(r => r.success).length,
        failedTrades: executionResults.filter(r => !r.success).length,
        finalBalance: finalPortfolio.totalPortfolioValue,
        dailyPL: finalPortfolio.dailyPL
      }
    };
  }
}

module.exports = EnhancedIntradayTradeService;