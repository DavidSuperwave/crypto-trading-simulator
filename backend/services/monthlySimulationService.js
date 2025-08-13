const database = require('../database');
const { v4: uuidv4 } = require('uuid');

/**
 * Monthly Simulation Service
 * Core engine for managing tiered monthly targets and daily distribution
 * 
 * This service handles:
 * - Generating monthly simulation targets:
 *   • First month: 20%-22% (higher to attract new users)
 *   • Subsequent months: 15%-17% (standard returns)
 * - Distributing monthly targets across daily goals
 * - Managing simulation lifecycle and progress tracking
 * - Calculating realistic daily target amounts
 */
class MonthlySimulationService {
  constructor() {
    // First month targets (higher to attract users)
    this.firstMonthMinTarget = 0.20; // 20%
    this.firstMonthMaxTarget = 0.22; // 22%
    
    // Subsequent months targets (standard returns)
    this.standardMinTarget = 0.15; // 15%
    this.standardMaxTarget = 0.17; // 17%
    
    this.simulationStartHour = 9; // 9 AM
    this.simulationEndHour = 17; // 5 PM
  }

  /**
   * Generate a random monthly target based on user's simulation history
   * First month: 20%-22% (higher to attract users)
   * Subsequent months: 15%-17% (standard returns)
   * @param {boolean} isFirstMonth - Whether this is the user's first simulation month
   * @returns {number} Monthly target as decimal (e.g., 0.21 for 21%)
   */
  generateMonthlyTarget(isFirstMonth = false) {
    let minTarget, maxTarget;
    
    if (isFirstMonth) {
      minTarget = this.firstMonthMinTarget;
      maxTarget = this.firstMonthMaxTarget;
    } else {
      minTarget = this.standardMinTarget;
      maxTarget = this.standardMaxTarget;
    }
    
    const variation = Math.random() * (maxTarget - minTarget);
    return minTarget + variation;
  }

  /**
   * Initialize monthly simulation for a user
   * @param {string} userId - User ID
   * @param {number} currentBalance - User's current deposited amount
   * @returns {Object} Monthly simulation target
   */
  async initializeMonthlySimulation(userId, currentBalance = null) {
    try {
      console.log(`🎯 Initializing monthly simulation for user: ${userId}`);

      // Get user's current deposited amount if not provided
      if (!currentBalance) {
        const user = await database.getUserById(userId);
        currentBalance = user.depositedAmount || user.balance || 0;
      }

      if (currentBalance < 100) {
        console.log(`⚠️ User ${userId} balance too low for simulation: $${currentBalance}`);
        return null;
      }

      const now = new Date();
      const year = now.getFullYear();
      const month = now.getMonth() + 1;

      // Check if monthly target already exists
      const existingTarget = await this.getMonthlyTarget(userId, year, month);
      if (existingTarget && existingTarget.status === 'active') {
        console.log(`📊 Monthly target already exists for user ${userId}`);
        return existingTarget;
      }

      // Check if this is the user's first simulation month
      const isFirstMonth = await this.isUserFirstMonth(userId);
      
      // Generate new monthly target based on user's simulation history
      const targetPercentage = this.generateMonthlyTarget(isFirstMonth);
      const targetAmount = currentBalance * targetPercentage;
      
      console.log(`📊 Generating ${isFirstMonth ? 'FIRST MONTH' : 'standard'} target: ${(targetPercentage * 100).toFixed(1)}%`);
      const daysInMonth = new Date(year, month, 0).getDate();

      const monthlyTarget = {
        id: uuidv4(),
        userId,
        year,
        month,
        targetPercentage,
        startingBalance: currentBalance,
        targetAmount,
        achievedAmount: 0,
        daysInMonth,
        status: 'active'
      };

      // Save to database
      await this.saveMonthlyTarget(monthlyTarget);

      // Generate daily distribution
      await this.generateDailyDistribution(monthlyTarget);

      console.log(`✅ Monthly simulation initialized: ${(targetPercentage * 100).toFixed(1)}% target ($${targetAmount.toFixed(2)})`);
      
      return monthlyTarget;

    } catch (error) {
      console.error('Error initializing monthly simulation:', error);
      throw error;
    }
  }

