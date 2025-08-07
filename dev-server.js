#!/usr/bin/env node

/**
 * Local Development Server Script
 * Starts both backend and frontend servers for quick testing
 */

const { spawn } = require('child_process');
const path = require('path');

console.log('🚀 Starting Local Development Environment...\n');

// Backend configuration
const backendProcess = spawn('npm', ['run', 'dev'], {
  cwd: path.join(__dirname, 'backend'),
  stdio: 'inherit',
  shell: true,
  env: {
    ...process.env,
    NODE_ENV: 'development',
    PORT: '5001',
    FRONTEND_URL: 'http://localhost:3000',
    JWT_SECRET: 'local-dev-secret-key',
    WS_MAX_PAYLOAD: '16384',
    WS_CONNECTION_TIMEOUT: '1800000'
  }
});

// Frontend configuration
const frontendProcess = spawn('npm', ['start'], {
  cwd: path.join(__dirname, 'frontend'),
  stdio: 'inherit',
  shell: true,
  env: {
    ...process.env,
    REACT_APP_API_URL: 'http://localhost:5001/api',
    REACT_APP_WS_URL: 'ws://localhost:5001/ws',
    BROWSER: 'none' // Prevent auto-opening browser
  }
});

// Handle process termination
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down development servers...');
  backendProcess.kill('SIGINT');
  frontendProcess.kill('SIGINT');
  process.exit(0);
});

process.on('SIGTERM', () => {
  backendProcess.kill('SIGTERM');
  frontendProcess.kill('SIGTERM');
  process.exit(0);
});

backendProcess.on('exit', (code) => {
  console.log(`Backend process exited with code ${code}`);
});

frontendProcess.on('exit', (code) => {
  console.log(`Frontend process exited with code ${code}`);
});

console.log('📱 Frontend: http://localhost:3000');
console.log('🔧 Backend: http://localhost:5001');
console.log('🎯 Admin: http://localhost:3000/admin');
console.log('👤 User: http://localhost:3000/user');
console.log('\n💡 Press Ctrl+C to stop both servers\n');