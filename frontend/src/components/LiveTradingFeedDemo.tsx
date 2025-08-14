import React, { useState, useEffect, useMemo } from 'react';
import { TrendingUp, TrendingDown, Activity } from 'lucide-react';

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
}

const LiveTradingFeedDemo: React.FC = () => {
  // Sample trades data based on our 24/7 crypto system
  const sampleTrades: Trade[] = useMemo(() => [
    {
      id: "1",
      timestamp: "2025-08-08T21:51:33.000Z",
      displayTime: "21:51",
      cryptoSymbol: "BTC",
      cryptoName: "Bitcoin",
      tradeType: "long",
      profitLoss: 2.38,
      amount: 2.38,
      duration: 76,
      status: "completed",
      isWinningTrade: true,
      variance: "low"
    },
    {
      id: "2",
      timestamp: "2025-08-08T21:02:15.000Z",
      displayTime: "21:02",
      cryptoSymbol: "ETH",
      cryptoName: "Ethereum",
      tradeType: "long",
      profitLoss: -0.69,
      amount: 0.69,
      duration: 43,
      status: "completed",
      isWinningTrade: false,
      variance: "minimal"
    },
    {
      id: "3",
      timestamp: "2025-08-08T20:12:47.000Z",
      displayTime: "20:12",
      cryptoSymbol: "ETH",
      cryptoName: "Ethereum",
      tradeType: "long",
      profitLoss: -0.64,
      amount: 0.64,
      duration: 52,
      status: "completed",
      isWinningTrade: false,
      variance: "minimal"
    },
    {
      id: "4",
      timestamp: "2025-08-08T18:47:46.000Z",
      displayTime: "18:47",
      cryptoSymbol: "DOT",
      cryptoName: "Polkadot",
      tradeType: "short",
      profitLoss: 2.22,
      amount: 2.22,
      duration: 89,
      status: "completed",
      isWinningTrade: true,
      variance: "low"
    },
    {
      id: "5",
      timestamp: "2025-08-08T18:00:11.000Z",
      displayTime: "18:00",
      cryptoSymbol: "DOT",
      cryptoName: "Polkadot",
      tradeType: "long",
      profitLoss: 1.70,
      amount: 1.70,
      duration: 76,
      status: "completed",
      isWinningTrade: true,
      variance: "minimal"
    },
    {
      id: "6",
      timestamp: "2025-08-08T16:32:00.000Z",
      displayTime: "16:32",
      cryptoSymbol: "ADA",
      cryptoName: "Cardano",
      tradeType: "short",
      profitLoss: 1.45,
      amount: 1.45,
      duration: 67,
      status: "completed",
      isWinningTrade: true,
      variance: "minimal"
    },
    {
      id: "7",
      timestamp: "2025-08-08T15:18:25.000Z",
      displayTime: "15:18",
      cryptoSymbol: "SOL",
      cryptoName: "Solana",
      tradeType: "long",
      profitLoss: -1.23,
      amount: 1.23,
      duration: 34,
      status: "completed",
      isWinningTrade: false,
      variance: "minimal"
    },
    {
      id: "8",
      timestamp: "2025-08-08T14:05:12.000Z",
      displayTime: "14:05",
      cryptoSymbol: "LINK",
      cryptoName: "Chainlink",
      tradeType: "short",
      profitLoss: 3.15,
      amount: 3.15,
      duration: 112,
      status: "completed",
      isWinningTrade: true,
      variance: "medium"
    },
    {
      id: "9",
      timestamp: "2025-08-08T12:42:33.000Z",
      displayTime: "12:42",
      cryptoSymbol: "UNI",
      cryptoName: "Uniswap",
      tradeType: "long",
      profitLoss: 0.87,
      amount: 0.87,
      duration: 28,
      status: "completed",
      isWinningTrade: true,
      variance: "minimal"
    },
    {
      id: "10",
      timestamp: "2025-08-08T10:15:45.000Z",
      displayTime: "10:15",
      cryptoSymbol: "AAVE",
      cryptoName: "Aave",
      tradeType: "short",
      profitLoss: -0.45,
      amount: 0.45,
      duration: 19,
      status: "completed",
      isWinningTrade: false,
      variance: "minimal"
    }
  ], []);

  const [visibleTrades, setVisibleTrades] = useState<Trade[]>([]);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isLive] = useState(true);

  // Simulate real-time trade revelation
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
      
      // Filter trades that should be visible based on current time
      const now = new Date();
      const currentTrades = sampleTrades.filter(trade => 
        new Date(trade.timestamp) <= now
      );
      
      setVisibleTrades(currentTrades);
    }, 1000);

    return () => clearInterval(interval);
  }, [sampleTrades]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  };

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  // Calculate statistics
  const winningTrades = visibleTrades.filter(t => t.isWinningTrade).length;
  const totalTrades = visibleTrades.length;
  const winRate = totalTrades > 0 ? (winningTrades / totalTrades) * 100 : 0;
  const totalProfit = visibleTrades.reduce((sum, trade) => sum + trade.profitLoss, 0);

  // Get next upcoming trade
  

  return (
    <div style={{
      maxWidth: '400px',
      margin: '2rem auto',
      padding: '0 1rem'
    }}>
      <h2 style={{
        textAlign: 'center',
        marginBottom: '2rem',
        color: '#1F2937'
      }}>
        🚀 Live Trading Feed Demo
      </h2>

      {/* Live Trading Feed Component */}
      <div style={{
        background: 'white',
        borderRadius: '16px',
        padding: '1.5rem',
        boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
        border: '1px solid #E5E7EB'
      }}>
        {/* Header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '1rem',
          paddingBottom: '1rem',
          borderBottom: '1px solid #F3F4F6'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Activity size={20} style={{ color: '#10B981' }} />
            <h3 style={{ margin: 0, fontSize: '1.1rem', color: '#1F2937' }}>
              Live Trading
            </h3>
          </div>
          <div style={{
            background: isLive ? '#10B981' : '#6B7280',
            color: 'white',
            fontSize: '0.75rem',
            padding: '0.25rem 0.75rem',
            borderRadius: '12px',
            fontWeight: '600'
          }}>
            {isLive ? '🔴 LIVE' : '⏸️ PAUSED'}
          </div>
        </div>

        {/* Statistics */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr 1fr',
          gap: '1rem',
          marginBottom: '1.5rem'
        }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '1.5rem', fontWeight: '700', color: totalProfit >= 0 ? '#10B981' : '#EF4444' }}>
              {formatCurrency(totalProfit)}
            </div>
            <div style={{ fontSize: '0.75rem', color: '#6B7280' }}>Today's P/L</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#3B82F6' }}>
              {totalTrades}
            </div>
            <div style={{ fontSize: '0.75rem', color: '#6B7280' }}>Trades</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '1.5rem', fontWeight: '700', color: winRate >= 60 ? '#10B981' : '#F59E0B' }}>
              {winRate.toFixed(0)}%
            </div>
            <div style={{ fontSize: '0.75rem', color: '#6B7280' }}>Win Rate</div>
          </div>
        </div>



        {/* Trade List */}
        <div style={{
          maxHeight: '400px',
          overflowY: 'auto'
        }}>
          <div style={{
            fontSize: '0.875rem',
            fontWeight: '600',
            color: '#6B7280',
            marginBottom: '1rem',
            textAlign: 'center'
          }}>
            Recent Trades ({visibleTrades.length})
          </div>

          {visibleTrades.length === 0 ? (
            <div style={{
              textAlign: 'center',
              padding: '2rem',
              color: '#6B7280'
            }}>
              <Activity size={32} style={{ margin: '0 auto 1rem', opacity: 0.5 }} />
              <div>Waiting for trading activity...</div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {visibleTrades.slice().reverse().map((trade, index) => (
                <div
                  key={trade.id}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '0.75rem',
                    borderRadius: '8px',
                    background: index === 0 ? '#F0FDF4' : '#F9FAFB',
                    border: `1px solid ${index === 0 ? '#10B981' : '#E5E7EB'}`,
                    animation: index === 0 ? 'slideIn 0.5s ease-out' : undefined
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '50%',
                      background: trade.isWinningTrade 
                        ? 'linear-gradient(135deg, #10B981 0%, #059669 100%)'
                        : 'linear-gradient(135deg, #EF4444 0%, #DC2626 100%)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'white'
                    }}>
                      {trade.isWinningTrade ? 
                        <TrendingUp size={16} /> : 
                        <TrendingDown size={16} />
                      }
                    </div>
                    
                    <div>
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        marginBottom: '0.25rem'
                      }}>
                        <span style={{ fontWeight: '600', color: '#1F2937' }}>
                          {trade.cryptoSymbol}
                        </span>
                        <span style={{
                          fontSize: '0.75rem',
                          padding: '0.125rem 0.5rem',
                          borderRadius: '6px',
                          background: trade.tradeType === 'long' ? '#DBEAFE' : '#FEE2E2',
                          color: trade.tradeType === 'long' ? '#1D4ED8' : '#DC2626',
                          fontWeight: '600'
                        }}>
                          {trade.tradeType.toUpperCase()}
                        </span>
                      </div>
                      <div style={{
                        fontSize: '0.75rem',
                        color: '#6B7280'
                      }}>
                        {formatTime(trade.timestamp)} • {trade.duration}m
                      </div>
                    </div>
                  </div>
                  
                  <div style={{
                    textAlign: 'right'
                  }}>
                    <div style={{
                      fontWeight: '700',
                      color: trade.profitLoss >= 0 ? '#10B981' : '#EF4444'
                    }}>
                      {trade.profitLoss >= 0 ? '+' : ''}{formatCurrency(trade.profitLoss)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{
          marginTop: '1.5rem',
          paddingTop: '1rem',
          borderTop: '1px solid #F3F4F6',
          textAlign: 'center'
        }}>
          <div style={{
            fontSize: '0.75rem',
            color: '#9CA3AF',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.5rem'
          }}>
            <div style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              background: '#10B981',
              animation: 'pulse 2s infinite'
            }} />
            24/7 Crypto Markets • Real-time AI Trading
          </div>
        </div>
      </div>

      {/* Demo Controls */}
      <div style={{
        marginTop: '2rem',
        padding: '1rem',
        background: '#F9FAFB',
        borderRadius: '12px',
        border: '1px solid #E5E7EB'
      }}>
        <h4 style={{ margin: '0 0 1rem 0', color: '#1F2937' }}>Demo Features:</h4>
        <ul style={{ margin: 0, paddingLeft: '1.5rem', color: '#6B7280', fontSize: '0.875rem' }}>
          <li>Real-time trade revelation based on timestamps</li>
          <li>24/7 crypto market activity (trades at all hours)</li>
          <li>Live statistics (P/L, win rate, trade count)</li>
          <li>Next trade preview with ETA</li>
          <li>Smooth animations for new trades</li>
          <li>Multiple cryptocurrency symbols</li>
          <li>Long/short position indicators</li>
        </ul>
        
        <div style={{ marginTop: '1rem', padding: '0.75rem', background: '#EEF2FF', borderRadius: '8px' }}>
          <div style={{ fontSize: '0.875rem', color: '#3730A3', fontWeight: '600' }}>
            Current Time: {currentTime.toLocaleTimeString()}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#6366F1', marginTop: '0.25rem' }}>
            Trades appear as their timestamps are reached
          </div>
        </div>
      </div>

      {/* CSS for animations */}
      <style>
        {`
          @keyframes slideIn {
            from {
              opacity: 0;
              transform: translateX(-20px);
            }
            to {
              opacity: 1;
              transform: translateX(0);
            }
          }

          @keyframes pulse {
            0%, 100% {
              opacity: 1;
            }
            50% {
              opacity: 0.5;
            }
          }
        `}
      </style>
    </div>
  );
};

export default LiveTradingFeedDemo;