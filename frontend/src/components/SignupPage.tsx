import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { User, Mail, Phone, Lock, Eye, EyeOff, CheckCircle, XCircle } from 'lucide-react';
import TradingAnimation from './TradingAnimation';

const SignupPage: React.FC = () => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<{[key: string]: string}>({});
  const [isMobile, setIsMobile] = useState(false);

  const { register } = useAuth();
  const navigate = useNavigate();

  // Handle responsive design properly
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    
    handleResize(); // Initial check
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Simple validation function
  const validateField = (field: string, value: string) => {
    switch (field) {
      case 'firstName':
        if (!value.trim()) return 'First name is required';
        if (value.trim().length < 2) return 'First name must be at least 2 characters';
        return '';
      case 'lastName':
        if (!value.trim()) return 'Last name is required';
        if (value.trim().length < 2) return 'Last name must be at least 2 characters';
        return '';
      case 'email':
        if (!value) return 'Email is required';
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return 'Please enter a valid email address';
        return '';
      case 'phone':
        if (!value) return 'Phone number is required';
        if (!/^[+]?[1-9][\d]{0,15}$/.test(value.replace(/[\s\-()]/g, ''))) return 'Please enter a valid phone number';
        return '';
      case 'password':
        if (!value) return 'Password is required';
        if (value.length < 8) return 'Password must be at least 8 characters';
        if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(value)) return 'Password must contain uppercase, lowercase, and number';
        return '';
      case 'confirmPassword':
        if (!value) return 'Please confirm your password';
        // Access current password from formData to avoid stale closure
        const currentPassword = formData.password;
        if (value !== currentPassword) return 'Passwords do not match';
        return '';
      default:
        return '';
    }
  };

  // Optimized input handlers with useCallback to prevent unnecessary re-renders
  const handleInputChange = useCallback((field: string, value: string) => {
    // Batch state updates to reduce re-renders
    setFormData(prev => ({ ...prev, [field]: value }));
    // Only clear error if it exists to avoid unnecessary state updates
    setFieldErrors(prev => {
      if (prev[field]) {
        return { ...prev, [field]: '' };
      }
      return prev;
    });
  }, []); // Remove fieldErrors dependency to prevent stale closures

  const handleInputBlur = useCallback((field: string, value: string) => {
    const error = validateField(field, value);
    if (error) {
      setFieldErrors(prev => ({ ...prev, [field]: error }));
    }
  }, []);

  // Memoized password strength calculation
  const passwordStrength = useMemo(() => {
    const password = formData.password;
    let strength = 0;
    
    if (password.length >= 8) strength++;
    if (/[a-z]/.test(password)) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/\d/.test(password)) strength++;
    if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) strength++;
    
    return strength;
  }, [formData.password]);

  const passwordStrengthText = useMemo(() => {
    if (passwordStrength < 2) return { text: 'Weak', color: '#ef4444' };
    if (passwordStrength < 4) return { text: 'Medium', color: '#f59e0b' };
    return { text: 'Strong', color: '#10b981' };
  }, [passwordStrength]);

  const isFormValid = useMemo(() => {
    return Object.values(formData).every(value => value.trim() !== '') &&
           Object.values(fieldErrors).every(error => error === '') &&
           passwordStrength >= 3;
  }, [formData, fieldErrors, passwordStrength]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Validate all fields before submitting
    const newFieldErrors: {[key: string]: string} = {};
    Object.keys(formData).forEach(field => {
      const error = validateField(field, formData[field as keyof typeof formData]);
      if (error) newFieldErrors[field] = error;
    });

    // Additional validation for password confirmation
    if (formData.password !== formData.confirmPassword) {
      newFieldErrors.confirmPassword = 'Passwords do not match';
    }

    if (Object.keys(newFieldErrors).length > 0) {
      setFieldErrors(newFieldErrors);
      setLoading(false);
      setError('Please fix all errors before submitting');
      return;
    }

    try {
      const userData = await register(
        formData.email, 
        formData.password, 
        formData.firstName, 
        formData.lastName, 
        formData.phone
      );
      
      if (userData) {
        navigate('/user');
      } else {
        setError('Registration failed. Please try again.');
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
        overflow: 'hidden'
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
        {/* Left Side - Trading Animation (60%) */}
        <div style={{ 
          width: '60%',
          minHeight: '100vh',
          display: isMobile ? 'none' : 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
          zIndex: 1
        }}>
          <TradingAnimation />
        </div>

        {/* Right Side - Signup Form (40% on desktop, 100% on mobile) */}
        <div style={{
          width: isMobile ? '100%' : '40%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '2rem',
          position: 'relative',
          zIndex: 1,
          overflowY: 'auto'
        }}>
        <div style={{
          background: '#ffffff',
          borderRadius: '16px',
          padding: '2.5rem',
          width: '100%',
          maxWidth: '420px',
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
              🚀 Join CryptoSim AI
            </h1>
            <p style={{ 
              color: '#374151', 
              marginTop: '0.5rem',
              fontSize: '16px'
            }}>
              Start your AI-powered trading journey today
            </p>
          </div>

          <form onSubmit={handleSubmit}>
            {/* Name Fields */}
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: '1fr 1fr',
              gap: '1rem', 
              marginBottom: '20px' 
            }}>
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '8px', color: '#000000', fontWeight: '500', fontSize: '14px' }}>
                  First Name
                </label>
                <div style={{ position: 'relative' }}>
                  <div style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#6b7280', zIndex: 1 }}>
                    <User size={20} />
                  </div>
                  <input
                    type="text"
                    value={formData.firstName}
                    onChange={(e) => handleInputChange('firstName', e.target.value)}
                    onBlur={(e) => handleInputBlur('firstName', e.target.value)}
                    placeholder="John"
                    style={{
                      width: '100%',
                      padding: '14px 14px 14px 44px',
                      border: `2px solid ${fieldErrors.firstName ? '#ef4444' : '#d1d5db'}`,
                      borderRadius: '8px',
                      fontSize: '16px',
                      outline: 'none',
                      transition: 'border-color 0.2s, box-shadow 0.2s',
                      boxSizing: 'border-box',
                      background: '#ffffff',
                      color: '#000000',
                      ...(formData.firstName && !fieldErrors.firstName ? { borderColor: '#10b981' } : {})
                    }}
                  />
                  {formData.firstName && (
                    <div style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', color: fieldErrors.firstName ? '#ef4444' : '#10b981' }}>
                      {fieldErrors.firstName ? <XCircle size={20} /> : <CheckCircle size={20} />}
                    </div>
                  )}
                </div>
                {fieldErrors.firstName && (
                  <div style={{ color: '#ef4444', fontSize: '13px', marginTop: '6px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <XCircle size={14} />
                    {fieldErrors.firstName}
                  </div>
                )}
              </div>
              
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '8px', color: '#000000', fontWeight: '500', fontSize: '14px' }}>
                  Last Name
                </label>
                <div style={{ position: 'relative' }}>
                  <div style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#6b7280', zIndex: 1 }}>
                    <User size={20} />
                  </div>
                  <input
                    type="text"
                    value={formData.lastName}
                    onChange={(e) => handleInputChange('lastName', e.target.value)}
                    onBlur={(e) => handleInputBlur('lastName', e.target.value)}
                    placeholder="Doe"
                    style={{
                      width: '100%',
                      padding: '14px 14px 14px 44px',
                      border: `2px solid ${fieldErrors.lastName ? '#ef4444' : '#d1d5db'}`,
                      borderRadius: '8px',
                      fontSize: '16px',
                      outline: 'none',
                      transition: 'border-color 0.2s, box-shadow 0.2s',
                      boxSizing: 'border-box',
                      background: '#ffffff',
                      color: '#000000',
                      ...(formData.lastName && !fieldErrors.lastName ? { borderColor: '#10b981' } : {})
                    }}
                  />
                  {formData.lastName && (
                    <div style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', color: fieldErrors.lastName ? '#ef4444' : '#10b981' }}>
                      {fieldErrors.lastName ? <XCircle size={20} /> : <CheckCircle size={20} />}
                    </div>
                  )}
                </div>
                {fieldErrors.lastName && (
                  <div style={{ color: '#ef4444', fontSize: '13px', marginTop: '6px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <XCircle size={14} />
                    {fieldErrors.lastName}
                  </div>
                )}
              </div>
            </div>

            {/* Email */}
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '8px', color: '#000000', fontWeight: '500', fontSize: '14px' }}>
                Email Address
              </label>
              <div style={{ position: 'relative' }}>
                <div style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#6b7280', zIndex: 1 }}>
                  <Mail size={20} />
                </div>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  onBlur={(e) => handleInputBlur('email', e.target.value)}
                  placeholder="john@example.com"
                  style={{
                    width: '100%',
                    padding: '14px 14px 14px 44px',
                    border: `2px solid ${fieldErrors.email ? '#ef4444' : '#d1d5db'}`,
                    borderRadius: '8px',
                    fontSize: '16px',
                    outline: 'none',
                    transition: 'border-color 0.2s, box-shadow 0.2s',
                    boxSizing: 'border-box',
                    background: '#ffffff',
                    color: '#000000',
                    ...(formData.email && !fieldErrors.email ? { borderColor: '#10b981' } : {})
                  }}
                />
                {formData.email && (
                  <div style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', color: fieldErrors.email ? '#ef4444' : '#10b981' }}>
                    {fieldErrors.email ? <XCircle size={20} /> : <CheckCircle size={20} />}
                  </div>
                )}
              </div>
              {fieldErrors.email && (
                <div style={{ color: '#ef4444', fontSize: '13px', marginTop: '6px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <XCircle size={14} />
                  {fieldErrors.email}
                </div>
              )}
            </div>

            {/* Phone */}
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '8px', color: '#000000', fontWeight: '500', fontSize: '14px' }}>
                Phone Number
              </label>
              <div style={{ position: 'relative' }}>
                <div style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#6b7280', zIndex: 1 }}>
                  <Phone size={20} />
                </div>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  onBlur={(e) => handleInputBlur('phone', e.target.value)}
                  placeholder="+1 (555) 123-4567"
                  style={{
                    width: '100%',
                    padding: '14px 14px 14px 44px',
                    border: `2px solid ${fieldErrors.phone ? '#ef4444' : '#d1d5db'}`,
                    borderRadius: '8px',
                    fontSize: '16px',
                    outline: 'none',
                    transition: 'border-color 0.2s, box-shadow 0.2s',
                    boxSizing: 'border-box',
                    background: '#ffffff',
                    color: '#000000',
                    ...(formData.phone && !fieldErrors.phone ? { borderColor: '#10b981' } : {})
                  }}
                />
                {formData.phone && (
                  <div style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', color: fieldErrors.phone ? '#ef4444' : '#10b981' }}>
                    {fieldErrors.phone ? <XCircle size={20} /> : <CheckCircle size={20} />}
                  </div>
                )}
              </div>
              {fieldErrors.phone && (
                <div style={{ color: '#ef4444', fontSize: '13px', marginTop: '6px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <XCircle size={14} />
                  {fieldErrors.phone}
                </div>
              )}
            </div>

            {/* Password */}
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '8px', color: '#000000', fontWeight: '500', fontSize: '14px' }}>
                Password
              </label>
              <div style={{ position: 'relative' }}>
                <div style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#6b7280', zIndex: 1 }}>
                  <Lock size={20} />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={(e) => handleInputChange('password', e.target.value)}
                  onBlur={(e) => handleInputBlur('password', e.target.value)}
                  placeholder="Create a strong password"
                  style={{
                    width: '100%',
                    padding: '14px 14px 14px 44px',
                    border: `2px solid ${fieldErrors.password ? '#ef4444' : '#d1d5db'}`,
                    borderRadius: '8px',
                    fontSize: '16px',
                    outline: 'none',
                    transition: 'border-color 0.2s, box-shadow 0.2s',
                    boxSizing: 'border-box',
                    background: '#ffffff',
                    color: '#000000',
                    ...(formData.password && !fieldErrors.password ? { borderColor: '#10b981' } : {})
                  }}
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
                    color: '#9ca3af',
                    zIndex: 1
                  }}
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
              {fieldErrors.password && (
                <div style={{ color: '#ef4444', fontSize: '13px', marginTop: '6px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <XCircle size={14} />
                  {fieldErrors.password}
                </div>
              )}
            </div>

            {/* Password Strength Indicator */}
            {formData.password && (
              <div style={{
                marginBottom: '20px',
                padding: '12px',
                background: '#374151',
                borderRadius: '8px'
              }}>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '8px'
                }}>
                  <span style={{ color: '#000000', fontSize: '14px' }}>Password Strength:</span>
                  <span style={{ 
                    color: passwordStrengthText.color, 
                    fontSize: '14px', 
                    fontWeight: '600' 
                  }}>
                    {passwordStrengthText.text}
                  </span>
                </div>
                <div style={{
                  width: '100%',
                  height: '4px',
                  background: '#f3f4f6',
                  borderRadius: '2px',
                  overflow: 'hidden'
                }}>
                  <div style={{
                    width: `${(passwordStrength / 5) * 100}%`,
                    height: '100%',
                    background: passwordStrengthText.color,
                    transition: 'width 0.3s ease'
                  }} />
                </div>
              </div>
            )}

            {/* Confirm Password */}
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '8px', color: '#000000', fontWeight: '500', fontSize: '14px' }}>
                Confirm Password
              </label>
              <div style={{ position: 'relative' }}>
                <div style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#6b7280', zIndex: 1 }}>
                  <Lock size={20} />
                </div>
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={formData.confirmPassword}
                  onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                  onBlur={(e) => handleInputBlur('confirmPassword', e.target.value)}
                  placeholder="Confirm your password"
                  style={{
                    width: '100%',
                    padding: '14px 14px 14px 44px',
                    border: `2px solid ${fieldErrors.confirmPassword ? '#ef4444' : '#d1d5db'}`,
                    borderRadius: '8px',
                    fontSize: '16px',
                    outline: 'none',
                    transition: 'border-color 0.2s, box-shadow 0.2s',
                    boxSizing: 'border-box',
                    background: '#ffffff',
                    color: '#000000',
                    ...(formData.confirmPassword && !fieldErrors.confirmPassword ? { borderColor: '#10b981' } : {})
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  style={{
                    position: 'absolute',
                    right: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: '#9ca3af',
                    zIndex: 1
                  }}
                >
                  {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
              {fieldErrors.confirmPassword && (
                <div style={{ color: '#ef4444', fontSize: '13px', marginTop: '6px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <XCircle size={14} />
                  {fieldErrors.confirmPassword}
                </div>
              )}
            </div>

            {/* Error Message */}
            {error && (
              <div style={{
                background: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                color: '#ef4444',
                padding: '12px',
                borderRadius: '8px',
                marginBottom: '20px',
                fontSize: '14px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <XCircle size={16} />
                {error}
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading || !isFormValid}
              style={{
                width: '100%',
                background: isFormValid 
                  ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' 
                  : '#374151',
                color: 'white',
                border: 'none',
                padding: '16px',
                borderRadius: '8px',
                fontSize: '16px',
                fontWeight: '600',
                cursor: (loading || !isFormValid) ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s',
                opacity: loading ? 0.7 : 1,
                transform: 'translateY(0)',
                ...(isFormValid && !loading ? {
                  '&:hover': {
                    transform: 'translateY(-1px)',
                    boxShadow: '0 8px 16px rgba(102, 126, 234, 0.3)'
                  }
                } : {})
              }}
            >
              {loading ? (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                  <div style={{
                    width: '16px',
                    height: '16px',
                    border: '2px solid rgba(255,255,255,0.3)',
                    borderTop: '2px solid white',
                    borderRadius: '50%',
                    animation: 'spin 1s linear infinite'
                  }} />
                  Creating Account...
                </div>
              ) : (
                'Create Account'
              )}
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
              Already have an account?{' '}
              <Link 
                to="/login" 
                style={{ 
                  color: '#4f46e5', 
                  textDecoration: 'none', 
                  fontWeight: '600',
                  transition: 'color 0.2s'
                }}
              >
                Sign In
              </Link>
            </p>
          </div>
        </div>
      </div>

      {/* Loading Spinner Styles */}
      <style>
        {`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}
      </style>
      </div>
    </>
  );
};

export default SignupPage;