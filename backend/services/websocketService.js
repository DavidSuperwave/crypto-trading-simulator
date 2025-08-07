const WebSocket = require('ws');
const jwt = require('jsonwebtoken');
const database = require('../database');

class WebSocketService {
  constructor() {
    this.wss = null;
    this.clients = new Map(); // Map of userId -> WebSocket connection
    this.adminClients = new Set(); // Set of admin WebSocket connections
  }

  initialize(server) {
    // Production-ready WebSocket configuration
    this.wss = new WebSocket.Server({ 
      server,
      path: '/ws',
      // Production configuration
      perMessageDeflate: false,
      maxPayload: 16 * 1024, // 16KB max message size
      // Origin validation for security
      verifyClient: (info) => {
        const allowedOrigins = [
          'http://localhost:3000',
          'https://crypto-trading-simulator-five.vercel.app',
          'https://crypto-trading-simulator-duk9upmqa.vercel.app',
          process.env.FRONTEND_URL
        ].filter(Boolean);
        
        const origin = info.origin;
        const isValidOrigin = allowedOrigins.includes(origin) || 
                             (process.env.NODE_ENV === 'development' && origin?.includes('localhost'));
        
        // Log all connection attempts for debugging
        console.log(`🔍 WebSocket connection attempt - Origin: ${origin}`);
        console.log(`🔍 Allowed origins: ${JSON.stringify(allowedOrigins)}`);
        console.log(`🔍 Is valid origin: ${isValidOrigin}`);
        
        if (!isValidOrigin) {
          console.warn(`❌ WebSocket connection rejected - Invalid origin: ${origin}`);
          console.warn(`❌ Expected one of: ${allowedOrigins.join(', ')}`);
          // TEMPORARY: Allow all origins for debugging
          if (process.env.NODE_ENV === 'production') {
            console.warn(`🧪 TEMPORARY: Allowing connection for debugging purposes`);
            return true;
          }
          return false;
        }
        
        console.log(`✅ WebSocket connection allowed from origin: ${origin}`);
        return true;
      }
    });

    console.log('🔌 WebSocket server initialized with production config');
    console.log(`🌐 Allowed origins: ${JSON.stringify([
      'http://localhost:3000',
      'https://crypto-trading-simulator-five.vercel.app', 
      'https://crypto-trading-simulator-duk9upmqa.vercel.app',
      process.env.FRONTEND_URL
    ].filter(Boolean))}`);

    this.wss.on('connection', (ws, request) => {
      this.handleConnection(ws, request);
    });

    this.wss.on('error', (error) => {
      console.error('❌ WebSocket server error:', error);
    });

    this.wss.on('listening', () => {
      console.log('🎧 WebSocket server is listening for connections');
    });

    // Log connection stats periodically
    if (process.env.NODE_ENV === 'production') {
      setInterval(() => {
        console.log(`📊 WebSocket Stats - Connected clients: ${this.clients.size}, Admin clients: ${this.adminClients.size}`);
      }, 60000); // Every minute
    }
  }

  async handleConnection(ws, request) {
    const clientIp = request.headers['x-forwarded-for'] || request.connection.remoteAddress;
    console.log(`🔄 New WebSocket connection attempt from ${clientIp}`);
    
    try {
      // Extract token from query parameters or headers
      const url = new URL(request.url, `http://${request.headers.host}`);
      const token = url.searchParams.get('token') || request.headers.authorization?.replace('Bearer ', '');

      if (!token) {
        console.warn(`❌ WebSocket connection rejected - No token provided from ${clientIp}`);
        ws.close(1008, 'Authentication required');
        return;
      }

      // Verify JWT token
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production');
      const user = await database.getUserById(decoded.id);

      if (!user) {
        console.warn(`❌ WebSocket connection rejected - Invalid user ID: ${decoded.id} from ${clientIp}`);
        ws.close(1008, 'Invalid user');
        return;
      }

      // Store connection with user info
      ws.userId = user.id;
      ws.userRole = user.role;
      ws.userEmail = user.email;
      ws.clientIp = clientIp;
      ws.connectedAt = new Date();

      // Close any existing connection for this user (prevent duplicates)
      if (this.clients.has(user.id)) {
        const existingWs = this.clients.get(user.id);
        if (existingWs.readyState === WebSocket.OPEN) {
          console.log(`🔄 Closing existing connection for user: ${user.email}`);
          existingWs.close(1000, 'New connection established');
        }
      }

      // Add to appropriate client collections
      this.clients.set(user.id, ws);
      if (user.role === 'admin') {
        this.adminClients.add(ws);
      }

      console.log(`✅ WebSocket connected: ${user.email} (${user.role}) from ${clientIp}`);
      console.log(`📊 Total connections: ${this.clients.size} (${this.adminClients.size} admins)`);

      // Send connection confirmation
      this.sendToClient(ws, {
        type: 'connected',
        message: 'WebSocket connection established',
        timestamp: new Date().toISOString(),
        userId: user.id,
        userRole: user.role
      });

      // Set connection timeout for inactive connections
      const connectionTimeout = setTimeout(() => {
        if (ws.readyState === WebSocket.OPEN) {
          console.log(`⏰ Closing inactive WebSocket connection for ${user.email}`);
          ws.close(1000, 'Connection timeout');
        }
      }, 30 * 60 * 1000); // 30 minutes

      ws.connectionTimeout = connectionTimeout;

      // Handle incoming messages
      ws.on('message', (data) => {
        // Reset timeout on activity
        clearTimeout(ws.connectionTimeout);
        ws.connectionTimeout = setTimeout(() => {
          if (ws.readyState === WebSocket.OPEN) {
            ws.close(1000, 'Connection timeout');
          }
        }, 30 * 60 * 1000);
        
        this.handleMessage(ws, data);
      });

      // Handle disconnection
      ws.on('close', (code, reason) => {
        clearTimeout(ws.connectionTimeout);
        this.handleDisconnection(ws, code, reason);
      });

      // Handle connection errors
      ws.on('error', (error) => {
        console.error(`❌ WebSocket error for ${user.email}:`, error);
        clearTimeout(ws.connectionTimeout);
        this.handleDisconnection(ws, 1006, 'Connection error');
      });

    } catch (error) {
      console.error('WebSocket connection error:', error);
      ws.close(1008, 'Authentication failed');
    }
  }

