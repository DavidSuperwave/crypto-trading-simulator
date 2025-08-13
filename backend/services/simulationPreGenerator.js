const database = require('../database');
const { v4: uuidv4 } = require('uuid');

/**
 * Simulation Pre-Generation Service
 * Generates 12 months of simulation data in advance when a deposit is approved
 * 
 * This service handles:
 * - Pre-generating 12 months of monthly targets (tiered: 20-22% first, 15-17% subsequent)
 * - Distributing monthly targets across daily goals with realistic variance
 * - Creating a complete simulation roadmap for real-time execution
 * - Storing pre-generated data for daily processing
 */
class SimulationPreGenerator {
  constructor() {
    // First month targets (higher to attract users)
    this.firstMonthMinTarget = 0.20; // 20%
    this.firstMonthMaxTarget = 0.22; // 22%
    
    // Subsequent months targets (standard returns)
    this.standardMinTarget = 0.15; // 15%
    this.standardMaxTarget = 0.17; // 17%
    
    this.simulationStartHour = 9; // 9 AM
    this.simulationEndHour = 17; // 5 PM
    this.minDailyTrades = 3;
    this.maxDailyTrades = 8;
    this.cryptoSymbols = ['BTC', 'ETH', 'ADA', 'SOL', 'DOT', 'LINK', 'UNI', 'AAVE'];
  }

  /**
   * Generate complete 12-month simulation for a user
   * Triggered when their first deposit is approved
   * @param {string} userId - User ID
   * @param {number} depositAmount - Approved deposit amount
   * @returns {Object} Complete simulation plan
   */
  async generateTwelveMonthSimulation(userId, depositAmount) {
    try {
      console.log(`🎯 Generating 12-month simulation for user ${userId} with $${depositAmount}`);

      // Check if user already has simulation data
      const existingSimulation = await this.getUserSimulation(userId);
      if (existingSimulation) {
        console.log(`⚠️ User ${userId} already has simulation data`);
        return existingSimulation;
      }

      const startDate = new Date();
      const simulationPlan = {
        userId,
        startDate: startDate.toISOString(),
        startingBalance: depositAmount,
        months: [],
        totalProjectedReturn: 0
      };

      let currentBalance = depositAmount;

      // Generate 12 months of data
      for (let monthIndex = 0; monthIndex < 12; monthIndex++) {
        const monthDate = new Date(startDate.getFullYear(), startDate.getMonth() + monthIndex, 1);
        const isFirstMonth = monthIndex === 0;
        
        const monthlyData = await this.generateMonthlySimulation(
          userId, 
          monthDate, 
          currentBalance, 
          isFirstMonth
        );

        simulationPlan.months.push(monthlyData);
        simulationPlan.totalProjectedReturn += monthlyData.targetAmount;
        
        // Update balance for next month
        currentBalance += monthlyData.targetAmount;
      }

      // Save the complete simulation plan
      await this.saveSimulationPlan(simulationPlan);

      console.log(`✅ 12-month simulation generated: Total projected return $${simulationPlan.totalProjectedReturn.toFixed(2)}`);
      
      return simulationPlan;

    } catch (error) {
      console.error('Error generating 12-month simulation:', error);
      throw error;
    }
  }

  /**
   * Generate monthly simulation data
   * @param {string} userId - User ID
   * @param {Date} monthDate - Month to generate
   * @param {number} currentBalance - Current balance for calculations
   * @param {boolean} isFirstMonth - Whether this is the first month
   * @returns {Object} Monthly simulation data
   */
  async generateMonthlySimulation(userId, monthDate, currentBalance, isFirstMonth) {
    const year = monthDate.getFullYear();
    const month = monthDate.getMonth() + 1;
    const daysInMonth = new Date(year, month, 0).getDate();

    // Generate monthly target based on tier
    const targetPercentage = this.generateMonthlyTarget(isFirstMonth);
    const targetAmount = currentBalance * targetPercentage;

    const monthlyData = {
      id: uuidv4(),
      userId,
      year,
      month,
      monthName: monthDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
      targetPercentage,
      startingBalance: currentBalance,
      targetAmount,
      daysInMonth,
      dailyTargets: [],
      isFirstMonth
    };

    // Generate daily distribution for the month
    const dailyTargets = this.calculateDailyTargets(targetAmount, daysInMonth);

    // Create daily simulation data
    for (let day = 1; day <= daysInMonth; day++) {
      const dailyDate = new Date(year, month - 1, day);
      
      // Skip weekends (configurable)
      const isWeekend = dailyDate.getDay() === 0 || dailyDate.getDay() === 6;
      if (isWeekend) {
        continue; // Skip weekends for now (can be made configurable)
      }

      const dailyTarget = {
        id: uuidv4(),
        date: dailyDate.toISOString().split('T')[0],
        targetAmount: dailyTargets[day - 1] || 0,
        numberOfTrades: this.generateRandomTradeCount(),
        trades: [], // Will be generated when the day arrives
        status: 'scheduled'
      };

      monthlyData.dailyTargets.push(dailyTarget);
    }

    return monthlyData;
  }

