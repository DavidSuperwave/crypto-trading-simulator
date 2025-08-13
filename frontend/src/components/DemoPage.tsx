import React from 'react';
import LiveTradingFeedDemo from './LiveTradingFeedDemo';

const DemoPage: React.FC = () => {
  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      padding: '2rem 1rem'
    }}>
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto'
      }}>
        <div style={{
          textAlign: 'center',
          marginBottom: '3rem',
          color: 'white'
        }}>
          <h1 style={{
            fontSize: '3rem',
            fontWeight: '800',
            margin: '0 0 1rem 0',
            textShadow: '2px 2px 4px rgba(0,0,0,0.3)'
          }}>
            🚀 Live Trading Feed Demo
          </h1>
          <p style={{
            fontSize: '1.25rem',
            opacity: 0.9,
            maxWidth: '600px',
            margin: '0 auto',
            lineHeight: '1.6'
          }}>
            Experience our 24/7 AI-powered crypto trading system in action. 
            Watch real-time trades execute throughout the day and night.
          </p>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '3rem',
          alignItems: 'start'
        }}>
          {/* Demo Component */}
          <div>
            <LiveTradingFeedDemo />
          </div>

          {/* Information Panel */}
          <div style={{
            background: 'rgba(255, 255, 255, 0.95)',
            borderRadius: '16px',
            padding: '2rem',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
            backdropFilter: 'blur(10px)'
          }}>
            <h2 style={{
              margin: '0 0 1.5rem 0',
              color: '#1F2937',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              📊 System Features
            </h2>

            <div style={{ marginBottom: '2rem' }}>
              <h3 style={{ color: '#374151', marginBottom: '1rem' }}>🌍 24/7 Market Coverage</h3>
              <p style={{ color: '#6B7280', lineHeight: '1.6', fontSize: '0.95rem' }}>
                Unlike traditional stock markets, crypto never sleeps. Our AI trading system 
                operates around the clock, generating trades at all hours including weekends, 
                holidays, and overnight sessions.
              </p>
            </div>

            <div style={{ marginBottom: '2rem' }}>
              <h3 style={{ color: '#374151', marginBottom: '1rem' }}>⚡ Real-time Execution</h3>
              <p style={{ color: '#6B7280', lineHeight: '1.6', fontSize: '0.95rem' }}>
                Watch trades execute in real-time as their pre-calculated timestamps are reached. 
                Each trade appears exactly when it should, creating an authentic live trading experience.
              </p>
            </div>

            <div style={{ marginBottom: '2rem' }}>
              <h3 style={{ color: '#374151', marginBottom: '1rem' }}>📈 Smart Risk Management</h3>
              <p style={{ color: '#6B7280', lineHeight: '1.6', fontSize: '0.95rem' }}>
                Our algorithm maintains a 65-75% win rate while ensuring precise daily profit 
                targets are met. Every trade is calculated to contribute to your monthly returns.
              </p>
            </div>

            <div style={{ marginBottom: '2rem' }}>
              <h3 style={{ color: '#374151', marginBottom: '1rem' }}>🎯 Multiple Cryptocurrencies</h3>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(4, 1fr)',
                gap: '0.5rem',
                marginTop: '1rem'
              }}>
                {['BTC', 'ETH', 'ADA', 'SOL', 'DOT', 'LINK', 'UNI', 'AAVE'].map(crypto => (
                  <div key={crypto} style={{
                    background: '#F3F4F6',
                    padding: '0.5rem',
                    borderRadius: '8px',
                    textAlign: 'center',
                    fontSize: '0.875rem',
                    fontWeight: '600',
                    color: '#374151'
                  }}>
                    {crypto}
                  </div>
                ))}
              </div>
            </div>

            <div style={{
              background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
              color: 'white',
              padding: '1.5rem',
              borderRadius: '12px',
              textAlign: 'center'
            }}>
              <h3 style={{ margin: '0 0 0.5rem 0' }}>Ready to Start Trading?</h3>
              <p style={{ margin: '0 0 1rem 0', opacity: 0.9, fontSize: '0.95rem' }}>
                Join thousands of users earning daily returns with our AI trading system.
              </p>
              <button style={{
                background: 'rgba(255, 255, 255, 0.2)',
                border: '2px solid rgba(255, 255, 255, 0.3)',
                color: 'white',
                padding: '0.75rem 2rem',
                borderRadius: '8px',
                fontSize: '1rem',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.3s ease'
              }}>
                Get Started Today
              </button>
            </div>
          </div>
        </div>

        {/* Technical Details */}
        <div style={{
          marginTop: '4rem',
          background: 'rgba(255, 255, 255, 0.95)',
          borderRadius: '16px',
          padding: '2rem',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
          backdropFilter: 'blur(10px)'
        }}>
          <h2 style={{
            margin: '0 0 2rem 0',
            color: '#1F2937',
            textAlign: 'center'
          }}>
            🔧 Technical Implementation
          </h2>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: '2rem'
          }}>
            <div>
              <h3 style={{ color: '#374151', marginBottom: '1rem' }}>🎲 Daily Volatility Algorithm</h3>
              <p style={{ color: '#6B7280', lineHeight: '1.6', fontSize: '0.95rem' }}>
                Generates realistic daily percentage swings that sum to exact monthly targets, 
                ensuring mathematical precision while maintaining market-like volatility patterns.
              </p>
            </div>

            <div>
              <h3 style={{ color: '#374151', marginBottom: '1rem' }}>⚖️ Account-Based Scaling</h3>
              <p style={{ color: '#6B7280', lineHeight: '1.6', fontSize: '0.95rem' }}>
                Trade frequency scales with account size: $5K-$15K gets 20-30 trades/day, 
                while $100K+ accounts see 75-100+ trades for realistic institutional-level activity.
              </p>
            </div>

            <div>
              <h3 style={{ color: '#374151', marginBottom: '1rem' }}>🔄 Mid-Month Recalculation</h3>
              <p style={{ color: '#6B7280', lineHeight: '1.6', fontSize: '0.95rem' }}>
                When new deposits arrive, the system automatically recalculates remaining daily 
                targets while maintaining locked monthly rates, ensuring consistent returns.
              </p>
            </div>

            <div>
              <h3 style={{ color: '#374151', marginBottom: '1rem' }}>📱 Real-time Display</h3>
              <p style={{ color: '#6B7280', lineHeight: '1.6', fontSize: '0.95rem' }}>
                Pre-generated trades appear progressively based on timestamps, creating the 
                illusion of live execution while ensuring all targets are mathematically precise.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DemoPage;