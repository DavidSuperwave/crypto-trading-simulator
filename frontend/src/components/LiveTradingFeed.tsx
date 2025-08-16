import React, { useState, useEffect, useRef, useCallback, useContext } from 'react';
import { TrendingUp, TrendingDown, Activity, Clock } from 'lucide-react';
import { buildApiUrl, API_CONFIG } from '../config/api';
import { useAuth } from '../context/AuthContext';
import { LiveTradingContext } from '../context/LiveTradingContext';

// Simplified request throttling for better performance
const lastRequestTime = new Map<string, number>();
const MIN_REQUEST_INTERVAL = 15000; // Minimum 15 seconds between identical requests

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
  const [liveBalance, setLiveBalance] = useState(10000);

  // Live trading context for sharing P&L data
  const { liveTradingData, updateLiveTradingData } = useLiveTradingData();
  
  const feedRef = useRef<HTMLDivElement>(null);
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const animationRef = useRef<NodeJS.Timeout | null>(null);
  const priceMovementRef = useRef<NodeJS.Timeout | null>(null);
  const initializedRef = useRef<boolean>(false);

  // Simplified throttled request function
  const makeRequest = async (url: string, requestKey: string): Promise<any> => {
    const now = Date.now();
    const lastRequest = lastRequestTime.get(requestKey) || 0;
    
    // Throttle: Don't make request if one was made recently
    if (now - lastRequest < MIN_REQUEST_INTERVAL) {
      return null;
    }
    
    lastRequestTime.set(requestKey, now);
    
    const token = localStorage.getItem('token');
    if (!token) return null;
    
    try {
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        return await response.json();
      } else {
        return null;
      }
    } catch (error) {
      return null;
    }
  };

  const initializeImmediateTrades = useCallback((trades: Trade[]) => {
    if (trades.length === 0) return;
    
    // Show 2-3 trades immediately for instant engagement
    const initialCount = Math.min(3, trades.length);
    const initialTrades = [];
    
    for (let i = 0; i < initialCount; i++) {
      const trade = trades[i];
      const recentTrade = {
        ...trade,
        timestamp: generateRecentTimestamp().toISOString(),
        displayTime: generateRecentTimestamp().toLocaleTimeString('en-US', { 
          hour: '2-digit', 
          minute: '2-digit' 
        })
      };
      initialTrades.push(recentTrade);
      
      // Mark as viewed
      setViewedTradeIds(prev => new Set(prev).add(trade.id));
      setPositionOpenTimes(prev => new Map(prev).set(recentTrade.id, new Date(recentTrade.timestamp)));
    }
    
    setVisibleTrades(initialTrades);
    setLastTradeShownTime(Date.now());
    
    console.log(`🚀 Initialized ${initialCount} trades for immediate display`);
  }, []);

  const fetchTodaysData = async () => {
    try {
      setLoading(true);
      
      // Fetch today's trades (SINGLE REQUEST)
      const tradesData = await makeRequest(
        buildApiUrl('/compound-interest/daily-trades'), 
        'daily-trades'
      );
      
      if (tradesData?.success && tradesData.dailyTrades) {
        const trades = tradesData.dailyTrades.trades || [];
        setTodaysTrades(trades);
        setDailyTarget(tradesData.dailyTrades.dailyTargetAmount || 0);
        
        // Initialize immediate trades for instant engagement
        if (trades.length > 0) {
          initializeImmediateTrades(trades);
        }
      }
      
      setLoading(false);
    } catch (error) {
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

        setLiveActivity(activityData.liveActivity);
      }
    } catch (error) {
      // Error fetching live activity
    }
  }, []);

  // Recent Activity Engine - No more waiting for timestamps!
  const [viewedTradeIds, setViewedTradeIds] = useState<Set<string>>(new Set());
  const [sessionStartTime] = useState(Date.now());
  const [lastTradeShownTime, setLastTradeShownTime] = useState(0);

  const generateRecentTimestamp = useCallback(() => {
    // Generate timestamp 2-6 minutes ago for "recent activity" feel
    const minutesAgo = 2 + Math.random() * 4;
    return new Date(Date.now() - minutesAgo * 60 * 1000);
  }, []);

  const updateVisibleTrades = useCallback(() => {
    if (!todaysTrades.length) {
      return;
    }

    // 🚀 RECENT ACTIVITY ENGINE: Show trades immediately with recent timestamps
    const now = Date.now();
    const timeSinceLastTrade = now - lastTradeShownTime;
    const minInterval = 45000; // Minimum 45 seconds between trades
    const maxInterval = 90000; // Maximum 90 seconds between trades
    
    // Check if it's time for a new trade
    const shouldShowNewTrade = timeSinceLastTrade >= minInterval && 
                               (timeSinceLastTrade >= maxInterval || Math.random() > 0.7);

    if (shouldShowNewTrade || visibleTrades.length === 0) {
      // Find unviewed trades
      const unviewedTrades = todaysTrades.filter(trade => !viewedTradeIds.has(trade.id));
      
      // If no unviewed trades, reset the viewed set (start over)
      if (unviewedTrades.length === 0 && todaysTrades.length > 0) {
        console.log('🔄 All trades viewed, starting new cycle');
        setViewedTradeIds(new Set());
        setLastTradeShownTime(now);
        return;
      }

      if (unviewedTrades.length > 0) {
        // Select next trade (prioritize profitable trades early for good first impression)
        let nextTrade: Trade;
        const profitableTrades = unviewedTrades.filter(t => t.profitLoss > 0);
        const unprofitableTrades = unviewedTrades.filter(t => t.profitLoss <= 0);
        
        // 70% chance to show profitable trade if available, especially early in session
        const sessionAge = now - sessionStartTime;
        const preferProfitable = sessionAge < 300000 || Math.random() < 0.7; // First 5 min or 70% chance
        
        if (profitableTrades.length > 0 && preferProfitable) {
          nextTrade = profitableTrades[Math.floor(Math.random() * profitableTrades.length)];
        } else if (unprofitableTrades.length > 0) {
          nextTrade = unprofitableTrades[Math.floor(Math.random() * unprofitableTrades.length)];
        } else {
          nextTrade = unviewedTrades[Math.floor(Math.random() * unviewedTrades.length)];
        }

        // Make trade "recent" by updating timestamp
        const recentTrade = {
          ...nextTrade,
          timestamp: generateRecentTimestamp().toISOString(),
          displayTime: generateRecentTimestamp().toLocaleTimeString('en-US', { 
            hour: '2-digit', 
            minute: '2-digit' 
          })
        };

        // Add to visible trades (keep last 8 trades)
        setVisibleTrades(prev => {
          const updated = [recentTrade, ...prev].slice(0, 8);
          return updated;
        });

        // Mark as viewed and update timing
        setViewedTradeIds(prev => new Set(prev).add(nextTrade.id));
        setLastTradeShownTime(now);

        // Set up position timing and animations
        setPositionOpenTimes(prev => new Map(prev).set(recentTrade.id, new Date(recentTrade.timestamp)));
        
        // Add pulse animation for new trade
        setPulsingTrades(prev => new Set(prev).add(recentTrade.id));
        setTimeout(() => {
          setPulsingTrades(prev => {
            const newSet = new Set(prev);
            newSet.delete(recentTrade.id);
            return newSet;
          });
        }, 2000);

        console.log(`🎯 New trade shown: ${recentTrade.cryptoSymbol} ${recentTrade.tradeType} - $${recentTrade.profitLoss.toFixed(2)}`);
      }
    }
  }, [todaysTrades, visibleTrades, viewedTradeIds, lastTradeShownTime, sessionStartTime, generateRecentTimestamp]);

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
    // Poll every 30 seconds for live activity and visual updates
    pollIntervalRef.current = setInterval(() => {
      updateVisibleTrades();
      fetchLiveActivity(); // Only fetch live activity, not both
      simulateRealtimeUpdates();
    }, 30000); // Optimized frequency for visual updates
  }, [updateVisibleTrades, fetchLiveActivity, simulateRealtimeUpdates]);

  const startBackendPolling = useCallback(() => {
    // Poll backend every 5 minutes for new trades
    const backendPollInterval = setInterval(() => {
      console.log('🔄 Polling backend for new trades...');
      fetchTodaysData(); // Fetch fresh trades from backend
    }, 5 * 60 * 1000); // 5 minutes

    return () => clearInterval(backendPollInterval);
  }, []);

  // useEffects
  useEffect(() => {
    fetchTodaysData(); // Initial fetch of today's data
    startPolling();
    
    // Start 5-minute backend polling
    const cleanupBackendPolling = startBackendPolling();
    
    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }
      // Clean up backend polling
      cleanupBackendPolling();
      // eslint-disable-next-line react-hooks/exhaustive-deps
      const currentAnimation = animationRef.current;
      if (currentAnimation) {
        clearTimeout(currentAnimation);
      }
      if (priceMovementRef.current) {
        clearInterval(priceMovementRef.current);
      }
    };
  }, [startPolling, startBackendPolling]);

  useEffect(() => {
    updateVisibleTrades();
  }, [todaysTrades, executingTrades, pulsingTrades, positionOpenTimes, updateVisibleTrades]);

  // Recent Activity Engine: Show new trades every 15-30 seconds
  useEffect(() => {
    // Show initial trades immediately
    if (todaysTrades.length > 0 && visibleTrades.length === 0) {
      updateVisibleTrades();
    }

    // Check for new trades to show every 15 seconds
    const recentActivityInterval = setInterval(() => {
      updateVisibleTrades();
    }, 15000); // Check every 15 seconds for new trades to reveal

    return () => clearInterval(recentActivityInterval);
  }, [updateVisibleTrades, todaysTrades.length, visibleTrades.length]);

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
      <div style={{
        background: 'rgba(0, 0, 0, 0.3)',
        backdropFilter: 'blur(15px)',
        borderRadius: '20px',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        padding: '40px',
        boxShadow: '0 12px 40px rgba(0, 0, 0, 0.4)',
        textAlign: 'center'
      }}>
        <Activity style={{ 
          fontSize: '48px', 
          color: 'rgba(255, 255, 255, 0.4)', 
          marginBottom: '16px' 
        }} />
        <h3 style={{ 
          color: '#ffffff', 
          fontSize: '20px', 
          fontWeight: '600', 
          margin: '0 0 8px 0' 
        }}>
          No trading activity today
        </h3>
        <p style={{ 
          color: 'rgba(255, 255, 255, 0.6)', 
          fontSize: '16px', 
          margin: 0 
        }}>
          Market: Closed
        </p>
      </div>
    );
  }

  return (
    <>
      {/* Beautiful Glass Styling */}
      <style>
        {`
          @keyframes slideDown {
            0% {
              opacity: 0;
              transform: translateY(-50px) scale(0.9);
            }
            50% {
              opacity: 0.7;
              transform: translateY(-10px) scale(0.95);
            }
            100% {
              opacity: 1;
              transform: translateY(0) scale(1);
            }
          }

          @keyframes glowPulse {
            0%, 100% {
              box-shadow: 0 4px 20px rgba(16, 185, 129, 0.3);
            }
            50% {
              box-shadow: 0 6px 30px rgba(16, 185, 129, 0.5);
            }
          }
          
          .trade-card-beautiful {
            background: rgba(0, 0, 0, 0.3) !important;
            backdrop-filter: blur(12px) !important;
            border-radius: 12px !important;
            border: 1px solid rgba(255, 255, 255, 0.15) !important;
            padding: 16px !important;
            margin-bottom: 12px !important;
            transition: all 0.8s ease !important;
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2) !important;
            position: relative;
            overflow: hidden;
          }
          
          .trade-card-beautiful:hover {
            transform: translateY(-2px);
            box-shadow: 0 8px 30px rgba(0, 0, 0, 0.3) !important;
          }
          
          .trade-card-beautiful.profit-card {
            border: 1px solid rgba(16, 185, 129, 0.3) !important;
            animation: glowPulse 3s ease-in-out infinite;
          }
          
          .trade-card-beautiful.loss-card {
            border: 1px solid rgba(239, 68, 68, 0.3) !important;
          }

          .live-trading-header {
            background: rgba(0, 0, 0, 0.4) !important;
            backdrop-filter: blur(20px) !important;
            border-radius: 16px !important;
            border: 1px solid rgba(255, 255, 255, 0.1) !important;
            padding: 20px !important;
            margin-bottom: 20px !important;
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3) !important;
          }

          .live-indicator {
            background: rgba(16, 185, 129, 0.2) !important;
            border: 1px solid rgba(16, 185, 129, 0.4) !important;
            backdrop-filter: blur(8px) !important;
            border-radius: 20px !important;
            padding: 8px 16px !important;
            display: flex !important;
            align-items: center !important;
            gap: 8px !important;
          }

          .live-dot {
            width: 8px;
            height: 8px;
            background: #10b981;
            border-radius: 50%;
            animation: pulse 2s ease-in-out infinite;
          }

          .trading-container {
            background: rgba(0, 0, 0, 0.2) !important;
            backdrop-filter: blur(15px) !important;
            border-radius: 20px !important;
            border: 1px solid rgba(255, 255, 255, 0.1) !important;
            padding: 24px !important;
            box-shadow: 0 12px 40px rgba(0, 0, 0, 0.4) !important;
            position: relative;
            overflow: hidden;
          }

          .trading-container::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            height: 2px;
            background: linear-gradient(90deg, transparent, #10b981, transparent);
            animation: shimmer 3s ease-in-out infinite;
          }

          @keyframes shimmer {
            0%, 100% { opacity: 0.3; }
            50% { opacity: 1; }
          }
        `}
      </style>

      <div className="trading-container" style={{ 
        height: '100%', 
        display: 'flex', 
        flexDirection: 'column',
        minHeight: 'calc(100vh - 8rem)' // Full viewport height minus padding
      }}>
        <div className="live-trading-header">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <Activity style={{ color: '#10b981', fontSize: '28px' }} />
              <h3 style={{ color: '#ffffff', fontSize: '24px', fontWeight: '600', margin: 0 }}>
                Live Trading Activity
              </h3>
            </div>
            <div className="live-indicator">
              <div className="live-dot" />
              <span style={{ color: '#ffffff', fontSize: '14px', fontWeight: '600' }}>
                LIVE
              </span>
            </div>
          </div>
          
          {/* Trading Stats Summary */}
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            marginTop: '16px',
            padding: '12px 0',
            borderTop: '1px solid rgba(255, 255, 255, 0.1)'
          }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: '12px', marginBottom: '4px' }}>
                Active Trades
              </div>
              <div style={{ color: '#ffffff', fontSize: '18px', fontWeight: '600' }}>
                {visibleTrades.length}
              </div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: '12px', marginBottom: '4px' }}>
                Unrealized P&L
              </div>
              <div style={{ 
                color: totalUnrealizedPL >= 0 ? '#10b981' : '#ef4444', 
                fontSize: '18px', 
                fontWeight: '600' 
              }}>
                {totalUnrealizedPL >= 0 ? '+' : ''}${totalUnrealizedPL.toFixed(2)}
              </div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: '12px', marginBottom: '4px' }}>
                Portfolio
              </div>
              <div style={{ color: '#ffffff', fontSize: '18px', fontWeight: '600' }}>
                ${liveBalance.toFixed(0)}
              </div>
            </div>
          </div>
        </div>

        <div 
          ref={feedRef} 
          style={{ 
            flex: 1, // Take all remaining space
            overflowY: 'auto', 
            paddingRight: '8px',
            minHeight: 0 // Allow flex child to shrink
          }}
        >
        {visibleTrades.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 0', color: 'rgba(255, 255, 255, 0.6)' }}>
            <Activity style={{ fontSize: '48px', marginBottom: '16px', opacity: 0.5 }} />
            <p style={{ fontSize: '16px', margin: 0 }}>Waiting for trading opportunities...</p>
          </div>
        ) : (
          visibleTrades.map((trade, index) => {
            const currentPL = positionPLs.get(trade.id) || trade.profitLoss;
            const progress = tradeProgresses.get(trade.id) || 0;
            const isExecuting = executingTrades.has(trade.id);
            const isPulsing = pulsingTrades.has(trade.id);
            const isProfit = currentPL >= 0;

            return (
              <div
                key={trade.id}
                className={`trade-card-beautiful ${isProfit ? 'profit-card' : 'loss-card'}`}
                style={{
                  animation: isPulsing ? 'slideDown 1.2s ease-out both' : 'none',
                }}
              >
                {/* Top Row - Symbol and Type */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{
                      background: trade.tradeType === 'long' ? '#10b981' : '#ef4444',
                      color: 'white',
                      padding: '4px 8px',
                      borderRadius: '6px',
                      fontSize: '12px',
                      fontWeight: '600',
                      textTransform: 'uppercase'
                    }}>
                      {trade.tradeType}
                    </span>
                    <span style={{
                      color: '#ffffff',
                      fontWeight: '600',
                      fontSize: '16px'
                    }}>
                      {trade.cryptoSymbol}
                    </span>
                  </div>
                  
                  {/* Status Indicator */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <div style={{
                      width: '8px',
                      height: '8px',
                      borderRadius: '50%',
                      background: isProfit ? '#10b981' : '#ef4444',
                      animation: isExecuting ? 'pulse 2s ease-in-out infinite' : 'none'
                    }} />
                    {isExecuting && (
                      <span style={{ color: '#f59e0b', fontSize: '12px', fontWeight: '600' }}>
                        EXECUTING
                      </span>
                    )}
                  </div>
                </div>

                {/* Main Content */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <div>
                    <div style={{ color: '#ffffff', fontSize: '14px', marginBottom: '4px' }}>
                      {trade.cryptoName || trade.cryptoSymbol}
                    </div>
                    <div style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '13px' }}>
                      ${Math.abs(trade.amount).toFixed(2)} Position
                    </div>
                  </div>
                  
                  <div style={{ textAlign: 'right' }}>
                    <div style={{
                      color: isProfit ? '#10b981' : '#ef4444',
                      fontSize: '18px',
                      fontWeight: '700'
                    }}>
                      {isProfit ? '+' : ''}${currentPL.toFixed(2)}
                    </div>
                    <div style={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: '12px' }}>
                      {new Date(trade.timestamp).toLocaleTimeString()}
                    </div>
                  </div>
                </div>

                {/* Progress Bar */}
                <div style={{ marginTop: '12px' }}>
                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    marginBottom: '6px',
                    color: 'rgba(255, 255, 255, 0.7)',
                    fontSize: '12px'
                  }}>
                    <span>Position Progress</span>
                    <span>{Math.round(progress * 100)}%</span>
                  </div>
                  <div style={{
                    width: '100%',
                    height: '6px',
                    background: 'rgba(255, 255, 255, 0.1)',
                    borderRadius: '3px',
                    overflow: 'hidden'
                  }}>
                    <div style={{
                      height: '100%',
                      width: `${progress * 100}%`,
                      background: isProfit 
                        ? 'linear-gradient(90deg, #10b981, #34d399)' 
                        : 'linear-gradient(90deg, #ef4444, #f87171)',
                      borderRadius: '3px',
                      transition: 'width 0.5s ease',
                      boxShadow: isProfit 
                        ? '0 0 10px rgba(16, 185, 129, 0.5)' 
                        : '0 0 10px rgba(239, 68, 68, 0.5)'
                    }} />
                  </div>
                </div>

                {/* Glow effect for new trades */}
                {isPulsing && (
                  <div style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    borderRadius: '12px',
                    background: `linear-gradient(45deg, 
                      rgba(16, 185, 129, 0.1), 
                      rgba(16, 185, 129, 0.05), 
                      transparent)`,
                    pointerEvents: 'none'
                  }} />
                )}
              </div>
            );
          })
        )}
      </div>

        {/* Beautiful Summary Footer */}
        {visibleTrades.length > 0 && (
          <div style={{
            marginTop: '20px',
            padding: '16px',
            background: 'rgba(0, 0, 0, 0.5)',
            backdropFilter: 'blur(15px)',
            borderRadius: '12px',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: 'rgba(255, 255, 255, 0.8)', fontSize: '14px' }}>
                {visibleTrades.length} active position{visibleTrades.length !== 1 ? 's' : ''}
              </span>
              <span style={{
                color: totalUnrealizedPL >= 0 ? '#10b981' : '#ef4444',
                fontSize: '16px',
                fontWeight: '700'
              }}>
                Total P&L: {totalUnrealizedPL >= 0 ? '+' : ''}${totalUnrealizedPL.toFixed(2)}
              </span>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default LiveTradingFeed;