  /**
   * Generate daily distribution for monthly target
   * Uses weighted random distribution to make some days better than others
   * @param {Object} monthlyTarget - Monthly target object
   */
  async generateDailyDistribution(monthlyTarget) {
    try {
      console.log(`📅 Generating daily distribution for ${monthlyTarget.daysInMonth} days`);

      const dailyTargets = this.calculateDailyTargets(
        monthlyTarget.targetAmount,
        monthlyTarget.daysInMonth
      );

      const today = new Date();
      const year = monthlyTarget.year;
      const month = monthlyTarget.month;

      for (let day = 1; day <= monthlyTarget.daysInMonth; day++) {
        const simulationDate = new Date(year, month - 1, day);
        
        // Skip weekends if configured
        const isWeekend = simulationDate.getDay() === 0 || simulationDate.getDay() === 6;
        const weekendTrading = await this.getSimulationParameter('weekend_trading', false);
        
        if (isWeekend && !weekendTrading) {
          continue;
        }

        const dailyRecord = {
          id: uuidv4(),
          userId: monthlyTarget.userId,
          monthlyTargetId: monthlyTarget.id,
          simulationDate: simulationDate.toISOString().split('T')[0],
          dailyTargetAmount: dailyTargets[day - 1] || 0,
          achievedAmount: 0,
          numberOfTrades: 0,
          status: simulationDate <= today ? 'pending' : 'future'
        };

        await this.saveDailyRecord(dailyRecord);
      }

      console.log(`✅ Generated ${monthlyTarget.daysInMonth} daily targets`);

    } catch (error) {
      console.error('Error generating daily distribution:', error);
      throw error;
    }
  }

  /**
   * Calculate daily targets using weighted distribution
   * Some days will have higher targets to simulate market volatility
   * @param {number} totalMonthlyTarget - Total amount to distribute
   * @param {number} daysInMonth - Number of days in month
   * @returns {Array} Array of daily target amounts
   */
  calculateDailyTargets(totalMonthlyTarget, daysInMonth) {
    const weights = [];
    
    // Generate random weights with some variance
    for (let i = 0; i < daysInMonth; i++) {
      // Base weight of 1.0, with random variance between 0.5 and 2.0
      const weight = 0.5 + (Math.random() * 1.5);
      weights.push(weight);
    }

    // Calculate total weight
    const totalWeight = weights.reduce((sum, weight) => sum + weight, 0);

    // Distribute total amount proportionally
    const dailyTargets = weights.map(weight => {
      return (weight / totalWeight) * totalMonthlyTarget;
    });

    // Ensure we don't have any days with too small amounts
    const minDailyTarget = totalMonthlyTarget * 0.01; // At least 1% of monthly target
    return dailyTargets.map(amount => Math.max(amount, minDailyTarget));
  }

  /**
   * Process daily simulation for a specific user
   * @param {string} userId - User ID
   * @param {string} targetDate - Date to process (YYYY-MM-DD)
   * @returns {Object} Daily simulation results
   */
  async processDailySimulation(userId, targetDate = null) {
    try {
      if (!targetDate) {
        targetDate = new Date().toISOString().split('T')[0];
      }

      console.log(`🔄 Processing daily simulation for user ${userId} on ${targetDate}`);

      // Get daily record
      const dailyRecord = await this.getDailyRecord(userId, targetDate);
      if (!dailyRecord) {
        console.log(`⚠️ No daily record found for user ${userId} on ${targetDate}`);
        return null;
      }

      if (dailyRecord.status === 'completed') {
        console.log(`✅ Daily simulation already completed for ${targetDate}`);
        return dailyRecord;
      }

      // Process the simulation
      const simulationResult = await this.runDailySimulation(dailyRecord);

      // Update daily record
      await this.updateDailyRecord(dailyRecord.id, {
        achievedAmount: simulationResult.totalProfit,
        numberOfTrades: simulationResult.trades.length,
        largestWin: simulationResult.largestWin,
        largestLoss: simulationResult.largestLoss,
        winRate: simulationResult.winRate,
        status: 'completed'
      });

      // Update user's simulated interest
      await this.updateUserSimulatedInterest(userId);

      console.log(`✅ Daily simulation completed: $${simulationResult.totalProfit.toFixed(2)} in ${simulationResult.trades.length} trades`);

      return {
        ...dailyRecord,
        achievedAmount: simulationResult.totalProfit,
        trades: simulationResult.trades
      };

    } catch (error) {
      console.error('Error processing daily simulation:', error);
      throw error;
    }
  }

