const { v4: uuidv4 } = require('uuid');
const PositionManager = require('./positionManager');

/**
 * Intraday Trade Generation Service
 * Generates realistic trade sequences that net to exact daily targets
 * 
 * Key Features:
 * - Account-based trade scaling (20-100 trades/day)
 * - Distributed across 24/7 crypto market hours
 * - Multiple crypto symbols with realistic variety
 * - Individual trade win/loss patterns
 * - Mathematical precision to daily targets
 */
class IntradayTradeService {
  constructor() {
    // Available cryptocurrency symbols
    this.cryptoSymbols = [
      { symbol: 'BTC', name: 'Bitcoin', weight: 0.25 },
      { symbol: 'ETH', name: 'Ethereum', weight: 0.20 },
      { symbol: 'ADA', name: 'Cardano', weight: 0.12 },
      { symbol: 'SOL', name: 'Solana', weight: 0.12 },
      { symbol: 'DOT', name: 'Polkadot', weight: 0.10 },
      { symbol: 'LINK', name: 'Chainlink', weight: 0.08 },
      { symbol: 'UNI', name: 'Uniswap', weight: 0.08 },
      { symbol: 'AAVE', name: 'Aave', weight: 0.05 }
    ];

    // Trading parameters - Crypto markets are 24/7
    this.marketStartHour = 0;  // 12 AM (midnight)
    this.marketEndHour = 24;   // 11:59 PM (end of day)
    this.marketHours = this.marketEndHour - this.marketStartHour;
    
    // Trade win rate for individual trades (different from daily win rate)
    this.tradeWinRate = 0.62; // 62% of individual trades are winners
    
    // Position manager for 80% rolling lock system
    this.positionManager = new PositionManager();
    
    // Trade size variance
    this.minTradeSize = 0.3;  // 30% of average
    this.maxTradeSize = 2.5;  // 250% of average
  }

  /**
   * Generate daily trade schedule
   * @param {Object} params - { dailyTargetAmount, accountBalance, tradeCount?, date? }
   * @returns {Object} Complete daily trade schedule
   */
  generateDailyTrades(params) {
    const {
      dailyTargetAmount,
      accountBalance,
      tradeCount = this.getTradeCount(accountBalance),
      date = new Date().toISOString().split('T')[0]
    } = params;

    console.log(`🎯 Generating ${tradeCount} trades for ${date}: Target $${dailyTargetAmount.toFixed(2)}`);
    console.log(`🔄 Rolling 80% Lock System: $${accountBalance} account`);

    // 🔄 Step 0: Generate rolling position plan for 80% utilization
    const positionPlan = this.positionManager.generateRollingPositionPlan(
      accountBalance, 
      tradeCount, 
      dailyTargetAmount
    );

    // Use the enhanced trade count from position plan
    const enhancedTradeCount = positionPlan.totalTradeCount;

    // Step 1: Generate trade timing throughout the day
    const tradeTimes = this.generateTradeTimes(enhancedTradeCount, date);

    // Step 2: Assign crypto symbols to trades
    const tradeSymbols = this.assignCryptoSymbols(enhancedTradeCount);

    // Step 3: Generate individual trade amounts that net to target (with capital management)
    const tradeAmounts = this.generateTradeAmounts(dailyTargetAmount, enhancedTradeCount, accountBalance);

    // Step 4: Assign trade types (long/short) based on amounts
    const baseTrades = this.createTradeObjects(tradeTimes, tradeSymbols, tradeAmounts, dailyTargetAmount);

    // 🔄 Step 5: Enhance trades with position management data
    const trades = this.positionManager.enhanceTradesWithPositions(
      baseTrades,
      positionPlan.positionSizes,
      positionPlan.unlockTimes
    );

    // Step 6: Validate mathematical precision
    const validation = this.validateTrades(trades, dailyTargetAmount);

    // 🔄 Step 7: Validate position plan
    const positionValidation = this.positionManager.validatePositionPlan(
      positionPlan.positionSizes,
      positionPlan.targetLocked
    );

    console.log(`✅ Position Plan: ${positionValidation.summary}`);

    return {
      date,
      dailyTargetAmount,
      accountBalance,
      tradeCount: enhancedTradeCount,
      originalTradeCount: tradeCount,
      trades,
      validation,
      positionPlan,
      positionValidation,
      summary: {
        totalAmount: validation.actualTotal,
        totalLockedCapital: positionPlan.targetLocked,
        utilizationPercent: (positionPlan.targetLocked / accountBalance) * 100,
        averagePositionSize: positionPlan.averagePositionSize,
        winningTrades: trades.filter(t => t.profitLoss > 0).length,
        losingTrades: trades.filter(t => t.profitLoss < 0).length,
        winRate: trades.filter(t => t.profitLoss > 0).length / trades.length,
        avgTradeSize: Math.abs(validation.actualTotal) / trades.length,
        marketHoursSpan: '24/7 Crypto Markets'
      },
      generatedAt: new Date().toISOString()
    };
  }

