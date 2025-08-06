const cron = require('node-cron');
const interestService = require('./interestService');

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

    // For development: run interest every 5 minutes for testing
    if (!this.isProduction) {
      console.log('🧪 Development mode: Interest will run every 5 minutes for testing');
      this.scheduleTask(
        'dev-interest',
        '*/5 * * * *', // Every 5 minutes
        this.runDailyInterest.bind(this),
        'Development interest testing'
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
        try {
          await task();
          console.log(`✅ Completed task: ${name}`);
        } catch (error) {
          console.error(`❌ Error in scheduled task ${name}:`, error);
        }
      }, {
        scheduled: true,
        timezone: "America/New_York" // Adjust timezone as needed
      });

      this.tasks.set(name, {
        task: scheduledTask,
        pattern: cronPattern,
        description,
        lastRun: null,
        nextRun: this.getNextRun(cronPattern)
      });

      console.log(`📅 Scheduled: ${name} - ${description} (${cronPattern})`);
    } catch (error) {
      console.error(`❌ Failed to schedule task ${name}:`, error);
    }
  }

  /**
   * Run daily interest processing
   */
  async runDailyInterest() {
    try {
      console.log('💰 Starting scheduled daily interest processing...');
      const results = await interestService.processDailyInterest();
      
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
}

module.exports = new Scheduler();