const express = require('express');
const cors = require('cors');
const path = require('path');

// Import middleware
const { authenticateToken } = require('./middleware/auth');

// Import services
const scheduler = require('./services/scheduler');

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
  credentials: true
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

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Crypto Trading Simulator API is running',
    timestamp: new Date().toISOString()
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

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`🔗 API Health Check: http://localhost:${PORT}/api/health`);
  console.log(`📊 Admin Dashboard: http://localhost:3000/admin`);
  console.log(`👤 User Dashboard: http://localhost:3000/user`);
  console.log(`🎯 Demo Dashboard: http://localhost:3000/demo`);
  
  // Initialize scheduler for automated tasks
  try {
    scheduler.init();
    console.log(`⏰ Scheduler initialized successfully`);
  } catch (error) {
    console.error('❌ Failed to initialize scheduler:', error);
  }
});

module.exports = app;