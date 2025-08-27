import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Eye, EyeOff } from 'lucide-react';

const CFELoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const userData = await login(email, password);
      if (userData) {
        setTimeout(() => {
          if (userData.role === 'admin') {
            navigate('/admin');
          } else {
            navigate('/user');
          }
        }, 100);
      } else {
        setError('Credenciales inválidas');
      }
    } catch (err) {
      setError('Error de conexión. Intente nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)',
      display: 'flex',
      flexDirection: 'column',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    }}>

      {/* Main Content */}
      <div style={{
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '40px 24px'
      }}>
        <div style={{
          background: '#ffffff',
          borderRadius: '12px',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
          padding: '48px',
          width: '100%',
          maxWidth: '400px'
        }}>
          {/* Client Logo Section */}
          <div style={{
            textAlign: 'center',
            marginBottom: '32px',
            paddingBottom: '24px',
            borderBottom: '1px solid #e5e7eb'
          }}>
            {/* CFE Logo */}
            <img 
              src="/cfe-logo-official.png" 
              alt="CFE Logo"
              style={{
                width: '140px',
                height: '70px',
                objectFit: 'contain',
                margin: '0 auto 16px auto',
                display: 'block'
              }}
            />
            <div style={{
              fontSize: '16px',
              color: '#374151',
              fontWeight: '600'
            }}>
              Iniciar Sesión
            </div>
            <div style={{
              fontSize: '14px',
              color: '#6b7280',
              marginTop: '4px'
            }}>
              Accede a tu cuenta
            </div>
          </div>

          {/* Login Form */}
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {/* Email Field */}
            <div>
              <label style={{
                display: 'block',
                marginBottom: '8px',
                fontSize: '14px',
                fontWeight: '600',
                color: '#374151',
                textTransform: 'uppercase'
              }}>
                USUARIO:
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '1px solid #d1d5db',
                  borderRadius: '4px',
                  fontSize: '14px',
                  outline: 'none',
                  transition: 'border-color 0.2s',
                  boxSizing: 'border-box'
                }}
                onFocus={(e) => e.target.style.borderColor = '#059669'}
                onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
                required
              />
            </div>

            {/* Password Field */}
            <div>
              <label style={{
                display: 'block',
                marginBottom: '8px',
                fontSize: '14px',
                fontWeight: '600',
                color: '#374151',
                textTransform: 'uppercase'
              }}>
                CONTRASEÑA:
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '12px 40px 12px 12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '4px',
                    fontSize: '14px',
                    outline: 'none',
                    transition: 'border-color 0.2s',
                    boxSizing: 'border-box'
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#059669'}
                  onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: 'absolute',
                    right: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: '#6b7280'
                  }}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div style={{
                background: '#fee2e2',
                color: '#dc2626',
                padding: '12px',
                borderRadius: '4px',
                fontSize: '14px',
                border: '1px solid #fecaca'
              }}>
                {error}
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%',
                background: loading ? '#9ca3af' : '#059669',
                color: 'white',
                border: 'none',
                padding: '14px',
                borderRadius: '4px',
                fontSize: '14px',
                fontWeight: '600',
                cursor: loading ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s',
                textTransform: 'uppercase'
              }}
            >
              {loading ? 'Ingresando...' : 'INGRESAR'}
            </button>

            {/* Links */}
            <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <a 
                href="#" 
                style={{ 
                  color: '#059669', 
                  textDecoration: 'underline',
                  fontSize: '14px'
                }}
              >
                ¿Olvidaste tu contraseña?
              </a>
              
              <div style={{ fontSize: '14px', color: '#6b7280' }}>
                Si todavía no te has registrado al sitio de CFE, hazlo ahora mismo para aprovechar todos los beneficios.
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '12px', color: '#6b7280', textAlign: 'left', marginTop: '8px' }}>
                <div style={{ fontWeight: '600' }}>¿Qué puedo hacer si me registro?</div>
                <div>• Consultar tu recibo</div>
                <div>• Pagar tu recibo</div>
                <div>• Avisar de fallas de luz</div>
                <div>• Solicitar que revisen tu medidor</div>
              </div>
              
              <Link 
                to="/signup" 
                style={{ 
                  color: '#059669', 
                  textDecoration: 'underline',
                  fontSize: '14px',
                  fontWeight: '600',
                  textTransform: 'uppercase',
                  marginTop: '12px'
                }}
              >
                REGÍSTRATE
              </Link>
              
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CFELoginPage;

