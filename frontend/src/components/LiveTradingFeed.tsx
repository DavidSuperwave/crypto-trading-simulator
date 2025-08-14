import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  Clock, 
  DollarSign, 
  Target,
  Activity,
  Zap
} from 'lucide-react';
import { buildApiUrl, API_CONFIG } from '../config/api';
import { usePortfolioData } from '../hooks/usePortfolioData';
import { useLiveTradingData } from '../context/LiveTradingContext';

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
  variance: string;
  positionSize?: number;     // Actual capital used for position (80% portfolio)
  // Position tracking
  currentPL?: number;        // Fluctuating P&L (what we show)
  lockEndTime?: string;      // When position closes
  progress?: number;         // 0-1, how close to completion
}

interface EnhancedPosition {
  id: string;
  trade: Trade;
  openTime: Date;
  closeTime: Date;
  targetPL: number;          // Predetermined final P&L
  currentPL: number;         // Live fluctuating P&L
  positionSize: number;      // Capital invested in this position
  peakGain: number;          // Highest P&L reached
  lowestLoss: number;        // Lowest P&L reached
  phase: 'WILD_SWINGS' | 'STEERING' | 'CONVERGENCE';
  timeProgress: number;      // 0-1, time elapsed since open
}

interface TradingSummary {
  totalAmount: number;
  winningTrades: number;
  losingTrades: number;
  winRate: number;
  avgTradeSize: number;
  marketHoursSpan: string;
}

interface LiveActivity {
  hasActivity: boolean;
  date: string;
  totalTrades: number;
  recentTrades: Trade[];
  nextTradeETA: number;
  dailySummary: TradingSummary;
  marketStatus: 'open' | 'closed';
}

