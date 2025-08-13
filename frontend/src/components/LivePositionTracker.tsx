import React, { useState, useEffect } from 'react';
import { 
  Lock, 
  Unlock, 
  TrendingUp, 
  TrendingDown,
  Clock,
  DollarSign,
  Activity,
  Eye,
  EyeOff
} from 'lucide-react';
import { buildApiUrl } from '../config/api';

interface Position {
  id: string;
  symbol: string;
  type: 'long' | 'short';
  capitalLocked: number;
  currentPL: number;
  expectedPL: number;
  openTime: string;
  duration: number;
  status: 'open' | 'closed';
  variance: string;
}

interface PositionData {
  userId: string;
  availableBalance: number;
  lockedCapital: number;
  totalPortfolioValue: number;
  dailyPL: number;
  dailyPLPercent: number;
  openPositions: Position[];
  utilizationPercent: number;
  maxUtilization: number;
  positionHistory: Position[];
}

const LivePositionTracker: React.FC = () => {
  const [positionData, setPositionData] = useState<PositionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showHistory, setShowHistory] = useState(false);

  const fetchPositionData = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setError('Authentication required');
        return;
      }

      // Fetch real position data from enhanced trading API
      const response = await fetch(buildApiUrl('/enhanced-trading/positions'), {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setPositionData(data.data);
        } else {
          throw new Error('Failed to fetch position data');
        }
      } else {
        throw new Error('API request failed');
      }
      setError(null);
    } catch (err) {
      console.error('Error fetching position data:', err);
      setError('Failed to load position data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPositionData();
    const interval = setInterval(fetchPositionData, 3000); // Update every 3 seconds
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

  const formatTime = (timestamp: string): string => {
    return new Date(timestamp).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getVarianceColor = (variance: string): string => {
    switch (variance) {
      case 'extreme': return '#DC2626';
      case 'high': return '#EA580C';
      case 'medium': return '#D97706';
      case 'low': return '#65A30D';
      case 'minimal': return '#16A34A';
      default: return '#6B7280';
    }
  };

  if (loading) {
    return (
      <div style={{
        background: 'white',
        borderRadius: '16px',
        padding: '1.5rem',
        boxShadow: '0 4px 6px rgba(0,0,0,0.05)',
        minHeight: '300px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div style={{ color: '#6B7280' }}>Loading position data...</div>
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

  if (!positionData) return null;

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
            fontSize: '1.125rem',
            fontWeight: '600',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            <Activity size={18} style={{ color: '#3B82F6' }} />
            Live Position Tracker
          </h3>
          <div style={{ 
            fontSize: '0.875rem', 
            color: '#6B7280', 
            marginTop: '0.25rem' 
          }}>
            Real-time capital management
          </div>
        </div>
        
        <button
          onClick={() => setShowHistory(!showHistory)}
          style={{
            background: '#F3F4F6',
            border: 'none',
            borderRadius: '8px',
            padding: '0.5rem',
            cursor: 'pointer',
            color: '#6B7280',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}
        >
          {showHistory ? <EyeOff size={16} /> : <Eye size={16} />}
          {showHistory ? 'Hide History' : 'Show History'}
        </button>
      </div>

      {/* Balance Overview */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
        gap: '1rem',
        marginBottom: '1.5rem'
      }}>
        <div style={{
          background: '#F0F9FF',
          borderRadius: '12px',
          padding: '1rem',
          border: '1px solid #BAE6FD'
        }}>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '0.5rem',
            marginBottom: '0.5rem'
          }}>
            <DollarSign size={16} style={{ color: '#0284C7' }} />
            <span style={{ fontSize: '0.875rem', color: '#0284C7', fontWeight: '600' }}>
              Available
            </span>
          </div>
          <div style={{ fontSize: '1.25rem', fontWeight: '700', color: '#1F2937' }}>
            {formatCurrency(positionData.availableBalance)}
          </div>
        </div>

        <div style={{
          background: positionData.lockedCapital > 0 ? '#FEF3C7' : '#F3F4F6',
          borderRadius: '12px',
          padding: '1rem',
          border: `1px solid ${positionData.lockedCapital > 0 ? '#FDE68A' : '#E5E7EB'}`
        }}>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '0.5rem',
            marginBottom: '0.5rem'
          }}>
            {positionData.lockedCapital > 0 ? (
              <Lock size={16} style={{ color: '#D97706' }} />
            ) : (
              <Unlock size={16} style={{ color: '#6B7280' }} />
            )}
            <span style={{ 
              fontSize: '0.875rem', 
              color: positionData.lockedCapital > 0 ? '#D97706' : '#6B7280', 
              fontWeight: '600' 
            }}>
              Locked
            </span>
          </div>
          <div style={{ fontSize: '1.25rem', fontWeight: '700', color: '#1F2937' }}>
            {formatCurrency(positionData.lockedCapital)}
          </div>
        </div>

        <div style={{
          background: '#F0FDF4',
          borderRadius: '12px',
          padding: '1rem',
          border: '1px solid #BBF7D0'
        }}>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '0.5rem',
            marginBottom: '0.5rem'
          }}>
            <TrendingUp size={16} style={{ color: '#16A34A' }} />
            <span style={{ fontSize: '0.875rem', color: '#16A34A', fontWeight: '600' }}>
              Daily P&L
            </span>
          </div>
          <div style={{ fontSize: '1.25rem', fontWeight: '700', color: '#1F2937' }}>
            {formatCurrency(positionData.dailyPL)}
          </div>
          <div style={{ fontSize: '0.875rem', color: '#16A34A' }}>
            +{positionData.dailyPLPercent.toFixed(2)}%
          </div>
        </div>
      </div>

      {/* Utilization Bar */}
      <div style={{ marginBottom: '1.5rem' }}>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          marginBottom: '0.5rem'
        }}>
          <span style={{ fontSize: '0.875rem', color: '#6B7280', fontWeight: '500' }}>
            Capital Utilization
          </span>
          <span style={{ fontSize: '0.875rem', color: '#1F2937', fontWeight: '600' }}>
            {positionData.utilizationPercent.toFixed(1)}%
          </span>
        </div>
        <div style={{
          background: '#F3F4F6',
          borderRadius: '8px',
          height: '8px',
          overflow: 'hidden'
        }}>
          <div style={{
            background: positionData.utilizationPercent > 80 ? '#EF4444' : 
                       positionData.utilizationPercent > 60 ? '#F59E0B' : '#10B981',
            width: `${Math.min(positionData.utilizationPercent, 100)}%`,
            height: '100%',
            transition: 'width 0.3s ease'
          }} />
        </div>
        <div style={{ 
          fontSize: '0.75rem', 
          color: '#6B7280', 
          marginTop: '0.25rem' 
        }}>
          Max today: {positionData.maxUtilization.toFixed(1)}%
        </div>
      </div>

      {/* Open Positions */}
      {positionData.openPositions.length > 0 && (
        <div style={{ marginBottom: '1.5rem' }}>
          <h4 style={{ 
            margin: '0 0 1rem 0', 
            color: '#1F2937', 
            fontSize: '1rem',
            fontWeight: '600'
          }}>
            Open Positions ({positionData.openPositions.length})
          </h4>
          <div style={{
            background: '#F9FAFB',
            borderRadius: '8px',
            overflow: 'hidden'
          }}>
            {positionData.openPositions.map((position, index) => (
              <div
                key={position.id}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '1rem',
                  borderBottom: index < positionData.openPositions.length - 1 ? '1px solid #E5E7EB' : 'none'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <div style={{
                    background: position.type === 'long' ? '#D1FAE5' : '#FEE2E2',
                    color: position.type === 'long' ? '#10B981' : '#EF4444',
                    padding: '0.25rem 0.5rem',
                    borderRadius: '4px',
                    fontSize: '0.75rem',
                    fontWeight: '600',
                    textTransform: 'uppercase'
                  }}>
                    {position.type}
                  </div>
                  <div style={{ fontWeight: '600', color: '#1F2937' }}>
                    {position.symbol}
                  </div>
                  <div style={{ fontSize: '0.875rem', color: '#6B7280' }}>
                    {formatCurrency(position.capitalLocked)} locked
                  </div>
                </div>
                
                <div style={{ textAlign: 'right' }}>
                  <div style={{
                    fontWeight: '600',
                    color: position.currentPL >= 0 ? '#10B981' : '#EF4444'
                  }}>
                    {position.currentPL >= 0 ? '+' : ''}{formatCurrency(position.currentPL)}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#6B7280' }}>
                    {formatTime(position.openTime)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Position History */}
      {showHistory && positionData.positionHistory.length > 0 && (
        <div>
          <h4 style={{ 
            margin: '0 0 1rem 0', 
            color: '#1F2937', 
            fontSize: '1rem',
            fontWeight: '600'
          }}>
            Recent Position History
          </h4>
          <div style={{
            background: '#F9FAFB',
            borderRadius: '8px',
            overflow: 'hidden',
            maxHeight: '300px',
            overflowY: 'auto'
          }}>
            {positionData.positionHistory.slice(0, 10).map((position, index) => (
              <div
                key={position.id}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '0.75rem 1rem',
                  borderBottom: index < Math.min(positionData.positionHistory.length, 10) - 1 ? '1px solid #E5E7EB' : 'none'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div style={{
                    background: position.type === 'long' ? '#D1FAE5' : '#FEE2E2',
                    color: position.type === 'long' ? '#10B981' : '#EF4444',
                    padding: '0.2rem 0.4rem',
                    borderRadius: '4px',
                    fontSize: '0.7rem',
                    fontWeight: '600',
                    textTransform: 'uppercase'
                  }}>
                    {position.type}
                  </div>
                  <div style={{ fontWeight: '600', color: '#1F2937', fontSize: '0.875rem' }}>
                    {position.symbol}
                  </div>
                  <div style={{
                    background: getVarianceColor(position.variance),
                    color: 'white',
                    padding: '0.1rem 0.3rem',
                    borderRadius: '3px',
                    fontSize: '0.65rem',
                    fontWeight: '500',
                    textTransform: 'uppercase'
                  }}>
                    {position.variance}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#6B7280' }}>
                    {formatCurrency(position.capitalLocked)}
                  </div>
                </div>
                
                <div style={{ textAlign: 'right' }}>
                  <div style={{
                    fontWeight: '600',
                    color: position.currentPL >= 0 ? '#10B981' : '#EF4444',
                    fontSize: '0.875rem'
                  }}>
                    {position.currentPL >= 0 ? '+' : ''}{formatCurrency(position.currentPL)}
                  </div>
                  <div style={{ fontSize: '0.7rem', color: '#6B7280' }}>
                    {formatTime(position.openTime)} • {position.duration}min
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* No Positions State */}
      {positionData.openPositions.length === 0 && (
        <div style={{
          textAlign: 'center',
          padding: '2rem',
          color: '#6B7280'
        }}>
          <Unlock size={32} style={{ margin: '0 auto 1rem', opacity: 0.5 }} />
          <div style={{ fontSize: '1rem', fontWeight: '500', marginBottom: '0.5rem' }}>
            No Open Positions
          </div>
          <div style={{ fontSize: '0.875rem' }}>
            All capital is currently available for trading
          </div>
        </div>
      )}
    </div>
  );
};

export default LivePositionTracker;