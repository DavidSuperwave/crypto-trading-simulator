import { useWebSocket } from './useWebSocket';
import { useCallback, useState } from 'react';

export interface ChatMessage {
  id: string;
  senderId: string;
  senderType: 'user' | 'admin';
  senderName: string;
  message: string;
  timestamp: string;
  isRead: boolean;
  recipientUserId?: string;
}

export interface DepositNotification {
  id: string;
  userId: string;
  amount: number;
  plan: string;
  method: string;
  status: string;
  userEmail: string;
  userName: string;
  createdAt: string;
  updatedAt?: string;
  notes?: string;
}

export interface WithdrawalNotification {
  id: string;
  userId: string;
  amount: number;
  method: string;
  status: string;
  userEmail: string;
  userName: string;
  createdAt: string;
  updatedAt?: string;
  notes?: string;
}

interface NotificationCallbacks {
  onNewChatMessage?: (message: ChatMessage) => void;
  onNewDeposit?: (deposit: DepositNotification) => void;
  onNewWithdrawal?: (withdrawal: WithdrawalNotification) => void;
  onDepositStatusUpdate?: (deposit: DepositNotification) => void;
  onWithdrawalStatusUpdate?: (withdrawal: WithdrawalNotification) => void;
  onUserTyping?: (user: { userId: string; userEmail: string }) => void;
}

export const useRealTimeNotifications = (callbacks: NotificationCallbacks = {}) => {
  const {
    onNewChatMessage,
    onNewDeposit,
    onNewWithdrawal,
    onDepositStatusUpdate,
    onWithdrawalStatusUpdate,
    onUserTyping
  } = callbacks;

  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const handleMessage = useCallback((message: any) => {
    console.log('📨 Real-time notification:', message);

    switch (message.type) {
      case 'connected':
        console.log('🔌 WebSocket connection established');
        break;

      case 'new_chat_message':
        if (message.message && onNewChatMessage) {
          onNewChatMessage(message.message);
          
          // Add to notifications list
          setNotifications(prev => [...prev, {
            id: Date.now().toString(),
            type: 'chat',
            title: `New message from ${message.message.senderName}`,
            message: message.message.message,
            timestamp: message.timestamp
          }]);
          
          setUnreadCount(prev => prev + 1);
        }
        break;

      case 'new_deposit':
        if (message.deposit && onNewDeposit) {
          onNewDeposit(message.deposit);
          
          // Add to notifications list
          setNotifications(prev => [...prev, {
            id: Date.now().toString(),
            type: 'deposit',
            title: 'New Deposit Request',
            message: `$${message.deposit.amount} from ${message.deposit.userEmail || 'User'}`,
            timestamp: message.timestamp
          }]);
          
          setUnreadCount(prev => prev + 1);
        }
        break;

      case 'new_withdrawal':
        if (message.withdrawal && onNewWithdrawal) {
          onNewWithdrawal(message.withdrawal);
          
          // Add to notifications list
          setNotifications(prev => [...prev, {
            id: Date.now().toString(),
            type: 'withdrawal',
            title: 'New Withdrawal Request',
            message: `$${message.withdrawal.amount} from ${message.withdrawal.userEmail || 'User'}`,
            timestamp: message.timestamp
          }]);
          
          setUnreadCount(prev => prev + 1);
        }
        break;

      case 'deposit_status_update':
        if (message.deposit && onDepositStatusUpdate) {
          onDepositStatusUpdate(message.deposit);
          
          // Add to notifications list
          setNotifications(prev => [...prev, {
            id: Date.now().toString(),
            type: 'deposit_update',
            title: `Deposit ${message.deposit.status}`,
            message: `Your deposit of $${message.deposit.amount} has been ${message.deposit.status}`,
            timestamp: message.timestamp
          }]);
        }
        break;

      case 'withdrawal_status_update':
        if (message.withdrawal && onWithdrawalStatusUpdate) {
          onWithdrawalStatusUpdate(message.withdrawal);
          
          // Add to notifications list
          setNotifications(prev => [...prev, {
            id: Date.now().toString(),
            type: 'withdrawal_update',
            title: `Withdrawal ${message.withdrawal.status}`,
            message: `Your withdrawal of $${message.withdrawal.amount} has been ${message.withdrawal.status}`,
            timestamp: message.timestamp
          }]);
        }
        break;

      case 'user_typing':
        if (message.userId && onUserTyping) {
          onUserTyping({
            userId: message.userId,
            userEmail: message.userEmail
          });
        }
        break;

      case 'pong':
        // Heartbeat response - no action needed
        break;

      default:
        console.log('Unknown notification type:', message.type);
    }
  }, [onNewChatMessage, onNewDeposit, onNewWithdrawal, onDepositStatusUpdate, onWithdrawalStatusUpdate, onUserTyping]);

  const { isConnected, connectionStatus, sendMessage } = useWebSocket({
    onMessage: handleMessage,
    onConnect: () => console.log('🟢 Real-time notifications connected'),
    onDisconnect: () => console.log('🔴 Real-time notifications disconnected'),
    onError: (error) => console.error('❌ Real-time notifications error:', error)
  });

  // Clear notification
  const clearNotification = useCallback((notificationId: string) => {
    setNotifications(prev => prev.filter(n => n.id !== notificationId));
    setUnreadCount(prev => Math.max(0, prev - 1));
  }, []);

  // Clear all notifications
  const clearAllNotifications = useCallback(() => {
    setNotifications([]);
    setUnreadCount(0);
  }, []);

  // Mark notifications as read
  const markAsRead = useCallback(() => {
    setUnreadCount(0);
  }, []);

  // Send typing indicator (for chat)
  const sendTypingIndicator = useCallback(() => {
    if (isConnected) {
      sendMessage({
        type: 'chat_typing',
        timestamp: new Date().toISOString()
      });
    }
  }, [isConnected, sendMessage]);

  return {
    // Connection status
    isConnected,
    connectionStatus,
    
    // Notifications
    notifications,
    unreadCount,
    
    // Actions
    clearNotification,
    clearAllNotifications,
    markAsRead,
    sendTypingIndicator,
    
    // WebSocket utilities
    sendMessage
  };
};