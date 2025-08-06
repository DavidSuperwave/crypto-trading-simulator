import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import './App.css';

// Import components
import Login from './components/Login';
import UserDashboard from './components/UserDashboard';
import AdminDashboard from './components/AdminDashboard';
import DemoDashboard from './components/DemoDashboard';
import DepositPage from './components/DepositPage';
import PaymentMethodPage from './components/PaymentMethodPage';
import WithdrawalPage from './components/WithdrawalPage';

import { AuthProvider, useAuth } from './context/AuthContext';

// Demo route component - only for unauthenticated users or admins
const DemoRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, user } = useAuth();
  
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
  const { isAuthenticated, user } = useAuth();
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  if (requireAdmin && user?.role !== 'admin') {
    return <Navigate to="/user" replace />;
  }
  
  return <>{children}</>;
};

function AppContent() {
  const { isAuthenticated } = useAuth();

  return (
    <div className="App">
      <Routes>
        <Route path="/login" element={<Login />} />
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
        <Route path="/" element={<Navigate to="/demo" replace />} />
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
