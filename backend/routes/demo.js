const express = require('express');
const database = require('../database');

const router = express.Router();

// Request a demo (public endpoint)
router.post('/request', (req, res) => {
  try {
    const { name, email, company, phone, message } = req.body;

    // Validate required fields
    if (!name || !email) {
      return res.status(400).json({ error: 'Name and email are required' });
    }

    // Create demo request
    const demo = database.createDemo({
      name,
      email,
      company: company || '',
      phone: phone || '',
      message: message || '',
      status: 'requested'
    });

    res.status(201).json({
      message: 'Demo request submitted successfully',
      demo: {
        id: demo.id,
        name: demo.name,
        email: demo.email,
        company: demo.company,
        status: demo.status,
        createdAt: demo.createdAt
      }
    });
  } catch (error) {
    console.error('Demo request error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get demo statistics (public endpoint for demo dashboard)
router.get('/stats', (req, res) => {
  try {
    // Simulate some demo statistics
    const stats = {
      totalUsers: 1247,
      totalBalance: 2847392.45,
      avgDailyReturn: 1.8,
      successfulTrades: 8934,
      aiAccuracy: 94.2,
      activeTraders: 342,
      lastUpdated: new Date().toISOString()
    };

    res.json(stats);
  } catch (error) {
    console.error('Demo stats error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get sample trading data for demo
router.get('/trading-data', (req, res) => {
  try {
    // Generate sample trading data for the last 24 hours
    const now = new Date();
    const tradingData = [];

    for (let i = 23; i >= 0; i--) {
      const time = new Date(now.getTime() - i * 60 * 60 * 1000);
      const basePrice = 45000 + Math.sin(i / 4) * 2000;
      const variation = (Math.random() - 0.5) * 1000;
      
      tradingData.push({
        time: time.toISOString(),
        price: Math.round(basePrice + variation),
        volume: Math.round(Math.random() * 1000000),
        prediction: Math.round((basePrice + variation) * (1 + (Math.random() * 0.04 - 0.02))),
        accuracy: 85 + Math.random() * 15
      });
    }

    res.json(tradingData);
  } catch (error) {
    console.error('Trading data error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get recent demo trades
router.get('/recent-trades', (req, res) => {
  try {
    const recentTrades = [
      {
        id: 1,
        symbol: 'BTC/USD',
        type: 'BUY',
        amount: 0.5,
        price: 45230,
        profit: 127.50,
        timestamp: new Date(Date.now() - Math.random() * 3600000).toISOString()
      },
      {
        id: 2,
        symbol: 'ETH/USD',
        type: 'SELL',
        amount: 2.3,
        price: 2845,
        profit: 89.30,
        timestamp: new Date(Date.now() - Math.random() * 3600000).toISOString()
      },
      {
        id: 3,
        symbol: 'BTC/USD',
        type: 'BUY',
        amount: 0.25,
        price: 45180,
        profit: 45.20,
        timestamp: new Date(Date.now() - Math.random() * 3600000).toISOString()
      },
      {
        id: 4,
        symbol: 'ADA/USD',
        type: 'SELL',
        amount: 1000,
        price: 0.52,
        profit: 15.80,
        timestamp: new Date(Date.now() - Math.random() * 3600000).toISOString()
      },
      {
        id: 5,
        symbol: 'DOT/USD',
        type: 'BUY',
        amount: 50,
        price: 7.23,
        profit: 32.10,
        timestamp: new Date(Date.now() - Math.random() * 3600000).toISOString()
      }
    ];

    res.json(recentTrades);
  } catch (error) {
    console.error('Recent trades error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;