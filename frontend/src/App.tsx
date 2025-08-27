import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import './App.css';

// Import components
import Homepage from './components/Homepage';
import UserDashboard from './components/UserDashboard';
import AdminDashboard from './components/AdminDashboard';
import DemoDashboard from './components/DemoDashboard';
import DemoPage from './components/DemoPage';
import DepositPage from './components/DepositPage';
import PaymentMethodPage from './components/PaymentMethodPage';
import WithdrawalPage from './components/WithdrawalPage';
import CFELoginPage from './components/CFELoginPage';
import CFESignupPage from './components/CFESignupPage';

import { AuthProvider, useAuth } from './context/AuthContext';
import ErrorBoundary from './components/ErrorBoundary';

// Public route component - accessible to everyone (no authentication required)
const PublicRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // No authentication checks - publicly accessible
  return <>{children}</>;
};

// Protected route component
const ProtectedRoute: React.FC<{ children: React.ReactNode; requireAdmin?: boolean }> = ({ 
  children, 
  requireAdmin = false 
}) => {
  const { isAuthenticated, user, isLoading } = useAuth();
  
  // console.log('🔐 ProtectedRoute check:', { isAuthenticated, isLoading, userRole: user?.role, requireAdmin }); // Disabled debug logging
  
  // Don't redirect while still loading
  if (isLoading) {
    // console.log('⏳ Auth still loading, showing loading screen'); // Disabled debug logging
    return null; // Let the main loading screen handle this
  }
  
  if (!isAuthenticated) {
    // console.log('🚫 Not authenticated, redirecting to login'); // Disabled debug logging
    return <Navigate to="/login" replace />;
  }
  
  if (requireAdmin && user?.role !== 'admin') {
    // console.log('🚫 Admin access denied. User role:', user?.role, 'User:', user); // Disabled debug logging
    return <Navigate to="/user" replace />;
  }
  
  if (requireAdmin) {
    // console.log('✅ Admin access granted. User role:', user?.role); // Disabled debug logging
  }
  
  // console.log('✅ Access granted, rendering children'); // Disabled debug logging
  return <>{children}</>;
};

// Loading component
const LoadingScreen: React.FC = () => {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      height: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      color: 'white'
    }}>
      <div style={{
        width: '50px',
        height: '50px',
        border: '4px solid rgba(255,255,255,0.3)',
        borderTop: '4px solid white',
        borderRadius: '50%',
        animation: 'spin 1s linear infinite',
        marginBottom: '20px'
      }} />
      <h3 style={{ margin: '0', fontWeight: '300' }}>Cargando...</h3>
      <p style={{ margin: '10px 0 0 0', opacity: 0.8, fontSize: '0.9rem' }}>Verificando autenticación</p>
      <style>
        {`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}
      </style>
    </div>
  );
};

function AppContent() {
  const { isLoading } = useAuth();

  // Show loading screen while verifying authentication
  if (isLoading) {
    return <LoadingScreen />;
  }

  return (
    <div className="App">
      <ErrorBoundary fallbackTitle="Application Error" showHome={true}>
        <Routes>
          <Route path="/login" element={
            <ErrorBoundary fallbackTitle="Login Error" showHome={true} showRefresh={false}>
              <CFELoginPage />
            </ErrorBoundary>
          } />
          <Route path="/signup" element={
            <ErrorBoundary fallbackTitle="Signup Error" showHome={true} showRefresh={false}>
              <CFESignupPage />
            </ErrorBoundary>
          } />
          <Route path="/cfe-login" element={
            <ErrorBoundary fallbackTitle="CFE Login Error" showHome={true} showRefresh={false}>
              <CFELoginPage />
            </ErrorBoundary>
          } />
          <Route path="/trading-demo" element={
            <ErrorBoundary fallbackTitle="Demo Error" showHome={true}>
              <DemoPage />
            </ErrorBoundary>
          } />
          <Route 
            path="/demo" 
            element={
              <PublicRoute>
                <ErrorBoundary fallbackTitle="Demo Dashboard Error" showHome={true}>
                  <DemoDashboard />
                </ErrorBoundary>
              </PublicRoute>
            } 
          />
          <Route 
            path="/user" 
            element={
              <ProtectedRoute>
                <ErrorBoundary fallbackTitle="User Dashboard Error" showHome={true}>
                  <UserDashboard />
                </ErrorBoundary>
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/deposit" 
            element={
              <ProtectedRoute>
                <ErrorBoundary fallbackTitle="Deposit Page Error" showHome={true}>
                  <DepositPage />
                </ErrorBoundary>
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/payment-method" 
            element={
              <ProtectedRoute>
                <ErrorBoundary fallbackTitle="Payment Method Error" showHome={true}>
                  <PaymentMethodPage />
                </ErrorBoundary>
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/withdrawal" 
            element={
              <ProtectedRoute>
                <ErrorBoundary fallbackTitle="Withdrawal Page Error" showHome={true}>
                  <WithdrawalPage />
                </ErrorBoundary>
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/admin" 
            element={
              <ProtectedRoute requireAdmin>
                <ErrorBoundary fallbackTitle="Admin Dashboard Error" showHome={true}>
                  <AdminDashboard />
                </ErrorBoundary>
              </ProtectedRoute>
            } 
          />
          <Route path="/" element={
            <ErrorBoundary fallbackTitle="Login Error" showHome={false} showRefresh={false}>
              <CFELoginPage />
            </ErrorBoundary>
          } />
          <Route path="/home" element={
            <ErrorBoundary fallbackTitle="Homepage Error" showHome={false} showRefresh={true}>
              <Homepage />
            </ErrorBoundary>
          } />
        </Routes>
      </ErrorBoundary>
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <AppContent />
      </Router>
    </AuthProvider>
  );
}

export default App;