  /**
   * Get trade count based on account balance
   * @param {number} accountBalance 
   * @returns {number} Number of trades for the day
   */
  getTradeCount(accountBalance) {
    // 🎯 SIMPLIFIED: Fixed portfolio-based trade generation
    // Consistent 6+ hours of content for all users + optimal mathematical precision
    const minTrades = 300;  // 5+ hours of content minimum
    const maxTrades = 400;  // 6-7 hours maximum
    
    const tradeCount = minTrades + Math.floor(Math.random() * (maxTrades - minTrades + 1));
    
    console.log(`🎯 Portfolio Trade Count: ${tradeCount} trades (${Math.floor(tradeCount/60)}+ hours of content)`);
    console.log(`💰 Account Balance: $${accountBalance} (portfolio-based generation)`);
    
    return tradeCount;
  }

  /**
   * Generate trade timestamps distributed across market hours
   * @param {number} tradeCount 
   * @param {string} date - YYYY-MM-DD format
   * @returns {Array} Array of trade timestamps
   */
  generateTradeTimes(tradeCount, date) {
    const tradeTimes = [];
    const totalMinutes = this.marketHours * 60;
    
    // Create base time intervals
    const baseInterval = totalMinutes / tradeCount;
    
    for (let i = 0; i < tradeCount; i++) {
      // Calculate base time with some randomization
      const baseMinute = Math.floor(i * baseInterval);
      const randomOffset = Math.floor(Math.random() * 30) - 15; // ±15 minutes
      const finalMinute = Math.max(0, Math.min(totalMinutes - 1, baseMinute + randomOffset));
      
      // Convert to actual time
      const hour = this.marketStartHour + Math.floor(finalMinute / 60);
      const minute = finalMinute % 60;
      
      // Ensure hour doesn't exceed 23 (11 PM)
      const finalHour = Math.min(23, hour);
      
      const timestamp = `${date}T${finalHour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}:${Math.floor(Math.random() * 60).toString().padStart(2, '0')}.000Z`;
      
      tradeTimes.push({
        timestamp,
        marketMinute: finalMinute,
        displayTime: `${finalHour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`
      });
    }
    
    // Sort by time
    return tradeTimes.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
  }

  /**
   * Assign crypto symbols to trades based on weights
   * @param {number} tradeCount 
   * @returns {Array} Array of crypto assignments
   */
  assignCryptoSymbols(tradeCount) {
    const assignments = [];
    
    for (let i = 0; i < tradeCount; i++) {
      const crypto = this.selectRandomCrypto();
      assignments.push(crypto);
    }
    
    return assignments;
  }

  /**
   * Select random crypto based on weights
   * @returns {Object} Selected crypto symbol object
   */
  selectRandomCrypto() {
    const random = Math.random();
    let cumulativeWeight = 0;
    
    for (const crypto of this.cryptoSymbols) {
      cumulativeWeight += crypto.weight;
      if (random <= cumulativeWeight) {
        return crypto;
      }
    }
    
    // Fallback to BTC
    return this.cryptoSymbols[0];
  }

