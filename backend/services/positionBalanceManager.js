const path = require('path');
const { v4: uuidv4 } = require('uuid');

/**
 * Position Balance Manager Service
 * Manages position-based balance system with capital locking
 * 
 * Key Features:
 * - Tracks available cash vs locked capital
 * - Opens/closes positions with real capital impact
 * - Supports multiple simultaneous positions
 * - Real-time portfolio value calculation
 * - Position history and analytics
 */
class PositionBalanceManager {
  constructor(database = null) {
    this.database = database;
    this.userPositionsFile = path.join(__dirname, '../data/user_positions.json');
    this.positionHistoryFile = path.join(__dirname, '../data/position_history.json');
    
    // Ensure data files exist
    this.ensureDataFiles();
  }

  /**
   * Ensure position data files exist
   */
  ensureDataFiles() {
    const fs = require('fs');
    
    if (!fs.existsSync(this.userPositionsFile)) {
      fs.writeFileSync(this.userPositionsFile, JSON.stringify([], null, 2));
    }
    
    if (!fs.existsSync(this.positionHistoryFile)) {
      fs.writeFileSync(this.positionHistoryFile, JSON.stringify([], null, 2));
    }
  }

  /**
   * Read data from JSON file
   * @param {string} filePath - File path
   * @returns {Array} Data array
   */
  readFile(filePath) {
    const fs = require('fs');
    try {
      if (fs.existsSync(filePath)) {
        const data = fs.readFileSync(filePath, 'utf8');
        return JSON.parse(data);
      }
      return [];
    } catch (error) {
      console.error(`Error reading file ${filePath}:`, error);
      return [];
    }
  }

  /**
   * Write data to JSON file
   * @param {string} filePath - File path
   * @param {Array} data - Data to write
   */
  writeFile(filePath, data) {
    const fs = require('fs');
    try {
      fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
    } catch (error) {
      console.error(`Error writing file ${filePath}:`, error);
    }
  }

  /**
   * Get user's portfolio data
   * @param {string} userId - User ID
   * @returns {Object} Portfolio data
   */
  async getUserPortfolio(userId) {
    try {
      const userPositions = this.readFile(this.userPositionsFile);
      let userPortfolio = userPositions.find(up => up.userId === userId);
      
      if (!userPortfolio) {
        // Initialize new user portfolio
        const user = this.database ? await this.database.getUserById(userId) : null;
        const startingBalance = user ? (user.balance || 0) : 10000;
        
        userPortfolio = {
          userId,
          availableBalance: startingBalance,
          openPositions: [],
          totalPortfolioValue: startingBalance,
          dayStartBalance: startingBalance,
          dailyPL: 0,
          lastUpdated: new Date().toISOString(),
          createdAt: new Date().toISOString()
        };
        
        userPositions.push(userPortfolio);
        this.writeFile(this.userPositionsFile, userPositions);
      }
      
      return userPortfolio;
    } catch (error) {
      console.error('Error getting user portfolio:', error);
      throw error;
    }
  }

  /**
   * Update user portfolio data
   * @param {string} userId - User ID
   * @param {Object} updates - Updates to apply
   * @returns {Object} Updated portfolio
   */
  async updateUserPortfolio(userId, updates) {
    try {
      const userPositions = this.readFile(this.userPositionsFile);
      const portfolioIndex = userPositions.findIndex(up => up.userId === userId);
      
      if (portfolioIndex === -1) {
        throw new Error(`Portfolio not found for user ${userId}`);
      }
      
      userPositions[portfolioIndex] = {
        ...userPositions[portfolioIndex],
        ...updates,
        lastUpdated: new Date().toISOString()
      };
      
      this.writeFile(this.userPositionsFile, userPositions);
      return userPositions[portfolioIndex];
    } catch (error) {
      console.error('Error updating user portfolio:', error);
      throw error;
    }
  }

