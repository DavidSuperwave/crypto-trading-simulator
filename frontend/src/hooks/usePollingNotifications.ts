import { useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';
import { buildApiUrl, API_CONFIG } from '../config/api';
import { DepositNotification, WithdrawalNotification, ChatMessage } from './useRealTimeNotifications';

interface PollingNotificationsOptions {
  onNewDeposit?: (deposit: DepositNotification) => void;
  onNewWithdrawal?: (withdrawal: WithdrawalNotification) => void;
  onDepositStatusUpdate?: (deposit: DepositNotification) => void;
  onWithdrawalStatusUpdate?: (withdrawal: WithdrawalNotification) => void;
  onNewChatMessage?: (message: ChatMessage) => void;
  pollInterval?: number; // milliseconds
}

export const usePollingNotifications = (options: PollingNotificationsOptions = {}) => {
  const { 
    onNewDeposit, 
    onNewWithdrawal, 
    onDepositStatusUpdate, 
    onWithdrawalStatusUpdate, 
    onNewChatMessage,
    pollInterval = 3000 // 3 seconds default
  } = options;

  const [isPolling, setIsPolling] = useState(false);
  const [lastCheckTime, setLastCheckTime] = useState<Date>(new Date());
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const mountedRef = useRef(true);

  const getAuthHeaders = useCallback(() => {
    const token = localStorage.getItem('token');
    return token ? { Authorization: `Bearer ${token}` } : {};
  }, []);

  const checkForUpdates = useCallback(async () => {
    if (!mountedRef.current) return;

    try {
      const headers = getAuthHeaders();
      const checkTime = new Date();
      
      // Get current user to determine role
      const userResponse = await axios.get(buildApiUrl(API_CONFIG.ENDPOINTS.USER_PROFILE), { headers });
      const userRole = userResponse.data.user?.role;

      if (userRole === 'admin') {
        // Admin polling: Check for new deposits, withdrawals, and chat messages
        const [depositsResponse, withdrawalsResponse, chatResponse] = await Promise.allSettled([
          axios.get(buildApiUrl(API_CONFIG.ENDPOINTS.ADMIN_PENDING_DEPOSITS), { headers }),
          axios.get(buildApiUrl(API_CONFIG.ENDPOINTS.ADMIN_WITHDRAWALS), { headers }),
          axios.get(buildApiUrl('/chat/admin/conversations'), { headers })
        ]);

        // Check for new deposits
        if (depositsResponse.status === 'fulfilled') {
          const deposits = depositsResponse.value.data;
          const newDeposits = deposits.filter((d: any) => new Date(d.createdAt) > lastCheckTime);
          newDeposits.forEach((deposit: DepositNotification) => {
            console.log('📊 Polling: New deposit detected:', deposit);
            onNewDeposit?.(deposit);
          });
        }

        // Check for new withdrawals  
        if (withdrawalsResponse.status === 'fulfilled') {
          const withdrawals = withdrawalsResponse.value.data;
          const newWithdrawals = withdrawals.filter((w: any) => new Date(w.createdAt) > lastCheckTime);
          newWithdrawals.forEach((withdrawal: WithdrawalNotification) => {
            console.log('📊 Polling: New withdrawal detected:', withdrawal);
            onNewWithdrawal?.(withdrawal);
          });
        }

        // Check for new chat messages
        if (chatResponse.status === 'fulfilled') {
          const conversations = chatResponse.value.data;
          conversations.forEach((conv: any) => {
            if (conv.lastMessage && new Date(conv.lastMessage.timestamp) > lastCheckTime) {
              console.log('📊 Polling: New chat message detected:', conv.lastMessage);
              onNewChatMessage?.(conv.lastMessage);
            }
          });
        }

      } else {
        // User polling: Check for deposit/withdrawal status updates AND chat messages
        const [, , chatResponse] = await Promise.allSettled([
          axios.get(buildApiUrl(API_CONFIG.ENDPOINTS.USER_PENDING_DEPOSITS), { headers }),
          axios.get(buildApiUrl(API_CONFIG.ENDPOINTS.USER_WITHDRAWALS), { headers }),
          axios.get(buildApiUrl(API_CONFIG.ENDPOINTS.CHAT_MESSAGES), { headers })
        ]);

        // Check for new chat messages for users
        if (chatResponse.status === 'fulfilled') {
          const messages = chatResponse.value.data;
          const newMessages = messages.filter((msg: any) => new Date(msg.timestamp) > lastCheckTime);
          newMessages.forEach((message: ChatMessage) => {
            console.log('📊 Polling: New chat message detected (user):', message);
            onNewChatMessage?.(message);
          });
        }

        // Check for status updates (simplified - would need to track previous states)
        // console.log('📊 Polling: Checking for user status updates and chat messages');
      }

      setLastCheckTime(checkTime);

    } catch (error) {
      console.error('📊 Polling error:', error);
    }
  }, [lastCheckTime, getAuthHeaders, onNewDeposit, onNewWithdrawal, onNewChatMessage]);

  const startPolling = useCallback(() => {
    if (intervalRef.current) return; // Already polling

    // console.log(`📊 Starting polling notifications (interval: ${pollInterval}ms)`);
    setIsPolling(true);
    setLastCheckTime(new Date());
    
    intervalRef.current = setInterval(checkForUpdates, pollInterval);
  }, [pollInterval, checkForUpdates]);

  const stopPolling = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setIsPolling(false);
    // console.log('📊 Stopped polling notifications');
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    startPolling();

    return () => {
      mountedRef.current = false;
      stopPolling();
    };
  }, [startPolling, stopPolling]);

  return {
    isPolling,
    startPolling,
    stopPolling,
    lastCheckTime
  };
};