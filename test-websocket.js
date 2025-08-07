// WebSocket connection test for production debugging
const WebSocket = require('ws');

// Configuration
const WS_URL = 'wss://coral-app-bh2u4.ondigitalocean.app/ws';
const TEST_TOKEN = process.argv[2]; // Pass token as command line argument

if (!TEST_TOKEN) {
  console.error('❌ Usage: node test-websocket.js <JWT_TOKEN>');
  console.error('📋 Example: node test-websocket.js eyJhbGciOiJIUzI1NiIs...');
  process.exit(1);
}

console.log('🧪 Testing WebSocket connection...');
console.log(`🔗 URL: ${WS_URL}`);
console.log(`🔑 Token: ${TEST_TOKEN.substring(0, 20)}...`);

const ws = new WebSocket(`${WS_URL}?token=${TEST_TOKEN}`);

ws.on('open', () => {
  console.log('✅ WebSocket connection opened successfully!');
  
  // Send a test message
  ws.send(JSON.stringify({
    type: 'ping',
    message: 'Test message from Node.js client',
    timestamp: new Date().toISOString()
  }));
  
  console.log('📤 Sent test ping message');
});

ws.on('message', (data) => {
  try {
    const message = JSON.parse(data);
    console.log('📥 Received message:', message);
  } catch (e) {
    console.log('📥 Received raw data:', data.toString());
  }
});

ws.on('error', (error) => {
  console.error('❌ WebSocket error:', error.message);
  console.error('🔍 Error details:', error);
});

ws.on('close', (code, reason) => {
  console.log(`🔌 WebSocket connection closed`);
  console.log(`📊 Code: ${code}`);
  console.log(`📝 Reason: ${reason || 'No reason provided'}`);
  process.exit(code === 1000 ? 0 : 1);
});

// Test timeout
setTimeout(() => {
  if (ws.readyState === WebSocket.CONNECTING) {
    console.error('⏰ Connection timeout after 10 seconds');
    ws.terminate();
    process.exit(1);
  }
}, 10000);

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down...');
  ws.close(1000, 'Test completed');
});