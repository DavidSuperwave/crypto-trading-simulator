const cron = require('node-cron');
// Note: interestService (real-time system) removed during migration to compound interest system

/**
 * Task Scheduler Service
 * Handles all scheduled tasks including daily interest payments
 */
class Scheduler {
  constructor() {
    this.tasks = new Map();
    this.isProduction = process.env.NODE_ENV === 'production';
  }

  /**
   * Initialize all scheduled tasks
   */
  init() {
    console.log('⏰ Initializing scheduler...');
    
    // Schedule daily interest at 12:01 AM
    this.scheduleTask(
      'daily-interest',
      '1 0 * * *', // Every day at 12:01 AM
      this.runDailyInterest.bind(this),
      'Daily interest payment processing'
    );

    // Schedule weekly cleanup at 2:00 AM on Sundays
    this.scheduleTask(
      'weekly-cleanup',
      '0 2 * * 0', // Every Sunday at 2:00 AM
      this.runWeeklyCleanup.bind(this),
      'Weekly database cleanup'
    );

    // Schedule daily payout processing between 1-3pm
    this.scheduleTask(
      'daily-payout',
      '0 13-15 * * *', // Random time between 1-3pm
      this.runDailyPayouts.bind(this),
      'Daily payout processing (1-3pm)'
    );

    // For development: run payouts every 5 minutes for testing
    if (!this.isProduction) {
      console.log('🧪 Development mode: Payouts will run every 5 minutes for testing');
      this.scheduleTask(
        'dev-payouts',
        '*/5 * * * *', // Every 5 minutes
        this.runDailyPayouts.bind(this),
        'Development payout testing'
      );
    }

    console.log('✅ Scheduler initialized with', this.tasks.size, 'tasks');
  }

  /**
   * Schedule a new task
   * @param {string} name Task name
   * @param {string} cronPattern Cron pattern
   * @param {Function} task Task function
   * @param {string} description Task description
   */
  scheduleTask(name, cronPattern, task, description) {
    try {
      const scheduledTask = cron.schedule(cronPattern, async () => {
        console.log(`🚀 Running scheduled task: ${name}`);
        const startTime = new Date();
        
        try {
          const result = await task();
          const endTime = new Date();
          const duration = endTime - startTime;
          
          // Update task tracking info
          if (this.tasks.has(name)) {
            const taskInfo = this.tasks.get(name);
            taskInfo.lastRun = endTime.toISOString();
            taskInfo.lastDuration = duration;
            taskInfo.lastResult = 'success';
            taskInfo.lastError = null;
          }
          
          console.log(`✅ Completed task: ${name} (${duration}ms)`);
          return result;
        } catch (error) {
          const endTime = new Date();
          
          // Update error tracking info
          if (this.tasks.has(name)) {
            const taskInfo = this.tasks.get(name);
            taskInfo.lastRun = endTime.toISOString();
            taskInfo.lastError = error.message;
            taskInfo.lastResult = 'error';
          }
          
          console.error(`❌ Error in scheduled task ${name}:`, error);
          throw error;
        }
      }, {
        scheduled: true,
        timezone: "America/New_York" // Adjust timezone as needed
      });

      this.tasks.set(name, {
        task: scheduledTask,
        cronPattern: cronPattern,
        description,
        lastRun: null,
        lastDuration: null,
        lastResult: null,
        lastError: null,
        createdAt: new Date().toISOString()
      });

      console.log(`📅 Scheduled: ${name} - ${description} (${cronPattern})`);
    } catch (error) {
      console.error(`❌ Failed to schedule task ${name}:`, error);
    }
  }

  /**
   * Run daily payouts (simplified from complex trading system)
   * Processes daily payouts for all users between 1-3pm
   */
  async runDailyPayouts() {
    try {
      console.log('💰 Starting scheduled daily payout processing...');
      
      const CompoundInterestSimulation = require('./compoundInterestSimulation');
      const compoundSim = new CompoundInterestSimulation();
      const database = require('../database');
      
      const today = new Date().toISOString().split('T')[0];
      const users = await database.getAllUsers();
      
      const results = {
        date: today,
        processedUsers: 0,
        totalPayouts: 0,
        errors: [],
        userResults: []
      };

      // Find users with active compound interest simulations
      for (const user of users) {
        try {
          if (user.role !== 'user' && !(user.role === 'admin' && user.depositedAmount)) {
            continue;
          }

          const simulationStatus = await compoundSim.getSimulationStatus(user.id);
          
          if (simulationStatus.hasSimulation && simulationStatus.status === 'active') {
            console.log(`💳 Processing daily payout for ${user.email}...`);
            
            const payoutResult = await compoundSim.processDailyPayout(user.id);
            
            if (payoutResult.success) {
              results.processedUsers++;
              results.totalPayouts += payoutResult.amount;
              results.userResults.push({
                userId: user.id,
                email: user.email,
                payoutAmount: payoutResult.amount,
                totalPaid: payoutResult.totalPaid,
                remainingTarget: payoutResult.remainingTarget
              });
              
              console.log(`✅ Payout processed: ${user.email} - $${payoutResult.amount}`);
            } else {
              console.log(`ℹ️ No payout needed: ${user.email} - ${payoutResult.message}`);
            }
          }
        } catch (error) {
          console.error(`❌ Error processing payout for user ${user.id}:`, error);
          results.errors.push({
            userId: user.id,
            email: user.email || 'unknown',
            error: error.message
          });
        }
      }
      
      console.log(`✅ Daily payout processing completed: ${results.processedUsers} users, $${results.totalPayouts.toFixed(2)} total`);
      return results;
    } catch (error) {
      console.error('❌ Daily payout processing failed:', error);
      throw error;
    }
  }

