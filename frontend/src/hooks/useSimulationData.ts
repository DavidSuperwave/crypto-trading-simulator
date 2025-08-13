import { useState, useEffect } from 'react';
import { buildApiUrl } from '../config/api';

interface SimulationUser {
  id: string;
  email: string;
  depositedAmount: number;
  simulatedInterest: number;
  totalBalance: number;
  simulationActive: boolean;
}

interface MonthlyTarget {
  targetPercentage: number;
  targetAmount: number;
  achievedAmount: number;
  progressPercentage: number;
  daysInMonth: number;
  daysRemaining: number;
}

interface DailyRecord {
  simulationDate: string;
  dailyTargetAmount: number;
  achievedAmount: number;
  numberOfTrades: number;
  status: string;
}

interface SimulationData {
  user: SimulationUser;
  currentMonth: {
    target: any;
    progress: MonthlyTarget | null;
  };
  recentActivity: DailyRecord[];
  lastUpdate: string;
}

interface TradeData {
  date: string;
  summary: {
    totalEarnings: number;
    numberOfTrades: number;
    winRate: number;
    largestWin: number;
    largestLoss: number;
    status: string;
  };
  trades: Array<{
    id: string;
    cryptoSymbol: string;
    cryptoName: string;
    profitLoss: number;
    tradeTimestamp: string;
    tradeType: string;
    tradeDurationMinutes: number;
  }>;
}

export const useSimulationData = () => {
  const [simulationData, setSimulationData] = useState<SimulationData | null>(null);
  const [tradingData, setTradingData] = useState<TradeData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSimulationStatus = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await fetch(buildApiUrl('/compound-interest/simulation/status'), {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setSimulationData(data);
      setError(null);
    } catch (err) {
      console.error('Error fetching simulation status:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch simulation data');
    } finally {
      setLoading(false);
    }
  };

  const fetchTradingData = async (date?: string) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      const endpoint = date 
        ? `/compound-interest/simulation/trades/${date}`
        : '/compound-interest/simulation/trades';

      const response = await fetch(buildApiUrl(endpoint), {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        // If no data found for date, that's not an error
        if (response.status === 404) {
          setTradingData(null);
          return;
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setTradingData(data);
    } catch (err) {
      console.error('Error fetching trading data:', err);
      // Don't set error for trading data as it's optional
    }
  };

  const initializeSimulation = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await fetch(buildApiUrl('/compound-interest/simulation/initialize'), {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to initialize simulation');
      }

      const data = await response.json();
      
      // Refresh simulation data after initialization
      await fetchSimulationStatus();
      
      return data;
    } catch (err) {
      console.error('Error initializing simulation:', err);
      throw err;
    }
  };

  useEffect(() => {
    fetchSimulationStatus();
    fetchTradingData(); // Fetch today's trading data
  }, []);

  const refreshData = () => {
    setLoading(true);
    fetchSimulationStatus();
    fetchTradingData();
  };

  return {
    simulationData,
    tradingData,
    loading,
    error,
    refreshData,
    fetchTradingData,
    initializeSimulation
  };
};

export type { SimulationData, TradeData, SimulationUser, MonthlyTarget, DailyRecord };