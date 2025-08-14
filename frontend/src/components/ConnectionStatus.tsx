import React from 'react';
import { Wifi, WifiOff, AlertCircle } from 'lucide-react';

interface ConnectionStatusProps {
  isConnected: boolean;
  connectionStatus: 'connecting' | 'connected' | 'disconnected' | 'error';
  className?: string;
}

const ConnectionStatus: React.FC<ConnectionStatusProps> = ({ 
  isConnected, 
  connectionStatus, 
  className = '' 
}) => {
  const getStatusIcon = () => {
    switch (connectionStatus) {
      case 'connected':
        return <Wifi style={{ width: '16px', height: '16px', color: '#10b981' }} />;
      case 'connecting':
        return <Wifi style={{ width: '16px', height: '16px', color: '#eab308', animation: 'pulse 2s ease-in-out infinite' }} />;
      case 'error':
        return <AlertCircle style={{ width: '16px', height: '16px', color: '#ef4444' }} />;
      case 'disconnected':
      default:
        return <WifiOff style={{ width: '16px', height: '16px', color: '#9ca3af' }} />;
    }
  };

  const getStatusText = () => {
    switch (connectionStatus) {
      case 'connected':
        return 'Real-time connected';
      case 'connecting':
        return 'Connecting...';
      case 'error':
        return 'Connection error';
      case 'disconnected':
      default:
        return 'Offline';
    }
  };

  const getStatusColor = () => {
    switch (connectionStatus) {
      case 'connected':
        return { color: '#16a34a', backgroundColor: '#f0fdf4', borderColor: '#bbf7d0' };
      case 'connecting':
        return { color: '#ca8a04', backgroundColor: '#fefce8', borderColor: '#fde047' };
      case 'error':
        return { color: '#dc2626', backgroundColor: '#fef2f2', borderColor: '#fecaca' };
      case 'disconnected':
      default:
        return { color: '#4b5563', backgroundColor: '#f9fafb', borderColor: '#e5e7eb' };
    }
  };

  return (
    <div 
      className={className}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '8px',
        padding: '4px 12px',
        borderRadius: '9999px',
        border: '1px solid #d1d5db',
        fontSize: '12px',
        fontWeight: '500',
        ...getStatusColor()
      }}
    >
      {getStatusIcon()}
      <span>{getStatusText()}</span>
    </div>
  );
};

export default ConnectionStatus;