/**
 * Portfolio Balance Service
 * Calculates real-time portfolio balance including cash, open positions, and P/L
 * Handles position sizing where trades deduct cash when opened and return investment + P/L when closed
 */
class PortfolioBalanceService {
  constructor() {
    this.CompoundInterestSimulation = require('./compoundInterestSimulation');
    this.compoundSim = new this.CompoundInterestSimulation();
  }

  /**
   * Calculate current portfolio state with position sizing
   * @param {string} userId - User ID
   * @param {string} timestamp - Current timestamp (ISO string)
   * @returns {Object} Portfolio state
   */
  async calculatePortfolioState(userId, timestamp = null) {
    try {
      if (!timestamp) {
        timestamp = new Date().toISOString();
      }

      const currentTime = new Date(timestamp);
      const today = currentTime.toISOString().split('T')[0];

      // Get user's compound interest simulation
      const simulation = await this.compoundSim.getUserSimulation(userId);
      if (!simulation) {
        return this.getEmptyPortfolioState();
      }

      // Get current month data
      const currentMonth = simulation.months.find(m => m.status === 'active');
      if (!currentMonth) {
        return this.getEmptyPortfolioState();
      }

      // Get today's trades
      const dailyTrades = await this.compoundSim.getDailyTrades(userId, today);
      if (!dailyTrades || !dailyTrades.trades) {
        return this.getStartOfDayState(currentMonth.startingBalance);
      }

      // Calculate portfolio state based on trade timing
      return this.calculateRealTimeState(
        currentMonth.startingBalance,
        dailyTrades.trades,
        currentTime
      );

    } catch (error) {
      console.error('Error calculating portfolio state:', error);
      return this.getEmptyPortfolioState();
    }
  }

  /**
   * Calculate real-time portfolio state considering position sizing
   * @param {number} startingBalance - Start of day balance
   * @param {Array} trades - Today's trades
   * @param {Date} currentTime - Current timestamp
   * @returns {Object} Portfolio state
   */
  calculateRealTimeState(startingBalance, trades, currentTime) {
    let cashBalance = startingBalance;
    let openPositions = [];
    let realizedPL = 0;
    let totalInvested = 0;

    trades.forEach(trade => {
      const tradeOpen = new Date(trade.timestamp);
      const tradeClose = new Date(tradeOpen.getTime() + (trade.duration * 60 * 1000)); // Add duration in minutes

      if (tradeOpen <= currentTime) {
        // Calculate position size (5-15% of current cash balance)
        const positionSizePercent = 0.05 + (Math.random() * 0.10); // 5-15%
        const positionSize = Math.min(cashBalance * positionSizePercent, cashBalance * 0.2); // Max 20%

        if (tradeClose > currentTime) {
          // Position is still open
          cashBalance -= positionSize;
          totalInvested += positionSize;

          // Calculate current position value with some volatility
          const timeOpen = (currentTime - tradeOpen) / (1000 * 60); // Minutes open
          const volatilityFactor = 1 + (Math.sin(timeOpen / 10) * 0.02); // ±2% volatility
          const currentValue = positionSize * volatilityFactor;
          const unrealizedPL = currentValue - positionSize;

          openPositions.push({
            symbol: trade.cryptoSymbol,
            type: trade.tradeType,
            positionSize: Math.round(positionSize * 100) / 100,
            currentValue: Math.round(currentValue * 100) / 100,
            unrealizedPL: Math.round(unrealizedPL * 100) / 100,
            openTime: trade.timestamp,
            duration: Math.floor(timeOpen),
            expectedClose: tradeClose.toISOString()
          });
        } else {
          // Position has closed
          realizedPL += trade.profitLoss;
        }
      }
    });

    const finalCashBalance = startingBalance + realizedPL - totalInvested;
    const totalPositionValue = openPositions.reduce((sum, pos) => sum + pos.currentValue, 0);
    const totalPortfolioValue = finalCashBalance + totalPositionValue;
    const totalUnrealizedPL = openPositions.reduce((sum, pos) => sum + pos.unrealizedPL, 0);

    return {
      totalPortfolioValue: Math.round(totalPortfolioValue * 100) / 100,
      cashBalance: Math.round(finalCashBalance * 100) / 100,
      investedAmount: Math.round(totalInvested * 100) / 100,
      unrealizedPL: Math.round(totalUnrealizedPL * 100) / 100,
      realizedPL: Math.round(realizedPL * 100) / 100,
      openPositions,
      startOfDayBalance: startingBalance,
      todaysChange: Math.round((totalPortfolioValue - startingBalance) * 100) / 100,
      todaysChangePercent: ((totalPortfolioValue - startingBalance) / startingBalance * 100).toFixed(2)
    };
  }

  /**
   * Get balance timeline for charting
   * @param {string} userId - User ID
   * @param {string} date - Date (YYYY-MM-DD)
   * @returns {Array} Timeline points
   */
  async getBalanceTimeline(userId, date = null) {
    try {
      if (!date) {
        date = new Date().toISOString().split('T')[0];
      }

      const simulation = await this.compoundSim.getUserSimulation(userId);
      if (!simulation) {
        return [];
      }

      const currentMonth = simulation.months.find(m => m.status === 'active');
      if (!currentMonth) {
        return [];
      }

      const dailyTrades = await this.compoundSim.getDailyTrades(userId, date);
      if (!dailyTrades || !dailyTrades.trades) {
        return [{
          time: `${date}T09:00:00.000Z`,
          totalValue: currentMonth.startingBalance,
          cashBalance: currentMonth.startingBalance,
          investedAmount: 0,
          openPositions: [],
          event: 'Market Open'
        }];
      }

      return this.generateTimelinePoints(
        currentMonth.startingBalance,
        dailyTrades.trades,
        date
      );

    } catch (error) {
      console.error('Error getting balance timeline:', error);
      return [];
    }
  }

