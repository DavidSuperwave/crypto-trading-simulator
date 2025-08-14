import React from 'react';
import { Bell, BellRing } from 'lucide-react';

interface NotificationBadgeProps {
  count: number;
  onClick?: () => void;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

const NotificationBadge: React.FC<NotificationBadgeProps> = ({ 
  count, 
  onClick, 
  className = '',
  size = 'md'
}) => {
  const sizeClasses = {
    sm: { width: '24px', height: '24px' },
    md: { width: '32px', height: '32px' }, 
    lg: { width: '40px', height: '40px' }
  };

  const iconSizeClasses = {
    sm: { width: '12px', height: '12px' },
    md: { width: '16px', height: '16px' },
    lg: { width: '20px', height: '20px' }
  };

  const badgeSizeClasses = {
    sm: { fontSize: '12px', minWidth: '16px', height: '16px' },
    md: { fontSize: '12px', minWidth: '18px', height: '20px' },
    lg: { fontSize: '14px', minWidth: '20px', height: '24px' }
  };

  const hasNotifications = count > 0;

  return (
    <div 
      className={className}
      style={{ position: 'relative', display: 'inline-flex' }}
    >
      <button
        onClick={onClick}
        style={{
          ...sizeClasses[size],
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: '9999px',
          transition: 'colors 0.2s',
          backgroundColor: hasNotifications ? '#dbeafe' : '#f3f4f6',
          color: hasNotifications ? '#2563eb' : '#9ca3af',
          border: 'none',
          cursor: 'pointer'
        }}
        title={hasNotifications ? `${count} unread notification${count > 1 ? 's' : ''}` : 'No notifications'}
      >
        {hasNotifications ? (
          <BellRing 
            style={{
              ...iconSizeClasses[size],
              animation: 'pulse 2s ease-in-out infinite'
            }} 
          />
        ) : (
          <Bell style={iconSizeClasses[size]} />
        )}
      </button>
      
      {hasNotifications && (
        <span 
          style={{
            position: 'absolute',
            top: '-4px',
            right: '-4px',
            ...badgeSizeClasses[size],
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            paddingLeft: '4px',
            paddingRight: '4px',
            backgroundColor: '#ef4444',
            color: 'white',
            borderRadius: '9999px',
            fontWeight: 'bold',
            lineHeight: 'none'
          }}
        >
          {count > 99 ? '99+' : count}
        </span>
      )}
    </div>
  );
};

export default NotificationBadge;