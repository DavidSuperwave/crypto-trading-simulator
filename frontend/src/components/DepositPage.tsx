import React, { useState, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { ArrowLeft, TrendingUp, Star, Shield, CheckCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface InvestmentPlan {
  id: string;
  name: string;
  minAmount: number;
  maxTrades: number;
  returnMultiplier: number;
  features: string[];
  badge?: string;
  badgeColor?: string;
  highlight?: boolean;
}

const DepositPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [depositAmount, setDepositAmount] = useState('');
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);

  // Currency formatter function
  const formatCurrency = useCallback((amount: number) => 
    `$${amount.toLocaleString('es-MX', { minimumFractionDigits: 2 })} MXN`, []
  );

  // Investment plans configuration
  const investmentPlans: InvestmentPlan[] = [
    {
      id: 'starter',
      name: 'Plan Starter',
      minAmount: 2500,
      maxTrades: 8,
      returnMultiplier: 1.2,
      features: [
        'Hasta 8 operaciones simultáneas',
        '20% más rentabilidad',
        'Soporte por email estándar',
        'Señales básicas de trading',
        'Retiros en 3-5 días hábiles',
        'Comisión del 1% por transacción'
      ]
    },
    {
      id: 'growth',
      name: 'Plan Growth',
      minAmount: 5000,
      maxTrades: 15,
      returnMultiplier: 1.5,
      features: [
        'Hasta 15 operaciones simultáneas',
        '50% más rentabilidad',
        'Soporte prioritario por email',
        'Señales avanzadas con IA',
        'Retiros en 1-2 días hábiles',
        '🎁 Bono del 10% en tu depósito',
        'Análisis de mercado mensual',
        'Comisión reducida del 0.75%'
      ],
      badge: 'Popular',
      badgeColor: '#10B981',
      highlight: true
    },
    {
      id: 'elite',
      name: 'Plan Elite',
      minAmount: 10000,
      maxTrades: 999,
      returnMultiplier: 2.0,
      features: [
        '🚀 Operaciones ilimitadas',
        '💎 100% más rentabilidad',
        '👨‍💼 Asesor personal dedicado',
        '⚡ Señales premium en tiempo real',
        '💸 Retiros instantáneos (24/7)',
        '🎁 Bono del 20% en tu depósito',
        '📊 Análisis de mercado diario',
        '🛡️ Seguro de protección incluido',
        '🌟 Acceso VIP a nuevas funciones',
        '💰 Comisión premium del 0.5%'
      ],
      badge: 'VIP',
      badgeColor: '#8B5CF6'
    }
  ];

  // Get current plan based on user's balance
  const getCurrentPlan = () => {
    const balance = user?.balance || 0;
    // Find the highest plan the user qualifies for based on their balance
    return [...investmentPlans]
      .reverse() // Start from highest plan
      .find(plan => balance >= plan.minAmount) || investmentPlans[0];
  };

  // Get next available plan for upgrade
  const getNextPlan = () => {
    const currentPlan = getCurrentPlan();
    const currentIndex = investmentPlans.findIndex(plan => plan.id === currentPlan.id);
    return currentIndex < investmentPlans.length - 1 ? investmentPlans[currentIndex + 1] : null;
  };

  // Get plans to display (current + next upgrade option)
  const getDisplayPlans = () => {
    const currentPlan = getCurrentPlan();
    const nextPlan = getNextPlan();
    const plans = [currentPlan];
    if (nextPlan) plans.push(nextPlan);
    return plans;
  };

  // Handle deposit - navigate to payment method selection
  const handleDeposit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!depositAmount || parseFloat(depositAmount) <= 0 || !selectedPlan) return;

    const selectedPlanData = investmentPlans.find(p => p.id === selectedPlan);
    
    // Navigate to payment method selection with deposit data
    navigate('/payment-method', {
      state: {
        amount: parseFloat(depositAmount),
        plan: selectedPlan,
        planName: selectedPlanData?.name || 'Plan Starter'
      }
    });
  };

  const depositAmountNum = parseFloat(depositAmount) || 0;
  const currentPlan = getCurrentPlan();
  const nextPlan = getNextPlan();
  const displayPlans = getDisplayPlans();

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
            Depositar Fondos
          </h1>
          <p style={{ 
            margin: 0, 
            color: '#6B7280', 
            fontSize: '1.1rem' 
          }}>
            Elige tu plan de inversión y maximiza tus ganancias
          </p>
        </div>

        {/* Main Content */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: '400px 1fr', 
          gap: '3rem',
          alignItems: 'start'
        }}>
          
          {/* Left Side - Deposit Form */}
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
                Cantidad a Depositar
              </h2>
              <p style={{ 
                margin: 0, 
                color: '#6B7280', 
                fontSize: '0.9rem' 
              }}>
                Ingresa el monto que deseas invertir
              </p>
            </div>

            <form onSubmit={handleDeposit}>
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
                  min="2500"
                  value={depositAmount}
                  onChange={(e) => setDepositAmount(e.target.value)}
                  placeholder="Ej: 10,000"
                  style={{
                    width: '100%',
                    padding: '1rem',
                    border: '2px solid #E5E7EB',
                    borderRadius: '12px',
                    fontSize: '1.1rem',
                    outline: 'none',
                    boxSizing: 'border-box',
                    fontWeight: '600'
                  }}
                />
                <p style={{ 
                  margin: '0.5rem 0 0 0', 
                  fontSize: '0.8rem', 
                  color: '#6B7280' 
                }}>
                  Mínimo: {formatCurrency(2500)}
                </p>
              </div>

              {/* Current Balance */}
              <div style={{
                background: '#F9FAFB',
                borderRadius: '12px',
                padding: '1rem',
                marginBottom: '2rem'
              }}>
                <div style={{ fontSize: '0.9rem', color: '#6B7280', marginBottom: '0.25rem' }}>
                  Tu balance actual:
                </div>
                <div style={{ fontSize: '1.3rem', fontWeight: 'bold', color: '#1F2937' }}>
                  {formatCurrency(user?.balance || 0)}
                </div>
              </div>

              {/* Selected Plan Summary */}
              {selectedPlan && (
                <div style={{
                  background: 'linear-gradient(135deg, #EBF8FF 0%, #DBEAFE 100%)',
                  borderRadius: '12px',
                  padding: '1rem',
                  marginBottom: '2rem',
                  border: '2px solid #BFDBFE'
                }}>
                  <h4 style={{ margin: '0 0 0.5rem 0', color: '#1E40AF' }}>
                    Plan Seleccionado
                  </h4>
                  <div style={{ color: '#1F2937', fontWeight: '600' }}>
                    {investmentPlans.find(p => p.id === selectedPlan)?.name}
                  </div>
                </div>
              )}

              {/* Deposit Button */}
              <button
                type="submit"
                disabled={!depositAmount || !selectedPlan || depositAmountNum < 2500}
                style={{
                  width: '100%',
                  background: !depositAmount || !selectedPlan || depositAmountNum < 2500 
                    ? '#9CA3AF' 
                    : 'linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '12px',
                  padding: '1rem',
                  fontSize: '1rem',
                  fontWeight: '600',
                  cursor: !depositAmount || !selectedPlan || depositAmountNum < 2500 
                    ? 'not-allowed' 
                    : 'pointer',
                  boxShadow: '0 4px 20px rgba(79, 70, 229, 0.3)',
                  transition: 'all 0.2s'
                }}
              >
                Continuar al Pago → {formatCurrency(depositAmountNum)}
              </button>
            </form>

            {/* Security Notice */}
            <div style={{
              marginTop: '2rem',
              padding: '1rem',
              background: '#F0FDF4',
              borderRadius: '8px',
              border: '1px solid #BBF7D0'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                <Shield size={16} style={{ color: '#059669' }} />
                <span style={{ color: '#059669', fontWeight: '600', fontSize: '0.9rem' }}>
                  100% Seguro
                </span>
              </div>
              <p style={{ margin: 0, fontSize: '0.8rem', color: '#065F46' }}>
                Tus fondos están protegidos con encriptación bancaria y respaldo legal completo.
              </p>
            </div>
          </div>

          {/* Right Side - Investment Plans */}
          <div>
            {/* Current Plan Status */}
            <div style={{
              background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
              borderRadius: '16px',
              padding: '1.5rem',
              marginBottom: '2rem',
              color: 'white',
              textAlign: 'center'
            }}>
              <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.2rem' }}>
                🎯 Tu Plan Actual
              </h3>
              <div style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>
                {currentPlan.name}
              </div>
              <div style={{ fontSize: '0.9rem', opacity: 0.9 }}>
                Balance actual: {formatCurrency(user?.balance || 0)}
              </div>
            </div>

            {/* Earnings Potential Calculator */}
            {depositAmountNum >= 2500 && (
              <div style={{
                background: 'linear-gradient(135deg, #1E40AF 0%, #3B82F6 100%)',
                borderRadius: '16px',
                padding: '1.5rem',
                marginBottom: '2rem',
                color: 'white',
                textAlign: 'center'
              }}>
                <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.2rem' }}>
                  💰 Potencial de Ganancias en 30 días
                </h3>
                <div style={{ 
                  display: 'grid', 
                  gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
                  gap: '1rem'
                }}>
                  {displayPlans.map((plan) => {
                    const monthlyReturn = (depositAmountNum * plan.returnMultiplier * 0.08); // 8% base monthly return
                    const isCurrent = plan.id === currentPlan.id;
                    return (
                      <div key={plan.id} style={{
                        background: isCurrent ? 'rgba(16, 185, 129, 0.3)' : 'rgba(255,255,255,0.2)',
                        borderRadius: '8px',
                        padding: '1rem'
                      }}>
                        <div style={{ fontSize: '0.8rem', marginBottom: '0.25rem' }}>
                          {plan.name} {isCurrent && '(Actual)'}
                        </div>
                        <div style={{ fontSize: '1.1rem', fontWeight: 'bold' }}>
                          +{formatCurrency(monthlyReturn)}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            <div style={{ marginBottom: '2rem' }}>
              <h2 style={{ 
                margin: '0 0 0.5rem 0', 
                color: '#1F2937',
                fontSize: '1.8rem'
              }}>
                {nextPlan ? 'Mejora tu Plan' : 'Tu Plan Premium'}
              </h2>
              <p style={{ 
                margin: 0, 
                color: '#6B7280',
                fontSize: '1rem'
              }}>
                {nextPlan 
                  ? `Deposita más para acceder al ${nextPlan.name} y obtener mejores beneficios`
                  : 'Ya tienes acceso al plan más premium disponible'
                }
              </p>
            </div>

            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: nextPlan ? 'repeat(auto-fit, minmax(300px, 1fr))' : '1fr',
              gap: '1.5rem'
            }}>
              {displayPlans.map((plan) => {
                const isSelected = selectedPlan === plan.id;
                const isCurrent = plan.id === currentPlan.id;
                const isUpgrade = plan.id === nextPlan?.id;
                return (
                  <div
                    key={plan.id}
                    onClick={() => setSelectedPlan(plan.id)}
                    style={{
                      background: isSelected 
                        ? 'linear-gradient(135deg, #EBF8FF 0%, #DBEAFE 100%)'
                        : isCurrent
                        ? 'linear-gradient(135deg, #F0FDF4 0%, #DCFCE7 100%)'
                        : 'white',
                      borderRadius: '16px',
                      padding: '1.5rem',
                      boxShadow: isSelected 
                        ? '0 10px 30px rgba(59, 130, 246, 0.2)' 
                        : '0 4px 6px rgba(0,0,0,0.05)',
                      border: isSelected 
                        ? '2px solid #3B82F6' 
                        : isCurrent
                        ? '2px solid #10B981'
                        : plan.highlight 
                        ? '2px solid #10B981'
                        : '2px solid transparent',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      position: 'relative',
                      transform: isSelected ? 'translateY(-4px)' : 'translateY(0)'
                    }}
                  >
                    {/* Status Badge */}
                    {isCurrent && (
                      <div style={{
                        position: 'absolute',
                        top: '-8px',
                        left: '1.5rem',
                        background: '#10B981',
                        color: 'white',
                        padding: '0.25rem 0.75rem',
                        borderRadius: '20px',
                        fontSize: '0.7rem',
                        fontWeight: '600'
                      }}>
                        Tu Plan Actual
                      </div>
                    )}
                    
                    {isUpgrade && (
                      <div style={{
                        position: 'absolute',
                        top: '-8px',
                        left: '1.5rem',
                        background: '#F59E0B',
                        color: 'white',
                        padding: '0.25rem 0.75rem',
                        borderRadius: '20px',
                        fontSize: '0.7rem',
                        fontWeight: '600'
                      }}>
                        Siguiente Nivel
                      </div>
                    )}

                    {/* Plan Badge */}
                    {plan.badge && !isCurrent && !isUpgrade && (
                      <div style={{
                        position: 'absolute',
                        top: '-8px',
                        left: '1.5rem',
                        background: plan.badgeColor,
                        color: 'white',
                        padding: '0.25rem 0.75rem',
                        borderRadius: '20px',
                        fontSize: '0.7rem',
                        fontWeight: '600'
                      }}>
                        {plan.badge}
                      </div>
                    )}

                    {/* Selected Indicator */}
                    {isSelected && (
                      <div style={{
                        position: 'absolute',
                        top: '1rem',
                        right: '1rem',
                        color: '#3B82F6'
                      }}>
                        <CheckCircle size={24} />
                      </div>
                    )}

                    <div style={{ marginBottom: '1rem' }}>
                      <h3 style={{ 
                        margin: '0 0 0.5rem 0', 
                        color: '#1F2937',
                        fontSize: '1.3rem'
                      }}>
                        {plan.name}
                      </h3>
                      <p style={{ 
                        margin: 0, 
                        color: '#6B7280',
                        fontSize: '0.9rem'
                      }}>
                        Desde {formatCurrency(plan.minAmount)}
                      </p>
                    </div>

                    {/* Key Stats */}
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
                          <TrendingUp size={14} style={{ color: '#059669' }} />
                          <span style={{ fontSize: '0.8rem', color: '#6B7280' }}>Trades</span>
                        </div>
                        <div style={{ fontWeight: 'bold', color: '#1F2937' }}>
                          {plan.maxTrades === 999 ? 'Ilimitado' : `Hasta ${plan.maxTrades}`}
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
                          <Star size={14} style={{ color: '#F59E0B' }} />
                          <span style={{ fontSize: '0.8rem', color: '#6B7280' }}>Rentabilidad</span>
                        </div>
                        <div style={{ fontWeight: 'bold', color: '#1F2937' }}>
                          +{Math.round((plan.returnMultiplier - 1) * 100)}%
                        </div>
                      </div>
                    </div>

                    {/* Features */}
                    <div>
                      <h4 style={{ 
                        margin: '0 0 0.75rem 0', 
                        color: '#1F2937',
                        fontSize: '0.9rem',
                        fontWeight: '600'
                      }}>
                        Características:
                      </h4>
                      <ul style={{ 
                        margin: 0, 
                        padding: 0,
                        listStyle: 'none'
                      }}>
                        {plan.features.map((feature, index) => (
                          <li key={index} style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            marginBottom: '0.5rem',
                            fontSize: '0.85rem',
                            color: '#374151'
                          }}>
                            <CheckCircle size={14} style={{ color: '#10B981' }} />
                            {feature}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DepositPage;