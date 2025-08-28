import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  Calendar,
  DollarSign,
  Clock,
  CheckCircle2,
  PiggyBank,
  ArrowUp
} from 'lucide-react';
import { buildApiUrl } from '../config/api';
import axios from 'axios';

// Add CSS to hide scrollbar
const scrollbarStyles = `
  .hide-scrollbar::-webkit-scrollbar {
    display: none;
  }
  .hide-scrollbar {
    -ms-overflow-style: none;
    scrollbar-width: none;
  }
`;

interface DailyPayout {
  day: number;
  date: string;
  amount: number;
  status: 'pending' | 'paid';
  paidAt: string | null;
  notificationSent: boolean;
}

interface PayoutData {
  currentMonth: {
    monthNumber: number;
    monthName: string;
    totalTarget: number;
    totalPaid: number;
    remainingTarget: number;
    dailyPayouts: DailyPayout[];
  };
  todaysPayout: DailyPayout | null;
  allPayouts: DailyPayout[];
}

const DailyPayout: React.FC = () => {
  const [payoutData, setPayoutData] = useState<PayoutData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isMobile, setIsMobile] = useState(false);

  // Mobile detection and style injection
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    
    handleResize();
    window.addEventListener('resize', handleResize);
    
    // Safely inject styles
    if (typeof document !== 'undefined' && !document.head.querySelector('style[data-hide-scrollbar]')) {
      const styleSheet = document.createElement('style');
      styleSheet.type = 'text/css';
      styleSheet.innerText = scrollbarStyles;
      styleSheet.setAttribute('data-hide-scrollbar', 'true');
      document.head.appendChild(styleSheet);
    }
    
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Fetch payout data
  const fetchPayoutData = async () => {
    try {
      // Check if localStorage is available (may not be on some mobile browsers)
      if (typeof Storage === 'undefined') {
        setError('Browser storage not supported');
        return;
      }

      const token = localStorage.getItem('token');
      if (!token) {
        setError('Authentication required');
        return;
      }

      const response = await axios.get(buildApiUrl('/compound-interest/daily-payouts'), {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        setPayoutData(response.data.payouts);
        setError(null);
      } else {
        setError(response.data.message || 'Failed to load payout data');
      }
    } catch (err: any) {
      console.error('Error fetching payout data:', err);
      setError(err.response?.data?.message || 'Failed to load payout data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayoutData();
    
    // Refresh every 5 minutes
    const interval = setInterval(fetchPayoutData, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric'
    });
  };

  const getProgressPercentage = (): number => {
    if (!payoutData?.currentMonth) return 0;
    return (payoutData.currentMonth.totalPaid / payoutData.currentMonth.totalTarget) * 100;
  };

  if (loading) {
    return (
      <div style={{
        background: 'white',
        borderRadius: isMobile ? '16px' : '20px',
        padding: isMobile ? '1.5rem' : '2rem',
        height: isMobile ? 'auto' : '100%',
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05)',
        border: '1px solid #e5e7eb',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '400px'
      }}>
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '1rem',
          fontSize: '1.1rem',
          color: '#6b7280'
        }}>
          <PiggyBank 
            style={{ animation: 'pulse 2s ease-in-out infinite' }} 
            size={24} 
          />
          Loading payout data...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{
        background: 'white',
        borderRadius: isMobile ? '16px' : '20px',
        padding: isMobile ? '1.5rem' : '2rem',
        height: isMobile ? 'auto' : '100%',
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05)',
        border: '1px solid #fee2e2',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '400px'
      }}>
        <div style={{ textAlign: 'center', color: '#dc2626' }}>
          <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>⚠️</div>
          <div style={{ fontSize: '1.1rem', fontWeight: '600' }}>{error}</div>
        </div>
      </div>
    );
  }

  if (!payoutData) {
    return (
      <div style={{
        background: 'white',
        borderRadius: isMobile ? '16px' : '20px',
        padding: isMobile ? '1.5rem' : '2rem',
        height: isMobile ? 'auto' : '100%',
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05)',
        border: '1px solid #e5e7eb',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '400px'
      }}>
        <div style={{ textAlign: 'center', color: '#6b7280' }}>
          <div style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>📊</div>
          <div>No payout data available</div>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      background: 'white',
      borderRadius: isMobile ? '16px' : '20px',
      padding: isMobile ? '1.5rem' : '2rem',
      height: isMobile ? 'auto' : '100%',
      boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05)',
      border: '1px solid #e5e7eb',
      display: 'flex',
      flexDirection: 'column',
      gap: isMobile ? '1.5rem' : '2rem'
    }}>
      {/* Header */}
      <div>
        <h2 style={{ 
          margin: '0 0 0.5rem 0', 
          color: '#1f2937', 
          fontSize: isMobile ? '1.4rem' : '1.6rem',
          fontWeight: '700',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem'
        }}>
          <img 
            src="/cfe-logo-official.png" 
            alt="CFE Logo" 
            style={{ 
              width: isMobile ? '40px' : '50px', 
              height: isMobile ? '16px' : '20px',
              objectFit: 'contain'
            }} 
          />
          Daily Payouts
        </h2>
        <p style={{ margin: 0, color: '#6b7280', fontSize: '0.9rem' }}>
          {payoutData.currentMonth.monthName} • CFE Trading Returns
        </p>
      </div>

      {/* Portfolio Balance */}
      <div style={{
        background: 'linear-gradient(135deg, #008E60 0%, #10b981 100%)',
        borderRadius: isMobile ? '12px' : '16px',
        padding: isMobile ? '1.25rem' : '1.5rem',
        color: 'white'
      }}>
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between',
          marginBottom: '1rem'
        }}>
          <div style={{ 
            fontSize: '0.9rem', 
            opacity: 0.9,
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            <PiggyBank size={16} />
            Total Portfolio Balance
          </div>
        </div>
        
        <div style={{ 
          fontSize: isMobile ? '2rem' : '2.5rem', 
          fontWeight: '800',
          lineHeight: 1,
          marginBottom: '0.5rem'
        }}>
          {formatCurrency(1000 + payoutData.currentMonth.totalPaid)}
        </div>
        
        <div style={{ fontSize: '0.85rem', opacity: 0.8 }}>
          $1,000.00 deposited + {formatCurrency(payoutData.currentMonth.totalPaid)} earned
        </div>
      </div>

      {/* Earnings Growth Chart */}
      <div>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          marginBottom: '1rem'
        }}>
          <h3 style={{ margin: 0, color: '#1f2937', fontSize: '1.1rem', fontWeight: '600' }}>
            Earnings Growth
          </h3>
        </div>
        
        <div style={{
          background: '#f9fafb',
          borderRadius: '12px',
          padding: '1.5rem',
          paddingLeft: '4rem',
          border: '1px solid #e5e7eb'
        }}>
          <div style={{ position: 'relative', height: '200px', width: '100%' }}>
            <svg width="100%" height="100%" viewBox="0 0 400 150" style={{ overflow: 'visible' }}>
              {/* Grid lines */}
              {[0, 30, 60, 90, 120, 150].map(y => (
                <line
                  key={y}
                  x1="0"
                  y1={y}
                  x2="400"
                  y2={y}
                  stroke="#e5e7eb"
                  strokeWidth="0.5"
                />
              ))}
              {[0, 100, 200, 300, 400].map(x => (
                <line
                  key={x}
                  x1={x}
                  y1="0"
                  x2={x}
                  y2="150"
                  stroke="#e5e7eb"
                  strokeWidth="0.5"
                />
              ))}
              
              {/* Projected earnings line (target) */}
              <path
                d="M 0,150 L 400,0"
                fill="none"
                stroke="#9ca3af"
                strokeWidth="2"
                strokeDasharray="5,5"
                opacity="0.7"
              />
              
              {/* Actual earnings line */}
              <path
                d={(() => {
                  let cumulativeEarnings = 0;
                  const monthlyTarget = payoutData.currentMonth.totalTarget;
                  const daysInMonth = payoutData.currentMonth.dailyPayouts.length;
                  
                  const points = payoutData.currentMonth.dailyPayouts.map((payout, index) => {
                    if (payout.status === 'paid') {
                      cumulativeEarnings += payout.amount;
                    }
                    
                    const x = (index / (daysInMonth - 1)) * 400;
                    const y = 150 - (cumulativeEarnings / monthlyTarget) * 150;
                    
                    return `${x},${Math.max(0, y)}`;
                  });
                  
                  return `M ${points.join(' L ')}`;
                })()}
                fill="none"
                stroke="#10b981"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              
              {/* Current position dot */}
              <circle
                cx={(() => {
                  const paidDays = payoutData.currentMonth.dailyPayouts.filter(p => p.status === 'paid').length;
                  const daysInMonth = payoutData.currentMonth.dailyPayouts.length;
                  return (paidDays / daysInMonth) * 400;
                })()}
                cy={(() => {
                  const progress = getProgressPercentage() / 100;
                  return 150 - (progress * 150);
                })()}
                r="4"
                fill="#10b981"
                stroke="white"
                strokeWidth="2"
              />
            </svg>
            
            {/* Y-axis labels */}
            <div style={{ position: 'absolute', left: '-3rem', top: '0', height: '150px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', fontSize: '0.75rem', color: '#6b7280', textAlign: 'right' }}>
              <span>${Math.round(payoutData.currentMonth.totalTarget)}</span>
              <span>${Math.round(payoutData.currentMonth.totalTarget * 0.5)}</span>
              <span>$0</span>
            </div>
            
            {/* X-axis labels */}
            <div style={{ position: 'absolute', top: '160px', width: '100%', display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: '#6b7280' }}>
              <span>Day 1</span>
              <span>Day 15</span>
              <span>Day 31</span>
            </div>
          </div>
          
          {/* Legend */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: '2rem', marginTop: '1rem', fontSize: '0.8rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <div style={{ width: '16px', height: '2px', background: '#10b981' }}></div>
              <span style={{ color: '#6b7280' }}>Actual Earnings</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <div style={{ width: '16px', height: '2px', background: '#9ca3af', backgroundImage: 'repeating-linear-gradient(90deg, transparent, transparent 3px, white 3px, white 5px)' }}></div>
              <span style={{ color: '#6b7280' }}>Target Projection</span>
            </div>
          </div>
        </div>
      </div>
      
      {/* Progress Stats */}
      <div style={{
        width: '100%'
      }}>
        <div style={{
          background: '#f9fafb',
          borderRadius: '10px',
          padding: '1.5rem',
          textAlign: 'center',
          width: '100%'
        }}>
          <div style={{ 
            fontSize: '0.8rem', 
            color: '#6b7280',
            marginBottom: '0.5rem',
            textTransform: 'uppercase',
            fontWeight: '500',
            letterSpacing: '0.5px'
          }}>
            Earned This Month
          </div>
          <div style={{ 
            fontSize: isMobile ? '1.6rem' : '1.8rem', 
            fontWeight: '700', 
            color: '#10b981'
          }}>
            {formatCurrency(payoutData.currentMonth.totalPaid)}
          </div>
        </div>
      </div>

      {/* All Monthly Payouts */}
      {payoutData.allPayouts && payoutData.allPayouts.length > 0 && (
        <div>
          <h3 style={{ 
            margin: '0 0 1rem 0', 
            color: '#1f2937', 
            fontSize: '1.1rem', 
            fontWeight: '600'
          }}>
            Monthly Payout Schedule
          </h3>
          
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '0.5rem',
            maxHeight: '300px',
            overflowY: 'auto',
            background: '#f9fafb',
            borderRadius: '8px',
            padding: '1rem',
            // Hide scrollbar but keep functionality
            scrollbarWidth: 'none', // Firefox
            msOverflowStyle: 'none' // IE/Edge
          }}
          className="hide-scrollbar"
          >
            {payoutData.allPayouts
              .filter((payout: DailyPayout) => {
                // Use local timezone for filtering
                const today = new Date();
                const localToday = new Date(today.getTime() - (today.getTimezoneOffset() * 60000))
                  .toISOString().split('T')[0];
                // Only show dates that are today or in the past (local time)
                return payout.date <= localToday;
              })
              .map((payout: DailyPayout) => (
              <div
                key={payout.date}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '0.5rem 0.75rem',
                  background: payout.status === 'paid' ? '#f0fdf4' : '#ffffff',
                  borderRadius: '6px',
                  border: `1px solid ${payout.status === 'paid' ? '#bbf7d0' : '#e5e7eb'}`,
                  opacity: payout.status === 'pending' ? 0.7 : 1
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  {payout.status === 'paid' ? (
                    <CheckCircle2 size={14} style={{ color: '#10b981' }} />
                  ) : (
                    <Clock size={14} style={{ color: '#6b7280' }} />
                  )}
                  <span style={{ 
                    fontSize: '0.85rem', 
                    color: '#1f2937',
                    fontWeight: '500'
                  }}>
                    Aug {payout.day}
                  </span>
                </div>
                
                <div style={{
                  fontSize: '0.85rem',
                  fontWeight: '600',
                  color: payout.status === 'paid' ? '#10b981' : '#6b7280'
                }}>
                  {formatCurrency(payout.amount)}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default DailyPayout;