const LiveTradingFeed: React.FC = () => {
  const [todaysTrades, setTodaysTrades] = useState<Trade[]>([]);
  const [visibleTrades, setVisibleTrades] = useState<Trade[]>([]);
  const [liveActivity, setLiveActivity] = useState<LiveActivity | null>(null);
  const [loading, setLoading] = useState(true);
  const [newTradeAnimation, setNewTradeAnimation] = useState<string[]>([]);
  const [dailyTarget, setDailyTarget] = useState<number>(0);
  const [currentProgress, setCurrentProgress] = useState<number>(0);
  
  // Real-time animation states
  const [animatedProgress, setAnimatedProgress] = useState<number>(0);
  const [animatedTarget, setAnimatedTarget] = useState<number>(0);
  const [liveBalance, setLiveBalance] = useState<number>(0);
  const [executingTrades, setExecutingTrades] = useState<Set<string>>(new Set());
  const [unrealizedPL, setUnrealizedPL] = useState<number>(0);
  const [pulsingTrades, setPulsingTrades] = useState<Set<string>>(new Set());
  
  // Position P&L tracking (legacy)
  const [positionPLs, setPositionPLs] = useState<Map<string, number>>(new Map());
  const [tradeProgresses, setTradeProgresses] = useState<Map<string, number>>(new Map());
  
  // Track when positions actually open (not when trades were generated)
  const [positionOpenTimes, setPositionOpenTimes] = useState<Map<string, Date>>(new Map());
  
  // Track price movement direction for glow effects
  const [priceDirections, setPriceDirections] = useState<Map<string, 'up' | 'down' | 'neutral'>>(new Map());
  const [lastPrices, setLastPrices] = useState<Map<string, number>>(new Map());
  
  // Enhanced position system
  const [enhancedPositions, setEnhancedPositions] = useState<Map<string, EnhancedPosition>>(new Map());
  const [totalLockedCapital, setTotalLockedCapital] = useState<number>(0);
  
  // Portfolio data for locked capital
  const { portfolioData } = usePortfolioData();
  
  // Live trading context for sharing P&L data
  const { liveTradingData, updateLiveTradingData } = useLiveTradingData();
  
  const feedRef = useRef<HTMLDivElement>(null);
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const animationRef = useRef<NodeJS.Timeout | null>(null);
  const priceMovementRef = useRef<NodeJS.Timeout | null>(null);
  const initializedRef = useRef<boolean>(false);

  const fetchTodaysData = async () => {
    try {
      const token = localStorage.getItem('token');
      const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      };

      // Debug logging
      console.log('🎯 LiveTradingFeed - fetching from:', buildApiUrl('/compound-interest/daily-trades'));
      console.log('🔐 Auth token preview:', token ? token.substring(0, 20) + '...' : 'No token');
      console.log('🔐 Auth headers:', headers);
      
      // Fetch today's trades
      const tradesResponse = await fetch(buildApiUrl('/compound-interest/daily-trades'), { headers });
      console.log('📊 Trades response status:', tradesResponse.status, tradesResponse.statusText);
      
      if (tradesResponse.ok) {
        const tradesData = await tradesResponse.json();
        console.log('📊 Trades data:', tradesData);
        
        if (tradesData.success && tradesData.dailyTrades) {
          console.log('📊 Setting trades:', tradesData.dailyTrades.trades?.length || 0, 'trades');
          setTodaysTrades(tradesData.dailyTrades.trades || []);
          setDailyTarget(tradesData.dailyTrades.dailyTargetAmount || 0);
        } else {
          console.log('❌ Trades API returned no daily trades:', tradesData);
        }
      } else {
        console.log('❌ Trades API failed:', tradesResponse.status);
      }

      // Fetch live activity
      const activityResponse = await fetch(buildApiUrl('/compound-interest/live-activity'), { headers });
      console.log('📺 Live activity response status:', activityResponse.status, activityResponse.statusText);
      
      if (activityResponse.ok) {
        const activityData = await activityResponse.json();
        console.log('📺 Live activity data:', activityData);
        
        if (activityData.success) {
          console.log('📺 Setting liveActivity:', activityData.liveActivity);
          setLiveActivity(activityData.liveActivity);
        } else {
          console.log('❌ Live activity API returned success=false:', activityData);
        }
      } else {
        console.log('❌ Live activity API failed:', activityResponse.status);
      }
      
      setLoading(false);
    } catch (error) {
      console.error('Error fetching trading data:', error);
      setLoading(false);
    }
  };

  const startPolling = () => {
    // Poll every 8 seconds to prevent infinite loops
    pollIntervalRef.current = setInterval(() => {
      updateVisibleTrades();
      fetchLiveActivity();
      simulateRealtimeUpdates();
    }, 8000);
  };

  const fetchLiveActivity = async () => {
    try {
      const token = localStorage.getItem('token');
              const response = await fetch(buildApiUrl('/compound-interest/live-activity'), {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setLiveActivity(data.liveActivity);
        }
      }
    } catch (error) {
      console.error('Error fetching live activity:', error);
    }
  };

  const updateVisibleTrades = useCallback(() => {
    if (!todaysTrades.length) {
      return;
    }

    const now = new Date();
    // First filter trades that should have appeared by now
    const availableTrades = todaysTrades.filter(trade => {
      const tradeTime = new Date(trade.timestamp);
      return tradeTime <= now;
    });

    // Filter to show only active positions
    const newVisibleTrades = availableTrades.filter(trade => {
      // Check if trade is executing, pulsing, or has progress < 98%
      const hasProgress = tradeProgresses.has(trade.id);
      const progress = hasProgress ? tradeProgresses.get(trade.id)! : 0;
      const hasOpenTime = positionOpenTimes.has(trade.id);
      const isExecuting = executingTrades.has(trade.id);
      const isPulsing = pulsingTrades.has(trade.id);
      
      const isActive = isExecuting || 
                      isPulsing || 
                      (hasProgress && progress < 0.98) ||
                      hasOpenTime; // Keep trades with open times even if no progress yet
      

      
      // Only clean up position open times for trades that are truly completed (progress >= 98%)
      if (!isActive && hasOpenTime && hasProgress && progress >= 0.98) {
        setTimeout(() => {
          setPositionOpenTimes(prev => {
            const newMap = new Map(prev);
            newMap.delete(trade.id);
            return newMap;
          });
        }, 100); // Delay cleanup slightly to avoid race conditions
      }
      
      return isActive;
    });

    // Find newly visible trades for animation
    const previousCount = visibleTrades.length;
    const newCount = newVisibleTrades.length;
    
    if (newCount > previousCount) {
      const newTrades = newVisibleTrades.slice(previousCount);
      const newTradeIds = newTrades.map(t => t.id);
      
      // Flash animation for new trades
      setNewTradeAnimation(newTradeIds);
      setPulsingTrades(new Set(newTradeIds));
      
      setTimeout(() => {
        setNewTradeAnimation([]);
        setPulsingTrades(new Set());
      }, 3000);
    }

    // Safety mechanism: If no trades are visible but we have available trades and no positions initialized,
    // show some available trades temporarily to allow initialization
    if (newVisibleTrades.length === 0 && availableTrades.length > 0 && positionOpenTimes.size === 0 && !initializedRef.current) {
      const emergencyTrades = availableTrades.slice(0, Math.min(3, availableTrades.length));
      setVisibleTrades(emergencyTrades);
      
      // Trigger initialization manually
      setTimeout(() => {
        if (!initializedRef.current && todaysTrades.length > 0) {
          const now = new Date();
          const tradesToOpen = availableTrades
            .sort(() => Math.random() - 0.5)
            .slice(0, Math.min(availableTrades.length, 2 + Math.floor(Math.random() * 3)));
          
          const newProgresses = new Map();
          const newPLs = new Map();
          const newOpenTimes = new Map();
          
          tradesToOpen.forEach(trade => {
            newOpenTimes.set(trade.id, new Date());
            newProgresses.set(trade.id, 0);
            const positionSize = trade.positionSize || Math.abs(trade.amount * 20);
            const initialSwing = (Math.random() - 0.5) * positionSize * 0.1;
            newPLs.set(trade.id, initialSwing);
          });
          
          setPositionOpenTimes(newOpenTimes);
          setTradeProgresses(newProgresses);
          setPositionPLs(newPLs);
          initializedRef.current = true;
          
          // The useEffect should automatically trigger updateVisibleTrades after state updates
        }
      }, 200);
      
      return;
    }
    
    setVisibleTrades(newVisibleTrades);
    
    // Calculate current progress with smooth animation
    const totalProgress = newVisibleTrades.reduce((sum, trade) => sum + trade.profitLoss, 0);
    setCurrentProgress(totalProgress);
    animateValueTo(animatedProgress, totalProgress, setAnimatedProgress);
  }, [todaysTrades, tradeProgresses, positionOpenTimes, executingTrades, pulsingTrades, animatedProgress]);

  // Animate number changes smoothly
  const animateValueTo = (current: number, target: number, setter: (value: number) => void, duration = 1500) => {
    const difference = target - current;
    const steps = 20;
    const stepValue = difference / steps;
    const stepDuration = duration / steps;
    
    let step = 0;
    const animate = () => {
      if (step < steps) {
        setter(current + (stepValue * step));
        step++;
        setTimeout(animate, stepDuration);
      } else {
        setter(target);
      }
    };
    animate();
  };

  // Calculate position progress and convergence based on ACTUAL position open time
  const calculatePositionProgress = (trade: Trade): number => {
    const now = new Date();
    const positionOpenTime = positionOpenTimes.get(trade.id);
    
    // If no open time recorded, position hasn't actually opened yet
    if (!positionOpenTime) {
      return 0;
    }
    
    // Positions run for 3-7 minutes from when they actually opened
    // Use a random duration for each position (stored in trade data or generate consistently)
    const minDuration = 3 * 60 * 1000; // 3 minutes
    const maxDuration = 7 * 60 * 1000; // 7 minutes
    const tradeHashCode = trade.id.split('').reduce((a, b) => a + b.charCodeAt(0), 0);
    const normalizedHash = (tradeHashCode % 1000) / 1000; // 0-1 
    const positionDuration = minDuration + (normalizedHash * (maxDuration - minDuration));
    
    const elapsed = now.getTime() - positionOpenTime.getTime();
    const progress = Math.max(0, Math.min(1, elapsed / positionDuration));
    

    
    return progress;
  };

  // Get convergence factor based on progress
  const getConvergenceFactor = (progress: number, variance: string): number => {
    const baseVariance = variance === 'high' ? 0.8 : variance === 'medium' ? 0.5 : 0.3;
    
    if (progress < 0.3) return baseVariance;      // Early: High variance
    if (progress < 0.7) return baseVariance * 0.5; // Mid: Medium variance  
    if (progress < 0.95) return baseVariance * 0.2; // Late: Low variance
    return baseVariance * 0.05;                   // Final: Minimal variance
  };

  // Calculate fluctuating P&L for a position with HIGH SWINGS based on position size
  const calculateFluctuatingPL = (trade: Trade, progress: number): number => {
    const finalPL = trade.profitLoss;
    const positionSize = trade.positionSize || Math.abs(trade.amount * 20); // Fallback if no positionSize
    const convergenceFactor = getConvergenceFactor(progress, trade.variance);
    
    // Get current stored P&L or start near zero
    const currentPL = positionPLs.get(trade.id) || 0;
    
    // 🎯 CREATE HIGH SWINGS: Base on position size, not just final P&L
    let maxSwingPercent = 0.5; // 50% swings early on
    
    // Reduce swing percentage as position approaches completion
    if (progress < 0.3) {
      maxSwingPercent = 0.5;  // 50% swings early (wild phase)
    } else if (progress < 0.7) {
      maxSwingPercent = 0.3;  // 30% swings middle (steering phase)  
    } else if (progress < 0.95) {
      maxSwingPercent = 0.1;  // 10% swings late (convergence phase)
    } else {
      maxSwingPercent = 0.02; // 2% swings final (almost locked in)
    }
    
    // Calculate max swing based on position size
    const maxSwingAmount = positionSize * maxSwingPercent;
    const randomChange = (Math.random() - 0.5) * maxSwingAmount * 0.8;
    
    // Bias toward final P&L as progress increases (stronger convergence)
    const biasTowardFinal = (finalPL - currentPL) * progress * 0.15;
    
    let newPL = currentPL + randomChange + biasTowardFinal;
    
    // Constrain to realistic bounds (can swing from -50% to +50% of position size early)
    const maxBound = positionSize * 0.5;
    const minBound = -positionSize * 0.5;
    
    // As progress increases, constrain bounds closer to final P&L
    const progressConstraint = Math.max(0.1, 1 - progress);
    const constrainedMaxBound = finalPL + (maxBound * progressConstraint);
    const constrainedMinBound = finalPL + (minBound * progressConstraint);
    
    newPL = Math.max(constrainedMinBound, Math.min(constrainedMaxBound, newPL));
    
    // Force convergence at the end
    if (progress >= 0.98) {
      newPL = finalPL;
    }
    
    return newPL;
  };

  // Simulate exciting real-time market movement with position P&L
  const simulateRealtimeUpdates = () => {
    const now = new Date();
    
    // Get all available trades that could be opened
    const availableTrades = todaysTrades.filter(trade => {
      const tradeTime = new Date(trade.timestamp);
      return tradeTime <= now;
    });

    // Update position P&Ls for all visible trades
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

    // Open new positions randomly from available trades
    if (visibleTrades.length < 8 && availableTrades.length > 0 && Math.random() > 0.7) {
      const unopenedTrades = availableTrades.filter(trade => 
        !visibleTrades.some(vt => vt.id === trade.id)
      );
      
      if (unopenedTrades.length > 0) {
        const newTrade = unopenedTrades[Math.floor(Math.random() * unopenedTrades.length)];
        
        // Record the actual position open time (NOW, not trade timestamp)
        setPositionOpenTimes(prev => new Map(prev).set(newTrade.id, new Date()));
        
        // Initialize the new trade with 0% progress and small initial swing
        updatedProgresses.set(newTrade.id, 0);
        const positionSize = newTrade.positionSize || Math.abs(newTrade.amount * 20);
        const initialSwing = (Math.random() - 0.5) * positionSize * 0.05; // ±5% initial swing
        updatedPLs.set(newTrade.id, initialSwing);
        
        // Mark as executing initially
        setExecutingTrades(prev => {
          const newSet = new Set(Array.from(prev));
          newSet.add(newTrade.id);
          return newSet;
        });
        
        // Stop executing after a few seconds
        setTimeout(() => {
          setExecutingTrades(prev => {
            const newSet = new Set(Array.from(prev));
            newSet.delete(newTrade.id);
            return newSet;
          });
        }, 2000 + Math.random() * 3000);
      }
    }

    // Add unrealized P&L fluctuations for extra excitement
    const volatility = (Math.random() - 0.5) * 10;
    setUnrealizedPL(prev => {
      const newValue = prev + volatility;
      return Math.max(-25, Math.min(25, newValue));
    });

    // Update live balance with position P&Ls
    const totalPositionPL = Array.from(updatedPLs.values()).reduce((sum, pl) => sum + pl, 0);
    const baseBalance = 10000;
    setLiveBalance(baseBalance + totalPositionPL + unrealizedPL);
    
    // Update visible trades list to reflect new/closed positions
    setTimeout(() => updateVisibleTrades(), 100);
  };

  useEffect(() => {
    updateVisibleTrades();
  }, [todaysTrades, executingTrades, pulsingTrades, positionOpenTimes]);

  // Initialize starting positions when trades first load (run only once)
  useEffect(() => {
    if (todaysTrades.length > 0 && !initializedRef.current) {
      const now = new Date();
      const availableTrades = todaysTrades.filter(trade => {
        const tradeTime = new Date(trade.timestamp);
        return tradeTime <= now;
      });
      
      if (availableTrades.length > 0) {
        // Open 2-4 random positions to start
        const numToOpen = Math.min(availableTrades.length, 2 + Math.floor(Math.random() * 3));
        const tradesToOpen = availableTrades
          .sort(() => Math.random() - 0.5)
          .slice(0, numToOpen);
        
        const newProgresses = new Map();
        const newPLs = new Map();
        const newOpenTimes = new Map();
        
        tradesToOpen.forEach(trade => {
          // Record when this position actually opens (now)
          newOpenTimes.set(trade.id, new Date());
          
          // Start positions at 0% progress (they'll naturally progress over time)
          newProgresses.set(trade.id, 0);
          // Start with small initial swing based on position size
          const positionSize = trade.positionSize || Math.abs(trade.amount * 20);
          const initialSwing = (Math.random() - 0.5) * positionSize * 0.1; // ±10% initial swing
          newPLs.set(trade.id, initialSwing);
        });
        
        setPositionOpenTimes(newOpenTimes);
        setTradeProgresses(newProgresses);
        setPositionPLs(newPLs);
        initializedRef.current = true;
      }
    }
  }, [todaysTrades]);

  const formatCurrency = (amount: number) => {
    const abs = Math.abs(amount);
    if (abs >= 1000) {
      return `$${(amount / 1000).toFixed(1)}k`;
    }
    return `$${amount.toFixed(2)}`;
  };





  // Simulate price movements every 3 seconds
  const simulatePriceMovements = useCallback(() => {
    const updatedPLs = new Map(positionPLs);
    const updatedDirections = new Map(priceDirections);
    const updatedLastPrices = new Map(lastPrices);
    
    visibleTrades.forEach(trade => {
      const currentPL = updatedPLs.get(trade.id) || trade.profitLoss;
      const lastPrice = updatedLastPrices.get(trade.id) || currentPL;
      
      // Create realistic price movement (±2-8% of current value)
      const volatility = 0.02 + Math.random() * 0.06; // 2-8% movement
      const direction = Math.random() > 0.5 ? 1 : -1;
      const movement = currentPL * volatility * direction;
      const newPL = currentPL + movement;
      
      // Determine direction for glow effect
      if (newPL > lastPrice) {
        updatedDirections.set(trade.id, 'up');
      } else if (newPL < lastPrice) {
        updatedDirections.set(trade.id, 'down');
      } else {
        updatedDirections.set(trade.id, 'neutral');
      }
      
      updatedPLs.set(trade.id, newPL);
      updatedLastPrices.set(trade.id, currentPL); // Store previous price for next comparison
    });
    
    setPositionPLs(updatedPLs);
    setPriceDirections(updatedDirections);
    setLastPrices(updatedLastPrices);
    
    // Clear direction indicators after 2 seconds
    setTimeout(() => {
      setPriceDirections(prev => {
        const cleared = new Map(prev);
        visibleTrades.forEach(trade => {
          cleared.set(trade.id, 'neutral');
        });
        return cleared;
      });
    }, 2000);
  }, [visibleTrades, positionPLs, priceDirections, lastPrices]);

  const startPriceMovements = useCallback(() => {
    // Price movements every 3 seconds
    return setInterval(() => {
      simulatePriceMovements();
    }, 3000);
  }, [simulatePriceMovements]);

  // useEffects
  useEffect(() => {
    fetchTodaysData();
    startPolling();
    
    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }
      if (animationRef.current) {
        clearTimeout(animationRef.current);
      }
      if (priceMovementRef.current) {
        clearInterval(priceMovementRef.current);
      }
    };
  }, []);

  // Start price movements when we have visible trades
  useEffect(() => {
    if (visibleTrades.length > 0) {
      // Clear existing interval
      if (priceMovementRef.current) {
        clearInterval(priceMovementRef.current);
      }
      // Start new interval
      priceMovementRef.current = startPriceMovements();
    } else {
      // Clear interval when no trades
      if (priceMovementRef.current) {
        clearInterval(priceMovementRef.current);
        priceMovementRef.current = null;
      }
    }
  }, [visibleTrades.length, startPriceMovements]);

  // Enhanced trading system helper functions
  const calculatePositionSize = (availableCapital: number, targetPL: number): number => {
    const baseSize = availableCapital / 8; // Spread across ~8 positions
    const riskFactor = Math.abs(targetPL) / 100; // Risk adjustment
    return Math.min(baseSize * (1 + riskFactor), availableCapital * 0.3);
  };

  const getPhase = (timeProgress: number): 'WILD_SWINGS' | 'STEERING' | 'CONVERGENCE' => {
    if (timeProgress < 0.6) return 'WILD_SWINGS';
    if (timeProgress < 0.85) return 'STEERING'; 
    return 'CONVERGENCE';
  };

  const calculateRealisticSwing = (position: EnhancedPosition): number => {
    const { targetPL, phase, currentPL, timeProgress } = position;
    
    if (phase === 'WILD_SWINGS') {
      // ±50% swings with high volatility
      const maxSwing = Math.abs(targetPL) * 0.5;
      const baseSwing = (Math.random() - 0.5) * 2 * maxSwing;
      const volatility = (Math.random() - 0.5) * 20; // Additional market noise
      return targetPL + baseSwing + volatility;
    }
    
    if (phase === 'STEERING') {
      // Gradual convergence toward target with reduced volatility
      const pullForce = (timeProgress - 0.6) / 0.25; // 0 to 1 over steering phase
      const targetDirection = targetPL - currentPL;
      const pull = targetDirection * pullForce * 0.3;
      const volatility = (Math.random() - 0.5) * Math.abs(targetPL) * 0.2;
      return currentPL + pull + volatility;
    }
    
    if (phase === 'CONVERGENCE') {
      // Strong convergence to exact target
      const convergenceForce = (timeProgress - 0.85) / 0.15; // 0 to 1 over convergence phase
      const convergenceStrength = Math.pow(convergenceForce, 2); // Exponential convergence
      return currentPL + (targetPL - currentPL) * convergenceStrength;
    }
    
    return targetPL;
  };

  const getMaxLockedCapital = useCallback((): number => {
    return (portfolioData?.totalPortfolioValue || 10000) * 0.8; // 80% of portfolio
  }, [portfolioData?.totalPortfolioValue]);

  const getAvailableCapital = useCallback((): number => {
    return getMaxLockedCapital() - totalLockedCapital;
  }, [getMaxLockedCapital, totalLockedCapital]);

  const openEnhancedPosition = useCallback((trade: Trade): void => {
    const availableCapital = getAvailableCapital();
    const positionSize = calculatePositionSize(availableCapital, trade.profitLoss);
    
    // Don't open if not enough capital
    if (positionSize < 500) return;
    
    const now = new Date();
    // Random duration between 3-7 minutes
    const durationMs = (3 + Math.random() * 4) * 60 * 1000;
    const closeTime = new Date(now.getTime() + durationMs);
    
    const newPosition: EnhancedPosition = {
      id: trade.id,
      trade,
      openTime: now,
      closeTime,
      targetPL: trade.profitLoss,
      currentPL: 0, // Start at breakeven
      positionSize,
      peakGain: 0,
      lowestLoss: 0,
      phase: 'WILD_SWINGS',
      timeProgress: 0
    };
    
    setEnhancedPositions(prev => new Map(prev).set(trade.id, newPosition));
    setTotalLockedCapital(prev => prev + positionSize);
    
    // Mark as executing initially
    setExecutingTrades(prev => {
      const newSet = new Set(Array.from(prev));
      newSet.add(trade.id);
      return newSet;
    });
    
    // Stop executing after a few seconds
    setTimeout(() => {
      setExecutingTrades(prev => {
        const newSet = new Set(Array.from(prev));
        newSet.delete(trade.id);
        return newSet;
      });
    }, 2000 + Math.random() * 3000);
  }, [getAvailableCapital, totalLockedCapital]);

  const closeEnhancedPosition = useCallback((positionId: string): void => {
    const position = enhancedPositions.get(positionId);
    if (!position) return;
    
    // Add final P&L to daily total (this ensures mathematical accuracy)
    // The position has converged to its exact target, so we can close it
    
    setEnhancedPositions(prev => {
      const newMap = new Map(prev);
      newMap.delete(positionId);
      return newMap;
    });
    
    setTotalLockedCapital(prev => prev - position.positionSize);
    
    // Remove from any active states
    setExecutingTrades(prev => {
      const newSet = new Set(Array.from(prev));
      newSet.delete(positionId);
      return newSet;
    });
    
    setPulsingTrades(prev => {
      const newSet = new Set(Array.from(prev));
      newSet.delete(positionId);
      return newSet;
    });
  }, [enhancedPositions]);

  const updateEnhancedPosition = (position: EnhancedPosition): EnhancedPosition => {
    const now = new Date();
    const elapsed = now.getTime() - position.openTime.getTime();
    const duration = position.closeTime.getTime() - position.openTime.getTime();
    const timeProgress = Math.min(elapsed / duration, 1);
    
    const phase = getPhase(timeProgress);
    const newPL = calculateRealisticSwing({ ...position, timeProgress, phase });
    
    // Track peaks and valleys
    const peakGain = Math.max(position.peakGain, newPL);
    const lowestLoss = Math.min(position.lowestLoss, newPL);
    
    // Add pulsing effect for big swings
    if (Math.abs(newPL - position.currentPL) > Math.abs(position.targetPL) * 0.1) {
      setPulsingTrades(prev => {
        const newSet = new Set(Array.from(prev));
        newSet.add(position.id);
        return newSet;
      });
      
      setTimeout(() => {
        setPulsingTrades(prev => {
          const newSet = new Set(Array.from(prev));
          newSet.delete(position.id);
          return newSet;
        });
      }, 1500);
    }
    
    return {
      ...position,
      timeProgress,
      phase,
      currentPL: newPL,
      peakGain,
      lowestLoss
    };
  };

  const getTradeIcon = (trade: Trade) => {
    return trade.isWinningTrade ? 
      <TrendingUp size={16} style={{ color: '#10B981' }} /> : 
      <TrendingDown size={16} style={{ color: '#EF4444' }} />;
  };

  const getCryptoColor = (symbol: string) => {
    const colors: { [key: string]: string } = {
      'BTC': '#F7931A',
      'ETH': '#627EEA', 
      'ADA': '#0033AD',
      'SOL': '#9945FF',
      'DOT': '#E6007A',
      'LINK': '#2A5ADA',
      'UNI': '#FF007A',
      'AAVE': '#B6509E'
    };
    return colors[symbol] || '#6B7280';
  };

  // Calculate live totals using position P&Ls
  const getLivePositionPL = (trade: Trade): number => {
    return positionPLs.get(trade.id) || trade.profitLoss;
  };
  
  // Revert to legacy system temporarily
  const liveTotalPL = visibleTrades.reduce((sum, trade) => sum + getLivePositionPL(trade), 0);
  const progressPercentage = dailyTarget > 0 ? (liveTotalPL / dailyTarget) * 100 : 0;
  const lockedCapitalAmount = portfolioData?.lockedCapital || 224.30;
  
  // Update live trading context whenever P&L changes (with stability check)
  useEffect(() => {
    const contextData = {
      liveTotalPL: liveTotalPL,
      unrealizedPL: unrealizedPL,
      dailyTarget: dailyTarget
    };
    
    // Only update if values have actually changed significantly
    const currentData = liveTradingData;
    const hasSignificantChange = 
      Math.abs((currentData?.liveTotalPL || 0) - liveTotalPL) > 0.1 ||
      Math.abs((currentData?.unrealizedPL || 0) - unrealizedPL) > 0.1 ||
      Math.abs((currentData?.dailyTarget || 0) - dailyTarget) > 0.1;
    
    if (hasSignificantChange) {
      updateLiveTradingData(contextData);
    }
  }, [liveTotalPL, unrealizedPL, dailyTarget]);
  
  // Count open positions (now matches exactly what's displayed in the list)
  const openPositions = visibleTrades.length;
  
  // Calculate win rate for neural network progress bar (use all today's trades, not just open ones)
  const now = new Date();
  const completedTrades = todaysTrades.filter(trade => {
    const tradeTime = new Date(trade.timestamp);
    return tradeTime <= now;
  });
  const winningCompletedTrades = completedTrades.filter(t => t.isWinningTrade).length;
  const winRate = completedTrades.length > 0 ? (winningCompletedTrades / completedTrades.length) * 100 : 100;

  if (loading) {
    return (
      <div style={{
        backgroundColor: 'white',
        borderRadius: '12px',
        padding: '2rem',
        border: '1px solid #E5E7EB',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
        textAlign: 'center'
      }}>
        <Activity size={24} style={{ color: '#6B7280', marginBottom: '1rem' }} />
        <div>Loading trading activity...</div>
      </div>
    );
  }

  if (!liveActivity || liveActivity.hasActivity === false) {
    return (
      <div style={{
        backgroundColor: 'white',
        borderRadius: '12px',
        padding: '2rem',
        border: '1px solid #E5E7EB',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
        textAlign: 'center'
      }}>
        <Clock size={24} style={{ color: '#6B7280', marginBottom: '1rem' }} />
        <div style={{ color: '#6B7280' }}>No trading activity today</div>
        <div style={{ fontSize: '0.875rem', color: '#9CA3AF', marginTop: '0.5rem' }}>
          Market: {liveActivity?.marketStatus === 'open' ? 'Open' : 'Closed'}
        </div>
      </div>
    );
  }

  return (
    <div style={{
      backgroundColor: 'white',
      borderRadius: '12px',
      border: '1px solid #E5E7EB',
      boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
      overflow: 'hidden'
    }}>
      {/* Original Header with Outer Glow */}
      <div style={{
        backgroundColor: '#1F2937',
        padding: '1.5rem',
        color: 'white'
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '1rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Zap size={20} style={{ color: '#10B981' }} />
            <h3 style={{ margin: 0, fontSize: '1.125rem', fontWeight: '600' }}>
              Live AI Trading
            </h3>
          </div>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            fontSize: '0.875rem'
          }}>
            <div style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              backgroundColor: liveActivity.marketStatus === 'open' ? '#10B981' : '#EF4444'
            }}></div>
            Market {liveActivity.marketStatus === 'open' ? 'Open' : 'Closed'}
          </div>
        </div>

        {/* Neural Network AI Winning Trade Volume */}
        <div style={{ marginBottom: '1rem' }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '0.75rem',
            fontSize: '0.875rem'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{
                fontSize: '1rem',
                animation: 'brainPulse 2s infinite ease-in-out'
              }}>🧠</span>
              <span>Total Portfolio Used</span>
            </div>
            <span style={{
              fontWeight: '600',
              transition: 'color 0.3s ease',
              color: winRate >= 70 ? '#10B981' : winRate >= 50 ? '#F59E0B' : '#EF4444'
            }}>
              {winRate.toFixed(1)}%
            </span>
          </div>
          
          {/* Neural Network Progress Bar */}
          <div style={{
            width: '100%',
            height: '16px',
            backgroundColor: '#374151',
            borderRadius: '8px',
            overflow: 'hidden',
            position: 'relative',
            border: '1px solid #4B5563'
          }}>
            {/* Neural Connection Dots */}
            <div style={{
              position: 'absolute',
              top: '50%',
              left: '0',
              right: '0',
              height: '2px',
              background: 'linear-gradient(90deg, transparent 0%, #10B981 20%, transparent 40%, #10B981 60%, transparent 80%, #10B981 100%)',
              transform: 'translateY(-50%)',
              animation: 'neuralFlow 3s infinite linear',
              opacity: 0.6
            }}></div>
            
            {/* Main Progress Fill */}
            <div style={{
              width: `${Math.min(100, Math.max(0, winRate))}%`,
              height: '100%',
              background: winRate >= 70 ? 
                'linear-gradient(90deg, #10B981 0%, #059669 50%, #10B981 100%)' :
                winRate >= 50 ?
                'linear-gradient(90deg, #F59E0B 0%, #D97706 50%, #F59E0B 100%)' :
                'linear-gradient(90deg, #EF4444 0%, #DC2626 50%, #EF4444 100%)',
              borderRadius: '8px',
              transition: 'width 2s ease-out',
              boxShadow: winRate >= 70 ? 
                '0 0 15px rgba(16, 185, 129, 0.5), inset 0 0 10px rgba(255,255,255,0.1)' : 
                winRate >= 50 ?
                '0 0 12px rgba(245, 158, 11, 0.4), inset 0 0 8px rgba(255,255,255,0.1)' :
                '0 0 10px rgba(239, 68, 68, 0.4), inset 0 0 6px rgba(255,255,255,0.1)',
              position: 'relative'
            }}>
              {/* Neural Network Dots */}
              <div style={{
                position: 'absolute',
                top: '50%',
                left: '10%',
                transform: 'translateY(-50%)',
                width: '4px',
                height: '4px',
                borderRadius: '50%',
                backgroundColor: 'rgba(255,255,255,0.8)',
                animation: 'neuralPulse 1.5s infinite ease-in-out'
              }}></div>
              <div style={{
                position: 'absolute',
                top: '50%',
                left: '30%',
                transform: 'translateY(-50%)',
                width: '4px',
                height: '4px',
                borderRadius: '50%',
                backgroundColor: 'rgba(255,255,255,0.8)',
                animation: 'neuralPulse 1.5s infinite ease-in-out 0.5s'
              }}></div>
              <div style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translateY(-50%)',
                width: '4px',
                height: '4px',
                borderRadius: '50%',
                backgroundColor: 'rgba(255,255,255,0.8)',
                animation: 'neuralPulse 1.5s infinite ease-in-out 1s'
              }}></div>
              <div style={{
                position: 'absolute',
                top: '50%',
                left: '70%',
                transform: 'translateY(-50%)',
                width: '4px',
                height: '4px',
                borderRadius: '50%',
                backgroundColor: 'rgba(255,255,255,0.8)',
                animation: 'neuralPulse 1.5s infinite ease-in-out 1.5s'
              }}></div>
            </div>
          </div>
          
          {/* Live Stats */}
          <div style={{
            display: 'flex',
            justifyContent: 'flex-start',
            alignItems: 'center',
            fontSize: '0.75rem',
            opacity: 0.9,
            marginTop: '0.5rem'
          }}>
            <span>Locked: {formatCurrency(lockedCapitalAmount)}</span>
          </div>
        </div>

        {/* Enhanced Stats Row */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '1rem',
          fontSize: '0.875rem'
        }}>
          <div style={{ 
            textAlign: 'center',
            transition: 'transform 0.2s ease',
            transform: executingTrades.size > 0 ? 'scale(1.05)' : 'scale(1)'
          }}>
            <div style={{ color: '#9CA3AF' }}>Trades</div>
            <div style={{ 
              fontWeight: '600', 
              marginTop: '0.25rem',
              fontSize: '1.1rem',
              transition: 'color 0.3s ease',
              color: executingTrades.size > 0 ? '#F59E0B' : 'white'
            }}>
              {visibleTrades.length}
              {executingTrades.size > 0 && (
                <span style={{ 
                  fontSize: '0.7rem', 
                  marginLeft: '0.25rem',
                  color: '#F59E0B'
                }}>
                  +{executingTrades.size}
                </span>
              )}
            </div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ color: '#9CA3AF' }}>Open Positions</div>
            <div style={{ 
              fontWeight: '600', 
              marginTop: '0.25rem', 
              fontSize: '1.1rem',
              color: openPositions >= 5 ? '#10B981' : openPositions >= 2 ? '#F59E0B' : '#6B7280',
              transition: 'color 0.5s ease'
            }}>
              {openPositions}
            </div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ color: '#9CA3AF' }}>Today's P&L</div>
            <div style={{ 
              fontWeight: '600', 
              marginTop: '0.25rem',
              fontSize: '1.1rem',
              color: (liveTotalPL + unrealizedPL) >= 0 ? '#10B981' : '#EF4444',
              transition: 'color 0.3s ease, transform 0.2s ease',
              transform: Math.abs(unrealizedPL) > 10 ? 'scale(1.1)' : 'scale(1)'
            }}>
              {formatCurrency(liveTotalPL + unrealizedPL)}
            </div>
          </div>
        </div>
      </div>

      {/* Trading Feed */}
      <div style={{
        maxHeight: '350px',
        overflowY: 'auto',
        padding: '1rem'
      }} ref={feedRef}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '1rem',
          fontSize: '0.875rem',
          color: '#6B7280'
        }}>
          <span>Recent Trading Activity</span>
          <span>{visibleTrades.length} trades executed</span>
        </div>

        {visibleTrades.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '2rem',
            color: '#6B7280'
          }}>
            <Activity size={24} style={{ marginBottom: '0.5rem' }} />
            <div>Waiting for market activity...</div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {visibleTrades
              .slice()
              .reverse() // Show newest first
              .slice(0, 15) // Show last 15 trades (reduced for sidebar)
              .map((trade) => (
                <div
                  key={trade.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0.75rem',
                    backgroundColor: '#FAFAFA',
                    borderRadius: '8px',
                    border: '1px solid #F3F4F6',
                    transition: 'all 0.3s ease',
                    animation: (() => {
                      if (newTradeAnimation.includes(trade.id)) {
                        return 'slideIn 0.5s ease-out';
                      }
                      const direction = priceDirections.get(trade.id);
                      if (direction === 'up') {
                        return 'priceUp 1.5s ease-in-out';
                      } else if (direction === 'down') {
                        return 'priceDown 1.5s ease-in-out';
                      }
                      return undefined;
                    })(),
                    boxShadow: (() => {
                      const direction = priceDirections.get(trade.id);
                      if (direction === 'up') {
                        return 'inset 0 0 15px rgba(16, 185, 129, 0.6), inset 0 0 30px rgba(16, 185, 129, 0.3)';
                      } else if (direction === 'down') {
                        return 'inset 0 0 15px rgba(245, 158, 11, 0.6), inset 0 0 30px rgba(245, 158, 11, 0.3)';
                      }
                      return 'none';
                    })()
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    {getTradeIcon(trade)}
                    
                    <div>
                      <div style={{
                        fontWeight: '600',
                        fontSize: '0.875rem',
                        color: getCryptoColor(trade.cryptoSymbol)
                      }}>
                        {trade.cryptoSymbol}
                      </div>
                      <div style={{
                        fontSize: '0.75rem',
                        color: '#6B7280',
                        textTransform: 'capitalize'
                      }}>
                        {trade.tradeType}
                      </div>
                    </div>
                  </div>

                  <div style={{ textAlign: 'right' }}>
                    <div style={{
                      fontWeight: '600',
                      fontSize: '0.875rem',
                      color: getLivePositionPL(trade) >= 0 ? '#10B981' : '#EF4444',
                      transition: 'color 0.3s ease'
                    }}>
                      {getLivePositionPL(trade) >= 0 ? '+' : ''}{formatCurrency(getLivePositionPL(trade))}
                    </div>
                    <div style={{
                      fontSize: '0.75rem',
                      color: '#6B7280'
                    }}>
                      Entry: {formatCurrency(trade.positionSize || trade.amount)}
                    </div>
                  </div>
                </div>
              ))}
          </div>
        )}
      </div>

      <style>
        {`
          @keyframes slideIn {
            from {
              opacity: 0;
              transform: translateY(-10px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
          
          @keyframes shimmer {
            0% {
              transform: translateX(-100%);
            }
            100% {
              transform: translateX(100%);
            }
          }
          
          @keyframes pulse {
            0%, 100% {
              opacity: 1;
            }
            50% {
              opacity: 0.7;
            }
          }
          
          @keyframes glow {
            0%, 100% {
              box-shadow: 0 0 5px rgba(16, 185, 129, 0.3);
            }
            50% {
              box-shadow: 0 0 15px rgba(16, 185, 129, 0.6);
            }
          }
          
          @keyframes priceUp {
            0%, 100% {
              box-shadow: inset 0 0 10px rgba(16, 185, 129, 0.4), inset 0 0 20px rgba(16, 185, 129, 0.2);
            }
            50% {
              box-shadow: inset 0 0 20px rgba(16, 185, 129, 0.8), inset 0 0 40px rgba(16, 185, 129, 0.4);
            }
          }
          
          @keyframes priceDown {
            0%, 100% {
              box-shadow: inset 0 0 10px rgba(245, 158, 11, 0.4), inset 0 0 20px rgba(245, 158, 11, 0.2);
            }
            50% {
              box-shadow: inset 0 0 20px rgba(245, 158, 11, 0.8), inset 0 0 40px rgba(245, 158, 11, 0.4);
            }
          }
          
          @keyframes brainPulse {
            0%, 100% {
              transform: scale(1);
              opacity: 0.9;
            }
            50% {
              transform: scale(1.1);
              opacity: 1;
            }
          }
          
          @keyframes neuralFlow {
            0% {
              transform: translateX(-100%);
              opacity: 0;
            }
            20% {
              opacity: 1;
            }
            80% {
              opacity: 1;
            }
            100% {
              transform: translateX(100%);
              opacity: 0;
            }
          }
          
          @keyframes neuralPulse {
            0%, 100% {
              opacity: 0.3;
              transform: translateY(-50%) scale(0.8);
            }
            50% {
              opacity: 1;
              transform: translateY(-50%) scale(1.2);
            }
          }
          

        `}
      </style>
    </div>
  );
};

export default LiveTradingFeed;