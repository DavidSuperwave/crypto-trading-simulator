// Simple WebSocket test without authentication
const WebSocket = require('ws');

console.log('🧪 Testing basic WebSocket connection (no auth)...');
console.log('🔗 URL: wss://coral-app-bh2u4.ondigitalocean.app/ws');

const ws = new WebSocket('wss://coral-app-bh2u4.ondigitalocean.app/ws');

ws.on('open', () => {
  console.log('✅ Basic WebSocket connection opened successfully!');
  console.log('🎉 DigitalOcean DOES support WebSocket upgrades!');
  ws.close(1000, 'Test completed successfully');
});

ws.on('message', (data) => {
  console.log('📥 Received:', data.toString());
});

ws.on('error', (error) => {
  console.error('❌ WebSocket error:', error.message);
  console.error('🔍 This suggests DigitalOcean WebSocket limitations or Cloudflare blocking');
});

ws.on('close', (code, reason) => {
  console.log(`🔌 Connection closed - Code: ${code}, Reason: ${reason || 'No reason'}`);
  
  if (code === 1008) {
    console.log('💡 Code 1008 = Authentication required (WebSocket is working!)');
  } else if (code === 1006) {
    console.log('💡 Code 1006 = Connection failed (WebSocket blocked/not supported)');
  }
  
  process.exit(code === 1000 || code === 1008 ? 0 : 1);
});

// Test timeout
setTimeout(() => {
  if (ws.readyState === WebSocket.CONNECTING) {
    console.error('⏰ Connection timeout - WebSocket likely blocked');
    ws.terminate();
    process.exit(1);
  }
}, 10000);