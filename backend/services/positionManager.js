/**
 * Position Manager Service
 * Maintains exactly 80% of user portfolio locked in active positions
 * with rolling releases and immediate replacements
 */

class PositionManager {
  constructor() {
    this.TARGET_UTILIZATION = 0.80;  // 80% of portfolio
    this.MIN_LOCK_MINUTES = 20;      // Minimum lock duration
    this.MAX_LOCK_MINUTES = 60;      // Maximum lock duration
    this.POSITION_CHECK_INTERVAL = 30000; // Check every 30 seconds
    this.activeTimers = new Map();   // Track position unlock timers
  }

  /**
   * Calculate target capital that should be locked
   * @param {number} accountBalance - User's total account balance
   * @returns {number} Target amount to keep locked
   */
  calculateTargetLocked(accountBalance) {
    return accountBalance * this.TARGET_UTILIZATION;
  }

  /**
   * Calculate current locked capital from active trades
   * @param {Array} activeTrades - Array of user's active trades
   * @param {Date} currentTime - Current timestamp
   * @returns {Object} { lockedAmount, activeTrades, expiredTrades }
   */
  calculateCurrentLocked(activeTrades, currentTime = new Date()) {
    let lockedAmount = 0;
    let activeCount = 0;
    const expiredTrades = [];

    for (const trade of activeTrades) {
      if (trade.isLocked && trade.unlockTime) {
        const unlockTime = new Date(trade.unlockTime);
        
        if (unlockTime > currentTime) {
          // Still locked
          lockedAmount += trade.positionSize || Math.abs(trade.amount);
          activeCount++;
        } else {
          // Expired, needs to be unlocked
          expiredTrades.push(trade);
        }
      }
    }

    return {
      lockedAmount,
      activeTrades: activeCount,
      expiredTrades
    };
  }

  /**
   * Generate staggered unlock times to maintain rolling positions
   * @param {number} tradeCount - Number of trades to generate
   * @param {Date} startTime - When to start the sequence
   * @returns {Array} Array of unlock timestamps
   */
  generateStaggeredUnlockTimes(tradeCount, startTime = new Date()) {
    const unlockTimes = [];
    const baseTime = startTime.getTime();
    
    // Spread unlocks across the day with some randomization
    const dayDuration = 16 * 60 * 60 * 1000; // 16 hours in milliseconds
    const baseInterval = dayDuration / tradeCount;
    
    for (let i = 0; i < tradeCount; i++) {
      // Add base interval + random variance
      const variance = (Math.random() - 0.5) * baseInterval * 0.3; // ±30% variance
      const lockDuration = this.MIN_LOCK_MINUTES + Math.random() * (this.MAX_LOCK_MINUTES - this.MIN_LOCK_MINUTES);
      const unlockTime = baseTime + (i * baseInterval) + variance + (lockDuration * 60 * 1000);
      
      unlockTimes.push(new Date(unlockTime));
    }
    
    return unlockTimes.sort((a, b) => a - b); // Sort chronologically
  }

  /**
   * Calculate how much additional capital needs to be locked
   * @param {number} accountBalance - User's account balance
   * @param {number} currentLocked - Currently locked amount
   * @returns {number} Additional amount needed to reach 80%
   */
  calculateCapitalDeficit(accountBalance, currentLocked) {
    const targetLocked = this.calculateTargetLocked(accountBalance);
    return Math.max(0, targetLocked - currentLocked);
  }

  /**
   * Distribute target capital across trade count with realistic position sizes
   * @param {number} targetCapital - Total capital to distribute ($8,000 for $10,000 account)
   * @param {number} tradeCount - Number of trades to create
   * @param {number} accountBalance - User's account balance for position sizing rules
   * @returns {Array} Array of position sizes
   */
  distributeCapitalAcrossTrades(targetCapital, tradeCount, accountBalance) {
    const positions = [];
    let remainingCapital = targetCapital;
    
    // Position sizing rules based on account balance
    const minPositionPercent = 0.008; // 0.8% of account (was 1%)
    const maxPositionPercent = 0.015; // 1.5% of account (was 5%)
    
    const minPositionSize = accountBalance * minPositionPercent;
    const maxPositionSize = accountBalance * maxPositionPercent;
    
    // Generate positions, leaving the last one to balance exactly
    for (let i = 0; i < tradeCount - 1; i++) {
      const randomPercent = minPositionPercent + Math.random() * (maxPositionPercent - minPositionPercent);
      let positionSize = accountBalance * randomPercent;
      
      // Ensure we don't exceed remaining capital
      positionSize = Math.min(positionSize, remainingCapital - minPositionSize);
      positionSize = Math.max(positionSize, minPositionSize);
      
      positions.push(positionSize);
      remainingCapital -= positionSize;
    }
    
    // Last position gets exactly the remaining capital
    positions.push(Math.max(remainingCapital, minPositionSize));
    
    return positions;
  }

