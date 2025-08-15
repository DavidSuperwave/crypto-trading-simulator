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

      // Test token validity first
      try {
        const tokenTestResponse = await fetch(buildApiUrl('/user/profile'), {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (tokenTestResponse.status === 401) {
          localStorage.removeItem('token');
          window.location.href = '/login';
          return;
        }
      } catch (tokenError) {
        // Token test failed, continue with main request
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
          // Portfolio API failed, continue with fallback
          hasValidData = false;
        }
      } catch (compoundError) {
        // Error fetching compound interest data - continue with fallback
      }

      // Try to fetch enhanced trading data for additional info
      try {
        const [tradingResponse, positionsResponse] = await Promise.all([
          fetch(buildApiUrl('/enhanced-trading/status'), {
            headers: { 'Authorization': `Bearer ${token}` }
          }),
          fetch(buildApiUrl('/enhanced-trading/positions'), {
            headers: { 'Authorization': `Bearer ${token}` }
          })
        ]);

        if (tradingResponse.ok) {
          const tradingData = await tradingResponse.json();
          
          if (tradingData.success && tradingData.data) {
            // Use trading data to supplement compound data (don't override totalPortfolioValue)
            const portfolio = tradingData.data.portfolio;
            if (portfolio && !hasValidData) {
              // Only use trading data if we don't have compound interest data
              totalPortfolioValue = portfolio.totalValue || totalPortfolioValue;
              availableBalance = portfolio.availableBalance || availableBalance;
              lockedCapital = portfolio.lockedCapital || lockedCapital;
              dailyPL = portfolio.dailyPL || dailyPL;
              dailyPLPercent = portfolio.dailyPLPercent || dailyPLPercent;
              utilizationPercent = portfolio.utilizationPercent || utilizationPercent;
              hasValidData = true;
            } else if (portfolio) {
              // Supplement with trading-specific data only (preserve compound interest portfolio value)
              lockedCapital = portfolio.lockedCapital || lockedCapital;
              utilizationPercent = portfolio.utilizationPercent || utilizationPercent;
            }
          }
        }

        if (positionsResponse.ok) {
          const positionsData = await positionsResponse.json();
          
          if (positionsData.success && positionsData.data) {
            openPositionsCount = positionsData.data.openPositions?.length || openPositionsCount;
          }
        }
      } catch (tradingError) {
        // Error fetching trading data (non-critical) - continue
      }

      // Use API data or reasonable defaults
      if (!hasValidData) {
        // Use minimal fallback, not fake high values
        totalPortfolioValue = totalPortfolioValue || 0;
        availableBalance = availableBalance || 0;
        lockedCapital = lockedCapital || 0;
        dailyPL = dailyPL || 0;
        dailyPLPercent = dailyPLPercent || 0;
        compoundInterestEarned = compoundInterestEarned || 0;
        totalDeposited = totalDeposited || 0;
        utilizationPercent = utilizationPercent || 0;
        openPositionsCount = openPositionsCount || 0;
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