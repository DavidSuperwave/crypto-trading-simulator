import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { Send, User, Shield, Phone } from 'lucide-react';
import axios from 'axios';
import { buildApiUrl, API_CONFIG } from '../config/api';
import { useHybridNotifications } from '../hooks/useHybridNotifications';

interface ChatMessage {
  id: string;
  senderId: string;
  senderType: 'user' | 'admin';
  senderName: string;
  message: string;
  timestamp: Date;
  isRead: boolean;
}

interface ChatWidgetProps {
  isInPopup?: boolean;
}

const ChatWidget: React.FC<ChatWidgetProps> = ({ isInPopup = false }) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isTyping] = useState(false); // Ready for typing indicator implementation
  const [unreadCount, setUnreadCount] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Hybrid real-time notifications for new chat messages (WebSocket with polling fallback)
  const { isConnected, statusMessage } = useHybridNotifications({
    onNewChatMessage: (message) => {

      // Convert timestamp to Date object to match interface
      const chatMessage: ChatMessage = {
        ...message,
        timestamp: new Date(message.timestamp)
      };
      
      setMessages(prev => {
        // Check if message already exists to avoid duplicates
        const messageExists = prev.some(m => m.id === chatMessage.id);
        if (messageExists) return prev;
        
        return [...prev, chatMessage];
      });
      
      // Scroll to bottom when new message arrives
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    }
  });

  // Fetch chat messages when user is authenticated
  useEffect(() => {
    if (user) {
      fetchChatMessages();
    }
  }, [user]);

  const fetchChatMessages = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
  
        return;
      }
      
      const response = await axios.get(buildApiUrl(API_CONFIG.ENDPOINTS.CHAT_MESSAGES), {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.data && response.data.messages) {
        const formattedMessages = response.data.messages.map((msg: any) => ({
          ...msg,
          timestamp: new Date(msg.timestamp)
        }));
        setMessages(formattedMessages);
      }
    } catch (error) {
      console.error('Error fetching chat messages:', error);
      // Start with empty chat for new users
      setMessages([]);
    }
  };

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || isLoading) return;

    const messageText = newMessage.trim();
    setNewMessage('');
    setIsLoading(true);

    // Add user message immediately
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      senderId: user?.id || 'user',
      senderType: 'user',
      senderName: user?.email || 'Usuario',
      message: messageText,
      timestamp: new Date(),
      isRead: false
    };

    setMessages(prev => [...prev, userMessage]);

    try {
      // Send message to backend
      const token = localStorage.getItem('token');
      if (!token) {
        alert('Authentication required. Please log in again.');
        return;
      }
      
      await axios.post(buildApiUrl(API_CONFIG.ENDPOINTS.CHAT_SEND), {
        message: messageText,
        recipientType: 'admin'
      }, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      // Refresh messages after sending
      fetchChatMessages();
    } catch (error) {
      console.error('Error sending message:', error);
      alert('Failed to send message. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('es-MX', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: false 
    });
  };

  const markAsRead = () => {
    setUnreadCount(0);
    // In future, this will update read status in backend
  };

  const containerStyle = isInPopup ? {
    height: '100%',
    display: 'flex',
    flexDirection: 'column' as const,
    overflow: 'hidden'
  } : {
    background: 'white',
    borderRadius: '16px',
    boxShadow: '0 4px 6px rgba(0,0,0,0.05)',
    height: '600px',
    display: 'flex',
    flexDirection: 'column' as const,
    overflow: 'hidden'
  };

  return (
    <div style={containerStyle}>
      {/* Chat Header - Only show if not in popup */}
      {!isInPopup && (
      <div style={{
        padding: '1.5rem',
        borderBottom: '1px solid #E5E7EB',
        background: 'linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%)',
        color: 'white'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
          <div style={{
            width: '48px',
            height: '48px',
            borderRadius: '50%',
            background: 'rgba(255, 255, 255, 0.2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            fontSize: '1.2rem'
          }}>
            👤
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: '600', fontSize: '1.1rem' }}>Soporte Altura Capital</div>
            <div style={{ fontSize: '0.8rem', opacity: 0.9 }}>Asistencia al Cliente</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', marginTop: '0.25rem' }}>
              <div style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                background: isConnected ? '#10B981' : '#F59E0B'
              }} />
              <span style={{ fontSize: '0.7rem', opacity: 0.9 }}>{statusMessage}</span>
            </div>
          </div>
          {unreadCount > 0 && (
            <div style={{
              background: '#EF4444',
              color: 'white',
              borderRadius: '50%',
              width: '24px',
              height: '24px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '0.8rem',
              fontWeight: '600'
            }}>
              {unreadCount}
            </div>
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Shield size={16} />
          <span style={{ fontSize: '0.8rem', opacity: 0.9 }}>
            Chat seguro y privado
          </span>
        </div>
      </div>
      )}

      {/* Messages Area */}
      <div 
        style={{
          flex: 1,
          padding: '1rem',
          overflowY: 'auto',
          background: '#F9FAFB'
        }}
        onClick={markAsRead}
      >
        {messages.map((message) => (
          <div
            key={message.id}
            style={{
              display: 'flex',
              justifyContent: message.senderType === 'user' ? 'flex-end' : 'flex-start',
              marginBottom: '1rem'
            }}
          >
            <div style={{
              maxWidth: '75%',
              display: 'flex',
              flexDirection: message.senderType === 'user' ? 'row-reverse' : 'row',
              alignItems: 'flex-end',
              gap: '0.5rem'
            }}>
              {/* Avatar */}
              <div style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                background: message.senderType === 'admin' 
                  ? 'linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%)'
                  : 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                fontSize: '0.8rem',
                flexShrink: 0
              }}>
                {message.senderType === 'admin' ? '👤' : <User size={16} />}
              </div>

              {/* Message Bubble */}
              <div>
                <div style={{
                  background: message.senderType === 'user' 
                    ? 'linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%)'
                    : 'white',
                  color: message.senderType === 'user' ? 'white' : '#1F2937',
                  padding: '0.75rem 1rem',
                  borderRadius: message.senderType === 'user' 
                    ? '16px 16px 4px 16px'
                    : '16px 16px 16px 4px',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                  wordWrap: 'break-word'
                }}>
                  <div style={{ fontSize: '0.9rem', lineHeight: '1.4' }}>
                    {message.message}
                  </div>
                </div>
                <div style={{
                  fontSize: '0.7rem',
                  color: '#6B7280',
                  marginTop: '0.25rem',
                  textAlign: message.senderType === 'user' ? 'right' : 'left'
                }}>
                  {formatTime(message.timestamp)}
                </div>
              </div>
            </div>
          </div>
        ))}

        {/* Typing Indicator */}
        {isTyping && (
          <div style={{
            display: 'flex',
            justifyContent: 'flex-start',
            marginBottom: '1rem'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'flex-end',
              gap: '0.5rem'
            }}>
              <div style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                fontSize: '0.8rem'
              }}>
                👤
              </div>
              <div style={{
                background: 'white',
                padding: '0.75rem 1rem',
                borderRadius: '16px 16px 16px 4px',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
              }}>
                <div style={{
                  display: 'flex',
                  gap: '0.25rem',
                  alignItems: 'center'
                }}>
                  <div style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    background: '#6B7280',
                    animation: 'pulse 1.5s ease-in-out infinite'
                  }} />
                  <div style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    background: '#6B7280',
                    animation: 'pulse 1.5s ease-in-out infinite 0.2s'
                  }} />
                  <div style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    background: '#6B7280',
                    animation: 'pulse 1.5s ease-in-out infinite 0.4s'
                  }} />
                </div>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <div style={{
        padding: '1rem',
        borderTop: '1px solid #E5E7EB',
        background: 'white'
      }}>
        <form onSubmit={handleSendMessage}>
          <div style={{
            display: 'flex',
            gap: '0.75rem',
            alignItems: 'flex-end'
          }}>
            <div style={{ flex: 1 }}>
              <textarea
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Escribe tu mensaje..."
                rows={2}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '2px solid #E5E7EB',
                  borderRadius: '12px',
                  fontSize: '0.9rem',
                  outline: 'none',
                  resize: 'none',
                  boxSizing: 'border-box',
                  fontFamily: 'inherit'
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage(e);
                  }
                }}
              />
            </div>
            <button
              type="submit"
              disabled={!newMessage.trim() || isLoading}
              style={{
                background: !newMessage.trim() || isLoading 
                  ? '#9CA3AF' 
                  : 'linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%)',
                color: 'white',
                border: 'none',
                borderRadius: '12px',
                padding: '0.75rem',
                cursor: !newMessage.trim() || isLoading ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                minWidth: '48px',
                height: '48px',
                transition: 'all 0.2s'
              }}
            >
              <Send size={18} />
            </button>
          </div>
        </form>

        {/* WhatsApp Button - Moved to bottom */}
        <div style={{ marginTop: '1rem' }}>
          <button
            style={{
              width: '100%',
              background: '#25D366',
              color: 'white',
              border: 'none',
              borderRadius: '12px',
              padding: '0.75rem',
              fontSize: '0.9rem',
              fontWeight: '600',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem'
            }}
          >
            <Phone size={16} />
            Escribir por WhatsApp
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatWidget;