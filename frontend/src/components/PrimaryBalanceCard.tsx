import React, { useMemo } from 'react';
import { 
  TrendingUp, 
  TrendingDown,
  Lock,
  Unlock,
  Activity,
  PiggyBank,
  BarChart3
} from 'lucide-react';
import { usePortfolioData } from '../hooks/usePortfolioData';
import { useLiveTradingData } from '../context/LiveTradingContext';

// Helper functions outside component to avoid re-creation
const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(value);
};

const formatPercentage = (value: number): string => {
  return `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`;
};

const PrimaryBalanceCard: React.FC = () => {
  const { portfolioData, loading, error } = usePortfolioData();
  const { liveTradingData } = useLiveTradingData();
  
  // Calculate live portfolio value including trading P&L (memoized to prevent loops)
  // ALL HOOKS MUST BE CALLED BEFORE ANY EARLY RETURNS
  const livePnL = useMemo(() => 
    (liveTradingData?.liveTotalPL || 0) + (liveTradingData?.unrealizedPL || 0), 
    [liveTradingData?.liveTotalPL, liveTradingData?.unrealizedPL]
  );
  
  const livePortfolioValue = useMemo(() => 
    portfolioData ? portfolioData.totalPortfolioValue + livePnL : 0,
    [portfolioData?.totalPortfolioValue, livePnL]
  );
  
  const liveDailyPL = useMemo(() => 
    portfolioData ? portfolioData.dailyPL + livePnL : 0,
    [portfolioData?.dailyPL, livePnL]
  );
  
  // Debug logging
  console.log('🎯 PrimaryBalanceCard rendering:', { portfolioData, loading, error });

  if (loading) {
    return (
      <div style={{
        background: 'linear-gradient(135deg, #3B82F6 0%, #1E40AF 100%)',
        borderRadius: '20px',
        padding: '2rem',
        color: 'white',
        marginBottom: '1.5rem',
        minHeight: '200px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '1rem',
          fontSize: '1.1rem',
          fontWeight: '500'
        }}>
          <Activity className="animate-pulse" size={24} />
          Loading portfolio data...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{
        background: 'linear-gradient(135deg, #ff6b6b 0%, #ee5a52 100%)',
        borderRadius: '20px',
        padding: '2rem',
        color: 'white',
        marginBottom: '1.5rem',
        minHeight: '200px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        border: '1px solid rgba(255, 255, 255, 0.2)'
      }}>
        <div style={{ textAlign: 'center' }}>
          <TrendingDown size={32} style={{ margin: '0 auto 1rem', opacity: 0.8 }} />
          <div style={{ fontSize: '1.1rem', fontWeight: '600' }}>{error}</div>
        </div>
      </div>
    );
  }

  if (!portfolioData) {
    return null;
  }

  return (
    <div style={{
      background: 'linear-gradient(135deg, #3B82F6 0%, #1E40AF 100%)',
      borderRadius: '20px',
      padding: '2rem',
      color: 'white',
      marginBottom: '1.5rem',
      boxShadow: '0 10px 30px rgba(59, 130, 246, 0.3)',
      border: '1px solid rgba(255, 255, 255, 0.1)'
    }}>
      {/* Hero Balance */}
      <div style={{ marginBottom: '2rem' }}>
        <div style={{ 
          fontSize: '0.9rem', 
          opacity: 0.8, 
          marginBottom: '0.5rem',
          fontWeight: '500',
          textTransform: 'uppercase',
          letterSpacing: '1px'
        }}>
          Total Portfolio Value
        </div>
        <div style={{ 
          fontSize: '3rem', 
          fontWeight: '800', 
          lineHeight: 1,
          marginBottom: '0.75rem',
          textShadow: '0 2px 4px rgba(0,0,0,0.1)'
        }}>
          {formatCurrency(livePortfolioValue)}
        </div>
        
        {/* Daily P&L */}
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '0.75rem',
          fontSize: '1.25rem',
          fontWeight: '600'
        }}>
          {liveDailyPL >= 0 ? (
            <TrendingUp size={20} style={{ color: '#4ade80' }} />
          ) : (
            <TrendingDown size={20} style={{ color: '#f87171' }} />
          )}
          <span style={{ 
            color: liveDailyPL >= 0 ? '#4ade80' : '#f87171'
          }}>
            {formatCurrency(liveDailyPL)} ({formatPercentage((liveDailyPL / portfolioData.totalPortfolioValue) * 100)}) today
          </span>
        </div>
      </div>

      {/* Secondary Metrics Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
        gap: '1rem',
        marginBottom: '1.5rem'
      }}>
        {/* Available Balance */}
        <div style={{
          background: 'rgba(255, 255, 255, 0.1)',
          borderRadius: '12px',
          padding: '1rem',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255, 255, 255, 0.1)'
        }}>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '0.5rem',
            marginBottom: '0.5rem'
          }}>
            <Unlock size={16} style={{ opacity: 0.8 }} />
            <span style={{ fontSize: '0.85rem', opacity: 0.8, fontWeight: '500' }}>
              Available
            </span>
          </div>
          <div style={{ fontSize: '1.4rem', fontWeight: '700' }}>
            {formatCurrency(portfolioData.availableBalance)}
          </div>
        </div>

        {/* Locked Capital */}
        <div style={{
          background: 'rgba(255, 255, 255, 0.1)',
          borderRadius: '12px',
          padding: '1rem',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255, 255, 255, 0.1)'
        }}>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '0.5rem',
            marginBottom: '0.5rem'
          }}>
            <Lock size={16} style={{ opacity: 0.8 }} />
            <span style={{ fontSize: '0.85rem', opacity: 0.8, fontWeight: '500' }}>
              Locked
            </span>
          </div>
          <div style={{ fontSize: '1.4rem', fontWeight: '700' }}>
            {formatCurrency(portfolioData.lockedCapital)}
          </div>
        </div>

        {/* Compound Interest */}
        <div style={{
          background: 'rgba(255, 255, 255, 0.1)',
          borderRadius: '12px',
          padding: '1rem',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255, 255, 255, 0.1)'
        }}>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '0.5rem',
            marginBottom: '0.5rem'
          }}>
            <PiggyBank size={16} style={{ opacity: 0.8 }} />
            <span style={{ fontSize: '0.85rem', opacity: 0.8, fontWeight: '500' }}>
              Interest Earned
            </span>
          </div>
          <div style={{ fontSize: '1.4rem', fontWeight: '700' }}>
            {formatCurrency(portfolioData.compoundInterestEarned)}
          </div>
        </div>
      </div>

      {/* Bottom Stats */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingTop: '1rem',
        borderTop: '1px solid rgba(255, 255, 255, 0.1)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
          <div>
            <div style={{ fontSize: '0.8rem', opacity: 0.7, marginBottom: '0.25rem' }}>
              Portfolio Growth
            </div>
            <div style={{ 
              fontSize: '1.1rem', 
              fontWeight: '600',
              color: portfolioData.portfolioGrowthPercent >= 0 ? '#4ade80' : '#f87171'
            }}>
              {formatPercentage(portfolioData.portfolioGrowthPercent)}
            </div>
          </div>
          
          <div>
            <div style={{ fontSize: '0.8rem', opacity: 0.7, marginBottom: '0.25rem' }}>
              Total Deposited
            </div>
            <div style={{ fontSize: '1.1rem', fontWeight: '600' }}>
              {formatCurrency(portfolioData.totalDeposited)}
            </div>
          </div>
        </div>

        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '0.8rem', opacity: 0.7, marginBottom: '0.25rem' }}>
            Capital Utilization
          </div>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '0.5rem' 
          }}>
            <BarChart3 size={16} style={{ opacity: 0.8 }} />
            <span style={{ fontSize: '1.1rem', fontWeight: '600' }}>
              {portfolioData.utilizationPercent.toFixed(1)}%
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrimaryBalanceCard;