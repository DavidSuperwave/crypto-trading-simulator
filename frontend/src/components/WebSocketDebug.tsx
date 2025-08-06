import React, { useState, useEffect } from 'react';
import { useRealTimeNotifications } from '../hooks/useRealTimeNotifications';

const WebSocketDebug: React.FC = () => {
  const [debugLogs, setDebugLogs] = useState<string[]>([]);
  const [testMessage, setTestMessage] = useState('');

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setDebugLogs(prev => [`[${timestamp}] ${message}`, ...prev.slice(0, 19)]);
  };

  const { isConnected, connectionStatus } = useRealTimeNotifications({
    onNewChatMessage: (message) => {
      addLog(`🔵 Chat message received: ${message.message} from ${message.senderName}`);
    },
    onNewDeposit: (deposit) => {
      addLog(`🟢 New deposit: $${deposit.amount} from ${deposit.userEmail}`);
    },
    onNewWithdrawal: (withdrawal) => {
      addLog(`🔴 New withdrawal: $${withdrawal.amount} from ${withdrawal.userEmail}`);
    },
    onDepositStatusUpdate: (deposit) => {
      addLog(`💰 Deposit status update: ${deposit.status} for $${deposit.amount}`);
    },
    onWithdrawalStatusUpdate: (withdrawal) => {
      addLog(`💸 Withdrawal status update: ${withdrawal.status} for $${withdrawal.amount}`);
    }
  });

  useEffect(() => {
    addLog(`WebSocket connection status: ${connectionStatus}`);
  }, [connectionStatus]);

  useEffect(() => {
    addLog(`WebSocket connected: ${isConnected}`);
  }, [isConnected]);

  // Log environment and URLs
  useEffect(() => {
    const apiUrl = process.env.REACT_APP_API_URL;
    const wsUrl = process.env.REACT_APP_WS_URL;
    const hostname = window.location.hostname;
    const protocol = window.location.protocol;
    
    addLog(`Environment - Hostname: ${hostname}, Protocol: ${protocol}`);
    addLog(`API URL: ${apiUrl || 'Not set (using default)'}`);
    addLog(`WS URL: ${wsUrl || 'Not set (using auto-detection)'}`);
    
    // Try to construct the WebSocket URL
    const token = localStorage.getItem('token');
    if (wsUrl) {
      addLog(`Connecting to: ${wsUrl}?token=${token ? '[TOKEN_PRESENT]' : '[NO_TOKEN]'}`);
    } else {
      const autoWsUrl = hostname === 'localhost' 
        ? 'ws://localhost:5001/ws' 
        : 'wss://coral-app-bh2u4.ondigitalocean.app/ws';
      addLog(`Auto-detected URL: ${autoWsUrl}?token=${token ? '[TOKEN_PRESENT]' : '[NO_TOKEN]'}`);
    }
  }, []);

  const testWebSocketConnection = () => {
    addLog('🧪 Testing WebSocket connection manually...');
    
    const token = localStorage.getItem('token');
    if (!token) {
      addLog('❌ No auth token found!');
      return;
    }

    const wsUrl = process.env.REACT_APP_WS_URL || 
      (window.location.hostname === 'localhost' 
        ? 'ws://localhost:5001/ws' 
        : 'wss://coral-app-bh2u4.ondigitalocean.app/ws');
    
    const fullUrl = `${wsUrl}?token=${token}`;
    addLog(`Attempting connection to: ${fullUrl.replace(token, '[TOKEN]')}`);

    const testWs = new WebSocket(fullUrl);
    
    testWs.onopen = () => {
      addLog('✅ Test WebSocket connection opened!');
      if (testMessage) {
        testWs.send(JSON.stringify({ type: 'test', message: testMessage }));
        addLog(`📤 Sent test message: ${testMessage}`);
      }
    };
    
    testWs.onmessage = (event) => {
      addLog(`📥 Test received: ${event.data}`);
    };
    
    testWs.onerror = (error) => {
      addLog(`❌ Test WebSocket error: ${error}`);
    };
    
    testWs.onclose = (event) => {
      addLog(`🔌 Test WebSocket closed: Code ${event.code}, Reason: ${event.reason}`);
    };

    // Close test connection after 5 seconds
    setTimeout(() => {
      if (testWs.readyState === WebSocket.OPEN) {
        testWs.close();
        addLog('🔌 Test connection closed after 5 seconds');
      }
    }, 5000);
  };

  const getStatusColor = () => {
    switch (connectionStatus) {
      case 'connected': return '#10b981';
      case 'connecting': return '#f59e0b';
      case 'error': return '#ef4444';
      default: return '#6b7280';
    }
  };

  return (
    <div style={{
      position: 'fixed',
      top: '10px',
      right: '10px',
      width: '400px',
      maxHeight: '60vh',
      background: 'white',
      border: '2px solid #e5e7eb',
      borderRadius: '8px',
      padding: '1rem',
      zIndex: 1000,
      fontSize: '12px',
      fontFamily: 'monospace',
      boxShadow: '0 10px 25px rgba(0,0,0,0.1)'
    }}>
      <div style={{ marginBottom: '1rem' }}>
        <h3 style={{ margin: '0 0 0.5rem 0', color: '#1f2937' }}>WebSocket Debug</h3>
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '0.5rem',
          marginBottom: '0.5rem'
        }}>
          <div style={{
            width: '12px',
            height: '12px',
            borderRadius: '50%',
            backgroundColor: getStatusColor()
          }}></div>
          <span style={{ color: getStatusColor(), fontWeight: 'bold' }}>
            {connectionStatus.toUpperCase()} {isConnected ? '✅' : '❌'}
          </span>
        </div>
        
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <input
            type="text"
            value={testMessage}
            onChange={(e) => setTestMessage(e.target.value)}
            placeholder="Test message"
            style={{
              flex: 1,
              padding: '4px 8px',
              border: '1px solid #d1d5db',
              borderRadius: '4px',
              fontSize: '12px'
            }}
          />
          <button
            onClick={testWebSocketConnection}
            style={{
              padding: '4px 8px',
              background: '#3b82f6',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              fontSize: '12px',
              cursor: 'pointer'
            }}
          >
            Test
          </button>
        </div>
      </div>

      <div style={{
        maxHeight: '300px',
        overflowY: 'auto',
        border: '1px solid #e5e7eb',
        borderRadius: '4px',
        padding: '0.5rem',
        background: '#f9fafb'
      }}>
        {debugLogs.length === 0 ? (
          <div style={{ color: '#6b7280', fontStyle: 'italic' }}>
            No logs yet...
          </div>
        ) : (
          debugLogs.map((log, index) => (
            <div key={index} style={{ 
              marginBottom: '2px',
              color: log.includes('❌') ? '#ef4444' : 
                    log.includes('✅') ? '#10b981' : 
                    log.includes('🔴') || log.includes('🟢') || log.includes('🔵') ? '#3b82f6' :
                    '#374151'
            }}>
              {log}
            </div>
          ))
        )}
      </div>
      
      <div style={{ 
        marginTop: '0.5rem', 
        fontSize: '10px', 
        color: '#6b7280',
        textAlign: 'center'
      }}>
        Press F12 → Console for more details
      </div>
    </div>
  );
};

export default WebSocketDebug;