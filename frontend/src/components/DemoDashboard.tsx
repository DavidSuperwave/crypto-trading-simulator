import React, { useState, useEffect, createContext, useCallback } from 'react';
import { Link } from 'react-router-dom';
import DepositPage from './DepositPage';
import WithdrawalPage from './WithdrawalPage';
import UserSettings from './UserSettings';
import { LiveTradingProvider } from '../context/LiveTradingContext';
import { Menu, X, Home, Download, Upload, Settings } from 'lucide-react';

// Mock user data for demo
const mockUser = {
  id: 'demo-user-123',
  email: 'demo@cryptosim.ai',
  firstName: 'John',
  lastName: 'Smith',
  phone: '+1 (555) 123-4567',
  role: 'user',
  balance: 12547.89,
  totalInterest: 1247.89,
  depositedAmount: 10000,
  simulatedInterest: 1547.89,
  currentMonthlyTarget: 1200,
  simulationStartDate: '2024-01-15T00:00:00Z',
  lastSimulationUpdate: new Date().toISOString(),
  simulationActive: true,
  currentPlan: 'Growth'
};



// Mock Auth Context for Demo
const MockAuthContext = createContext({
  user: mockUser,
  isAuthenticated: true,
  updateUser: () => {},
  logout: () => {}
});