  /**
   * Generate timeline points for portfolio balance chart
   * @param {number} startingBalance - Start of day balance
   * @param {Array} trades - Today's trades
   * @param {string} date - Date string
   * @returns {Array} Timeline points
   */
  generateTimelinePoints(startingBalance, trades, date) {
    const timeline = [];
    
    // Add market open point
    timeline.push({
      time: `${date}T09:00:00.000Z`,
      totalValue: startingBalance,
      cashBalance: startingBalance,
      investedAmount: 0,
      openPositions: [],
      event: 'Market Open',
      type: 'market_open'
    });

    // Sort trades by timestamp
    const sortedTrades = trades.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

    let runningCash = startingBalance;
    let runningInvested = 0;
    let runningRealized = 0;
    const activePositions = new Map();

    // Generate points for each trade open and close
    sortedTrades.forEach((trade, index) => {
      const openTime = new Date(trade.timestamp);
      const closeTime = new Date(openTime.getTime() + (trade.duration * 60 * 1000));
      
      // Position size calculation
      const positionSizePercent = 0.05 + (Math.random() * 0.10);
      const positionSize = Math.min(runningCash * positionSizePercent, runningCash * 0.2);

      // Trade open point
      runningCash -= positionSize;
      runningInvested += positionSize;
      activePositions.set(trade.id, {
        symbol: trade.cryptoSymbol,
        size: positionSize,
        openTime: trade.timestamp
      });

      timeline.push({
        time: trade.timestamp,
        totalValue: runningCash + runningInvested, // Same total initially
        cashBalance: runningCash,
        investedAmount: runningInvested,
        openPositions: Array.from(activePositions.values()),
        event: `${trade.cryptoSymbol} ${trade.tradeType.toUpperCase()} Opened`,
        type: 'position_open',
        symbol: trade.cryptoSymbol,
        amount: positionSize
      });

      // Trade close point
      runningCash += positionSize + trade.profitLoss;
      runningInvested -= positionSize;
      runningRealized += trade.profitLoss;
      activePositions.delete(trade.id);

      timeline.push({
        time: closeTime.toISOString(),
        totalValue: runningCash + runningInvested,
        cashBalance: runningCash,
        investedAmount: runningInvested,
        openPositions: Array.from(activePositions.values()),
        event: `${trade.cryptoSymbol} ${trade.tradeType.toUpperCase()} Closed (${trade.profitLoss >= 0 ? '+' : ''}$${trade.profitLoss.toFixed(2)})`,
        type: 'position_close',
        symbol: trade.cryptoSymbol,
        profitLoss: trade.profitLoss
      });
    });

    return timeline;
  }

  /**
   * Get empty portfolio state for users without simulations
   */
  getEmptyPortfolioState() {
    return {
      totalPortfolioValue: 0,
      cashBalance: 0,
      investedAmount: 0,
      unrealizedPL: 0,
      realizedPL: 0,
      openPositions: [],
      startOfDayBalance: 0,
      todaysChange: 0,
      todaysChangePercent: '0.00'
    };
  }

  /**
   * Get start of day state for users with no trades yet
   */
  getStartOfDayState(startingBalance) {
    return {
      totalPortfolioValue: startingBalance,
      cashBalance: startingBalance,
      investedAmount: 0,
      unrealizedPL: 0,
      realizedPL: 0,
      openPositions: [],
      startOfDayBalance: startingBalance,
      todaysChange: 0,
      todaysChangePercent: '0.00'
    };
  }

  /**
   * Get portfolio summary with historical context
   * @param {string} userId - User ID
   * @returns {Object} Portfolio summary
   */
  async getPortfolioSummary(userId) {
    try {
      const simulation = await this.compoundSim.getUserSimulation(userId);
      if (!simulation) {
        return null;
      }

      const currentState = await this.calculatePortfolioState(userId);
      
      // Calculate total earned since joining
      const totalEarned = simulation.months.reduce((sum, month) => {
        return sum + (month.actualInterestPaid || 0);
      }, 0);

      return {
        ...currentState,
        totalEarnedSinceJoining: Math.round(totalEarned * 100) / 100,
        joinDate: simulation.startDate,
        monthsActive: simulation.months.length,
        currentMonthProgress: this.getCurrentMonthProgress(simulation)
      };

    } catch (error) {
      console.error('Error getting portfolio summary:', error);
      return null;
    }
  }

  /**
   * Get current month progress
   */
  getCurrentMonthProgress(simulation) {
    const currentMonth = simulation.months.find(m => m.status === 'active');
    if (!currentMonth) return null;

    const today = new Date();
    const dayOfMonth = today.getDate();
    const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
    const progressPercent = (dayOfMonth / daysInMonth) * 100;

    return {
      currentDay: dayOfMonth,
      totalDays: daysInMonth,
      progressPercent: Math.round(progressPercent * 100) / 100,
      targetInterest: currentMonth.projectedInterest,
      earnedInterest: currentMonth.actualInterestPaid || 0
    };
  }
}

module.exports = PortfolioBalanceService;