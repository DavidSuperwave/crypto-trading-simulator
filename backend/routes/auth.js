const express = require('express');
const bcrypt = require('bcryptjs');
const database = require('../database');
const { generateToken } = require('../middleware/auth');

const router = express.Router();

// Register new user
router.post('/register', async (req, res) => {
  try {
    const { email, password, firstName, lastName, phone, role = 'user' } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    if (!firstName || !lastName) {
      return res.status(400).json({ error: 'First name and last name are required' });
    }

    if (!phone) {
      return res.status(400).json({ error: 'Phone number is required' });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Please enter a valid email address' });
    }

    // Validate phone format (basic validation)
    const phoneRegex = /^[+]?[1-9][\d]{0,15}$/;
    if (!phoneRegex.test(phone.replace(/[\s\-()]/g, ''))) {
      return res.status(400).json({ error: 'Please enter a valid phone number' });
    }

    // Validate password strength
    if (password.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters long' });
    }

    // Check if user already exists
    const existingUser = await database.getUserByEmail(email);
    if (existingUser) {
      return res.status(409).json({ error: 'User with this email already exists' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create user
    const newUser = await database.createUser({
      email,
      password: hashedPassword,
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      phone: phone.replace(/[\s\-()]/g, ''), // Clean phone number
      role
    });

    // Remove password from response
    const { password: _, ...userResponse } = newUser;

    // Generate token
    const token = generateToken(newUser);

    res.status(201).json({
      message: 'User created successfully',
      user: userResponse,
      token
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Login user
router.post('/login', async (req, res) => {
  try {
    console.log('🔐 Backend received login request');
    console.log('📦 Request body:', { ...req.body, password: req.body.password ? '***' : 'MISSING' });
    console.log('📦 Email received:', `"${req.body.email}"`);
    console.log('📦 Password received length:', req.body.password ? req.body.password.length : 0);
    
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      console.log('❌ Missing email or password');
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Find user
    console.log('🔍 Looking for user with email:', `"${email}"`);
    const user = await database.getUserByEmail(email);
    if (!user) {
      console.log('❌ User not found in database');
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    console.log('✅ User found:', { id: user.id, email: user.email, role: user.role });

    // Verify password
    console.log('🔒 Comparing password with hash...');
    const isValidPassword = await bcrypt.compare(password, user.password);
    console.log('🔒 Password comparison result:', isValidPassword);
    
    if (!isValidPassword) {
      console.log('❌ Password validation failed');
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Generate token
    const token = generateToken(user);

    // Remove password from response
    const { password: _, ...userResponse } = user;

    res.json({
      message: 'Login successful',
      user: userResponse,
      token
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create default admin user (for development)
router.post('/create-admin', async (req, res) => {
  try {
    const adminEmail = 'admin@cryptosim.com';
    const adminPassword = 'admin123';

    // Check if admin already exists
    const existingAdmin = await database.getUserByEmail(adminEmail);
    if (existingAdmin) {
      return res.status(409).json({ error: 'Admin user already exists' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(adminPassword, 12);

    // Create admin user
    const adminUser = await database.createUser({
      email: adminEmail,
      password: hashedPassword,
      role: 'admin'
    });

    res.status(201).json({
      message: 'Admin user created successfully',
      credentials: {
        email: adminEmail,
        password: adminPassword
      }
    });
  } catch (error) {
    console.error('Admin creation error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;