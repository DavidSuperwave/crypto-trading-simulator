import { useState, useEffect, useCallback } from 'react';
import { buildApiUrl } from '../config/api';

interface PortfolioData {
  totalPortfolioValue: number;
  availableBalance: number;
  lockedCapital: number;
  dailyPL: number;
  dailyPLPercent: number;
  compoundInterestEarned: number;
  totalDeposited: number;
  portfolioGrowthPercent: number;
  utilizationPercent: number;
  openPositionsCount: number;
}

interface UsePortfolioDataReturn {
  portfolioData: PortfolioData | null;
  loading: boolean;
  error: string | null;
  refreshData: () => Promise<void>;
}

export const usePortfolioData = (): UsePortfolioDataReturn => {
  const [portfolioData, setPortfolioData] = useState<PortfolioData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastFetchTime, setLastFetchTime] = useState<number>(0);

  const fetchPortfolioData = useCallback(async () => {
    // Throttle requests to prevent rapid successive calls
    const now = Date.now();
    if (now - lastFetchTime < 2000) { // Minimum 2 seconds between calls
      return;
    }
    setLastFetchTime(now);

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setError('Authentication required');
        setLoading(false);
        return;
      }
      
      // Production: minimal logging only for critical errors



      // Initialize default values
      let totalPortfolioValue = 0;
      let availableBalance = 0;
      let lockedCapital = 0;
      let dailyPL = 0;
      let dailyPLPercent = 0;
      let utilizationPercent = 0;
      let openPositionsCount = 0;
      let compoundInterestEarned = 0;
      let totalDeposited = 0;
      let hasValidData = false;

      // Enhanced token validation
      if (!token || token.length < 10 || !token.includes('.')) {
        console.warn('🚫 Portfolio: Invalid token format');
        localStorage.removeItem('token');
        setError('Invalid authentication token');
        setLoading(false);
        window.location.href = '/login';
        return;
      }

      // Test token validity first
      try {
        const tokenTestResponse = await fetch(buildApiUrl('/user/profile'), {
          headers: { 'Authorization': `Bearer ${token}` },
          signal: AbortSignal.timeout(8000) // 8 second timeout
        });
        if (tokenTestResponse.status === 401) {
          console.warn('🚫 Portfolio: Token expired or invalid');
          localStorage.removeItem('token');
          setError('Session expired. Please login again.');
          setLoading(false);
          window.location.href = '/login';
          return;
        }
      } catch (tokenError) {
        console.warn('🚫 Portfolio: Token validation failed:', tokenError);
        // Continue with main request, but token might be invalid
      }

      // Try to fetch data from compound interest endpoint first (most reliable)
      try {
        const compoundResponse = await fetch(buildApiUrl('/compound-interest/portfolio-state'), {
          headers: { 'Authorization': `Bearer ${token}` }
        });

        if (compoundResponse.ok) {
          const compoundData = await compoundResponse.json();
          
          if (compoundData.success && compoundData.portfolioState) {
            const state = compoundData.portfolioState;
            totalPortfolioValue = Number(state.totalPortfolioValue) || 0;
            availableBalance = Number(state.availableBalance) || 0;
            lockedCapital = Number(state.lockedCapital) || 0;
            dailyPL = Number(state.dailyPL) || 0;
            dailyPLPercent = Number(state.dailyPLPercent) || 0;
            compoundInterestEarned = Number(state.totalInterestEarned) || 0;
            totalDeposited = Number(state.totalDeposited) || 0;
            utilizationPercent = Number(state.utilizationPercent) || 0;
            openPositionsCount = Number(state.openPositionsCount) || 0;
            hasValidData = true;
          }
        } else {
          console.warn('🚫 Portfolio: Compound interest API failed');
          setError('Failed to load portfolio data');
          hasValidData = false;
        }
      } catch (compoundError) {
        // Error fetching compound interest data - continue with fallback
      }

      // Removed enhanced trading API calls - using only compound interest as single source of truth

      // If compound interest API failed, use minimal fallback values
      if (!hasValidData) {
        console.warn('🚫 Portfolio: Using fallback values - compound interest API unavailable');
        // All values already initialized to 0 above
      }

      // Calculate portfolio growth percentage
      const portfolioGrowthPercent = totalDeposited > 0 
        ? ((totalPortfolioValue - totalDeposited) / totalDeposited) * 100 
        : 0;

      const portfolioResult = {
        totalPortfolioValue,
        availableBalance,
        lockedCapital,
        dailyPL,
        dailyPLPercent,
        compoundInterestEarned,
        totalDeposited,
        portfolioGrowthPercent,
        utilizationPercent,
        openPositionsCount
      };

      setPortfolioData(portfolioResult);
      setError(null);

    } catch (err) {
      setError('Failed to load portfolio data');
      // Let component handle empty state
    } finally {
      setLoading(false);
    }
  }, [lastFetchTime]); // token accessed from localStorage inside function

  useEffect(() => {
    fetchPortfolioData();
    const interval = setInterval(fetchPortfolioData, 30000); // Update every 30 seconds for better performance
    return () => clearInterval(interval);
  }, [fetchPortfolioData]);

  return {
    portfolioData,
    loading,
    error,
    refreshData: fetchPortfolioData
  };
};