import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { TrendingUp, TrendingDown, Users, DollarSign, Activity, ArrowRight, User } from 'lucide-react';
import axios from 'axios';

interface DemoStats {
  totalUsers: number;
  totalBalance: number;
  avgDailyReturn: number;
  successfulTrades: number;
  aiAccuracy: number;
  activeTraders: number;
}

interface TradingData {
  time: string;
  price: number;
  volume: number;
  prediction: number;
  accuracy: number;
}

interface Trade {
  id: number;
  symbol: string;
  type: string;
  amount: number;
  price: number;
  profit: number;
  timestamp: string;
}

const DemoDashboard: React.FC = () => {
  const [stats, setStats] = useState<DemoStats | null>(null);
  const [tradingData, setTradingData] = useState<TradingData[]>([]);
  const [recentTrades, setRecentTrades] = useState<Trade[]>([]);
  const [showDemoForm, setShowDemoForm] = useState(false);
  const [demoForm, setDemoForm] = useState({
    name: '',
    email: '',
    company: '',
    phone: '',
    message: ''
  });

  useEffect(() => {
    fetchDemoData();
    const interval = setInterval(fetchDemoData, 30000); // Update every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const fetchDemoData = async () => {
    try {
      const [statsRes, tradingRes, tradesRes] = await Promise.all([
        axios.get('http://localhost:5001/api/demo/stats'),
        axios.get('http://localhost:5001/api/demo/trading-data'),
        axios.get('http://localhost:5001/api/demo/recent-trades')
      ]);

      setStats(statsRes.data);
      setTradingData(tradingRes.data);
      setRecentTrades(tradesRes.data);
    } catch (error) {
      console.error('Failed to fetch demo data:', error);
    }
  };

  const handleDemoRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await axios.post('http://localhost:5001/api/demo/request', demoForm);
      alert('Demo request submitted successfully! We will contact you soon.');
      setDemoForm({ name: '', email: '', company: '', phone: '', message: '' });
      setShowDemoForm(false);
    } catch (error) {
      alert('Failed to submit demo request. Please try again.');
    }
  };

  if (!stats) {
    return (
      <div style={{ 
        minHeight: '100vh', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
      }}>
        <div style={{ color: 'white', fontSize: '1.2rem' }}>Loading demo data...</div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc' }}>
      {/* Hero Section */}
      <div style={{
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white',
        padding: '4rem 2rem',
        textAlign: 'center'
      }}>
        <h1 style={{ fontSize: '3rem', margin: '0 0 1rem 0', fontWeight: 'bold' }}>
          🚀 CryptoSim AI
        </h1>
        <p style={{ fontSize: '1.2rem', margin: '0 0 2rem 0', opacity: 0.9 }}>
          Experience the future of AI-powered cryptocurrency trading
        </p>
        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
          <button
            onClick={() => setShowDemoForm(true)}
            style={{
              background: 'white',
              color: '#667eea',
              border: 'none',
              padding: '12px 24px',
              borderRadius: '8px',
              fontSize: '16px',
              fontWeight: '600',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}
          >
            Request Demo <ArrowRight size={16} />
          </button>
          <Link 
            to="/login"
            style={{
              background: 'rgba(255,255,255,0.2)',
              color: 'white',
              border: '2px solid white',
              padding: '12px 24px',
              borderRadius: '8px',
              fontSize: '16px',
              fontWeight: '600',
              textDecoration: 'none',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}
          >
            Get Started <User size={16} />
          </Link>
        </div>
      </div>

      {/* Stats Grid */}
      <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
          gap: '1.5rem',
          marginBottom: '2rem'
        }}>
          <div style={{ background: 'white', padding: '1.5rem', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
              <Users size={20} style={{ color: '#667eea' }} />
              <span style={{ fontSize: '0.9rem', color: '#666' }}>Total Users</span>
            </div>
            <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#333' }}>
              {stats.totalUsers.toLocaleString()}
            </div>
          </div>

          <div style={{ background: 'white', padding: '1.5rem', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
              <DollarSign size={20} style={{ color: '#10b981' }} />
              <span style={{ fontSize: '0.9rem', color: '#666' }}>Total Balance</span>
            </div>
            <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#333' }}>
              ${stats.totalBalance.toLocaleString()}
            </div>
          </div>

          <div style={{ background: 'white', padding: '1.5rem', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
              <TrendingUp size={20} style={{ color: '#f59e0b' }} />
              <span style={{ fontSize: '0.9rem', color: '#666' }}>Avg Daily Return</span>
            </div>
            <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#333' }}>
              {stats.avgDailyReturn}%
            </div>
          </div>

          <div style={{ background: 'white', padding: '1.5rem', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
              <Activity size={20} style={{ color: '#8b5cf6' }} />
              <span style={{ fontSize: '0.9rem', color: '#666' }}>AI Accuracy</span>
            </div>
            <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#333' }}>
              {stats.aiAccuracy}%
            </div>
          </div>
        </div>

        {/* Trading Chart */}
        <div style={{ 
          background: 'white', 
          padding: '2rem', 
          borderRadius: '12px', 
          boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
          marginBottom: '2rem'
        }}>
          <h3 style={{ margin: '0 0 1.5rem 0', color: '#333' }}>Live Trading Performance</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={tradingData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="time" 
                tickFormatter={(time) => new Date(time).toLocaleTimeString()}
              />
              <YAxis />
              <Tooltip 
                labelFormatter={(time) => new Date(time).toLocaleString()}
                formatter={(value, name) => [
                  name === 'price' ? `$${value}` : `$${value}`,
                  name === 'price' ? 'Actual Price' : 'AI Prediction'
                ]}
              />
              <Line type="monotone" dataKey="price" stroke="#667eea" strokeWidth={2} />
              <Line type="monotone" dataKey="prediction" stroke="#10b981" strokeWidth={2} strokeDasharray="5 5" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Recent Trades */}
        <div style={{ 
          background: 'white', 
          padding: '2rem', 
          borderRadius: '12px', 
          boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
        }}>
          <h3 style={{ margin: '0 0 1.5rem 0', color: '#333' }}>Recent AI Trades</h3>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#f8fafc' }}>
                  <th style={{ padding: '12px', textAlign: 'left', color: '#666' }}>Symbol</th>
                  <th style={{ padding: '12px', textAlign: 'left', color: '#666' }}>Type</th>
                  <th style={{ padding: '12px', textAlign: 'left', color: '#666' }}>Amount</th>
                  <th style={{ padding: '12px', textAlign: 'left', color: '#666' }}>Price</th>
                  <th style={{ padding: '12px', textAlign: 'left', color: '#666' }}>Profit</th>
                  <th style={{ padding: '12px', textAlign: 'left', color: '#666' }}>Time</th>
                </tr>
              </thead>
              <tbody>
                {recentTrades.map((trade) => (
                  <tr key={trade.id} style={{ borderBottom: '1px solid #eee' }}>
                    <td style={{ padding: '12px', fontWeight: '600' }}>{trade.symbol}</td>
                    <td style={{ padding: '12px' }}>
                      <span style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.25rem',
                        color: trade.type === 'BUY' ? '#10b981' : '#ef4444'
                      }}>
                        {trade.type === 'BUY' ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                        {trade.type}
                      </span>
                    </td>
                    <td style={{ padding: '12px' }}>{trade.amount}</td>
                    <td style={{ padding: '12px' }}>${trade.price.toLocaleString()}</td>
                    <td style={{ padding: '12px', color: '#10b981', fontWeight: '600' }}>
                      +${trade.profit.toFixed(2)}
                    </td>
                    <td style={{ padding: '12px', color: '#666', fontSize: '0.9rem' }}>
                      {new Date(trade.timestamp).toLocaleTimeString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Demo Request Modal */}
      {showDemoForm && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '2rem'
        }}>
          <div style={{
            background: 'white',
            padding: '2rem',
            borderRadius: '12px',
            width: '100%',
            maxWidth: '500px',
            maxHeight: '90vh',
            overflowY: 'auto'
          }}>
            <h3 style={{ margin: '0 0 1.5rem 0', color: '#333' }}>Request a Demo</h3>
            <form onSubmit={handleDemoRequest}>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', color: '#333', fontWeight: '500' }}>
                  Name *
                </label>
                <input
                  type="text"
                  value={demoForm.name}
                  onChange={(e) => setDemoForm({ ...demoForm, name: e.target.value })}
                  required
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '2px solid #e1e5e9',
                    borderRadius: '8px',
                    fontSize: '16px',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', color: '#333', fontWeight: '500' }}>
                  Email *
                </label>
                <input
                  type="email"
                  value={demoForm.email}
                  onChange={(e) => setDemoForm({ ...demoForm, email: e.target.value })}
                  required
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '2px solid #e1e5e9',
                    borderRadius: '8px',
                    fontSize: '16px',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', color: '#333', fontWeight: '500' }}>
                  Company
                </label>
                <input
                  type="text"
                  value={demoForm.company}
                  onChange={(e) => setDemoForm({ ...demoForm, company: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '2px solid #e1e5e9',
                    borderRadius: '8px',
                    fontSize: '16px',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', color: '#333', fontWeight: '500' }}>
                  Phone
                </label>
                <input
                  type="tel"
                  value={demoForm.phone}
                  onChange={(e) => setDemoForm({ ...demoForm, phone: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '2px solid #e1e5e9',
                    borderRadius: '8px',
                    fontSize: '16px',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', color: '#333', fontWeight: '500' }}>
                  Message
                </label>
                <textarea
                  value={demoForm.message}
                  onChange={(e) => setDemoForm({ ...demoForm, message: e.target.value })}
                  rows={3}
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '2px solid #e1e5e9',
                    borderRadius: '8px',
                    fontSize: '16px',
                    outline: 'none',
                    resize: 'vertical',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              <div style={{ display: 'flex', gap: '1rem' }}>
                <button
                  type="submit"
                  style={{
                    flex: 1,
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    color: 'white',
                    border: 'none',
                    padding: '12px',
                    borderRadius: '8px',
                    fontSize: '16px',
                    fontWeight: '600',
                    cursor: 'pointer'
                  }}
                >
                  Submit Request
                </button>
                <button
                  type="button"
                  onClick={() => setShowDemoForm(false)}
                  style={{
                    flex: 1,
                    background: '#f3f4f6',
                    color: '#374151',
                    border: 'none',
                    padding: '12px',
                    borderRadius: '8px',
                    fontSize: '16px',
                    fontWeight: '600',
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default DemoDashboard;