  /**
   * Run the actual daily simulation logic
   * @param {Object} dailyRecord - Daily record to simulate
   * @returns {Object} Simulation results
   */
  async runDailySimulation(dailyRecord) {
    const targetAmount = dailyRecord.dailyTargetAmount;
    const variance = 0.15; // Allow 15% variance from target
    
    // Actual amount will be target ± variance
    const actualAmount = targetAmount * (1 + (Math.random() - 0.5) * 2 * variance);
    
    // Generate number of trades (3-8 trades per day)
    const minTrades = await this.getSimulationParameter('min_daily_trades', 3);
    const maxTrades = await this.getSimulationParameter('max_daily_trades', 8);
    const numberOfTrades = Math.floor(Math.random() * (maxTrades - minTrades + 1)) + minTrades;

    // Generate win rate (60-85%)
    const minWinRate = await this.getSimulationParameter('win_rate_min', 0.60);
    const maxWinRate = await this.getSimulationParameter('win_rate_max', 0.85);
    const winRate = minWinRate + Math.random() * (maxWinRate - minWinRate);

          // Generate trades that sum to actual amount
      const trades = await this.generateDailyTrades(
        dailyRecord,
        numberOfTrades,
        actualAmount,
        winRate
      );

      // Save generated trades to database
      await this.saveSimulatedTrades(trades);

      const wins = trades.filter(t => t.profitLoss > 0);
      const losses = trades.filter(t => t.profitLoss < 0);

      return {
        totalProfit: actualAmount,
        trades,
        largestWin: wins.length > 0 ? Math.max(...wins.map(t => t.profitLoss)) : 0,
        largestLoss: losses.length > 0 ? Math.min(...losses.map(t => t.profitLoss)) : 0,
        winRate: wins.length / trades.length,
        numberOfTrades
      };
  }

  /**
   * Generate individual trades for a day
   * @param {Object} dailyRecord - Daily record
   * @param {number} numberOfTrades - Number of trades to generate
   * @param {number} totalProfit - Total profit to achieve
   * @param {number} targetWinRate - Target win rate
   * @returns {Array} Array of trade objects
   */
  async generateDailyTrades(dailyRecord, numberOfTrades, totalProfit, targetWinRate) {
    const cryptoSymbols = await this.getSimulationParameter('crypto_symbols', 
      ['BTC', 'ETH', 'ADA', 'SOL', 'DOT', 'LINK', 'UNI', 'AAVE']
    );

    const trades = [];
    const winningTrades = Math.round(numberOfTrades * targetWinRate);
    const losingTrades = numberOfTrades - winningTrades;

    // Calculate trade amounts
    const winAmount = totalProfit * 1.5; // Wins need to offset losses
    const lossAmount = totalProfit * 0.5;

    // Generate winning trades
    for (let i = 0; i < winningTrades; i++) {
      const crypto = cryptoSymbols[Math.floor(Math.random() * cryptoSymbols.length)];
      const tradeAmount = winAmount / winningTrades;
      const variance = 0.3; // 30% variance in trade amounts
      const actualAmount = tradeAmount * (1 + (Math.random() - 0.5) * 2 * variance);

      trades.push({
        id: uuidv4(),
        userId: dailyRecord.userId,
        dailyRecordId: dailyRecord.id,
        tradeType: Math.random() > 0.5 ? 'buy' : 'sell',
        cryptoSymbol: crypto,
        cryptoName: this.getCryptoName(crypto),
        amount: Math.abs(actualAmount) * 10, // Trade amount (not profit)
        profitLoss: Math.abs(actualAmount),
        tradeDurationMinutes: Math.floor(Math.random() * 240) + 15, // 15-255 minutes
        tradeTimestamp: this.generateTradeTimestamp(dailyRecord.simulationDate),
        status: 'completed'
      });
    }

    // Generate losing trades
    for (let i = 0; i < losingTrades; i++) {
      const crypto = cryptoSymbols[Math.floor(Math.random() * cryptoSymbols.length)];
      const tradeAmount = lossAmount / losingTrades;
      const variance = 0.3;
      const actualAmount = tradeAmount * (1 + (Math.random() - 0.5) * 2 * variance);

      trades.push({
        id: uuidv4(),
        userId: dailyRecord.userId,
        dailyRecordId: dailyRecord.id,
        tradeType: Math.random() > 0.5 ? 'buy' : 'sell',
        cryptoSymbol: crypto,
        cryptoName: this.getCryptoName(crypto),
        amount: Math.abs(actualAmount) * 10,
        profitLoss: -Math.abs(actualAmount),
        tradeDurationMinutes: Math.floor(Math.random() * 180) + 10,
        tradeTimestamp: this.generateTradeTimestamp(dailyRecord.simulationDate),
        status: 'completed'
      });
    }

    // Sort trades by timestamp
    trades.sort((a, b) => new Date(a.tradeTimestamp) - new Date(b.tradeTimestamp));

    return trades;
  }