  handleMessage(ws, data) {
    try {
      const message = JSON.parse(data);
      
      switch (message.type) {
        case 'ping':
          this.sendToClient(ws, { type: 'pong', timestamp: new Date().toISOString() });
          break;
          
        case 'chat_typing':
          this.broadcastToAdmins({
            type: 'user_typing',
            userId: ws.userId,
            userEmail: ws.userEmail,
            timestamp: new Date().toISOString()
          });
          break;
          
        default:
          console.log(`Unknown WebSocket message type: ${message.type}`);
      }
    } catch (error) {
      console.error('Error handling WebSocket message:', error);
    }
  }

  handleDisconnection(ws, code = 'unknown', reason = 'unknown') {
    if (ws.userId) {
      const connectionDuration = ws.connectedAt ? 
        Math.round((Date.now() - ws.connectedAt.getTime()) / 1000) : 'unknown';
      
      console.log(`❌ WebSocket disconnected: ${ws.userEmail} (${ws.userRole}) - Code: ${code}, Reason: ${reason}, Duration: ${connectionDuration}s`);
      
      // Clean up connection tracking
      this.clients.delete(ws.userId);
      this.adminClients.delete(ws);
      
      console.log(`📊 Remaining connections: ${this.clients.size} (${this.adminClients.size} admins)`);
    } else {
      console.log(`❌ WebSocket disconnected: Unknown user - Code: ${code}, Reason: ${reason}`);
    }
  }

  // Send message to specific client
  sendToClient(ws, data) {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(data));
    }
  }

  // Send message to specific user by ID
  sendToUser(userId, data) {
    const client = this.clients.get(userId);
    if (client) {
      this.sendToClient(client, data);
    }
  }

  // Broadcast message to all admin clients
  broadcastToAdmins(data) {
    this.adminClients.forEach(ws => {
      this.sendToClient(ws, data);
    });
  }

  // Broadcast message to all connected clients
  broadcastToAll(data) {
    this.clients.forEach(ws => {
      this.sendToClient(ws, data);
    });
  }

  // Real-time event handlers
  
  // New chat message
  notifyNewChatMessage(message) {
    if (message.senderType === 'user') {
      // User sent message to admin - notify all admins
      this.broadcastToAdmins({
        type: 'new_chat_message',
        message,
        timestamp: new Date().toISOString()
      });
    } else if (message.senderType === 'admin' && message.recipientUserId) {
      // Admin sent message to specific user - notify that user
      this.sendToUser(message.recipientUserId, {
        type: 'new_chat_message',
        message,
        timestamp: new Date().toISOString()
      });
    }
  }

  // New deposit request
  notifyNewDeposit(deposit) {
    this.broadcastToAdmins({
      type: 'new_deposit',
      deposit,
      timestamp: new Date().toISOString()
    });
  }

  // New withdrawal request
  notifyNewWithdrawal(withdrawal) {
    this.broadcastToAdmins({
      type: 'new_withdrawal',
      withdrawal,
      timestamp: new Date().toISOString()
    });
  }

  // Deposit status update (approved/rejected)
  notifyDepositStatusUpdate(deposit) {
    // Notify the user who made the deposit
    this.sendToUser(deposit.userId, {
      type: 'deposit_status_update',
      deposit,
      timestamp: new Date().toISOString()
    });

    // Also notify admins
    this.broadcastToAdmins({
      type: 'deposit_status_update',
      deposit,
      timestamp: new Date().toISOString()
    });
  }

  // Withdrawal status update (approved/rejected)
  notifyWithdrawalStatusUpdate(withdrawal) {
    // Notify the user who made the withdrawal
    this.sendToUser(withdrawal.userId, {
      type: 'withdrawal_status_update',
      withdrawal,
      timestamp: new Date().toISOString()
    });

    // Also notify admins
    this.broadcastToAdmins({
      type: 'withdrawal_status_update',
      withdrawal,
      timestamp: new Date().toISOString()
    });
  }

  // New demo request
  notifyNewDemo(demo) {
    this.broadcastToAdmins({
      type: 'new_demo',
      demo,
      timestamp: new Date().toISOString()
    });
  }

  // Get connection statistics
  getStats() {
    return {
      totalConnections: this.clients.size,
      adminConnections: this.adminClients.size,
      userConnections: this.clients.size - this.adminClients.size
    };
  }

  // Clean up inactive connections
  cleanupConnections() {
    this.clients.forEach((ws, userId) => {
      if (ws.readyState !== WebSocket.OPEN) {
        this.clients.delete(userId);
        this.adminClients.delete(ws);
      }
    });
  }
}

// Export singleton instance
module.exports = new WebSocketService();