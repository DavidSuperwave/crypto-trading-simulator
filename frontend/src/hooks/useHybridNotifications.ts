import { useState, useEffect, useCallback } from 'react';
import { useRealTimeNotifications } from './useRealTimeNotifications';
import { usePollingNotifications } from './usePollingNotifications';
import { DepositNotification, WithdrawalNotification, ChatMessage } from './useRealTimeNotifications';

interface HybridNotificationsOptions {
  onNewDeposit?: (deposit: DepositNotification) => void;
  onNewWithdrawal?: (withdrawal: WithdrawalNotification) => void;
  onDepositStatusUpdate?: (deposit: DepositNotification) => void;
  onWithdrawalStatusUpdate?: (withdrawal: WithdrawalNotification) => void;
  onNewChatMessage?: (message: ChatMessage) => void;
  fallbackDelay?: number; // milliseconds to wait before falling back to polling
}

export const useHybridNotifications = (options: HybridNotificationsOptions = {}) => {
  const { fallbackDelay = 5000, ...callbackOptions } = options;
  
  // Production Railway WebSocket bypass - skip WebSocket entirely on Railway
  const isRailwayProduction = window.location.hostname.includes('railway.app') || 
                             window.location.hostname.includes('crypto-trading-simulator-production');
  
  const [mode, setMode] = useState<'websocket' | 'polling' | 'attempting'>(
    isRailwayProduction ? 'polling' : 'attempting'
  );
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected' | 'error' | 'failed'>(
    isRailwayProduction ? 'connected' : 'connecting'
  );

  // Conditionally initialize WebSocket (skip on Railway production)
  const websocketNotifications = useRealTimeNotifications(isRailwayProduction ? {} : callbackOptions);
  
  // Polling system (always available)
  const pollingNotifications = usePollingNotifications({
    ...callbackOptions,
    pollInterval: 3000 // 3 second polling
  });

  // Monitor WebSocket connection and decide when to fallback
  useEffect(() => {
    if (isRailwayProduction) {
      // Production Railway: Skip WebSocket entirely, use polling only
      console.log('🚀 Railway Production: Using polling-only mode (WebSocket disabled)');
      setMode('polling');
      pollingNotifications.startPolling();
      return;
    }

    // Development/other environments: Normal WebSocket handling
    const { isConnected, connectionStatus: wsStatus } = websocketNotifications;
    
    setConnectionStatus(wsStatus);

    if (isConnected && wsStatus === 'connected') {
      // WebSocket is working
      setMode('websocket');
      pollingNotifications.stopPolling();
      console.log('🔌 Using WebSocket for real-time notifications');
    } else if (wsStatus === 'error' || wsStatus === 'disconnected' || wsStatus === 'failed') {
      // WebSocket failed, fallback to polling
      if (mode !== 'polling') {
        console.log('📊 WebSocket failed/disconnected, falling back to polling notifications');
        setMode('polling');
        pollingNotifications.startPolling();
      }
    }
  }, [isRailwayProduction, websocketNotifications.isConnected, websocketNotifications.connectionStatus, mode]); // Fixed: removed unstable pollingNotifications object reference

  // Automatic fallback timer (skip on Railway production)
  useEffect(() => {
    if (isRailwayProduction) {
      // Skip fallback timer on Railway production - already using polling-only mode
      return;
    }

    const fallbackTimer = setTimeout(() => {
      if (!websocketNotifications.isConnected) {
        // console.log(`📊 WebSocket connection timeout (${fallbackDelay}ms), falling back to polling`);
        setMode('polling');
        pollingNotifications.startPolling();
      }
    }, fallbackDelay);

    return () => clearTimeout(fallbackTimer);
  }, [isRailwayProduction, websocketNotifications.isConnected, fallbackDelay]); // Fixed: removed unstable pollingNotifications object reference

  const getStatusMessage = useCallback(() => {
    switch (mode) {
      case 'websocket':
        return 'Real-time (WebSocket)';
      case 'polling':
        if (isRailwayProduction) {
          return 'Real-time (Production Polling)';
        }
        return connectionStatus === 'failed' ? 'Real-time (Polling - WebSocket Failed)' : 'Real-time (Polling)';
      case 'attempting':
        return 'Connecting...';
      default:
        return 'Offline';
    }
  }, [mode, connectionStatus, isRailwayProduction]);

  return {
    mode,
    connectionStatus,
    isConnected: mode === 'websocket' ? websocketNotifications.isConnected : pollingNotifications.isPolling,
    statusMessage: getStatusMessage(),
    // Manual recovery for failed WebSocket connections
    forceReconnect: websocketNotifications.forceReconnect,
    canReconnect: websocketNotifications.canReconnect,
    // Expose both services for advanced usage
    websocket: websocketNotifications,
    polling: pollingNotifications
  };
};