  /**
   * Open a new position
   * @param {string} userId - User ID
   * @param {Object} positionData - Position details
   * @returns {Object} Result with position and updated balance
   */
  async openPosition(userId, positionData) {
    try {
      const {
        symbol,
        type, // 'long' or 'short'
        capitalLocked,
        expectedPL,
        tradeId,
        timestamp = new Date().toISOString()
      } = positionData;

      console.log(`🔓 Opening ${type.toUpperCase()} position: ${symbol} with $${capitalLocked.toFixed(2)} capital`);

      // Get current portfolio
      const portfolio = await this.getUserPortfolio(userId);

      // Check if sufficient available balance
      if (portfolio.availableBalance < capitalLocked) {
        throw new Error(`Insufficient balance: Available $${portfolio.availableBalance.toFixed(2)}, Required $${capitalLocked.toFixed(2)}`);
      }

      // Create new position
      const newPosition = {
        id: uuidv4(),
        tradeId: tradeId || uuidv4(),
        symbol,
        type,
        capitalLocked,
        expectedPL,
        currentPL: 0,
        openTime: timestamp,
        closeTime: null,
        status: 'open',
        positionValue: capitalLocked, // Initial value = locked capital
        lastUpdated: timestamp
      };

      // Update portfolio: reduce available balance, add position
      const updatedPortfolio = await this.updateUserPortfolio(userId, {
        availableBalance: portfolio.availableBalance - capitalLocked,
        openPositions: [...portfolio.openPositions, newPosition],
        totalPortfolioValue: portfolio.totalPortfolioValue // No change yet
      });

      // Record position history
      await this.recordPositionHistory(userId, {
        action: 'open',
        positionId: newPosition.id,
        symbol,
        type,
        capitalLocked,
        balanceBefore: portfolio.availableBalance,
        balanceAfter: updatedPortfolio.availableBalance,
        timestamp
      });

      console.log(`✅ Position opened: Available $${updatedPortfolio.availableBalance.toFixed(2)} | Locked $${capitalLocked.toFixed(2)}`);

      return {
        success: true,
        position: newPosition,
        portfolio: updatedPortfolio,
        message: `Opened ${type} position in ${symbol}`
      };

    } catch (error) {
      console.error('Error opening position:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Update position P&L (for real-time tracking)
   * @param {string} userId - User ID
   * @param {string} positionId - Position ID
   * @param {number} currentPL - Current profit/loss
   * @returns {Object} Updated portfolio
   */
  async updatePositionPL(userId, positionId, currentPL) {
    try {
      const portfolio = await this.getUserPortfolio(userId);
      const positionIndex = portfolio.openPositions.findIndex(p => p.id === positionId);
      
      if (positionIndex === -1) {
        throw new Error(`Position ${positionId} not found`);
      }

      // Update position P&L
      portfolio.openPositions[positionIndex].currentPL = currentPL;
      portfolio.openPositions[positionIndex].positionValue = portfolio.openPositions[positionIndex].capitalLocked + currentPL;
      portfolio.openPositions[positionIndex].lastUpdated = new Date().toISOString();

      // Recalculate total portfolio value
      const totalLockedCapital = portfolio.openPositions.reduce((sum, pos) => sum + pos.capitalLocked, 0);
      const totalCurrentPL = portfolio.openPositions.reduce((sum, pos) => sum + pos.currentPL, 0);
      const totalPortfolioValue = portfolio.availableBalance + totalLockedCapital + totalCurrentPL;

      // Update daily P&L
      const dailyPL = totalPortfolioValue - portfolio.dayStartBalance;

      return await this.updateUserPortfolio(userId, {
        openPositions: portfolio.openPositions,
        totalPortfolioValue,
        dailyPL
      });

    } catch (error) {
      console.error('Error updating position P&L:', error);
      throw error;
    }
  }

  /**
   * Close a position
   * @param {string} userId - User ID
   * @param {string} positionId - Position ID
   * @param {number} finalPL - Final profit/loss
   * @returns {Object} Result with updated balance
   */
  async closePosition(userId, positionId, finalPL) {
    try {
      console.log(`🔒 Closing position ${positionId} with P&L: ${finalPL >= 0 ? '+' : ''}$${finalPL.toFixed(2)}`);

      const portfolio = await this.getUserPortfolio(userId);
      const positionIndex = portfolio.openPositions.findIndex(p => p.id === positionId);
      
      if (positionIndex === -1) {
        throw new Error(`Position ${positionId} not found`);
      }

      const position = portfolio.openPositions[positionIndex];
      const capitalToReturn = position.capitalLocked + finalPL;

      // Update position as closed
      const closedPosition = {
        ...position,
        currentPL: finalPL,
        positionValue: capitalToReturn,
        closeTime: new Date().toISOString(),
        status: 'closed'
      };

      // Remove from open positions
      const remainingPositions = portfolio.openPositions.filter(p => p.id !== positionId);

      // Return capital + P&L to available balance
      const newAvailableBalance = portfolio.availableBalance + capitalToReturn;

      // Recalculate total portfolio value
      const totalLockedCapital = remainingPositions.reduce((sum, pos) => sum + pos.capitalLocked, 0);
      const totalCurrentPL = remainingPositions.reduce((sum, pos) => sum + pos.currentPL, 0);
      const totalPortfolioValue = newAvailableBalance + totalLockedCapital + totalCurrentPL;

      // Update daily P&L
      const dailyPL = totalPortfolioValue - portfolio.dayStartBalance;

      // Update portfolio
      const updatedPortfolio = await this.updateUserPortfolio(userId, {
        availableBalance: newAvailableBalance,
        openPositions: remainingPositions,
        totalPortfolioValue,
        dailyPL
      });

      // Record position history
      await this.recordPositionHistory(userId, {
        action: 'close',
        positionId: position.id,
        symbol: position.symbol,
        type: position.type,
        capitalLocked: position.capitalLocked,
        finalPL,
        balanceBefore: portfolio.availableBalance,
        balanceAfter: newAvailableBalance,
        timestamp: closedPosition.closeTime
      });

      console.log(`✅ Position closed: Available $${newAvailableBalance.toFixed(2)} | Total Portfolio $${totalPortfolioValue.toFixed(2)}`);

      return {
        success: true,
        closedPosition,
        portfolio: updatedPortfolio,
        capitalReturned: capitalToReturn,
        message: `Closed ${position.type} position in ${position.symbol} with ${finalPL >= 0 ? 'profit' : 'loss'} of $${Math.abs(finalPL).toFixed(2)}`
      };

    } catch (error) {
      console.error('Error closing position:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get available balance for user
   * @param {string} userId - User ID
   * @returns {number} Available balance
   */
  async getAvailableBalance(userId) {
    try {
      const portfolio = await this.getUserPortfolio(userId);
      return portfolio.availableBalance;
    } catch (error) {
      console.error('Error getting available balance:', error);
      return 0;
    }
  }

  /**
   * Get total portfolio value for user
   * @param {string} userId - User ID
   * @returns {number} Total portfolio value
   */
  async getTotalPortfolioValue(userId) {
    try {
      const portfolio = await this.getUserPortfolio(userId);
      return portfolio.totalPortfolioValue;
    } catch (error) {
      console.error('Error getting total portfolio value:', error);
      return 0;
    }
  }

  /**
   * Get open positions for user
   * @param {string} userId - User ID
   * @returns {Array} Open positions
   */
  async getOpenPositions(userId) {
    try {
      const portfolio = await this.getUserPortfolio(userId);
      return portfolio.openPositions;
    } catch (error) {
      console.error('Error getting open positions:', error);
      return [];
    }
  }

  /**
   * Get complete portfolio summary
   * @param {string} userId - User ID
   * @returns {Object} Complete portfolio summary
   */
  async getPortfolioSummary(userId) {
    try {
      const portfolio = await this.getUserPortfolio(userId);
      
      const totalLockedCapital = portfolio.openPositions.reduce((sum, pos) => sum + pos.capitalLocked, 0);
      const totalCurrentPL = portfolio.openPositions.reduce((sum, pos) => sum + pos.currentPL, 0);
      const utilizationPercent = portfolio.totalPortfolioValue > 0 ? (totalLockedCapital / portfolio.totalPortfolioValue) * 100 : 0;

      return {
        userId,
        availableBalance: portfolio.availableBalance,
        lockedCapital: totalLockedCapital,
        totalPortfolioValue: portfolio.totalPortfolioValue,
        dayStartBalance: portfolio.dayStartBalance,
        dailyPL: portfolio.dailyPL,
        dailyPLPercent: portfolio.dayStartBalance > 0 ? (portfolio.dailyPL / portfolio.dayStartBalance) * 100 : 0,
        openPositionsCount: portfolio.openPositions.length,
        openPositions: portfolio.openPositions,
        utilizationPercent,
        lastUpdated: portfolio.lastUpdated
      };
    } catch (error) {
      console.error('Error getting portfolio summary:', error);
      throw error;
    }
  }

  /**
   * Reset daily tracking (call at start of new day)
   * @param {string} userId - User ID
   * @returns {Object} Updated portfolio
   */
  async resetDailyTracking(userId) {
    try {
      const portfolio = await this.getUserPortfolio(userId);
      
      return await this.updateUserPortfolio(userId, {
        dayStartBalance: portfolio.totalPortfolioValue,
        dailyPL: 0
      });
    } catch (error) {
      console.error('Error resetting daily tracking:', error);
      throw error;
    }
  }

  /**
   * Record position history
   * @param {string} userId - User ID
   * @param {Object} historyData - History data
   */
  async recordPositionHistory(userId, historyData) {
    try {
      const history = this.readFile(this.positionHistoryFile);
      
      const historyRecord = {
        id: uuidv4(),
        userId,
        ...historyData,
        timestamp: historyData.timestamp || new Date().toISOString()
      };
      
      history.push(historyRecord);
      this.writeFile(this.positionHistoryFile, history);
    } catch (error) {
      console.error('Error recording position history:', error);
    }
  }

  /**
   * Get position history for user
   * @param {string} userId - User ID
   * @param {number} limit - Number of records to return
   * @returns {Array} Position history
   */
  async getPositionHistory(userId, limit = 50) {
    try {
      const history = this.readFile(this.positionHistoryFile);
      return history
        .filter(record => record.userId === userId)
        .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
        .slice(0, limit);
    } catch (error) {
      console.error('Error getting position history:', error);
      return [];
    }
  }

  /**
   * Get portfolio analytics
   * @param {string} userId - User ID
   * @returns {Object} Portfolio analytics
   */
  async getPortfolioAnalytics(userId) {
    try {
      const history = await this.getPositionHistory(userId, 100);
      const portfolio = await this.getUserPortfolio(userId);
      
      const closedPositions = history.filter(h => h.action === 'close');
      const totalTrades = closedPositions.length;
      const winningTrades = closedPositions.filter(h => h.finalPL > 0).length;
      const losingTrades = totalTrades - winningTrades;
      const winRate = totalTrades > 0 ? winningTrades / totalTrades : 0;
      
      const totalPL = closedPositions.reduce((sum, h) => sum + (h.finalPL || 0), 0);
      const avgTradeSize = totalTrades > 0 ? Math.abs(totalPL) / totalTrades : 0;
      
      return {
        portfolio: await this.getPortfolioSummary(userId),
        analytics: {
          totalTrades,
          winningTrades,
          losingTrades,
          winRate,
          totalPL,
          avgTradeSize,
          openPositions: portfolio.openPositions.length,
          currentUtilization: portfolio.openPositions.reduce((sum, pos) => sum + pos.capitalLocked, 0)
        }
      };
    } catch (error) {
      console.error('Error getting portfolio analytics:', error);
      throw error;
    }
  }
}

module.exports = PositionBalanceManager;