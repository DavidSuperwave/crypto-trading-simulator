const { v4: uuidv4 } = require('uuid');

/**
 * Daily Volatility Distribution Service
 * Converts flat monthly compound targets into realistic daily trading volatility
 * 
 * Key Features:
 * - More winning days than losing days (65-75% win rate)
 * - Realistic daily swings (+3% to -1.5%)
 * - Mathematical precision to exact monthly targets
 * - Account for weekends/trading days only
 */
class DailyVolatilityService {
  constructor() {
    // Volatility parameters
    this.minWinRate = 0.65; // 65% minimum winning days
    this.maxWinRate = 0.75; // 75% maximum winning days
    
    // Daily percentage ranges
    this.maxDailyGain = 0.03;  // +3% max daily gain
    this.maxDailyLoss = -0.015; // -1.5% max daily loss
    this.minDailyMove = 0.001;  // 0.1% minimum movement
  }

  /**
   * Generate daily volatility pattern for a month
   * @param {Object} params - { monthlyTargetAmount, daysInMonth, startingBalance, winRate? }
   * @returns {Array} Daily volatility pattern
   */
  generateMonthlyVolatility(params) {
    const {
      monthlyTargetAmount,
      daysInMonth,
      startingBalance,
      winRate = this.generateRandomWinRate()
    } = params;

    console.log(`🎲 Generating daily volatility: ${daysInMonth} days, target $${monthlyTargetAmount.toFixed(2)}, win rate ${(winRate * 100).toFixed(1)}%`);

    // Step 1: Determine winning and losing days
    const winningDays = Math.round(daysInMonth * winRate);
    const losingDays = daysInMonth - winningDays;

    console.log(`📊 Distribution: ${winningDays} winning days, ${losingDays} losing days`);

    // Step 2: Generate rough daily percentages
    const dailyPattern = this.generateRoughPattern(daysInMonth, winningDays, losingDays);

    // Step 3: Scale to hit exact monthly target
    const scaledPattern = this.scaleToTarget(dailyPattern, monthlyTargetAmount, startingBalance);

    // Step 4: Create final daily volatility objects
    const dailyVolatility = scaledPattern.map((percentage, index) => ({
      id: uuidv4(),
      day: index + 1,
      targetPercentage: percentage,
      targetAmount: startingBalance * percentage,
      isWinningDay: percentage > 0,
      variance: this.calculateVariance(percentage)
    }));

    // Verify mathematical precision
    const totalAmount = dailyVolatility.reduce((sum, day) => sum + day.targetAmount, 0);
    const difference = Math.abs(totalAmount - monthlyTargetAmount);
    
    console.log(`✅ Generated volatility: Target ${monthlyTargetAmount.toFixed(2)}, Actual ${totalAmount.toFixed(2)}, Difference ${difference.toFixed(6)}`);

    if (difference > 0.01) {
      console.warn(`⚠️ Mathematical precision warning: ${difference.toFixed(6)} difference`);
    }

    return {
      monthlyTargetAmount,
      daysInMonth,
      winRate,
      winningDays,
      losingDays,
      dailyPattern: dailyVolatility,
      totalCalculated: totalAmount,
      generatedAt: new Date().toISOString()
    };
  }

  /**
   * Generate random win rate within acceptable range
   * @returns {number} Win rate between 0.65 and 0.75
   */
  generateRandomWinRate() {
    return this.minWinRate + Math.random() * (this.maxWinRate - this.minWinRate);
  }

  /**
   * Generate rough daily percentage pattern
   * @param {number} daysInMonth 
   * @param {number} winningDays 
   * @param {number} losingDays 
   * @returns {Array} Array of daily percentages
   */
  generateRoughPattern(daysInMonth, winningDays, losingDays) {
    const pattern = [];

    // Generate winning day percentages
    for (let i = 0; i < winningDays; i++) {
      const percentage = this.minDailyMove + Math.random() * (this.maxDailyGain - this.minDailyMove);
      pattern.push(percentage);
    }

    // Generate losing day percentages
    for (let i = 0; i < losingDays; i++) {
      const percentage = this.maxDailyLoss + Math.random() * (this.minDailyMove - this.maxDailyLoss);
      pattern.push(percentage);
    }

    // Shuffle the pattern to randomize win/loss distribution
    return this.shuffleArray(pattern);
  }

