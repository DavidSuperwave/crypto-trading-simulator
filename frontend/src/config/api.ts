// API Configuration for development and production
export const API_CONFIG = {
  BASE_URL: process.env.REACT_APP_API_URL || 'http://localhost:5001/api',
  ENDPOINTS: {
    // Auth endpoints
    AUTH: '/auth',
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
    
    // User endpoints
    USER_PROFILE: '/user/profile',
    USER_DEPOSIT: '/user/deposit',
    USER_WITHDRAW: '/user/withdraw',
    USER_CHANGE_PASSWORD: '/user/change-password',
    USER_PENDING_DEPOSITS: '/user/pending-deposits',
    USER_WITHDRAWALS: '/user/withdrawals',
    USER_TRANSACTIONS: '/user/transactions',
    
    // Admin endpoints
    ADMIN_DASHBOARD: '/admin/dashboard',
    ADMIN_USERS: '/admin/users',
    ADMIN_TRANSACTIONS: '/admin/transactions',
    ADMIN_WITHDRAWALS: '/admin/withdrawals',
    ADMIN_DEMOS: '/admin/demos',
    ADMIN_PENDING_DEPOSITS: '/admin/pending-deposits',
    
    // Chat endpoints
    CHAT_MESSAGES: '/chat/messages',
    CHAT_SEND: '/chat/send',
    CHAT_ADMIN_CONVERSATIONS: '/chat/admin/conversations',
    CHAT_ADMIN_SEND: '/chat/admin/send',
    
    // Demo endpoints
    DEMO_STATS: '/demo/stats',
    DEMO_TRADING_DATA: '/demo/trading-data',
    DEMO_RECENT_TRADES: '/demo/recent-trades',
    DEMO_REQUEST: '/demo/request'
  }
};

// Helper function to build full URLs
export const buildApiUrl = (endpoint: string): string => {
  return `${API_CONFIG.BASE_URL}${endpoint}`;
};

// Default export for convenience
export default API_CONFIG;