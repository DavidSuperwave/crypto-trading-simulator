import axios, { AxiosRequestConfig, AxiosResponse } from 'axios';
import { buildApiUrl } from '../config/api';

interface ApiRequestOptions extends Omit<AxiosRequestConfig, 'url' | 'headers'> {
  requireAuth?: boolean;
  customHeaders?: Record<string, string>;
  onTokenExpired?: () => void;
}

class ApiClient {
  private getValidToken(): string | null {
    const token = localStorage.getItem('token');
    
    if (!token || token.length < 10 || !token.includes('.')) {
      return null;
    }
    
    return token;
  }

  private getAuthHeaders(requireAuth: boolean = true): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json'
    };

    if (requireAuth) {
      const token = this.getValidToken();
      
      if (!token) {
        throw new Error('No valid authentication token found');
      }
      
      headers['Authorization'] = `Bearer ${token}`;
    }

    return headers;
  }

  private handleTokenExpired(onTokenExpired?: () => void): void {
    console.warn('🚫 API: Token expired, cleaning up and redirecting');
    localStorage.removeItem('token');
    
    if (onTokenExpired) {
      onTokenExpired();
    } else {
      // Default behavior: redirect to login
      window.location.href = '/login';
    }
  }

  async request<T = any>(
    endpoint: string, 
    options: ApiRequestOptions = {}
  ): Promise<AxiosResponse<T>> {
    const { 
      requireAuth = true, 
      customHeaders = {}, 
      onTokenExpired,
      ...axiosConfig 
    } = options;

    try {
      const headers = {
        ...this.getAuthHeaders(requireAuth),
        ...customHeaders
      };

      const config: AxiosRequestConfig = {
        url: buildApiUrl(endpoint),
        headers,
        timeout: 15000, // 15 second timeout
        ...axiosConfig
      };

      const response = await axios(config);
      return response;

    } catch (error: any) {
      // Handle token expiration
      if (error.response?.status === 401 && requireAuth) {
        this.handleTokenExpired(onTokenExpired);
        throw new Error('Session expired. Please log in again.');
      }

      // Handle network errors
      if (error.code === 'NETWORK_ERROR' || error.code === 'ECONNABORTED') {
        throw new Error('Network error. Please check your connection.');
      }

      // Handle timeout
      if (error.code === 'ECONNABORTED' && error.message.includes('timeout')) {
        throw new Error('Request timeout. Please try again.');
      }

      // Re-throw the original error for other cases
      throw error;
    }
  }

  // Convenience methods
  async get<T = any>(endpoint: string, options: ApiRequestOptions = {}): Promise<AxiosResponse<T>> {
    return this.request<T>(endpoint, { ...options, method: 'GET' });
  }

  async post<T = any>(endpoint: string, data?: any, options: ApiRequestOptions = {}): Promise<AxiosResponse<T>> {
    return this.request<T>(endpoint, { ...options, method: 'POST', data });
  }

  async put<T = any>(endpoint: string, data?: any, options: ApiRequestOptions = {}): Promise<AxiosResponse<T>> {
    return this.request<T>(endpoint, { ...options, method: 'PUT', data });
  }

  async delete<T = any>(endpoint: string, options: ApiRequestOptions = {}): Promise<AxiosResponse<T>> {
    return this.request<T>(endpoint, { ...options, method: 'DELETE' });
  }

  async patch<T = any>(endpoint: string, data?: any, options: ApiRequestOptions = {}): Promise<AxiosResponse<T>> {
    return this.request<T>(endpoint, { ...options, method: 'PATCH', data });
  }

  // Check if current token is valid (quick check)
  hasValidToken(): boolean {
    return this.getValidToken() !== null;
  }

  // Validate token with backend
  async validateToken(): Promise<boolean> {
    try {
      await this.get('/user/profile');
      return true;
    } catch (error) {
      return false;
    }
  }
}

// Export singleton instance
export const apiClient = new ApiClient();

// Export class for custom instances if needed
export { ApiClient };