  /**
   * Run daily interest processing (legacy - kept for compatibility)
   * Now uses only compound interest system (real-time system removed)
   */
  async runDailyInterest() {
    try {
      console.log('💰 Starting scheduled daily interest processing...');
      
      // 🎯 MIGRATION: Use only compound interest system
      console.log('🏦 Processing compound interest daily payouts...');
      const compoundResults = await this.processCompoundInterestDaily();
      
      const results = {
        compound: compoundResults,
        totalProcessed: compoundResults.processedUsers || 0,
        totalEarnings: compoundResults.totalEarnings || 0,
        migrationComplete: true // Indicates real-time system was removed
      };
      
      // Update last run time
      if (this.tasks.has('daily-interest')) {
        this.tasks.get('daily-interest').lastRun = new Date().toISOString();
      }

      console.log('✅ Scheduled interest processing completed:', results);
      return results;
    } catch (error) {
      console.error('❌ Scheduled interest processing failed:', error);
      throw error;
    }
  }

  /**
   * Process compound interest daily payouts for all users
   */
  async processCompoundInterestDaily() {
    try {
      const CompoundInterestSimulation = require('./compoundInterestSimulation');
      const compoundSim = new CompoundInterestSimulation();
      const database = require('../database');
      
      console.log('🏦 Processing compound interest daily payouts...');
      
      const today = new Date().toISOString().split('T')[0];
      const users = await database.getAllUsers();
      
      const results = {
        date: today,
        processedUsers: 0,
        totalEarnings: 0,
        errors: [],
        userResults: []
      };

      // Find users with active compound interest simulations
      for (const user of users) {
        try {
          if (user.role !== 'user' && !(user.role === 'admin' && user.depositedAmount)) {
            continue;
          }

          const simulationStatus = await compoundSim.getSimulationStatus(user.id);
          
          if (simulationStatus.hasSimulation && simulationStatus.status === 'active') {
            console.log(`🎯 Processing compound interest for ${user.email}...`);
            
            // Step 1: Generate daily trades based on volatility pattern
            const tradesResult = await compoundSim.generateDailyTrades(user.id, today);
            
            // Step 2: Process daily payout (existing functionality)
            const payoutResult = await compoundSim.processDailyPayout(user.id, today);
            
            if (payoutResult.success) {
              results.processedUsers++;
              results.totalEarnings += payoutResult.payoutAmount;
              results.userResults.push({
                userId: user.id,
                email: user.email,
                payoutAmount: payoutResult.payoutAmount,
                newBalance: payoutResult.newBalance,
                monthlyProgress: payoutResult.monthlyProgress,
                // NEW: Add trade information
                tradesGenerated: tradesResult.success ? tradesResult.dailyTrades.tradeCount : 0,
                dailyVolatility: tradesResult.success ? tradesResult.volatilityData : null,
                tradesSummary: tradesResult.success ? tradesResult.dailyTrades.summary : null
              });
              
              const tradeInfo = tradesResult.success ? `, ${tradesResult.dailyTrades.tradeCount} trades` : ', no trades';
              console.log(`✅ ${user.email}: $${payoutResult.payoutAmount.toFixed(2)} compound interest${tradeInfo}`);
            }
          }
        } catch (error) {
          console.error(`❌ Error processing compound interest for ${user.email}:`, error);
          results.errors.push({
            userId: user.id,
            email: user.email,
            error: error.message
          });
        }
      }

      console.log(`🎉 Compound interest processing complete: ${results.processedUsers} users, $${results.totalEarnings.toFixed(2)} total payouts`);
      return results;

    } catch (error) {
      console.error('❌ Error in compound interest daily processing:', error);
      throw error;
    }
  }

  /**
   * Run weekly cleanup tasks
   */
  async runWeeklyCleanup() {
    try {
      console.log('🧹 Starting weekly cleanup...');
      
      // Add cleanup tasks here:
      // - Clean old logs
      // - Archive old transactions
      // - Optimize database
      
      console.log('✅ Weekly cleanup completed');
    } catch (error) {
      console.error('❌ Weekly cleanup failed:', error);
    }
  }

