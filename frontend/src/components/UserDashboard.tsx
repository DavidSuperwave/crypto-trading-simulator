import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import DepositPage from './DepositPage';
import WithdrawalPage from './WithdrawalPage';
import UserSettings from './UserSettings';
import PendingRequestsWidget from './PendingRequestsWidget';
import UserSidebar from './UserSidebar';
import LiveTradingFeed from './LiveTradingFeed';
import FloatingChatBubble from './FloatingChatBubble';
import PrimaryBalanceCard from './PrimaryBalanceCard';

import { TrendingUp, TrendingDown, Menu, X } from 'lucide-react';
import { useRealTimeNotifications } from '../hooks/useRealTimeNotifications';
import { LiveTradingProvider } from '../context/LiveTradingContext';

// Removed unused Transaction interface

interface Trade {
  id: string;
  symbol: string;
  quantity: number;
  entryPrice: number;
  amount: number;
  timestamp: string;
}

interface SimulationResult {
  id: string;
  type: 'opened' | 'closed';
  symbol: string;
  amount: number;
  profitLoss?: number;
  timestamp: string;
}

interface CryptoPrice {
  symbol: string;
  name: string;
  price: number;
  change: number;
  icon: string;
}

const MAX_SIMULATIONS = 50;
const ENABLE_TRADING_SIMULATOR = false; // Set to true to re-enable

