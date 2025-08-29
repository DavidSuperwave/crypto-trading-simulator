import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import axios from 'axios';
import { buildApiUrl, API_CONFIG } from '../config/api';

interface User {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  role: string;
  balance: number;
  totalInterest: number;
  depositedAmount?: number;
  simulatedInterest?: number;
  currentMonthlyTarget?: number;
  simulationStartDate?: string;
  lastSimulationUpdate?: string;
  simulationActive?: boolean;
  currentPlan?: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<User | null>;
  logout: () => void;
  register: (
    email: string, 
    password: string, 
    firstName: string, 
    lastName: string, 
    phone: string, 
    role?: string,
    accessCode?: string
  ) => Promise<User | null>;
  updateUser: (userData: Partial<User>) => void;
  getAuthHeaders: () => { Authorization: string } | {};
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check for stored token on app start
    const token = localStorage.getItem('token');
    if (token) {
      // Verify token and get user data
      fetchUserProfile(token);
    } else {
      setIsLoading(false);
    }
  }, []);

  const fetchUserProfile = async (token: string) => {
    setIsLoading(true);
    try {
      const response = await axios.get(buildApiUrl(API_CONFIG.ENDPOINTS.USER_PROFILE), {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUser(response.data);
      setIsAuthenticated(true);
    } catch (error) {
      console.error('Token verification failed:', error);
      localStorage.removeItem('token');
      setUser(null);
      setIsAuthenticated(false);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string): Promise<User | null> => {
    const requestData = { email, password };
    
    try {
      const response = await axios.post(buildApiUrl(API_CONFIG.ENDPOINTS.LOGIN), requestData, {
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (response.status === 200 && response.data) {
        const { user: userData, token } = response.data;
        
        if (userData && token) {
          localStorage.setItem('token', token);
          setUser(userData);
          setIsAuthenticated(true);
          return userData;
        } else {
          return null;
        }
      } else {
        return null;
      }
    } catch (error: any) {
      return null;
    }
  };

  const register = async (
    email: string, 
    password: string, 
    firstName: string, 
    lastName: string, 
    phone: string, 
    role: string = 'user',
    accessCode?: string
  ): Promise<User | null> => {
    try {
      const requestData = {
        email,
        password,
        firstName,
        lastName,
        phone,
        role,
        accessCode
      };
      
      console.log('🔐 Registration request data:', { ...requestData, password: '***' });
      
      const response = await axios.post(buildApiUrl(API_CONFIG.ENDPOINTS.REGISTER), requestData);

      const { user: userData, token } = response.data;
      
      localStorage.setItem('token', token);
      setUser(userData);
      setIsAuthenticated(true);
      
      return userData;
    } catch (error: any) {
      return null;
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
    setIsAuthenticated(false);
    setIsLoading(false);
  };

  const updateUser = (userData: Partial<User>) => {
    if (user) {
      setUser({ ...user, ...userData });
    }
  };

  const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    if (!token) {
      return {};
    }

    // Basic token validation
    if (token.length < 10 || !token.includes('.')) {
      console.warn('🚫 Invalid token format detected');
      localStorage.removeItem('token');
      setUser(null);
      setIsAuthenticated(false);
      return {};
    }

    return { Authorization: `Bearer ${token}` };
  };

  return (
    <AuthContext.Provider value={{
      user,
      isAuthenticated,
      isLoading,
      login,
      logout,
      register,
      updateUser,
      getAuthHeaders
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Axios interceptor to add auth token to requests
axios.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Axios interceptor to handle auth errors
axios.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);