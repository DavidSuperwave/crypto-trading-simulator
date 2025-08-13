const { v4: uuidv4 } = require('uuid');

/**
 * Volatility Trade Generator Service
 * Creates high-volatility trading sequences that hit exact daily targets
 * 
 * Key Features:
 * - Generates 75-100 exciting trades per day
 * - Creates dramatic portfolio swings (±20-40%)
 * - Mathematical precision to exact daily targets
 * - Realistic crypto symbols and timing
 * - Position-based capital management
 */
class VolatilityTradeGenerator {
  constructor() {
    // Available cryptocurrency symbols with realistic weights
    this.cryptoSymbols = [
      { symbol: 'BTC', name: 'Bitcoin', weight: 0.30, volatility: 0.8 },
      { symbol: 'ETH', name: 'Ethereum', weight: 0.25, volatility: 0.7 },
      { symbol: 'SOL', name: 'Solana', weight: 0.15, volatility: 0.9 },
      { symbol: 'ADA', name: 'Cardano', weight: 0.10, volatility: 0.6 },
      { symbol: 'DOT', name: 'Polkadot', weight: 0.08, volatility: 0.7 },
      { symbol: 'LINK', name: 'Chainlink', weight: 0.06, volatility: 0.8 },
      { symbol: 'UNI', name: 'Uniswap', weight: 0.04, volatility: 0.9 },
      { symbol: 'AAVE', name: 'Aave', weight: 0.02, volatility: 1.0 }
    ];

    // Volatility parameters
    this.profiles = {
      aggressive: {
        maxSwingPercent: 0.40,        // ±40% portfolio swings
        bigSwingCount: [6, 10],       // 6-10 major swings per day
        mediumTradeCount: [25, 35],   // 25-35 medium trades
        fineTuneCount: [35, 55],      // 35-55 fine-tuning trades
        positionSizeRange: [0.02, 0.15], // 2-15% of portfolio per trade
        bigSwingRange: [0.05, 0.15],  // 5-15% swings for big trades
        tradeWinRate: 0.62           // 62% of trades are winners
      }
    };

    // Trading hours (24/7 crypto markets)
    this.marketStartHour = 0;
    this.marketEndHour = 24;
  }

  /**
   * Generate high-volatility daily trades that hit exact targets
   * @param {Object} params - { dailyTargetAmount, accountBalance, date, profile }
   * @returns {Object} Complete volatility trading schedule
   */
  generateVolatilityTrades(params) {
    const {
      dailyTargetAmount,
      accountBalance,
      date = new Date().toISOString().split('T')[0],
      profile = 'aggressive'
    } = params;

    console.log(`🎢 Generating high-volatility trades for ${date}`);
    console.log(`🎯 Target: $${dailyTargetAmount.toFixed(2)} | Portfolio: $${accountBalance.toLocaleString()}`);

    const config = this.profiles[profile];
    
    // Step 1: Determine trade counts
    const tradeCounts = this.calculateTradeCounts(config);
    const totalTrades = tradeCounts.bigSwings + tradeCounts.mediumTrades + tradeCounts.fineTunes;
    
    console.log(`📊 Trade distribution: ${tradeCounts.bigSwings} big swings, ${tradeCounts.mediumTrades} medium, ${tradeCounts.fineTunes} fine-tune`);

    // Step 2: Generate trade amounts in categories
    const tradeAmounts = this.generateTradeAmountsByCategory({
      dailyTargetAmount,
      accountBalance,
      tradeCounts,
      config
    });

    // Ensure all arrays have the same length
    const actualTradeCount = tradeAmounts.length;
    console.log(`🔧 Generated ${actualTradeCount} trade amounts, generating ${actualTradeCount} times and symbols`);

    // Step 3: Generate realistic timing
    const tradeTimes = this.generateTradeTiming(actualTradeCount, date);

    // Step 4: Assign crypto symbols
    const tradeSymbols = this.assignCryptoSymbols(actualTradeCount);

    // Step 5: Create complete trade objects
    const trades = this.createVolatilityTradeObjects({
      amounts: tradeAmounts,
      times: tradeTimes,
      symbols: tradeSymbols,
      accountBalance,
      config
    });

    // Step 6: Validate mathematical precision
    const validation = this.validateTrades(trades, dailyTargetAmount);

    console.log(`✅ Generated ${actualTradeCount} volatility trades with ${validation.actualTotal.toFixed(2)} total (target: ${dailyTargetAmount.toFixed(2)})`);

    return {
      date,
      dailyTargetAmount,
      accountBalance,
      totalTrades: actualTradeCount,
      trades,
      validation,
      tradeCounts,
      profile,
      summary: {
        totalAmount: validation.actualTotal,
        winningTrades: trades.filter(t => t.profitLoss > 0).length,
        losingTrades: trades.filter(t => t.profitLoss < 0).length,
        winRate: trades.filter(t => t.profitLoss > 0).length / trades.length,
        avgTradeSize: Math.abs(validation.actualTotal) / trades.length,
        maxWin: Math.max(...trades.map(t => t.profitLoss)),
        maxLoss: Math.min(...trades.map(t => t.profitLoss)),
        portfolioSwingRange: this.calculatePortfolioSwingRange(trades, accountBalance)
      }
    };
  }