const UserDashboard: React.FC = () => {
  const { user, updateUser } = useAuth();
  const [activeView, setActiveView] = useState('home');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  
  // Mobile responsive logic
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth <= 768;
      setIsMobile(mobile);
      if (!mobile) {
        setIsMobileMenuOpen(false); // Close mobile menu on desktop
      }
    };
    
    handleResize(); // Initial check
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Close mobile menu when route changes
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [activeView]);

  // Real-time notifications for user updates
  useRealTimeNotifications({
    onDepositStatusUpdate: (deposit) => {

      
      if (deposit.status === 'approved' && user) {
        // Update user balance when deposit is approved
        updateUser({ 
          balance: (user.balance || 0) + deposit.amount 
        });
        
        // Show notification
        if (Notification.permission === 'granted') {
          new Notification('Deposit Approved! 🎉', {
            body: `Your deposit of $${deposit.amount} has been approved and added to your balance.`,
            icon: '/favicon.ico'
          });
        }
      } else if (deposit.status === 'rejected') {
        // Show rejection notification
        if (Notification.permission === 'granted') {
          new Notification('Deposit Rejected', {
            body: `Your deposit of $${deposit.amount} has been rejected. Please contact support for details.`,
            icon: '/favicon.ico'
          });
        }
      }
    },
    onWithdrawalStatusUpdate: (withdrawal) => {

      
      if (withdrawal.status === 'approved') {
        // Show approval notification (balance already deducted during approval)
        if (Notification.permission === 'granted') {
          new Notification('Withdrawal Approved! ✅', {
            body: `Your withdrawal of $${withdrawal.amount} has been approved and is being processed.`,
            icon: '/favicon.ico'
          });
        }
      } else if (withdrawal.status === 'rejected') {
        // Show rejection notification
        if (Notification.permission === 'granted') {
          new Notification('Withdrawal Rejected', {
            body: `Your withdrawal of $${withdrawal.amount} has been rejected. Please contact support for details.`,
            icon: '/favicon.ico'
          });
        }
      }
    }
  });

  // Request notification permission on component mount
  useEffect(() => {
    if (Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);
  // Removed unused transactionHistory state
  const [isSimulatorRunning, setIsSimulatorRunning] = useState(false);
  const [activeTrades, setActiveTrades] = useState<Trade[]>([]);
  const [simulationCount, setSimulationCount] = useState(0);
  const [simulationResults, setSimulationResults] = useState<SimulationResult[]>([]);
  const [currentAction, setCurrentAction] = useState<string>('');
  const [newTradeAnimation, setNewTradeAnimation] = useState<string>('');
  const [cryptoPrices, setCryptoPrices] = useState<CryptoPrice[]>([
    { symbol: 'BTC', name: 'Bitcoin', price: 52000, change: 2.5, icon: '₿' },
    { symbol: 'ETH', name: 'Ethereum', price: 3200, change: -1.2, icon: 'Ξ' },
    { symbol: 'ADA', name: 'Cardano', price: 0.85, change: 0.8, icon: '₳' },
    { symbol: 'SOL', name: 'Solana', price: 120, change: 3.2, icon: '◎' },
    { symbol: 'DOT', name: 'Polkadot', price: 15.5, change: -0.5, icon: '●' }
  ]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  // Removed unused transaction fetching

  // Crypto price updates
  const updateCryptoPrices = useCallback(() => {
    setCryptoPrices(prev => prev.map(crypto => ({
      ...crypto,
      price: crypto.price * (1 + (Math.random() - 0.5) * 0.02), // ±1% change
      change: (Math.random() - 0.5) * 6 // -3% to +3% change
    })));
  }, []);

  useEffect(() => {
    const interval = setInterval(updateCryptoPrices, 5000);
    return () => clearInterval(interval);
  }, [updateCryptoPrices]);

  // Update trading balance
  const updateBalance = useCallback(async (amount: number, type: 'increase' | 'decrease') => {
    try {
      const newBalance = type === 'increase' 
        ? (user?.balance || 0) + amount 
        : (user?.balance || 0) - amount;
      
      // For now, just update locally since the backend endpoint might not exist
      // In a real implementation, this would sync with the backend
      updateUser({ balance: newBalance });
    } catch (error) {
      console.error('Error updating balance:', error);
    }
  }, [user?.balance, updateUser]);

  // Get available balance for trading
  const tradingBalance = user?.balance || 0;

  // Trading Simulator Functions
  const openRandomTrade = useCallback(() => {
    if (activeTrades.length >= 5 || tradingBalance < 50) {
      return; // Limit to 5 active trades and minimum balance
    }

    const crypto = cryptoPrices[Math.floor(Math.random() * cryptoPrices.length)];
    const amount = Math.min(
      50 + Math.random() * 200, // $50-$250
      tradingBalance * 0.1 // Max 10% of balance
    );
    
    const trade: Trade = {
      id: Date.now().toString(),
      symbol: crypto.symbol,
      quantity: amount / crypto.price,
      entryPrice: crypto.price,
      amount: amount,
      timestamp: new Date().toISOString()
    };

    setActiveTrades(prev => [...prev, trade]);
    updateBalance(amount, 'decrease');

    // Add simulation result
    const result: SimulationResult = {
      id: trade.id,
      type: 'opened',
      symbol: crypto.symbol,
      amount: amount,
      timestamp: new Date().toISOString()
    };
    setSimulationResults(prev => [...prev, result]);

    return trade;
  }, [activeTrades.length, tradingBalance, cryptoPrices, updateBalance]);

  const closeRandomTrade = useCallback(() => {
    if (activeTrades.length === 0) return;

    const tradeIndex = Math.floor(Math.random() * activeTrades.length);
    const trade = activeTrades[tradeIndex];
    const currentPrice = cryptoPrices.find(c => c.symbol === trade.symbol)?.price || trade.entryPrice;
    const profitLoss = (currentPrice - trade.entryPrice) * trade.quantity;
    const newBalance = trade.amount + profitLoss;

    // Remove trade from active trades
    setActiveTrades(prev => prev.filter((_, index) => index !== tradeIndex));
    
    // Update balance with the new amount
    updateBalance(newBalance, 'increase');

    // Add simulation result
    const result: SimulationResult = {
      id: trade.id + '_close',
      type: 'closed',
      symbol: trade.symbol,
      amount: trade.amount,
      profitLoss: profitLoss,
      timestamp: new Date().toISOString()
    };
    setSimulationResults(prev => [...prev, result]);

    return { trade, profitLoss };
  }, [activeTrades, cryptoPrices, updateBalance]);

  const startTradingSimulator = () => {
    if (simulationCount >= MAX_SIMULATIONS) {
      return;
    }
    setIsSimulatorRunning(true);
  };

  const stopTradingSimulator = () => {
    setIsSimulatorRunning(false);
  };

  // Simulation loop
  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (isSimulatorRunning && simulationCount < MAX_SIMULATIONS) {
      interval = setInterval(() => {
        setSimulationCount(prev => {
          if (prev >= MAX_SIMULATIONS) {
            setIsSimulatorRunning(false);
            return prev;
          }

          const shouldOpenTrade = Math.random() > 0.6 && activeTrades.length < 5;
          const shouldCloseTrade = Math.random() > 0.7 && activeTrades.length > 0;

          if (shouldOpenTrade) {
            setNewTradeAnimation('opening');
            setCurrentAction('🔍 Analizando mercado...');
            
            setTimeout(() => {
              const trade = openRandomTrade();
              if (trade) {
                setNewTradeAnimation('opened');
                setCurrentAction(`📈 Abriendo posición en ${trade.symbol} - ${formatCurrency(trade.amount)}`);
                
                setTimeout(() => {
                  setNewTradeAnimation('');
                  setCurrentAction('⚡ Monitoreando posiciones activas...');
                }, 2000);
              }
            }, 1500);
          } else if (shouldCloseTrade) {
            setNewTradeAnimation('closing');
            setCurrentAction('💰 Evaluando ganancias...');
            
            setTimeout(() => {
              const result = closeRandomTrade();
              if (result) {
                const isProfit = result.profitLoss >= 0;
                setNewTradeAnimation('closed');
                setCurrentAction(
                  isProfit 
                    ? `📈 Cerrando ${result.trade.symbol} con ganancia: +${formatCurrency(result.profitLoss)}`
                    : `📉 Cerrando ${result.trade.symbol} con pérdida: ${formatCurrency(result.profitLoss)}`
                );
                
                setTimeout(() => {
                  setNewTradeAnimation('');
                  setCurrentAction('🎯 Buscando nuevas oportunidades...');
                }, 2000);
              }
            }, 1500);
          } else {
            setCurrentAction('📊 Analizando tendencias del mercado...');
          }

          return prev + 1;
        });
      }, 3000);
    } else if (!isSimulatorRunning || simulationCount >= MAX_SIMULATIONS) {
      setIsSimulatorRunning(false);
      setCurrentAction('');
      setNewTradeAnimation('');
    }

    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [isSimulatorRunning, simulationCount, activeTrades.length, activeTrades, tradingBalance, updateCryptoPrices, openRandomTrade, closeRandomTrade]);

  // Auto-stop when reaching max simulations
  useEffect(() => {
    if (simulationCount >= MAX_SIMULATIONS) {
      setIsSimulatorRunning(false);
    }
  }, [simulationCount]);

  // Calculate total P&L and invested amount
  const totalInvested = activeTrades.reduce((sum, trade) => sum + trade.amount, 0);
  const totalProfitLoss = activeTrades.reduce((sum, trade) => {
    const currentPrice = cryptoPrices.find(c => c.symbol === trade.symbol)?.price || trade.entryPrice;
    return sum + (currentPrice - trade.entryPrice) * trade.quantity;
  }, 0);

  // Calculate account metrics
  // Note: totalProfit, totalLoss, and recentTransactions were removed as they were unused

  // Render different views based on activeView
  const renderMainContent = () => {
    switch (activeView) {
      case 'deposit':
        return <DepositPage />;
      case 'withdrawal':
        return <WithdrawalPage />;
      case 'settings':
        return <UserSettings />;
      case 'home':
      default:
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {/* Primary Balance Card */}
            <PrimaryBalanceCard />



            {/* Pending Requests */}
            <PendingRequestsWidget />

            {/* Trading Simulator - DISABLED */}
            {ENABLE_TRADING_SIMULATOR && (
            <div style={{
              background: 'white',
              borderRadius: '16px',
              padding: '1.5rem',
              boxShadow: '0 4px 6px rgba(0,0,0,0.05)'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <div>
                  <h3 style={{ margin: 0, color: '#1F2937' }}>Simulador de Trading</h3>
                  <div style={{ fontSize: '0.7rem', color: '#6B7280', marginTop: '0.25rem' }}>
                    {isSimulatorRunning ? '🔄 Gestión inteligente de posiciones' : '⏸️ Simulador pausado'}
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ 
                    color: simulationCount >= MAX_SIMULATIONS ? '#EF4444' : '#6B7280', 
                    fontSize: '0.9rem',
                    marginBottom: '0.25rem'
                  }}>
                    Operaciones: {simulationCount}/{MAX_SIMULATIONS}
                  </div>
                  <div style={{ 
                    fontSize: '0.7rem',
                    color: '#6B7280',
                    marginBottom: '0.25rem'
                  }}>
                    Activas: {activeTrades.length} | En trades: {formatCurrency(totalInvested)}
                  </div>
                  <div style={{ 
                    fontSize: '0.8rem',
                    color: totalProfitLoss >= 0 ? '#10B981' : '#EF4444',
                    fontWeight: '600'
                  }}>
                    P&L Total: {totalProfitLoss >= 0 ? '+' : ''}{formatCurrency(totalProfitLoss)}
                  </div>
                </div>
              </div>

              {/* Status Display */}
              {currentAction && (
                <div style={{
                  background: newTradeAnimation === 'opening' || newTradeAnimation === 'closing' 
                    ? '#FEF3C7' : newTradeAnimation === 'opened' 
                    ? '#D1FAE5' : newTradeAnimation === 'closed' 
                    ? (currentAction.includes('📈') ? '#D1FAE5' : '#FEE2E2')
                    : '#F3F4F6',
                  border: `1px solid ${
                    newTradeAnimation === 'opening' || newTradeAnimation === 'closing' 
                      ? '#F59E0B' : newTradeAnimation === 'opened' 
                      ? '#10B981' : newTradeAnimation === 'closed' 
                      ? (currentAction.includes('📈') ? '#10B981' : '#EF4444')
                      : '#D1D5DB'
                  }`,
                  borderRadius: '12px',
                  padding: '1rem',
                  marginBottom: '1rem',
                  fontSize: '0.9rem',
                  color: '#1F2937',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  transition: 'all 0.3s ease'
                }}>
                  {newTradeAnimation === 'opening' && <div className="spinner" />}
                  {newTradeAnimation === 'closing' && <div className="spinner" />}
                  {currentAction}
                </div>
              )}

              {/* Recent activity (last 5 simulation results) */}
              <div style={{ marginBottom: '1rem' }}>
                <h4 style={{ margin: '0 0 0.75rem 0', color: '#1F2937', fontSize: '1rem' }}>Actividad Reciente</h4>
                <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                  {simulationResults.slice(-5).reverse().map((result) => (
                    <div
                      key={result.id}
                      style={{
                        background: '#F9FAFB',
                        border: '1px solid #E5E7EB',
                        borderRadius: '8px',
                        padding: '0.75rem',
                        marginBottom: '0.5rem',
                        fontSize: '0.8rem'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
                        <span style={{ fontWeight: '600', color: '#1F2937' }}>
                          {result.type === 'opened' ? '📈 Posición Abierta' : '📉 Posición Cerrada'}
                        </span>
                        <span style={{ fontSize: '0.7rem', color: '#6B7280' }}>
                          {new Date(result.timestamp).toLocaleTimeString()}
                        </span>
                      </div>
                      <div style={{ color: '#6B7280' }}>
                        <strong>{result.symbol}</strong> - {formatCurrency(result.amount)}
                        {result.profitLoss !== undefined && (
                          <span style={{
                            color: result.profitLoss >= 0 ? '#10B981' : '#EF4444',
                            fontWeight: '600',
                            marginLeft: '0.5rem'
                          }}>
                            {result.profitLoss >= 0 ? '+' : ''}{formatCurrency(result.profitLoss)}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                  {simulationResults.length === 0 && (
                    <div style={{ textAlign: 'center', color: '#6B7280', padding: '1rem' }}>
                      No hay actividad aún
                    </div>
                  )}
                </div>
              </div>

              {/* Crypto List */}
              <div style={{ marginBottom: '1rem' }}>
                <h4 style={{ margin: '0 0 0.75rem 0', color: '#1F2937', fontSize: '1rem' }}>Mercado Crypto</h4>
                {cryptoPrices.map((crypto) => (
                  <div key={crypto.symbol} style={{
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center',
                    padding: '0.5rem 0',
                    borderBottom: '1px solid #F3F4F6'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <div style={{
                        width: '28px',
                        height: '28px',
                        borderRadius: '50%',
                        background: '#F3F4F6',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '1rem'
                      }}>
                        {crypto.icon}
                      </div>
                      <div>
                        <div style={{ fontWeight: '600', color: '#1F2937', fontSize: '0.9rem' }}>{crypto.name}</div>
                        <div style={{ fontSize: '0.7rem', color: '#6B7280' }}>{crypto.symbol}</div>
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontWeight: '600', color: '#1F2937', fontSize: '0.9rem' }}>
                        {formatCurrency(crypto.price)}
                      </div>
                      <div style={{ 
                        fontSize: '0.7rem', 
                        color: crypto.change >= 0 ? '#10B981' : '#EF4444',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.25rem',
                        justifyContent: 'flex-end'
                      }}>
                        {crypto.change >= 0 ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
                        {crypto.change >= 0 ? '+' : ''}{crypto.change.toFixed(1)}%
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Control Buttons */}
              <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
                <button
                  onClick={startTradingSimulator}
                  disabled={isSimulatorRunning || simulationCount >= MAX_SIMULATIONS}
                  style={{
                    background: isSimulatorRunning || simulationCount >= MAX_SIMULATIONS ? '#9CA3AF' : '#10B981',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '0.75rem 1rem',
                    fontSize: '0.8rem',
                    fontWeight: '600',
                    cursor: isSimulatorRunning || simulationCount >= MAX_SIMULATIONS ? 'not-allowed' : 'pointer'
                  }}
                >
                  {isSimulatorRunning ? 'Corriendo...' : 'Iniciar'}
                </button>
                <button
                  onClick={stopTradingSimulator}
                  disabled={!isSimulatorRunning}
                  style={{
                    background: !isSimulatorRunning ? '#9CA3AF' : '#EF4444',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '0.75rem 1rem',
                    fontSize: '0.8rem',
                    fontWeight: '600',
                    cursor: !isSimulatorRunning ? 'not-allowed' : 'pointer'
                  }}
                >
                  Detener
                </button>
              </div>

              {/* Active Trades Table */}
              {activeTrades.length > 0 && (
                <div style={{ marginBottom: '1rem' }}>
                  <h4 style={{ margin: '0 0 0.75rem 0', color: '#1F2937', fontSize: '1rem' }}>Posiciones Activas</h4>
                  <div style={{
                    background: '#F9FAFB',
                    border: '1px solid #E5E7EB',
                    borderRadius: '12px',
                    overflow: 'hidden'
                  }}>
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: '1fr 1fr 1fr 1fr 1fr',
                      padding: '0.75rem',
                      background: '#F3F4F6',
                      fontSize: '0.7rem',
                      fontWeight: '600',
                      color: '#6B7280',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em'
                    }}>
                      <div>Crypto</div>
                      <div>Inversión</div>
                      <div>Precio Entrada</div>
                      <div>Precio Actual</div>
                      <div>P&L</div>
                    </div>
                    {activeTrades.map((trade) => {
                      const currentPrice = cryptoPrices.find(c => c.symbol === trade.symbol)?.price || trade.entryPrice;
                      const profitLoss = (currentPrice - trade.entryPrice) * trade.quantity;
                      return (
                        <div
                          key={trade.id}
                          style={{
                            display: 'grid',
                            gridTemplateColumns: '1fr 1fr 1fr 1fr 1fr',
                            padding: '0.75rem',
                            borderBottom: '1px solid #E5E7EB',
                            fontSize: '0.8rem',
                            alignItems: 'center'
                          }}
                        >
                          <div style={{ fontWeight: '600', color: '#1F2937' }}>{trade.symbol}</div>
                          <div style={{ color: '#6B7280' }}>{formatCurrency(trade.amount)}</div>
                          <div style={{ color: '#6B7280' }}>{formatCurrency(trade.entryPrice)}</div>
                          <div style={{ color: '#6B7280' }}>{formatCurrency(currentPrice)}</div>
                          <div style={{
                            color: profitLoss >= 0 ? '#10B981' : '#EF4444',
                            fontWeight: '600'
                          }}>
                            {profitLoss >= 0 ? '+' : ''}{formatCurrency(profitLoss)}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
            )}

          </div>
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
          {user?.email?.charAt(0).toUpperCase() || 'U'}
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
        <UserSidebar activeView={activeView} onViewChange={setActiveView} />
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
                <UserSidebar 
                  activeView={activeView} 
                  onViewChange={(view) => {
                    setActiveView(view);
                    setIsMobileMenuOpen(false);
                  }} 
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
        paddingLeft: isMobile ? '0' : '280px', // Account for fixed sidebar width on desktop
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
                minWidth: 0 // Prevent flex item from overflowing
              }}>
                {renderMainContent()}
              </div>
              
              {/* Right Sidebar - Live Trading Feed - Only show on home view */}
              {activeView === 'home' && (
                <div style={{ 
                  width: isMobile ? '100%' : '400px'
                  // Remove order property - trading feed will show after main content on mobile
                }}>
                  {/* Live Trading Feed */}
                  <LiveTradingFeed />
                </div>
              )}
            </div>
          </LiveTradingProvider>
        </div>
      </div>
      
      {/* Floating Chat Bubble - Available on all views */}
      <FloatingChatBubble />
    </div>
  );
};

export default UserDashboard;