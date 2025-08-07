#!/usr/bin/env node

/**
 * Quick Restart Script
 * Quickly restart individual servers without stopping the other
 */

const { spawn } = require('child_process');
const path = require('path');

const args = process.argv.slice(2);
const target = args[0];

if (!target || !['backend', 'frontend', 'both'].includes(target)) {
  console.log('Usage: node quick-restart.js [backend|frontend|both]');
  console.log('  backend  - Restart only backend server');
  console.log('  frontend - Restart only frontend server');
  console.log('  both     - Restart both servers');
  process.exit(1);
}

function startBackend() {
  console.log('🔄 Restarting backend server...');
  return spawn('npm', ['run', 'dev'], {
    cwd: path.join(__dirname, 'backend'),
    stdio: 'inherit',
    shell: true,
    env: {
      ...process.env,
      NODE_ENV: 'development',
      PORT: '5001',
      FRONTEND_URL: 'http://localhost:3000'
    }
  });
}

function startFrontend() {
  console.log('🔄 Restarting frontend server...');
  return spawn('npm', ['start'], {
    cwd: path.join(__dirname, 'frontend'),
    stdio: 'inherit',
    shell: true,
    env: {
      ...process.env,
      REACT_APP_API_URL: 'http://localhost:5001/api',
      BROWSER: 'none'
    }
  });
}

let backendProcess, frontendProcess;

if (target === 'backend' || target === 'both') {
  backendProcess = startBackend();
}

if (target === 'frontend' || target === 'both') {
  frontendProcess = startFrontend();
}

// Handle termination
process.on('SIGINT', () => {
  console.log('\n🛑 Stopping servers...');
  if (backendProcess) backendProcess.kill('SIGINT');
  if (frontendProcess) frontendProcess.kill('SIGINT');
  process.exit(0);
});

console.log(`\n✅ Restarted ${target} server(s)`);
console.log('💡 Press Ctrl+C to stop\n');