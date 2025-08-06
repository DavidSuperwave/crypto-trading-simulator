import React, { useState, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { ArrowLeft, CreditCard, Building, Bitcoin, Smartphone, CheckCircle, Clock, Shield, Phone } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

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

  // Get available balance (today's withdrawable amount)
  const availableBalance = user?.balance || 0;
  const dailyWithdrawalLimit = 50000; // $50,000 MXN daily limit
  const maxWithdrawable = Math.min(availableBalance, dailyWithdrawalLimit);

  // Handle withdrawal submission
  const handleWithdraw = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!withdrawAmount || parseFloat(withdrawAmount) <= 0 || !selectedMethod) return;

    setLoading(true);
    try {
      await axios.post('http://localhost:5001/api/user/withdraw', {
        amount: parseFloat(withdrawAmount),
        method: selectedMethod
      });

      // Update user data
      const profileRes = await axios.get('http://localhost:5001/api/user/profile');
      updateUser(profileRes.data);

      // Show confirmation but don't update user data immediately
      setShowConfirmation(true);
    } catch (error) {
      alert('Error en la solicitud de retiro. Inténtalo de nuevo.');
    } finally {
      setLoading(false);
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

            {/* Available Balance Card */}
            <div style={{
              background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
              borderRadius: '16px',
              padding: '1.5rem',
              marginBottom: '2rem',
              color: 'white'
            }}>
              <div style={{ fontSize: '0.9rem', opacity: 0.9, marginBottom: '0.5rem' }}>
                Balance disponible hoy:
              </div>
              <div style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>
                {formatCurrency(maxWithdrawable)}
              </div>
              <div style={{ fontSize: '0.8rem', opacity: 0.8 }}>
                Límite diario: {formatCurrency(dailyWithdrawalLimit)}
              </div>
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
                  max={maxWithdrawable}
                  value={withdrawAmount}
                  onChange={(e) => setWithdrawAmount(e.target.value)}
                  placeholder="Ej: 5,000"
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
                  Mínimo: $100 MXN | Máximo: {formatCurrency(maxWithdrawable)}
                </p>
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
                disabled={loading || !withdrawAmount || !selectedMethod || withdrawAmountNum < 100 || withdrawAmountNum > maxWithdrawable}
                style={{
                  width: '100%',
                  background: loading || !withdrawAmount || !selectedMethod || withdrawAmountNum < 100 || withdrawAmountNum > maxWithdrawable
                    ? '#9CA3AF' 
                    : 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '12px',
                  padding: '1rem',
                  fontSize: '1rem',
                  fontWeight: '600',
                  cursor: loading || !withdrawAmount || !selectedMethod || withdrawAmountNum < 100 || withdrawAmountNum > maxWithdrawable
                    ? 'not-allowed' 
                    : 'pointer',
                  boxShadow: '0 4px 20px rgba(16, 185, 129, 0.3)',
                  transition: 'all 0.2s'
                }}
              >
                {loading ? 'Procesando...' : `Retirar ${formatCurrency(withdrawAmountNum)}`}
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