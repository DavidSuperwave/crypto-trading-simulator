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
    // Simplified polling - notifications handled by PendingRequestsWidget component
    // This hook now serves as a placeholder for future notification system
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      // For now, just update the state to show the system is working
      setState(prev => ({
        ...prev,
        notifications: [], // Empty for now - PendingRequestsWidget handles status updates
        unreadCount: 0,
        loading: false,
        error: null,
        lastUpdated: new Date()
      }));
    } catch (error) {
      console.error('Error in user polling:', error);
      setState(prev => ({
        ...prev,
        loading: false,
        error: null // Don't show error for missing endpoint
      }));
    }
  }, [onDepositStatusUpdate]);

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