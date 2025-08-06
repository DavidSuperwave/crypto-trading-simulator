const database = require('../database');

/**
 * Interest Generation Service
 * Generates random daily interest for all users with positive balances
 */
class InterestService {
  constructor() {
    this.minRate = 0.001; // 0.1% daily minimum
    this.maxRate = 0.025; // 2.5% daily maximum
    this.minBalance = 100; // Minimum balance to earn interest
  }

  /**
   * Generate random interest rate between min and max
   * @returns {number} Interest rate as decimal (e.g., 0.015 for 1.5%)
   */
  generateRandomRate() {
    return Math.random() * (this.maxRate - this.minRate) + this.minRate;
  }

  /**
   * Process daily interest for all eligible users
   * @returns {Object} Summary of interest payments
   */
  async processDailyInterest() {
    try {
      console.log('🏦 Starting daily interest processing...');
      
      const users = await database.getAllUsers();
      const eligibleUsers = users.filter(user => 
        user.role === 'user' && 
        user.balance >= this.minBalance
      );

      const results = {
        processed: 0,
        totalInterest: 0,
        payments: [],
        errors: []
      };

      for (const user of eligibleUsers) {
        try {
          const interestRate = this.generateRandomRate();
          const interestAmount = user.balance * interestRate;
          const newBalance = user.balance + interestAmount;

          // Update user balance
          await database.updateUser(user.id, { balance: newBalance });

          // Record interest payment
          const interestPayment = {
            id: require('uuid').v4(),
            userId: user.id,
            userEmail: user.email,
            amount: interestAmount,
            rate: interestRate,
            period: 'daily',
            originalBalance: user.balance,
            newBalance: newBalance,
            createdAt: new Date().toISOString()
          };

          // Save interest payment record
          await this.saveInterestPayment(interestPayment);

          // Create transaction record
          await database.createTransaction({
            type: 'interest',
            amount: interestAmount,
            userId: user.id,
            status: 'completed',
            description: `Daily interest: ${(interestRate * 100).toFixed(2)}%`
          });

          // Send notification to user via chat
          await this.notifyUser(user, interestPayment);

          results.processed++;
          results.totalInterest += interestAmount;
          results.payments.push(interestPayment);

          console.log(`✅ ${user.email}: $${interestAmount.toFixed(2)} (${(interestRate * 100).toFixed(2)}%)`);

        } catch (error) {
          console.error(`❌ Error processing interest for ${user.email}:`, error);
          results.errors.push({
            userId: user.id,
            email: user.email,
            error: error.message
          });
        }
      }

      console.log(`🎉 Interest processing complete!`);
      console.log(`📊 Users processed: ${results.processed}`);
      console.log(`💰 Total interest paid: $${results.totalInterest.toFixed(2)}`);
      console.log(`❌ Errors: ${results.errors.length}`);

      return results;

    } catch (error) {
      console.error('❌ Fatal error in interest processing:', error);
      throw error;
    }
  }

  /**
   * Save interest payment to database
   * @param {Object} interestPayment Interest payment data
   */
  async saveInterestPayment(interestPayment) {
    try {
      // Create interest payment record directly in database
      // Note: This will be handled by the transaction record above
      // Keeping this method for compatibility but simplified
      console.log(`💰 Interest payment recorded: $${interestPayment.amount.toFixed(2)}`);
    } catch (error) {
      console.error('Error saving interest payment:', error);
    }
  }

  /**
   * Send interest notification to user via chat
   * @param {Object} user User object
   * @param {Object} interestPayment Interest payment data
   */
  async notifyUser(user, interestPayment) {
    try {
      const message = `🎉 Great news! You've earned $${interestPayment.amount.toFixed(2)} in daily interest (${(interestPayment.rate * 100).toFixed(2)}%). Your new balance is $${interestPayment.newBalance.toFixed(2)}. Keep investing to earn more!`;

      await database.createChatMessage({
        senderId: 'system',
        senderType: 'admin',
        senderName: 'Altura Capital System',
        recipientUserId: user.id,
        recipientType: 'user',
        message: message,
        timestamp: new Date(),
        isRead: false
      });

      console.log(`📨 Notification sent to ${user.email}`);
    } catch (error) {
      console.error(`Error sending notification to ${user.email}:`, error);
    }
  }

  /**
   * Get interest payment history for a user
   * @param {string} userId User ID
   * @returns {Array} Interest payment history
   */
  async getUserInterestHistory(userId) {
    try {
      const transactions = await database.getAllTransactions();
      return transactions.filter(transaction => 
        transaction.type === 'interest' && 
        transaction.userId === userId
      );
    } catch (error) {
      console.error('Error getting user interest history:', error);
      return [];
    }
  }

  /**
   * Get all interest payments (admin view)
   * @returns {Array} All interest payments
   */
  async getAllInterestPayments() {
    try {
      const transactions = await database.getAllTransactions();
      return transactions.filter(transaction => transaction.type === 'interest');
    } catch (error) {
      console.error('Error getting all interest payments:', error);
      return [];
    }
  }

  /**
   * Get interest statistics
   * @returns {Object} Interest statistics
   */
  getInterestStats() {
    try {
      const payments = this.getAllInterestPayments();
      const today = new Date().toISOString().split('T')[0];
      const todayPayments = payments.filter(p => 
        p.createdAt.startsWith(today)
      );

      return {
        totalPayments: payments.length,
        totalAmount: payments.reduce((sum, p) => sum + p.amount, 0),
        todayPayments: todayPayments.length,
        todayAmount: todayPayments.reduce((sum, p) => sum + p.amount, 0),
        averageRate: payments.reduce((sum, p) => sum + p.rate, 0) / payments.length,
        lastRun: payments.length > 0 ? payments[payments.length - 1].createdAt : null
      };
    } catch (error) {
      console.error('Error getting interest stats:', error);
      return {
        totalPayments: 0,
        totalAmount: 0,
        todayPayments: 0,
        todayAmount: 0,
        averageRate: 0,
        lastRun: null
      };
    }
  }

  /**
   * Manual trigger for testing (admin only)
   * @returns {Object} Processing results
   */
  async triggerManualInterest() {
    console.log('🔧 Manual interest trigger activated by admin');
    return await this.processDailyInterest();
  }
}

module.exports = new InterestService();