  /**
   * Calculate trade counts for each category
   * @param {Object} config - Profile configuration
   * @returns {Object} Trade count breakdown
   */
  calculateTradeCounts(config) {
    const bigSwings = Math.floor(this.randomBetween(config.bigSwingCount[0], config.bigSwingCount[1]));
    const mediumTrades = Math.floor(this.randomBetween(config.mediumTradeCount[0], config.mediumTradeCount[1]));
    const fineTunes = Math.floor(this.randomBetween(config.fineTuneCount[0], config.fineTuneCount[1]));

    return { bigSwings, mediumTrades, fineTunes };
  }

  /**
   * Generate trade amounts by category that sum to exact target
   * @param {Object} params - Generation parameters
   * @returns {Array} Array of trade amounts
   */
  generateTradeAmountsByCategory({ dailyTargetAmount, accountBalance, tradeCounts, config }) {
    const amounts = [];

    // 1. Generate big swing trades (create major volatility)
    const bigSwingAmounts = this.generateBigSwingTrades({
      count: tradeCounts.bigSwings,
      accountBalance,
      config
    });
    amounts.push(...bigSwingAmounts);

    // 2. Generate medium trades (maintain activity)
    const mediumAmounts = this.generateMediumTrades({
      count: tradeCounts.mediumTrades,
      accountBalance,
      config
    });
    amounts.push(...mediumAmounts);

    // 3. Generate fine-tuning trades (ensure precision)
    const fineTuneAmounts = this.generateFineTuningTrades({
      count: tradeCounts.fineTunes,
      accountBalance,
      config
    });
    amounts.push(...fineTuneAmounts);

    // 4. Scale all amounts to hit exact target
    const scaledAmounts = this.scaleToExactTarget(amounts, dailyTargetAmount);

    // 5. Shuffle for realistic distribution
    return this.shuffleArray(scaledAmounts);
  }

  /**
   * Generate big swing trades for major volatility
   * @param {Object} params - Big swing parameters
   * @returns {Array} Big swing amounts
   */
  generateBigSwingTrades({ count, accountBalance, config }) {
    const amounts = [];
    const winCount = Math.floor(count * config.tradeWinRate);
    const lossCount = count - winCount;

    // Generate big winning trades
    for (let i = 0; i < winCount; i++) {
      const swingPercent = this.randomBetween(config.bigSwingRange[0], config.bigSwingRange[1]);
      const swingAmount = accountBalance * swingPercent;
      amounts.push(swingAmount);
    }

    // Generate big losing trades  
    for (let i = 0; i < lossCount; i++) {
      const swingPercent = this.randomBetween(config.bigSwingRange[0], config.bigSwingRange[1]);
      const swingAmount = -(accountBalance * swingPercent * 0.7); // Losses slightly smaller
      amounts.push(swingAmount);
    }

    return amounts;
  }

  /**
   * Generate medium trades for sustained activity
   * @param {Object} params - Medium trade parameters  
   * @returns {Array} Medium trade amounts
   */
  generateMediumTrades({ count, accountBalance, config }) {
    const amounts = [];
    const winCount = Math.floor(count * config.tradeWinRate);
    const lossCount = count - winCount;

    // Generate medium winning trades
    for (let i = 0; i < winCount; i++) {
      const tradePercent = this.randomBetween(0.01, 0.05); // 1-5% swings
      const tradeAmount = accountBalance * tradePercent;
      amounts.push(tradeAmount);
    }

    // Generate medium losing trades
    for (let i = 0; i < lossCount; i++) {
      const tradePercent = this.randomBetween(0.01, 0.04); // 1-4% losses
      const tradeAmount = -(accountBalance * tradePercent);
      amounts.push(tradeAmount);
    }

    return amounts;
  }