  /**
   * Generate realistic trade timestamp within business hours
   * @param {string} dateStr - Date string (YYYY-MM-DD)
   * @returns {string} ISO timestamp
   */
  generateTradeTimestamp(dateStr) {
    const date = new Date(dateStr);
    const startHour = this.simulationStartHour;
    const endHour = this.simulationEndHour;
    
    const randomHour = Math.floor(Math.random() * (endHour - startHour)) + startHour;
    const randomMinute = Math.floor(Math.random() * 60);
    const randomSecond = Math.floor(Math.random() * 60);

    date.setHours(randomHour, randomMinute, randomSecond, 0);
    return date.toISOString();
  }

  /**
   * Get crypto currency name from symbol
   * @param {string} symbol - Crypto symbol
   * @returns {string} Crypto name
   */
  getCryptoName(symbol) {
    const cryptoNames = {
      'BTC': 'Bitcoin',
      'ETH': 'Ethereum',
      'ADA': 'Cardano',
      'SOL': 'Solana',
      'DOT': 'Polkadot',
      'LINK': 'Chainlink',
      'UNI': 'Uniswap',
      'AAVE': 'Aave'
    };
    return cryptoNames[symbol] || symbol;
  }

  /**
   * Update user's total simulated interest from all daily records
   * @param {string} userId - User ID
   */
  async updateUserSimulatedInterest(userId) {
    try {
      // Calculate total simulated interest from all completed daily records
      const totalSimulatedInterest = await this.calculateTotalSimulatedInterest(userId);
      
      await database.updateUser(userId, {
        simulatedInterest: totalSimulatedInterest,
        lastSimulationUpdate: new Date().toISOString()
      });

      console.log(`💰 Updated user ${userId} simulated interest: $${totalSimulatedInterest.toFixed(2)}`);

    } catch (error) {
      console.error('Error updating user simulated interest:', error);
      throw error;
    }
  }

  /**
   * Calculate total simulated interest for a user
   * @param {string} userId - User ID
   * @returns {number} Total simulated interest
   */
  async calculateTotalSimulatedInterest(userId) {
    // This will be implemented based on your database structure
    // For now, returning 0 as placeholder
    return 0;
  }

  /**
   * Get simulation parameter value
   * @param {string} paramName - Parameter name
   * @param {*} defaultValue - Default value if parameter not found
   * @returns {*} Parameter value
   */
  async getSimulationParameter(paramName, defaultValue) {
    try {
      // This will be implemented to query simulation_parameters table
      // For now, returning default values
      const defaults = {
        'min_daily_trades': 3,
        'max_daily_trades': 8,
        'win_rate_min': 0.60,
        'win_rate_max': 0.85,
        'weekend_trading': false,
        'crypto_symbols': ['BTC', 'ETH', 'ADA', 'SOL', 'DOT', 'LINK', 'UNI', 'AAVE']
      };
      
      return defaults[paramName] || defaultValue;

    } catch (error) {
      console.error(`Error getting simulation parameter ${paramName}:`, error);
      return defaultValue;
    }
  }

  /**
   * Check if this is the user's first simulation month
   * @param {string} userId - User ID
   * @returns {boolean} True if this is the user's first month
   */
  async isUserFirstMonth(userId) {
    try {
      if (database.usePostgreSQL) {
        const query = `
          SELECT COUNT(*) as count 
          FROM monthly_simulation_targets 
          WHERE user_id = $1 AND status IN ('active', 'completed')
        `;
        const result = await database.query(query, [userId]);
        return parseInt(result.rows[0].count) === 0;
      } else {
        // JSON implementation
        const monthlyTargets = database.readFile('backend/data/monthly_targets.json') || [];
        const userTargets = monthlyTargets.filter(target => 
          target.userId === userId && 
          ['active', 'completed'].includes(target.status)
        );
        return userTargets.length === 0;
      }
    } catch (error) {
      console.error('Error checking if user first month:', error);
      // Default to false (standard rates) if we can't determine
      return false;
    }
  }

