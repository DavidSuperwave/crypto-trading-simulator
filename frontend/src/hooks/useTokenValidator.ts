import { useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { buildApiUrl, API_CONFIG } from '../config/api';
import { useErrorHandler } from './useErrorHandler';

interface TokenValidationResult {
  isValid: boolean;
  token: string | null;
  shouldRedirect: boolean;
  error?: string;
}

interface TokenValidatorOptions {
  autoLogout?: boolean;
  showErrorToast?: boolean;
  redirectToLogin?: boolean;
}

export const useTokenValidator = (options: TokenValidatorOptions = {}) => {
  const { logout } = useAuth();
  const { handleError } = useErrorHandler({ 
    showToast: options.showErrorToast ?? true 
  });
  
  const {
    autoLogout = true,
    redirectToLogin = true
  } = options;

  // Quick token existence check
  const hasToken = useCallback((): boolean => {
    const token = localStorage.getItem('token');
    return !!token && token.length > 0;
  }, []);

  // Get token with validation
  const getValidToken = useCallback((): string | null => {
    const token = localStorage.getItem('token');
    
    if (!token || token.length === 0) {
      return null;
    }

    // Basic format validation (Bearer tokens are typically JWT)
    // JWT tokens have 3 parts separated by dots
    const parts = token.split('.');
    if (parts.length !== 3) {
      console.warn('🚫 Token format appears invalid');
      return null;
    }

    return token;
  }, []);

  // Validate token with backend
  const validateTokenWithBackend = useCallback(async (token?: string): Promise<TokenValidationResult> => {
    const tokenToValidate = token || getValidToken();
    
    if (!tokenToValidate) {
      return {
        isValid: false,
        token: null,
        shouldRedirect: true,
        error: 'No token found'
      };
    }

    try {
      const response = await fetch(buildApiUrl(API_CONFIG.ENDPOINTS.USER_PROFILE), {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${tokenToValidate}`,
          'Content-Type': 'application/json'
        },
        // Add timeout to prevent hanging requests
        signal: AbortSignal.timeout(10000) // 10 second timeout
      });

      if (response.ok) {
        return {
          isValid: true,
          token: tokenToValidate,
          shouldRedirect: false
        };
      } else if (response.status === 401) {
        // Token is invalid/expired
        handleError(new Error('Token expired or invalid'), 'Token Validation');
        
        if (autoLogout) {
          localStorage.removeItem('token');
          logout();
        }
        
        return {
          isValid: false,
          token: null,
          shouldRedirect: redirectToLogin,
          error: 'Token expired or invalid'
        };
      } else {
        // Other server errors
        return {
          isValid: false,
          token: tokenToValidate,
          shouldRedirect: false,
          error: `Server error: ${response.status}`
        };
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Network error';
      handleError(new Error(errorMessage), 'Token Validation');
      
      return {
        isValid: false,
        token: tokenToValidate,
        shouldRedirect: false,
        error: errorMessage
      };
    }
  }, [getValidToken, handleError, autoLogout, logout, redirectToLogin]);

  // Get auth headers for API requests
  const getAuthHeaders = useCallback((): Record<string, string> => {
    const token = getValidToken();
    
    if (!token) {
      return {};
    }

    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };
  }, [getValidToken]);

  // Validate token and get auth headers in one call
  const getValidatedAuthHeaders = useCallback(async (): Promise<Record<string, string> | null> => {
    const token = getValidToken();
    
    if (!token) {
      return null;
    }

    const validation = await validateTokenWithBackend(token);
    
    if (validation.isValid) {
      return {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      };
    } else {
      return null;
    }
  }, [getValidToken, validateTokenWithBackend]);

  // Check if token is likely expired (basic check, not definitive)
  const isTokenLikelyExpired = useCallback((): boolean => {
    const token = getValidToken();
    
    if (!token) {
      return true;
    }

    try {
      // Decode JWT payload (without verification, just for expiry check)
      const payload = JSON.parse(atob(token.split('.')[1]));
      const currentTime = Math.floor(Date.now() / 1000);
      
      return payload.exp && payload.exp < currentTime;
    } catch (error) {
      console.warn('Could not decode token for expiry check:', error);
      return false; // If we can't decode, assume it's valid for now
    }
  }, [getValidToken]);

  // Force token refresh by re-validating with backend
  const refreshTokenValidation = useCallback(async (): Promise<boolean> => {
    const result = await validateTokenWithBackend();
    return result.isValid;
  }, [validateTokenWithBackend]);

  return {
    hasToken,
    getValidToken,
    validateTokenWithBackend,
    getAuthHeaders,
    getValidatedAuthHeaders,
    isTokenLikelyExpired,
    refreshTokenValidation
  };
};