import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Lock, Mail, Eye, EyeOff } from 'lucide-react';

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');



  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    setLoading(true);
    setError('');

    try {
      const userData = await login(email, password);

      if (userData) {
        // Add a small delay to ensure auth state is updated
        setTimeout(() => {
          // Route based on user role
          if (userData.role === 'admin') {
            navigate('/admin');
          } else {
            navigate('/user');
          }
        }, 100);
      } else {
        setError('Invalid credentials');
      }
    } catch (err) {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* CSS Keyframes for Blue Lava Animation */}
      <style>
        {`
          @keyframes lavaMove1 {
            0% { transform: translate(0, 0) scale(1) rotate(0deg); }
            25% { transform: translate(120px, -80px) scale(1.3) rotate(90deg); }
            50% { transform: translate(-60px, 100px) scale(0.7) rotate(180deg); }
            75% { transform: translate(80px, 50px) scale(1.1) rotate(270deg); }
            100% { transform: translate(0, 0) scale(1) rotate(360deg); }
          }

          @keyframes lavaMove2 {
            0% { transform: translate(0, 0) scale(0.8) rotate(0deg); }
            30% { transform: translate(-100px, 60px) scale(1.4) rotate(108deg); }
            60% { transform: translate(120px, -50px) scale(0.6) rotate(216deg); }
            100% { transform: translate(0, 0) scale(0.8) rotate(360deg); }
          }

          @keyframes lavaMove3 {
            0% { transform: translate(0, 0) scale(1.2) rotate(0deg); }
            35% { transform: translate(70px, 70px) scale(0.9) rotate(126deg); }
            70% { transform: translate(-90px, -40px) scale(1.5) rotate(252deg); }
            100% { transform: translate(0, 0) scale(1.2) rotate(360deg); }
          }

          @keyframes lavaMove4 {
            0% { transform: translate(0, 0) scale(1) rotate(0deg); }
            40% { transform: translate(-80px, -60px) scale(1.1) rotate(144deg); }
            80% { transform: translate(100px, 40px) scale(0.8) rotate(288deg); }
            100% { transform: translate(0, 0) scale(1) rotate(360deg); }
          }
        `}
      </style>

      <div style={{
        display: 'flex',
        minHeight: '100vh',
        background: '#000',
        position: 'relative',
        overflow: 'hidden',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        {/* Blue Lava Animation Background */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          background: '#000000',
          overflow: 'hidden',
          zIndex: 0
        }}>
          {/* Lava Blob 1 */}
          <div style={{
            position: 'absolute',
            width: '400px',
            height: '400px',
            background: 'radial-gradient(circle, rgba(59, 130, 246, 0.6) 0%, rgba(29, 78, 216, 0.4) 50%, transparent 70%)',
            borderRadius: '50%',
            filter: 'blur(30px)',
            animation: 'lavaMove1 10s ease-in-out infinite',
            top: '15%',
            left: '10%'
          }} />
          
          {/* Lava Blob 2 */}
          <div style={{
            position: 'absolute',
            width: '350px',
            height: '350px',
            background: 'radial-gradient(circle, rgba(30, 64, 175, 0.5) 0%, rgba(59, 130, 246, 0.3) 60%, transparent 80%)',
            borderRadius: '50%',
            filter: 'blur(35px)',
            animation: 'lavaMove2 14s ease-in-out infinite',
            top: '60%',
            right: '5%'
          }} />
          
          {/* Lava Blob 3 */}
          <div style={{
            position: 'absolute',
            width: '300px',
            height: '300px',
            background: 'radial-gradient(circle, rgba(29, 78, 216, 0.7) 0%, rgba(30, 64, 175, 0.4) 40%, transparent 70%)',
            borderRadius: '50%',
            filter: 'blur(25px)',
            animation: 'lavaMove3 12s ease-in-out infinite',
            bottom: '10%',
            left: '25%'
          }} />

          {/* Lava Blob 4 */}
          <div style={{
            position: 'absolute',
            width: '250px',
            height: '250px',
            background: 'radial-gradient(circle, rgba(59, 130, 246, 0.4) 0%, rgba(29, 78, 216, 0.3) 50%, transparent 70%)',
            borderRadius: '50%',
            filter: 'blur(20px)',
            animation: 'lavaMove4 16s ease-in-out infinite',
            top: '40%',
            right: '35%'
          }} />
          
          {/* Dark overlay to blend */}
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            background: 'rgba(0, 0, 0, 0.4)'
          }} />
        </div>

        {/* Centered Login Form */}
        <div style={{
          position: 'relative',
          zIndex: 1,
          width: '100%',
          maxWidth: '420px',
          padding: '2rem'
        }}>
          <div style={{
            background: '#ffffff',
            borderRadius: '16px',
            padding: '2.5rem',
            boxShadow: '0 25px 50px rgba(0,0,0,0.1)',
            border: '1px solid #e5e7eb'
          }}>
            {/* Header */}
            <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
              <h1 style={{
                margin: 0,
                color: '#000000',
                fontSize: '2rem',
                fontWeight: '700'
              }}>
                🚀 Welcome Back
              </h1>
              <p style={{
                color: '#374151',
                marginTop: '0.5rem',
                fontSize: '16px'
              }}>
                Sign in to your CryptoSim AI account
              </p>
            </div>

            <form onSubmit={handleSubmit} noValidate>
              {/* Email Field */}
              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ 
                  display: 'block', 
                  marginBottom: '0.5rem', 
                  color: '#000000', 
                  fontWeight: '500' 
                }}>
                  Email
                </label>
                <div style={{ position: 'relative' }}>
                  <Mail size={20} style={{
                    position: 'absolute',
                    left: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: '#6b7280'
                  }} />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                    }}
                    required
                    style={{
                      width: '100%',
                      padding: '12px 12px 12px 44px',
                      border: '2px solid #d1d5db',
                      borderRadius: '8px',
                      fontSize: '16px',
                      outline: 'none',
                      transition: 'border-color 0.2s, box-shadow 0.2s',
                      boxSizing: 'border-box',
                      background: '#ffffff',
                      color: '#000000'
                    }}
                    placeholder="Enter your email"
                  />
                </div>
              </div>

              {/* Password Field */}
              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ 
                  display: 'block', 
                  marginBottom: '0.5rem', 
                  color: '#000000', 
                  fontWeight: '500' 
                }}>
                  Password
                </label>
                <div style={{ position: 'relative' }}>
                  <Lock size={20} style={{
                    position: 'absolute',
                    left: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: '#6b7280'
                  }} />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                    }}
                    required
                    style={{
                      width: '100%',
                      padding: '12px 44px 12px 44px',
                      border: '2px solid #d1d5db',
                      borderRadius: '8px',
                      fontSize: '16px',
                      outline: 'none',
                      transition: 'border-color 0.2s, box-shadow 0.2s',
                      boxSizing: 'border-box',
                      background: '#ffffff',
                      color: '#000000'
                    }}
                    placeholder="Enter your password"
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
                      color: '#6b7280',
                      zIndex: 1
                    }}
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>

              {/* Error Message */}
              {error && (
                <div style={{
                  background: '#fef2f2',
                  color: '#dc2626',
                  padding: '12px',
                  borderRadius: '8px',
                  marginBottom: '1.5rem',
                  fontSize: '14px',
                  border: '1px solid #fecaca'
                }}>
                  {error}
                </div>
              )}

              {/* Submit Button */}
              <button
                type="button"
                disabled={loading}
                onClick={async (e) => {
                  try {
                    e.preventDefault();
                    e.stopPropagation();
                    await handleSubmit(e as any);
                  } catch (error) {
                    // Error handling is already done in handleSubmit
                  }
                }}
                style={{
                  width: '100%',
                  background: loading ? '#9ca3af' : 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
                  color: 'white',
                  border: 'none',
                  padding: '14px',
                  borderRadius: '8px',
                  fontSize: '16px',
                  fontWeight: '600',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  transition: 'all 0.2s',
                  boxShadow: loading ? 'none' : '0 4px 14px rgba(79, 70, 229, 0.25)'
                }}
              >
                {loading ? 'Signing in...' : 'Sign In'}
              </button>
            </form>

            {/* Footer */}
            <div style={{
              textAlign: 'center',
              marginTop: '2rem',
              paddingTop: '2rem',
              borderTop: '1px solid #e5e7eb'
            }}>
              <p style={{ color: '#000000', margin: 0 }}>
                Don't have an account?{' '}
                <Link 
                  to="/signup" 
                  style={{ 
                    color: '#4f46e5', 
                    textDecoration: 'none', 
                    fontWeight: '600' 
                  }}
                >
                  Sign Up
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Login;