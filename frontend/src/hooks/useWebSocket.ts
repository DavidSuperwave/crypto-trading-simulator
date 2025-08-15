import { useState, useEffect, useRef, useCallback } from 'react';

interface WebSocketMessage {
  type: string;
  timestamp: string;
  [key: string]: any;
}

interface UseWebSocketOptions {
  onMessage?: (message: WebSocketMessage) => void;
  onConnect?: () => void;
  onDisconnect?: () => void;
  onError?: (error: Event) => void;
  autoReconnect?: boolean;
  reconnectInterval?: number;
  maxReconnectAttempts?: number;
}

export const useWebSocket = (options: UseWebSocketOptions = {}) => {
  const {
    onMessage,
    onConnect,
    onDisconnect,
    onError,
    autoReconnect = true,
    reconnectInterval = 3000,
    maxReconnectAttempts = 5
  } = options;

  const [isConnected, setIsConnected] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected' | 'error' | 'failed'>('disconnected');
  const [lastMessage, setLastMessage] = useState<WebSocketMessage | null>(null);
  const [canReconnect, setCanReconnect] = useState(true);
  
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const mountedRef = useRef(true);
  const connectionHealthRef = useRef<{ lastPong: number; missedPings: number }>({ lastPong: Date.now(), missedPings: 0 });
  const healthCheckIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Calculate exponential backoff delay
  const getBackoffDelay = useCallback((attempt: number): number => {
    // Exponential backoff: 3s, 6s, 12s, 24s, 48s (max)
    const baseDelay = reconnectInterval;
    const maxDelay = 48000; // 48 seconds max
    const delay = Math.min(baseDelay * Math.pow(2, attempt), maxDelay);
    
    // Add jitter to avoid thundering herd (±20%)
    const jitter = delay * 0.2 * (Math.random() - 0.5);
    return Math.round(delay + jitter);
  }, [reconnectInterval]);

  // Clean up all connection-related timeouts and intervals
  const cleanupConnection = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    
    if (healthCheckIntervalRef.current) {
      clearInterval(healthCheckIntervalRef.current);
      healthCheckIntervalRef.current = null;
    }

    if (wsRef.current) {
      // Remove event listeners to prevent memory leaks
      wsRef.current.onopen = null;
      wsRef.current.onmessage = null;
      wsRef.current.onclose = null;
      wsRef.current.onerror = null;
      
      if (wsRef.current.readyState === WebSocket.CONNECTING || wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.close();
      }
      wsRef.current = null;
    }
  }, []);

  // Start connection health monitoring
  const startHealthCheck = useCallback(() => {
    if (healthCheckIntervalRef.current) {
      clearInterval(healthCheckIntervalRef.current);
    }

    healthCheckIntervalRef.current = setInterval(() => {
      if (!mountedRef.current || !wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
        return;
      }

      const now = Date.now();
      const timeSinceLastPong = now - connectionHealthRef.current.lastPong;
      
      // If no pong received in 45 seconds, consider connection unhealthy
      if (timeSinceLastPong > 45000) {
        connectionHealthRef.current.missedPings++;
        console.warn('🔍 Railway WebSocket: Health check - missed pong', connectionHealthRef.current.missedPings);
        
        // After 3 missed pings, force disconnect and reconnect
        if (connectionHealthRef.current.missedPings >= 3) {
          console.warn('🚫 Railway WebSocket: Connection unhealthy, forcing reconnect');
          setConnectionStatus('error');
          wsRef.current?.close();
        }
      }
    }, 30000); // Check every 30 seconds
  }, []);

  // Get WebSocket URL based on environment
  const getWebSocketUrl = useCallback(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('No authentication token found');
    }

    // Use environment variable or fallback to auto-detection
    const baseWsUrl = process.env.REACT_APP_WS_URL;
    
    if (baseWsUrl) {
      // Use configured WebSocket URL from environment
      return `${baseWsUrl}?token=${token}`;
    } else {
      // Fallback to auto-detection for backwards compatibility
      // protocol variable removed
      const isProduction = window.location.hostname !== 'localhost';
      
      if (window.location.hostname.includes('railway.app')) {
        // Railway: same domain, use wss for secure connection
        return `wss://${window.location.hostname}/ws?token=${token}`;
      } else if (window.location.hostname.includes('vercel.app') || window.location.hostname.includes('crypto-trading-simulator')) {
        // Vercel frontend + Railway backend (cross-origin)
        return `wss://crypto-trading-simulator-production.up.railway.app/ws?token=${token}`;
      } else if (isProduction) {
        // Generic production fallback - Railway backend
        return `wss://crypto-trading-simulator-production.up.railway.app/ws?token=${token}`;
      } else {
        return `ws://localhost:5001/ws?token=${token}`;
      }
    }
  }, []);

  const connect = useCallback(() => {
    if (!mountedRef.current || !canReconnect) return;

    // Clear any existing connection before creating new one
    cleanupConnection();

    try {
      const wsUrl = getWebSocketUrl();
      console.log('🔌 Railway WebSocket attempting connection (attempt:', reconnectAttemptsRef.current + 1, '/', maxReconnectAttempts + 1, ') to:', wsUrl.replace(/token=[^&]+/, 'token=***'));
      setConnectionStatus('connecting');
      
      wsRef.current = new WebSocket(wsUrl);

      // Set connection timeout to prevent stuck "connecting" state
      const connectionTimeout = setTimeout(() => {
        if (wsRef.current && wsRef.current.readyState === WebSocket.CONNECTING) {
          console.warn('🚫 Railway WebSocket connection timeout');
          wsRef.current.close();
          setConnectionStatus('error');
        }
      }, 10000); // 10 second timeout

      wsRef.current.onopen = () => {
        if (!mountedRef.current) return;
        
        clearTimeout(connectionTimeout);
        console.log('✅ Railway WebSocket connected successfully');
        setIsConnected(true);
        setConnectionStatus('connected');
        reconnectAttemptsRef.current = 0;
        setCanReconnect(true);
        
        // Reset health monitoring
        connectionHealthRef.current = { lastPong: Date.now(), missedPings: 0 };
        startHealthCheck();
        
        onConnect?.();
      };

      wsRef.current.onmessage = (event) => {
        if (!mountedRef.current) return;
        
        try {
          const message: WebSocketMessage = JSON.parse(event.data);
          
          // Update health monitoring for pong messages
          if (message.type === 'pong') {
            connectionHealthRef.current.lastPong = Date.now();
            connectionHealthRef.current.missedPings = 0;
          }
          
          setLastMessage(message);
          onMessage?.(message);
        } catch (error) {
          console.error('Railway WebSocket: Error parsing message:', error);
        }
      };

      wsRef.current.onclose = (event) => {
        if (!mountedRef.current) return;
        
        clearTimeout(connectionTimeout);
        
        console.log('❌ Railway WebSocket disconnected - Code:', event.code, 'Reason:', event.reason || 'No reason provided');
        console.log('🔍 Railway WebSocket Debug - Was clean close:', event.wasClean, 'Attempt:', reconnectAttemptsRef.current + 1, '/', maxReconnectAttempts + 1);
        
        setIsConnected(false);
        
        // Stop health monitoring
        if (healthCheckIntervalRef.current) {
          clearInterval(healthCheckIntervalRef.current);
          healthCheckIntervalRef.current = null;
        }
        
        onDisconnect?.();

        // Auto-reconnect if enabled and we haven't exceeded max attempts
        if (autoReconnect && canReconnect && reconnectAttemptsRef.current < maxReconnectAttempts) {
          reconnectAttemptsRef.current++;
          
          // Calculate exponential backoff delay
          const delay = getBackoffDelay(reconnectAttemptsRef.current - 1);
          
          console.log(`🔄 Railway WebSocket reconnect attempt (${reconnectAttemptsRef.current}/${maxReconnectAttempts}) in ${delay}ms with exponential backoff...`);
          setConnectionStatus('error'); // Show error during retry
          
          reconnectTimeoutRef.current = setTimeout(() => {
            if (mountedRef.current && canReconnect) {
              connect();
            }
          }, delay);
        } else if (reconnectAttemptsRef.current >= maxReconnectAttempts) {
          // Graceful degradation - permanently failed
          console.log('🚫 Railway WebSocket max reconnection attempts reached - entering graceful degradation mode');
          setConnectionStatus('failed');
          setCanReconnect(false);
          
          // Create a proper Event object for the onError callback
          if (onError) {
            const errorEvent = new Event('error');
            (errorEvent as any).message = 'WebSocket connection permanently failed after maximum retry attempts';
            onError(errorEvent);
          }
        }
      };

      wsRef.current.onerror = (error) => {
        if (!mountedRef.current) return;
        
        console.error('❌ Railway WebSocket error occurred:', error);
        console.log('🔍 Railway WebSocket Debug - Connection state:', wsRef.current?.readyState);
        setConnectionStatus('error');
        onError?.(error);
      };

    } catch (error) {
      console.error('❌ Railway WebSocket connection failed:', error);
      console.log('🔍 Possible issues: Check Railway WebSocket endpoint, token validity, or CORS settings');
      setConnectionStatus('error');
    }
  }, [getWebSocketUrl, onConnect, onMessage, onDisconnect, onError, autoReconnect, maxReconnectAttempts, canReconnect, cleanupConnection, getBackoffDelay, startHealthCheck]);

  const disconnect = useCallback(() => {
    console.log('🔌 Railway WebSocket: Manual disconnect requested');
    setCanReconnect(false); // Prevent automatic reconnection
    cleanupConnection();
    setIsConnected(false);
    setConnectionStatus('disconnected');
  }, [cleanupConnection]);

  // Manual recovery function to reset failed connections
  const forceReconnect = useCallback(() => {
    console.log('🔄 Railway WebSocket: Force reconnect requested');
    reconnectAttemptsRef.current = 0;
    setCanReconnect(true);
    setConnectionStatus('disconnected');
    
    // Clean up and reconnect
    cleanupConnection();
    
    setTimeout(() => {
      if (mountedRef.current) {
        connect();
      }
    }, 1000);
  }, [cleanupConnection, connect]);

  const sendMessage = useCallback((message: any) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(message));
      return true;
    } else {
      console.warn('WebSocket is not connected. Message not sent:', message);
      return false;
    }
  }, []);

  const sendPing = useCallback(() => {
    return sendMessage({ type: 'ping', timestamp: new Date().toISOString() });
  }, [sendMessage]);

  // Initialize connection
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      connect();
    }

    return () => {
      mountedRef.current = false;
      cleanupConnection();
    };
  }, [connect, cleanupConnection]);

  // Ping to keep connection alive
  useEffect(() => {
    if (!isConnected) return;

    const pingInterval = setInterval(() => {
      sendPing();
    }, 30000); // Ping every 30 seconds

    return () => clearInterval(pingInterval);
  }, [isConnected, sendPing]);

  return {
    isConnected,
    connectionStatus,
    lastMessage,
    canReconnect,
    connect,
    disconnect,
    forceReconnect,
    sendMessage,
    sendPing,
    // Additional debugging info
    reconnectAttempts: reconnectAttemptsRef.current,
    maxAttempts: maxReconnectAttempts
  };
};