  // Database helper methods
  async saveMonthlyTarget(monthlyTarget) {
    try {
      if (database.usePostgreSQL) {
        const query = `
          INSERT INTO monthly_simulation_targets 
          (id, user_id, year, month, target_percentage, starting_balance, target_amount, achieved_amount, days_in_month, status, created_at, updated_at)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW(), NOW())
          RETURNING *
        `;
        const values = [
          monthlyTarget.id,
          monthlyTarget.userId,
          monthlyTarget.year,
          monthlyTarget.month,
          monthlyTarget.targetPercentage,
          monthlyTarget.startingBalance,
          monthlyTarget.targetAmount,
          monthlyTarget.achievedAmount,
          monthlyTarget.daysInMonth,
          monthlyTarget.status
        ];
        const result = await database.query(query, values);
        return result.rows[0];
      } else {
        // JSON implementation for development
        const monthlyTargets = database.readFile('backend/data/monthly_targets.json') || [];
        monthlyTargets.push({
          ...monthlyTarget,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });
        database.writeFile('backend/data/monthly_targets.json', monthlyTargets);
        return monthlyTarget;
      }
    } catch (error) {
      console.error('Error saving monthly target:', error);
      throw error;
    }
  }

  async getMonthlyTarget(userId, year, month) {
    try {
      if (database.usePostgreSQL) {
        const query = `
          SELECT * FROM monthly_simulation_targets 
          WHERE user_id = $1 AND year = $2 AND month = $3 AND status = 'active'
          ORDER BY created_at DESC LIMIT 1
        `;
        const result = await database.query(query, [userId, year, month]);
        return result.rows[0] || null;
      } else {
        // JSON implementation
        const monthlyTargets = database.readFile('backend/data/monthly_targets.json') || [];
        return monthlyTargets.find(target => 
          target.userId === userId && 
          target.year === year && 
          target.month === month && 
          target.status === 'active'
        ) || null;
      }
    } catch (error) {
      console.error('Error getting monthly target:', error);
      return null;
    }
  }

  async saveDailyRecord(dailyRecord) {
    try {
      if (database.usePostgreSQL) {
        const query = `
          INSERT INTO daily_simulation_records 
          (id, user_id, monthly_target_id, simulation_date, daily_target_amount, achieved_amount, number_of_trades, status, created_at, updated_at)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())
          RETURNING *
        `;
        const values = [
          dailyRecord.id,
          dailyRecord.userId,
          dailyRecord.monthlyTargetId,
          dailyRecord.simulationDate,
          dailyRecord.dailyTargetAmount,
          dailyRecord.achievedAmount,
          dailyRecord.numberOfTrades,
          dailyRecord.status
        ];
        const result = await database.query(query, values);
        return result.rows[0];
      } else {
        // JSON implementation
        const dailyRecords = database.readFile('backend/data/daily_records.json') || [];
        dailyRecords.push({
          ...dailyRecord,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });
        database.writeFile('backend/data/daily_records.json', dailyRecords);
        return dailyRecord;
      }
    } catch (error) {
      console.error('Error saving daily record:', error);
      throw error;
    }
  }

  async getDailyRecord(userId, date) {
    try {
      if (database.usePostgreSQL) {
        const query = `
          SELECT * FROM daily_simulation_records 
          WHERE user_id = $1 AND simulation_date = $2
          ORDER BY created_at DESC LIMIT 1
        `;
        const result = await database.query(query, [userId, date]);
        return result.rows[0] || null;
      } else {
        // JSON implementation
        const dailyRecords = database.readFile('backend/data/daily_records.json') || [];
        return dailyRecords.find(record => 
          record.userId === userId && 
          record.simulationDate === date
        ) || null;
      }
    } catch (error) {
      console.error('Error getting daily record:', error);
      return null;
    }
  }

