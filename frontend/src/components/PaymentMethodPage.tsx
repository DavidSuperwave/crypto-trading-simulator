import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { ArrowLeft, Building, Smartphone, CreditCard, CheckCircle, Copy, Clock, Shield } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';

interface PaymentMethod {
  id: string;
  name: string;
  icon: React.ReactNode;
  description: string;
  processingTime: string;
  fees: string;
  color: string;
  enabled: boolean;
  comingSoon?: boolean;
}

interface LocationState {
  amount: number;
  plan: string;
  planName: string;
}

const PaymentMethodPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [selectedMethod, setSelectedMethod] = useState<string | null>(null);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [loading, setLoading] = useState(false);

  const state = location.state as LocationState;
  
  // Redirect if no deposit data
  if (!state || !state.amount || !state.plan) {
    navigate('/deposit');
    return null;
  }

  const { amount, plan, planName } = state;

  // Currency formatter function
  const formatCurrency = (amount: number) => 
    `$${amount.toLocaleString('es-MX', { minimumFractionDigits: 2 })} MXN`;

  // Payment methods configuration
  const paymentMethods: PaymentMethod[] = [
    {
      id: 'bank_transfer',
      name: 'Transferencia Bancaria',
      icon: <Building size={32} />,
      description: 'Transfiere directamente desde tu banco',
      processingTime: '15 minutos - 2 horas',
      fees: 'Sin comisión',
      color: '#3B82F6',
      enabled: true
    },
    {
      id: 'oxxo',
      name: 'Depósito en OXXO',
      icon: <Smartphone size={32} />,
      description: 'Deposita en efectivo en cualquier OXXO',
      processingTime: '30 minutos - 4 horas',
      fees: '$12 MXN',
      color: '#10B981',
      enabled: true
    },
    {
      id: 'card',
      name: 'Tarjeta de Crédito/Débito',
      icon: <CreditCard size={32} />,
      description: 'Pago instantáneo con tarjeta',
      processingTime: 'Instantáneo',
      fees: '3.5%',
      color: '#9CA3AF',
      enabled: false,
      comingSoon: true
    }
  ];

  const selectedMethodData = paymentMethods.find(m => m.id === selectedMethod);

  const getPaymentDetails = (method: string) => {
    switch (method) {
      case 'bank_transfer':
        return {
          title: 'Datos para Transferencia Bancaria',
          details: [
            { label: 'Banco', value: 'BBVA México' },
            { label: 'Titular', value: 'Altura Capital SAPI de CV' },
            { label: 'CLABE', value: '012180001234567890' },
            { label: 'Número de Cuenta', value: '0123456789' },
            { label: 'Concepto', value: `Depósito ${user?.email?.split('@')[0]} - ${amount}` }
          ],
          instructions: [
            'Realiza la transferencia por el monto exacto',
            'Usa el concepto proporcionado para identificar tu depósito',
            'El dinero estará disponible una vez confirmemos la transferencia',
            'Conserva tu comprobante de transferencia'
          ]
        };
      case 'oxxo':
        return {
          title: 'Instrucciones para Depósito en OXXO',
          details: [
            { label: 'Código de Referencia', value: `ALT${Date.now().toString().slice(-8)}` },
            { label: 'Monto a Depositar', value: formatCurrency(amount + 12) },
            { label: 'Concepto', value: 'Altura Capital - Depósito' },
            { label: 'Vigencia', value: '48 horas' }
          ],
          instructions: [
            'Ve a cualquier tienda OXXO con el código de referencia',
            'Solicita realizar un depósito bancario',
            'Proporciona el código y deposita el monto exacto (incluye comisión)',
            'Conserva tu ticket como comprobante'
          ]
        };
      default:
        return null;
    }
  };

  const handleConfirmDeposit = async () => {
    if (!selectedMethod) return;

    setLoading(true);
    try {
      await axios.post('http://localhost:5001/api/user/deposit', {
        amount: amount,
        plan: plan,
        method: selectedMethod
      });

      // Navigate back to dashboard with success
      navigate('/user', { 
        state: { 
          message: 'Solicitud de depósito enviada. Realizando verificación de pago...' 
        }
      });
    } catch (error) {
      alert('Error al enviar la solicitud de depósito. Inténtalo de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  if (showConfirmation && selectedMethodData) {
    const paymentDetails = getPaymentDetails(selectedMethod!);
    
    return (
      <div style={{ minHeight: '100vh', background: '#f8fafc', padding: '2rem' }}>
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
          {/* Header */}
          <div style={{ marginBottom: '2rem' }}>
            <button
              onClick={() => setShowConfirmation(false)}
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
              Cambiar método de pago
            </button>
            
            <h1 style={{ 
              margin: 0, 
              color: '#1F2937', 
              fontSize: '2.5rem', 
              fontWeight: 'bold',
              marginBottom: '0.5rem'
            }}>
              Confirmar Depósito
            </h1>
            <p style={{ 
              margin: 0, 
              color: '#6B7280', 
              fontSize: '1.1rem' 
            }}>
              Realiza tu pago con los siguientes datos
            </p>
          </div>

          <div style={{
            background: 'white',
            borderRadius: '20px',
            padding: '2rem',
            boxShadow: '0 10px 25px rgba(0,0,0,0.1)'
          }}>
            {/* Order Summary */}
            <div style={{
              background: 'linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%)',
              borderRadius: '16px',
              padding: '2rem',
              marginBottom: '2rem',
              color: 'white'
            }}>
              <h2 style={{ margin: '0 0 1rem 0', fontSize: '1.5rem' }}>
                Resumen de tu Depósito
              </h2>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <div style={{ fontSize: '0.9rem', opacity: 0.9 }}>Monto</div>
                  <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>
                    {formatCurrency(amount)}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '0.9rem', opacity: 0.9 }}>Plan</div>
                  <div style={{ fontSize: '1.1rem', fontWeight: '600' }}>
                    {planName}
                  </div>
                </div>
              </div>
            </div>

            {/* Payment Method */}
            <div style={{ marginBottom: '2rem' }}>
              <h3 style={{ margin: '0 0 1rem 0', color: '#1F2937' }}>
                Método de Pago Seleccionado
              </h3>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '1rem',
                padding: '1rem',
                background: '#F9FAFB',
                borderRadius: '12px',
                border: '2px solid #E5E7EB'
              }}>
                <div style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '12px',
                  background: selectedMethodData.color,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white'
                }}>
                  {selectedMethodData.icon}
                </div>
                <div>
                  <div style={{ fontWeight: '600', color: '#1F2937' }}>
                    {selectedMethodData.name}
                  </div>
                  <div style={{ fontSize: '0.9rem', color: '#6B7280' }}>
                    {selectedMethodData.description}
                  </div>
                </div>
              </div>
            </div>

            {/* Payment Details */}
            {paymentDetails && (
              <div style={{ marginBottom: '2rem' }}>
                <h3 style={{ margin: '0 0 1rem 0', color: '#1F2937' }}>
                  {paymentDetails.title}
                </h3>
                
                <div style={{
                  background: '#F0FDF4',
                  borderRadius: '12px',
                  padding: '1.5rem',
                  marginBottom: '1.5rem',
                  border: '1px solid #BBF7D0'
                }}>
                  {paymentDetails.details.map((detail, index) => (
                    <div 
                      key={index}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '0.75rem 0',
                        borderBottom: index < paymentDetails.details.length - 1 ? '1px solid #D1FAE5' : 'none'
                      }}
                    >
                      <span style={{ color: '#065F46', fontWeight: '500' }}>
                        {detail.label}:
                      </span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={{ color: '#1F2937', fontWeight: '600' }}>
                          {detail.value}
                        </span>
                        <button
                          onClick={() => navigator.clipboard.writeText(detail.value)}
                          style={{
                            background: 'none',
                            border: 'none',
                            color: '#059669',
                            cursor: 'pointer',
                            padding: '0.25rem'
                          }}
                        >
                          <Copy size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                <div style={{
                  background: '#FEF3C7',
                  borderRadius: '12px',
                  padding: '1rem',
                  border: '1px solid #F59E0B'
                }}>
                  <h4 style={{ margin: '0 0 0.75rem 0', color: '#92400E' }}>
                    Instrucciones:
                  </h4>
                  <ol style={{ margin: 0, paddingLeft: '1.25rem', color: '#92400E' }}>
                    {paymentDetails.instructions.map((instruction, index) => (
                      <li key={index} style={{ marginBottom: '0.5rem' }}>
                        {instruction}
                      </li>
                    ))}
                  </ol>
                </div>
              </div>
            )}

            {/* Confirmation Checkbox */}
            <div style={{
              background: '#F9FAFB',
              borderRadius: '12px',
              padding: '1.5rem',
              marginBottom: '2rem'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                <Shield size={24} style={{ color: '#10B981' }} />
                <h4 style={{ margin: 0, color: '#1F2937' }}>
                  Confirma tu Depósito
                </h4>
              </div>
              <p style={{ margin: '0 0 1rem 0', color: '#6B7280', fontSize: '0.9rem' }}>
                Una vez que realices el pago, confirma aquí para que nuestro equipo pueda verificar tu depósito. 
                Los fondos estarán disponibles en tu cuenta una vez confirmemos el pago.
              </p>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#6B7280', fontSize: '0.8rem' }}>
                <Clock size={16} style={{ color: '#F59E0B' }} />
                Tiempo de verificación: {selectedMethodData.processingTime}
              </div>
            </div>

            {/* Action Buttons */}
            <div style={{ display: 'flex', gap: '1rem' }}>
              <button
                onClick={() => setShowConfirmation(false)}
                style={{
                  flex: 1,
                  background: '#F3F4F6',
                  color: '#374151',
                  border: 'none',
                  borderRadius: '12px',
                  padding: '1rem',
                  fontSize: '1rem',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                Cambiar Método
              </button>
              <button
                onClick={handleConfirmDeposit}
                disabled={loading}
                style={{
                  flex: 2,
                  background: loading 
                    ? '#9CA3AF' 
                    : 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '12px',
                  padding: '1rem',
                  fontSize: '1rem',
                  fontWeight: '600',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  boxShadow: '0 4px 20px rgba(16, 185, 129, 0.3)'
                }}
              >
                {loading ? 'Enviando...' : '✅ He realizado el pago'}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', padding: '2rem' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ marginBottom: '2rem' }}>
          <button
            onClick={() => navigate('/deposit')}
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
            Volver al depósito
          </button>
          
          <h1 style={{ 
            margin: 0, 
            color: '#1F2937', 
            fontSize: '2.5rem', 
            fontWeight: 'bold',
            marginBottom: '0.5rem'
          }}>
            Selecciona tu Método de Pago
          </h1>
          <p style={{ 
            margin: 0, 
            color: '#6B7280', 
            fontSize: '1.1rem' 
          }}>
            Elige cómo deseas realizar tu depósito de {formatCurrency(amount)}
          </p>
        </div>

        {/* Deposit Summary */}
        <div style={{
          background: 'linear-gradient(135deg, #EBF8FF 0%, #DBEAFE 100%)',
          borderRadius: '16px',
          padding: '1.5rem',
          marginBottom: '2rem',
          border: '2px solid #BFDBFE'
        }}>
          <h3 style={{ margin: '0 0 1rem 0', color: '#1E40AF' }}>
            Resumen de tu Depósito
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <div style={{ fontSize: '0.9rem', color: '#6B7280' }}>Monto a Depositar</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#1F2937' }}>
                {formatCurrency(amount)}
              </div>
            </div>
            <div>
              <div style={{ fontSize: '0.9rem', color: '#6B7280' }}>Plan Seleccionado</div>
              <div style={{ fontSize: '1.1rem', fontWeight: '600', color: '#1F2937' }}>
                {planName}
              </div>
            </div>
          </div>
        </div>

        {/* Payment Methods */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))',
          gap: '1.5rem',
          marginBottom: '2rem'
        }}>
          {paymentMethods.map((method) => (
            <div
              key={method.id}
              onClick={() => method.enabled && setSelectedMethod(method.id)}
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
                cursor: method.enabled ? 'pointer' : 'not-allowed',
                transition: 'all 0.2s',
                position: 'relative',
                opacity: method.enabled ? 1 : 0.6,
                transform: selectedMethod === method.id ? 'translateY(-4px)' : 'translateY(0)'
              }}
            >
              {/* Coming Soon Badge */}
              {method.comingSoon && (
                <div style={{
                  position: 'absolute',
                  top: '1rem',
                  right: '1rem',
                  background: '#F59E0B',
                  color: 'white',
                  padding: '0.25rem 0.75rem',
                  borderRadius: '20px',
                  fontSize: '0.7rem',
                  fontWeight: '600'
                }}>
                  Próximamente
                </div>
              )}

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
                  background: method.enabled ? method.color : '#9CA3AF',
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
                marginBottom: '1rem'
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

              {method.comingSoon && (
                <div style={{
                  textAlign: 'center',
                  padding: '0.75rem',
                  background: '#FEF3C7',
                  borderRadius: '8px',
                  fontSize: '0.8rem',
                  color: '#92400E'
                }}>
                  Esta opción estará disponible muy pronto
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Continue Button */}
        {selectedMethod && (
          <div style={{ textAlign: 'center' }}>
            <button
              onClick={() => setShowConfirmation(true)}
              style={{
                background: 'linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%)',
                color: 'white',
                border: 'none',
                borderRadius: '12px',
                padding: '1rem 2rem',
                fontSize: '1rem',
                fontWeight: '600',
                cursor: 'pointer',
                boxShadow: '0 4px 20px rgba(79, 70, 229, 0.3)',
                animation: 'fadeIn 0.3s ease-in-out'
              }}
            >
              Continuar con {paymentMethods.find(m => m.id === selectedMethod)?.name}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default PaymentMethodPage;