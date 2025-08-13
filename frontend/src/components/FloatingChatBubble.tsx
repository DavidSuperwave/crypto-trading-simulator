import React, { useState, useEffect } from 'react';
import { MessageCircle, X, User, Shield } from 'lucide-react';
import ChatWidget from './ChatWidget';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { buildApiUrl, API_CONFIG } from '../config/api';

interface ChatMessage {
  id: string;
  senderId: string;
  senderType: 'user' | 'admin';
  senderName: string;
  message: string;
  timestamp: Date;
  isRead: boolean;
}

const FloatingChatBubble: React.FC = () => {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [latestAdminMessage, setLatestAdminMessage] = useState<ChatMessage | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [hasNewMessage, setHasNewMessage] = useState(false);

  // Fetch latest admin message for preview
  const fetchLatestAdminMessage = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token || !user) return;

      const response = await axios.get(buildApiUrl(API_CONFIG.ENDPOINTS.CHAT_MESSAGES), {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.data.success) {
        const messages = response.data.messages;
        // Find the most recent admin message
        const adminMessages = messages.filter((msg: any) => msg.senderType === 'admin');
        if (adminMessages.length > 0) {
          const latest = adminMessages[adminMessages.length - 1];
          setLatestAdminMessage({
            ...latest,
            timestamp: new Date(latest.timestamp)
          });
        }

        // Count unread messages
        const unread = messages.filter((msg: any) => !msg.isRead && msg.senderType === 'admin').length;
        setUnreadCount(unread);
        setHasNewMessage(unread > 0);
      }
    } catch (error) {
      console.error('Error fetching latest admin message:', error);
    }
  };

  useEffect(() => {
    fetchLatestAdminMessage();
    // Refresh every 30 seconds when closed
    const interval = setInterval(() => {
      if (!isOpen) {
        fetchLatestAdminMessage();
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [user, isOpen]);

  const toggleChat = () => {
    setIsOpen(!isOpen);
    if (!isOpen) {
      // When opening, reset new message indicators
      setHasNewMessage(false);
    }
  };

  const formatMessagePreview = (message: string) => {
    if (message.length > 60) {
      return message.substring(0, 60) + '...';
    }
    return message;
  };

  return (
    <>
      {/* Floating Chat Bubble */}
      <div style={{
        position: 'fixed',
        bottom: '24px',
        right: '24px',
        zIndex: 1000
      }}>
        {/* Chat Interface Popup */}
        {isOpen && (
          <div style={{
            position: 'absolute',
            bottom: '80px',
            right: '0',
            width: '400px',
            height: '600px',
            backgroundColor: 'white',
            borderRadius: '16px',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
            border: '1px solid #E5E7EB',
            overflow: 'hidden',
            animation: 'slideUp 0.3s ease-out'
          }}>
            {/* Chat Header */}
            <div style={{
              backgroundColor: '#1F2937',
              color: 'white',
              padding: '1rem',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Shield size={20} />
                <div>
                  <div style={{ fontWeight: '600', fontSize: '1rem' }}>Support Chat</div>
                  <div style={{ fontSize: '0.75rem', opacity: 0.8 }}>We're here to help</div>
                </div>
              </div>
              <button
                onClick={toggleChat}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'white',
                  cursor: 'pointer',
                  padding: '0.25rem',
                  borderRadius: '4px'
                }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Chat Content */}
            <div style={{ height: 'calc(100% - 64px)' }}>
              <ChatWidget isInPopup={true} />
            </div>
          </div>
        )}

        {/* Chat Bubble Button */}
        <div
          onClick={toggleChat}
          style={{
            width: '64px',
            height: '64px',
            backgroundColor: '#3B82F6',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            boxShadow: '0 10px 25px -5px rgba(59, 130, 246, 0.5)',
            transition: 'all 0.3s ease',
            position: 'relative',
            animation: hasNewMessage ? 'pulse 2s infinite' : undefined
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'scale(1.1)';
            e.currentTarget.style.boxShadow = '0 15px 30px -5px rgba(59, 130, 246, 0.6)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'scale(1)';
            e.currentTarget.style.boxShadow = '0 10px 25px -5px rgba(59, 130, 246, 0.5)';
          }}
        >
          {isOpen ? (
            <X size={24} color="white" />
          ) : (
            <MessageCircle size={24} color="white" />
          )}

          {/* Unread Count Badge */}
          {unreadCount > 0 && !isOpen && (
            <div style={{
              position: 'absolute',
              top: '8px',
              right: '8px',
              backgroundColor: '#EF4444',
              color: 'white',
              borderRadius: '50%',
              width: '20px',
              height: '20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '0.75rem',
              fontWeight: '600',
              border: '2px solid white'
            }}>
              {unreadCount > 9 ? '9+' : unreadCount}
            </div>
          )}

          {/* New Message Indicator */}
          {hasNewMessage && !isOpen && (
            <div style={{
              position: 'absolute',
              top: '4px',
              right: '4px',
              width: '12px',
              height: '12px',
              backgroundColor: '#10B981',
              borderRadius: '50%',
              border: '2px solid white',
              animation: 'ping 1s cubic-bezier(0, 0, 0.2, 1) infinite'
            }} />
          )}
        </div>

        {/* Message Preview Tooltip */}
        {!isOpen && latestAdminMessage && hasNewMessage && (
          <div style={{
            position: 'absolute',
            bottom: '80px',
            right: '0',
            backgroundColor: 'white',
            border: '1px solid #E5E7EB',
            borderRadius: '12px',
            padding: '0.75rem',
            maxWidth: '300px',
            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
            animation: 'fadeIn 0.3s ease-out'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: '0.5rem',
              marginBottom: '0.5rem'
            }}>
              <Shield size={16} style={{ color: '#3B82F6', marginTop: '2px' }} />
              <div style={{ flex: 1 }}>
                <div style={{
                  fontWeight: '600',
                  fontSize: '0.875rem',
                  color: '#1F2937',
                  marginBottom: '0.25rem'
                }}>
                  {latestAdminMessage.senderName}
                </div>
                <div style={{
                  fontSize: '0.875rem',
                  color: '#6B7280',
                  lineHeight: '1.4'
                }}>
                  {formatMessagePreview(latestAdminMessage.message)}
                </div>
              </div>
            </div>
            <div style={{
              fontSize: '0.75rem',
              color: '#9CA3AF',
              textAlign: 'right'
            }}>
              {latestAdminMessage.timestamp.toLocaleTimeString([], { 
                hour: '2-digit', 
                minute: '2-digit' 
              })}
            </div>
            
            {/* Tooltip Arrow */}
            <div style={{
              position: 'absolute',
              bottom: '-6px',
              right: '20px',
              width: '12px',
              height: '12px',
              backgroundColor: 'white',
              border: '1px solid #E5E7EB',
              borderTop: 'none',
              borderLeft: 'none',
              transform: 'rotate(45deg)'
            }} />
          </div>
        )}
      </div>

      {/* CSS Animations */}
      <style>
        {`
          @keyframes slideUp {
            from {
              opacity: 0;
              transform: translateY(20px) scale(0.95);
            }
            to {
              opacity: 1;
              transform: translateY(0) scale(1);
            }
          }

          @keyframes fadeIn {
            from {
              opacity: 0;
              transform: translateY(10px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }

          @keyframes pulse {
            0%, 100% {
              background-color: #3B82F6;
            }
            50% {
              background-color: #60A5FA;
            }
          }

          @keyframes ping {
            75%, 100% {
              transform: scale(2);
              opacity: 0;
            }
          }
        `}
      </style>
    </>
  );
};

export default FloatingChatBubble;