  /**
   * Get next run time for a cron pattern (simplified)
   * @param {string} cronPattern Cron pattern
   * @returns {string} Next run time
   */
  getNextRun(cronPattern) {
    // This is a simplified version - in production use a proper cron parser
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 1, 0, 0); // 12:01 AM tomorrow
    
    return tomorrow.toISOString();
  }

  /**
   * Get all scheduled tasks info
   * @returns {Array} Tasks information
   */
  getTasksInfo() {
    const tasksInfo = [];
    
    for (const [name, taskInfo] of this.tasks) {
      tasksInfo.push({
        name,
        description: taskInfo.description,
        pattern: taskInfo.pattern,
        lastRun: taskInfo.lastRun,
        nextRun: taskInfo.nextRun,
        isRunning: taskInfo.task.getStatus() === 'scheduled'
      });
    }
    
    return tasksInfo;
  }

  /**
   * Manually trigger a task (for admin use)
   * @param {string} taskName Task name
   * @returns {Object} Task result
   */
  async triggerTask(taskName) {
    console.log(`🔧 Manually triggering task: ${taskName}`);
    
    switch (taskName) {
      case 'daily-interest':
        return await this.runDailyInterest();
      case 'compound-interest':
        return await this.processCompoundInterestDaily();
      case 'weekly-cleanup':
        return await this.runWeeklyCleanup();
      default:
        throw new Error(`Unknown task: ${taskName}`);
    }
  }

  /**
   * Stop all scheduled tasks
   */
  stopAll() {
    console.log('🛑 Stopping all scheduled tasks...');
    
    for (const [name, taskInfo] of this.tasks) {
      taskInfo.task.stop();
      console.log(`🛑 Stopped task: ${name}`);
    }
    
    this.tasks.clear();
    console.log('✅ All tasks stopped');
  }

  /**
   * Start all scheduled tasks
   */
  startAll() {
    console.log('▶️ Starting all scheduled tasks...');
    
    for (const [name, taskInfo] of this.tasks) {
      taskInfo.task.start();
      console.log(`▶️ Started task: ${name}`);
    }
    
    console.log('✅ All tasks started');
  }

  /**
   * Get status of all scheduled tasks
   * @returns {Object} Task status information
   */
  getTaskStatus() {
    const status = {};
    
    for (const [name, taskInfo] of this.tasks) {
      status[name] = {
        description: taskInfo.description,
        cronPattern: taskInfo.cronPattern,
        isRunning: taskInfo.task ? true : false,
        lastRun: taskInfo.lastRun || null,
        nextRun: this.getNextRunTime(taskInfo.cronPattern),
        createdAt: taskInfo.createdAt
      };
    }
    
    return status;
  }

  /**
   * Get next run time for a cron pattern
   * @param {string} cronPattern - Cron pattern
   * @returns {string|null} Next run time or null
   */
  getNextRunTime(cronPattern) {
    try {
      // This is a simplified implementation
      // For production, consider using a more robust cron parser
      const now = new Date();
      
      if (cronPattern === '1 0 * * *') {
        // Daily at 12:01 AM
        const tomorrow = new Date(now);
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(0, 1, 0, 0);
        return tomorrow.toISOString();
      } else if (cronPattern === '0 2 * * 0') {
        // Weekly cleanup - next Sunday at 2 AM
        const nextSunday = new Date(now);
        const daysUntilSunday = (7 - now.getDay()) % 7;
        nextSunday.setDate(now.getDate() + (daysUntilSunday === 0 ? 7 : daysUntilSunday));
        nextSunday.setHours(2, 0, 0, 0);
        return nextSunday.toISOString();
      } else if (cronPattern === '*/5 * * * *') {
        // Every 5 minutes (dev mode)
        const nextRun = new Date(now);
        nextRun.setMinutes(Math.ceil(now.getMinutes() / 5) * 5, 0, 0);
        return nextRun.toISOString();
      }
      
      return null;
    } catch (error) {
      console.error('Error calculating next run time:', error);
      return null;
    }
  }

  /**
   * Get overall scheduler health
   * @returns {Object} Health status
   */
  getHealth() {
    const taskStatus = this.getTaskStatus();
    const taskCount = Object.keys(taskStatus).length;
    const runningTasks = Object.values(taskStatus).filter(task => task.isRunning).length;
    
    return {
      status: runningTasks === taskCount ? 'healthy' : 'degraded',
      totalTasks: taskCount,
      runningTasks: runningTasks,
      isProduction: this.isProduction,
      uptime: process.uptime(),
      tasks: taskStatus
    };
  }
}

module.exports = new Scheduler();