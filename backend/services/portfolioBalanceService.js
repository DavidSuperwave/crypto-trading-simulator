const database = require('../database');

/**
 * Simplified Portfolio Balance Service for Daily Payout System
 * Calculates portfolio value based on deposits + daily payouts - withdrawals
 */
class PortfolioBalanceService {
  constructor() {
    this.cache = new Map();
    this.cacheTimeout = 60000; // 1 minute cache
    this.CompoundInterestSimulation = require('./compoundInterestSimulation');
    this.compoundSim = new this.CompoundInterestSimulation();
  }

  /**
   * Get simplified portfolio summary for user
   * @param {string} userId - User ID
   * @returns {Promise<Object>} Portfolio summary
   */
  async getPortfolioSummary(userId) {
    try {
      const cacheKey = `portfolio_${userId}`;
      const cached = this.cache.get(cacheKey);
      
      if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
        return cached.data;
      }

      // Get user data
      const user = await database.getUserById(userId);
      if (!user) {
        throw new Error('User not found');
      }

      // Get compound interest simulation
      const simulation = await this.compoundSim.getUserSimulation(userId);
      
      if (!simulation) {
        return {
          totalPortfolioValue: user.depositedAmount || 0,
          cashBalance: user.depositedAmount || 0,
          totalDeposits: user.depositedAmount || 0,
          totalPayouts: 0,
          totalWithdrawals: 0,
          monthlyProgress: null
        };
      }

      // Get current active month
      const currentMonth = simulation.months.find(m => m.status === 'active');
      const totalDeposits = user.depositedAmount || 0;
      const totalPayouts = currentMonth ? (currentMonth.totalPaid || 0) : 0;
      const totalWithdrawals = 0; // TODO: Add withdrawal tracking
      const totalPortfolioValue = totalDeposits + totalPayouts - totalWithdrawals;

      const portfolioSummary = {
        totalPortfolioValue,
        cashBalance: totalPortfolioValue,
        totalDeposits,
        totalPayouts,
        totalWithdrawals,
        monthlyProgress: currentMonth ? {
          currentMonth: currentMonth.monthNumber,
          monthName: currentMonth.monthName,
          totalTarget: currentMonth.projectedInterest,
          totalPaid: currentMonth.totalPaid || 0,
          remainingTarget: currentMonth.remainingTarget || currentMonth.projectedInterest
        } : null
      };

      // Cache result
      this.cache.set(cacheKey, { timestamp: Date.now(), data: portfolioSummary });

      return portfolioSummary;
    } catch (error) {
      console.error('Error getting portfolio summary:', error);
      return {
        totalPortfolioValue: 0,
        cashBalance: 0,
        totalDeposits: 0,
        totalPayouts: 0,
        totalWithdrawals: 0,
        monthlyProgress: null
      };
    }
  }

  /**
   * Calculate current portfolio state (simplified)
   * @param {string} userId - User ID
   * @returns {Object} Portfolio state
   */
  async calculatePortfolioState(userId) {
    try {
      const summary = await this.getPortfolioSummary(userId);
      
      return {
        totalPortfolioValue: summary.totalPortfolioValue,
        cashBalance: summary.cashBalance,
        investedAmount: summary.totalDeposits,
        unrealizedPL: 0, // No longer applicable
        realizedPL: summary.totalPayouts,
        openPositions: [], // No longer applicable
        startOfDayBalance: summary.totalPortfolioValue,
        todaysChange: 0, // Would need daily tracking
        todaysChangePercent: '0.00'
      };
    } catch (error) {
      console.error('Error calculating portfolio state:', error);
      return this.getEmptyPortfolioState();
    }
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
   * Get current month progress from simulation
   */
  async getCurrentMonthProgress(userId) {
    try {
      const simulation = await this.compoundSim.getUserSimulation(userId);
      if (!simulation) return null;

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
        earnedInterest: currentMonth.totalPaid || 0
      };
    } catch (error) {
      console.error('Error getting month progress:', error);
      return null;
    }
  }

  /**
   * Clear cache for user
   */
  clearCache(userId) {
    const cacheKey = `portfolio_${userId}`;
    this.cache.delete(cacheKey);
  }
}

module.exports = PortfolioBalanceService;