  async updateDailyRecord(recordId, updates) {
    try {
      if (database.usePostgreSQL) {
        const setClause = Object.keys(updates).map((key, index) => 
          `${key} = $${index + 2}`
        ).join(', ');
        
        const query = `
          UPDATE daily_simulation_records 
          SET ${setClause}, updated_at = NOW() 
          WHERE id = $1 
          RETURNING *
        `;
        const values = [recordId, ...Object.values(updates)];
        const result = await database.query(query, values);
        return result.rows[0];
      } else {
        // JSON implementation
        const dailyRecords = database.readFile('backend/data/daily_records.json') || [];
        const recordIndex = dailyRecords.findIndex(record => record.id === recordId);
        
        if (recordIndex !== -1) {
          dailyRecords[recordIndex] = {
            ...dailyRecords[recordIndex],
            ...updates,
            updatedAt: new Date().toISOString()
          };
          database.writeFile('backend/data/daily_records.json', dailyRecords);
          return dailyRecords[recordIndex];
        }
        return null;
      }
    } catch (error) {
      console.error('Error updating daily record:', error);
      throw error;
    }
  }

  async calculateTotalSimulatedInterest(userId) {
    try {
      if (database.usePostgreSQL) {
        const query = `
          SELECT COALESCE(SUM(achieved_amount), 0) as total_interest
          FROM daily_simulation_records 
          WHERE user_id = $1 AND status = 'completed'
        `;
        const result = await database.query(query, [userId]);
        return parseFloat(result.rows[0].total_interest) || 0;
      } else {
        // JSON implementation
        const dailyRecords = database.readFile('backend/data/daily_records.json') || [];
        return dailyRecords
          .filter(record => record.userId === userId && record.status === 'completed')
          .reduce((total, record) => total + (record.achievedAmount || 0), 0);
      }
    } catch (error) {
      console.error('Error calculating total simulated interest:', error);
      return 0;
    }
  }

  async saveSimulatedTrades(trades) {
    try {
      if (database.usePostgreSQL) {
        for (const trade of trades) {
          const query = `
            INSERT INTO simulated_trades 
            (id, user_id, daily_record_id, trade_type, crypto_symbol, crypto_name, amount, profit_loss, trade_duration_minutes, trade_timestamp, status, created_at)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW())
          `;
          const values = [
            trade.id,
            trade.userId,
            trade.dailyRecordId,
            trade.tradeType,
            trade.cryptoSymbol,
            trade.cryptoName,
            trade.amount,
            trade.profitLoss,
            trade.tradeDurationMinutes,
            trade.tradeTimestamp,
            trade.status
          ];
          await database.query(query, values);
        }
      } else {
        // JSON implementation
        const simulatedTrades = database.readFile('backend/data/simulated_trades.json') || [];
        simulatedTrades.push(...trades.map(trade => ({
          ...trade,
          createdAt: new Date().toISOString()
        })));
        database.writeFile('backend/data/simulated_trades.json', simulatedTrades);
      }
      console.log(`💹 Saved ${trades.length} simulated trades`);
    } catch (error) {
      console.error('Error saving simulated trades:', error);
      throw error;
    }
  }

  async getSimulationParameter(paramName, defaultValue) {
    try {
      if (database.usePostgreSQL) {
        const query = `
          SELECT parameter_value, parameter_type 
          FROM simulation_parameters 
          WHERE parameter_name = $1
        `;
        const result = await database.query(query, [paramName]);
        
        if (result.rows.length > 0) {
          const { parameter_value, parameter_type } = result.rows[0];
          
          switch (parameter_type) {
            case 'number':
              return parseFloat(parameter_value);
            case 'boolean':
              return parameter_value === 'true';
            case 'json':
              return JSON.parse(parameter_value);
            default:
              return parameter_value;
          }
        }
      } else {
        // JSON implementation with defaults
        const defaults = {
          'min_daily_trades': 3,
          'max_daily_trades': 8,
          'win_rate_min': 0.60,
          'win_rate_max': 0.85,
          'weekend_trading': false,
          'crypto_symbols': ['BTC', 'ETH', 'ADA', 'SOL', 'DOT', 'LINK', 'UNI', 'AAVE']
        };
        
        return defaults[paramName] !== undefined ? defaults[paramName] : defaultValue;
      }
      
      return defaultValue;
    } catch (error) {
      console.error(`Error getting simulation parameter ${paramName}:`, error);
      return defaultValue;
    }
  }
}

module.exports = MonthlySimulationService;