  /**
   * Generate fine-tuning trades for precision
   * @param {Object} params - Fine-tuning parameters
   * @returns {Array} Fine-tuning trade amounts  
   */
  generateFineTuningTrades({ count, accountBalance, config }) {
    const amounts = [];
    const winCount = Math.floor(count * config.tradeWinRate);
    const lossCount = count - winCount;

    // Generate small winning trades
    for (let i = 0; i < winCount; i++) {
      const tradePercent = this.randomBetween(0.001, 0.01); // 0.1-1% swings
      const tradeAmount = accountBalance * tradePercent;
      amounts.push(tradeAmount);
    }

    // Generate small losing trades
    for (let i = 0; i < lossCount; i++) {
      const tradePercent = this.randomBetween(0.001, 0.008); // 0.1-0.8% losses  
      const tradeAmount = -(accountBalance * tradePercent);
      amounts.push(tradeAmount);
    }

    return amounts;
  }

  /**
   * Scale trade amounts to hit exact target
   * @param {Array} amounts - Raw trade amounts
   * @param {number} dailyTargetAmount - Exact target
   * @returns {Array} Scaled amounts
   */
  scaleToExactTarget(amounts, dailyTargetAmount) {
    const currentTotal = amounts.reduce((sum, amount) => sum + amount, 0);
    const scalingFactor = dailyTargetAmount / currentTotal;
    
    console.log(`🔧 Scaling: Current ${currentTotal.toFixed(2)}, Target ${dailyTargetAmount.toFixed(2)}, Factor ${scalingFactor.toFixed(4)}`);
    
    const scaledAmounts = amounts.map(amount => amount * scalingFactor);
    
    // Final precision adjustment
    const finalTotal = scaledAmounts.reduce((sum, amount) => sum + amount, 0);
    const adjustment = dailyTargetAmount - finalTotal;
    
    if (Math.abs(adjustment) > 0.001) {
      scaledAmounts[scaledAmounts.length - 1] += adjustment;
      console.log(`🎯 Final adjustment: ${adjustment.toFixed(6)} added to last trade`);
    }
    
    return scaledAmounts;
  }

  /**
   * Generate realistic trade timing throughout 24 hours
   * @param {number} tradeCount - Number of trades
   * @param {string} date - Trading date
   * @returns {Array} Array of timestamps
   */
  generateTradeTiming(tradeCount, date) {
    const times = [];
    const baseDate = new Date(date);
    
    // Create time clusters for realistic activity patterns
    const clusters = [
      { start: 0, end: 6, weight: 0.15 },    // Overnight (lower activity)
      { start: 6, end: 12, weight: 0.30 },   // Morning (high activity)
      { start: 12, end: 18, weight: 0.35 },  // Afternoon (peak activity)
      { start: 18, end: 24, weight: 0.20 }   // Evening (moderate activity)
    ];
    
    // Distribute trades across clusters
    let remainingTrades = tradeCount;
    
    for (const cluster of clusters) {
      const clusterTrades = Math.floor(remainingTrades * cluster.weight);
      
      for (let i = 0; i < clusterTrades; i++) {
        const hour = this.randomBetween(cluster.start, cluster.end);
        const minute = this.randomBetween(0, 59);
        const second = this.randomBetween(0, 59);
        
        const timestamp = new Date(baseDate);
        timestamp.setHours(hour, minute, second);
        times.push(timestamp.toISOString());
      }
      
      remainingTrades -= clusterTrades;
    }
    
    // Add any remaining trades to peak hours
    for (let i = 0; i < remainingTrades; i++) {
      const hour = this.randomBetween(12, 18);
      const minute = this.randomBetween(0, 59);
      const second = this.randomBetween(0, 59);
      
      const timestamp = new Date(baseDate);
      timestamp.setHours(hour, minute, second);
      times.push(timestamp.toISOString());
    }
    
    // Sort chronologically
    return times.sort();
  }

  /**
   * Assign crypto symbols to trades
   * @param {number} tradeCount - Number of trades
   * @returns {Array} Array of crypto symbols
   */
  assignCryptoSymbols(tradeCount) {
    const symbols = [];
    
    for (let i = 0; i < tradeCount; i++) {
      const crypto = this.selectRandomCrypto();
      symbols.push(crypto);
    }
    
    return symbols;
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
    
    return this.cryptoSymbols[0]; // Fallback to BTC
  }

