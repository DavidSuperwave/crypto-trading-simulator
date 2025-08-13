import React, { useState } from 'react';
import { User, Lock, Mail, Shield, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useSimulationData } from '../hooks/useSimulationData';
import axios from 'axios';
import { buildApiUrl, API_CONFIG } from '../config/api';

const UserSettings: React.FC = () => {
  const { user } = useAuth();
  const { simulationData } = useSimulationData();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  // Form states
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setMessage({ type: 'error', text: 'Las contraseñas nuevas no coinciden' });
      return;
    }

    if (passwordForm.newPassword.length < 6) {
      setMessage({ type: 'error', text: 'La nueva contraseña debe tener al menos 6 caracteres' });
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setMessage({ type: 'error', text: 'Authentication required. Please log in again.' });
        return;
      }

      await axios.put(buildApiUrl(API_CONFIG.ENDPOINTS.USER_CHANGE_PASSWORD), {
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword
      }, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      setMessage({ type: 'success', text: 'Contraseña actualizada exitosamente' });
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      
      // Clear message after 3 seconds
      setTimeout(() => setMessage(null), 3000);
    } catch (error: any) {
      setMessage({ 
        type: 'error', 
        text: error.response?.data?.error || 'Error al cambiar la contraseña' 
      });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setPasswordForm(prev => ({ ...prev, [field]: value }));
    // Clear any existing message when user starts typing
    if (message) setMessage(null);
  };

  return (
    <div style={{
      maxWidth: '800px',
      margin: '0 auto',
      padding: '2rem'
    }}>
      {/* Header */}
      <div style={{
        marginBottom: '2rem'
      }}>
        <h1 style={{
          fontSize: '2rem',
          fontWeight: '700',
          color: '#1F2937',
          margin: '0 0 0.5rem 0',
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem'
        }}>
          <User size={28} color="#4F46E5" />
          Configuración de Cuenta
        </h1>
        <p style={{
          color: '#6B7280',
          margin: 0,
          fontSize: '1rem'
        }}>
          Gestiona tu información personal y configuración de seguridad
        </p>
      </div>

      {/* User Information Card */}
      <div style={{
        background: 'white',
        borderRadius: '16px',
        padding: '2rem',
        marginBottom: '2rem',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
        border: '1px solid #E5E7EB'
      }}>
        <h2 style={{
          fontSize: '1.25rem',
          fontWeight: '600',
          color: '#1F2937',
          margin: '0 0 1.5rem 0',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem'
        }}>
          <Shield size={20} color="#4F46E5" />
          Información Personal
        </h2>

        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '1.5rem'
        }}>
          {/* Email */}
          <div>
            <label style={{
              display: 'block',
              fontSize: '0.875rem',
              fontWeight: '500',
              color: '#374151',
              marginBottom: '0.5rem'
            }}>
              Correo Electrónico
            </label>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              padding: '0.75rem 1rem',
              background: '#F9FAFB',
              border: '1px solid #E5E7EB',
              borderRadius: '8px'
            }}>
              <Mail size={18} color="#6B7280" />
              <span style={{ color: '#1F2937', fontWeight: '500' }}>
                {user?.email || 'No disponible'}
              </span>
            </div>
          </div>

          {/* Account Type */}
          <div>
            <label style={{
              display: 'block',
              fontSize: '0.875rem',
              fontWeight: '500',
              color: '#374151',
              marginBottom: '0.5rem'
            }}>
              Tipo de Cuenta
            </label>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              padding: '0.75rem 1rem',
              background: '#F9FAFB',
              border: '1px solid #E5E7EB',
              borderRadius: '8px'
            }}>
              <User size={18} color="#6B7280" />
              <span style={{ 
                color: '#1F2937', 
                fontWeight: '500',
                textTransform: 'capitalize'
              }}>
                {user?.role || 'Usuario'}
              </span>
            </div>
          </div>

          {/* Enhanced Balance Information */}
          <div>
            <label style={{
              display: 'block',
              fontSize: '0.875rem',
              fontWeight: '500',
              color: '#374151',
              marginBottom: '0.5rem'
            }}>
              Portfolio Balance
            </label>
            
            {/* Total Balance */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              padding: '0.75rem 1rem',
              background: 'linear-gradient(135deg, #EBF8FF 0%, #DBEAFE 100%)',
              border: '1px solid #BFDBFE',
              borderRadius: '8px',
              marginBottom: '0.5rem'
            }}>
              <span style={{ fontSize: '1.25rem' }}>💼</span>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.875rem', color: '#6B7280' }}>Total Balance</span>
                  <span style={{ 
                    color: '#1E40AF', 
                    fontWeight: '700',
                    fontSize: '1.125rem'
                  }}>
                    ${((simulationData?.user?.depositedAmount || 0) + (simulationData?.user?.simulatedInterest || 0))?.toLocaleString('en-US', { minimumFractionDigits: 2 }) || user?.balance?.toLocaleString('en-US', { minimumFractionDigits: 2 }) || '0.00'}
                  </span>
                </div>
              </div>
            </div>

            {/* Breakdown if simulation data available */}
            {(simulationData?.user?.simulatedInterest !== undefined || simulationData?.user?.depositedAmount !== undefined) && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                {/* Deposited Amount */}
                <div style={{
                  padding: '0.75rem',
                  background: '#F9FAFB',
                  border: '1px solid #E5E7EB',
                  borderRadius: '8px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                    <span style={{ fontSize: '1rem' }}>💰</span>
                    <span style={{ fontSize: '0.75rem', color: '#6B7280', fontWeight: '500' }}>Deposited</span>
                  </div>
                  <span style={{ 
                    color: '#374151', 
                    fontWeight: '600',
                    fontSize: '0.875rem'
                  }}>
                    ${simulationData?.user?.depositedAmount?.toLocaleString('en-US', { minimumFractionDigits: 2 }) || '0.00'}
                  </span>
                </div>

                {/* AI Earnings */}
                <div style={{
                  padding: '0.75rem',
                  background: (simulationData?.user?.simulatedInterest || 0) > 0 ? '#F0FDF4' : '#F9FAFB',
                  border: `1px solid ${(simulationData?.user?.simulatedInterest || 0) > 0 ? '#BBF7D0' : '#E5E7EB'}`,
                  borderRadius: '8px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                    <span style={{ fontSize: '1rem' }}>🤖</span>
                    <span style={{ fontSize: '0.75rem', color: '#6B7280', fontWeight: '500' }}>AI Earned</span>
                  </div>
                  <span style={{ 
                    color: (simulationData?.user?.simulatedInterest || 0) > 0 ? '#16A34A' : '#374151', 
                    fontWeight: '600',
                    fontSize: '0.875rem'
                  }}>
                    ${simulationData?.user?.simulatedInterest?.toLocaleString('en-US', { minimumFractionDigits: 2 }) || '0.00'}
                  </span>
                </div>
              </div>
            )}

            {/* ROI Display */}
            {(simulationData?.user?.depositedAmount && simulationData?.user?.simulatedInterest && simulationData.user.depositedAmount > 0) && (
              <div style={{
                marginTop: '0.5rem',
                padding: '0.5rem 0.75rem',
                background: 'linear-gradient(135deg, #F0FDF4 0%, #DCFCE7 100%)',
                border: '1px solid #BBF7D0',
                borderRadius: '6px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <span style={{ fontSize: '0.75rem', color: '#15803D', fontWeight: '500' }}>
                  Return on Investment:
                </span>
                <span style={{ 
                  color: '#16A34A', 
                  fontWeight: '700',
                  fontSize: '0.875rem'
                }}>
                  +{((simulationData.user.simulatedInterest / simulationData.user.depositedAmount) * 100).toFixed(2)}%
                </span>
              </div>
            )}
          </div>

          {/* Account Created */}
          <div>
            <label style={{
              display: 'block',
              fontSize: '0.875rem',
              fontWeight: '500',
              color: '#374151',
              marginBottom: '0.5rem'
            }}>
              Cuenta Creada
            </label>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              padding: '0.75rem 1rem',
              background: '#F9FAFB',
              border: '1px solid #E5E7EB',
              borderRadius: '8px'
            }}>
              <span style={{ color: '#1F2937', fontWeight: '500' }}>
                {new Date().toLocaleDateString('es-MX')}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Password Change Card */}
      <div style={{
        background: 'white',
        borderRadius: '16px',
        padding: '2rem',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
        border: '1px solid #E5E7EB'
      }}>
        <h2 style={{
          fontSize: '1.25rem',
          fontWeight: '600',
          color: '#1F2937',
          margin: '0 0 1.5rem 0',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem'
        }}>
          <Lock size={20} color="#4F46E5" />
          Cambiar Contraseña
        </h2>

        {/* Message Display */}
        {message && (
          <div style={{
            padding: '0.75rem 1rem',
            borderRadius: '8px',
            marginBottom: '1.5rem',
            background: message.type === 'success' 
              ? 'linear-gradient(135deg, #ECFDF5 0%, #F0FDF4 100%)'
              : 'linear-gradient(135deg, #FEF2F2 0%, #FEF7F7 100%)',
            border: `1px solid ${message.type === 'success' ? '#BBF7D0' : '#FECACA'}`,
            color: message.type === 'success' ? '#065F46' : '#991B1B'
          }}>
            {message.text}
          </div>
        )}

        <form onSubmit={handlePasswordChange} style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '1.5rem'
        }}>
          {/* Current Password */}
          <div>
            <label style={{
              display: 'block',
              fontSize: '0.875rem',
              fontWeight: '500',
              color: '#374151',
              marginBottom: '0.5rem'
            }}>
              Contraseña Actual
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type={showPassword ? 'text' : 'password'}
                value={passwordForm.currentPassword}
                onChange={(e) => handleInputChange('currentPassword', e.target.value)}
                required
                style={{
                  width: '100%',
                  padding: '0.75rem 3rem 0.75rem 1rem',
                  border: '1px solid #D1D5DB',
                  borderRadius: '8px',
                  fontSize: '0.9rem',
                  outline: 'none',
                  transition: 'border-color 0.2s',
                  boxSizing: 'border-box'
                }}
                onFocus={(e) => e.target.style.borderColor = '#4F46E5'}
                onBlur={(e) => e.target.style.borderColor = '#D1D5DB'}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute',
                  right: '0.75rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: '#6B7280'
                }}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {/* New Password */}
          <div>
            <label style={{
              display: 'block',
              fontSize: '0.875rem',
              fontWeight: '500',
              color: '#374151',
              marginBottom: '0.5rem'
            }}>
              Nueva Contraseña
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type={showNewPassword ? 'text' : 'password'}
                value={passwordForm.newPassword}
                onChange={(e) => handleInputChange('newPassword', e.target.value)}
                required
                minLength={6}
                style={{
                  width: '100%',
                  padding: '0.75rem 3rem 0.75rem 1rem',
                  border: '1px solid #D1D5DB',
                  borderRadius: '8px',
                  fontSize: '0.9rem',
                  outline: 'none',
                  transition: 'border-color 0.2s',
                  boxSizing: 'border-box'
                }}
                onFocus={(e) => e.target.style.borderColor = '#4F46E5'}
                onBlur={(e) => e.target.style.borderColor = '#D1D5DB'}
              />
              <button
                type="button"
                onClick={() => setShowNewPassword(!showNewPassword)}
                style={{
                  position: 'absolute',
                  right: '0.75rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: '#6B7280'
                }}
              >
                {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {/* Confirm Password */}
          <div>
            <label style={{
              display: 'block',
              fontSize: '0.875rem',
              fontWeight: '500',
              color: '#374151',
              marginBottom: '0.5rem'
            }}>
              Confirmar Nueva Contraseña
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                value={passwordForm.confirmPassword}
                onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                required
                style={{
                  width: '100%',
                  padding: '0.75rem 3rem 0.75rem 1rem',
                  border: '1px solid #D1D5DB',
                  borderRadius: '8px',
                  fontSize: '0.9rem',
                  outline: 'none',
                  transition: 'border-color 0.2s',
                  boxSizing: 'border-box'
                }}
                onFocus={(e) => e.target.style.borderColor = '#4F46E5'}
                onBlur={(e) => e.target.style.borderColor = '#D1D5DB'}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                style={{
                  position: 'absolute',
                  right: '0.75rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: '#6B7280'
                }}
              >
                {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading || !passwordForm.currentPassword || !passwordForm.newPassword || !passwordForm.confirmPassword}
            style={{
              background: loading 
                ? '#9CA3AF' 
                : 'linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%)',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              padding: '0.875rem 1.5rem',
              fontSize: '0.9rem',
              fontWeight: '600',
              cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              alignSelf: 'flex-start'
            }}
          >
            <Lock size={18} />
            {loading ? 'Actualizando...' : 'Cambiar Contraseña'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default UserSettings;