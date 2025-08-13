import React from 'react';
import { TrendingUp, DollarSign, Target, Calendar } from 'lucide-react';
import { SimulationData, SimulationUser } from '../hooks/useSimulationData';

interface SimulationBalanceCardProps {
  simulationData: SimulationData | null;
  loading: boolean;
}

const SimulationBalanceCard: React.FC<SimulationBalanceCardProps> = ({ 
  simulationData, 
  loading 
}) => {
  if (loading) {
    return (
      <div style={{
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        borderRadius: '16px',
        padding: '1.5rem',
        color: 'white',
        marginBottom: '1.5rem'
      }}>
        <div style={{ textAlign: 'center', padding: '2rem' }}>
          <div style={{
            width: '40px',
            height: '40px',
            border: '3px solid rgba(255, 255, 255, 0.3)',
            borderTop: '3px solid white',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 1rem'
          }} />
          <p style={{ margin: 0, opacity: 0.8 }}>Loading simulation data...</p>
        </div>
      </div>
    );
  }

  if (!simulationData) {
    return null; // Don't render anything if no simulation data
  }

  const user = simulationData.user as SimulationUser;
  const progress = simulationData.currentMonth.progress;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(amount);
  };

  const formatPercentage = (value: number) => {
    return `${(value * 100).toFixed(1)}%`;
  };

  return (
    <div style={{
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      borderRadius: '16px',
      padding: '1.5rem',
      color: 'white',
      marginBottom: '1.5rem',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Background Pattern */}
      <div style={{
        position: 'absolute',
        top: 0,
        right: 0,
        width: '150px',
        height: '150px',
        background: 'radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%)',
        borderRadius: '50%',
        transform: 'translate(50px, -50px)'
      }} />

      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '1.5rem'
      }}>
        <h2 style={{
          margin: 0,
          fontSize: '1.5rem',
          fontWeight: '700',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem'
        }}>
          <TrendingUp size={24} />
          Portfolio Balance
        </h2>
        <div style={{
          background: 'rgba(255, 255, 255, 0.2)',
          borderRadius: '20px',
          padding: '0.25rem 0.75rem',
          fontSize: '0.75rem',
          fontWeight: '600'
        }}>
          {user.simulationActive ? '🟢 Active' : '🔴 Inactive'}
        </div>
      </div>

      {/* Balance Overview */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '1rem',
        marginBottom: '1.5rem'
      }}>
        {/* Total Balance */}
        <div style={{
          background: 'rgba(255, 255, 255, 0.15)',
          borderRadius: '12px',
          padding: '1rem',
          backdropFilter: 'blur(10px)'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            marginBottom: '0.5rem'
          }}>
            <DollarSign size={18} />
            <span style={{ fontSize: '0.875rem', opacity: 0.9 }}>Total Balance</span>
          </div>
          <p style={{
            margin: 0,
            fontSize: '1.75rem',
            fontWeight: '700'
          }}>
            {formatCurrency(user.totalBalance)}
          </p>
        </div>

        {/* Deposited Amount */}
        <div style={{
          background: 'rgba(255, 255, 255, 0.15)',
          borderRadius: '12px',
          padding: '1rem',
          backdropFilter: 'blur(10px)'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            marginBottom: '0.5rem'
          }}>
            <span style={{ fontSize: '1rem' }}>💰</span>
            <span style={{ fontSize: '0.875rem', opacity: 0.9 }}>Deposited</span>
          </div>
          <p style={{
            margin: 0,
            fontSize: '1.5rem',
            fontWeight: '600'
          }}>
            {formatCurrency(user.depositedAmount)}
          </p>
        </div>

        {/* Simulated Earnings */}
        <div style={{
          background: 'rgba(255, 255, 255, 0.15)',
          borderRadius: '12px',
          padding: '1rem',
          backdropFilter: 'blur(10px)'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            marginBottom: '0.5rem'
          }}>
            <span style={{ fontSize: '1rem' }}>📈</span>
            <span style={{ fontSize: '0.875rem', opacity: 0.9 }}>AI Earnings</span>
          </div>
          <p style={{
            margin: 0,
            fontSize: '1.5rem',
            fontWeight: '600',
            color: user.simulatedInterest > 0 ? '#4ade80' : 'white'
          }}>
            {formatCurrency(user.simulatedInterest)}
          </p>
        </div>
      </div>

      {/* Monthly Progress */}
      {progress && (
        <div style={{
          background: 'rgba(255, 255, 255, 0.1)',
          borderRadius: '12px',
          padding: '1rem',
          backdropFilter: 'blur(10px)'
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '1rem'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              <Target size={18} />
              <span style={{ fontSize: '0.875rem', fontWeight: '600' }}>
                Monthly Target ({formatPercentage(progress.targetPercentage)})
              </span>
            </div>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              fontSize: '0.75rem',
              opacity: 0.8
            }}>
              <Calendar size={14} />
              <span>{progress.daysRemaining} days left</span>
            </div>
          </div>

          {/* Progress Bar */}
          <div style={{
            background: 'rgba(255, 255, 255, 0.2)',
            borderRadius: '8px',
            height: '8px',
            marginBottom: '0.75rem',
            overflow: 'hidden'
          }}>
            <div style={{
              background: 'linear-gradient(90deg, #4ade80 0%, #22c55e 100%)',
              height: '100%',
              width: `${Math.min(progress.progressPercentage, 100)}%`,
              borderRadius: '8px',
              transition: 'width 0.3s ease'
            }} />
          </div>

          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            fontSize: '0.875rem'
          }}>
            <span>
              {formatCurrency(progress.achievedAmount)} achieved
            </span>
            <span style={{ fontWeight: '600' }}>
              {progress.progressPercentage.toFixed(1)}% complete
            </span>
          </div>
        </div>
      )}

      {/* Profit Breakdown */}
      {user.simulatedInterest > 0 && (
        <div style={{
          marginTop: '1rem',
          padding: '0.75rem',
          background: 'rgba(255, 255, 255, 0.1)',
          borderRadius: '8px',
          fontSize: '0.875rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <span>Return on Investment:</span>
          <span style={{
            fontWeight: '700',
            color: '#4ade80',
            fontSize: '1rem'
          }}>
            +{((user.simulatedInterest / user.depositedAmount) * 100).toFixed(2)}%
          </span>
        </div>
      )}
    </div>
  );
};

export default SimulationBalanceCard;