// Dynamic Demo Balance Card Component
const DynamicDemoBalanceCard: React.FC<{
  demoState: string;
  demoBalance: number;
  demoStartAmount: number;
  demoProgress: number;
  onStartDemo: () => void;
  onResetDemo: () => void;
}> = ({ demoState, demoBalance, demoStartAmount, demoProgress, onStartDemo, onResetDemo }) => {
  
  // Fresh demo state - show get started
  if (demoState === 'fresh') {
    return (
      <div style={{ 
        background: 'linear-gradient(135deg, #64748b 0%, #475569 100%)',
        borderRadius: '20px',
        padding: '3rem 2rem',
        color: 'white',
        textAlign: 'center',
        marginBottom: '1.5rem',
        boxShadow: '0 10px 30px rgba(100, 116, 139, 0.3)',
        border: '1px solid rgba(255, 255, 255, 0.1)'
      }}>
        <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🚀</div>
        <h2 style={{ margin: '0 0 1rem 0', fontSize: '2rem', fontWeight: '800' }}>
          Ready to Experience CryptoSim AI?
        </h2>
        <p style={{ margin: '0 0 2rem 0', fontSize: '1.1rem', opacity: 0.9 }}>
          Start with any amount and watch our AI generate impressive returns in just 4 minutes!
        </p>
        <button
          onClick={onStartDemo}
          style={{
            background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
            color: 'white',
            border: 'none',
            padding: '1rem 2rem',
            borderRadius: '12px',
            fontSize: '1.1rem',
            fontWeight: '600',
            cursor: 'pointer',
            boxShadow: '0 4px 20px rgba(16, 185, 129, 0.4)',
            transition: 'transform 0.2s ease'
          }}
          onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
          onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
        >
          Start Demo Trading ⚡
        </button>
      </div>
    );
  }

  // Depositing state
  if (demoState === 'depositing') {
    return (
      <div style={{ 
        background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
        borderRadius: '20px',
        padding: '3rem 2rem',
        color: 'white',
        textAlign: 'center',
        marginBottom: '1.5rem',
        boxShadow: '0 10px 30px rgba(245, 158, 11, 0.3)',
        border: '1px solid rgba(255, 255, 255, 0.1)'
      }}>
        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>⏳</div>
        <h2 style={{ margin: '0 0 1rem 0', fontSize: '1.8rem', fontWeight: '800' }}>
          Processing Demo Deposit...
        </h2>
        <p style={{ margin: '0', fontSize: '1.1rem', opacity: 0.9 }}>
          ${demoBalance.toLocaleString()} being deposited
        </p>
      </div>
    );
  }

  // Active or completed trading
  const totalGain = demoBalance - demoStartAmount;
  const gainPercent = demoStartAmount > 0 ? (totalGain / demoStartAmount) * 100 : 0;
  const availableBalance = demoBalance * 0.2;
  const lockedCapital = demoBalance * 0.8;

  return (
      <div style={{
      background: demoState === 'completed' 
        ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
        : 'linear-gradient(135deg, #3B82F6 0%, #1E40AF 100%)',
      borderRadius: '20px',
      padding: '2rem',
        color: 'white',
      marginBottom: '1.5rem',
      boxShadow: demoState === 'completed'
        ? '0 10px 30px rgba(16, 185, 129, 0.4)'
        : '0 10px 30px rgba(59, 130, 246, 0.3)',
      border: '1px solid rgba(255, 255, 255, 0.1)',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Progress Bar */}
      {demoState === 'active' && (
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '4px',
          background: 'rgba(255, 255, 255, 0.2)'
        }}>
          <div style={{
            height: '100%',
            background: 'linear-gradient(90deg, #10b981 0%, #34d399 100%)',
            width: `${demoProgress}%`,
            transition: 'width 0.5s ease'
          }} />
        </div>
      )}

      {/* Demo Status Badge */}
      <div style={{
        position: 'absolute',
        top: '1rem',
        right: '1rem',
        background: demoState === 'completed' ? '#059669' : '#1e40af',
        padding: '0.5rem 1rem',
        borderRadius: '20px',
        fontSize: '0.8rem',
        fontWeight: '600',
        textTransform: 'uppercase'
      }}>
        {demoState === 'active' && `${Math.round(demoProgress)}% Complete`}
        {demoState === 'completed' && '✅ Demo Complete'}
      </div>

      {/* Hero Balance */}
      <div style={{ marginBottom: '2rem', paddingTop: '1rem' }}>
        <div style={{ 
          fontSize: '0.9rem', 
          opacity: 0.8, 
          marginBottom: '0.5rem',
          fontWeight: '500',
          textTransform: 'uppercase',
          letterSpacing: '1px'
        }}>
          {demoState === 'active' ? 'Live Demo Portfolio' : 'Final Demo Results'}
        </div>
        <div style={{ 
          fontSize: '3rem', 
          fontWeight: '800', 
          lineHeight: 1,
          marginBottom: '0.75rem',
          textShadow: '0 2px 4px rgba(0,0,0,0.1)'
        }}>
          ${demoBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </div>
        
        {/* Gain Display */}
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '0.75rem',
          fontSize: '1.25rem',
          fontWeight: '600'
        }}>
          <span style={{ color: '#4ade80' }}>📈</span>
          <span style={{ color: '#4ade80' }}>
            +${totalGain.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} (+{gainPercent.toFixed(1)}%) 
            {demoState === 'active' ? ' and counting!' : ' in 4 minutes!'}
          </span>
        </div>
      </div>

      {/* Secondary Metrics Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
        gap: '1rem',
        marginBottom: demoState === 'completed' ? '2rem' : '0'
      }}>
        {/* Available Balance */}
        <div style={{
          background: 'rgba(255, 255, 255, 0.1)',
          borderRadius: '12px',
          padding: '1rem',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255, 255, 255, 0.1)'
        }}>
          <div style={{ fontSize: '0.85rem', opacity: 0.8, marginBottom: '0.5rem' }}>
            Available (20%)
          </div>
          <div style={{ fontSize: '1.4rem', fontWeight: '700' }}>
            ${availableBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
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
          <div style={{ fontSize: '0.85rem', opacity: 0.8, marginBottom: '0.5rem' }}>
            Locked (80%)
          </div>
          <div style={{ fontSize: '1.4rem', fontWeight: '700' }}>
            ${lockedCapital.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
        </div>

        {/* Total Gain */}
        <div style={{
          background: 'rgba(255, 255, 255, 0.1)',
          borderRadius: '12px',
          padding: '1rem',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255, 255, 255, 0.1)'
        }}>
          <div style={{ fontSize: '0.85rem', opacity: 0.8, marginBottom: '0.5rem' }}>
            Total Profit
          </div>
          <div style={{ fontSize: '1.4rem', fontWeight: '700' }}>
            ${totalGain.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
        </div>

        {/* Active Trades Count */}
        <div style={{
          background: 'rgba(255, 255, 255, 0.1)',
          borderRadius: '12px',
          padding: '1rem',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255, 255, 255, 0.1)'
        }}>
          <div style={{ fontSize: '0.85rem', opacity: 0.8, marginBottom: '0.5rem' }}>
            {demoState === 'active' ? 'Trades Processing' : 'Total Trades'}
          </div>
          <div style={{ fontSize: '1.4rem', fontWeight: '700' }}>
            {demoState === 'active' ? '🔄 Live' : '480+'}
          </div>
        </div>
      </div>

      {/* Action Buttons for Completed State */}
      {demoState === 'completed' && (
        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
          <button
            onClick={onResetDemo}
            style={{
              background: 'rgba(255, 255, 255, 0.2)',
              color: 'white',
              border: '1px solid rgba(255, 255, 255, 0.3)',
              padding: '0.75rem 1.5rem',
              borderRadius: '8px',
              fontSize: '1rem',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'background 0.2s ease'
            }}
            onMouseOver={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.3)'}
            onMouseOut={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)'}
          >
            🔄 Run Demo Again
          </button>
          <a
            href="/signup"
            style={{
              background: 'white',
              color: '#059669',
              border: 'none',
              padding: '0.75rem 1.5rem',
              borderRadius: '8px',
              fontSize: '1rem',
              fontWeight: '600',
              textDecoration: 'none',
              display: 'inline-block',
              transition: 'transform 0.2s ease'
            }}
            onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
            onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
          >
            🚀 Start Real Trading
          </a>
        </div>
      )}
      </div>
  );
};

