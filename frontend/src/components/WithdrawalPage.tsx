import React, { useState, useCallback, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { ArrowLeft, CreditCard, Building, Bitcoin, Smartphone, CheckCircle, Clock, Shield, Phone } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { buildApiUrl, API_CONFIG } from '../config/api';
import { usePortfolioData } from '../hooks/usePortfolioData';

interface WithdrawalMethod {
  id: string;
  name: string;
  icon: React.ReactNode;
  description: string;
  processingTime: string;
  fees: string;
  requirements: string[];
  color: string;
}

const WithdrawalPage: React.FC = () => {
  const { user, updateUser } = useAuth();
  const navigate = useNavigate();
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [selectedMethod, setSelectedMethod] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  // Use centralized portfolio data hook
  const { portfolioData, loading: portfolioLoading } = usePortfolioData();
  const [showRiskWarning, setShowRiskWarning] = useState(false);
  const [confirmationText, setConfirmationText] = useState('');
  const [riskCalculations, setRiskCalculations] = useState<any>(null);

  // Currency formatter function
  const formatCurrency = useCallback((amount: number) => 
    `$${amount.toLocaleString('es-MX', { minimumFractionDigits: 2 })} MXN`, []
  );

  // Withdrawal methods configuration
  const withdrawalMethods: WithdrawalMethod[] = [
    {
      id: 'bank',
      name: 'Transferencia Bancaria',
      icon: <Building size={24} />,
      description: 'Transferencia directa a tu cuenta bancaria',
      processingTime: '1-3 días hábiles',
      fees: 'Sin comisión',
      requirements: [
        'CLABE interbancaria de 18 dígitos',
        'Nombre completo del titular',
        'Banco de destino',
        'Identificación oficial'
      ],
      color: '#3B82F6'
    },
    {
      id: 'oxxo',
      name: 'Retiro en OXXO',
      icon: <Smartphone size={24} />,
      description: 'Retira tu dinero en cualquier tienda OXXO',
      processingTime: '4-6 horas',
      fees: '$15 MXN por retiro',
      requirements: [
        'Teléfono móvil registrado',
        'Identificación oficial vigente',
        'Código de retiro por SMS',
        'Máximo $8,000 MXN por día'
      ],
      color: '#10B981'
    },
    {
      id: 'crypto',
      name: 'Criptomonedas',
      icon: <Bitcoin size={24} />,
      description: 'Recibe en Bitcoin, USDT o Ethereum',
      processingTime: '15-30 minutos',
      fees: 'Comisión de red',
      requirements: [
        'Wallet address válida',
        'Red blockchain seleccionada',
        'Mínimo $500 MXN',
        'Verificación de identidad'
      ],
      color: '#F59E0B'
    }
  ];

  // Portfolio data now managed by centralized usePortfolioData hook

  // Get available balance (20% of portfolio) and daily withdrawal limit
  const availableBalance = portfolioData?.availableBalance || 0;
  const lockedCapital = portfolioData?.lockedCapital || 0;
  const totalPortfolioValue = portfolioData?.totalPortfolioValue || 0;
  const dailyWithdrawalLimit = 50000; // $50,000 MXN daily limit
  const maxWithdrawable = Math.min(availableBalance, dailyWithdrawalLimit);

  // Calculate risk scenarios for large withdrawals
  const calculateRiskScenarios = useCallback((requestedAmount: number) => {
    if (!portfolioData) return null;

    const excessAmount = requestedAmount - availableBalance;
    const forceCloseAmount = Math.min(excessAmount, lockedCapital);
    
    // Estimate potential losses (up to 70% of forced closure amount)
    const potentialLoss = forceCloseAmount * 0.7;
    const bestCaseScenario = forceCloseAmount * 0.1; // 10% loss in best case
    const worstCaseScenario = forceCloseAmount * 0.7; // 70% loss in worst case
    
    // Calculate timeline for natural withdrawal (20% availability growth)
    // Assuming 8% monthly compound growth on total portfolio
    const monthlyGrowthRate = 0.08;
    const currentMonthlyAvailable = totalPortfolioValue * 0.2 * monthlyGrowthRate;
    const monthsToNaturalWithdrawal = Math.ceil(excessAmount / currentMonthlyAvailable);
    
    // Calculate best withdrawal date (end of current month when interest pays out)
    const today = new Date();
    const nextMonth = new Date(today.getFullYear(), today.getMonth() + 1, 1);
    const daysUntilNextMonth = Math.ceil((nextMonth.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    
    return {
      requestedAmount,
      availableNow: availableBalance,
      excessAmount,
      forceCloseAmount,
      potentialLoss: {
        best: bestCaseScenario,
        worst: worstCaseScenario,
        average: potentialLoss
      },
      timeline: {
        monthsToNaturalWithdrawal,
        daysUntilNextMonth,
        recommendedDate: nextMonth.toLocaleDateString('es-MX', { 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric' 
        })
      },
      netAmount: requestedAmount - potentialLoss, // What they'd actually receive after losses
      lossPercentage: (potentialLoss / requestedAmount) * 100
    };
  }, [portfolioData, availableBalance, lockedCapital, totalPortfolioValue]);

  // Handle withdrawal submission
  const handleWithdraw = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!withdrawAmount || parseFloat(withdrawAmount) <= 0 || !selectedMethod) return;

    const withdrawAmountNum = parseFloat(withdrawAmount);

    // Check if withdrawal exceeds available balance (20%)
    if (withdrawAmountNum > availableBalance) {
      const riskData = calculateRiskScenarios(withdrawAmountNum);
      setRiskCalculations(riskData);
      setShowRiskWarning(true);
      return;
    }

    // Proceed with normal withdrawal (within 20% limit)
    await processWithdrawal(withdrawAmountNum);
  };

  // Process the actual withdrawal (for both normal and forced withdrawals)
  const processWithdrawal = async (amount: number, isForced: boolean = false) => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        alert('Authentication required. Please log in again.');
        return;
      }

      await axios.post(buildApiUrl(API_CONFIG.ENDPOINTS.USER_WITHDRAW), {
        amount: amount,
        method: selectedMethod,
        isForced: isForced // Flag to indicate forced liquidation
      }, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      // Update user data
      const profileRes = await axios.get(buildApiUrl(API_CONFIG.ENDPOINTS.USER_PROFILE), {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      updateUser(profileRes.data);

      // Show confirmation
      setShowConfirmation(true);
      setShowRiskWarning(false);
      setConfirmationText('');
    } catch (error) {
      alert('Error en la solicitud de retiro. Inténtalo de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  // Handle forced withdrawal confirmation
  const handleForcedWithdrawal = () => {
    if (confirmationText.toLowerCase().trim() === 'quiero retirar') {
      processWithdrawal(parseFloat(withdrawAmount), true);
    } else {
      alert('Debes escribir exactamente "Quiero Retirar" para confirmar esta acción.');
    }
  };

  const withdrawAmountNum = parseFloat(withdrawAmount) || 0;
  const selectedMethodData = withdrawalMethods.find(m => m.id === selectedMethod);

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', padding: '2rem' }}>
      <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ marginBottom: '2rem' }}>
          <button
            onClick={() => navigate('/user')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              background: 'none',
              border: 'none',
              color: '#6B7280',
              cursor: 'pointer',
              fontSize: '0.9rem',
              marginBottom: '1rem'
            }}
          >
            <ArrowLeft size={16} />
            Volver al dashboard
          </button>
          
          <h1 style={{ 
            margin: 0, 
            color: '#1F2937', 
            fontSize: '2.5rem', 
            fontWeight: 'bold',
            marginBottom: '0.5rem'
          }}>
            Retirar Fondos
          </h1>
          <p style={{ 
            margin: 0, 
            color: '#6B7280', 
            fontSize: '1.1rem' 
          }}>
            Retira tu dinero de forma segura y rápida
          </p>
        </div>

        {/* Main Content */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: '400px 1fr', 
          gap: '3rem',
          alignItems: 'start'
        }}>
          
          {/* Left Side - Withdrawal Form */}
          <div style={{
            background: 'white',
            borderRadius: '20px',
            padding: '2rem',
            boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
            position: 'sticky',
            top: '2rem'
          }}>
            <div style={{ marginBottom: '2rem' }}>
              <h2 style={{ 
                margin: '0 0 0.5rem 0', 
                color: '#1F2937',
                fontSize: '1.5rem'
              }}>
                Cantidad a Retirar
              </h2>
              <p style={{ 
                margin: 0, 
                color: '#6B7280', 
                fontSize: '0.9rem' 
              }}>
                Selecciona el monto que deseas retirar
              </p>
            </div>

            {/* Portfolio Balance Breakdown */}
            <div style={{
              background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
              borderRadius: '16px',
              padding: '1.5rem',
              marginBottom: '2rem',
              color: 'white'
            }}>
              <div style={{ fontSize: '0.9rem', opacity: 0.9, marginBottom: '0.5rem' }}>
                Balance disponible para retiro:
              </div>
              <div style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '1rem' }}>
                {portfolioLoading ? 'Cargando...' : formatCurrency(maxWithdrawable)}
              </div>
              
              {!portfolioLoading && portfolioData && (
                <div style={{ fontSize: '0.8rem', opacity: 0.9 }}>
                  <div style={{ marginBottom: '0.5rem' }}>
                    📊 Portfolio total: {formatCurrency(totalPortfolioValue)}
                  </div>
                  <div style={{ marginBottom: '0.5rem' }}>
                    🔒 Capital bloqueado (80%): {formatCurrency(lockedCapital)}
                  </div>
                  <div style={{ marginBottom: '0.5rem' }}>
                    💰 Disponible (20%): {formatCurrency(availableBalance)}
                  </div>
                  <div style={{ opacity: 0.8 }}>
                    Límite diario: {formatCurrency(dailyWithdrawalLimit)}
                  </div>
                </div>
              )}
            </div>

            <form onSubmit={handleWithdraw}>
              <div style={{ marginBottom: '2rem' }}>
                <label style={{ 
                  display: 'block', 
                  marginBottom: '0.75rem', 
                  color: '#374151', 
                  fontWeight: '600',
                  fontSize: '0.9rem'
                }}>
                  Monto (MXN)
                </label>
                <input
                  type="number"
                  step="1"
                  min="100"
                  value={withdrawAmount}
                  onChange={(e) => setWithdrawAmount(e.target.value)}
                  placeholder="Ej: 5,000"
                  style={{
                    width: '100%',
                    padding: '1rem',
                    border: withdrawAmountNum > availableBalance 
                      ? '2px solid #F59E0B' 
                      : '2px solid #E5E7EB',
                    borderRadius: '12px',
                    fontSize: '1.1rem',
                    outline: 'none',
                    boxSizing: 'border-box',
                    fontWeight: '600'
                  }}
                />
                <div style={{ marginTop: '0.5rem' }}>
                  <p style={{ 
                    margin: '0 0 0.25rem 0', 
                    fontSize: '0.8rem', 
                    color: '#6B7280' 
                  }}>
                    Mínimo: $100 MXN
                  </p>
                  {withdrawAmountNum > availableBalance && (
                    <p style={{ 
                      margin: 0, 
                      fontSize: '0.8rem', 
                      color: '#F59E0B',
                      fontWeight: '600'
                    }}>
                      ⚠️ Excede balance disponible - Requiere liquidación forzada
                    </p>
                  )}
                  <p style={{ 
                    margin: '0.25rem 0 0 0', 
                    fontSize: '0.8rem', 
                    color: '#059669' 
                  }}>
                    💡 Disponible sin riesgo: {formatCurrency(availableBalance)}
                  </p>
                </div>
              </div>

              {/* Selected Method Summary */}
              {selectedMethod && selectedMethodData && (
                <div style={{
                  background: 'linear-gradient(135deg, #EBF8FF 0%, #DBEAFE 100%)',
                  borderRadius: '12px',
                  padding: '1rem',
                  marginBottom: '2rem',
                  border: '2px solid #BFDBFE'
                }}>
                  <h4 style={{ margin: '0 0 0.5rem 0', color: '#1E40AF' }}>
                    Método Seleccionado
                  </h4>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                    <div style={{ color: selectedMethodData.color }}>
                      {selectedMethodData.icon}
                    </div>
                    <div style={{ color: '#1F2937', fontWeight: '600' }}>
                      {selectedMethodData.name}
                    </div>
                  </div>
                  <div style={{ fontSize: '0.8rem', color: '#6B7280' }}>
                    Tiempo: {selectedMethodData.processingTime}
                  </div>
                  <div style={{ fontSize: '0.8rem', color: '#6B7280' }}>
                    Comisión: {selectedMethodData.fees}
                  </div>
                </div>
              )}

              {/* Withdraw Button */}
              <button
                type="submit"
                disabled={loading || portfolioLoading || !withdrawAmount || !selectedMethod || withdrawAmountNum < 100}
                style={{
                  width: '100%',
                  background: loading || portfolioLoading || !withdrawAmount || !selectedMethod || withdrawAmountNum < 100
                    ? '#9CA3AF' 
                    : withdrawAmountNum > availableBalance
                    ? 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)' // Orange for risky withdrawals
                    : 'linear-gradient(135deg, #10B981 0%, #059669 100%)', // Green for safe withdrawals
                  color: 'white',
                  border: 'none',
                  borderRadius: '12px',
                  padding: '1rem',
                  fontSize: '1rem',
                  fontWeight: '600',
                  cursor: loading || portfolioLoading || !withdrawAmount || !selectedMethod || withdrawAmountNum < 100
                    ? 'not-allowed' 
                    : 'pointer',
                  boxShadow: withdrawAmountNum > availableBalance
                    ? '0 4px 20px rgba(245, 158, 11, 0.3)'
                    : '0 4px 20px rgba(16, 185, 129, 0.3)',
                  transition: 'all 0.2s'
                }}
              >
                {loading ? 'Procesando...' : portfolioLoading ? 'Cargando datos...' : 
                 withdrawAmountNum > availableBalance ? 
                 `⚠️ Liquidación Forzada - ${formatCurrency(withdrawAmountNum)}` : 
                 `Retirar ${formatCurrency(withdrawAmountNum)}`}
              </button>
            </form>

            {/* Portfolio Information */}
            <div style={{
              marginTop: '2rem',
              padding: '1rem',
              background: '#EBF8FF',
              borderRadius: '8px',
              border: '1px solid #BFDBFE'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                <CreditCard size={16} style={{ color: '#3B82F6' }} />
                <span style={{ color: '#3B82F6', fontWeight: '600', fontSize: '0.9rem' }}>
                  Sistema de Portfolio Inteligente
                </span>
              </div>
              <p style={{ margin: 0, fontSize: '0.8rem', color: '#1E40AF' }}>
                El 80% de tu portfolio está optimizado para trading automático. Solo el 20% está disponible para retiro inmediato, maximizando tus ganancias potenciales.
              </p>
            </div>

            {/* Security Notice */}
            <div style={{
              marginTop: '1rem',
              padding: '1rem',
              background: '#F0FDF4',
              borderRadius: '8px',
              border: '1px solid #BBF7D0'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                <Shield size={16} style={{ color: '#059669' }} />
                <span style={{ color: '#059669', fontWeight: '600', fontSize: '0.9rem' }}>
                  Procesamiento Seguro
                </span>
              </div>
              <p style={{ margin: 0, fontSize: '0.8rem', color: '#065F46' }}>
                Todas las transacciones son verificadas y procesadas con los más altos estándares de seguridad.
              </p>
            </div>
          </div>

          {/* Right Side - Withdrawal Methods */}
          <div>
            <div style={{ marginBottom: '2rem' }}>
              <h2 style={{ 
                margin: '0 0 0.5rem 0', 
                color: '#1F2937',
                fontSize: '1.8rem'
              }}>
                Métodos de Retiro
              </h2>
              <p style={{ 
                margin: 0, 
                color: '#6B7280',
                fontSize: '1rem'
              }}>
                Elige cómo deseas recibir tu dinero
              </p>
            </div>

            <div style={{ 
              display: 'grid', 
              gap: '1.5rem'
            }}>
              {withdrawalMethods.map((method) => (
                <div
                  key={method.id}
                  onClick={() => setSelectedMethod(method.id)}
                  style={{
                    background: selectedMethod === method.id 
                      ? 'linear-gradient(135deg, #EBF8FF 0%, #DBEAFE 100%)'
                      : 'white',
                    borderRadius: '16px',
                    padding: '2rem',
                    boxShadow: selectedMethod === method.id 
                      ? '0 10px 30px rgba(59, 130, 246, 0.2)' 
                      : '0 4px 6px rgba(0,0,0,0.05)',
                    border: selectedMethod === method.id 
                      ? '2px solid #3B82F6' 
                      : '2px solid transparent',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    position: 'relative',
                    transform: selectedMethod === method.id ? 'translateY(-4px)' : 'translateY(0)'
                  }}
                >
                  {/* Selected Indicator */}
                  {selectedMethod === method.id && (
                    <div style={{
                      position: 'absolute',
                      top: '1rem',
                      right: '1rem',
                      color: '#3B82F6'
                    }}>
                      <CheckCircle size={24} />
                    </div>
                  )}

                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
                    <div style={{
                      width: '60px',
                      height: '60px',
                      borderRadius: '12px',
                      background: method.color,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'white'
                    }}>
                      {method.icon}
                    </div>
                    <div>
                      <h3 style={{ 
                        margin: '0 0 0.25rem 0', 
                        color: '#1F2937',
                        fontSize: '1.3rem'
                      }}>
                        {method.name}
                      </h3>
                      <p style={{ 
                        margin: 0, 
                        color: '#6B7280',
                        fontSize: '0.9rem'
                      }}>
                        {method.description}
                      </p>
                    </div>
                  </div>

                  {/* Method Details */}
                  <div style={{ 
                    display: 'grid', 
                    gridTemplateColumns: '1fr 1fr',
                    gap: '1rem',
                    marginBottom: '1.5rem'
                  }}>
                    <div style={{
                      background: '#F9FAFB',
                      borderRadius: '8px',
                      padding: '0.75rem',
                      textAlign: 'center'
                    }}>
                      <div style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center',
                        gap: '0.25rem',
                        marginBottom: '0.25rem'
                      }}>
                        <Clock size={14} style={{ color: method.color }} />
                        <span style={{ fontSize: '0.8rem', color: '#6B7280' }}>Tiempo</span>
                      </div>
                      <div style={{ fontWeight: 'bold', color: '#1F2937', fontSize: '0.9rem' }}>
                        {method.processingTime}
                      </div>
                    </div>
                    
                    <div style={{
                      background: '#F9FAFB',
                      borderRadius: '8px',
                      padding: '0.75rem',
                      textAlign: 'center'
                    }}>
                      <div style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center',
                        gap: '0.25rem',
                        marginBottom: '0.25rem'
                      }}>
                        <CreditCard size={14} style={{ color: method.color }} />
                        <span style={{ fontSize: '0.8rem', color: '#6B7280' }}>Comisión</span>
                      </div>
                      <div style={{ fontWeight: 'bold', color: '#1F2937', fontSize: '0.9rem' }}>
                        {method.fees}
                      </div>
                    </div>
                  </div>

                  {/* Requirements */}
                  <div>
                    <h4 style={{ 
                      margin: '0 0 0.75rem 0', 
                      color: '#1F2937',
                      fontSize: '0.9rem',
                      fontWeight: '600'
                    }}>
                      Requisitos:
                    </h4>
                    <ul style={{ 
                      margin: 0, 
                      padding: 0,
                      listStyle: 'none'
                    }}>
                      {method.requirements.map((requirement, index) => (
                        <li key={index} style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.5rem',
                          marginBottom: '0.5rem',
                          fontSize: '0.85rem',
                          color: '#374151'
                        }}>
                          <CheckCircle size={14} style={{ color: method.color }} />
                          {requirement}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Risk Warning Modal */}
        {showRiskWarning && riskCalculations && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.7)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '1rem'
          }}>
            <div style={{
              background: 'white',
              borderRadius: '20px',
              padding: '2rem',
              width: '600px',
              maxWidth: '90vw',
              maxHeight: '90vh',
              overflowY: 'auto'
            }}>
              {/* Warning Header */}
              <div style={{
                textAlign: 'center',
                marginBottom: '2rem'
              }}>
                <div style={{
                  width: '80px',
                  height: '80px',
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 1rem auto',
                  color: 'white',
                  fontSize: '2rem'
                }}>
                  ⚠️
                </div>
                <h2 style={{ 
                  margin: '0 0 0.5rem 0', 
                  color: '#DC2626',
                  fontSize: '1.8rem'
                }}>
                  ¡ADVERTENCIA DE LIQUIDACIÓN FORZADA!
                </h2>
                <p style={{ 
                  margin: 0, 
                  color: '#6B7280',
                  fontSize: '1rem'
                }}>
                  Esta acción puede resultar en pérdidas significativas
                </p>
              </div>

              {/* Risk Analysis */}
              <div style={{
                background: '#FEF3C7',
                borderRadius: '12px',
                padding: '1.5rem',
                marginBottom: '2rem',
                border: '2px solid #F59E0B'
              }}>
                <h3 style={{ margin: '0 0 1rem 0', color: '#92400E' }}>
                  💰 Análisis de Riesgo
                </h3>
                
                <div style={{ marginBottom: '1rem' }}>
                  <div style={{ fontSize: '0.9rem', color: '#92400E', marginBottom: '0.5rem' }}>
                    Monto solicitado: <strong>{formatCurrency(riskCalculations.requestedAmount)}</strong>
                  </div>
                  <div style={{ fontSize: '0.9rem', color: '#92400E', marginBottom: '0.5rem' }}>
                    Disponible ahora (20%): <strong>{formatCurrency(riskCalculations.availableNow)}</strong>
                  </div>
                  <div style={{ fontSize: '0.9rem', color: '#DC2626', fontWeight: 'bold' }}>
                    Requiere liquidación forzada: <strong>{formatCurrency(riskCalculations.excessAmount)}</strong>
                  </div>
                </div>

                <div style={{
                  background: '#FECACA',
                  borderRadius: '8px',
                  padding: '1rem',
                  marginBottom: '1rem'
                }}>
                  <div style={{ fontSize: '0.9rem', color: '#7F1D1D', marginBottom: '0.5rem' }}>
                    <strong>Pérdidas Estimadas por Liquidación Forzada:</strong>
                  </div>
                  <div style={{ fontSize: '0.85rem', color: '#7F1D1D' }}>
                    • Mejor escenario: -{formatCurrency(riskCalculations.potentialLoss.best)} (10%)
                  </div>
                  <div style={{ fontSize: '0.85rem', color: '#7F1D1D' }}>
                    • Escenario promedio: -{formatCurrency(riskCalculations.potentialLoss.average)} (70%)
                  </div>
                  <div style={{ fontSize: '0.85rem', color: '#7F1D1D' }}>
                    • Peor escenario: -{formatCurrency(riskCalculations.potentialLoss.worst)} (70%)
                  </div>
                </div>

                <div style={{
                  background: '#DBEAFE',
                  borderRadius: '8px',
                  padding: '1rem'
                }}>
                  <div style={{ fontSize: '0.9rem', color: '#1E40AF', fontWeight: 'bold' }}>
                    Recibirías aproximadamente: {formatCurrency(riskCalculations.netAmount)}
                  </div>
                  <div style={{ fontSize: '0.8rem', color: '#1E40AF' }}>
                    (Pérdida estimada: {riskCalculations.lossPercentage.toFixed(1)}% del monto total)
                  </div>
                </div>
              </div>

              {/* Alternative Timeline */}
              <div style={{
                background: '#F0FDF4',
                borderRadius: '12px',
                padding: '1.5rem',
                marginBottom: '2rem',
                border: '2px solid #10B981'
              }}>
                <h3 style={{ margin: '0 0 1rem 0', color: '#065F46' }}>
                  📅 Alternativa Recomendada (Sin Pérdidas)
                </h3>
                
                <div style={{ marginBottom: '1rem' }}>
                  <div style={{ fontSize: '0.9rem', color: '#065F46', marginBottom: '0.5rem' }}>
                    <strong>Espera al crecimiento natural de tu portfolio:</strong>
                  </div>
                  <div style={{ fontSize: '0.85rem', color: '#065F46' }}>
                    • En {riskCalculations.timeline.monthsToNaturalWithdrawal} mes(es), tendrás suficiente balance disponible
                  </div>
                  <div style={{ fontSize: '0.85rem', color: '#065F46' }}>
                    • Mejor fecha para retirar: <strong>{riskCalculations.timeline.recommendedDate}</strong>
                  </div>
                  <div style={{ fontSize: '0.85rem', color: '#065F46' }}>
                    • Solo faltan {riskCalculations.timeline.daysUntilNextMonth} días para el próximo pago de intereses
                  </div>
                </div>

                <div style={{
                  background: '#DCFCE7',
                  borderRadius: '8px',
                  padding: '1rem'
                }}>
                  <div style={{ fontSize: '0.9rem', color: '#065F46', fontWeight: 'bold' }}>
                    💡 Recomendación: Espera y retira el monto completo sin pérdidas
                  </div>
                </div>
              </div>

              {/* Confirmation Input */}
              <div style={{
                background: '#FEF2F2',
                borderRadius: '12px',
                padding: '1.5rem',
                marginBottom: '2rem',
                border: '2px solid #DC2626'
              }}>
                <h3 style={{ margin: '0 0 1rem 0', color: '#7F1D1D' }}>
                  ⚠️ Confirmación Requerida
                </h3>
                <p style={{ 
                  margin: '0 0 1rem 0', 
                  fontSize: '0.9rem', 
                  color: '#7F1D1D' 
                }}>
                  Si decides continuar con esta liquidación riesgosa, escribe exactamente:
                </p>
                <div style={{
                  background: '#FCA5A5',
                  borderRadius: '8px',
                  padding: '0.75rem',
                  marginBottom: '1rem',
                  textAlign: 'center',
                  fontWeight: 'bold',
                  color: '#7F1D1D'
                }}>
                  "Quiero Retirar"
                </div>
                <input
                  type="text"
                  value={confirmationText}
                  onChange={(e) => setConfirmationText(e.target.value)}
                  placeholder="Escribe exactamente: Quiero Retirar"
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '2px solid #DC2626',
                    borderRadius: '8px',
                    fontSize: '1rem',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              {/* Action Buttons */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '1rem'
              }}>
                <button
                  onClick={() => {
                    setShowRiskWarning(false);
                    setConfirmationText('');
                  }}
                  style={{
                    background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '12px',
                    padding: '1rem',
                    fontSize: '1rem',
                    fontWeight: '600',
                    cursor: 'pointer'
                  }}
                >
                  ✅ Cancelar (Recomendado)
                </button>
                
                <button
                  onClick={handleForcedWithdrawal}
                  disabled={confirmationText.toLowerCase().trim() !== 'quiero retirar'}
                  style={{
                    background: confirmationText.toLowerCase().trim() === 'quiero retirar'
                      ? 'linear-gradient(135deg, #DC2626 0%, #991B1B 100%)'
                      : '#9CA3AF',
                    color: 'white',
                    border: 'none',
                    borderRadius: '12px',
                    padding: '1rem',
                    fontSize: '1rem',
                    fontWeight: '600',
                    cursor: confirmationText.toLowerCase().trim() === 'quiero retirar' 
                      ? 'pointer' 
                      : 'not-allowed'
                  }}
                >
                  ⚠️ Proceder con Riesgo
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Confirmation Modal */}
        {showConfirmation && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000
          }}>
            <div style={{
              background: 'white',
              borderRadius: '20px',
              padding: '3rem',
              width: '500px',
              maxWidth: '90vw',
              textAlign: 'center'
            }}>
              <div style={{
                width: '80px',
                height: '80px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 2rem auto',
                color: 'white'
              }}>
                <CheckCircle size={40} />
              </div>

              <h2 style={{ 
                margin: '0 0 1rem 0', 
                color: '#1F2937',
                fontSize: '1.8rem'
              }}>
                ¡Solicitud de Retiro Enviada!
              </h2>

              <p style={{ 
                margin: '0 0 2rem 0', 
                color: '#6B7280',
                fontSize: '1.1rem',
                lineHeight: '1.6'
              }}>
                Tu solicitud de retiro por <strong>{formatCurrency(withdrawAmountNum)}</strong> ha sido procesada exitosamente.
              </p>

              <div style={{
                background: '#F0FDF4',
                borderRadius: '12px',
                padding: '1.5rem',
                marginBottom: '2rem',
                border: '1px solid #BBF7D0'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                  <Clock size={20} style={{ color: '#059669' }} />
                  <span style={{ color: '#059669', fontWeight: '600', fontSize: '1.1rem' }}>
                    Tiempo de Procesamiento
                  </span>
                </div>
                <p style={{ margin: '0 0 1rem 0', fontSize: '1rem', color: '#065F46' }}>
                  <strong>Tus fondos serán enviados en 5-7 días hábiles</strong>
                </p>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                  <Phone size={16} style={{ color: '#059669' }} />
                  <span style={{ fontSize: '0.9rem', color: '#065F46' }}>
                    Tu asesor personal se contactará contigo pronto para verificar tu información y proceder con la transferencia.
                  </span>
                </div>
              </div>

              <button
                onClick={() => {
                  setShowConfirmation(false);
                  navigate('/user');
                }}
                style={{
                  width: '100%',
                  background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '12px',
                  padding: '1rem',
                  fontSize: '1rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                  boxShadow: '0 4px 20px rgba(16, 185, 129, 0.3)'
                }}
              >
                Volver al Dashboard
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default WithdrawalPage;