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
    sm: 'w-6 h-6',
    md: 'w-8 h-8', 
    lg: 'w-10 h-10'
  };

  const iconSizeClasses = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-5 h-5'
  };

  const badgeSizeClasses = {
    sm: 'text-xs min-w-[16px] h-4',
    md: 'text-xs min-w-[18px] h-5',
    lg: 'text-sm min-w-[20px] h-6'
  };

  const hasNotifications = count > 0;

  return (
    <div className={`relative inline-flex ${className}`}>
      <button
        onClick={onClick}
        className={`${sizeClasses[size]} flex items-center justify-center rounded-full transition-colors duration-200 ${
          hasNotifications 
            ? 'bg-blue-100 text-blue-600 hover:bg-blue-200' 
            : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
        }`}
        title={hasNotifications ? `${count} unread notification${count > 1 ? 's' : ''}` : 'No notifications'}
      >
        {hasNotifications ? (
          <BellRing className={`${iconSizeClasses[size]} animate-pulse`} />
        ) : (
          <Bell className={iconSizeClasses[size]} />
        )}
      </button>
      
      {hasNotifications && (
        <span 
          className={`absolute -top-1 -right-1 ${badgeSizeClasses[size]} flex items-center justify-center px-1 bg-red-500 text-white rounded-full font-bold leading-none`}
        >
          {count > 99 ? '99+' : count}
        </span>
      )}
    </div>
  );
};

export default NotificationBadge;