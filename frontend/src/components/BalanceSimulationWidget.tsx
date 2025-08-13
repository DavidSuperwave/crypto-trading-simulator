import React, { useState, useEffect } from 'react';
import { TrendingUp, Calendar, DollarSign, Target, BarChart3, Play, Pause } from 'lucide-react';

interface MonthlyData {
  month: string;
  startBalance: number;
  targetPercentage: number;
  interestEarned: number;
  endBalance: number;
  cumulativeReturn: number;
}

interface BalanceSimulationWidgetProps {
  initialBalance?: number;
  showProjection?: boolean;
  projectionMonths?: number;
}

const BalanceSimulationWidget: React.FC<BalanceSimulationWidgetProps> = ({
  initialBalance = 10000,
  showProjection = true,
  projectionMonths = 12
}) => {
  const [isAnimating, setIsAnimating] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(0);
  const [simulationData, setSimulationData] = useState<MonthlyData[]>([]);
  const [animationSpeed, setAnimationSpeed] = useState(1000); // ms per month

  // Generate simulation data using our tiered algorithm (first month: 20%-22%, subsequent: 15%-17%)
  const generateSimulationData = (startBalance: number, months: number): MonthlyData[] => {
    const data: MonthlyData[] = [];
    let currentBalance = startBalance;
    const currentDate = new Date();

    for (let i = 0; i < months; i++) {
      const monthDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + i, 1);
      const monthName = monthDate.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
      
      // Generate percentage based on tiered algorithm (first month: 20%-22%, subsequent: 15%-17%)
      const isFirstMonth = i === 0;
      const minTarget = isFirstMonth ? 0.20 : 0.15;
      const maxTarget = isFirstMonth ? 0.22 : 0.17;
      const targetPercentage = minTarget + Math.random() * (maxTarget - minTarget);
      const interestEarned = currentBalance * targetPercentage;
      const endBalance = currentBalance + interestEarned;
      const cumulativeReturn = ((endBalance - startBalance) / startBalance) * 100;

      data.push({
        month: monthName,
        startBalance: currentBalance,
        targetPercentage,
        interestEarned,
        endBalance,
        cumulativeReturn
      });

      currentBalance = endBalance;
    }

    return data;
  };

  // Initialize simulation data
  useEffect(() => {
    const data = generateSimulationData(initialBalance, projectionMonths);
    setSimulationData(data);
  }, [initialBalance, projectionMonths]);

  // Animation controller
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (isAnimating && currentMonth < simulationData.length - 1) {
      interval = setInterval(() => {
        setCurrentMonth(prev => prev + 1);
      }, animationSpeed);
    } else if (currentMonth >= simulationData.length - 1) {
      setIsAnimating(false);
    }

    return () => clearInterval(interval);
  }, [isAnimating, currentMonth, simulationData.length, animationSpeed]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const formatPercentage = (value: number) => {
    return `${(value * 100).toFixed(1)}%`;
  };

  const getCurrentData = () => {
    return simulationData.slice(0, currentMonth + 1);
  };

  const getMaxBalance = () => {
    return Math.max(...simulationData.map(d => d.endBalance));
  };

  const toggleAnimation = () => {
    if (currentMonth >= simulationData.length - 1) {
      setCurrentMonth(0);
    }
    setIsAnimating(!isAnimating);
  };

  const resetSimulation = () => {
    setCurrentMonth(0);
    setIsAnimating(false);
    // Generate new random data
    const data = generateSimulationData(initialBalance, projectionMonths);
    setSimulationData(data);
  };

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
            margin: '0 0 0.25rem 0',
            fontSize: '1.25rem',
            fontWeight: '700',
            color: '#1F2937',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            <BarChart3 size={20} style={{ color: '#3B82F6' }} />
            AI Trading Simulation
          </h3>
          <p style={{
            margin: 0,
            fontSize: '0.875rem',
            color: '#6B7280'
          }}>
            Monthly returns: 20%-22% first month, then 15%-17% using advanced algorithms
          </p>
        </div>

        {/* Controls */}
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <select
            value={animationSpeed}
            onChange={(e) => setAnimationSpeed(Number(e.target.value))}
            style={{
              padding: '0.25rem 0.5rem',
              borderRadius: '6px',
              border: '1px solid #D1D5DB',
              fontSize: '0.75rem'
            }}
          >
            <option value={2000}>Slow</option>
            <option value={1000}>Normal</option>
            <option value={500}>Fast</option>
          </select>
          
          <button
            onClick={toggleAnimation}
            style={{
              background: isAnimating ? '#EF4444' : '#10B981',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              padding: '0.5rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.25rem'
            }}
          >
            {isAnimating ? <Pause size={16} /> : <Play size={16} />}
            {isAnimating ? 'Pause' : 'Start'}
          </button>

          <button
            onClick={resetSimulation}
            style={{
              background: '#6B7280',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              padding: '0.5rem 0.75rem',
              cursor: 'pointer',
              fontSize: '0.75rem'
            }}
          >
            Reset
          </button>
        </div>
      </div>

      {/* Current Stats */}
      {simulationData.length > 0 && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '1rem',
          marginBottom: '1.5rem'
        }}>
          {/* Current Balance */}
          <div style={{
            background: 'linear-gradient(135deg, #3B82F6 0%, #1E40AF 100%)',
            borderRadius: '12px',
            padding: '1rem',
            color: 'white'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
              <DollarSign size={18} />
              <span style={{ fontSize: '0.875rem', opacity: 0.9 }}>Current Balance</span>
            </div>
            <p style={{ margin: 0, fontSize: '1.5rem', fontWeight: '700' }}>
              {formatCurrency(simulationData[currentMonth]?.endBalance || initialBalance)}
            </p>
          </div>

          {/* This Month's Growth */}
          <div style={{
            background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
            borderRadius: '12px',
            padding: '1rem',
            color: 'white'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
              <TrendingUp size={18} />
              <span style={{ fontSize: '0.875rem', opacity: 0.9 }}>Monthly Growth</span>
            </div>
            <p style={{ margin: 0, fontSize: '1.5rem', fontWeight: '700' }}>
              {simulationData[currentMonth] ? formatPercentage(simulationData[currentMonth].targetPercentage) : '0%'}
            </p>
          </div>

          {/* Total Return */}
          <div style={{
            background: 'linear-gradient(135deg, #8B5CF6 0%, #7C3AED 100%)',
            borderRadius: '12px',
            padding: '1rem',
            color: 'white'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
              <Target size={18} />
              <span style={{ fontSize: '0.875rem', opacity: 0.9 }}>Total Return</span>
            </div>
            <p style={{ margin: 0, fontSize: '1.5rem', fontWeight: '700' }}>
              {simulationData[currentMonth] ? `+${simulationData[currentMonth].cumulativeReturn.toFixed(1)}%` : '0%'}
            </p>
          </div>
        </div>
      )}

      {/* Progress Bar */}
      <div style={{
        background: '#F3F4F6',
        borderRadius: '8px',
        height: '8px',
        marginBottom: '1.5rem',
        overflow: 'hidden'
      }}>
        <div style={{
          background: 'linear-gradient(90deg, #10B981 0%, #3B82F6 100%)',
          height: '100%',
          width: `${((currentMonth + 1) / simulationData.length) * 100}%`,
          borderRadius: '8px',
          transition: 'width 0.3s ease'
        }} />
      </div>

      {/* Monthly Breakdown Chart */}
      <div style={{
        background: '#F9FAFB',
        borderRadius: '12px',
        padding: '1rem',
        marginBottom: '1rem'
      }}>
        <h4 style={{
          margin: '0 0 1rem 0',
          fontSize: '1rem',
          fontWeight: '600',
          color: '#374151',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem'
        }}>
          <Calendar size={16} />
          Month by Month Progress
        </h4>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
          gap: '0.75rem',
          maxHeight: '300px',
          overflowY: 'auto'
        }}>
          {getCurrentData().map((month, index) => (
            <div
              key={month.month}
              style={{
                background: index === currentMonth ? 'linear-gradient(135deg, #3B82F6 0%, #1E40AF 100%)' : 'white',
                color: index === currentMonth ? 'white' : '#374151',
                borderRadius: '8px',
                padding: '0.75rem',
                border: index === currentMonth ? 'none' : '1px solid #E5E7EB',
                boxShadow: index === currentMonth ? '0 4px 6px rgba(59, 130, 246, 0.15)' : 'none',
                transition: 'all 0.3s ease',
                transform: index === currentMonth ? 'scale(1.02)' : 'scale(1)'
              }}
            >
              <div style={{
                fontSize: '0.75rem',
                fontWeight: '600',
                marginBottom: '0.25rem',
                opacity: index === currentMonth ? 1 : 0.8
              }}>
                {month.month}
              </div>
              <div style={{
                fontSize: '0.875rem',
                fontWeight: '700',
                marginBottom: '0.25rem'
              }}>
                {formatCurrency(month.endBalance)}
              </div>
              <div style={{
                fontSize: '0.75rem',
                opacity: index === currentMonth ? 0.9 : 0.6
              }}>
                +{formatPercentage(month.targetPercentage)}
              </div>
              <div style={{
                fontSize: '0.75rem',
                opacity: index === currentMonth ? 0.9 : 0.6
              }}>
                +{formatCurrency(month.interestEarned)}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Summary Stats */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
        gap: '1rem',
        padding: '1rem',
        background: 'linear-gradient(135deg, #F0FDF4 0%, #DCFCE7 100%)',
        borderRadius: '12px',
        border: '1px solid #BBF7D0'
      }}>
        <div style={{ textAlign: 'center' }}>
          <p style={{ margin: '0 0 0.25rem 0', fontSize: '0.75rem', color: '#15803D', fontWeight: '500' }}>
            Initial Investment
          </p>
          <p style={{ margin: 0, fontSize: '1.125rem', fontWeight: '700', color: '#166534' }}>
            {formatCurrency(initialBalance)}
          </p>
        </div>

        <div style={{ textAlign: 'center' }}>
          <p style={{ margin: '0 0 0.25rem 0', fontSize: '0.75rem', color: '#15803D', fontWeight: '500' }}>
            Final Balance
          </p>
          <p style={{ margin: 0, fontSize: '1.125rem', fontWeight: '700', color: '#166534' }}>
            {formatCurrency(simulationData[simulationData.length - 1]?.endBalance || initialBalance)}
          </p>
        </div>

        <div style={{ textAlign: 'center' }}>
          <p style={{ margin: '0 0 0.25rem 0', fontSize: '0.75rem', color: '#15803D', fontWeight: '500' }}>
            Total Profit
          </p>
          <p style={{ margin: 0, fontSize: '1.125rem', fontWeight: '700', color: '#166534' }}>
            {formatCurrency((simulationData[simulationData.length - 1]?.endBalance || initialBalance) - initialBalance)}
          </p>
        </div>

        <div style={{ textAlign: 'center' }}>
          <p style={{ margin: '0 0 0.25rem 0', fontSize: '0.75rem', color: '#15803D', fontWeight: '500' }}>
            Total Return
          </p>
          <p style={{ margin: 0, fontSize: '1.125rem', fontWeight: '700', color: '#166534' }}>
            +{simulationData[simulationData.length - 1]?.cumulativeReturn.toFixed(1) || '0'}%
          </p>
        </div>
      </div>

      {/* Disclaimer */}
      <div style={{
        marginTop: '1rem',
        padding: '0.75rem',
        background: '#FEF3C7',
        border: '1px solid #F59E0B',
        borderRadius: '8px',
        fontSize: '0.75rem',
        color: '#92400E'
      }}>
        <strong>Simulation Notice:</strong> This is a projection based on our AI trading algorithm's historical performance. 
        Actual returns may vary. Past performance does not guarantee future results.
      </div>
    </div>
  );
};

export default BalanceSimulationWidget;