  /**
   * Calculate realistic trade amount based on deposited capital and risk management
   * Ported from realtimeTradeGenerator for proper capital management
   * @param {number} profitLoss - Expected profit/loss for this trade
   * @param {number} userDepositedAmount - User's total deposited capital
   * @param {number} cryptoVolatility - Volatility factor (0.1-1.0)
   * @returns {number} Realistic trade amount
   */
  calculateRealisticTradeAmount(profitLoss, userDepositedAmount, cryptoVolatility = 0.5) {
    // 🎯 POSITION SIZING RULES
    const maxPositionPercent = 0.05; // Max 5% of capital per trade
    const minPositionPercent = 0.01; // Min 1% of capital per trade
    
    // Calculate base position size (1-5% of deposited capital)
    const positionSizeRange = maxPositionPercent - minPositionPercent;
    const randomPositionPercent = minPositionPercent + (Math.random() * positionSizeRange);
    const baseTradeAmount = userDepositedAmount * randomPositionPercent;
    
    // 🎯 VOLATILITY ADJUSTMENT
    // Higher volatility = smaller position size for risk management
    const volatilityAdjustment = 1.0 - (cryptoVolatility * 0.3); // Reduce by up to 30% for high volatility
    const volatilityAdjustedAmount = baseTradeAmount * Math.max(0.5, volatilityAdjustment);
    
    // 🎯 PROFIT TARGET ADJUSTMENT
    // Ensure trade size makes sense for the expected profit
    // Typical profit margin: 0.5% - 3% of trade amount
    const minProfitMargin = 0.005; // 0.5%
    const maxProfitMargin = 0.03;  // 3%
    
    const targetMargin = minProfitMargin + (Math.random() * (maxProfitMargin - minProfitMargin));
    const profitBasedAmount = Math.abs(profitLoss) / targetMargin;
    
    // Use the more conservative (smaller) of the two calculations
    const finalTradeAmount = Math.min(volatilityAdjustedAmount, profitBasedAmount);
    
    // 🎯 BOUNDS CHECKING
    const minTradeAmount = userDepositedAmount * 0.005; // 0.5% minimum
    const maxTradeAmount = userDepositedAmount * 0.08;  // 8% maximum (aggressive)
    
    return Math.max(minTradeAmount, Math.min(maxTradeAmount, finalTradeAmount));
  }

