import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  Activity,
  Target,
  Clock,
  Zap,
  BarChart3,
  PieChart,
  Play,
  Pause,
  Settings
} from 'lucide-react';
import { buildApiUrl } from '../config/api';

interface EnhancedTradingData {
  isActive: boolean;
  dailyTarget: number;
  currentProgress: number;
  progressPercent: number;
  totalTrades: number;
  completedTrades: number;
  activeTrades: number;
  portfolio: {
    totalValue: number;
    availableBalance: number;
    lockedCapital: number;
    dailyPL: number;
    dailyPLPercent: number;
    utilizationPercent: number;
  };
  volatilityProfile: 'conservative' | 'aggressive' | 'ultra';
  todaysStats: {
    maxGain: number;
    maxDrawdown: number;
    volatilityRange: number;
    winRate: number;
    avgTradeSize: number;
  };
  recentTrades: Array<{
    id: string;
    symbol: string;
    type: 'long' | 'short';
    profitLoss: number;
    timestamp: string;
    status: 'open' | 'closed';
  }>;
}

const EnhancedTradingWidget: React.FC = () => {
  const [tradingData, setTradingData] = useState<EnhancedTradingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);

  const fetchTradingData = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setError('Authentication required');
        return;
      }

      // Fetch enhanced trading status and recent trades
      const [statusResponse, tradesResponse] = await Promise.all([
        fetch(buildApiUrl('/enhanced-trading/status'), { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch(buildApiUrl('/enhanced-trading/recent-trades?limit=5'), { headers: { 'Authorization': `Bearer ${token}` } })
      ]);

      if (statusResponse.ok && tradesResponse.ok) {
        const statusData = await statusResponse.json();
        const tradesData = await tradesResponse.json();

        if (statusData.success && tradesData.success) {
          const enhancedTradingData: EnhancedTradingData = {
            ...statusData.data,
            recentTrades: tradesData.data
          };

          setTradingData(enhancedTradingData);
        } else {
          throw new Error('Failed to fetch enhanced trading data');
        }
      } else {
        throw new Error('API request failed');
      }
      setError(null);
    } catch (err) {
      console.error('Error fetching enhanced trading data:', err);
      setError('Failed to load trading data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTradingData();
    const interval = setInterval(fetchTradingData, 5000); // Update every 5 seconds
    return () => clearInterval(interval);
  }, []);

  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value);
  };

  const formatPercent = (value: number): string => {
    return `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`;
  };

  if (loading) {
    return (
      <div style={{
        background: 'white',
        borderRadius: '16px',
        padding: '1.5rem',
        boxShadow: '0 4px 6px rgba(0,0,0,0.05)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '200px'
      }}>
        <div style={{ color: '#6B7280' }}>Loading enhanced trading data...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{
        background: 'white',
        borderRadius: '16px',
        padding: '1.5rem',
        boxShadow: '0 4px 6px rgba(0,0,0,0.05)',
        border: '1px solid #FEE2E2'
      }}>
        <div style={{ color: '#EF4444', textAlign: 'center' }}>{error}</div>
      </div>
    );
  }

  if (!tradingData) return null;

  return (
    <div style={{
      background: 'white',
      borderRadius: '16px',
      padding: '1.5rem',
      boxShadow: '0 4px 6px rgba(0,0,0,0.05)',
      border: '1px solid #E5E7EB'
    }}>
      {/* Header */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        marginBottom: '1.5rem' 
      }}>
        <div>
          <h3 style={{ 
            margin: 0, 
            color: '#1F2937', 
            fontSize: '1.25rem',
            fontWeight: '600',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            <Zap size={20} style={{ color: '#10B981' }} />
            Enhanced Trading System
          </h3>
          <div style={{ 
            fontSize: '0.875rem', 
            color: '#6B7280', 
            marginTop: '0.25rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            <Activity size={14} />
            {tradingData.isActive ? (
              <span style={{ color: '#10B981' }}>🟢 Active • {tradingData.volatilityProfile} profile</span>
            ) : (
              <span style={{ color: '#EF4444' }}>🔴 Inactive</span>
            )}
          </div>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            style={{
              background: '#F3F4F6',
              border: 'none',
              borderRadius: '8px',
              padding: '0.5rem',
              cursor: 'pointer',
              color: '#6B7280'
            }}
          >
            <BarChart3 size={16} />
          </button>
          <button
            style={{
              background: tradingData.isActive ? '#FEE2E2' : '#D1FAE5',
              border: 'none',
              borderRadius: '8px',
              padding: '0.5rem',
              cursor: 'pointer',
              color: tradingData.isActive ? '#EF4444' : '#10B981'
            }}
          >
            {tradingData.isActive ? <Pause size={16} /> : <Play size={16} />}
          </button>
        </div>
      </div>

      {/* Main Stats Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '1rem',
        marginBottom: '1.5rem'
      }}>
        {/* Daily Progress */}
        <div style={{
          background: '#F8FAFC',
          borderRadius: '12px',
          padding: '1rem',
          border: '1px solid #E2E8F0'
        }}>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'space-between',
            marginBottom: '0.5rem'
          }}>
            <Target size={16} style={{ color: '#3B82F6' }} />
            <span style={{ 
              fontSize: '0.75rem', 
              color: '#10B981',
              fontWeight: '600'
            }}>
              {tradingData.progressPercent.toFixed(0)}% Complete
            </span>
          </div>
          <div style={{ fontSize: '0.875rem', color: '#6B7280', marginBottom: '0.25rem' }}>
            Daily Target
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#1F2937' }}>
            {formatCurrency(tradingData.currentProgress)}
          </div>
          <div style={{ fontSize: '0.875rem', color: '#6B7280' }}>
            of {formatCurrency(tradingData.dailyTarget)}
          </div>
        </div>

        {/* Portfolio Status */}
        <div style={{
          background: '#F8FAFC',
          borderRadius: '12px',
          padding: '1rem',
          border: '1px solid #E2E8F0'
        }}>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'space-between',
            marginBottom: '0.5rem'
          }}>
            <PieChart size={16} style={{ color: '#8B5CF6' }} />
            <span style={{ 
              fontSize: '0.75rem', 
              color: tradingData.portfolio.dailyPL >= 0 ? '#10B981' : '#EF4444',
              fontWeight: '600'
            }}>
              {formatPercent(tradingData.portfolio.dailyPLPercent)}
            </span>
          </div>
          <div style={{ fontSize: '0.875rem', color: '#6B7280', marginBottom: '0.25rem' }}>
            Portfolio Value
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#1F2937' }}>
            {formatCurrency(tradingData.portfolio.totalValue)}
          </div>
          <div style={{ 
            fontSize: '0.875rem', 
            color: tradingData.portfolio.dailyPL >= 0 ? '#10B981' : '#EF4444' 
          }}>
            {tradingData.portfolio.dailyPL >= 0 ? '+' : ''}{formatCurrency(tradingData.portfolio.dailyPL)} today
          </div>
        </div>

        {/* Trade Activity */}
        <div style={{
          background: '#F8FAFC',
          borderRadius: '12px',
          padding: '1rem',
          border: '1px solid #E2E8F0'
        }}>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'space-between',
            marginBottom: '0.5rem'
          }}>
            <Activity size={16} style={{ color: '#F59E0B' }} />
            <span style={{ 
              fontSize: '0.75rem', 
              color: '#6B7280',
              fontWeight: '600'
            }}>
              {tradingData.activeTrades} Active
            </span>
          </div>
          <div style={{ fontSize: '0.875rem', color: '#6B7280', marginBottom: '0.25rem' }}>
            Trades Today
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#1F2937' }}>
            {tradingData.completedTrades}
          </div>
          <div style={{ fontSize: '0.875rem', color: '#6B7280' }}>
            of {tradingData.totalTrades} total
          </div>
        </div>
      </div>

      {/* Expanded Stats */}
      {isExpanded && (
        <div style={{
          borderTop: '1px solid #E5E7EB',
          paddingTop: '1.5rem',
          marginTop: '1.5rem'
        }}>
          {/* Performance Metrics */}
          <div style={{ marginBottom: '1.5rem' }}>
            <h4 style={{ 
              margin: '0 0 1rem 0', 
              color: '#1F2937', 
              fontSize: '1rem',
              fontWeight: '600'
            }}>
              Today's Performance
            </h4>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
              gap: '1rem'
            }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '0.75rem', color: '#6B7280', marginBottom: '0.25rem' }}>
                  Max Gain
                </div>
                <div style={{ 
                  fontSize: '1.25rem', 
                  fontWeight: '600', 
                  color: '#10B981' 
                }}>
                  +{tradingData.todaysStats.maxGain.toFixed(1)}%
                </div>
              </div>
              
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '0.75rem', color: '#6B7280', marginBottom: '0.25rem' }}>
                  Max Drawdown
                </div>
                <div style={{ 
                  fontSize: '1.25rem', 
                  fontWeight: '600', 
                  color: '#EF4444' 
                }}>
                  {tradingData.todaysStats.maxDrawdown.toFixed(1)}%
                </div>
              </div>
              
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '0.75rem', color: '#6B7280', marginBottom: '0.25rem' }}>
                  Volatility Range
                </div>
                <div style={{ 
                  fontSize: '1.25rem', 
                  fontWeight: '600', 
                  color: '#3B82F6' 
                }}>
                  {tradingData.todaysStats.volatilityRange.toFixed(1)}%
                </div>
              </div>
              
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '0.75rem', color: '#6B7280', marginBottom: '0.25rem' }}>
                  Win Rate
                </div>
                <div style={{ 
                  fontSize: '1.25rem', 
                  fontWeight: '600', 
                  color: '#8B5CF6' 
                }}>
                  {tradingData.todaysStats.winRate.toFixed(1)}%
                </div>
              </div>
            </div>
          </div>

          {/* Recent Trades */}
          <div>
            <h4 style={{ 
              margin: '0 0 1rem 0', 
              color: '#1F2937', 
              fontSize: '1rem',
              fontWeight: '600'
            }}>
              Recent Trades
            </h4>
            <div style={{
              background: '#F9FAFB',
              borderRadius: '8px',
              overflow: 'hidden'
            }}>
              {tradingData.recentTrades.map((trade, index) => (
                <div
                  key={trade.id}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '0.75rem 1rem',
                    borderBottom: index < tradingData.recentTrades.length - 1 ? '1px solid #E5E7EB' : 'none'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div style={{
                      background: trade.type === 'long' ? '#D1FAE5' : '#FEE2E2',
                      color: trade.type === 'long' ? '#10B981' : '#EF4444',
                      padding: '0.25rem 0.5rem',
                      borderRadius: '4px',
                      fontSize: '0.75rem',
                      fontWeight: '600',
                      textTransform: 'uppercase'
                    }}>
                      {trade.type}
                    </div>
                    <div style={{
                      fontWeight: '600',
                      color: '#1F2937'
                    }}>
                      {trade.symbol}
                    </div>
                  </div>
                  
                  <div style={{
                    fontWeight: '600',
                    color: trade.profitLoss >= 0 ? '#10B981' : '#EF4444'
                  }}>
                    {trade.profitLoss >= 0 ? '+' : ''}{formatCurrency(trade.profitLoss)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EnhancedTradingWidget;