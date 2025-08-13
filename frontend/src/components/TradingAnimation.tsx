import React, { useState, useEffect } from 'react';

interface Trade {
  id: string;
  symbol: string;
  type: 'BUY' | 'SELL';
  amount: number;
  price: number;
  profit: number;
  timestamp: number;
  user: string;
}

const TradingAnimation: React.FC = () => {
  const [trades, setTrades] = useState<Trade[]>([]);

  // Generate realistic crypto trading data
  const generateTrade = (): Trade => {
    const symbols = ['BTC/USD', 'ETH/USD', 'SOL/USD', 'ADA/USD', 'DOT/USD', 'LINK/USD', 'AVAX/USD', 'MATIC/USD'];
    const users = ['Alex Chen', 'Sarah M.', 'Mike R.', 'Emma L.', 'John D.', 'Lisa K.', 'David P.', 'Kate W.', 'Tom B.', 'Amy F.'];
    const types: ('BUY' | 'SELL')[] = ['BUY', 'SELL'];
    
    const symbol = symbols[Math.floor(Math.random() * symbols.length)];
    const type = types[Math.floor(Math.random() * types.length)];
    const user = users[Math.floor(Math.random() * users.length)];
    
    // Generate realistic amounts and prices based on symbol
    let amount, price, profit;
    
    if (symbol.includes('BTC')) {
      amount = parseFloat((Math.random() * 2 + 0.1).toFixed(4));
      price = 43000 + (Math.random() - 0.5) * 3000;
      profit = parseFloat((Math.random() * 800 + 100).toFixed(2)); // Always positive, $100-900 MX
    } else if (symbol.includes('ETH')) {
      amount = parseFloat((Math.random() * 10 + 0.5).toFixed(3));
      price = 2500 + (Math.random() - 0.5) * 300;
      profit = parseFloat((Math.random() * 600 + 100).toFixed(2)); // Always positive, $100-700 MX
    } else {
      amount = parseFloat((Math.random() * 100 + 10).toFixed(2));
      price = Math.random() * 200 + 20;
      profit = parseFloat((Math.random() * 400 + 100).toFixed(2)); // Always positive, $100-500 MX
    }

    return {
      id: Date.now() + Math.random().toString(),
      symbol,
      type,
      amount,
      price,
      profit,
      timestamp: Date.now(),
      user
    };
  };

  // Add new trades periodically
  useEffect(() => {
    const interval = setInterval(() => {
      setTrades(prevTrades => {
        const newTrade = generateTrade();
        const updatedTrades = [newTrade, ...prevTrades];
        return updatedTrades.slice(0, 5); // Keep only the latest 5 trades
      });
    }, 4000); // New trade every 4 seconds

    // Generate initial trade (just one)
    const initialTrade = generateTrade();
    setTrades([initialTrade]);

    return () => clearInterval(interval);
  }, []);

  // Trade card component
  const TradeCard: React.FC<{ trade: Trade; index: number }> = ({ trade, index }) => {
    const isProfit = trade.profit > 0;
    
    return (
      <div 
        className="trade-card-custom"
        style={{
          animation: index === 0 ? `slideDown 1.2s ease-out both` : 'none',
          transform: `translateY(${index * 15}px)`,
          transition: 'transform 0.8s ease-out'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{
              background: trade.type === 'BUY' ? '#10b981 !important' : '#ef4444 !important',
              color: 'white !important',
              padding: '2px 6px !important',
              borderRadius: '4px !important',
              fontSize: '12px !important',
              fontWeight: '600 !important'
            }}>
              {trade.type}
            </span>
            <span className="symbol-white-text">
              {trade.symbol}
            </span>
          </div>
          <div className={trade.type === 'BUY' ? 'buy-trade-green' : 'sell-trade-red'}>
            {trade.type}
          </div>
        </div>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div className="amount-white-text">
              {trade.amount} @ ${trade.price.toLocaleString()} MX
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <span className="user-name-text">
                {trade.user} Genero
              </span>
              <span className="profit-amount-text">
                +${trade.profit.toLocaleString()} MX
              </span>
            </div>
          </div>
          <div className="time-white-text">
            {new Date(trade.timestamp).toLocaleTimeString()}
          </div>
        </div>
      </div>
    );
  };

  return (
    <>
      {/* CSS Keyframes */}
      <style>
        {`


          @keyframes slideDown {
            0% {
              opacity: 0;
              transform: translateY(-50px) scale(0.9);
            }
            50% {
              opacity: 0.7;
              transform: translateY(-10px) scale(0.95);
            }
            100% {
              opacity: 1;
              transform: translateY(0) scale(1);
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
          
          .trade-card-custom {
            background: rgba(0, 0, 0, 0.3) !important;
            backdrop-filter: blur(12px) !important;
            border-radius: 8px !important;
            border: 1px solid rgba(255, 255, 255, 0.15) !important;
            padding: 10px !important;
            margin-bottom: 8px !important;
            transition: all 0.8s ease !important;
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2) !important;
            position: relative;
            z-index: 1;
          }
          
          .buy-trade-green {
            color: #10b981;
            font-weight: 600;
            font-size: 14px;
          }
          
          .sell-trade-red {
            color: #ef4444;
            font-weight: 600;
            font-size: 14px;
          }
          
          .user-name-text {
            color: #ffffff;
            font-size: 12px;
            font-weight: normal;
          }
          
          .profit-amount-text {
            color: #10b981;
            font-size: 12px;
            font-weight: 600;
          }
          
          .header-white-text {
            color: #ffffff !important;
            font-size: 18px !important;
            font-weight: 600 !important;
            margin: 0 !important;
          }
          
          .symbol-white-text {
            color: #ffffff !important;
            font-weight: 600 !important;
            font-size: 14px !important;
          }
          
          .amount-white-text {
            color: #ffffff !important;
            font-size: 13px !important;
          }
          
          .time-white-text {
            color: #ffffff !important;
            font-size: 12px !important;
          }
          
          .live-white-text {
            color: #ffffff !important;
            font-size: 12px !important;
            font-weight: 600 !important;
          }
        `}
      </style>

      <div style={{
        position: 'relative',
        width: '100%',
        height: '100vh',
        background: 'transparent',
        overflow: 'hidden'
      }}>
        {/* Simple transparent background */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          background: 'transparent'
        }} />

        {/* Glass Overlay Content */}
        <div style={{
          position: 'relative',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          padding: '20px',
          background: 'rgba(0, 0, 0, 0.4) !important',
          backdropFilter: 'blur(20px) !important',
          maxWidth: '400px',
          margin: '0 auto',
          overflow: 'hidden'
        }}>
          {/* Header */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '20px'
          }}>
            <h2 className="header-white-text">
              Unite a 1000s de usuarios que confian en AI para asegurar su futuro
            </h2>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              background: 'rgba(16, 185, 129, 0.2) !important',
              padding: '6px 12px',
              borderRadius: '16px',
              border: '1px solid rgba(16, 185, 129, 0.4) !important',
              backdropFilter: 'blur(8px) !important'
            }}>
              <div style={{
                width: '6px',
                height: '6px',
                background: '#10b981',
                borderRadius: '50%',
                animation: 'pulse 2s ease-in-out infinite'
              }} />
              <span className="live-white-text">
                LIVE
              </span>
            </div>
          </div>

          {/* Trading Cards */}
          <div style={{
            flex: 1,
            overflow: 'hidden',
            paddingRight: '8px'
          }}>
            {trades.map((trade, index) => (
              <TradeCard key={trade.id} trade={trade} index={index} />
            ))}
          </div>

          {/* Stats Footer */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '10px',
            marginTop: '15px',
            padding: '12px',
            background: 'rgba(0, 0, 0, 0.5) !important',
            backdropFilter: 'blur(15px) !important',
            borderRadius: '8px !important',
            border: '1px solid rgba(255, 255, 255, 0.1) !important',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.5) !important'
          }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ color: 'rgba(255, 255, 255, 0.9) !important', fontSize: '16px !important', fontWeight: '600 !important' }}>
                $2.4M
              </div>
              <div style={{ color: 'rgba(255, 255, 255, 0.5) !important', fontSize: '10px !important' }}>
                Volume
              </div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ color: 'rgba(255, 255, 255, 0.9) !important', fontSize: '16px !important', fontWeight: '600 !important' }}>
                847
              </div>
              <div style={{ color: 'rgba(255, 255, 255, 0.5) !important', fontSize: '10px !important' }}>
                Traders
              </div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ color: '#10b981 !important', fontSize: '16px !important', fontWeight: '600 !important' }}>
                +12.4%
              </div>
              <div style={{ color: 'rgba(255, 255, 255, 0.5) !important', fontSize: '10px !important' }}>
                Profit
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default TradingAnimation;