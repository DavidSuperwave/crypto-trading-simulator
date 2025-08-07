const { Pool } = require('pg');
const { v4: uuidv4 } = require('uuid');

class PostgreSQLDatabase {
  constructor() {
    this.pool = new Pool({
      connectionString: process.env.DATABASE_URL || process.env.POSTGRES_URL,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
    });
  }

  async query(text, params) {
    const client = await this.pool.connect();
    try {
      const result = await client.query(text, params);
      return result;
    } finally {
      client.release();
    }
  }

  // User operations
  async getAllUsers() {
    const result = await this.query('SELECT * FROM users ORDER BY created_at DESC');
    // Convert snake_case to camelCase for frontend compatibility
    return result.rows.map(user => ({
      ...user,
      createdAt: user.created_at,
      updatedAt: user.updated_at,
      totalInterest: user.total_interest
    }));
  }

  async createUser(userData) {
    const id = uuidv4();
    const query = `
      INSERT INTO users (id, email, password, role, balance, total_interest, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
      RETURNING *
    `;
    const values = [
      id,
      userData.email,
      userData.password,
      userData.role || 'user',
      userData.balance || 0,
      userData.totalInterest || 0
    ];
    const result = await this.query(query, values);
    const user = result.rows[0];
    
    // Convert snake_case to camelCase for frontend compatibility
    return {
      ...user,
      createdAt: user.created_at,
      updatedAt: user.updated_at,
      totalInterest: user.total_interest
    };
  }

  async getUserById(id) {
    const result = await this.query('SELECT * FROM users WHERE id = $1', [id]);
    const user = result.rows[0];
    if (!user) return null;
    
    // Convert snake_case to camelCase for frontend compatibility
    return {
      ...user,
      createdAt: user.created_at,
      updatedAt: user.updated_at,
      totalInterest: user.total_interest
    };
  }

  async getUserByEmail(email) {
    const result = await this.query('SELECT * FROM users WHERE email = $1', [email]);
    const user = result.rows[0];
    if (!user) return null;
    
    // Convert snake_case to camelCase for frontend compatibility
    return {
      ...user,
      createdAt: user.created_at,
      updatedAt: user.updated_at,
      totalInterest: user.total_interest
    };
  }

  async updateUser(id, updates) {
    const setClause = Object.keys(updates).map((key, index) => {
      const dbKey = key === 'totalInterest' ? 'total_interest' : key;
      return `${dbKey} = $${index + 2}`;
    }).join(', ');
    
    const query = `
      UPDATE users 
      SET ${setClause}, updated_at = NOW() 
      WHERE id = $1 
      RETURNING *
    `;
    const values = [id, ...Object.values(updates)];
    const result = await this.query(query, values);
    return result.rows[0];
  }

  async deleteUser(id) {
    const result = await this.query('DELETE FROM users WHERE id = $1 RETURNING *', [id]);
    return result.rows[0];
  }

  // Transaction operations
  async getAllTransactions() {
    const result = await this.query('SELECT * FROM transactions ORDER BY created_at DESC');
    return result.rows;
  }

  async createTransaction(transactionData) {
    const id = uuidv4();
    const query = `
      INSERT INTO transactions (id, type, amount, user_id, status, description, created_at)
      VALUES ($1, $2, $3, $4, $5, $6, NOW())
      RETURNING *
    `;
    const values = [
      id,
      transactionData.type,
      transactionData.amount,
      transactionData.userId,
      transactionData.status || 'pending',
      transactionData.description || null
    ];
    const result = await this.query(query, values);
    return result.rows[0];
  }

  // Withdrawal operations
  async getAllWithdrawals() {
    const result = await this.query('SELECT * FROM withdrawals ORDER BY created_at DESC');
    return result.rows;
  }

  async createWithdrawal(withdrawalData) {
    const id = uuidv4();
    const query = `
      INSERT INTO withdrawals (id, user_id, amount, method, status, created_at)
      VALUES ($1, $2, $3, $4, $5, NOW())
      RETURNING *
    `;
    const values = [
      id,
      withdrawalData.userId,
      withdrawalData.amount,
      withdrawalData.method || 'bank',
      withdrawalData.status || 'pending'
    ];
    const result = await this.query(query, values);
    return result.rows[0];
  }

  async getWithdrawalById(id) {
    const result = await this.query('SELECT * FROM withdrawals WHERE id = $1', [id]);
    return result.rows[0];
  }