  /**
   * Create position tracking data for trades
   * @param {Array} trades - Generated trades array
   * @param {Array} positionSizes - Array of position sizes
   * @param {Array} unlockTimes - Array of unlock timestamps
   * @returns {Array} Enhanced trades with position data
   */
  enhanceTradesWithPositions(trades, positionSizes, unlockTimes) {
    return trades.map((trade, index) => {
      const lockDuration = this.MIN_LOCK_MINUTES + Math.random() * (this.MAX_LOCK_MINUTES - this.MIN_LOCK_MINUTES);
      const lockStartTime = new Date(trade.timestamp);
      const lockEndTime = unlockTimes[index] || new Date(lockStartTime.getTime() + lockDuration * 60 * 1000);
      
      return {
        ...trade,
        // Position management fields
        positionSize: positionSizes[index] || Math.abs(trade.amount),
        lockStartTime: lockStartTime.toISOString(),
        lockEndTime: lockEndTime.toISOString(),
        unlockTime: lockEndTime.toISOString(),
        isLocked: true,
        lockDurationMinutes: Math.round((lockEndTime - lockStartTime) / (60 * 1000)),
        
        // Update status to reflect locking
        status: 'locked',
        
        // Keep original profit/loss, positionSize is the locked capital
        profitLoss: trade.profitLoss, // Preserve the original P&L (can be negative)
        amount: Math.abs(trade.profitLoss) // Absolute value for position sizing
      };
    });
  }

  /**
   * Generate a full day of rolling positions to maintain 80% lock
   * @param {number} accountBalance - User's account balance
   * @param {number} tradeCount - Number of trades for the day
   * @param {number} dailyTargetAmount - Target P&L for the day
   * @returns {Object} { targetLocked, positionSizes, unlockTimes, totalTradeCount }
   */
  generateRollingPositionPlan(accountBalance, tradeCount, dailyTargetAmount) {
    const targetLocked = this.calculateTargetLocked(accountBalance);
    
    // Scale up trade count for higher activity and smaller individual positions
    const scaledTradeCount = Math.floor(tradeCount * 1.5); // 50% more trades
    
    // Distribute capital across all trades
    const positionSizes = this.distributeCapitalAcrossTrades(targetLocked, scaledTradeCount, accountBalance);
    
    // Generate staggered unlock times
    const unlockTimes = this.generateStaggeredUnlockTimes(scaledTradeCount);
    
    console.log(`🔄 Rolling Position Plan Generated:`);
    console.log(`📊 Account Balance: $${accountBalance.toFixed(2)}`);
    console.log(`🎯 Target Locked: $${targetLocked.toFixed(2)} (80%)`);
    console.log(`📈 Daily Trades: ${scaledTradeCount} (scaled from ${tradeCount})`);
    console.log(`💰 Avg Position: $${(targetLocked / scaledTradeCount).toFixed(2)}`);
    console.log(`⏰ Lock Range: ${this.MIN_LOCK_MINUTES}-${this.MAX_LOCK_MINUTES} minutes`);
    
    return {
      targetLocked,
      positionSizes,
      unlockTimes,
      totalTradeCount: scaledTradeCount,
      averagePositionSize: targetLocked / scaledTradeCount
    };
  }

  /**
   * Validate that the position plan achieves 80% target
   * @param {Array} positionSizes - Array of position sizes
   * @param {number} targetLocked - Target amount to lock
   * @returns {Object} Validation results
   */
  validatePositionPlan(positionSizes, targetLocked) {
    const totalAllocated = positionSizes.reduce((sum, size) => sum + size, 0);
    const variance = Math.abs(totalAllocated - targetLocked);
    const variancePercent = (variance / targetLocked) * 100;
    
    return {
      totalAllocated,
      targetLocked,
      variance,
      variancePercent,
      isValid: variancePercent < 1.0, // Allow 1% variance
      summary: `Allocated: $${totalAllocated.toFixed(2)} vs Target: $${targetLocked.toFixed(2)} (${variancePercent.toFixed(2)}% variance)`
    };
  }
}

module.exports = PositionManager;