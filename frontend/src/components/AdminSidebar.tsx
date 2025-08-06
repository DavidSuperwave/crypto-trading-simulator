import React from 'react';
import { BarChart3, Users, Upload, Download, MessageCircle, Eye, DollarSign, LogOut, Shield } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

interface AdminSidebarProps {
  activeView: string;
  onViewChange: (view: string) => void;
}

const AdminSidebar: React.FC<AdminSidebarProps> = ({ activeView, onViewChange }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const menuItems = [
    { id: 'overview', label: 'Dashboard', icon: BarChart3, color: '#4F46E5' },
    { id: 'users', label: 'Users', icon: Users, color: '#059669' },
    { id: 'pending-deposits', label: 'Pending Deposits', icon: Upload, color: '#DC2626' },
    { id: 'withdrawals', label: 'Withdrawals', icon: Download, color: '#7C2D12' },
    { id: 'chat', label: 'Chat Management', icon: MessageCircle, color: '#0369A1' },
    { id: 'demos', label: 'Demo Requests', icon: Eye, color: '#7C3AED' },
    { id: 'transactions', label: 'Transactions', icon: DollarSign, color: '#059669' }
  ];

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div style={{
      width: '280px',
      height: '100vh',
      background: 'linear-gradient(180deg, #1f2937 0%, #111827 100%)',
      color: 'white',
      display: 'flex',
      flexDirection: 'column',
      position: 'fixed',
      left: 0,
      top: 0,
      zIndex: 1000,
      boxShadow: '4px 0 20px rgba(0, 0, 0, 0.15)'
    }}>
      {/* Logo/Header */}
      <div style={{
        padding: '2rem 1.5rem',
        borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          marginBottom: '1rem'
        }}>
          <div style={{
            width: '40px',
            height: '40px',
            background: 'linear-gradient(135deg, #DC2626 0%, #991B1B 100%)',
            borderRadius: '12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Shield size={20} color="white" />
          </div>
          <div>
            <h1 style={{
              margin: 0,
              fontSize: '1.25rem',
              fontWeight: '700',
              background: 'linear-gradient(135deg, #F87171 0%, #FCA5A5 100%)',
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent'
            }}>
              Admin Panel
            </h1>
            <p style={{
              margin: 0,
              fontSize: '0.75rem',
              color: 'rgba(255, 255, 255, 0.6)'
            }}>
              Control Center
            </p>
          </div>
        </div>
      </div>

      {/* Admin Info */}
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
            background: 'linear-gradient(135deg, #DC2626 0%, #991B1B 100%)',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '1.25rem',
            fontWeight: '600'
          }}>
            <Shield size={20} color="white" />
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
              {user?.email || 'Admin'}
            </p>
            <p style={{
              margin: 0,
              fontSize: '0.75rem',
              color: 'rgba(255, 255, 255, 0.6)'
            }}>
              Administrator
            </p>
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
                color: isActive ? 'white' : 'rgba(255, 255, 255, 0.7)',
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
                  e.currentTarget.style.color = 'rgba(255, 255, 255, 0.7)';
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
          <span>Logout</span>
        </button>
        
        <div style={{
          fontSize: '0.7rem',
          color: 'rgba(255, 255, 255, 0.4)',
          textAlign: 'center',
          marginTop: '0.5rem'
        }}>
          © 2024 Altura Capital Admin
        </div>
      </div>
    </div>
  );
};

export default AdminSidebar;