  async updateWithdrawal(id, updates) {
    const setClause = Object.keys(updates).map((key, index) => {
      const dbKey = key === 'processedAt' ? 'processed_at' : 
                   key === 'processedBy' ? 'processed_by' : key;
      return `${dbKey} = $${index + 2}`;
    }).join(', ');
    
    const query = `
      UPDATE withdrawals 
      SET ${setClause}, updated_at = NOW() 
      WHERE id = $1 
      RETURNING *
    `;
    const values = [id, ...Object.values(updates)];
    const result = await this.query(query, values);
    return result.rows[0];
  }

  // Demo operations
  async getAllDemos() {
    const result = await this.query('SELECT * FROM demos ORDER BY created_at DESC');
    return result.rows;
  }

  async createDemo(demoData) {
    const id = uuidv4();
    const query = `
      INSERT INTO demos (id, name, email, company, phone, message, status, created_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
      RETURNING *
    `;
    const values = [
      id,
      demoData.name,
      demoData.email,
      demoData.company || '',
      demoData.phone || '',
      demoData.message || '',
      demoData.status || 'requested'
    ];
    const result = await this.query(query, values);
    return result.rows[0];
  }

  async updateDemo(id, updates) {
    const setClause = Object.keys(updates).map((key, index) => 
      `${key} = $${index + 2}`
    ).join(', ');
    
    const query = `
      UPDATE demos 
      SET ${setClause}, updated_at = NOW() 
      WHERE id = $1 
      RETURNING *
    `;
    const values = [id, ...Object.values(updates)];
    const result = await this.query(query, values);
    return result.rows[0];
  }

  // Pending Deposits operations
  async getPendingDeposits() {
    const result = await this.query('SELECT * FROM pending_deposits ORDER BY created_at DESC');
    return result.rows.map(row => ({
      ...row,
      userEmail: row.user_email,
      userName: row.user_name,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      processedAt: row.processed_at,
      processedBy: row.processed_by
    }));
  }

  async createPendingDeposit(depositData) {
    const id = uuidv4();
    const query = `
      INSERT INTO pending_deposits (id, user_id, amount, plan, method, status, user_email, user_name, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())
      RETURNING *
    `;
    const values = [
      id,
      depositData.userId,
      depositData.amount,
      depositData.plan || 'basic',
      depositData.method || 'bank_transfer',
      'pending',
      depositData.userEmail,
      depositData.userName
    ];
    const result = await this.query(query, values);
    return result.rows[0];
  }

  async updatePendingDeposit(id, updates) {
    const setClause = Object.keys(updates).map((key, index) => {
      const dbKey = key === 'processedAt' ? 'processed_at' : 
                   key === 'processedBy' ? 'processed_by' : key;
      return `${dbKey} = $${index + 2}`;
    }).join(', ');
    
    const query = `
      UPDATE pending_deposits 
      SET ${setClause}, updated_at = NOW() 
      WHERE id = $1 
      RETURNING *
    `;
    const values = [id, ...Object.values(updates)];
    const result = await this.query(query, values);
    return result.rows[0];
  }

  async approvePendingDeposit(id, adminId) {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      
      // Get deposit details
      const depositResult = await client.query('SELECT * FROM pending_deposits WHERE id = $1', [id]);
      const deposit = depositResult.rows[0];
      
      if (!deposit || deposit.status !== 'pending') {
        await client.query('ROLLBACK');
        return null;
      }

      // Update user balance
      await client.query(
        'UPDATE users SET balance = balance + $1 WHERE id = $2',
        [deposit.amount, deposit.user_id]
      );

      // Update deposit status
      const updatedDeposit = await client.query(
        `UPDATE pending_deposits 
         SET status = 'approved', processed_at = NOW(), processed_by = $2 
         WHERE id = $1 
         RETURNING *`,
        [id, adminId]
      );

      // Create transaction record
      await client.query(
        `INSERT INTO transactions (id, type, amount, user_id, status, description, created_at)
         VALUES ($1, 'deposit', $2, $3, 'completed', 'Approved deposit', NOW())`,
        [uuidv4(), deposit.amount, deposit.user_id]
      );

      await client.query('COMMIT');
      return updatedDeposit.rows[0];
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async rejectPendingDeposit(id, adminId, notes) {
    const query = `
      UPDATE pending_deposits 
      SET status = 'rejected', processed_at = NOW(), processed_by = $2, notes = $3 
      WHERE id = $1 
      RETURNING *
    `;
    const result = await this.query(query, [id, adminId, notes || '']);
    return result.rows[0];
  }

  // Chat operations
  async getAllChatMessages() {
    const result = await this.query('SELECT * FROM chat_messages ORDER BY created_at ASC');
    return result.rows.map(row => ({
      ...row,
      senderId: row.sender_id,
      senderType: row.sender_type,
      senderName: row.sender_name,
      recipientUserId: row.recipient_user_id,
      recipientType: row.recipient_type,
      isRead: row.is_read,
      createdAt: row.created_at
    }));
  }

  async createChatMessage(messageData) {
    const id = uuidv4();
    const query = `
      INSERT INTO chat_messages (id, sender_id, sender_type, sender_name, recipient_user_id, recipient_type, message, is_read, created_at, timestamp)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())
      RETURNING *
    `;
    const values = [
      id,
      messageData.senderId,
      messageData.senderType,
      messageData.senderName,
      messageData.recipientUserId || null,
      messageData.recipientType,
      messageData.message,
      false
    ];
    const result = await this.query(query, values);
    return result.rows[0];
  }

  async getChatMessages(userId) {
    const query = `
      SELECT * FROM chat_messages 
      WHERE (sender_type = 'user' AND sender_id = $1) 
         OR (sender_type = 'admin' AND recipient_user_id = $1)
      ORDER BY created_at ASC
    `;
    const result = await this.query(query, [userId]);
    return result.rows.map(row => ({
      ...row,
      senderId: row.sender_id,
      senderType: row.sender_type,
      senderName: row.sender_name,
      recipientUserId: row.recipient_user_id,
      recipientType: row.recipient_type,
      isRead: row.is_read,
      timestamp: row.timestamp
    }));
  }

  async getAllConversations() {
    const query = `
      SELECT 
        u.id as user_id,
        u.email as user_email,
        u.email as user_name,
        COUNT(cm.id) as message_count,
        COUNT(CASE WHEN cm.sender_type = 'user' AND cm.is_read = false THEN 1 END) as unread_count,
        MAX(cm.created_at) as last_message_time
      FROM users u
      LEFT JOIN chat_messages cm ON u.id = cm.sender_id OR u.id = cm.recipient_user_id
      WHERE u.role = 'user'
      GROUP BY u.id, u.email
      HAVING COUNT(cm.id) > 0
      ORDER BY last_message_time DESC
    `;
    
    const result = await this.query(query);
    
    // Get detailed conversations with messages
    const conversations = [];
    for (const row of result.rows) {
      const messages = await this.getChatMessages(row.user_id);
      const lastMessage = messages[messages.length - 1] || null;
      
      conversations.push({
        userId: row.user_id,
        userName: row.user_name,
        userEmail: row.user_email,
        messages,
        lastMessage,
        unreadCount: parseInt(row.unread_count)
      });
    }
    
    return conversations;
  }

  // Initialize database tables
  async initializeTables() {
    const createTableQueries = [
      `CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`,
      
      `CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        role VARCHAR(50) DEFAULT 'user',
        balance DECIMAL(15,2) DEFAULT 0,
        total_interest DECIMAL(15,2) DEFAULT 0,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )`,
      
      `CREATE TABLE IF NOT EXISTS transactions (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        type VARCHAR(50) NOT NULL,
        amount DECIMAL(15,2) NOT NULL,
        status VARCHAR(50) DEFAULT 'pending',
        description TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      )`,
      
      `CREATE TABLE IF NOT EXISTS withdrawals (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        amount DECIMAL(15,2) NOT NULL,
        method VARCHAR(100),
        status VARCHAR(50) DEFAULT 'pending',
        processed_by UUID REFERENCES users(id),
        processed_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )`,
      
      `CREATE TABLE IF NOT EXISTS pending_deposits (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        amount DECIMAL(15,2) NOT NULL,
        plan VARCHAR(100),
        method VARCHAR(100),
        status VARCHAR(50) DEFAULT 'pending',
        user_email VARCHAR(255),
        user_name VARCHAR(255),
        processed_by UUID REFERENCES users(id),
        processed_at TIMESTAMP,
        notes TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )`,
      
      `CREATE TABLE IF NOT EXISTS demos (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL,
        company VARCHAR(255),
        phone VARCHAR(50),
        message TEXT,
        status VARCHAR(50) DEFAULT 'requested',
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )`,
      
      `CREATE TABLE IF NOT EXISTS chat_messages (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        sender_id UUID REFERENCES users(id) ON DELETE CASCADE,
        sender_type VARCHAR(50) NOT NULL,
        sender_name VARCHAR(255) NOT NULL,
        recipient_user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        recipient_type VARCHAR(50),
        message TEXT NOT NULL,
        is_read BOOLEAN DEFAULT FALSE,
        timestamp TIMESTAMP DEFAULT NOW(),
        created_at TIMESTAMP DEFAULT NOW()
      )`,
      
      `CREATE TABLE IF NOT EXISTS interest_payments (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        amount DECIMAL(15,2) NOT NULL,
        rate DECIMAL(8,6) NOT NULL,
        period VARCHAR(50) NOT NULL,
        original_balance DECIMAL(15,2) NOT NULL,
        new_balance DECIMAL(15,2) NOT NULL,
        created_at TIMESTAMP DEFAULT NOW()
      )`
    ];

    for (const query of createTableQueries) {
      try {
        await this.query(query);
      } catch (error) {
        console.error('Error creating table:', error.message);
        throw error;
      }
    }
  }

  // Additional helper methods for user-specific data
  async getTransactionsByUserId(userId) {
    const query = 'SELECT * FROM transactions WHERE user_id = $1 ORDER BY created_at DESC';
    const result = await this.query(query, [userId]);
    return result.rows.map(row => ({
      id: row.id,
      type: row.type,
      amount: parseFloat(row.amount),
      userId: row.user_id,
      status: row.status,
      description: row.description,
      createdAt: row.created_at,
      withdrawalId: row.withdrawal_id
    }));
  }

  async getWithdrawalsByUserId(userId) {
    const query = 'SELECT * FROM withdrawals WHERE user_id = $1 ORDER BY created_at DESC';
    const result = await this.query(query, [userId]);
    return result.rows.map(row => ({
      id: row.id,
      userId: row.user_id,
      amount: parseFloat(row.amount),
      method: row.method,
      status: row.status,
      userEmail: row.user_email,
      userName: row.user_name,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      processedAt: row.processed_at,
      processedBy: row.processed_by,
      notes: row.notes
    }));
  }

  async getPendingDepositsByUserId(userId) {
    const query = 'SELECT * FROM pending_deposits WHERE user_id = $1 ORDER BY created_at DESC';
    const result = await this.query(query, [userId]);
    return result.rows.map(row => ({
      id: row.id,
      userId: row.user_id,
      amount: parseFloat(row.amount),
      plan: row.plan,
      method: row.method,
      status: row.status,
      userEmail: row.user_email,
      userName: row.user_name,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      processedAt: row.processed_at,
      processedBy: row.processed_by,
      notes: row.notes
    }));
  }

  async markMessagesAsRead(userId, messageIds) {
    const query = `
      UPDATE chat_messages 
      SET is_read = true 
      WHERE id = ANY($1) 
      AND (
        (sender_type = 'admin' AND recipient_user_id = $2) OR
        (sender_type = 'user' AND sender_id = $2)
      )
    `;
    const result = await this.query(query, [messageIds, userId]);
    return result.rowCount;
  }

  async getUnreadMessageCount(userId) {
    const query = `
      SELECT COUNT(*) as count 
      FROM chat_messages 
      WHERE is_read = false 
      AND (
        (sender_type = 'admin' AND recipient_user_id = $1) OR
        (sender_type = 'user' AND sender_id = $1)
      )
    `;
    const result = await this.query(query, [userId]);
    return parseInt(result.rows[0].count);
  }

  // Seed initial data
  async seedInitialData() {
    // Check if admin user exists
    const existingAdmin = await this.getUserByEmail('admin@cryptosim.com');
    
    if (!existingAdmin) {
      const bcrypt = require('bcryptjs');
      const hashedPassword = await bcrypt.hash('admin123', 12);
      
      await this.createUser({
        email: 'admin@cryptosim.com',
        password: hashedPassword,
        role: 'admin',
        balance: 0,
        totalInterest: 0
      });
      
      console.log('✅ Created default admin user: admin@cryptosim.com / admin123');
    }
  }
}

module.exports = PostgreSQLDatabase;