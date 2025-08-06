/**
 * Environment-aware database module
 * Uses PostgreSQL in production, JSON files in development
 */

require('dotenv').config();
const PostgreSQLDatabase = require('./database-pg');

// Import existing JSON-based database for development fallback
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const DATA_DIR = path.join(__dirname, 'data');
const USERS_FILE = path.join(DATA_DIR, 'users.json');
const TRANSACTIONS_FILE = path.join(DATA_DIR, 'transactions.json');
const WITHDRAWALS_FILE = path.join(DATA_DIR, 'withdrawals.json');
const DEMOS_FILE = path.join(DATA_DIR, 'demos.json');
const PENDING_DEPOSITS_FILE = path.join(DATA_DIR, 'pending_deposits.json');
const CHAT_FILE = path.join(DATA_DIR, 'chat.json');
const INTEREST_PAYMENTS_FILE = path.join(DATA_DIR, 'interest_payments.json');

class DatabaseManager {
  constructor() {
    this.usePostgreSQL = process.env.NODE_ENV === 'production' || process.env.DATABASE_URL || process.env.POSTGRES_URL;
    
    if (this.usePostgreSQL) {
      console.log('🐘 Using PostgreSQL database');
      this.db = new PostgreSQLDatabase();
    } else {
      console.log('📁 Using JSON file database (development mode)');
      this.ensureDataDirectory();
      this.db = this; // Use JSON methods from this class
    }
  }

  // Environment detection
  isPostgreSQL() {
    return this.usePostgreSQL;
  }

  // JSON file utility methods (for development)
  ensureDataDirectory() {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
  }

