import React from 'react';
import { Link } from 'react-router-dom';
import { Play, ArrowRight, TrendingUp, Shield, Zap } from 'lucide-react';

const Homepage: React.FC = () => {
  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '2rem',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Background Animation */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        background: 'url("data:image/svg+xml,%3Csvg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="none" fill-rule="evenodd"%3E%3Cg fill="%23ffffff" fill-opacity="0.05"%3E%3Ccircle cx="30" cy="30" r="1"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")',
        animation: 'float 20s ease-in-out infinite'
      }} />

      <style>
        {`
          @keyframes float {
            0%, 100% { transform: translateY(0px) rotate(0deg); }
            50% { transform: translateY(-20px) rotate(180deg); }
          }
          
          @keyframes fadeInUp {
            0% {
              opacity: 0;
              transform: translateY(30px);
            }
            100% {
              opacity: 1;
              transform: translateY(0);
            }
          }
          
          @keyframes fadeInLeft {
            0% {
              opacity: 0;
              transform: translateX(-30px);
            }
            100% {
              opacity: 1;
              transform: translateX(0);
            }
          }
          
          @keyframes fadeInRight {
            0% {
              opacity: 0;
              transform: translateX(30px);
            }
            100% {
              opacity: 1;
              transform: translateX(0);
            }
          }
          
          .btn-hover:hover {
            transform: translateY(-2px);
            box-shadow: 0 10px 25px rgba(0,0,0,0.2);
          }
          
          .feature-card:hover {
            transform: translateY(-5px);
            box-shadow: 0 15px 30px rgba(255,255,255,0.15);
          }
        `}
      </style>

      <div style={{
        background: 'rgba(255, 255, 255, 0.95)',
        backdropFilter: 'blur(20px)',
        borderRadius: '24px',
        padding: '3rem',
        textAlign: 'center',
        maxWidth: '900px',
        width: '100%',
        boxShadow: '0 25px 50px rgba(0,0,0,0.15)',
        border: '1px solid rgba(255, 255, 255, 0.2)',
        position: 'relative',
        zIndex: 1
      }}>
        {/* Header */}
        <div style={{
          animation: 'fadeInUp 0.8s ease-out'
        }}>
          <h1 style={{ 
            margin: '0 0 1rem 0', 
            color: '#1f2937', 
            fontSize: 'clamp(2.5rem, 5vw, 4rem)',
            fontWeight: '800',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            lineHeight: '1.1'
          }}>
            🚀 CryptoSim AI
          </h1>
          <p style={{ 
            color: '#6b7280', 
            fontSize: 'clamp(1.1rem, 2.5vw, 1.3rem)', 
            marginBottom: '2.5rem',
            lineHeight: '1.6',
            maxWidth: '600px',
            margin: '0 auto 2.5rem auto'
          }}>
            The ultimate AI-powered crypto trading simulator. Practice, learn, and master cryptocurrency trading without any risk.
          </p>
        </div>
        
        {/* Action Buttons */}
        <div style={{ 
          display: 'flex', 
          gap: '1rem', 
          justifyContent: 'center',
          flexWrap: 'wrap',
          marginBottom: '3rem',
          animation: 'fadeInUp 0.8s ease-out 0.2s both'
        }}>
          <Link 
            to="/signup" 
            className="btn-hover"
            style={{
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
              padding: '16px 32px',
              borderRadius: '12px',
              textDecoration: 'none',
              fontWeight: '600',
              fontSize: '16px',
              transition: 'all 0.3s ease',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              border: 'none',
              cursor: 'pointer',
              minWidth: '160px',
              justifyContent: 'center'
            }}
          >
            Get Started <ArrowRight size={18} />
          </Link>
          
          <Link 
            to="/login" 
            className="btn-hover"
            style={{
              background: 'white',
              color: '#667eea',
              padding: '16px 32px',
              borderRadius: '12px',
              textDecoration: 'none',
              fontWeight: '600',
              fontSize: '16px',
              border: '2px solid #667eea',
              transition: 'all 0.3s ease',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              minWidth: '160px',
              justifyContent: 'center'
            }}
          >
            Sign In
          </Link>
          
          <Link 
            to="/demo" 
            className="btn-hover"
            style={{
              background: 'transparent',
              color: '#667eea',
              padding: '16px 32px',
              borderRadius: '12px',
              textDecoration: 'none',
              fontWeight: '600',
              fontSize: '16px',
              border: '2px solid transparent',
              transition: 'all 0.3s ease',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              minWidth: '160px',
              justifyContent: 'center'
            }}
          >
            <Play size={18} /> Try Demo
          </Link>
        </div>
        
        {/* Feature Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
          gap: '1.5rem',
          marginBottom: '2rem'
        }}>
          <div 
            className="feature-card"
            style={{
              background: 'rgba(102, 126, 234, 0.1)',
              padding: '1.5rem',
              borderRadius: '16px',
              transition: 'all 0.3s ease',
              animation: 'fadeInLeft 0.8s ease-out 0.4s both'
            }}
          >
            <div style={{
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              width: '48px',
              height: '48px',
              borderRadius: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1rem auto'
            }}>
              <TrendingUp size={24} color="white" />
            </div>
            <h3 style={{
              color: '#1f2937',
              fontSize: '18px',
              fontWeight: '600',
              marginBottom: '0.5rem'
            }}>
              AI-Powered Trading
            </h3>
            <p style={{
              color: '#6b7280',
              fontSize: '14px',
              lineHeight: '1.5',
              margin: 0
            }}>
              Advanced algorithms simulate real market conditions and generate realistic trading opportunities
            </p>
          </div>

          <div 
            className="feature-card"
            style={{
              background: 'rgba(16, 185, 129, 0.1)',
              padding: '1.5rem',
              borderRadius: '16px',
              transition: 'all 0.3s ease',
              animation: 'fadeInUp 0.8s ease-out 0.6s both'
            }}
          >
            <div style={{
              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              width: '48px',
              height: '48px',
              borderRadius: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1rem auto'
            }}>
              <Shield size={24} color="white" />
            </div>
            <h3 style={{
              color: '#1f2937',
              fontSize: '18px',
              fontWeight: '600',
              marginBottom: '0.5rem'
            }}>
              Risk-Free Learning
            </h3>
            <p style={{
              color: '#6b7280',
              fontSize: '14px',
              lineHeight: '1.5',
              margin: 0
            }}>
              Practice with virtual money and learn from mistakes without financial consequences
            </p>
          </div>

          <div 
            className="feature-card"
            style={{
              background: 'rgba(245, 158, 11, 0.1)',
              padding: '1.5rem',
              borderRadius: '16px',
              transition: 'all 0.3s ease',
              animation: 'fadeInRight 0.8s ease-out 0.8s both'
            }}
          >
            <div style={{
              background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
              width: '48px',
              height: '48px',
              borderRadius: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1rem auto'
            }}>
              <Zap size={24} color="white" />
            </div>
            <h3 style={{
              color: '#1f2937',
              fontSize: '18px',
              fontWeight: '600',
              marginBottom: '0.5rem'
            }}>
              Real-Time Data
            </h3>
            <p style={{
              color: '#6b7280',
              fontSize: '14px',
              lineHeight: '1.5',
              margin: 0
            }}>
              Live market simulation with real-time price feeds and trading opportunities
            </p>
          </div>
        </div>

        {/* Stats Section */}
        <div style={{
          background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%)',
          padding: '2rem',
          borderRadius: '16px',
          animation: 'fadeInUp 0.8s ease-out 1s both'
        }}>
          <h3 style={{
            color: '#1f2937',
            fontSize: '20px',
            fontWeight: '700',
            marginBottom: '1.5rem'
          }}>
            🌟 Why Choose CryptoSim AI?
          </h3>
          
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
            gap: '1.5rem'
          }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{
                color: '#667eea',
                fontSize: '2rem',
                fontWeight: '800',
                marginBottom: '0.5rem'
              }}>
                $2.4M+
              </div>
              <div style={{
                color: '#6b7280',
                fontSize: '14px',
                fontWeight: '500'
              }}>
                Daily Trading Volume
              </div>
            </div>
            
            <div style={{ textAlign: 'center' }}>
              <div style={{
                color: '#10b981',
                fontSize: '2rem',
                fontWeight: '800',
                marginBottom: '0.5rem'
              }}>
                847+
              </div>
              <div style={{
                color: '#6b7280',
                fontSize: '14px',
                fontWeight: '500'
              }}>
                Active Traders
              </div>
            </div>
            
            <div style={{ textAlign: 'center' }}>
              <div style={{
                color: '#f59e0b',
                fontSize: '2rem',
                fontWeight: '800',
                marginBottom: '0.5rem'
              }}>
              +12.4%
              </div>
              <div style={{
                color: '#6b7280',
                fontSize: '14px',
                fontWeight: '500'
              }}>
                Average Daily Profit
              </div>
            </div>
            
            <div style={{ textAlign: 'center' }}>
              <div style={{
                color: '#8b5cf6',
                fontSize: '2rem',
                fontWeight: '800',
                marginBottom: '0.5rem'
              }}>
                24/7
              </div>
              <div style={{
                color: '#6b7280',
                fontSize: '14px',
                fontWeight: '500'
              }}>
                Market Simulation
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Homepage;