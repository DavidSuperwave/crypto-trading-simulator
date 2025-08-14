import React, { useState, useEffect, useRef, useCallback, useContext } from 'react';
import { TrendingUp, TrendingDown, Activity, Clock } from 'lucide-react';
import { buildApiUrl, API_CONFIG } from '../config/api';
import { useAuth } from '../context/AuthContext';
import { LiveTradingContext } from '../context/LiveTradingContext';

// Global request deduplication system to prevent Railway flooding
const activeRequests = new Map<string, Promise<any>>();
const lastRequestTime = new Map<string, number>();
const MIN_REQUEST_INTERVAL = 10000; // Minimum 10 seconds between identical requests

// Interfaces
interface Trade {
  id: string;
  timestamp: string;
  displayTime: string;
  cryptoSymbol: string;
  cryptoName: string;
  tradeType: 'long' | 'short';
  profitLoss: number;
  amount: number;
  duration: number;
  status: string;
  isWinningTrade: boolean;
  positionSize?: number;
}

interface LiveActivity {
  hasActivity: boolean;
  todaysTrades?: {
    trades: Trade[];
    dailyTargetAmount: number;
  };
}

const useLiveTradingData = () => {
  const context = useContext(LiveTradingContext);
  if (!context) {
    // Return default context if not within provider
    return {
      liveTradingData: {
        liveTotalPL: 0,
        unrealizedPL: 0,
        dailyTarget: 0,
        dailyPL: 0,
        openPositions: 0
      },
      updateLiveTradingData: () => {}
    };
  }
  return context;
};

