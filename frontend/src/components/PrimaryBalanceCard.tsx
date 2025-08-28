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

// Helper functions outside component to avoid re-creation
const formatCurrency = (value: number): string => {
  const numValue = Number(value) || 0;
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(numValue);
};

const formatPercentage = (value: number): string => {
  const numValue = Number(value) || 0;
  return `${numValue >= 0 ? '+' : ''}${numValue.toFixed(2)}%`;
};

const PrimaryBalanceCard: React.FC = () => {
  const { portfolioData, loading, error } = usePortfolioData();
  
  // Mobile detection
  const [isMobile, setIsMobile] = React.useState(false);
  
  React.useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  // FIXED: Use backend's totalPortfolioValue as authoritative source (already includes trading P&L)
  // ALL HOOKS MUST BE CALLED BEFORE ANY EARLY RETURNS
  const livePnL = useMemo(() => {
    // Live trading functionality removed
    return 0;
  }, []);
  
  const livePortfolioValue = useMemo(() => {
    if (!portfolioData) return 0;
    // Backend's totalPortfolioValue already includes all trading P&L
    // Don't add live P&L on top to prevent double counting
    const baseValue = Number(portfolioData.totalPortfolioValue) || 0;
    return baseValue;
  }, [portfolioData]);
  
  const liveDailyPL = useMemo(() => {
    if (!portfolioData) return 0;
    // Backend's dailyPL already includes trading P&L
    const basePL = Number(portfolioData.dailyPL) || 0;
    return basePL;
  }, [portfolioData]);
  


  if (loading) {
    return (
      <div style={{
        background: 'linear-gradient(135deg, #008E60 0%, #006B47 100%)',
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
          <Activity 
          style={{ animation: 'pulse 2s ease-in-out infinite' }} 
          size={24} 
        />
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
    return (
      <div style={{
        background: 'linear-gradient(135deg, #6b7280 0%, #4b5563 100%)',
        borderRadius: '20px',
        padding: '2rem',
        color: 'white',
        marginBottom: '1.5rem',
        minHeight: '200px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>⚡</div>
          <div>No portfolio data available</div>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      background: 'linear-gradient(135deg, #008E60 0%, #006B47 100%)',
      borderRadius: isMobile ? '16px' : '20px',
      padding: isMobile ? '1.5rem' : '2rem',
      color: 'white',
      marginBottom: isMobile ? '1rem' : '1.5rem',
      boxShadow: '0 10px 30px rgba(0, 142, 96, 0.3)',
      border: '1px solid rgba(255, 255, 255, 0.1)'
    }}>
      {/* Hero Balance */}
      <div style={{ marginBottom: isMobile ? '1.5rem' : '2rem' }}>
        <div style={{ 
          fontSize: isMobile ? '0.8rem' : '0.9rem', 
          opacity: 0.8, 
          marginBottom: '0.5rem',
          fontWeight: '500',
          textTransform: 'uppercase',
          letterSpacing: '1px'
        }}>
          Total Portfolio Value
        </div>
        <div style={{ 
          fontSize: isMobile ? '2rem' : '3rem', 
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
          fontSize: isMobile ? '1rem' : '1.25rem',
          fontWeight: '600',
          flexWrap: 'wrap'
        }}>
          {liveDailyPL >= 0 ? (
            <TrendingUp size={isMobile ? 16 : 20} style={{ color: '#4ade80' }} />
          ) : (
            <TrendingDown size={isMobile ? 16 : 20} style={{ color: '#f87171' }} />
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
        gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fit, minmax(180px, 1fr))',
        gap: isMobile ? '0.75rem' : '1rem',
        marginBottom: isMobile ? '1rem' : '1.5rem'
      }}>
        {/* Available Balance */}
        <div style={{
          background: 'rgba(255, 255, 255, 0.1)',
          borderRadius: isMobile ? '10px' : '12px',
          padding: isMobile ? '0.75rem' : '1rem',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255, 255, 255, 0.1)'
        }}>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '0.5rem',
            marginBottom: '0.5rem'
          }}>
            <Unlock size={isMobile ? 14 : 16} style={{ opacity: 0.8 }} />
            <span style={{ fontSize: isMobile ? '0.8rem' : '0.85rem', opacity: 0.8, fontWeight: '500' }}>
              Available
            </span>
          </div>
          <div style={{ fontSize: isMobile ? '1.2rem' : '1.4rem', fontWeight: '700' }}>
            {formatCurrency(portfolioData.availableBalance)}
          </div>
        </div>

        {/* Locked Capital */}
        <div style={{
          background: 'rgba(255, 255, 255, 0.1)',
          borderRadius: isMobile ? '10px' : '12px',
          padding: isMobile ? '0.75rem' : '1rem',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255, 255, 255, 0.1)'
        }}>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '0.5rem',
            marginBottom: '0.5rem'
          }}>
            <Lock size={isMobile ? 14 : 16} style={{ opacity: 0.8 }} />
            <span style={{ fontSize: isMobile ? '0.8rem' : '0.85rem', opacity: 0.8, fontWeight: '500' }}>
              Locked
            </span>
          </div>
          <div style={{ fontSize: isMobile ? '1.2rem' : '1.4rem', fontWeight: '700' }}>
            {formatCurrency(portfolioData.lockedCapital)}
          </div>
        </div>

        {/* Compound Interest */}
        <div style={{
          background: 'rgba(255, 255, 255, 0.1)',
          borderRadius: isMobile ? '10px' : '12px',
          padding: isMobile ? '0.75rem' : '1rem',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255, 255, 255, 0.1)'
        }}>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '0.5rem',
            marginBottom: '0.5rem'
          }}>
            <PiggyBank size={isMobile ? 14 : 16} style={{ opacity: 0.8 }} />
            <span style={{ fontSize: isMobile ? '0.8rem' : '0.85rem', opacity: 0.8, fontWeight: '500' }}>
              Interest Earned
            </span>
          </div>
          <div style={{ fontSize: isMobile ? '1.2rem' : '1.4rem', fontWeight: '700' }}>
            {formatCurrency(portfolioData.compoundInterestEarned)}
          </div>
        </div>
      </div>

      {/* Bottom Stats */}
      <div style={{
        display: 'flex',
        flexDirection: isMobile ? 'column' : 'row',
        justifyContent: 'space-between',
        alignItems: isMobile ? 'stretch' : 'center',
        paddingTop: '1rem',
        borderTop: '1px solid rgba(255, 255, 255, 0.1)',
        gap: isMobile ? '1rem' : '0'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? '1rem' : '1.5rem', flexWrap: 'wrap' }}>
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