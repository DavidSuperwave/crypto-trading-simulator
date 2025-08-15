import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { buildApiUrl } from '../config/api';

interface UserNotification {
  id: string;
  type: 'deposit_approved' | 'deposit_rejected' | 'withdrawal_processed';
  message: string;
  timestamp: string;
  read: boolean;
}

interface UserPollingState {
  notifications: UserNotification[];
  unreadCount: number;
  loading: boolean;
  error: string | null;
  lastUpdated: Date | null;
}

export const useUserPolling = (onDepositStatusUpdate?: (deposit: any) => void) => {
  const [state, setState] = useState<UserPollingState>({
    notifications: [],
    unreadCount: 0,
    loading: true,
    error: null,
    lastUpdated: null
  });

  const fetchNotifications = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await axios.get(buildApiUrl('/user/notifications'), {
        headers: { Authorization: `Bearer ${token}` }
      });

      const notifications = response.data.notifications || [];
      const unreadCount = notifications.filter((n: UserNotification) => !n.read).length;

      // Check for new deposit status updates
      const previousNotifications = state.notifications;
      const newDepositNotifications = notifications.filter((n: UserNotification) => 
        (n.type === 'deposit_approved' || n.type === 'deposit_rejected') &&
        !previousNotifications.some(prev => prev.id === n.id)
      );

      // Trigger callback for new deposit updates
      if (onDepositStatusUpdate && newDepositNotifications.length > 0) {
        newDepositNotifications.forEach((notification: UserNotification) => {
          // Show browser notification if permitted
          if (Notification.permission === 'granted') {
            new Notification(
              notification.type === 'deposit_approved' ? 'Deposit Approved! 🎉' : 'Deposit Update',
              {
                body: notification.message,
                icon: '/favicon.ico'
              }
            );
          }

          // Call the callback with deposit info
          onDepositStatusUpdate({
            status: notification.type === 'deposit_approved' ? 'approved' : 'rejected',
            message: notification.message
          });
        });
      }

      setState(prev => ({
        ...prev,
        notifications,
        unreadCount,
        loading: false,
        error: null,
        lastUpdated: new Date()
      }));
    } catch (error) {
      console.error('Error fetching notifications:', error);
      setState(prev => ({
        ...prev,
        loading: false,
        error: 'Failed to fetch notifications'
      }));
    }
  }, [state.notifications, onDepositStatusUpdate]);

  // Initial fetch and polling setup
  useEffect(() => {
    // Fetch immediately
    fetchNotifications();

    // Set up polling every 2 minutes
    const interval = setInterval(fetchNotifications, 2 * 60 * 1000);

    return () => clearInterval(interval);
  }, [fetchNotifications]);

  const markAsRead = useCallback(async (notificationId?: string) => {
    try {
      const token = localStorage.getItem('token');
      const url = notificationId 
        ? buildApiUrl(`/user/notifications/${notificationId}/read`)
        : buildApiUrl('/user/notifications/read-all');
        
      await axios.post(url, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Immediately refresh data
      fetchNotifications();
    } catch (error) {
      console.error('Error marking notifications as read:', error);
    }
  }, [fetchNotifications]);

  const clearNotification = useCallback((notificationId: string) => {
    setState(prev => ({
      ...prev,
      notifications: prev.notifications.filter(n => n.id !== notificationId),
      unreadCount: Math.max(0, prev.unreadCount - 1)
    }));
  }, []);

  return {
    ...state,
    markAsRead,
    clearNotification,
    refresh: fetchNotifications
  };
};