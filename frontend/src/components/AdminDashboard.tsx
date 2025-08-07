import React, { useState, useEffect } from 'react';
import { Users, DollarSign, Download, BarChart3, Check, X, Eye, Upload, MessageCircle } from 'lucide-react';
import AdminSidebar from './AdminSidebar';
import axios from 'axios';
import { buildApiUrl, API_CONFIG } from '../config/api';
import { useAuth } from '../context/AuthContext';
import { useHybridNotifications } from '../hooks/useHybridNotifications';
import { DepositNotification, WithdrawalNotification, ChatMessage } from '../hooks/useRealTimeNotifications';
import ConnectionStatus from './ConnectionStatus';
import NotificationBadge from './NotificationBadge';
import WebSocketDebug from './WebSocketDebug';

interface User {
  id: string;
  email: string;
  role: string;
  balance: number;
  totalInterest: number;
  createdAt: string;
}

interface Transaction {
  id: string;
  type: string;
  amount: number;
  userId: string;
  status: string;
  createdAt: string;
  description?: string;
}

// Use shared type from useRealTimeNotifications hook  
type Withdrawal = WithdrawalNotification;

interface Demo {
  id: string;
  name: string;
  email: string;
  company: string;
  phone: string;
  message: string;
  status: string;
  createdAt: string;
}

// Use shared type from useRealTimeNotifications hook
type PendingDeposit = DepositNotification;

interface ChatConversation {
  userId: string;
  userName: string;
  userEmail: string;
  messages: ChatMessage[];
  lastMessage: ChatMessage | null;
  unreadCount: number;
}

// Use shared type from useRealTimeNotifications hook
// (Local ChatMessage interface removed - using shared type)

interface DashboardOverview {
  totalUsers: number;
  totalBalance: string;
  pendingWithdrawals: number;
  pendingDemos: number;
  pendingDeposits: number;
  totalTransactions: number;
  dailySignups: number;
  weeklySignups: number;
  pendingMessages: number;
}

