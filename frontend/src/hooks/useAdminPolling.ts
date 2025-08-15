import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { buildApiUrl } from '../config/api';

interface PendingDeposit {
  id: string;
  user_id: string;
  amount: number;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  user_email?: string;
}

interface AdminPollingState {
  pendingDeposits: PendingDeposit[];
  loading: boolean;
  error: string | null;
  lastUpdated: Date | null;
}

export const useAdminPolling = () => {
  const [state, setState] = useState<AdminPollingState>({
    pendingDeposits: [],
    loading: true,
    error: null,
    lastUpdated: null
  });

  const fetchPendingDeposits = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await axios.get(buildApiUrl('/admin/pending-deposits'), {
        headers: { Authorization: `Bearer ${token}` }
      });

      setState(prev => ({
        ...prev,
        pendingDeposits: response.data.pendingDeposits || [],
        loading: false,
        error: null,
        lastUpdated: new Date()
      }));
    } catch (error) {
      console.error('Error fetching pending deposits:', error);
      setState(prev => ({
        ...prev,
        loading: false,
        error: 'Failed to fetch pending deposits'
      }));
    }
  }, []);

  // Initial fetch and polling setup
  useEffect(() => {
    // Fetch immediately
    fetchPendingDeposits();

    // Set up polling every 2 minutes
    const interval = setInterval(fetchPendingDeposits, 2 * 60 * 1000);

    return () => clearInterval(interval);
  }, [fetchPendingDeposits]);

  const approveDeposit = useCallback(async (depositId: string) => {
    try {
      const token = localStorage.getItem('token');
      await axios.post(
        buildApiUrl(`/admin/deposits/${depositId}/approve`),
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      // Immediately refresh data
      fetchPendingDeposits();
      
      return { success: true };
    } catch (error) {
      console.error('Error approving deposit:', error);
      return { success: false, error: 'Failed to approve deposit' };
    }
  }, [fetchPendingDeposits]);

  const rejectDeposit = useCallback(async (depositId: string) => {
    try {
      const token = localStorage.getItem('token');
      await axios.post(
        buildApiUrl(`/admin/deposits/${depositId}/reject`),
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      // Immediately refresh data
      fetchPendingDeposits();
      
      return { success: true };
    } catch (error) {
      console.error('Error rejecting deposit:', error);
      return { success: false, error: 'Failed to reject deposit' };
    }
  }, [fetchPendingDeposits]);

  return {
    ...state,
    approveDeposit,
    rejectDeposit,
    refresh: fetchPendingDeposits
  };
};