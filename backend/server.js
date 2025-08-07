const express = require('express');
const cors = require('cors');
const path = require('path');
const http = require('http');

// Import middleware
const { authenticateToken } = require('./middleware/auth');

// Import services
const scheduler = require('./services/scheduler');
const websocketService = require('./services/websocketService');

// Import routes
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/user');
const adminRoutes = require('./routes/admin');
const demoRoutes = require('./routes/demo');
const chatRoutes = require('./routes/chat');

const app = express();
const PORT = process.env.PORT || 5001;

// Middleware
const corsOptions = {
  origin: [
    'http://localhost:3000', // Development
    'https://crypto-trading-simulator-five.vercel.app', // Production
    'https://crypto-trading-simulator-duk9upmqa.vercel.app', // Backup URL
    process.env.FRONTEND_URL // Environment variable
  ].filter(Boolean), // Remove undefined values
  credentials: true,
  // WebSocket specific headers
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH']
};
app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/user', authenticateToken, userRoutes);
app.use('/api/admin', authenticateToken, adminRoutes);
app.use('/api/demo', demoRoutes);
app.use('/api/chat', authenticateToken, chatRoutes);

// Health check endpoints
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// WebSocket health check
app.get('/api/websocket/health', (req, res) => {
  const wsService = require('./services/websocketService');
  res.json({ 
    status: 'healthy',
    websocket: {
      initialized: wsService.wss !== null,
      clientCount: wsService.clients ? wsService.clients.size : 0,
      adminCount: wsService.adminClients ? wsService.adminClients.size : 0
    },
    timestamp: new Date().toISOString()
  });
});

// Fallback HTTP route for WebSocket endpoint (DigitalOcean App Platform compatibility)
app.get('/ws', (req, res) => {
  res.status(426).json({
    error: 'Upgrade Required',
    message: 'This endpoint requires WebSocket upgrade',
    upgrade: 'websocket',
    expectedProtocol: 'wss://',
    currentRequest: 'HTTP/1.1',
    solution: 'Use WebSocket client instead of HTTP'
  });
});



// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ 
    error: 'Internal server error',
    message: err.message 
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ 
    error: 'Route not found',
    path: req.originalUrl 
  });
});

// Create HTTP server
const server = http.createServer(app);

// Initialize WebSocket service
websocketService.initialize(server);

server.listen(PORT, '0.0.0.0', () => {
  const env = process.env.NODE_ENV || 'development';
  const baseUrl = env === 'production' 
    ? 'https://coral-app-bh2u4.ondigitalocean.app' 
    : `http://localhost:${PORT}`;
    
  console.log(`🚀 Server running on port ${PORT} (${env})`);
  console.log(`🔗 Health check: ${baseUrl}/api/health`);
  console.log(`🔌 WebSocket health: ${baseUrl}/api/websocket/health`);
  console.log(`🔌 WebSocket endpoint: ${baseUrl.replace('http', 'ws')}/ws`);
  console.log(`📱 Frontend URL: ${process.env.FRONTEND_URL || 'http://localhost:3000'}`);
  
  // Log WebSocket service status
  console.log(`🔌 WebSocket service initialized: ${websocketService.wss !== null}`);
  
  // Development URLs
  if (env === 'development') {
    console.log(`📊 Admin Dashboard: http://localhost:3000/admin`);
    console.log(`👤 User Dashboard: http://localhost:3000/user`);
    console.log(`🎯 Demo Dashboard: http://localhost:3000/demo`);
  }
  
  // Initialize scheduler for automated tasks
  try {
    scheduler.init();
    console.log(`⏰ Scheduler initialized successfully`);
  } catch (error) {
    console.error('❌ Failed to initialize scheduler:', error);
  }
});

module.exports = app;