  readFile(filePath) {
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

  writeFile(filePath, data) {
    try {
      fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
    } catch (error) {
      console.error(`Error writing file ${filePath}:`, error);
    }
  }

  // Unified API methods - these work for both PostgreSQL and JSON
  
  // User operations
  async getAllUsers() {
    if (this.usePostgreSQL) {
      return await this.db.getAllUsers();
    } else {
      return this.readFile(USERS_FILE);
    }
  }

  async createUser(userData) {
    if (this.usePostgreSQL) {
      return await this.db.createUser(userData);
    } else {
      const users = this.readFile(USERS_FILE);
      const newUser = {
        id: uuidv4(),
        email: userData.email,
        password: userData.password,
        role: userData.role || 'user',
        balance: userData.balance || 0,
        totalInterest: userData.totalInterest || 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        ...userData
      };
      users.push(newUser);
      this.writeFile(USERS_FILE, users);
      return newUser;
    }
  }

  async getUserById(id) {
    if (this.usePostgreSQL) {
      return await this.db.getUserById(id);
    } else {
      const users = this.readFile(USERS_FILE);
      return users.find(user => user.id === id);
    }
  }

  async getUserByEmail(email) {
    if (this.usePostgreSQL) {
      return await this.db.getUserByEmail(email);
    } else {
      const users = this.readFile(USERS_FILE);
      return users.find(user => user.email === email);
    }
  }

  async updateUser(id, updates) {
    if (this.usePostgreSQL) {
      return await this.db.updateUser(id, updates);
    } else {
      const users = this.readFile(USERS_FILE);
      const userIndex = users.findIndex(user => user.id === id);
      if (userIndex !== -1) {
        users[userIndex] = { ...users[userIndex], ...updates, updatedAt: new Date().toISOString() };
        this.writeFile(USERS_FILE, users);
        return users[userIndex];
      }
      return null;
    }
  }

  async deleteUser(id) {
    if (this.usePostgreSQL) {
      return await this.db.deleteUser(id);
    } else {
      const users = this.readFile(USERS_FILE);
      const userIndex = users.findIndex(user => user.id === id);
      if (userIndex !== -1) {
        const deletedUser = users[userIndex];
        users.splice(userIndex, 1);
        this.writeFile(USERS_FILE, users);
        return deletedUser;
      }
      return null;
    }
  }

  // Transaction operations
  async getAllTransactions() {
    if (this.usePostgreSQL) {
      return await this.db.getAllTransactions();
    } else {
      return this.readFile(TRANSACTIONS_FILE);
    }
  }

  async createTransaction(transactionData) {
    if (this.usePostgreSQL) {
      return await this.db.createTransaction(transactionData);
    } else {
      const transactions = this.readFile(TRANSACTIONS_FILE);
      const newTransaction = {
        id: uuidv4(),
        type: transactionData.type,
        amount: transactionData.amount,
        userId: transactionData.userId,
        status: transactionData.status || 'pending',
        description: transactionData.description,
        createdAt: new Date().toISOString(),
        ...transactionData
      };
      transactions.push(newTransaction);
      this.writeFile(TRANSACTIONS_FILE, transactions);
      return newTransaction;
    }
  }

  // Withdrawal operations
  async getAllWithdrawals() {
    if (this.usePostgreSQL) {
      return await this.db.getAllWithdrawals();
    } else {
      return this.readFile(WITHDRAWALS_FILE);
    }
  }

  async createWithdrawal(withdrawalData) {
    if (this.usePostgreSQL) {
      return await this.db.createWithdrawal(withdrawalData);
    } else {
      const withdrawals = this.readFile(WITHDRAWALS_FILE);
      const newWithdrawal = {
        id: uuidv4(),
        userId: withdrawalData.userId,
        amount: withdrawalData.amount,
        method: withdrawalData.method || 'bank',
        status: withdrawalData.status || 'pending',
        createdAt: new Date().toISOString(),
        ...withdrawalData
      };
      withdrawals.push(newWithdrawal);
      this.writeFile(WITHDRAWALS_FILE, withdrawals);
      return newWithdrawal;
    }
  }

  async getWithdrawalById(id) {
    if (this.usePostgreSQL) {
      return await this.db.getWithdrawalById(id);
    } else {
      const withdrawals = this.readFile(WITHDRAWALS_FILE);
      return withdrawals.find(w => w.id === id);
    }
  }

  async updateWithdrawal(id, updates) {
    if (this.usePostgreSQL) {
      return await this.db.updateWithdrawal(id, updates);
    } else {
      const withdrawals = this.readFile(WITHDRAWALS_FILE);
      const withdrawalIndex = withdrawals.findIndex(w => w.id === id);
      if (withdrawalIndex !== -1) {
        withdrawals[withdrawalIndex] = { ...withdrawals[withdrawalIndex], ...updates, updatedAt: new Date().toISOString() };
        this.writeFile(WITHDRAWALS_FILE, withdrawals);
        return withdrawals[withdrawalIndex];
      }
      return null;
    }
  }

  // Demo operations
  async getAllDemos() {
    if (this.usePostgreSQL) {
      return await this.db.getAllDemos();
    } else {
      return this.readFile(DEMOS_FILE);
    }
  }

  async createDemo(demoData) {
    if (this.usePostgreSQL) {
      return await this.db.createDemo(demoData);
    } else {
      const demos = this.readFile(DEMOS_FILE);
      const newDemo = {
        id: uuidv4(),
        name: demoData.name,
        email: demoData.email,
        company: demoData.company || '',
        phone: demoData.phone || '',
        message: demoData.message || '',
        status: demoData.status || 'requested',
        createdAt: new Date().toISOString(),
        ...demoData
      };
      demos.push(newDemo);
      this.writeFile(DEMOS_FILE, demos);
      return newDemo;
    }
  }

  async updateDemo(id, updates) {
    if (this.usePostgreSQL) {
      return await this.db.updateDemo(id, updates);
    } else {
      const demos = this.readFile(DEMOS_FILE);
      const demoIndex = demos.findIndex(d => d.id === id);
      if (demoIndex !== -1) {
        demos[demoIndex] = { ...demos[demoIndex], ...updates, updatedAt: new Date().toISOString() };
        this.writeFile(DEMOS_FILE, demos);
        return demos[demoIndex];
      }
      return null;
    }
  }

  // Pending Deposits operations
  async getPendingDeposits() {
    if (this.usePostgreSQL) {
      return await this.db.getPendingDeposits();
    } else {
      return this.readFile(PENDING_DEPOSITS_FILE);
    }
  }

  async createPendingDeposit(depositData) {
    if (this.usePostgreSQL) {
      return await this.db.createPendingDeposit(depositData);
    } else {
      const pendingDeposits = this.readFile(PENDING_DEPOSITS_FILE);
      const newDeposit = {
        id: uuidv4(),
        userId: depositData.userId,
        amount: depositData.amount,
        plan: depositData.plan || 'basic',
        method: depositData.method || 'bank_transfer',
        status: 'pending',
        userEmail: depositData.userEmail,
        userName: depositData.userName,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        processedAt: null,
        processedBy: null,
        notes: ''
      };
      pendingDeposits.push(newDeposit);
      this.writeFile(PENDING_DEPOSITS_FILE, pendingDeposits);
      return newDeposit;
    }
  }

  async updatePendingDeposit(id, updates) {
    if (this.usePostgreSQL) {
      return await this.db.updatePendingDeposit(id, updates);
    } else {
      const pendingDeposits = this.readFile(PENDING_DEPOSITS_FILE);
      const depositIndex = pendingDeposits.findIndex(d => d.id === id);
      if (depositIndex !== -1) {
        pendingDeposits[depositIndex] = {
          ...pendingDeposits[depositIndex],
          ...updates,
          updatedAt: new Date().toISOString()
        };
        this.writeFile(PENDING_DEPOSITS_FILE, pendingDeposits);
        return pendingDeposits[depositIndex];
      }
      return null;
    }
  }

  async approvePendingDeposit(id, adminId) {
    if (this.usePostgreSQL) {
      return await this.db.approvePendingDeposit(id, adminId);
    } else {
      // JSON implementation with balance update
      const pendingDeposits = this.readFile(PENDING_DEPOSITS_FILE);
      const deposit = pendingDeposits.find(d => d.id === id);
      
      if (!deposit || deposit.status !== 'pending') {
        return null;
      }

      // Update user balance
      const user = await this.getUserById(deposit.userId);
      if (user) {
        const newBalance = user.balance + deposit.amount;
        await this.updateUser(deposit.userId, { balance: newBalance });
      }

      // Update deposit status
      const updatedDeposit = await this.updatePendingDeposit(id, {
        status: 'approved',
        processedAt: new Date().toISOString(),
        processedBy: adminId
      });

      // Create transaction record
      await this.createTransaction({
        type: 'deposit',
        amount: deposit.amount,
        userId: deposit.userId,
        status: 'completed',
        description: 'Approved deposit'
      });

      return updatedDeposit;
    }
  }

  async rejectPendingDeposit(id, adminId, notes) {
    if (this.usePostgreSQL) {
      return await this.db.rejectPendingDeposit(id, adminId, notes);
    } else {
      return await this.updatePendingDeposit(id, {
        status: 'rejected',
        processedAt: new Date().toISOString(),
        processedBy: adminId,
        notes: notes || ''
      });
    }
  }

  // Chat operations
  async getAllChatMessages() {
    if (this.usePostgreSQL) {
      return await this.db.getAllChatMessages();
    } else {
      return this.readFile(CHAT_FILE);
    }
  }

  async createChatMessage(messageData) {
    if (this.usePostgreSQL) {
      return await this.db.createChatMessage(messageData);
    } else {
      const messages = this.readFile(CHAT_FILE);
      const newMessage = {
        id: uuidv4(),
        senderId: messageData.senderId,
        senderType: messageData.senderType,
        senderName: messageData.senderName,
        recipientUserId: messageData.recipientUserId || null,
        recipientType: messageData.recipientType,
        message: messageData.message,
        timestamp: new Date().toISOString(),
        isRead: false,
        createdAt: new Date().toISOString()
      };
      messages.push(newMessage);
      this.writeFile(CHAT_FILE, messages);
      return newMessage;
    }
  }

  async getChatMessages(userId) {
    if (this.usePostgreSQL) {
      return await this.db.getChatMessages(userId);
    } else {
      const messages = this.readFile(CHAT_FILE);
      return messages.filter(msg => {
        if (msg.senderType === 'user' && msg.senderId === userId) {
          return true;
        }
        if (msg.senderType === 'admin' && msg.recipientUserId === userId && msg.recipientUserId !== null && msg.recipientUserId !== undefined) {
          return true;
        }
        return false;
      }).sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
    }
  }

  async getAllConversations() {
    if (this.usePostgreSQL) {
      return await this.db.getAllConversations();
    } else {
      const messages = this.readFile(CHAT_FILE);
      const users = this.readFile(USERS_FILE);
      
      const conversationMap = new Map();
      
      messages.forEach(msg => {
        let userId;
        if (msg.senderType === 'user') {
          userId = msg.senderId;
        } else if (msg.recipientUserId) {
          userId = msg.recipientUserId;
        }
        
        if (userId) {
          if (!conversationMap.has(userId)) {
            const user = users.find(u => u.id === userId);
            conversationMap.set(userId, {
              userId,
              userName: user ? user.email : 'Unknown User',
              userEmail: user ? user.email : '',
              messages: [],
              lastMessage: null,
              unreadCount: 0
            });
          }
          
          conversationMap.get(userId).messages.push(msg);
          conversationMap.get(userId).lastMessage = msg;
          
          if (!msg.isRead && msg.senderType === 'user') {
            conversationMap.get(userId).unreadCount++;
          }
        }
      });
      
      return Array.from(conversationMap.values())
        .sort((a, b) => {
          if (!a.lastMessage || !b.lastMessage) return 0;
          return new Date(b.lastMessage.timestamp) - new Date(a.lastMessage.timestamp);
        });
    }
  }

  // Additional helper methods for user-specific data
  async getTransactionsByUserId(userId) {
    if (this.usePostgreSQL) {
      return await this.db.getTransactionsByUserId(userId);
    } else {
      const transactions = this.readFile(TRANSACTIONS_FILE);
      return transactions.filter(transaction => transaction.userId === userId);
    }
  }

  async getWithdrawalsByUserId(userId) {
    if (this.usePostgreSQL) {
      return await this.db.getWithdrawalsByUserId(userId);
    } else {
      const withdrawals = this.readFile(WITHDRAWALS_FILE);
      return withdrawals.filter(withdrawal => withdrawal.userId === userId);
    }
  }

  async getPendingDepositsByUserId(userId) {
    if (this.usePostgreSQL) {
      return await this.db.getPendingDepositsByUserId(userId);
    } else {
      const pendingDeposits = this.readFile(PENDING_DEPOSITS_FILE);
      return pendingDeposits.filter(deposit => deposit.userId === userId);
    }
  }

  async markMessagesAsRead(userId, messageIds) {
    if (this.usePostgreSQL) {
      return await this.db.markMessagesAsRead(userId, messageIds);
    } else {
      const messages = this.readFile(CHAT_FILE);
      let updatedCount = 0;

      messages.forEach(msg => {
        if (messageIds.includes(msg.id) && 
            ((msg.senderType === 'admin' && msg.recipientUserId === userId) ||
             (msg.senderType === 'user' && msg.senderId === userId))) {
          msg.isRead = true;
          updatedCount++;
        }
      });

      this.writeFile(CHAT_FILE, messages);
      return updatedCount;
    }
  }

  async getUnreadMessageCount(userId) {
    if (this.usePostgreSQL) {
      return await this.db.getUnreadMessageCount(userId);
    } else {
      const messages = this.readFile(CHAT_FILE);
      
      return messages.filter(msg => 
        !msg.isRead && 
        ((msg.senderType === 'admin' && msg.recipientUserId === userId) ||
         (msg.senderType === 'user' && msg.senderId === userId))
      ).length;
    }
  }

  // Initialize database (PostgreSQL only)
  async initialize() {
    if (this.usePostgreSQL) {
      await this.db.initializeTables();
      await this.db.seedInitialData();
    }
  }
}

// Create singleton instance
const database = new DatabaseManager();

module.exports = database;