const LiveTradingFeed: React.FC = () => {
  const { user } = useAuth();
  const [todaysTrades, setTodaysTrades] = useState<Trade[]>([]);
  const [visibleTrades, setVisibleTrades] = useState<Trade[]>([]);
  const [liveActivity, setLiveActivity] = useState<LiveActivity | null>(null);
  const [dailyTarget, setDailyTarget] = useState(0);
  const [executingTrades, setExecutingTrades] = useState<Set<string>>(new Set());
  const [pulsingTrades, setPulsingTrades] = useState<Set<string>>(new Set());
  const [positionOpenTimes, setPositionOpenTimes] = useState<Map<string, Date>>(new Map());
  const [positionPLs, setPositionPLs] = useState<Map<string, number>>(new Map());
  const [tradeProgresses, setTradeProgresses] = useState<Map<string, number>>(new Map());
  const [totalUnrealizedPL, setTotalUnrealizedPL] = useState(0);
  const [animationFrameId, setAnimationFrameId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [unrealizedPL, setUnrealizedPL] = useState(0);
  const [, setAnimatedTarget] = useState(0);
  const [, setLiveBalance] = useState(10000);

  // Live trading context for sharing P&L data
  const { liveTradingData, updateLiveTradingData } = useLiveTradingData();
  
  const feedRef = useRef<HTMLDivElement>(null);
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const animationRef = useRef<NodeJS.Timeout | null>(null);
  const priceMovementRef = useRef<NodeJS.Timeout | null>(null);
  const initializedRef = useRef<boolean>(false);

  // DEDUPLICATION: Wrapper for all API requests
  const makeRequest = async (url: string, requestKey: string): Promise<any> => {
    const now = Date.now();
    const lastRequest = lastRequestTime.get(requestKey) || 0;
    
    // Throttle: Don't make request if one was made recently
    if (now - lastRequest < MIN_REQUEST_INTERVAL) {
      console.log(`🚫 Throttling ${requestKey} request (${Math.round((MIN_REQUEST_INTERVAL - (now - lastRequest)) / 1000)}s remaining)`);
      return null;
    }
    
    // Deduplicate: If request is already in progress, wait for it
    if (activeRequests.has(requestKey)) {
      console.log(`🔄 ${requestKey} request already in progress, waiting...`);
      return await activeRequests.get(requestKey);
    }
    
    // Make the request
    console.log(`🌐 Making ${requestKey} request to ${url}`);
    lastRequestTime.set(requestKey, now);
    
    const token = localStorage.getItem('token');
    if (!token) return null;
    
    const requestPromise = fetch(url, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    activeRequests.set(requestKey, requestPromise);
    
    try {
      const response = await requestPromise;
      activeRequests.delete(requestKey);
      
      if (response.ok) {
        return await response.json();
      } else {
        console.error(`❌ ${requestKey} request failed:`, response.status);
        return null;
      }
    } catch (error) {
      activeRequests.delete(requestKey);
      console.error(`❌ ${requestKey} request error:`, error);
      return null;
    }
  };

  const fetchTodaysData = async () => {
    try {
      setLoading(true);
      
      // Fetch today's trades (SINGLE REQUEST)
      const tradesData = await makeRequest(
        buildApiUrl('/compound-interest/daily-trades'), 
        'daily-trades'
      );
      
      if (tradesData?.success && tradesData.dailyTrades) {
        console.log('📊 Setting trades:', tradesData.dailyTrades.trades?.length || 0, 'trades');
        setTodaysTrades(tradesData.dailyTrades.trades || []);
        setDailyTarget(tradesData.dailyTrades.dailyTargetAmount || 0);
      }
      
      setLoading(false);
    } catch (error) {
      console.error('Error fetching trading data:', error);
      setLoading(false);
    }
  };

  const fetchLiveActivity = useCallback(async () => {
    try {
      // Fetch live activity (SINGLE REQUEST)
      const activityData = await makeRequest(
        buildApiUrl('/compound-interest/live-activity'),
        'live-activity'
      );
      
      if (activityData?.success) {
        console.log('📺 Setting liveActivity:', activityData.liveActivity);
        setLiveActivity(activityData.liveActivity);
      }
    } catch (error) {
      console.error('Error fetching live activity:', error);
    }
  }, []);

  const updateVisibleTrades = useCallback(() => {
    if (!todaysTrades.length) {
      return;
    }

    const now = new Date();
    
    // 🎯 TIME-BASED FILTERING: Show only 5 most relevant trades for current time
    const currentTrades = todaysTrades.filter(trade => {
      const tradeTime = new Date(trade.timestamp);
      const timeDiff = now.getTime() - tradeTime.getTime();
      
      // Show trades that:
      // 1. Have started (trade time <= now)
      // 2. Are still within their active duration OR just started in last 30 minutes
      const durationMs = trade.duration * 1000; // Convert minutes to milliseconds
      const recentWindow = 30 * 60 * 1000; // 30 minutes
      
      return tradeTime <= now && (timeDiff <= durationMs || timeDiff <= recentWindow);
    });

    // Sort by most recent and take only top 5
    const topActiveTrades = currentTrades
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 5);

    // Find new trades to add (not already visible)
    const newTrades = topActiveTrades.filter(trade => 
      !visibleTrades.some(vt => vt.id === trade.id)
    );

    console.log(`⏰ Time filter: ${currentTrades.length} active trades, showing top 5, ${newTrades.length} new`);

    if (newTrades.length > 0 && visibleTrades.length < 5) {
      // Add one new trade at a time for smooth animation
      const nextTrade = newTrades[0];
      console.log('🆕 Adding new trade:', nextTrade.cryptoSymbol, nextTrade.profitLoss, 'at', nextTrade.displayTime);
      
      setVisibleTrades(prev => [...prev, nextTrade]);
      setPositionOpenTimes(prev => new Map(prev).set(nextTrade.id, new Date()));
      
      // Add pulse animation
      setPulsingTrades(prev => new Set(prev).add(nextTrade.id));
      setTimeout(() => {
        setPulsingTrades(prev => {
          const newSet = new Set(prev);
          newSet.delete(nextTrade.id);
          return newSet;
        });
      }, 2000);
    }

    // Remove trades that are no longer in the top 5 active trades
    setVisibleTrades(prev => {
      return prev.filter(trade => {
        const stillActive = topActiveTrades.some(activeTrade => activeTrade.id === trade.id);
        
        if (!stillActive) {
          console.log('⏰ Removing trade outside time window:', trade.cryptoSymbol, trade.displayTime);
          // Clean up related state
          setTimeout(() => {
            setPositionOpenTimes(prevTimes => {
              const newMap = new Map(prevTimes);
              newMap.delete(trade.id);
              return newMap;
            });
            setPositionPLs(prevPLs => {
              const newMap = new Map(prevPLs);
              newMap.delete(trade.id);
              return newMap;
            });
          }, 100);
        }
        
        return stillActive;
      });
    });

    // Remove trades that have been visible for their full duration
    setVisibleTrades(prev => {
      return prev.filter(trade => {
        const openTime = positionOpenTimes.get(trade.id);
        if (!openTime) return true;
        
        const elapsed = now.getTime() - openTime.getTime();
        const duration = trade.duration * 1000;
        
        if (elapsed >= duration) {
          // Mark as executing before removal
          setExecutingTrades(prev => new Set(prev).add(trade.id));
          
          setTimeout(() => {
            setExecutingTrades(prev => {
              const newSet = new Set(prev);
              newSet.delete(trade.id);
              return newSet;
            });
            setPositionOpenTimes(prev => {
              const newMap = new Map(prev);
              newMap.delete(trade.id);
              return newMap;
            });
            setPositionPLs(prev => {
              const newMap = new Map(prev);
              newMap.delete(trade.id);
              return newMap;
            });
          }, 1000);
          
          return false;
        }
        return true;
      });
    });
  }, [todaysTrades, visibleTrades, positionOpenTimes]);

  const calculatePositionProgress = useCallback((trade: Trade): number => {
    const now = new Date();
    const positionOpenTime = positionOpenTimes.get(trade.id);
    if (!positionOpenTime) { return 0; }
    const elapsed = now.getTime() - positionOpenTime.getTime();
    const positionDuration = trade.duration * 1000; // Convert seconds to milliseconds
    const progress = Math.max(0, Math.min(1, elapsed / positionDuration));
    return progress;
  }, [positionOpenTimes]);

  const calculateFluctuatingPL = useCallback((trade: Trade, progress: number): number => {
    const finalPL = trade.profitLoss;
    const positionSize = trade.positionSize || Math.abs(trade.amount * 20);
    const currentPL = positionPLs.get(trade.id) || 0;
    
    let newPL = currentPL + (Math.random() - 0.5) * (positionSize * 0.05);
    const maxBound = finalPL * 1.5;
    const minBound = finalPL * 0.5;
    const progressConstraint = 1 - Math.pow(progress, 2);
    const constrainedMaxBound = finalPL + (maxBound * progressConstraint);
    const constrainedMinBound = finalPL + (minBound * progressConstraint);
    newPL = Math.max(constrainedMinBound, Math.min(constrainedMaxBound, newPL));
    if (progress >= 0.98) { newPL = finalPL; }
    return newPL;
  }, [positionPLs]);

  const simulateRealtimeUpdates = useCallback(() => {
    const now = new Date();
    const availableTrades = todaysTrades.filter(trade => {
      const tradeTime = new Date(trade.timestamp);
      return tradeTime <= now;
    });
    const updatedPLs = new Map(positionPLs);
    const updatedProgresses = new Map(tradeProgresses);
    visibleTrades.forEach(trade => {
      const progress = calculatePositionProgress(trade);
      const newPL = calculateFluctuatingPL(trade, progress);
      updatedPLs.set(trade.id, newPL);
      updatedProgresses.set(trade.id, progress);
    });
    setPositionPLs(updatedPLs);
    setTradeProgresses(updatedProgresses);
    if (visibleTrades.length < 5 && availableTrades.length > 0 && Math.random() > 0.7) {
      const unopenedTrades = availableTrades.filter(trade => !visibleTrades.some(vt => vt.id === trade.id));
      if (unopenedTrades.length > 0) {
        const newTrade = unopenedTrades[Math.floor(Math.random() * unopenedTrades.length)];
        setVisibleTrades(prev => [...prev, newTrade]);
        setPositionOpenTimes(prev => new Map(prev).set(newTrade.id, new Date()));
      }
    }
    const totalPositionPL = Array.from(updatedPLs.values()).reduce((sum, pl) => sum + pl, 0);
    const baseBalance = 10000;
    setLiveBalance(baseBalance + totalPositionPL + unrealizedPL);
    setTimeout(() => updateVisibleTrades(), 100);
  }, [visibleTrades, positionPLs, tradeProgresses, todaysTrades, updateVisibleTrades, calculateFluctuatingPL, calculatePositionProgress, unrealizedPL]);

  const startPolling = useCallback(() => {
    // Poll every 20 seconds to reduce Railway load (increased from 15s)
    pollIntervalRef.current = setInterval(() => {
      updateVisibleTrades();
      fetchLiveActivity(); // Only fetch live activity, not both
      simulateRealtimeUpdates();
    }, 20000); // Reduced frequency
  }, [updateVisibleTrades, fetchLiveActivity, simulateRealtimeUpdates]);

  // useEffects
  useEffect(() => {
    fetchTodaysData(); // Initial fetch of today's data
    startPolling();
    
    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
      const currentAnimation = animationRef.current;
      if (currentAnimation) {
        clearTimeout(currentAnimation);
      }
      if (priceMovementRef.current) {
        clearInterval(priceMovementRef.current);
      }
    };
  }, [startPolling]);

  useEffect(() => {
    updateVisibleTrades();
  }, [todaysTrades, executingTrades, pulsingTrades, positionOpenTimes, updateVisibleTrades]);

  useEffect(() => {
    const totalPL = Array.from(positionPLs.values()).reduce((sum, pl) => sum + pl, 0);
    setTotalUnrealizedPL(totalPL);
    
    // Update live trading context
    if (updateLiveTradingData) {
      updateLiveTradingData({
        unrealizedPL: totalPL,
        openPositions: visibleTrades.length,
        dailyPL: totalPL
      });
    }
  }, [positionPLs, visibleTrades.length, updateLiveTradingData]);

  // Rest of the component render logic...
  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-3 text-gray-600">Loading trading activity...</span>
        </div>
      </div>
    );
  }

  if (!liveActivity?.hasActivity) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-center py-8">
          <Activity className="h-12 w-12 text-gray-400 mr-4" />
          <div className="text-center">
            <h3 className="text-lg font-medium text-gray-900 mb-2">No trading activity today</h3>
            <p className="text-gray-500">Market: Closed</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md">
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Activity className="h-5 w-5 text-green-500 mr-2" />
            <h3 className="text-lg font-medium text-gray-900">Live Trading Activity</h3>
          </div>
          <div className="flex items-center text-sm text-gray-500">
            <Clock className="h-4 w-4 mr-1" />
            <span>Real-time updates</span>
          </div>
        </div>
      </div>

      <div ref={feedRef} className="p-6 space-y-4 max-h-96 overflow-y-auto">
        {visibleTrades.length === 0 ? (
          <div className="text-center py-8">
            <Activity className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">Waiting for trading opportunities...</p>
          </div>
        ) : (
          visibleTrades.map((trade) => {
            const currentPL = positionPLs.get(trade.id) || trade.profitLoss;
            const progress = tradeProgresses.get(trade.id) || 0;
            const isExecuting = executingTrades.has(trade.id);
            const isPulsing = pulsingTrades.has(trade.id);
            const isProfit = currentPL >= 0;

            return (
              <div
                key={trade.id}
                className={`
                  relative p-4 border rounded-lg transition-all duration-500
                  ${isExecuting ? 'bg-yellow-50 border-yellow-200 animate-pulse' : 
                    isPulsing ? 'bg-blue-50 border-blue-200 animate-pulse' :
                    isProfit ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}
                `}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className={`w-3 h-3 rounded-full mr-3 ${isProfit ? 'bg-green-500' : 'bg-red-500'}`} />
                    <div>
                      <div className="font-medium text-gray-900">
                        {trade.cryptoSymbol} {trade.tradeType.toUpperCase()}
                      </div>
                      <div className="text-sm text-gray-500">
                        {trade.cryptoName || trade.cryptoSymbol}
                      </div>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <div className={`font-bold ${isProfit ? 'text-green-600' : 'text-red-600'}`}>
                      {isProfit ? '+' : ''}${currentPL.toFixed(2)}
                    </div>
                    <div className="text-sm text-gray-500">
                      ${Math.abs(trade.amount).toFixed(2)}
                    </div>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="mt-3">
                  <div className="flex justify-between text-sm text-gray-500 mb-1">
                    <span>Position Progress</span>
                    <span>{Math.round(progress * 100)}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all duration-300 ${
                        isProfit ? 'bg-green-500' : 'bg-red-500'
                      }`}
                      style={{ width: `${progress * 100}%` }}
                    />
                  </div>
                </div>

                {/* Status indicators */}
                {isExecuting && (
                  <div className="absolute top-2 right-2">
                    <div className="flex items-center text-xs text-yellow-600">
                      <div className="w-2 h-2 bg-yellow-500 rounded-full mr-1 animate-pulse" />
                      Executing
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Summary footer */}
      {visibleTrades.length > 0 && (
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
          <div className="flex justify-between items-center text-sm">
            <span className="text-gray-600">
              {visibleTrades.length} active position{visibleTrades.length !== 1 ? 's' : ''}
            </span>
            <span className={`font-medium ${totalUnrealizedPL >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              Total P&L: {totalUnrealizedPL >= 0 ? '+' : ''}${totalUnrealizedPL.toFixed(2)}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default LiveTradingFeed;