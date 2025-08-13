const database = require('../database');
const { v4: uuidv4 } = require('uuid');
const path = require('path');
const DailyVolatilityService = require('./dailyVolatilityService');
const IntradayTradeService = require('./intradayTradeService');

/**
 * Compound Interest Simulation Service
 * Handles the specific compound interest workflow described by the user:
 * 
 * 1. When first deposit is approved, generate 12-month locked rates
 * 2. Month 1: 20-22% (random), Months 2-12: 15-17% (random)
 * 3. Calculate daily payouts using fixed daily schedule
 * 4. Handle mid-month deposit adjustments by recalculating remaining daily payouts
 * 5. Compound growth: each month builds on previous month's total
 */
class CompoundInterestSimulation {
  constructor() {
    // First month targets (higher to attract users)
    this.firstMonthMinRate = 0.20; // 20%
    this.firstMonthMaxRate = 0.22; // 22%
    
    // Subsequent months targets (standard returns)
    this.standardMinRate = 0.15; // 15%
    this.standardMaxRate = 0.17; // 17%
    
    // Initialize new services for daily volatility and trade generation
    this.volatilityService = new DailyVolatilityService();
    this.tradeService = new IntradayTradeService();
  }

  /**
   * Initialize 12-month compound interest simulation for a new user
   * Called when first deposit is approved
   * @param {string} userId - User ID
   * @param {number} initialDeposit - First deposit amount
   * @returns {Object} Simulation plan
   */
  async initializeSimulation(userId, initialDeposit) {
    try {
      console.log(`🎯 Initializing compound interest simulation for user ${userId} with $${initialDeposit}`);

      // Check if user already has a simulation
      const existingSimulation = await this.getUserSimulation(userId);
      if (existingSimulation) {
        console.log(`⚠️ User ${userId} already has simulation data`);
        return existingSimulation;
      }

      const startDate = new Date();
      const simulationPlan = {
        userId,
        startDate: startDate.toISOString(),
        initialDeposit,
        totalDeposited: initialDeposit,
        currentBalance: initialDeposit,
        months: [],
        totalProjectedReturn: 0
      };

      let runningBalance = initialDeposit;

      // Generate 12 months with locked rates
      for (let monthIndex = 0; monthIndex < 12; monthIndex++) {
        const monthDate = new Date(startDate.getFullYear(), startDate.getMonth() + monthIndex, 1);
        const isFirstMonth = monthIndex === 0;
        
        // Generate locked monthly rate
        const monthlyRate = this.generateLockedMonthlyRate(isFirstMonth);
        const monthlyInterest = runningBalance * monthlyRate;
        
        const daysInMonth = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0).getDate();
        
        // Generate daily volatility pattern for this month
        const dailyVolatility = this.volatilityService.generateMonthlyVolatility({
          monthlyTargetAmount: monthlyInterest,
          daysInMonth: daysInMonth,
          startingBalance: runningBalance
        });

        const monthData = {
          id: uuidv4(),
          monthNumber: monthIndex + 1,
          year: monthDate.getFullYear(),
          month: monthDate.getMonth() + 1,
          monthName: monthDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
          isFirstMonth,
          lockedRate: monthlyRate,
          startingBalance: runningBalance,
          projectedInterest: monthlyInterest,
          endingBalance: runningBalance + monthlyInterest,
          daysInMonth: daysInMonth,
          dailyPayoutSchedule: this.calculateDailyPayoutSchedule(monthlyInterest, daysInMonth),
          dailyVolatility: dailyVolatility, // NEW: Add volatility pattern
          tradeCount: this.tradeService.getTradeCount(runningBalance), // NEW: Account-based trade count
          actualDeposits: monthIndex === 0 ? [{ amount: initialDeposit, date: startDate.toISOString().split('T')[0] }] : [],
          actualInterestPaid: 0,
          lastPayoutDate: null, // Simple tracking to prevent double payments
          status: monthIndex === 0 ? 'active' : 'scheduled'
        };

        simulationPlan.months.push(monthData);
        simulationPlan.totalProjectedReturn += monthlyInterest;
        
        // Update running balance for next month (compound growth)
        runningBalance += monthlyInterest;
      }

      // Daily payout schedules are now calculated for all months during creation

      // Save the simulation plan
      await this.saveSimulationPlan(simulationPlan);

      // Update user's simulation fields
      await database.updateUser(userId, {
        simulationActive: true,
        simulationStartDate: startDate.toISOString(),
        depositedAmount: initialDeposit
      });

      console.log(`✅ Compound interest simulation initialized: 12 months, projected return $${simulationPlan.totalProjectedReturn.toFixed(2)}`);
      
      return {
        success: true,
        simulationPlan,
        message: `12-month compound interest simulation created with projected return of $${simulationPlan.totalProjectedReturn.toFixed(2)}`
      };

    } catch (error) {
      console.error('Error initializing compound interest simulation:', error);
      throw error;
    }
  }

  /**
   * Generate locked monthly rate based on tier
   * @param {boolean} isFirstMonth - Whether this is the first month
   * @returns {number} Monthly rate as decimal
   */
  generateLockedMonthlyRate(isFirstMonth) {
    let minRate, maxRate;
    
    if (isFirstMonth) {
      minRate = this.firstMonthMinRate;
      maxRate = this.firstMonthMaxRate;
    } else {
      minRate = this.standardMinRate;
      maxRate = this.standardMaxRate;
    }
    
    const variation = Math.random() * (maxRate - minRate);
    return minRate + variation;
  }

  /**
   * Calculate daily payout schedule for a month
   * @param {number} monthlyInterestTarget - Total interest for the month
   * @param {number} daysInMonth - Number of days in month
   * @returns {Object} Daily payout schedule
   */
  calculateDailyPayoutSchedule(monthlyInterestTarget, daysInMonth) {
    const dailyPayout = monthlyInterestTarget / daysInMonth;
    
    return {
      totalMonthlyTarget: monthlyInterestTarget,
      dailyPayout,
      daysInMonth,
      alreadyPaid: 0,
      remainingDays: daysInMonth,
      remainingAmount: monthlyInterestTarget,
      lastUpdated: new Date().toISOString()
    };
  }

  /**
   * Handle new deposit during an active month
   * Recalculates daily payouts for remaining days in month
   * @param {string} userId - User ID
   * @param {number} depositAmount - New deposit amount
   * @param {string} depositDate - Date of deposit (YYYY-MM-DD)
   * @returns {Object} Updated simulation plan
   */
  async handleMidMonthDeposit(userId, depositAmount, depositDate) {
    try {
      console.log(`💰 Processing mid-month deposit: User ${userId}, $${depositAmount} on ${depositDate}`);

      const simulationPlan = await this.getUserSimulation(userId);
      if (!simulationPlan) {
        throw new Error(`No simulation found for user ${userId}`);
      }

      const depositDateObj = new Date(depositDate);
      const currentMonth = depositDateObj.getMonth() + 1;
      const currentYear = depositDateObj.getFullYear();

      // Find the current month in simulation
      const monthIndex = simulationPlan.months.findIndex(m => 
        m.year === currentYear && m.month === currentMonth && m.status === 'active'
      );

      if (monthIndex === -1) {
        throw new Error(`No active month found for ${depositDate}`);
      }

      const currentMonthData = simulationPlan.months[monthIndex];
      
      // Add deposit to actual deposits
      currentMonthData.actualDeposits.push({
        amount: depositAmount,
        date: depositDate
      });

      // Calculate new balance after deposit
      const newBalance = currentMonthData.startingBalance + depositAmount;
      
      // Calculate days passed and remaining
      const dayOfMonth = depositDateObj.getDate();
      const daysPassed = dayOfMonth - 1; // Days before the deposit
      const remainingDays = currentMonthData.daysInMonth - dayOfMonth + 1; // Including deposit day
      
      // Calculate already paid interest (for original balance)
      const oldDailyPayout = currentMonthData.dailyPayoutSchedule.dailyPayout;
      const alreadyPaid = oldDailyPayout * daysPassed;
      
      // 🔧 FIXED: Prorated returns calculation
      // Original balance continues with original plan
      const originalRemainingTarget = currentMonthData.projectedInterest - alreadyPaid;
      
      // New deposit gets prorated returns based on remaining days
      const prorationFactor = remainingDays / currentMonthData.daysInMonth;
      const newDepositTarget = depositAmount * currentMonthData.lockedRate * prorationFactor;
      
      console.log(`📊 Proration calculation: ${remainingDays}/${currentMonthData.daysInMonth} days = ${(prorationFactor * 100).toFixed(1)}%`);
      console.log(`💰 Original remaining target: $${originalRemainingTarget.toFixed(2)}`);
      console.log(`💰 New deposit target (prorated): $${newDepositTarget.toFixed(2)}`);
      
      // Total remaining target (original + prorated new deposit)
      const remainingInterest = originalRemainingTarget + newDepositTarget;
      const newMonthlyTarget = currentMonthData.projectedInterest + newDepositTarget;
      const newDailyPayout = remainingInterest / remainingDays;

      // Update daily payout schedule
      currentMonthData.dailyPayoutSchedule = {
        totalMonthlyTarget: newMonthlyTarget,
        dailyPayout: newDailyPayout,
        daysInMonth: currentMonthData.daysInMonth,
        alreadyPaid,
        remainingDays,
        remainingAmount: remainingInterest,
        lastUpdated: new Date().toISOString(),
        adjustedOnDay: dayOfMonth,
        adjustmentReason: `New deposit of $${depositAmount}`
      };

      // NEW: Regenerate daily volatility pattern for remaining days
      const existingWinRate = currentMonthData.dailyVolatility?.winRate || this.volatilityService.generateRandomWinRate();
      const newVolatilityPattern = this.volatilityService.regenerateRemainingDays({
        remainingDays,
        newTargetAmount: remainingInterest,
        newBalance: newBalance,
        existingWinRate
      });

      // Update the current month's volatility data
      currentMonthData.dailyVolatility = newVolatilityPattern;
      currentMonthData.tradeCount = this.tradeService.getTradeCount(newBalance); // Update trade count for new balance

      console.log(`🎲 Regenerated volatility: ${remainingDays} days, target $${remainingInterest.toFixed(2)}, ${newVolatilityPattern.winningDays} winning days`);

      // Update starting balance for current month
      currentMonthData.startingBalance = newBalance;
      currentMonthData.projectedInterest = newMonthlyTarget;
      currentMonthData.endingBalance = newBalance + newMonthlyTarget;

      // Recalculate future months with compound effect
      let runningBalance = newBalance + newMonthlyTarget;
      
      for (let i = monthIndex + 1; i < simulationPlan.months.length; i++) {
        const futureMonth = simulationPlan.months[i];
        const futureInterest = runningBalance * futureMonth.lockedRate;
        
        futureMonth.startingBalance = runningBalance;
        futureMonth.projectedInterest = futureInterest;
        futureMonth.endingBalance = runningBalance + futureInterest;
        
        // NEW: Regenerate volatility patterns for future months with new balances
        const futureVolatility = this.volatilityService.generateMonthlyVolatility({
          monthlyTargetAmount: futureInterest,
          daysInMonth: futureMonth.daysInMonth,
          startingBalance: runningBalance
        });
        
        futureMonth.dailyVolatility = futureVolatility;
        futureMonth.tradeCount = this.tradeService.getTradeCount(runningBalance);
        
        runningBalance += futureInterest;
      }

      // Update total deposited and projected return
      simulationPlan.totalDeposited += depositAmount;
      simulationPlan.totalProjectedReturn = simulationPlan.months.reduce(
        (sum, month) => sum + month.projectedInterest, 0
      );

      // Save updated simulation plan
      await this.saveSimulationPlan(simulationPlan);

      // Update user's deposited amount
      const user = await database.getUserById(userId);
      if (user) {
        await database.updateUser(userId, {
          depositedAmount: (user.depositedAmount || 0) + depositAmount
        });
      } else {
        console.warn(`⚠️ User ${userId} not found for deposited amount update`);
      }

      console.log(`✅ Mid-month deposit processed: Prorated target $${newDepositTarget.toFixed(2)} (${(prorationFactor * 100).toFixed(1)}% of full rate)`);
      console.log(`✅ New daily payout: $${newDailyPayout.toFixed(2)} for ${remainingDays} remaining days`);

      return {
        success: true,
        adjustedDailyPayout: newDailyPayout,
        remainingDays,
        newMonthlyTarget,
        prorationFactor,
        newDepositTarget,
        originalRemainingTarget,
        message: `Prorated deposit target: $${newDepositTarget.toFixed(2)} (${(prorationFactor * 100).toFixed(1)}% rate for ${remainingDays} days)`
      };

    } catch (error) {
      console.error('Error handling mid-month deposit:', error);
      throw error;
    }
  }

  /**
   * Process daily interest payout for a user using actual trading results
   * @param {string} userId - User ID
   * @param {string} date - Date to process (YYYY-MM-DD)
   * @returns {Object} Daily payout result
   */
  async processDailyPayout(userId, date = null) {
    try {
      if (!date) {
        date = new Date().toISOString().split('T')[0];
      }

      const simulationPlan = await this.getUserSimulation(userId);
      if (!simulationPlan) {
        return { success: false, message: 'No simulation found for user' };
      }

      const payoutDate = new Date(date);
      const monthToProcess = simulationPlan.months.find(m => 
        m.year === payoutDate.getFullYear() && 
        m.month === payoutDate.getMonth() + 1 && 
        m.status === 'active'
      );

      if (!monthToProcess) {
        return { success: false, message: 'No active month found for date' };
      }

      // 🛡️ PREVENT DOUBLE PAYMENTS: Check if already paid today
      if (monthToProcess.lastPayoutDate === date) {
        return { 
          success: false, 
          message: `Payment already processed for ${date}`,
          alreadyPaid: true 
        };
      }

      // 🎯 GET ACTUAL TRADING RESULTS for this date
      let actualPayout = monthToProcess.dailyPayoutSchedule.dailyPayout; // Default fallback
      let tradingDataFound = false;
      
      try {
        const dailyTrades = await this.getDailyTrades(userId, date);
        if (dailyTrades && dailyTrades.validation && dailyTrades.validation.expectedTotal !== undefined) {
          actualPayout = dailyTrades.validation.expectedTotal;  // Use exact target, not random result
          tradingDataFound = true;
          console.log(`📊 Using exact trading target for ${date}: $${actualPayout.toFixed(2)}`);
        } else {
          console.log(`⚠️ No trading data found for ${date}, using admin target: $${actualPayout.toFixed(2)}`);
        }
      } catch (tradingError) {
        console.log(`⚠️ Error getting trading data for ${date}, using admin target: $${actualPayout.toFixed(2)}`);
      }

      // 📊 UPDATE USER BALANCE with actual payout
      const user = await database.getUserById(userId);
      const newSimulatedInterest = (user.simulatedInterest || 0) + actualPayout;
      
      await database.updateUser(userId, {
        simulatedInterest: newSimulatedInterest,
        lastSimulationUpdate: new Date().toISOString()
      });

      // 📝 CREATE TRANSACTION RECORD
      await database.createTransaction({
        type: 'interest',
        amount: actualPayout,
        userId: userId,
        status: 'completed',
        description: tradingDataFound ? `Daily trading payout: ${date}` : `Daily compound interest: ${date}`,
        metadata: {
          simulationType: tradingDataFound ? 'trading_based' : 'compound_interest',
          date,
          monthlyRate: monthToProcess.lockedRate,
          isFirstMonth: monthToProcess.isFirstMonth,
          tradingDataFound
        }
      });

      // 📊 UPDATE TRACKING (keep admin tracking for financial planning)
      monthToProcess.actualInterestPaid += actualPayout;
      monthToProcess.dailyPayoutSchedule.alreadyPaid += monthToProcess.dailyPayoutSchedule.dailyPayout;
      monthToProcess.dailyPayoutSchedule.remainingAmount -= monthToProcess.dailyPayoutSchedule.dailyPayout;
      monthToProcess.dailyPayoutSchedule.remainingDays -= 1;
      monthToProcess.lastPayoutDate = date;

      await this.saveSimulationPlan(simulationPlan);

      const payoutType = tradingDataFound ? 'trading-based' : 'admin-target';
      console.log(`💰 Daily payout processed (${payoutType}): User ${userId}, $${actualPayout.toFixed(2)} on ${date}`);

      return {
        success: true,
        payoutAmount: actualPayout,
        payoutType,
        tradingDataFound,
        newBalance: user.balance + actualPayout,
        monthlyProgress: (monthToProcess.actualInterestPaid / monthToProcess.projectedInterest) * 100
      };

    } catch (error) {
      console.error('Error processing daily payout:', error);
      throw error;
    }
  }

  /**
   * Get user's current simulation status
   * @param {string} userId - User ID
   * @returns {Object} Simulation status
   */
  async getSimulationStatus(userId) {
    try {
      const simulationPlan = await this.getUserSimulation(userId);
      if (!simulationPlan) {
        return { hasSimulation: false, status: 'not_started' };
      }

      const today = new Date();
      const currentMonth = simulationPlan.months.find(m => m.status === 'active');
      
      let totalInterestEarned = 0;
      simulationPlan.months.forEach(month => {
        totalInterestEarned += month.actualInterestPaid || 0;
      });

      return {
        hasSimulation: true,
        status: 'active',
        startDate: simulationPlan.startDate,
        totalDeposited: simulationPlan.totalDeposited,
        totalProjectedReturn: simulationPlan.totalProjectedReturn,
        totalInterestEarned,
        currentMonth: currentMonth ? {
          monthNumber: currentMonth.monthNumber,
          monthName: currentMonth.monthName,
          lockedRate: currentMonth.lockedRate,
          dailyPayout: currentMonth.dailyPayoutSchedule?.dailyPayout || 0,
          progressPercentage: currentMonth.projectedInterest > 0 
            ? (currentMonth.actualInterestPaid / currentMonth.projectedInterest) * 100 
            : 0
        } : null
      };

    } catch (error) {
      console.error('Error getting simulation status:', error);
      return { hasSimulation: false, status: 'error', error: error.message };
    }
  }

  /**
   * Generate daily trades for a specific user and date
   * @param {string} userId - User ID
   * @param {string} date - Date to generate trades for (YYYY-MM-DD)
   * @returns {Object} Daily trade schedule
   */
  async generateDailyTrades(userId, date = null) {
    try {
      if (!date) {
        date = new Date().toISOString().split('T')[0];
      }

      console.log(`🎯 Generating daily trades for user ${userId} on ${date}`);

      // Get user data for proper capital management
      const user = await database.getUserById(userId);
      if (!user) {
        return { success: false, message: 'User not found' };
      }

      const simulationPlan = await this.getUserSimulation(userId);
      if (!simulationPlan) {
        return { success: false, message: 'No simulation found for user' };
      }

      const tradeDate = new Date(date);
      const currentMonth = simulationPlan.months.find(m => 
        m.year === tradeDate.getFullYear() && 
        m.month === tradeDate.getMonth() + 1 && 
        m.status === 'active'
      );

      if (!currentMonth) {
        return { success: false, message: 'No active month found for date' };
      }

      // Find the specific day in the volatility pattern
      const dayOfMonth = tradeDate.getDate();
      const dailyVolatilityData = currentMonth.dailyVolatility?.dailyPattern?.find(d => d.day === dayOfMonth);
      
      if (!dailyVolatilityData) {
        return { success: false, message: 'No volatility data found for this day' };
      }

      // 🎯 CAPITAL MANAGEMENT: Use user's actual deposited amount for realistic trade sizing
      const userDepositedAmount = user.depositedAmount || user.balance || currentMonth.startingBalance;
      
      console.log(`💰 Capital Management: User ${userId} has $${userDepositedAmount.toLocaleString()} deposited for trade sizing`);

      // Generate trades for this day
      const dailyTrades = this.tradeService.generateDailyTrades({
        dailyTargetAmount: dailyVolatilityData.targetAmount,
        accountBalance: userDepositedAmount, // Use actual deposited amount for capital management
        tradeCount: currentMonth.tradeCount,
        date: date
      });

      // Save trades to daily trades data file
      await this.saveDailyTrades(userId, date, dailyTrades);

      console.log(`✅ Generated ${dailyTrades.tradeCount} trades totaling $${dailyTrades.validation.actualTotal.toFixed(2)} for ${date}`);

      return {
        success: true,
        userId,
        date,
        dailyTrades,
        volatilityData: dailyVolatilityData,
        monthlyContext: {
          monthNumber: currentMonth.monthNumber,
          monthName: currentMonth.monthName,
          lockedRate: currentMonth.lockedRate
        }
      };

    } catch (error) {
      console.error('Error generating daily trades:', error);
      throw error;
    }
  }

  /**
   * Save daily trades to data file
   * @param {string} userId - User ID
   * @param {string} date - Date
   * @param {Object} dailyTrades - Daily trade data
   */
  async saveDailyTrades(userId, date, dailyTrades) {
    try {
      const dailyTradesFile = path.join(__dirname, '../data/daily_trades.json');
      const existingTrades = database.readFile(dailyTradesFile) || [];
      
      // Remove any existing trades for this user/date
      const filteredTrades = existingTrades.filter(trade => 
        !(trade.userId === userId && trade.date === date)
      );
      
      // Add new trades
      filteredTrades.push({
        userId,
        date,
        ...dailyTrades,
        savedAt: new Date().toISOString()
      });
      
      database.writeFile(dailyTradesFile, filteredTrades);
      console.log(`💾 Saved daily trades for user ${userId} on ${date}`);
      
    } catch (error) {
      console.error('Error saving daily trades:', error);
      throw error;
    }
  }

  /**
   * Get daily trades for a user on a specific date
   * @param {string} userId - User ID
   * @param {string} date - Date (YYYY-MM-DD)
   * @returns {Object|null} Daily trades data or null if not found
   */
  async getDailyTrades(userId, date) {
    try {
      const dailyTradesFile = path.join(__dirname, '../data/daily_trades.json');
      const existingTrades = database.readFile(dailyTradesFile) || [];
      
      const userTrades = existingTrades.find(trade => 
        trade.userId === userId && trade.date === date
      );
      
      if (userTrades) {
        console.log(`📊 Found daily trades for user ${userId} on ${date}: $${userTrades.validation?.actualTotal?.toFixed(2) || 'N/A'}`);
        return userTrades;
      } else {
        console.log(`❌ No daily trades found for user ${userId} on ${date}`);
        return null;
      }
      
    } catch (error) {
      console.error('Error retrieving daily trades:', error);
      throw error;
    }
  }

  /**
   * Get daily trades for a user and date
   * @param {string} userId - User ID
   * @param {string} date - Date (YYYY-MM-DD)
   * @returns {Object} Daily trades
   */
  async getDailyTrades(userId, date = null) {
    try {
      if (!date) {
        date = new Date().toISOString().split('T')[0];
      }
      
      const dailyTradesFile = path.join(__dirname, '../data/daily_trades.json');
      const allTrades = database.readFile(dailyTradesFile) || [];
      
      const userDayTrades = allTrades.find(trade => 
        trade.userId === userId && trade.date === date
      );
      
      return userDayTrades || null;
      
    } catch (error) {
      console.error('Error getting daily trades:', error);
      return null;
    }
  }



  // Database operations
  async saveSimulationPlan(simulationPlan) {
    try {
      const simulationPlans = database.readFile(path.join(__dirname, '../data/compound_simulations.json')) || [];
      
      // Remove any existing plan for this user
      const filteredPlans = simulationPlans.filter(plan => plan.userId !== simulationPlan.userId);
      
      // Add updated plan
      filteredPlans.push({
        ...simulationPlan,
        updatedAt: new Date().toISOString()
      });
      
      database.writeFile(path.join(__dirname, '../data/compound_simulations.json'), filteredPlans);
      console.log(`💾 Saved compound simulation plan for user ${simulationPlan.userId}`);
      
    } catch (error) {
      console.error('Error saving compound simulation plan:', error);
      throw error;
    }
  }

  async getUserSimulation(userId) {
    try {
      const simulationPlans = database.readFile(path.join(__dirname, '../data/compound_simulations.json')) || [];
      const plan = simulationPlans.find(plan => plan.userId === userId) || null;
      
      // 🔄 MIGRATION: Add lastPayoutDate if missing
      if (plan && plan.months) {
        let needsSave = false;
        plan.months.forEach(month => {
          if (month.lastPayoutDate === undefined) {
            month.lastPayoutDate = null;
            needsSave = true;
          }
        });
        
        if (needsSave) {
          console.log(`🔄 Migrating simulation for user ${userId} to add lastPayoutDate tracking`);
          await this.saveSimulationPlan(plan);
        }
      }
      
      return plan;
    } catch (error) {
      console.error('Error getting user compound simulation:', error);
      return null;
    }
  }
}

module.exports = CompoundInterestSimulation;