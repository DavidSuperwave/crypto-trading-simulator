import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import DepositPage from './DepositPage';
import WithdrawalPage from './WithdrawalPage';
import UserSettings from './UserSettings';
import ChatWidget from './ChatWidget';
import PendingRequestsWidget from './PendingRequestsWidget';
import UserSidebar from './UserSidebar';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { buildApiUrl, API_CONFIG } from '../config/api';
import { useRealTimeNotifications } from '../hooks/useRealTimeNotifications';
import ConnectionStatus from './ConnectionStatus';

interface Transaction {
  id: string;
  type: 'deposit' | 'withdrawal' | 'interest' | 'trade_profit' | 'trade_loss';
  amount: number;
  status: 'completed' | 'pending' | 'failed';
  timestamp: string;
  description: string;
}

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

const UserDashboard: React.FC = () => {
  const { user, updateUser } = useAuth();
  const [activeView, setActiveView] = useState('home');

  // Real-time notifications for user updates
  const { isConnected, connectionStatus } = useRealTimeNotifications({
    onDepositStatusUpdate: (deposit) => {
      console.log('💰 Deposit status update:', deposit);
      
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
      console.log('💸 Withdrawal status update:', withdrawal);
      
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
  const [transactionHistory, setTransactionHistory] = useState<Transaction[]>([]);
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

  // Load initial data
  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          console.log('No auth token found, skipping transactions fetch');
          return;
        }

        const response = await fetch(buildApiUrl(API_CONFIG.ENDPOINTS.USER_TRANSACTIONS), {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        if (response.ok) {
          const data = await response.json();
          setTransactionHistory(data);
        }
      } catch (error) {
        console.error('Error fetching transactions:', error);
      }
    };

    fetchTransactions();
  }, []);

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
  const updateBalance = async (amount: number, type: 'increase' | 'decrease') => {
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
  };

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
  }, [activeTrades.length, tradingBalance, cryptoPrices]);

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
  }, [activeTrades, cryptoPrices]);

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
            {/* Main Balance Card */}
            <div style={{
              background: 'linear-gradient(180deg, #4285F4 0%, #1565C0 100%)',
              borderRadius: '24px',
              padding: '2.5rem',
              color: 'white',
              position: 'relative',
              overflow: 'hidden'
            }}>
              <div style={{ position: 'relative', zIndex: 2 }}>
                <p style={{ margin: '0 0 0.5rem 0', fontSize: '1rem', opacity: 0.9 }}>
                  Tu balance actual:
                </p>
                <h2 style={{ 
                  margin: '0 0 1.5rem 0', 
                  fontSize: '3rem', 
                  fontWeight: '700',
                  textShadow: '0 2px 4px rgba(0,0,0,0.1)'
                }}>
                  {formatCurrency(user?.balance || 0)}
                </h2>
                <div style={{
                  display: 'flex',
                  gap: '1.5rem',
                  alignItems: 'center',
                  flexWrap: 'wrap'
                }}>
                  <div>
                    <p style={{ margin: '0 0 0.25rem 0', fontSize: '0.9rem', opacity: 0.8 }}>Balance Disponible:</p>
                    <p style={{ margin: 0, fontSize: '1.3rem', fontWeight: '600' }}>
                      {formatCurrency(tradingBalance)}
                    </p>
                  </div>
                  <div>
                    <p style={{ margin: '0 0 0.25rem 0', fontSize: '0.9rem', opacity: 0.8 }}>En Posiciones:</p>
                    <p style={{ margin: 0, fontSize: '1.3rem', fontWeight: '600' }}>
                      {formatCurrency(totalInvested)}
                    </p>
                  </div>
                  <div>
                    <p style={{ margin: '0 0 0.25rem 0', fontSize: '0.9rem', opacity: 0.8 }}>P&L Total:</p>
                    <p style={{ 
                      margin: 0, 
                      fontSize: '1.3rem', 
                      fontWeight: '600',
                      color: totalProfitLoss >= 0 ? '#4ADE80' : '#F87171'
                    }}>
                      {totalProfitLoss >= 0 ? '+' : ''}{formatCurrency(totalProfitLoss)}
                    </p>
                  </div>
                </div>
              </div>

              {/* AI Trader Status Indicator */}
              <div style={{
                position: 'absolute',
                top: '1rem',
                right: '1rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                background: 'rgba(0, 0, 0, 0.2)',
                padding: '0.5rem 1rem',
                borderRadius: '20px',
                zIndex: 3
              }}>
                <div style={{
                  width: '8px',
                  height: '8px',
                  backgroundColor: '#10B981',
                  borderRadius: '50%',
                  animation: 'pulse 2s infinite'
                }} />
                <span style={{
                  fontSize: '0.8rem',
                  fontWeight: '500',
                  color: 'white'
                }}>
                  AI Trader Activo
                </span>
              </div>
              
              {/* Decorative Elements */}
              <div style={{
                position: 'absolute',
                top: '-50px',
                right: '-50px',
                width: '200px',
                height: '200px',
                background: 'rgba(255,255,255,0.1)',
                borderRadius: '50%',
                zIndex: 1
              }} />
              <div style={{
                position: 'absolute',
                bottom: '-30px',
                left: '-30px',
                width: '120px',
                height: '120px',
                background: 'rgba(255,255,255,0.05)',
                borderRadius: '50%',
                zIndex: 1
              }} />
            </div>

            {/* Pending Requests */}
            <PendingRequestsWidget />

            {/* Trading Simulator */}
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


          </div>
        );
    }
  };

  return (
    <div style={{
      display: 'flex',
      minHeight: '100vh',
      fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    }}>
      {/* Sidebar */}
      <UserSidebar activeView={activeView} onViewChange={setActiveView} />
      
      {/* Main Content Area */}
      <div style={{
        flex: 1,
        background: '#F8FAFC',
        minHeight: '100vh',
        paddingLeft: '280px' // Account for fixed sidebar width
      }}>
        <div style={{
          padding: '2rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '2rem'
        }}>
          {/* Connection Status */}
          {activeView === 'home' && (
            <div style={{ 
              display: 'flex', 
              justifyContent: 'flex-end',
              marginBottom: '1rem'
            }}>
              <ConnectionStatus 
                isConnected={isConnected} 
                connectionStatus={connectionStatus}
                className="mr-4"
              />
            </div>
          )}
          
          {/* Content Area */}
          <div style={{
            display: 'flex',
            gap: '2rem'
          }}>
            {/* Main Content */}
            <div style={{ flex: 1 }}>
              {renderMainContent()}
            </div>
            
            {/* Chat Widget - Only show on home view */}
            {activeView === 'home' && (
              <div style={{ width: '350px' }}>
                <ChatWidget />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserDashboard;