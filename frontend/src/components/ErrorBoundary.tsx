import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
  fallbackMessage?: string;
  showRefresh?: boolean;
  showHome?: boolean;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log the error to console for debugging
    console.error('🚨 Error Boundary caught an error:', error);
    console.error('🚨 Error Info:', errorInfo);
    
    // You could also log to an error reporting service here
    this.setState({
      hasError: true,
      error,
      errorInfo
    });
  }

  handleRefresh = () => {
    // Reset the error boundary state
    this.setState({ hasError: false, error: undefined, errorInfo: undefined });
    // Reload the page
    window.location.reload();
  };

  handleGoHome = () => {
    // Reset the error boundary state
    this.setState({ hasError: false, error: undefined, errorInfo: undefined });
    // Navigate to home
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      const { 
        fallbackTitle = "Oops! Something went wrong", 
        fallbackMessage = "We're sorry, but something unexpected happened. Please try refreshing the page or contact support if the problem persists.",
        showRefresh = true,
        showHome = true
      } = this.props;

      return (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '400px',
          padding: '2rem',
          background: '#f9fafb',
          borderRadius: '12px',
          border: '1px solid #e5e7eb',
          margin: '1rem',
          textAlign: 'center'
        }}>
          {/* Error Icon */}
          <div style={{
            width: '80px',
            height: '80px',
            background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '1.5rem',
            boxShadow: '0 10px 25px rgba(239, 68, 68, 0.3)'
          }}>
            <AlertTriangle size={40} color="white" />
          </div>

          {/* Error Title */}
          <h2 style={{
            margin: '0 0 1rem 0',
            fontSize: '1.5rem',
            fontWeight: '600',
            color: '#1f2937'
          }}>
            {fallbackTitle}
          </h2>

          {/* Error Message */}
          <p style={{
            margin: '0 0 2rem 0',
            fontSize: '1rem',
            color: '#6b7280',
            maxWidth: '500px',
            lineHeight: '1.6'
          }}>
            {fallbackMessage}
          </p>

          {/* Action Buttons */}
          <div style={{
            display: 'flex',
            gap: '1rem',
            flexWrap: 'wrap',
            justifyContent: 'center'
          }}>
            {showRefresh && (
              <button
                onClick={this.handleRefresh}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '0.75rem 1.5rem',
                  fontSize: '0.9rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                  boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)'
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 6px 20px rgba(59, 130, 246, 0.4)';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(59, 130, 246, 0.3)';
                }}
              >
                <RefreshCw size={16} />
                Refresh Page
              </button>
            )}

            {showHome && (
              <button
                onClick={this.handleGoHome}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '0.75rem 1.5rem',
                  fontSize: '0.9rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                  boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)'
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 6px 20px rgba(16, 185, 129, 0.4)';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(16, 185, 129, 0.3)';
                }}
              >
                <Home size={16} />
                Go Home
              </button>
            )}
          </div>

          {/* Technical Details (Development Only) */}
          {process.env.NODE_ENV === 'development' && this.state.error && (
            <details style={{
              marginTop: '2rem',
              padding: '1rem',
              background: '#fee2e2',
              border: '1px solid #fecaca',
              borderRadius: '8px',
              maxWidth: '600px',
              width: '100%',
              textAlign: 'left'
            }}>
              <summary style={{
                cursor: 'pointer',
                fontWeight: '600',
                color: '#dc2626',
                marginBottom: '0.5rem'
              }}>
                Technical Details (Development)
              </summary>
              <pre style={{
                fontSize: '0.8rem',
                color: '#991b1b',
                whiteSpace: 'pre-wrap',
                margin: 0,
                fontFamily: 'monospace'
              }}>
                {this.state.error.toString()}
                {this.state.errorInfo?.componentStack}
              </pre>
            </details>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;