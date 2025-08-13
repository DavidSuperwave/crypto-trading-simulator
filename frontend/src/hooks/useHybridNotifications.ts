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
  const [mode, setMode] = useState<'websocket' | 'polling' | 'attempting'>('attempting');
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected' | 'error'>('connecting');

  // Try WebSocket first
  const websocketNotifications = useRealTimeNotifications(callbackOptions);
  
  // Polling fallback
  const pollingNotifications = usePollingNotifications({
    ...callbackOptions,
    pollInterval: 3000 // 3 second polling
  });

  // Monitor WebSocket connection and decide when to fallback
  useEffect(() => {
    const { isConnected, connectionStatus: wsStatus } = websocketNotifications;
    
    setConnectionStatus(wsStatus);

    if (isConnected && wsStatus === 'connected') {
      // WebSocket is working
      setMode('websocket');
      pollingNotifications.stopPolling();
      console.log('🔌 Using WebSocket for real-time notifications');
    } else if (wsStatus === 'error' || wsStatus === 'disconnected') {
      // WebSocket failed, fallback to polling
      if (mode !== 'polling') {
        // console.log('📊 WebSocket failed, falling back to polling notifications');
        setMode('polling');
        pollingNotifications.startPolling();
      }
    }
  }, [websocketNotifications.isConnected, websocketNotifications.connectionStatus, mode, pollingNotifications]);

  // Automatic fallback timer
  useEffect(() => {
    const fallbackTimer = setTimeout(() => {
      if (!websocketNotifications.isConnected) {
        // console.log(`📊 WebSocket connection timeout (${fallbackDelay}ms), falling back to polling`);
        setMode('polling');
        pollingNotifications.startPolling();
      }
    }, fallbackDelay);

    return () => clearTimeout(fallbackTimer);
  }, [websocketNotifications.isConnected, fallbackDelay, pollingNotifications]);

  const getStatusMessage = useCallback(() => {
    switch (mode) {
      case 'websocket':
        return 'Real-time (WebSocket)';
      case 'polling':
        return 'Real-time (Polling)';
      case 'attempting':
        return 'Connecting...';
      default:
        return 'Offline';
    }
  }, [mode]);

  return {
    mode,
    connectionStatus,
    isConnected: mode === 'websocket' ? websocketNotifications.isConnected : pollingNotifications.isPolling,
    statusMessage: getStatusMessage(),
    // Expose both services for advanced usage
    websocket: websocketNotifications,
    polling: pollingNotifications
  };
};