  /**
   * Generate trade amounts that net to exact daily target with proper capital management
   * @param {number} dailyTargetAmount 
   * @param {number} tradeCount 
   * @param {number} userDepositedAmount - User's deposited capital for proper position sizing
   * @returns {Array} Array of trade amounts
   */
  generateTradeAmounts(dailyTargetAmount, tradeCount, userDepositedAmount = 10000) {
    // 🎯 DYNAMIC WIN/LOSS DISTRIBUTION BASED ON DAILY TARGET
    let dynamicWinRate;
    const isLosingDay = dailyTargetAmount < 0;
    
    if (isLosingDay) {
      // Losing days: 30-40% wins, 60-70% losses
      dynamicWinRate = 0.30 + Math.random() * 0.10; // 30-40% wins
      console.log(`🔴 LOSING DAY: Target $${dailyTargetAmount.toFixed(2)} - Using ${(dynamicWinRate * 100).toFixed(1)}% win rate`);
    } else {
      // Winning days: 60-75% wins, 25-40% losses  
      dynamicWinRate = 0.60 + Math.random() * 0.15; // 60-75% wins
      console.log(`🟢 WINNING DAY: Target $${dailyTargetAmount.toFixed(2)} - Using ${(dynamicWinRate * 100).toFixed(1)}% win rate`);
    }
    
    // Determine how many winning vs losing trades
    const winningTrades = Math.floor(tradeCount * dynamicWinRate);
    const losingTrades = tradeCount - winningTrades;
    
    console.log(`💹 Trade distribution: ${winningTrades} winners, ${losingTrades} losers`);
    
    // 🎯 CAPITAL MANAGEMENT: Generate realistic trade amounts
    const amounts = [];
    
    // 🎯 GENERATE TRADES BASED ON DAY TYPE
    if (isLosingDay) {
      // LOSING DAY: Generate smaller wins, bigger losses to reach negative target
      
      // Generate winning trades (smaller, less frequent)
      for (let i = 0; i < winningTrades; i++) {
        const variance = this.minTradeSize + Math.random() * (this.maxTradeSize - this.minTradeSize);
        const cryptoVolatility = 0.3 + Math.random() * 0.4;
        
        // Smaller wins on losing days
        const baseAmount = userDepositedAmount * 0.01 * variance; // 1% base
        const profitMargin = 0.005 + Math.random() * 0.015; // 0.5% - 2% (smaller margins)
        const actualProfit = baseAmount * profitMargin;
        
        amounts.push(actualProfit);
      }
      
      // Generate losing trades (larger, more frequent to dominate)
      for (let i = 0; i < losingTrades; i++) {
        const variance = this.minTradeSize + Math.random() * (this.maxTradeSize - this.minTradeSize);
        const cryptoVolatility = 0.3 + Math.random() * 0.4;
        
        // Larger losses on losing days  
        const baseAmount = userDepositedAmount * 0.015 * variance; // 1.5% base (bigger)
        const lossMargin = 0.01 + Math.random() * 0.025; // 1% - 3.5% (bigger margins)
        const actualLoss = baseAmount * lossMargin;
        
        amounts.push(-actualLoss);
      }
      
    } else {
      // WINNING DAY: Generate bigger wins, smaller losses to reach positive target
      
      // Generate winning trades (larger, more frequent)
      for (let i = 0; i < winningTrades; i++) {
        const variance = this.minTradeSize + Math.random() * (this.maxTradeSize - this.minTradeSize);
        const cryptoVolatility = 0.3 + Math.random() * 0.4;
        
        // Bigger wins on winning days
        const baseAmount = userDepositedAmount * 0.015 * variance; // 1.5% base
        const profitMargin = 0.01 + Math.random() * 0.03; // 1% - 4%
        const actualProfit = baseAmount * profitMargin;
        
        amounts.push(actualProfit);
      }
      
      // Generate losing trades (smaller, less frequent)
      for (let i = 0; i < losingTrades; i++) {
        const variance = this.minTradeSize + Math.random() * (this.maxTradeSize - this.minTradeSize);
        const cryptoVolatility = 0.3 + Math.random() * 0.4;
        
        // Smaller losses on winning days
        const baseAmount = userDepositedAmount * 0.01 * variance; // 1% base (smaller)
        const lossMargin = 0.005 + Math.random() * 0.015; // 0.5% - 2%
        const actualLoss = baseAmount * lossMargin;
        
        amounts.push(-actualLoss);
      }
    }
    
    // Shuffle the amounts
    const shuffledAmounts = this.shuffleArray(amounts);
    
    // Scale to hit exact target
    const currentTotal = shuffledAmounts.reduce((sum, amount) => sum + amount, 0);
    const scalingFactor = dailyTargetAmount / currentTotal;
    
    const scaledAmounts = shuffledAmounts.map(amount => amount * scalingFactor);
    
    // Fine-tune final trade to ensure mathematical precision
    const finalTotal = scaledAmounts.reduce((sum, amount) => sum + amount, 0);
    const adjustment = dailyTargetAmount - finalTotal;
    
    if (Math.abs(adjustment) > 0.001) {
      scaledAmounts[scaledAmounts.length - 1] += adjustment;
      console.log(`🎯 Final trade adjustment: ${adjustment.toFixed(4)}`);
    }
    
    console.log(`💰 Capital Management: ${tradeCount} trades sized for $${userDepositedAmount.toLocaleString()} deposited`);
    console.log(`📊 Avg trade size: $${(Math.abs(dailyTargetAmount) / tradeCount).toFixed(2)}, Range: ${Math.min(...scaledAmounts.map(Math.abs)).toFixed(2)} - ${Math.max(...scaledAmounts.map(Math.abs)).toFixed(2)}`);
    
    return scaledAmounts;
  }

  /**
   * Create complete trade objects
   * @param {Array} tradeTimes 
   * @param {Array} tradeSymbols 
   * @param {Array} tradeAmounts 
   * @param {number} dailyTargetAmount 
   * @returns {Array} Array of complete trade objects
   */
  createTradeObjects(tradeTimes, tradeSymbols, tradeAmounts, dailyTargetAmount) {
    const trades = [];
    
    for (let i = 0; i < tradeTimes.length; i++) {
      const amount = tradeAmounts[i];
      const isWin = amount > 0;
      const tradeType = isWin ? (Math.random() > 0.5 ? 'long' : 'short') : (Math.random() > 0.5 ? 'short' : 'long');
      
      // Generate realistic trade duration (10 minutes to 4 hours)
      const baseDuration = 10 + Math.random() * 230; // 10-240 minutes
      const sizeFactor = Math.abs(amount) / 100; // Larger trades take longer
      const duration = Math.floor(baseDuration * (0.5 + sizeFactor));
      
      const trade = {
        id: uuidv4(),
        timestamp: tradeTimes[i].timestamp,
        displayTime: tradeTimes[i].displayTime,
        cryptoSymbol: tradeSymbols[i].symbol,
        cryptoName: tradeSymbols[i].name,
        tradeType,
        profitLoss: amount,
        amount: Math.abs(amount),
        duration, // in minutes
        status: 'completed',
        isWinningTrade: isWin,
        variance: this.calculateTradeVariance(amount)
      };
      
      trades.push(trade);
    }
    
    return trades;
  }