const AdminDashboard: React.FC = () => {
  const { user } = useAuth();
  const [overview, setOverview] = useState<DashboardOverview | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [demos, setDemos] = useState<Demo[]>([]);
  const [pendingDeposits, setPendingDeposits] = useState<PendingDeposit[]>([]);
  const [chatConversations, setChatConversations] = useState<ChatConversation[]>([]);
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [selectedChatUser, setSelectedChatUser] = useState<string | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [showCreateUserForm, setShowCreateUserForm] = useState(false);
  const [newUserData, setNewUserData] = useState({
    email: '',
    password: '',
    role: 'user'
  });

  // Notification state
  const [unreadCount, setUnreadCount] = useState(0);
  
  const clearNotification = (id: string) => {
    // Simple implementation - just decrement count
    setUnreadCount(prev => Math.max(0, prev - 1));
  };

  // Hybrid real-time notifications (WebSocket with polling fallback)
  const { mode, connectionStatus, isConnected, statusMessage } = useHybridNotifications({
    onNewDeposit: (deposit) => {
      console.log(`💰 New deposit request (${mode}):`, deposit);
      setPendingDeposits(prev => [deposit, ...prev]);
      setUnreadCount(prev => prev + 1);
      
      // Show browser notification if permission granted
      if (Notification.permission === 'granted') {
        new Notification('New Deposit Request', {
          body: `$${deposit.amount} from ${deposit.userEmail || 'User'}`,
          icon: '/favicon.ico'
        });
      }
    },
    onNewWithdrawal: (withdrawal) => {
      console.log(`💸 New withdrawal request (${mode}):`, withdrawal);
      setWithdrawals(prev => [withdrawal, ...prev]);
      setUnreadCount(prev => prev + 1);
      
      // Show browser notification if permission granted
      if (Notification.permission === 'granted') {
        new Notification('New Withdrawal Request', {
          body: `$${withdrawal.amount} from ${withdrawal.userEmail || 'User'}`,
          icon: '/favicon.ico'
        });
      }
    },
    onNewChatMessage: (message) => {
      console.log(`💬 New chat message from user (${mode}):`, message);
      
      // Update chat conversations with new message
      setChatConversations(prev => {
        const updated = prev.map(conv => {
          if (conv.userId === message.senderId) {
            return {
              ...conv,
              lastMessage: message,
              unreadCount: conv.unreadCount + 1
            };
          }
          return conv;
        });
        
        // If conversation doesn't exist, it will be handled by next dashboard refresh
        return updated;
      });
      setUnreadCount(prev => prev + 1);
      
      // Show browser notification if permission granted
      if (Notification.permission === 'granted') {
        new Notification('New Chat Message', {
          body: `${message.senderName}: ${message.message}`,
          icon: '/favicon.ico'
        });
      }
    }
  });

  // Request notification permission on component mount
  useEffect(() => {
    if (Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  // Helper function to get auth headers
  const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    return {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    };
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        console.error('No authentication token found');
        return;
      }

      const authHeaders = getAuthHeaders();

      const [overviewRes, usersRes, transactionsRes, withdrawalsRes, demosRes, pendingDepositsRes, chatRes] = await Promise.all([
        axios.get(buildApiUrl(API_CONFIG.ENDPOINTS.ADMIN_DASHBOARD), authHeaders),
        axios.get(buildApiUrl(API_CONFIG.ENDPOINTS.ADMIN_USERS), authHeaders),
        axios.get(buildApiUrl(API_CONFIG.ENDPOINTS.ADMIN_TRANSACTIONS), authHeaders),
        axios.get(buildApiUrl(API_CONFIG.ENDPOINTS.ADMIN_WITHDRAWALS), authHeaders),
        axios.get(buildApiUrl(API_CONFIG.ENDPOINTS.ADMIN_DEMOS), authHeaders),
        axios.get(buildApiUrl(API_CONFIG.ENDPOINTS.ADMIN_PENDING_DEPOSITS), authHeaders),
        axios.get(buildApiUrl(API_CONFIG.ENDPOINTS.CHAT_ADMIN_CONVERSATIONS), authHeaders)
      ]);

      setOverview(overviewRes.data.overview);
      setUsers(usersRes.data);
      setTransactions(transactionsRes.data);
      setWithdrawals(withdrawalsRes.data);
      setDemos(demosRes.data);
      setPendingDeposits(pendingDepositsRes.data.pendingDeposits || []);
      setChatConversations(chatRes.data.conversations || []);
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    }
  };

  const handleWithdrawalUpdate = async (withdrawalId: string, status: string) => {
    setLoading(true);
    try {
      await axios.put(`${buildApiUrl(API_CONFIG.ENDPOINTS.ADMIN_WITHDRAWALS)}/${withdrawalId}`, { status }, getAuthHeaders());
      fetchDashboardData();
      alert(`Withdrawal ${status} successfully!`);
    } catch (error) {
      alert(`Failed to ${status} withdrawal. Please try again.`);
    } finally {
      setLoading(false);
    }
  };

  const handleDemoUpdate = async (demoId: string, status: string, notes: string = '') => {
    setLoading(true);
    try {
      await axios.put(`${buildApiUrl(API_CONFIG.ENDPOINTS.ADMIN_DEMOS)}/${demoId}`, { status, notes }, getAuthHeaders());
      fetchDashboardData();
      alert(`Demo request ${status} successfully!`);
    } catch (error) {
      alert(`Failed to update demo request. Please try again.`);
    } finally {
      setLoading(false);
    }
  };

  const handleDepositUpdate = async (depositId: string, action: 'approve' | 'reject', notes: string = '') => {
    setLoading(true);
    try {
      await axios.put(`${buildApiUrl(API_CONFIG.ENDPOINTS.ADMIN_PENDING_DEPOSITS)}/${depositId}/${action}`, { notes }, getAuthHeaders());
      fetchDashboardData();
      alert(`Deposit ${action}d successfully!`);
    } catch (error) {
      alert(`Failed to ${action} deposit. Please try again.`);
    } finally {
      setLoading(false);
    }
  };

  const handleSendChatMessage = async (userId: string) => {
    if (!newMessage.trim()) return;
    
    setLoading(true);
    try {
      await axios.post(buildApiUrl(API_CONFIG.ENDPOINTS.CHAT_ADMIN_SEND), {
        message: newMessage,
        recipientUserId: userId
      }, getAuthHeaders());
      setNewMessage('');
      fetchDashboardData();
    } catch (error) {
      alert('Failed to send message. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUser = async () => {
    if (!newUserData.email || !newUserData.password) {
      alert('Email and password are required');
      return;
    }

    setLoading(true);
    try {
      await axios.post(buildApiUrl(API_CONFIG.ENDPOINTS.ADMIN_USERS), newUserData, getAuthHeaders());
      setNewUserData({ email: '', password: '', role: 'user' });
      setShowCreateUserForm(false);
      fetchDashboardData();
      alert('User created successfully!');
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || 'Failed to create user';
      alert(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async (userId: string, userEmail: string) => {
    if (window.confirm(`Are you sure you want to delete user "${userEmail}"? This action cannot be undone.`)) {
      setLoading(true);
      try {
        await axios.delete(`${buildApiUrl(API_CONFIG.ENDPOINTS.ADMIN_USERS)}/${userId}`, getAuthHeaders());
        fetchDashboardData();
        alert('User deleted successfully!');
      } catch (error: any) {
        const errorMessage = error.response?.data?.error || 'Failed to delete user';
        alert(errorMessage);
      } finally {
        setLoading(false);
      }
    }
  };

  const formatCurrency = (amount: number | string | null | undefined) => {
    const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
    return `$${(numAmount || 0).toFixed(2)}`;
  };
  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return isNaN(date.getTime()) ? 'N/A' : date.toLocaleDateString();
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      pending: { background: '#fef3c7', color: '#d97706' },
      approved: { background: '#dcfce7', color: '#166534' },
      rejected: { background: '#fee2e2', color: '#dc2626' },
      completed: { background: '#dcfce7', color: '#166534' },
      requested: { background: '#dbeafe', color: '#1d4ed8' },
      scheduled: { background: '#e0e7ff', color: '#3730a3' },
      cancelled: { background: '#fee2e2', color: '#dc2626' }
    };

    const style = styles[status as keyof typeof styles] || styles.pending;

    return (
      <span style={{ 
        ...style,
        padding: '4px 8px', 
        borderRadius: '4px', 
        fontSize: '0.8rem',
        fontWeight: '500'
      }}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  if (!overview) {
    return (
      <div style={{ 
        minHeight: '100vh', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        background: '#f8fafc'
      }}>
        <div style={{ color: '#000', fontSize: '1.2rem' }}>Loading dashboard...</div>
      </div>
    );
  }

  return (
    <div style={{
      display: 'flex',
      minHeight: '100vh',
      fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    }}>
      {/* Sidebar */}
      <AdminSidebar activeView={activeTab} onViewChange={setActiveTab} />
      
      {/* Main Content Area */}
      <div style={{
        flex: 1,
        background: '#f8fafc',
        minHeight: '100vh',
        paddingLeft: '280px' // Account for fixed sidebar width
      }}>
        <div style={{
          padding: '2rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '2rem'
        }}>
          {/* Header Section */}
          <div style={{
            background: 'white',
            borderRadius: '20px',
            padding: '2rem',
            boxShadow: '0 4px 6px rgba(0,0,0,0.05)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <BarChart3 size={32} style={{ color: '#667eea' }} />
              <div>
                <h1 style={{
                  margin: 0,
                  color: '#1F2937',
                  fontSize: '2.5rem',
                  fontWeight: '800'
                }}>
                  {activeTab === 'overview' && 'Dashboard Overview'}
                  {activeTab === 'users' && 'User Management'}
                  {activeTab === 'pending-deposits' && 'Pending Deposits'}
                  {activeTab === 'withdrawals' && 'Withdrawal Requests'}
                  {activeTab === 'chat' && 'Chat Management'}
                  {activeTab === 'demos' && 'Demo Requests'}
                  {activeTab === 'transactions' && 'All Transactions'}
                </h1>
                <p style={{
                  color: '#000',
                  margin: 0,
                  fontSize: '1rem'
                }}>
                  {activeTab === 'overview' && 'System overview and key metrics'}
                  {activeTab === 'users' && 'Manage user accounts and permissions'}
                  {activeTab === 'pending-deposits' && 'Review and approve deposit requests'}
                  {activeTab === 'withdrawals' && 'Process withdrawal requests'}
                  {activeTab === 'chat' && 'Monitor and respond to user conversations'}
                  {activeTab === 'demos' && 'Review demo access requests'}
                  {activeTab === 'transactions' && 'View all platform transactions'}
                </p>
              </div>
            </div>
            
            {/* Status Indicators */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '0.5rem',
                padding: '0.5rem 1rem',
                background: isConnected ? '#dcfce7' : '#fee2e2',
                border: `1px solid ${isConnected ? '#16a34a' : '#dc2626'}`,
                borderRadius: '9999px',
                fontSize: '0.75rem',
                fontWeight: '500',
                color: isConnected ? '#16a34a' : '#dc2626'
              }}>
                <div style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  backgroundColor: isConnected ? '#16a34a' : '#dc2626'
                }}></div>
                {statusMessage}
              </div>
              <NotificationBadge 
                count={unreadCount} 
                onClick={() => console.log('Show notifications panel')}
                size="lg"
              />
            </div>
          </div>

        {/* Overview Cards - Only show on overview tab */}
        {activeTab === 'overview' && (
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
          gap: '1.5rem',
          marginBottom: '2rem'
        }}>
          <div style={{ background: 'white', padding: '1.5rem', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
              <Users size={20} style={{ color: '#667eea' }} />
              <span style={{ fontSize: '0.9rem', color: '#000' }}>Total Users</span>
            </div>
            <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#000' }}>
              {overview.totalUsers}
            </div>
          </div>

          <div style={{ background: 'white', padding: '1.5rem', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
              <DollarSign size={20} style={{ color: '#10b981' }} />
              <span style={{ fontSize: '0.9rem', color: '#000' }}>Total Balance</span>
            </div>
            <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#000' }}>
              ${overview.totalBalance}
            </div>
          </div>

          <div style={{ background: 'white', padding: '1.5rem', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
              <Download size={20} style={{ color: '#f59e0b' }} />
              <span style={{ fontSize: '0.9rem', color: '#000' }}>Pending Withdrawals</span>
            </div>
            <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#000' }}>
              {overview.pendingWithdrawals}
            </div>
          </div>

          <div style={{ background: 'white', padding: '1.5rem', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
              <BarChart3 size={20} style={{ color: '#8b5cf6' }} />
              <span style={{ fontSize: '0.9rem', color: '#000' }}>Demo Requests</span>
            </div>
            <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#000' }}>
              {overview.pendingDemos}
            </div>
          </div>

          <div style={{ background: 'white', padding: '1.5rem', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
              <Upload size={20} style={{ color: '#06b6d4' }} />
              <span style={{ fontSize: '0.9rem', color: '#000' }}>Pending Deposits</span>
            </div>
            <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#000' }}>
              {overview.pendingDeposits || 0}
            </div>
          </div>

          <div style={{ background: 'white', padding: '1.5rem', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
              <Users size={20} style={{ color: '#f59e0b' }} />
              <span style={{ fontSize: '0.9rem', color: '#000' }}>Daily Signups</span>
            </div>
            <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#000' }}>
              {overview.dailySignups || 0}
            </div>
          </div>

          <div style={{ background: 'white', padding: '1.5rem', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
              <Users size={20} style={{ color: '#10b981' }} />
              <span style={{ fontSize: '0.9rem', color: '#000' }}>Weekly Signups</span>
            </div>
            <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#000' }}>
              {overview.weeklySignups || 0}
            </div>
          </div>

          <div style={{ background: 'white', padding: '1.5rem', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
              <MessageCircle size={20} style={{ color: '#ef4444' }} />
              <span style={{ fontSize: '0.9rem', color: '#000' }}>Pending Messages</span>
            </div>
            <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#000' }}>
              {overview.pendingMessages || 0}
            </div>
          </div>
        </div>
        )}

          {/* Tab Content */}
        <div style={{ 
          background: 'white', 
          padding: '2rem', 
          borderRadius: '16px', 
          boxShadow: '0 4px 6px rgba(0,0,0,0.1)' 
        }}>
          {activeTab === 'overview' && (
            <div>
              <h3 style={{ color: '#000', marginBottom: '1.5rem' }}>System Overview</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>
                <div>
                  <h4 style={{ color: '#000', marginBottom: '1rem' }}>Recent Activity</h4>
                  <div>
                    <p style={{ color: '#000', margin: '0.5rem 0' }}>
                      • {overview.totalTransactions} total transactions processed
                    </p>
                    <p style={{ color: '#000', margin: '0.5rem 0' }}>
                      • {withdrawals.filter(w => w.status === 'pending').length} withdrawal requests pending review
                    </p>
                    <p style={{ color: '#000', margin: '0.5rem 0' }}>
                      • {demos.filter(d => d.status === 'requested').length} new demo requests
                    </p>
                    <p style={{ color: '#000', margin: '0.5rem 0' }}>
                      • {users.filter(u => u.role === 'user').length} active user accounts
                    </p>
                  </div>
                </div>
                <div>
                  <h4 style={{ color: '#000', marginBottom: '1rem' }}>System Health</h4>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', margin: '0.5rem 0' }}>
                      <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981' }}></div>
                      <span style={{ color: '#000' }}>API Status: Online</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', margin: '0.5rem 0' }}>
                      <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981' }}></div>
                      <span style={{ color: '#000' }}>Database: Connected</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', margin: '0.5rem 0' }}>
                      <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981' }}></div>
                      <span style={{ color: '#000' }}>Trading Engine: Active</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'users' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h3 style={{ color: '#000', margin: 0 }}>User Management</h3>
                <button
                  onClick={() => setShowCreateUserForm(!showCreateUserForm)}
                  style={{
                    background: '#10b981',
                    color: 'white',
                    border: 'none',
                    padding: '10px 20px',
                    borderRadius: '8px',
                    fontSize: '0.9rem',
                    fontWeight: '600',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                  }}
                >
                  <Users size={16} />
                  {showCreateUserForm ? 'Cancel' : 'Create New User'}
                </button>
              </div>

              {/* Create User Form */}
              {showCreateUserForm && (
                <div style={{
                  background: '#f8fafc',
                  padding: '1.5rem',
                  borderRadius: '12px',
                  marginBottom: '1.5rem',
                  border: '1px solid #e5e7eb'
                }}>
                  <h4 style={{ color: '#000', marginBottom: '1rem' }}>Create New User</h4>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                    <div>
                      <label style={{ display: 'block', marginBottom: '0.5rem', color: '#000', fontSize: '0.9rem' }}>
                        Email Address
                      </label>
                      <input
                        type="email"
                        value={newUserData.email}
                        onChange={(e) => setNewUserData({ ...newUserData, email: e.target.value })}
                        placeholder="user@example.com"
                        style={{
                          width: '100%',
                          padding: '0.75rem',
                          border: '1px solid #d1d5db',
                          borderRadius: '6px',
                          fontSize: '0.9rem'
                        }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', marginBottom: '0.5rem', color: '#000', fontSize: '0.9rem' }}>
                        Password
                      </label>
                      <input
                        type="password"
                        value={newUserData.password}
                        onChange={(e) => setNewUserData({ ...newUserData, password: e.target.value })}
                        placeholder="Enter password"
                        style={{
                          width: '100%',
                          padding: '0.75rem',
                          border: '1px solid #d1d5db',
                          borderRadius: '6px',
                          fontSize: '0.9rem'
                        }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', marginBottom: '0.5rem', color: '#000', fontSize: '0.9rem' }}>
                        Role
                      </label>
                      <select
                        value={newUserData.role}
                        onChange={(e) => setNewUserData({ ...newUserData, role: e.target.value })}
                        style={{
                          width: '100%',
                          padding: '0.75rem',
                          border: '1px solid #d1d5db',
                          borderRadius: '6px',
                          fontSize: '0.9rem'
                        }}
                      >
                        <option value="user">User</option>
                        <option value="admin">Admin</option>
                      </select>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '0.75rem' }}>
                    <button
                      onClick={handleCreateUser}
                      disabled={loading || !newUserData.email || !newUserData.password}
                      style={{
                        background: '#667eea',
                        color: 'white',
                        border: 'none',
                        padding: '0.75rem 1.5rem',
                        borderRadius: '6px',
                        fontSize: '0.9rem',
                        fontWeight: '600',
                        cursor: loading ? 'not-allowed' : 'pointer',
                        opacity: loading ? 0.6 : 1
                      }}
                    >
                      {loading ? 'Creating...' : 'Create User'}
                    </button>
                    <button
                      onClick={() => {
                        setShowCreateUserForm(false);
                        setNewUserData({ email: '', password: '', role: 'user' });
                      }}
                      style={{
                        background: '#6b7280',
                        color: 'white',
                        border: 'none',
                        padding: '0.75rem 1.5rem',
                        borderRadius: '6px',
                        fontSize: '0.9rem',
                        fontWeight: '600',
                        cursor: 'pointer'
                      }}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ background: 'white' }}>
                      <th style={{ padding: '12px', textAlign: 'left', color: '#000' }}>Email</th>
                      <th style={{ padding: '12px', textAlign: 'left', color: '#000' }}>Role</th>
                      <th style={{ padding: '12px', textAlign: 'left', color: '#000' }}>Balance</th>
                      <th style={{ padding: '12px', textAlign: 'left', color: '#000' }}>Total Interest</th>
                      <th style={{ padding: '12px', textAlign: 'left', color: '#000' }}>Joined</th>
                      <th style={{ padding: '12px', textAlign: 'left', color: '#000' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((user) => (
                      <tr key={user.id} style={{ borderBottom: '1px solid #eee' }}>
                        <td style={{ padding: '12px', fontWeight: '600', color: '#000' }}>{user.email}</td>
                        <td style={{ padding: '12px' }}>
                          <span style={{
                            background: user.role === 'admin' ? '#dbeafe' : '#f3f4f6',
                            color: user.role === 'admin' ? '#1d4ed8' : '#374151',
                            padding: '4px 8px',
                            borderRadius: '4px',
                            fontSize: '0.8rem'
                          }}>
                            {user.role}
                          </span>
                        </td>
                        <td style={{ padding: '12px', fontWeight: '600', color: '#000' }}>
                          {formatCurrency(user.balance)}
                        </td>
                        <td style={{ padding: '12px', color: '#10b981', fontWeight: '600' }}>
                          {formatCurrency(user.totalInterest)}
                        </td>
                        <td style={{ padding: '12px', color: '#000' }}>
                          {formatDate(user.createdAt)}
                        </td>
                        <td style={{ padding: '12px' }}>
                          <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <button
                              onClick={() => setSelectedUser(user)}
                              style={{
                                background: '#667eea',
                                color: 'white',
                                border: 'none',
                                padding: '6px 12px',
                                borderRadius: '4px',
                                fontSize: '0.8rem',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.25rem'
                              }}
                            >
                              <Eye size={12} />
                              View
                            </button>
                            <button
                              onClick={() => handleDeleteUser(user.id, user.email)}
                              disabled={loading}
                              style={{
                                background: '#ef4444',
                                color: 'white',
                                border: 'none',
                                padding: '6px 12px',
                                borderRadius: '4px',
                                fontSize: '0.8rem',
                                cursor: loading ? 'not-allowed' : 'pointer',
                                opacity: loading ? 0.6 : 1,
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.25rem'
                              }}
                            >
                              <X size={12} />
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'pending-deposits' && (
            <div>
              <h3 style={{ color: '#000', marginBottom: '1.5rem' }}>Pending Deposits</h3>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ background: '#f8fafc' }}>
                      <th style={{ padding: '12px', textAlign: 'left', color: '#000' }}>User</th>
                      <th style={{ padding: '12px', textAlign: 'left', color: '#000' }}>Amount</th>
                      <th style={{ padding: '12px', textAlign: 'left', color: '#000' }}>Plan</th>
                      <th style={{ padding: '12px', textAlign: 'left', color: '#000' }}>Method</th>
                      <th style={{ padding: '12px', textAlign: 'left', color: '#000' }}>Status</th>
                      <th style={{ padding: '12px', textAlign: 'left', color: '#000' }}>Date</th>
                      <th style={{ padding: '12px', textAlign: 'left', color: '#000' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pendingDeposits.map((deposit) => (
                      <tr key={deposit.id} style={{ borderBottom: '1px solid #eee' }}>
                        <td style={{ padding: '12px', fontWeight: '600' }}>
                          {deposit.userEmail}
                        </td>
                        <td style={{ padding: '12px', fontWeight: '600', color: '#10b981' }}>
                          ${deposit.amount.toLocaleString()}
                        </td>
                        <td style={{ padding: '12px', textTransform: 'capitalize' }}>
                          {deposit.plan}
                        </td>
                        <td style={{ padding: '12px', textTransform: 'capitalize' }}>
                          {deposit.method}
                        </td>
                        <td style={{ padding: '12px' }}>
                          {getStatusBadge(deposit.status)}
                        </td>
                        <td style={{ padding: '12px', color: '#000' }}>
                          {formatDate(deposit.createdAt)}
                        </td>
                        <td style={{ padding: '12px' }}>
                          {deposit.status === 'pending' && (
                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                              <button
                                onClick={() => handleDepositUpdate(deposit.id, 'approve')}
                                disabled={loading}
                                style={{
                                  background: '#10b981',
                                  color: 'white',
                                  border: 'none',
                                  padding: '6px 12px',
                                  borderRadius: '4px',
                                  fontSize: '0.8rem',
                                  cursor: 'pointer',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '0.25rem'
                                }}
                              >
                                <Check size={12} />
                                Approve
                              </button>
                              <button
                                onClick={() => handleDepositUpdate(deposit.id, 'reject')}
                                disabled={loading}
                                style={{
                                  background: '#ef4444',
                                  color: 'white',
                                  border: 'none',
                                  padding: '6px 12px',
                                  borderRadius: '4px',
                                  fontSize: '0.8rem',
                                  cursor: 'pointer',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '0.25rem'
                                }}
                              >
                                <X size={12} />
                                Reject
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {pendingDeposits.length === 0 && (
                  <p style={{ textAlign: 'center', color: '#000', padding: '2rem' }}>
                    No pending deposits at this time.
                  </p>
                )}
              </div>
            </div>
          )}

          {activeTab === 'withdrawals' && (
            <div>
              <h3 style={{ color: '#000', marginBottom: '1.5rem' }}>Withdrawal Requests</h3>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ background: '#f8fafc' }}>
                      <th style={{ padding: '12px', textAlign: 'left', color: '#000' }}>User</th>
                      <th style={{ padding: '12px', textAlign: 'left', color: '#000' }}>Amount</th>
                      <th style={{ padding: '12px', textAlign: 'left', color: '#000' }}>Status</th>
                      <th style={{ padding: '12px', textAlign: 'left', color: '#000' }}>Date</th>
                      <th style={{ padding: '12px', textAlign: 'left', color: '#000' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {withdrawals.map((withdrawal) => {
                      const user = users.find(u => u.id === withdrawal.userId);
                      return (
                        <tr key={withdrawal.id} style={{ borderBottom: '1px solid #eee' }}>
                          <td style={{ padding: '12px', fontWeight: '600' }}>
                            {user?.email || 'Unknown User'}
                          </td>
                          <td style={{ padding: '12px', fontWeight: '600' }}>
                            {formatCurrency(withdrawal.amount)}
                          </td>
                          <td style={{ padding: '12px' }}>
                            {getStatusBadge(withdrawal.status)}
                          </td>
                          <td style={{ padding: '12px', color: '#000' }}>
                            {formatDate(withdrawal.createdAt)}
                          </td>
                          <td style={{ padding: '12px' }}>
                            {withdrawal.status === 'pending' && (
                              <div style={{ display: 'flex', gap: '0.5rem' }}>
                                <button
                                  onClick={() => handleWithdrawalUpdate(withdrawal.id, 'approved')}
                                  disabled={loading}
                                  style={{
                                    background: '#10b981',
                                    color: 'white',
                                    border: 'none',
                                    padding: '6px 12px',
                                    borderRadius: '4px',
                                    fontSize: '0.8rem',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.25rem'
                                  }}
                                >
                                  <Check size={12} />
                                  Approve
                                </button>
                                <button
                                  onClick={() => handleWithdrawalUpdate(withdrawal.id, 'rejected')}
                                  disabled={loading}
                                  style={{
                                    background: '#ef4444',
                                    color: 'white',
                                    border: 'none',
                                    padding: '6px 12px',
                                    borderRadius: '4px',
                                    fontSize: '0.8rem',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.25rem'
                                  }}
                                >
                                  <X size={12} />
                                  Reject
                                </button>
                              </div>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'chat' && (
            <div>
              <h3 style={{ color: '#000', marginBottom: '1.5rem' }}>Chat Management</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '2rem', height: '600px' }}>
                {/* Conversations List */}
                <div style={{ 
                  border: '1px solid #e5e7eb', 
                  borderRadius: '8px', 
                  overflow: 'hidden',
                  background: '#f8fafc'
                }}>
                  <div style={{ 
                    padding: '1rem', 
                    borderBottom: '1px solid #e5e7eb',
                    background: 'white',
                    fontWeight: '600'
                  }}>
                    Customer Conversations
                  </div>
                  <div style={{ height: '550px', overflow: 'auto' }}>
                    {chatConversations.length === 0 ? (
                      <div style={{ 
                        padding: '2rem', 
                        textAlign: 'center', 
                        color: '#000' 
                      }}>
                        No conversations yet
                      </div>
                    ) : (
                      chatConversations.map((conversation) => (
                        <div
                          key={conversation.userId}
                          onClick={() => setSelectedChatUser(conversation.userId)}
                          style={{
                            padding: '1rem',
                            borderBottom: '1px solid #e5e7eb',
                            cursor: 'pointer',
                            background: selectedChatUser === conversation.userId ? '#e0e7ff' : 'white'
                          }}
                          onMouseEnter={(e) => {
                            if (selectedChatUser !== conversation.userId) {
                              e.currentTarget.style.background = '#f3f4f6';
                            }
                          }}
                          onMouseLeave={(e) => {
                            if (selectedChatUser !== conversation.userId) {
                              e.currentTarget.style.background = 'white';
                            }
                          }}
                        >
                          <div style={{ fontWeight: '600', marginBottom: '0.25rem' }}>
                            {conversation.userEmail}
                          </div>
                          <div style={{ 
                            fontSize: '0.9rem', 
                            color: '#000',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis'
                          }}>
                            {conversation.lastMessage ? conversation.lastMessage.message : 'No messages'}
                          </div>
                          <div style={{ 
                            fontSize: '0.8rem', 
                            color: '#000',
                            marginTop: '0.25rem',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center'
                          }}>
                            <span>{conversation.lastMessage ? new Date(conversation.lastMessage.timestamp).toLocaleString() : ''}</span>
                            {conversation.unreadCount > 0 && (
                              <span style={{
                                background: '#ef4444',
                                color: 'white',
                                borderRadius: '50%',
                                width: '20px',
                                height: '20px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '0.7rem'
                              }}>
                                {conversation.unreadCount}
                              </span>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Chat Window */}
                <div style={{ 
                  border: '1px solid #e5e7eb', 
                  borderRadius: '8px', 
                  overflow: 'hidden',
                  display: 'flex',
                  flexDirection: 'column',
                  background: 'white'
                }}>
                  {selectedChatUser ? (
                    <>
                      {/* Chat Header */}
                      <div style={{ 
                        padding: '1rem', 
                        borderBottom: '1px solid #e5e7eb',
                        fontWeight: '600',
                        background: '#f8fafc'
                      }}>
                        Chat with {chatConversations.find(c => c.userId === selectedChatUser)?.userEmail}
                      </div>

                      {/* Messages */}
                      <div style={{ 
                        flex: 1, 
                        padding: '1rem', 
                        overflow: 'auto',
                        maxHeight: '400px'
                      }}>
                        {chatConversations
                          .find(c => c.userId === selectedChatUser)
                          ?.messages?.map((message) => (
                            <div
                              key={message.id}
                              style={{
                                marginBottom: '1rem',
                                display: 'flex',
                                justifyContent: message.senderType === 'admin' ? 'flex-end' : 'flex-start'
                              }}
                            >
                              <div style={{
                                maxWidth: '70%',
                                padding: '0.75rem 1rem',
                                borderRadius: '12px',
                                background: message.senderType === 'admin' ? '#667eea' : '#f3f4f6',
                                color: message.senderType === 'admin' ? 'white' : '#333'
                              }}>
                                <div style={{ fontSize: '0.9rem', marginBottom: '0.25rem' }}>
                                  {String(message.message)}
                                </div>
                                <div style={{ 
                                  fontSize: '0.7rem',
                                  opacity: 0.7
                                }}>
                                  {new Date(message.timestamp).toLocaleTimeString()}
                                </div>
                              </div>
                            </div>
                          )) || []}
                      </div>

                      {/* Message Input */}
                      <div style={{ 
                        padding: '1rem', 
                        borderTop: '1px solid #e5e7eb',
                        background: '#f8fafc'
                      }}>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          <input
                            type="text"
                            value={newMessage}
                            onChange={(e) => setNewMessage(e.target.value)}
                            placeholder="Type your message..."
                            style={{
                              flex: 1,
                              padding: '0.75rem',
                              border: '1px solid #d1d5db',
                              borderRadius: '8px',
                              fontSize: '0.9rem'
                            }}
                            onKeyPress={(e) => {
                              if (e.key === 'Enter') {
                                handleSendChatMessage(selectedChatUser);
                              }
                            }}
                          />
                          <button
                            onClick={() => handleSendChatMessage(selectedChatUser)}
                            disabled={loading || !newMessage.trim()}
                            style={{
                              background: '#667eea',
                              color: 'white',
                              border: 'none',
                              padding: '0.75rem 1rem',
                              borderRadius: '8px',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.5rem'
                            }}
                          >
                            <MessageCircle size={16} />
                            Send
                          </button>
                        </div>
                      </div>
                    </>
                  ) : (
                    <div style={{ 
                      flex: 1, 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center',
                      color: '#000'
                    }}>
                      Select a conversation to start chatting
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'demos' && (
            <div>
              <h3 style={{ color: '#000', marginBottom: '1.5rem' }}>Demo Requests</h3>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ background: '#f8fafc' }}>
                      <th style={{ padding: '12px', textAlign: 'left', color: '#000' }}>Name</th>
                      <th style={{ padding: '12px', textAlign: 'left', color: '#000' }}>Email</th>
                      <th style={{ padding: '12px', textAlign: 'left', color: '#000' }}>Company</th>
                      <th style={{ padding: '12px', textAlign: 'left', color: '#000' }}>Status</th>
                      <th style={{ padding: '12px', textAlign: 'left', color: '#000' }}>Date</th>
                      <th style={{ padding: '12px', textAlign: 'left', color: '#000' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {demos.map((demo) => (
                      <tr key={demo.id} style={{ borderBottom: '1px solid #eee' }}>
                        <td style={{ padding: '12px', fontWeight: '600' }}>{demo.name}</td>
                        <td style={{ padding: '12px' }}>{demo.email}</td>
                        <td style={{ padding: '12px' }}>{demo.company || '-'}</td>
                        <td style={{ padding: '12px' }}>
                          {getStatusBadge(demo.status)}
                        </td>
                        <td style={{ padding: '12px', color: '#000' }}>
                          {formatDate(demo.createdAt)}
                        </td>
                        <td style={{ padding: '12px' }}>
                          {demo.status === 'requested' && (
                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                              <button
                                onClick={() => handleDemoUpdate(demo.id, 'scheduled')}
                                disabled={loading}
                                style={{
                                  background: '#10b981',
                                  color: 'white',
                                  border: 'none',
                                  padding: '6px 12px',
                                  borderRadius: '4px',
                                  fontSize: '0.8rem',
                                  cursor: 'pointer',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '0.25rem'
                                }}
                              >
                                <Check size={12} />
                                Schedule
                              </button>
                              <button
                                onClick={() => handleDemoUpdate(demo.id, 'cancelled')}
                                disabled={loading}
                                style={{
                                  background: '#ef4444',
                                  color: 'white',
                                  border: 'none',
                                  padding: '6px 12px',
                                  borderRadius: '4px',
                                  fontSize: '0.8rem',
                                  cursor: 'pointer',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '0.25rem'
                                }}
                              >
                                <X size={12} />
                                Cancel
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'transactions' && (
            <div>
              <h3 style={{ color: '#000', marginBottom: '1.5rem' }}>All Transactions</h3>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ background: '#f8fafc' }}>
                      <th style={{ padding: '12px', textAlign: 'left', color: '#000' }}>User</th>
                      <th style={{ padding: '12px', textAlign: 'left', color: '#000' }}>Type</th>
                      <th style={{ padding: '12px', textAlign: 'left', color: '#000' }}>Amount</th>
                      <th style={{ padding: '12px', textAlign: 'left', color: '#000' }}>Status</th>
                      <th style={{ padding: '12px', textAlign: 'left', color: '#000' }}>Date</th>
                      <th style={{ padding: '12px', textAlign: 'left', color: '#000' }}>Description</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transactions.slice(0, 50).map((transaction) => {
                      const user = users.find(u => u.id === transaction.userId);
                      return (
                        <tr key={transaction.id} style={{ borderBottom: '1px solid #eee' }}>
                          <td style={{ padding: '12px', fontWeight: '600' }}>
                            {user?.email || 'Unknown User'}
                          </td>
                          <td style={{ padding: '12px', textTransform: 'capitalize' }}>
                            {transaction.type}
                          </td>
                          <td style={{ 
                            padding: '12px', 
                            color: transaction.type === 'deposit' || transaction.type === 'interest' ? '#10b981' : '#ef4444',
                            fontWeight: '600'
                          }}>
                            {transaction.type === 'deposit' || transaction.type === 'interest' ? '+' : '-'}
                            {formatCurrency(transaction.amount)}
                          </td>
                          <td style={{ padding: '12px' }}>
                            {getStatusBadge(transaction.status)}
                          </td>
                          <td style={{ padding: '12px', color: '#000' }}>
                            {formatDate(transaction.createdAt)}
                          </td>
                          <td style={{ padding: '12px', color: '#000', fontSize: '0.9rem' }}>
                            {transaction.description || '-'}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              {transactions.length > 50 && (
                <p style={{ textAlign: 'center', color: '#000', marginTop: '1rem' }}>
                  Showing first 50 transactions. Total: {transactions.length}
                </p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* User Details Modal */}
      {selectedUser && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '2rem'
        }}>
          <div style={{
            background: 'white',
            padding: '2rem',
            borderRadius: '12px',
            width: '100%',
            maxWidth: '600px',
            maxHeight: '90vh',
            overflowY: 'auto'
          }}>
            <h3 style={{ margin: '0 0 1.5rem 0', color: '#000' }}>User Details</h3>
            <div style={{ marginBottom: '1.5rem' }}>
              <p style={{ color: '#000' }}><strong>Email:</strong> {selectedUser.email}</p>
              <p style={{ color: '#000' }}><strong>Role:</strong> {selectedUser.role}</p>
              <p style={{ color: '#000' }}><strong>Balance:</strong> {formatCurrency(selectedUser.balance)}</p>
              <p style={{ color: '#000' }}><strong>Total Interest:</strong> {formatCurrency(selectedUser.totalInterest)}</p>
              <p style={{ color: '#000' }}><strong>Joined:</strong> {formatDate(selectedUser.createdAt)}</p>
            </div>
            <button
              onClick={() => setSelectedUser(null)}
              style={{
                background: '#667eea',
                color: 'white',
                border: 'none',
                padding: '12px 24px',
                borderRadius: '8px',
                fontSize: '16px',
                fontWeight: '600',
                cursor: 'pointer'
              }}
            >
              Close
            </button>
          </div>
        </div>
      )}
      
      {/* WebSocket Debug Component - Only show in development or for debugging */}
      {(process.env.NODE_ENV === 'development' || window.location.search.includes('debug=ws')) && (
        <WebSocketDebug />
      )}
      </div>
    </div>
  );
};

export default AdminDashboard;