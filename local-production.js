#!/usr/bin/env node

/**
 * Local Production Testing Script
 * Builds and serves the app in production mode locally
 */

const { spawn, execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

console.log('🏭 Starting Local Production Environment...\n');

// Check if build exists, if not create it
const buildPath = path.join(__dirname, 'frontend', 'build');
if (!fs.existsSync(buildPath)) {
  console.log('📦 Building frontend for production...');
  try {
    execSync('npm run build', {
      cwd: path.join(__dirname, 'frontend'),
      stdio: 'inherit'
    });
  } catch (error) {
    console.error('❌ Frontend build failed');
    process.exit(1);
  }
}

// Backend in production mode
const backendProcess = spawn('node', ['server.js'], {
  cwd: path.join(__dirname, 'backend'),
  stdio: 'inherit',
  env: {
    ...process.env,
    NODE_ENV: 'production',
    PORT: '5001',
    FRONTEND_URL: 'http://localhost:3000',
    JWT_SECRET: 'local-production-secret-key',
    WS_MAX_PAYLOAD: '16384',
    WS_CONNECTION_TIMEOUT: '1800000'
  }
});

// Serve built frontend
const frontendProcess = spawn('npx', ['serve', '-s', 'build', '-l', '3000'], {
  cwd: path.join(__dirname, 'frontend'),
  stdio: 'inherit',
  shell: true
});

// Handle process termination
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down production servers...');
  backendProcess.kill('SIGINT');
  frontendProcess.kill('SIGINT');
  process.exit(0);
});

backendProcess.on('exit', (code) => {
  console.log(`Backend process exited with code ${code}`);
});

frontendProcess.on('exit', (code) => {
  console.log(`Frontend process exited with code ${code}`);
});

console.log('🏭 Production Mode - Frontend: http://localhost:3000');
console.log('🔧 Production Mode - Backend: http://localhost:5001');
console.log('🎯 Admin Dashboard: http://localhost:3000/admin');
console.log('👤 User Dashboard: http://localhost:3000/user');
console.log('\n💡 Press Ctrl+C to stop servers\n');