  /**
   * Scale daily percentages to hit exact monthly target
   * @param {Array} roughPattern 
   * @param {number} monthlyTargetAmount 
   * @param {number} startingBalance 
   * @returns {Array} Scaled daily percentages
   */
  scaleToTarget(roughPattern, monthlyTargetAmount, startingBalance) {
    // Calculate current total
    const currentTotal = roughPattern.reduce((sum, percentage) => sum + percentage, 0);
    
    // Calculate required total percentage
    const requiredTotalPercentage = monthlyTargetAmount / startingBalance;
    
    // Calculate scaling factor
    const scalingFactor = requiredTotalPercentage / currentTotal;
    
    console.log(`🔧 Scaling: Current ${(currentTotal * 100).toFixed(2)}%, Required ${(requiredTotalPercentage * 100).toFixed(2)}%, Factor ${scalingFactor.toFixed(4)}`);
    
    // Apply scaling factor to all days
    const scaledPattern = roughPattern.map(percentage => percentage * scalingFactor);
    
    // Fine-tune final day to ensure mathematical precision
    const scaledTotal = scaledPattern.reduce((sum, percentage) => sum + percentage, 0);
    const adjustment = requiredTotalPercentage - scaledTotal;
    
    if (Math.abs(adjustment) > 0.000001) {
      scaledPattern[scaledPattern.length - 1] += adjustment;
      console.log(`🎯 Final adjustment: ${(adjustment * 100).toFixed(6)}% added to last day`);
    }
    
    return scaledPattern;
  }

  /**
   * Calculate variance level for a daily percentage
   * @param {number} percentage 
   * @returns {string} Variance level
   */
  calculateVariance(percentage) {
    const absPercentage = Math.abs(percentage);
    if (absPercentage >= 0.025) return 'high';
    if (absPercentage >= 0.015) return 'medium';
    if (absPercentage >= 0.005) return 'low';
    return 'minimal';
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
   * Regenerate volatility for remaining days after mid-month deposit
   * @param {Object} params - { remainingDays, newTargetAmount, newBalance, existingWinRate? }
   * @returns {Array} New daily volatility for remaining days
   */
  regenerateRemainingDays(params) {
    const {
      remainingDays,
      newTargetAmount,
      newBalance,
      existingWinRate = this.generateRandomWinRate()
    } = params;

    console.log(`🔄 Regenerating ${remainingDays} remaining days with target $${newTargetAmount.toFixed(2)}`);

    return this.generateMonthlyVolatility({
      monthlyTargetAmount: newTargetAmount,
      daysInMonth: remainingDays,
      startingBalance: newBalance,
      winRate: existingWinRate
    });
  }

  /**
   * Get account-based trade count for daily trade generation
   * @param {number} accountBalance 
   * @returns {number} Number of trades for the day
   */
  getAccountBasedTradeCount(accountBalance) {
    let minTrades, maxTrades;

    if (accountBalance >= 100000) {
      minTrades = 75;
      maxTrades = 100;
    } else if (accountBalance >= 50000) {
      minTrades = 50;
      maxTrades = 75;
    } else if (accountBalance >= 15000) {
      minTrades = 30;
      maxTrades = 50;
    } else {
      minTrades = 20;
      maxTrades = 30;
    }

    const tradeCount = minTrades + Math.floor(Math.random() * (maxTrades - minTrades + 1));
    console.log(`💼 Account $${accountBalance.toLocaleString()} → ${tradeCount} trades/day`);
    
    return tradeCount;
  }

  /**
   * Validate daily volatility pattern
   * @param {Array} dailyPattern 
   * @param {number} expectedTotal 
   * @returns {Object} Validation result
   */
  validatePattern(dailyPattern, expectedTotal) {
    const actualTotal = dailyPattern.reduce((sum, day) => sum + day.targetAmount, 0);
    const difference = Math.abs(actualTotal - expectedTotal);
    const winningDays = dailyPattern.filter(day => day.isWinningDay).length;
    const winRate = winningDays / dailyPattern.length;

    return {
      isValid: difference < 0.01,
      expectedTotal,
      actualTotal,
      difference,
      winRate,
      winningDays,
      losingDays: dailyPattern.length - winningDays,
      maxGain: Math.max(...dailyPattern.map(day => day.targetPercentage)),
      maxLoss: Math.min(...dailyPattern.map(day => day.targetPercentage))
    };
  }
}

module.exports = DailyVolatilityService;