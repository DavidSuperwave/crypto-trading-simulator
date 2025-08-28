// API Configuration for development and production
const getApiUrl = () => {
  // If environment variable is set, use it
  if (process.env.REACT_APP_API_URL) {
    return process.env.REACT_APP_API_URL;
  }
  
  // Auto-detect production based on hostname
  if (window.location.hostname.includes('railway.app')) {
    // Railway: same domain, just add /api path
    return `${window.location.protocol}//${window.location.hostname}/api`;
  } else if (window.location.hostname.includes('vercel.app') || window.location.hostname.includes('crypto-trading-simulator')) {
    // Vercel frontend + Railway backend setup
    // Vercel frontend + Railway backend
    return 'https://crypto-trading-simulator-production.up.railway.app/api';
  }
  
  // Default to localhost for development
  return 'http://localhost:5000/api';
};

export const API_CONFIG = {
  BASE_URL: getApiUrl(),
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
  CHAT_MARK_READ: '/chat/mark-read',
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