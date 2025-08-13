import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import './App.css';

// Import components
import Homepage from './components/Homepage';
import Login from './components/Login';
import UserDashboard from './components/UserDashboard';
import AdminDashboard from './components/AdminDashboard';
import DemoDashboard from './components/DemoDashboard';
import DemoPage from './components/DemoPage';
import DepositPage from './components/DepositPage';
import PaymentMethodPage from './components/PaymentMethodPage';
import WithdrawalPage from './components/WithdrawalPage';
import SignupPage from './components/SignupPage';

import { AuthProvider, useAuth } from './context/AuthContext';

// Demo route component - only for unauthenticated users or admins
const DemoRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, user, isLoading } = useAuth();
  
  // Don't redirect while still loading
  if (isLoading) {
    return null; // Let the main loading screen handle this
  }
  
  // If user is authenticated and not admin, redirect to their dashboard
  if (isAuthenticated && user?.role !== 'admin') {
    return <Navigate to="/user" replace />;
  }
  
  return <>{children}</>;
};

// Protected route component
const ProtectedRoute: React.FC<{ children: React.ReactNode; requireAdmin?: boolean }> = ({ 
  children, 
  requireAdmin = false 
}) => {
  const { isAuthenticated, user, isLoading } = useAuth();
  
  console.log('🔐 ProtectedRoute check:', { isAuthenticated, isLoading, userRole: user?.role, requireAdmin });
  
  // Don't redirect while still loading
  if (isLoading) {
    console.log('⏳ Auth still loading, showing loading screen');
    return null; // Let the main loading screen handle this
  }
  
  if (!isAuthenticated) {
    console.log('🚫 Not authenticated, redirecting to login');
    return <Navigate to="/login" replace />;
  }
  
  if (requireAdmin && user?.role !== 'admin') {
    console.log('🚫 Admin access denied. User role:', user?.role, 'User:', user);
    return <Navigate to="/user" replace />;
  }
  
  if (requireAdmin) {
    console.log('✅ Admin access granted. User role:', user?.role);
  }
  
  console.log('✅ Access granted, rendering children');
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
  const { isAuthenticated, isLoading } = useAuth();

  // Show loading screen while verifying authentication
  if (isLoading) {
    return <LoadingScreen />;
  }

  return (
    <div className="App">
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/trading-demo" element={<DemoPage />} />
        <Route 
          path="/demo" 
          element={
            <DemoRoute>
              <DemoDashboard />
            </DemoRoute>
          } 
        />
        <Route 
          path="/user" 
          element={
            <ProtectedRoute>
              <UserDashboard />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/deposit" 
          element={
            <ProtectedRoute>
              <DepositPage />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/payment-method" 
          element={
            <ProtectedRoute>
              <PaymentMethodPage />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/withdrawal" 
          element={
            <ProtectedRoute>
              <WithdrawalPage />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/admin" 
          element={
            <ProtectedRoute requireAdmin>
              <AdminDashboard />
            </ProtectedRoute>
          } 
        />
        <Route path="/" element={<Homepage />} />
      </Routes>
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