  /**
   * Create complete trade objects with all properties
   * @param {Object} params - Trade creation parameters
   * @returns {Array} Complete trade objects
   */
  createVolatilityTradeObjects({ amounts, times, symbols, accountBalance, config }) {
    const trades = [];
    
    for (let i = 0; i < amounts.length; i++) {
      const profitLoss = amounts[i];
      const crypto = symbols[i] || this.cryptoSymbols[0]; // Fallback to BTC if undefined
      const timestamp = times[i] || new Date().toISOString(); // Fallback timestamp if undefined
      
      // Calculate realistic position size based on profit/loss
      const positionSize = this.calculatePositionSize(profitLoss, accountBalance, crypto.volatility);
      
      const trade = {
        id: uuidv4(),
        timestamp: timestamp,
        displayTime: new Date(timestamp).toTimeString().slice(0, 5),
        cryptoSymbol: crypto.symbol,
        cryptoName: crypto.name,
        tradeType: profitLoss > 0 ? (Math.random() > 0.5 ? 'long' : 'short') : (Math.random() > 0.5 ? 'short' : 'long'),
        profitLoss: profitLoss,
        amount: Math.abs(profitLoss),
        positionSize: positionSize,
        duration: this.randomBetween(15, 240), // 15 minutes to 4 hours
        status: 'completed',
        isWinningTrade: profitLoss > 0,
        variance: this.calculateTradeVariance(profitLoss, accountBalance),
        volatility: crypto.volatility,
        // Position management data
        capitalLocked: positionSize,
        lockStartTime: timestamp,
        lockEndTime: this.calculateLockEndTime(timestamp, this.randomBetween(15, 240)),
        isLocked: false // Will be managed by position manager
      };
      
      trades.push(trade);
    }
    
    return trades;
  }

  /**
   * Calculate realistic position size for a trade
   * @param {number} profitLoss - Expected profit/loss
   * @param {number} accountBalance - Total account balance
   * @param {number} volatility - Crypto volatility factor
   * @returns {number} Position size
   */
  calculatePositionSize(profitLoss, accountBalance, volatility) {
    // Base position size: 2-15% of account
    const basePercent = this.randomBetween(0.02, 0.15);
    const baseSize = accountBalance * basePercent;
    
    // Adjust for expected profit margin (0.5% - 5% profit on position)
    const profitMargin = this.randomBetween(0.005, 0.05);
    const profitBasedSize = Math.abs(profitLoss) / profitMargin;
    
    // Use the larger of the two (more conservative)
    const positionSize = Math.max(baseSize, profitBasedSize);
    
    // Apply volatility adjustment
    const volatilityAdjustment = 1.0 - (volatility * 0.2); // Reduce position for high volatility assets
    
    return positionSize * volatilityAdjustment;
  }

  /**
   * Calculate trade variance level
   * @param {number} profitLoss - Trade profit/loss
   * @param {number} accountBalance - Account balance
   * @returns {string} Variance level
   */
  calculateTradeVariance(profitLoss, accountBalance) {
    const percent = Math.abs(profitLoss) / accountBalance;
    
    if (percent >= 0.05) return 'extreme';
    if (percent >= 0.03) return 'high';
    if (percent >= 0.015) return 'medium';
    if (percent >= 0.005) return 'low';
    return 'minimal';
  }

  /**
   * Calculate lock end time for position
   * @param {string} startTime - Lock start time
   * @param {number} durationMinutes - Duration in minutes
   * @returns {string} Lock end time
   */
  calculateLockEndTime(startTime, durationMinutes) {
    const endTime = new Date(startTime);
    endTime.setMinutes(endTime.getMinutes() + durationMinutes);
    return endTime.toISOString();
  }

  /**
   * Calculate portfolio swing range during the day
   * @param {Array} trades - All trades
   * @param {number} startingBalance - Starting balance
   * @returns {Object} Swing range information
   */
  calculatePortfolioSwingRange(trades, startingBalance) {
    let runningBalance = startingBalance;
    let minBalance = startingBalance;
    let maxBalance = startingBalance;
    
    for (const trade of trades) {
      runningBalance += trade.profitLoss;
      minBalance = Math.min(minBalance, runningBalance);
      maxBalance = Math.max(maxBalance, runningBalance);
    }
    
    const maxSwingUp = ((maxBalance - startingBalance) / startingBalance) * 100;
    const maxSwingDown = ((minBalance - startingBalance) / startingBalance) * 100;
    
    return {
      minBalance: minBalance,
      maxBalance: maxBalance,
      maxSwingUpPercent: maxSwingUp,
      maxSwingDownPercent: maxSwingDown,
      totalSwingRange: maxSwingUp - maxSwingDown
    };
  }

  /**
   * Validate mathematical precision of trades
   * @param {Array} trades - Generated trades
   * @param {number} expectedTotal - Expected total
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
      maxLoss: Math.min(...trades.map(t => t.profitLoss)),
      mathematicalPrecision: difference < 0.001 ? 'perfect' : difference < 0.01 ? 'excellent' : 'good'
    };
  }

  /**
   * Shuffle array using Fisher-Yates algorithm
   * @param {Array} array - Array to shuffle
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
   * Generate random number between min and max
   * @param {number} min - Minimum value
   * @param {number} max - Maximum value
   * @returns {number} Random number
   */
  randomBetween(min, max) {
    return min + Math.random() * (max - min);
  }
}

module.exports = VolatilityTradeGenerator;