  /**
   * Calculate trade variance level
   * @param {number} amount 
   * @returns {string} Variance level
   */
  calculateTradeVariance(amount) {
    const absAmount = Math.abs(amount);
    if (absAmount >= 100) return 'high';
    if (absAmount >= 50) return 'medium';
    if (absAmount >= 20) return 'low';
    return 'minimal';
  }

  /**
   * Validate trade mathematical precision
   * @param {Array} trades 
   * @param {number} expectedTotal 
   * @returns {Object} Validation result
   */
  validateTrades(trades, expectedTotal) {
    const actualTotal = trades.reduce((sum, trade) => sum + trade.profitLoss, 0);
    const difference = Math.abs(actualTotal - expectedTotal);
    const winningTrades = trades.filter(trade => trade.isWinningTrade).length;
    const losingTrades = trades.length - winningTrades;
    
    return {
      isValid: difference < 0.01,
      expectedTotal,
      actualTotal,
      difference,
      tradeCount: trades.length,
      winningTrades,
      losingTrades,
      winRate: winningTrades / trades.length,
      avgTradeSize: Math.abs(actualTotal) / trades.length,
      maxWin: Math.max(...trades.map(t => t.profitLoss)),
      maxLoss: Math.min(...trades.map(t => t.profitLoss))
    };
  }

  /**
   * Shuffle array using Fisher-Yates algorithm
   * @param {Array} array 
   * @returns {Array} Shuffled array
   */
  shuffleArray(array) {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }

  /**
   * Get today's trades for a user (for real-time display)
   * @param {string} userId 
   * @param {string} date 
   * @returns {Array} Today's trades
   */
  async getTodaysTrades(userId, date = null) {
    if (!date) {
      date = new Date().toISOString().split('T')[0];
    }
    
    // This would integrate with database to retrieve stored trades
    // For now, return structure for implementation
    return {
      userId,
      date,
      trades: [], // To be populated from database
      summary: {
        totalTrades: 0,
        completedTrades: 0,
        pendingTrades: 0,
        totalProfitLoss: 0
      }
    };
  }

  /**
   * Generate live trading activity simulation
   * @param {Object} params - { userId, currentTrades, timeWindow }
   * @returns {Object} Live activity update
   */
  generateLiveActivity(params) {
    const { userId, currentTrades = [], timeWindow = 300000 } = params; // 5-minute window
    
    const now = new Date();
    const recentTrades = currentTrades.filter(trade => {
      const tradeTime = new Date(trade.timestamp);
      return (now - tradeTime) <= timeWindow;
    });
    
    return {
      userId,
      timestamp: now.toISOString(),
      recentActivity: recentTrades,
      nextTradeETA: this.calculateNextTradeETA(currentTrades),
      marketStatus: this.getMarketStatus(now)
    };
  }

  /**
   * Calculate estimated time for next trade
   * @param {Array} currentTrades 
   * @returns {number} Minutes until next trade
   */
  calculateNextTradeETA(currentTrades) {
    if (currentTrades.length === 0) return 0;
    
    // Simple estimation based on trade frequency
    const avgInterval = 480 / currentTrades.length; // 8 hours / trade count
    return Math.floor(Math.random() * avgInterval * 2); // 0 to 2x average
  }

  /**
   * Get current market status
   * @param {Date} now 
   * @returns {string} Market status
   */
  getMarketStatus(now) {
    const hour = now.getHours();
    if (hour >= this.marketStartHour && hour < this.marketEndHour) {
      return 'open';
    }
    return 'closed';
  }
}

module.exports = IntradayTradeService;