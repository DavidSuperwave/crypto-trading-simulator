import React, { useState } from 'react';
import BalanceSimulationWidget from './BalanceSimulationWidget';
import { DollarSign, Settings, Play } from 'lucide-react';

const SimulationDemo: React.FC = () => {
  const [initialBalance, setInitialBalance] = useState(10000);
  const [projectionMonths, setProjectionMonths] = useState(12);

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      padding: '2rem'
    }}>
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto'
      }}>
        {/* Header */}
        <div style={{
          textAlign: 'center',
          color: 'white',
          marginBottom: '2rem'
        }}>
          <h1 style={{
            margin: '0 0 0.5rem 0',
            fontSize: '3rem',
            fontWeight: '700',
            textShadow: '0 2px 4px rgba(0,0,0,0.3)'
          }}>
            🤖 AI Trading Simulator
          </h1>
          <p style={{
            margin: 0,
            fontSize: '1.25rem',
            opacity: 0.9
          }}>
            Experience the power of our advanced trading algorithms
          </p>
        </div>

        {/* Controls Panel */}
        <div style={{
          background: 'rgba(255, 255, 255, 0.1)',
          backdropFilter: 'blur(10px)',
          borderRadius: '16px',
          padding: '1.5rem',
          marginBottom: '2rem',
          border: '1px solid rgba(255, 255, 255, 0.2)'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            marginBottom: '1rem',
            color: 'white'
          }}>
            <Settings size={20} />
            <h3 style={{ margin: 0, fontSize: '1.125rem', fontWeight: '600' }}>
              Simulation Settings
            </h3>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
            gap: '1rem',
            alignItems: 'end'
          }}>
            {/* Initial Balance */}
            <div>
              <label style={{
                display: 'block',
                fontSize: '0.875rem',
                fontWeight: '500',
                color: 'rgba(255, 255, 255, 0.9)',
                marginBottom: '0.5rem'
              }}>
                Initial Investment Amount
              </label>
              <div style={{ position: 'relative' }}>
                <DollarSign 
                  size={18} 
                  style={{
                    position: 'absolute',
                    left: '0.75rem',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: '#6B7280'
                  }}
                />
                <input
                  type="number"
                  value={initialBalance}
                  onChange={(e) => setInitialBalance(Number(e.target.value))}
                  min="1000"
                  max="1000000"
                  step="1000"
                  style={{
                    width: '100%',
                    padding: '0.75rem 0.75rem 0.75rem 2.5rem',
                    borderRadius: '8px',
                    border: '1px solid rgba(255, 255, 255, 0.3)',
                    background: 'rgba(255, 255, 255, 0.1)',
                    color: 'white',
                    fontSize: '1rem',
                    backdropFilter: 'blur(10px)'
                  }}
                  placeholder="Enter amount"
                />
              </div>
            </div>

            {/* Projection Months */}
            <div>
              <label style={{
                display: 'block',
                fontSize: '0.875rem',
                fontWeight: '500',
                color: 'rgba(255, 255, 255, 0.9)',
                marginBottom: '0.5rem'
              }}>
                Projection Period (Months)
              </label>
              <select
                value={projectionMonths}
                onChange={(e) => setProjectionMonths(Number(e.target.value))}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  borderRadius: '8px',
                  border: '1px solid rgba(255, 255, 255, 0.3)',
                  background: 'rgba(255, 255, 255, 0.1)',
                  color: 'white',
                  fontSize: '1rem',
                  backdropFilter: 'blur(10px)'
                }}
              >
                <option value={6} style={{ background: '#374151', color: 'white' }}>6 Months</option>
                <option value={12} style={{ background: '#374151', color: 'white' }}>12 Months</option>
                <option value={24} style={{ background: '#374151', color: 'white' }}>24 Months</option>
                <option value={36} style={{ background: '#374151', color: 'white' }}>36 Months</option>
              </select>
            </div>

            {/* Quick Presets */}
            <div>
              <label style={{
                display: 'block',
                fontSize: '0.875rem',
                fontWeight: '500',
                color: 'rgba(255, 255, 255, 0.9)',
                marginBottom: '0.5rem'
              }}>
                Quick Presets
              </label>
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                {[5000, 10000, 25000, 50000, 100000].map(amount => (
                  <button
                    key={amount}
                    onClick={() => setInitialBalance(amount)}
                    style={{
                      background: initialBalance === amount 
                        ? 'rgba(255, 255, 255, 0.3)' 
                        : 'rgba(255, 255, 255, 0.1)',
                      border: '1px solid rgba(255, 255, 255, 0.3)',
                      borderRadius: '6px',
                      padding: '0.5rem 0.75rem',
                      color: 'white',
                      fontSize: '0.75rem',
                      cursor: 'pointer',
                      backdropFilter: 'blur(10px)',
                      transition: 'all 0.2s ease'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = initialBalance === amount 
                        ? 'rgba(255, 255, 255, 0.3)' 
                        : 'rgba(255, 255, 255, 0.1)';
                    }}
                  >
                    ${amount.toLocaleString()}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Simulation Widget */}
        <BalanceSimulationWidget
          initialBalance={initialBalance}
          showProjection={true}
          projectionMonths={projectionMonths}
        />

        {/* Features Section */}
        <div style={{
          marginTop: '2rem',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: '1rem'
        }}>
          {[
            {
              icon: '🤖',
              title: 'AI-Powered Trading',
              description: 'Advanced algorithms analyze market trends 24/7 to maximize your returns'
            },
            {
              icon: '📈',
              title: 'Consistent Returns',
              description: 'Our system targets 20%-22% first month, then 15%-17% monthly returns through diversified strategies'
            },
            {
              icon: '🔒',
              title: 'Risk Management',
              description: 'Built-in safeguards and stop-loss mechanisms protect your investment'
            },
            {
              icon: '⚡',
              title: 'Real-Time Execution',
              description: 'Lightning-fast trade execution ensures you never miss profitable opportunities'
            }
          ].map((feature, index) => (
            <div
              key={index}
              style={{
                background: 'rgba(255, 255, 255, 0.1)',
                backdropFilter: 'blur(10px)',
                borderRadius: '12px',
                padding: '1.5rem',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                color: 'white',
                textAlign: 'center'
              }}
            >
              <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>
                {feature.icon}
              </div>
              <h4 style={{
                margin: '0 0 0.5rem 0',
                fontSize: '1.125rem',
                fontWeight: '600'
              }}>
                {feature.title}
              </h4>
              <p style={{
                margin: 0,
                fontSize: '0.875rem',
                opacity: 0.9,
                lineHeight: 1.5
              }}>
                {feature.description}
              </p>
            </div>
          ))}
        </div>

        {/* CTA Section */}
        <div style={{
          marginTop: '2rem',
          textAlign: 'center',
          background: 'rgba(255, 255, 255, 0.1)',
          backdropFilter: 'blur(10px)',
          borderRadius: '16px',
          padding: '2rem',
          border: '1px solid rgba(255, 255, 255, 0.2)'
        }}>
          <h3 style={{
            margin: '0 0 1rem 0',
            fontSize: '1.5rem',
            fontWeight: '700',
            color: 'white'
          }}>
            Ready to Start Your AI Trading Journey?
          </h3>
          <p style={{
            margin: '0 0 1.5rem 0',
            fontSize: '1rem',
            color: 'rgba(255, 255, 255, 0.9)'
          }}>
            Join thousands of investors who are already earning consistent returns with our AI trading platform.
          </p>
          <button style={{
            background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
            color: 'white',
            border: 'none',
            borderRadius: '12px',
            padding: '1rem 2rem',
            fontSize: '1.125rem',
            fontWeight: '600',
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
            boxShadow: '0 4px 6px rgba(16, 185, 129, 0.3)',
            transition: 'all 0.2s ease'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-2px)';
            e.currentTarget.style.boxShadow = '0 6px 8px rgba(16, 185, 129, 0.4)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 4px 6px rgba(16, 185, 129, 0.3)';
          }}
          >
            <Play size={20} />
            Start Trading Now
          </button>
        </div>
      </div>
    </div>
  );
};

export default SimulationDemo;