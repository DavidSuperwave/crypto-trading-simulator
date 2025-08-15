import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import DepositPage from './DepositPage';
import WithdrawalPage from './WithdrawalPage';
import UserSettings from './UserSettings';
import PendingRequestsWidget from './PendingRequestsWidget';
import UserSidebar from './UserSidebar';
import LiveTradingFeed from './LiveTradingFeed';
import FloatingChatBubble from './FloatingChatBubble';
import PrimaryBalanceCard from './PrimaryBalanceCard';

import { Menu, X } from 'lucide-react';
import { useUserPolling } from '../hooks/useUserPolling';
import { LiveTradingProvider } from '../context/LiveTradingContext';

// Removed unused Transaction interface

// Local trading interfaces removed - using backend simulation data

// Local trading simulator constants removed - using backend simulation

const UserDashboard: React.FC = () => {
  const { user, updateUser } = useAuth();
  const [activeView, setActiveView] = useState('home');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  
  // Mobile responsive logic
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth <= 768;
      setIsMobile(mobile);
      if (!mobile) {
        setIsMobileMenuOpen(false); // Close mobile menu on desktop
      }
    };
    
    handleResize(); // Initial check
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Close mobile menu when route changes
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [activeView]);

  // Simple polling for user notifications (2-minute intervals)
  const { notifications, unreadCount, markAsRead, clearNotification } = useUserPolling((deposit) => {
    // Handle deposit status updates via polling
    console.log('🔔 Deposit status update via polling:', deposit);
    
    if (deposit.status === 'approved' && user) {
      // No manual balance update - backend handles compound interest simulation
      // Portfolio data will be refreshed automatically
      console.log('✅ Deposit approved - portfolio will refresh automatically');
    } else if (deposit.status === 'rejected') {
      console.log('❌ Deposit rejected');
    }
  });

  // Request notification permission on component mount
  useEffect(() => {
    if (Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  // Removed unused transaction fetching

  // All local trading simulation functions removed - using backend simulation only

  // Local simulation loops removed - using backend compound interest simulation


  // Render different views based on activeView
  const renderMainContent = () => {
    switch (activeView) {
      case 'deposit':
        return <DepositPage />;
      case 'withdrawal':
        return <WithdrawalPage />;
      case 'settings':
        return <UserSettings />;
      case 'home':
      default:
        return (
          <div style={{ 
            display: 'flex', 
            flexDirection: isMobile ? 'column' : 'row',
            gap: isMobile ? '1.5rem' : '2rem',
            height: isMobile ? 'auto' : 'calc(100vh - 4rem)' // Full height minus padding
          }}>
            {/* Left Column - User Info & Controls */}
            <div style={{ 
              flex: isMobile ? '1' : '0 0 60%', // 60% width on desktop, full on mobile
              display: 'flex', 
              flexDirection: 'column', 
              gap: '1.5rem',
              minWidth: 0 // Prevent overflow
            }}>
              {/* Primary Balance Card */}
              <PrimaryBalanceCard />

              {/* Pending Requests */}
              <PendingRequestsWidget />
            </div>

            {/* Right Column - Live Trading Feed (Full Height) */}
            {!isMobile && (
              <div style={{ 
                flex: '1', // Take remaining space (40%)
                minHeight: '100%',
                display: 'flex',
                flexDirection: 'column'
              }}>
                <LiveTradingFeed />
              </div>
            )}

            {/* Mobile: Show trading feed below other content */}
            {isMobile && <LiveTradingFeed />}
          </div>
        );
    }
  };

  // Mobile Header Component
  const MobileHeader = () => (
    <div style={{
      display: isMobile ? 'flex' : 'none',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '1rem',
      background: 'linear-gradient(90deg, #00509d 0%, #003d7a 100%)',
      color: 'white',
      position: 'sticky',
      top: 0,
      zIndex: 1000,
      boxShadow: '0 2px 10px rgba(0, 0, 0, 0.1)'
    }}>
      {/* Logo */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem'
      }}>
        <img 
          src="/logo.png" 
          alt="Logo" 
          style={{
            height: '32px',
            objectFit: 'contain'
          }}
        />
      </div>

      {/* User Info & Menu Toggle */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '1rem'
      }}>
        {/* User Avatar */}
        <div style={{
          width: '32px',
          height: '32px',
          background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '0.9rem',
          fontWeight: '600'
        }}>
          {user?.email?.charAt(0).toUpperCase() || 'U'}
        </div>

        {/* Menu Toggle */}
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          style={{
            background: 'none',
            border: 'none',
            color: 'white',
            cursor: 'pointer',
            padding: '0.5rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: '8px',
            transition: 'background-color 0.2s ease'
          }}
          onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)'}
          onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
        >
          {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>
    </div>
  );

  return (
    <div style={{
      display: 'flex',
      flexDirection: isMobile ? 'column' : 'row',
      minHeight: '100vh',
      fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      position: 'relative'
    }}>
      {/* Mobile Header */}
      <MobileHeader />

      {/* Desktop Sidebar or Mobile Menu Overlay */}
      {!isMobile ? (
        <UserSidebar activeView={activeView} onViewChange={setActiveView} />
      ) : (
        <>
          {/* Mobile Menu Overlay */}
          {isMobileMenuOpen && (
            <div
              style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: 'rgba(0, 0, 0, 0.5)',
                zIndex: 1500,
                display: 'flex'
              }}
              onClick={() => setIsMobileMenuOpen(false)}
            >
              {/* Mobile Sidebar */}
              <div
                style={{
                  width: '280px',
                  height: '100vh',
                  background: 'linear-gradient(180deg, #00509d 0%, #003d7a 100%)',
                  color: 'white',
                  transform: isMobileMenuOpen ? 'translateX(0)' : 'translateX(-100%)',
                  transition: 'transform 0.3s ease-in-out',
                  overflowY: 'auto'
                }}
                onClick={(e) => e.stopPropagation()}
              >
                <UserSidebar 
                  activeView={activeView} 
                  onViewChange={(view) => {
                    setActiveView(view);
                    setIsMobileMenuOpen(false);
                  }} 
                />
              </div>
            </div>
          )}
        </>
      )}
      
      {/* Main Content Area */}
      <div style={{
        flex: 1,
        background: '#F8FAFC',
        minHeight: isMobile ? 'calc(100vh - 64px)' : '100vh',
        paddingLeft: isMobile ? '0' : '280px', // Account for fixed sidebar width on desktop
        display: 'flex',
        flexDirection: 'column'
      }}>
        <div style={{
          padding: isMobile ? '1rem' : '2rem',
          display: 'flex',
          flexDirection: 'column',
          gap: isMobile ? '1rem' : '2rem',
          flex: 1
        }}>
          {/* Content Area */}
          <LiveTradingProvider>
            <div style={{
              display: 'flex',
              flexDirection: isMobile ? 'column' : 'row',
              gap: isMobile ? '1rem' : '2rem',
              height: '100%'
            }}>
              {/* Main Content */}
              <div style={{ 
                flex: 1,
                minWidth: 0 // Prevent flex item from overflowing
              }}>
                {renderMainContent()}
              </div>
              
              {/* Right Sidebar - Live Trading Feed - Only show on home view */}
              {/* Live Trading Feed removed - now shown in main content area only */}
            </div>
          </LiveTradingProvider>
        </div>
      </div>
      
      {/* Floating Chat Bubble - Available on all views */}
      <FloatingChatBubble />
    </div>
  );
};

export default UserDashboard;