// Demo Sidebar Component
const DemoSidebar: React.FC<{
  activeView: string;
  onViewChange: (view: string) => void;
  demoBalance: number;
  demoStartAmount: number;
  demoState: string;
  demoUserName: string;
}> = ({ activeView, onViewChange, demoBalance, demoStartAmount, demoState, demoUserName }) => {
  
  const menuItems = [
    { id: 'home', label: 'Inicio', icon: Home, color: '#4F46E5' },
    { id: 'deposit', label: 'Depositar', icon: Download, color: '#059669' },
    { id: 'withdrawal', label: 'Retirar', icon: Upload, color: '#DC2626' },
    { id: 'settings', label: 'Configuración', icon: Settings, color: '#6B7280' }
  ];
  
  const totalGain = demoBalance - demoStartAmount;

  return (
    <div style={{
      width: '280px',
      height: '100vh',
      background: 'linear-gradient(180deg, #00509d 0%, #003d7a 100%)',
      color: 'white',
      display: 'flex',
      flexDirection: 'column',
      position: 'fixed',
      left: 0,
      top: 0,
      zIndex: 1000,
      boxShadow: '4px 0 20px rgba(0, 0, 0, 0.1)'
    }}>
      {/* Logo/Header */}
      <div style={{
        padding: '1.5rem 1.5rem',
        borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
      }}>
        <div style={{
              display: 'flex',
              alignItems: 'center',
          justifyContent: 'center'
        }}>
          <div style={{
            width: '180px',
            height: '50px',
            borderRadius: '12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <img 
              src="/logo.png" 
              alt="Logo" 
              style={{
                width: '220px',
                height: '80px',
                objectFit: 'contain'
              }}
            />
          </div>
        </div>
      </div>

      {/* Demo User Info */}
      <div style={{
        padding: '1.5rem',
        borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem'
        }}>
          <div style={{
            width: '48px',
            height: '48px',
            background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '1.25rem',
            fontWeight: '600'
          }}>
            {demoUserName ? demoUserName.charAt(0).toUpperCase() : (mockUser.firstName?.charAt(0).toUpperCase() || 'D')}
          </div>
          <div style={{ flex: 1, overflow: 'hidden' }}>
            <p style={{
              margin: 0,
              fontSize: '0.9rem',
              fontWeight: '600',
              color: 'white',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis'
            }}>
              {demoUserName || 'Demo User'}
            </p>
            <div style={{
              fontSize: '0.75rem',
              color: 'rgba(255, 255, 255, 0.8)',
              lineHeight: 1.3
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Total:</span>
                <span style={{ fontWeight: '600' }}>
                  ${demoBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
              {demoState !== 'fresh' && (
                <>
                  <div style={{ display: 'flex', justifyContent: 'space-between', opacity: 0.7 }}>
                    <span>Deposited:</span>
                    <span>${demoStartAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', opacity: 0.7 }}>
                    <span>AI Earned:</span>
                    <span style={{ color: totalGain > 0 ? '#4ade80' : 'inherit' }}>
                      ${totalGain.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>
                </>
              )}
            </div>
            
            {/* Demo Status Badge */}
            {demoState !== 'fresh' && (
              <div style={{
                marginTop: '0.5rem',
                fontSize: '0.65rem',
                padding: '0.25rem 0.5rem',
                background: demoState === 'completed' 
                  ? 'linear-gradient(90deg, #10b981 0%, #059669 100%)'
                  : demoState === 'active'
                  ? 'linear-gradient(90deg, #3B82F6 0%, #1E40AF 100%)'
                  : 'rgba(255, 255, 255, 0.2)',
                borderRadius: '10px',
                textAlign: 'center',
                fontWeight: '600',
                textTransform: 'uppercase'
              }}>
                {demoState === 'active' && '🔄 Trading Active'}
                {demoState === 'completed' && '✅ Demo Complete'}
                {demoState === 'depositing' && '⏳ Processing'}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Navigation Menu */}
      <nav style={{
        flex: 1,
        padding: '1.5rem 1rem',
        display: 'flex',
        flexDirection: 'column',
              gap: '0.5rem'
      }}>
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeView === item.id;
          
          return (
            <button
              key={item.id}
              onClick={() => onViewChange(item.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                padding: '0.875rem 1rem',
                background: isActive 
                  ? 'rgba(255, 255, 255, 0.1)' 
                  : 'transparent',
                border: 'none',
                borderRadius: '12px',
                color: 'white',
                fontSize: '0.9rem',
                fontWeight: isActive ? '600' : '500',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                position: 'relative',
                overflow: 'hidden'
              }}
              onMouseEnter={(e) => {
                if (!isActive) {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                  e.currentTarget.style.color = 'white';
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive) {
                  e.currentTarget.style.background = 'transparent';
                  e.currentTarget.style.color = 'white';
                }
              }}
            >
              {isActive && (
                <div style={{
                  position: 'absolute',
                  left: 0,
                  top: 0,
                  bottom: 0,
                  width: '4px',
                  background: `linear-gradient(180deg, ${item.color} 0%, ${item.color}dd 100%)`,
                  borderRadius: '0 4px 4px 0'
                }} />
              )}
              <Icon 
                size={20} 
                color={isActive ? item.color : 'currentColor'} 
              />
              <span>{item.label}</span>
          </button>
          );
        })}
      </nav>

      {/* Demo Footer */}
      <div style={{
        padding: '1rem 1.5rem',
        borderTop: '1px solid rgba(255, 255, 255, 0.1)',
        textAlign: 'center'
      }}>
        <div style={{
          fontSize: '0.75rem',
          color: 'rgba(255, 255, 255, 0.7)',
          marginBottom: '0.5rem'
        }}>
          Demo Mode
        </div>
          <Link 
          to="/signup"
            style={{
            display: 'inline-block',
            background: 'linear-gradient(90deg, #10b981 0%, #059669 100%)',
              color: 'white',
            textDecoration: 'none',
            padding: '0.5rem 1rem',
              borderRadius: '8px',
            fontSize: '0.8rem',
              fontWeight: '600',
            transition: 'transform 0.2s ease'
          }}
          onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
          onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
        >
          Start Real Trading
        </Link>
      </div>
    </div>
  );
};

// Demo Trading Feed Component
const DemoTradingFeed: React.FC<{
  trades: any[];
  demoState: string;
  progress: number;
}> = ({ trades, demoState, progress }) => {
  return (
    <div style={{
      background: 'white',
      borderRadius: '16px',
      boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
      border: '1px solid #E5E7EB',
      overflow: 'hidden'
    }}>
      {/* Header */}
      <div style={{
        background: demoState === 'completed' 
          ? 'linear-gradient(90deg, #10b981 0%, #059669 100%)'
          : 'linear-gradient(90deg, #3B82F6 0%, #1E40AF 100%)',
        color: 'white',
        padding: '1.5rem',
        position: 'relative'
      }}>
        <h3 style={{
          margin: '0 0 0.5rem 0',
          fontSize: '1.3rem',
          fontWeight: '700'
        }}>
          🤖 Live AI Trading
        </h3>
        <div style={{ 
          fontSize: '0.9rem',
          opacity: 0.9,
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
        }}>
          {demoState === 'active' && (
            <>
              <span>🔄</span>
              <span>Processing trades... {Math.round(progress)}% complete</span>
            </>
          )}
          {demoState === 'completed' && (
            <>
              <span>✅</span>
              <span>Demo completed - {trades.length} trades executed</span>
            </>
          )}
        </div>
        
        {/* Progress Bar */}
        {demoState === 'active' && (
          <div style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: '3px',
            background: 'rgba(255, 255, 255, 0.2)'
          }}>
            <div style={{
              height: '100%',
              background: 'rgba(255, 255, 255, 0.8)',
              width: `${progress}%`,
              transition: 'width 0.5s ease'
            }} />
            </div>
        )}
      </div>

      {/* Trades List */}
      <div style={{
        maxHeight: '500px',
        overflowY: 'auto',
        padding: '0'
      }}>
        {trades.length === 0 ? (
          <div style={{
            padding: '2rem',
            textAlign: 'center',
            color: '#6B7280'
          }}>
            <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>⏳</div>
            <div>Waiting for trades to start...</div>
          </div>
        ) : (
          trades.map((trade, index) => (
            <div
              key={trade.id}
              style={{
                padding: '1rem 1.5rem',
                borderBottom: index < trades.length - 1 ? '1px solid #F3F4F6' : 'none',
                background: index === 0 ? '#F8FAFC' : 'white',
                animation: index === 0 ? 'fadeIn 0.5s ease-in' : 'none',
                position: 'relative'
              }}
            >
              {/* New Trade Indicator */}
              {index === 0 && demoState === 'active' && (
                <div style={{
                  position: 'absolute',
                  top: '0.5rem',
                  right: '1rem',
                  background: '#10B981',
                  color: 'white',
                  fontSize: '0.7rem',
                  padding: '0.25rem 0.5rem',
                  borderRadius: '10px',
                  fontWeight: '600',
                  textTransform: 'uppercase'
                }}>
                  NEW
                </div>
              )}

              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                marginBottom: '0.5rem'
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}>
                  <span style={{
                    fontWeight: '700',
                    fontSize: '1rem',
                    color: '#1F2937'
                  }}>
                    {trade.symbol}
                  </span>
                  <span style={{
                    background: trade.type === 'LONG' 
                      ? 'linear-gradient(90deg, #10B981 0%, #059669 100%)'
                      : 'linear-gradient(90deg, #EF4444 0%, #DC2626 100%)',
                    color: 'white',
                    fontSize: '0.7rem',
                    padding: '0.2rem 0.5rem',
                    borderRadius: '6px',
                    fontWeight: '600'
                  }}>
                    {trade.type}
                  </span>
                </div>
                <div style={{
                  textAlign: 'right'
                }}>
                  <div style={{
                    color: trade.profit > 0 ? '#10B981' : '#EF4444',
                    fontWeight: '700',
                    fontSize: '0.9rem'
                  }}>
                    {trade.profit > 0 ? '+' : ''}${trade.profit.toFixed(2)}
                  </div>
        </div>
      </div>

        <div style={{ 
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                fontSize: '0.8rem',
                color: '#6B7280'
              }}>
                <div>
                  Amount: ${trade.amount.toLocaleString(undefined, { maximumFractionDigits: 0 })}
            </div>
                <div>
                  {new Date(trade.timestamp).toLocaleTimeString()}
            </div>
          </div>

              {/* Profit indicator */}
              {trade.profit > 0 && (
                <div style={{
                  marginTop: '0.5rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.25rem',
                  fontSize: '0.8rem',
                  color: '#10B981',
                  fontWeight: '600'
                }}>
                  <span>📈</span>
                  <span>Profitable trade</span>
            </div>
              )}
            </div>
          ))
        )}
          </div>

      {/* Footer Stats */}
      {trades.length > 0 && (
        <div style={{
          background: '#F9FAFB',
          padding: '1rem 1.5rem',
          borderTop: '1px solid #E5E7EB'
        }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: '1rem',
            fontSize: '0.8rem'
          }}>
            <div>
              <div style={{ color: '#6B7280', marginBottom: '0.25rem' }}>
                Trades Executed
            </div>
              <div style={{ fontWeight: '700', color: '#1F2937' }}>
                {trades.length}
            </div>
          </div>
            <div>
              <div style={{ color: '#6B7280', marginBottom: '0.25rem' }}>
                Win Rate
              </div>
              <div style={{ fontWeight: '700', color: '#10B981' }}>
                {trades.length > 0 ? Math.round((trades.filter(t => t.profit > 0).length / trades.length) * 100) : 0}%
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const DemoDashboard: React.FC = () => {
  const [activeView, setActiveView] = useState('home');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  
  // Demo-specific state
  const [demoState, setDemoState] = useState<'fresh' | 'depositing' | 'active' | 'completed'>('fresh');
  const [demoBalance, setDemoBalance] = useState(0);
  const [demoStartAmount, setDemoStartAmount] = useState(0);
  const [, setDemoTargetAmount] = useState(0); // demoTargetAmount not used currently
  const [demoProgress, setDemoProgress] = useState(0);
  const [demoTrades, setDemoTrades] = useState<any[]>([]);
  const [showDemoDeposit, setShowDemoDeposit] = useState(false);
  const [demoUserName, setDemoUserName] = useState('');
  const [nameInput, setNameInput] = useState('');
  const [amountInput, setAmountInput] = useState('');

  // REMOVED PROBLEMATIC useMemo - These were causing re-renders when typing
  // Simple inline calculation instead
  const isValidCustomAmount = amountInput && !isNaN(parseFloat(amountInput)) && parseFloat(amountInput) >= 100;
  const customAmountNumbers = isValidCustomAmount ? {
    start: parseFloat(amountInput),
    end: parseFloat(amountInput) * 1.25
  } : null;

  // Demo form submit handler - robust error handling
  const handleDemoFormSubmit = useCallback((e: React.FormEvent) => {
    try {
      e.preventDefault();
      e.stopPropagation();
      // Prevent any form submission - this is just for validation display
      return false;
    } catch (error) {
      
      return false;
    }
  }, []);

  // Mobile detection
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Close mobile menu when route changes
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [activeView]);

  // Demo Trading Simulation Functions (declared first to avoid dependency issues)
  const runAcceleratedTrading = useCallback((startAmount: number, targetAmount: number) => {
    const totalGainNeeded = targetAmount - startAmount;
    const durationMs = 4 * 60 * 1000; // 4 minutes
    const tradeIntervalMs = 500; // New trade every 500ms
    const totalTrades = durationMs / tradeIntervalMs;
    
    let currentBalance = startAmount;
    let tradeCount = 0;
    let totalProfitGenerated = 0;
    const trades: any[] = [];
    
    const tradeInterval = setInterval(() => {
      tradeCount++;
      const progress = tradeCount / totalTrades;
      
      // Calculate how much profit this trade should generate
      const remainingTrades = totalTrades - tradeCount;
      const remainingProfit = totalGainNeeded - totalProfitGenerated;
      
      let tradePL: number;
      if (remainingTrades <= 1) {
        // Last trade: make up the exact remaining amount
        tradePL = remainingProfit;
      } else {
        // Calculate base profit per trade with some variation
        const baseProfitPerTrade = remainingProfit / remainingTrades;
        const variation = (Math.random() - 0.5) * 0.3; // ±30% variation
        tradePL = baseProfitPerTrade * (1 + variation);
        tradePL = Math.max(tradePL * 0.1, tradePL); // Ensure positive minimum
      }
      
      // Update running totals
      totalProfitGenerated += tradePL;
      currentBalance += tradePL;
      
      // Generate realistic trade data
      const symbols = ['BTC/USDT', 'ETH/USDT', 'ADA/USDT', 'DOT/USDT', 'LINK/USDT', 'SOL/USDT'];
      const tradeTypes = ['LONG', 'SHORT'];
      
      const newTrade = {
        id: Date.now() + Math.random(),
        symbol: symbols[Math.floor(Math.random() * symbols.length)],
        type: tradeTypes[Math.floor(Math.random() * tradeTypes.length)],
        amount: (Math.random() * 0.1 + 0.05) * startAmount, // 5-15% of start amount
        price: Math.random() * 50000 + 20000, // Random price
        profit: tradePL,
        timestamp: new Date().toISOString(),
        isWin: tradePL > 0,
        tradeNumber: tradeCount
      };
      
      trades.unshift(newTrade);
      if (trades.length > 20) trades.pop(); // Keep only last 20 trades
      
      // Update state
      setDemoBalance(currentBalance);
      setDemoProgress(progress * 100);
      setDemoTrades([...trades]);
      
      // Complete simulation
      if (progress >= 1) {
        clearInterval(tradeInterval);
        // Ensure final balance is exactly the target
        setDemoBalance(targetAmount);
        setDemoState('completed');
        setDemoProgress(100);
      }
    }, tradeIntervalMs);
  }, []);

  const startDemoTrading = useCallback(async (depositAmount: number, userName: string) => {
    setDemoState('depositing');
    setDemoStartAmount(depositAmount);
    setDemoBalance(depositAmount);
    setDemoUserName(userName);
    
    const targetAmount = depositAmount * 1.25; // 25% gain
    setDemoTargetAmount(targetAmount);
    
    // Simulate instant deposit
    setTimeout(() => {
      setDemoState('active');
      runAcceleratedTrading(depositAmount, targetAmount);
    }, 1000);
  }, [runAcceleratedTrading]);

  // Simple form handlers
  const handleStartDemo = (amount: number) => {
    if (!nameInput.trim()) {
      alert('Please enter your name first');
      return;
    }
    setShowDemoDeposit(false);
    startDemoTrading(amount, nameInput.trim());
  };

  const handleCustomAmountStart = () => {
    const value = parseFloat(amountInput);
    if (!nameInput.trim()) {
      alert('Please enter your name first');
      return;
    }
    if (value >= 100 && value <= 100000) {
      setShowDemoDeposit(false);
      startDemoTrading(value, nameInput.trim());
    }
  };

  const resetDemo = () => {
    setDemoState('fresh');
    setDemoBalance(0);
    setDemoStartAmount(0);
    setDemoTargetAmount(0);
    setDemoProgress(0);
    setDemoTrades([]);
    setShowDemoDeposit(false);
    setDemoUserName('');
    setNameInput('');
    setAmountInput('');
  };

  // Mock Auth Provider
  const MockAuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <MockAuthContext.Provider value={{
      user: mockUser,
      isAuthenticated: true,
      updateUser: () => {},
      logout: () => {}
    }}>
      {children}
    </MockAuthContext.Provider>
  );

  // Main content renderer
  const renderMainContent = () => {
    switch (activeView) {
      case 'deposit':
        return (
          <MockAuthProvider>
            <DepositPage />
          </MockAuthProvider>
        );
      case 'withdrawal':
        return (
          <MockAuthProvider>
            <WithdrawalPage />
          </MockAuthProvider>
        );
      case 'settings':
        return (
          <MockAuthProvider>
            <UserSettings />
          </MockAuthProvider>
        );
      default:
        return (
          <MockAuthProvider>
            <DynamicDemoBalanceCard
              demoState={demoState}
              demoBalance={demoBalance}
              demoStartAmount={demoStartAmount}
              demoProgress={demoProgress}
              onStartDemo={() => setShowDemoDeposit(true)}
              onResetDemo={resetDemo}
            />
          </MockAuthProvider>
        );
    }
  };

  // Mobile Header Component
  const MobileHeader = () => (
    <div style={{
      display: isMobile ? 'flex' : 'none',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '1rem',
      background: 'linear-gradient(90deg, #00509d 0%, #003d7a 100%)',
      color: 'white',
      position: 'sticky',
      top: 0,
      zIndex: 1000,
      boxShadow: '0 2px 10px rgba(0, 0, 0, 0.1)'
    }}>
      {/* Logo */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem'
      }}>
        <img 
          src="/logo.png" 
          alt="Logo" 
          style={{
            height: '32px',
            objectFit: 'contain'
          }}
        />
        <span style={{ fontSize: '0.9rem', fontWeight: '600' }}>DEMO</span>
            </div>

      {/* User Info & Menu Toggle */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '1rem'
      }}>
        {/* User Avatar */}
        <div style={{ 
          width: '32px',
          height: '32px',
          background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '0.9rem',
          fontWeight: '600'
        }}>
          {demoUserName ? demoUserName.charAt(0).toUpperCase() : (mockUser.firstName?.charAt(0).toUpperCase() || 'D')}
            </div>

        {/* Menu Toggle */}
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          style={{
            background: 'none',
            border: 'none',
            color: 'white',
            cursor: 'pointer',
            padding: '0.5rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: '8px',
            transition: 'background-color 0.2s ease'
          }}
          onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)'}
          onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
        >
          {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
          </div>
        </div>
  );

  return (
    <MockAuthProvider>
        <div style={{ 
        display: 'flex',
        flexDirection: isMobile ? 'column' : 'row',
        minHeight: '100vh',
        fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        position: 'relative'
      }}>
        {/* Mobile Header */}
        <MobileHeader />

        {/* Desktop Sidebar or Mobile Menu Overlay */}
        {!isMobile ? (
          <DemoSidebar 
            activeView={activeView} 
            onViewChange={setActiveView}
            demoBalance={demoBalance}
            demoStartAmount={demoStartAmount}
            demoState={demoState}
            demoUserName={demoUserName}
          />
        ) : (
          <>
                            {/* Mobile Menu Overlay */}
                {isMobileMenuOpen && (
                  <div
                    style={{
                      position: 'fixed',
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      backgroundColor: 'rgba(0, 0, 0, 0.5)',
                      zIndex: 1500,
                      display: 'flex'
                    }}
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                {/* Mobile Sidebar */}
                <div
                  style={{
                    width: '280px',
                    height: '100vh',
                    background: 'linear-gradient(180deg, #00509d 0%, #003d7a 100%)',
                    color: 'white',
                    transform: isMobileMenuOpen ? 'translateX(0)' : 'translateX(-100%)',
                    transition: 'transform 0.3s ease-in-out',
                    overflowY: 'auto'
                  }}
                                      onClick={(e) => e.stopPropagation()}
                  >
                    <DemoSidebar 
                      activeView={activeView} 
                      onViewChange={(view) => {
                        setActiveView(view);
                        setIsMobileMenuOpen(false);
                      }}
                      demoBalance={demoBalance}
                      demoStartAmount={demoStartAmount}
                      demoState={demoState}
                      demoUserName={demoUserName}
                    />
        </div>
              </div>
            )}
          </>
        )}

                {/* Main Content Area */}
        <div style={{ 
          flex: 1,
          background: '#F8FAFC',
          minHeight: isMobile ? 'calc(100vh - 64px)' : '100vh',
          paddingLeft: isMobile ? '0' : '280px',
          display: 'flex',
          flexDirection: 'column'
        }}>
          <div style={{
            padding: isMobile ? '1rem' : '2rem',
            display: 'flex',
            flexDirection: 'column',
            gap: isMobile ? '1rem' : '2rem',
            flex: 1
          }}>
            {/* Content Area */}
            <LiveTradingProvider>
              <div style={{
                display: 'flex',
                flexDirection: isMobile ? 'column' : 'row',
                gap: isMobile ? '1rem' : '2rem',
                height: '100%'
              }}>
                {/* Main Content */}
                <div style={{ 
                  flex: 1,
                  minWidth: 0
                }}>
                  {renderMainContent()}
          </div>
                
                {/* Right Sidebar - Demo Trading Feed - Only show on home view */}
                {activeView === 'home' && (demoState === 'active' || demoState === 'completed' || demoTrades.length > 0) && (
                  <div style={{ 
                    width: isMobile ? '100%' : '400px'
                  }}>
                    <DemoTradingFeed 
                      trades={demoTrades}
                      demoState={demoState}
                      progress={demoProgress}
                    />
                  </div>
                )}
          </div>
            </LiveTradingProvider>
        </div>
      </div>

        {/* Demo Deposit Modal - Stable rendering */}
        {showDemoDeposit && (
        <div 
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: isMobile ? '1rem' : '2rem'
          }}
          onClick={(e) => {
            // Only close if clicking the backdrop, not the modal content
            if (e.target === e.currentTarget) {
              setShowDemoDeposit(false);
            }
          }}
        >
          <div style={{
            background: 'white',
              padding: isMobile ? '2rem 1.5rem' : '3rem 2.5rem',
              borderRadius: '20px',
            width: '100%',
            maxWidth: '500px',
              textAlign: 'center',
              boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
            }}>
              <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>💰</div>
              <h3 style={{ 
                margin: '0 0 1rem 0', 
                color: '#333',
                fontSize: isMobile ? '1.5rem' : '1.8rem',
                fontWeight: '800'
              }}>
                Start Your Demo
              </h3>
              <p style={{ 
                margin: '0 0 2rem 0', 
                color: '#666',
                fontSize: '1.1rem',
                lineHeight: 1.5
              }}>
                Enter your details and see our AI generate 25% returns in just 4 minutes!
              </p>
              
              <form 
                onSubmit={handleDemoFormSubmit}
                method="post"
                noValidate
              >
                {/* Name Input */}
                <div style={{ marginBottom: '1.5rem', textAlign: 'left' }}>
                  <label 
                    htmlFor="demo-name-input"
                  style={{
                      display: 'block', 
                      marginBottom: '8px', 
                      color: '#000000', 
                      fontWeight: '500', 
                      fontSize: '14px' 
                    }}
                  >
                    Your Name *
                </label>
                <input
                    id="demo-name-input"
                    name="demoName"
                  type="text"
                    value={nameInput}
                    onChange={(e) => setNameInput(e.target.value)}
                    placeholder="Enter your full name"
                    autoComplete="name"
                  style={{
                    width: '100%',
                    padding: '14px 16px',
                    border: '2px solid #d1d5db',
                    borderRadius: '8px',
                    fontSize: '16px',
                    outline: 'none',
                    transition: 'border-color 0.2s, box-shadow 0.2s',
                    boxSizing: 'border-box',
                    background: '#ffffff',
                    color: '#000000'
                  }}
                />
              </div>

              {/* Demo Amount Options */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)',
                gap: '1rem',
                marginBottom: '2rem'
              }}>
                {[2500, 5000, 10000].map((amount) => {
                  const endAmount = amount * 1.25;
                  return (
                  <button
                    key={amount}
                    onClick={() => handleStartDemo(amount)}
                  style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      padding: '1.5rem 1rem',
                      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                      color: 'white',
                      border: 'none',
                      borderRadius: '12px',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      textAlign: 'center',
                      boxSizing: 'border-box',
                      boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
                      transform: 'translateY(0)'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'translateY(-2px)';
                      e.currentTarget.style.boxShadow = '0 8px 16px rgba(102, 126, 234, 0.3)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = '0 4px 6px rgba(0, 0, 0, 0.1)';
                    }}
                  >
                    <div style={{
                      fontSize: '1.5rem',
                      fontWeight: '700',
                      marginBottom: '0.5rem'
                    }}>
                      ${amount.toLocaleString()}
              </div>
                    <div style={{
                      fontSize: '0.9rem',
                      fontWeight: '600',
                      marginBottom: '0.75rem',
                      opacity: 0.9
                    }}>
                      {amount === 2500 && 'Starter Demo'}
                      {amount === 5000 && 'Growth Demo'}
                      {amount === 10000 && 'Elite Demo'}
                    </div>
                    <div style={{
                      fontSize: '0.8rem',
                      opacity: 0.8,
                      lineHeight: 1.4
                    }}>
                      <div>Start: ${amount.toLocaleString()}</div>
                      <div style={{
                        fontWeight: '600',
                        color: '#a7f3d0'
                      }}>End: ${endAmount.toLocaleString()}</div>
                    </div>
                  </button>
                  );
                })}
              </div>

              {/* Custom Amount Input */}
              <div style={{ marginBottom: '2rem' }}>
                <div style={{ 
                  textAlign: 'center',
                  marginBottom: '1.25rem',
                  position: 'relative'
                }}>
                  <div style={{
                    position: 'absolute',
                    top: '50%',
                    left: 0,
                    right: 0,
                    height: '1px',
                    background: 'linear-gradient(90deg, transparent, #e2e8f0, transparent)'
                  }}></div>
                  <span style={{
                    background: 'white',
                    padding: '0 1rem',
                    color: '#64748b', 
                    fontSize: '0.875rem', 
                    textTransform: 'uppercase',
                    letterSpacing: '1px',
                    fontWeight: '600'
                  }}>
                    Or Enter Custom Amount
                  </span>
                </div>
                                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                <input
                    id="demo-amount-input"
                    name="demoAmount"
                    type="number"
                    value={amountInput}
                    onChange={(e) => setAmountInput(e.target.value)}
                    placeholder="5000"
                    min="100"
                    max="100000"
                    autoComplete="off"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        handleCustomAmountStart();
                      }
                    }}
                  style={{
                      flex: 1,
                      padding: '14px 16px',
                      border: '2px solid #d1d5db',
                    borderRadius: '8px',
                      fontSize: '18px',
                      fontWeight: '600',
                      textAlign: 'center',
                    outline: 'none',
                      transition: 'border-color 0.2s, box-shadow 0.2s',
                      boxSizing: 'border-box',
                      background: '#ffffff',
                      color: '#000000'
                    }}
                  />
                <button
                    onClick={handleCustomAmountStart}
                  style={{
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    color: 'white',
                    border: 'none',
                      padding: '14px 24px',
                    borderRadius: '8px',
                    fontSize: '16px',
                    fontWeight: '600',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      transform: 'translateY(0)',
                      boxSizing: 'border-box'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'translateY(-1px)';
                      e.currentTarget.style.boxShadow = '0 8px 16px rgba(102, 126, 234, 0.3)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = 'none';
                    }}
                >
                    Start Demo
                </button>
                </div>
                <div style={{ 
                  fontSize: '0.8rem', 
                  color: '#999', 
                  marginTop: '0.5rem' 
                }}>
                  Amount between $100 - $100,000
              </div>

                                {/* Live Start/End Display for Custom Amount */}
                {isValidCustomAmount && customAmountNumbers && (
                  <div style={{
                    marginTop: '1rem',
                    padding: '0.75rem',
                    background: '#f8fafc',
                    borderRadius: '8px',
                    border: '1px solid #e1e5e9'
                  }}>
                    <div style={{ fontSize: '0.85rem', color: '#666', marginBottom: '0.5rem', fontWeight: '600' }}>
                      Demo Simulation Preview:
              </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
                      <span style={{ color: '#666' }}>Start Balance:</span>
                      <span style={{ fontWeight: '600' }}>${customAmountNumbers.start.toLocaleString()}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
                      <span style={{ color: '#666' }}>Target End Balance:</span>
                      <span style={{ fontWeight: '600', color: '#10b981' }}>
                        ${customAmountNumbers.end.toLocaleString()} (+25%)
                      </span>
                    </div>
                  </div>
                )}
              </div>
              </form>
              
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setShowDemoDeposit(false);
                  }}
                  style={{
                    background: '#f3f4f6',
                    color: '#374151',
                    border: 'none',
                    padding: '0.75rem 2rem',
                    borderRadius: '8px',
                    fontSize: '1rem',
                    fontWeight: '600',
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
          </div>
        </div>
      )}
    </div>
    </MockAuthProvider>
  );
};

export default DemoDashboard;