  /**
   * Generate monthly target percentage based on tier
   * @param {boolean} isFirstMonth - Whether this is the first month
   * @returns {number} Monthly target as decimal
   */
  generateMonthlyTarget(isFirstMonth) {
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
   * Calculate daily targets using weighted distribution
   * @param {number} totalMonthlyTarget - Total amount to distribute
   * @param {number} daysInMonth - Number of days in month
   * @returns {Array} Array of daily target amounts
   */
  calculateDailyTargets(totalMonthlyTarget, daysInMonth) {
    const weights = [];
    
    // Generate random weights with variance (some days better than others)
    for (let i = 0; i < daysInMonth; i++) {
      // Base weight of 1.0, with random variance between 0.3 and 2.0
      const weight = 0.3 + (Math.random() * 1.7);
      weights.push(weight);
    }

    // Calculate total weight
    const totalWeight = weights.reduce((sum, weight) => sum + weight, 0);

    // Distribute total amount proportionally
    const dailyTargets = weights.map(weight => {
      return (weight / totalWeight) * totalMonthlyTarget;
    });

    // Ensure minimum daily target (at least 0.5% of monthly target)
    const minDailyTarget = totalMonthlyTarget * 0.005;
    return dailyTargets.map(amount => Math.max(amount, minDailyTarget));
  }

  /**
   * Generate random number of trades for a day
   * @returns {number} Number of trades
   */
  generateRandomTradeCount() {
    return Math.floor(Math.random() * (this.maxDailyTrades - this.minDailyTrades + 1)) + this.minDailyTrades;
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

  // Database operations
  async saveSimulationPlan(simulationPlan) {
    try {
      if (database.usePostgreSQL) {
        // PostgreSQL implementation would go here
        // For now, using JSON file storage
      }
      
      // JSON implementation
      const simulationPlans = database.readFile('data/simulation_plans.json') || [];
      
      // Remove any existing plan for this user
      const filteredPlans = simulationPlans.filter(plan => plan.userId !== simulationPlan.userId);
      
      // Add new plan
      filteredPlans.push({
        ...simulationPlan,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
      
      database.writeFile('data/simulation_plans.json', filteredPlans);
      
      console.log(`💾 Saved simulation plan for user ${simulationPlan.userId}`);
      return simulationPlan;
      
    } catch (error) {
      console.error('Error saving simulation plan:', error);
      throw error;
    }
  }

  async getUserSimulation(userId) {
    try {
      if (database.usePostgreSQL) {
        // PostgreSQL implementation would go here
        return null;
      }
      
      // JSON implementation
      const simulationPlans = database.readFile('data/simulation_plans.json') || [];
      return simulationPlans.find(plan => plan.userId === userId) || null;
      
    } catch (error) {
      console.error('Error getting user simulation:', error);
      return null;
    }
  }

  /**
   * Get today's simulation target for a user
   * @param {string} userId - User ID
   * @param {string} targetDate - Date (YYYY-MM-DD)
   * @returns {Object|null} Daily target or null
   */
  async getTodaysTarget(userId, targetDate = null) {
    try {
      if (!targetDate) {
        targetDate = new Date().toISOString().split('T')[0];
      }

      const simulationPlan = await this.getUserSimulation(userId);
      if (!simulationPlan) {
        return null;
      }

      // Find the month and day
      for (const month of simulationPlan.months) {
        const dailyTarget = month.dailyTargets.find(day => day.date === targetDate);
        if (dailyTarget) {
          return {
            ...dailyTarget,
            monthlyContext: {
              month: month.month,
              year: month.year,
              monthName: month.monthName,
              isFirstMonth: month.isFirstMonth,
              targetPercentage: month.targetPercentage
            }
          };
        }
      }

      return null;
    } catch (error) {
      console.error('Error getting today\'s target:', error);
      return null;
    }
  }

  /**
   * Update daily target status
   * @param {string} userId - User ID
   * @param {string} date - Date (YYYY-MM-DD)
   * @param {Object} updates - Updates to apply
   */
  async updateDailyTarget(userId, date, updates) {
    try {
      const simulationPlan = await this.getUserSimulation(userId);
      if (!simulationPlan) {
        return null;
      }

      // Find and update the daily target
      for (const month of simulationPlan.months) {
        const dailyTargetIndex = month.dailyTargets.findIndex(day => day.date === date);
        if (dailyTargetIndex !== -1) {
          month.dailyTargets[dailyTargetIndex] = {
            ...month.dailyTargets[dailyTargetIndex],
            ...updates,
            updatedAt: new Date().toISOString()
          };

          // Save updated plan
          await this.saveSimulationPlan(simulationPlan);
          return month.dailyTargets[dailyTargetIndex];
        }
      }

      return null;
    } catch (error) {
      console.error('Error updating daily target:', error);
      throw error;
    }
  }
}

module.exports = SimulationPreGenerator;