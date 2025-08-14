import React from 'react';
import { Home, Download, Upload, Settings, LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { usePortfolioData } from '../hooks/usePortfolioData';
import { useNavigate } from 'react-router-dom';

interface UserSidebarProps {
  activeView: string;
  onViewChange: (view: string) => void;
}

const UserSidebar: React.FC<UserSidebarProps> = ({ activeView, onViewChange }) => {
  const { user, logout } = useAuth();
  const { portfolioData } = usePortfolioData();
  const navigate = useNavigate();

  const menuItems = [
    { id: 'home', label: 'Inicio', icon: Home, color: '#4F46E5' },
    { id: 'deposit', label: 'Depositar', icon: Download, color: '#059669' },
    { id: 'withdrawal', label: 'Retirar', icon: Upload, color: '#DC2626' },
    { id: 'settings', label: 'Configuración', icon: Settings, color: '#6B7280' }
  ];

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div style={{
      width: '280px',
      height: '100vh',
      background: 'linear-gradient(180deg, #00509d 0%, #003d7a 100%)',
      color: 'white',
      display: 'flex',
      flexDirection: 'column',
      position: 'fixed',
      left: 0,
      top: 0,
      zIndex: 1000,
      boxShadow: '4px 0 20px rgba(0, 0, 0, 0.1)'
    }}>
      {/* Logo/Header */}
      <div style={{
        padding: '1.5rem 1.5rem',
        borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <div style={{
            width: '180px',
            height: '50px',
            borderRadius: '12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <img 
              src="/logo.png" 
              alt="Logo" 
              style={{
                width: '220px',
                height: '80px',
                objectFit: 'contain'
              }}
            />
          </div>
        </div>
      </div>

      {/* User Info */}
      <div style={{
        padding: '1.5rem',
        borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem'
        }}>
          <div style={{
            width: '48px',
            height: '48px',
            background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '1.25rem',
            fontWeight: '600'
          }}>
            {user?.email?.charAt(0).toUpperCase() || 'U'}
          </div>
          <div style={{ flex: 1, overflow: 'hidden' }}>
            <p style={{
              margin: 0,
              fontSize: '0.9rem',
              fontWeight: '600',
              color: 'white',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis'
            }}>
              {user?.email || 'Usuario'}
            </p>
            <div style={{
              fontSize: '0.75rem',
              color: 'rgba(255, 255, 255, 0.8)',
              lineHeight: 1.3
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Total:</span>
                <span style={{ fontWeight: '600' }}>
                  ${portfolioData?.totalPortfolioValue 
                    ? portfolioData.totalPortfolioValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                    : user?.balance 
                      ? user.balance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) 
                      : '0.00'}
                </span>
              </div>
              {portfolioData && (
                <>
                  <div style={{ display: 'flex', justifyContent: 'space-between', opacity: 0.7 }}>
                    <span>Deposited:</span>
                    <span>${portfolioData?.totalDeposited?.toLocaleString('en-US', { minimumFractionDigits: 2 }) || '0.00'}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', opacity: 0.7 }}>
                    <span>AI Earned:</span>
                    <span style={{ color: (portfolioData?.compoundInterestEarned || 0) > 0 ? '#4ade80' : 'inherit' }}>
                      ${portfolioData?.compoundInterestEarned?.toLocaleString('en-US', { minimumFractionDigits: 3 }) || '0.00'}
                    </span>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Menu */}
      <nav style={{
        flex: 1,
        padding: '1.5rem 1rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.5rem'
      }}>
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeView === item.id;
          
          return (
            <button
              key={item.id}
              onClick={() => onViewChange(item.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                padding: '0.875rem 1rem',
                background: isActive 
                  ? 'rgba(255, 255, 255, 0.1)' 
                  : 'transparent',
                border: 'none',
                borderRadius: '12px',
                color: 'white',
                fontSize: '0.9rem',
                fontWeight: isActive ? '600' : '500',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                position: 'relative',
                overflow: 'hidden'
              }}
              onMouseEnter={(e) => {
                if (!isActive) {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                  e.currentTarget.style.color = 'white';
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive) {
                  e.currentTarget.style.background = 'transparent';
                  e.currentTarget.style.color = 'white';
                }
              }}
            >
              {isActive && (
                <div style={{
                  position: 'absolute',
                  left: 0,
                  top: 0,
                  bottom: 0,
                  width: '4px',
                  background: `linear-gradient(180deg, ${item.color} 0%, ${item.color}dd 100%)`,
                  borderRadius: '0 4px 4px 0'
                }} />
              )}
              <Icon 
                size={20} 
                color={isActive ? item.color : 'currentColor'} 
              />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Bottom Actions */}
      <div style={{
        padding: '1.5rem 1rem',
        borderTop: '1px solid rgba(255, 255, 255, 0.1)',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.5rem'
      }}>
        <button
          onClick={handleLogout}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            padding: '0.875rem 1rem',
            background: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid rgba(239, 68, 68, 0.2)',
            borderRadius: '12px',
            color: '#F87171',
            fontSize: '0.9rem',
            fontWeight: '500',
            cursor: 'pointer',
            transition: 'all 0.2s ease'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(239, 68, 68, 0.2)';
            e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.4)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)';
            e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.2)';
          }}
        >
          <LogOut size={18} />
          <span>Cerrar Sesión</span>
        </button>
        
        <div style={{
          fontSize: '0.7rem',
          color: 'rgba(255, 255, 255, 0.4)',
          textAlign: 'center',
          marginTop: '0.5rem'
        }}>
          © 2024 CryptoSim AI
        </div>
      </div>
    </div>
  );
};

export default UserSidebar;