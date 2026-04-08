import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { TrendingUp, Shield, Zap, Globe, ArrowRight } from 'lucide-react';
import './LandingPage.css';

function LandingPage() {
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      navigate('/dashboard');
    }
  }, [navigate]);

  return (
    <div className="landing-container">
      <nav className="landing-nav">
        <div className="landing-logo">
          <div className="landing-logo-icon">
            <TrendingUp size={24} color="white" />
          </div>
          <span>InvestPro</span>
        </div>
        <div className="landing-nav-buttons">
          <button className="btn-login" onClick={() => navigate('/login')}>
            Log In
          </button>
          <button className="btn-register" onClick={() => navigate('/register')}>
            Get Started
          </button>
        </div>
      </nav>

      <main>
        <section className="hero-section">
          <div className="hero-badge">Next-Gen Trading Platform</div>
          <h1 className="hero-title">
            Master the Markets with <span>InvestPro</span>
          </h1>
          <p className="hero-subtitle">
            Experience real-time market data, intelligent portfolio tracking, and seamless trade execution. Build your wealth with the ultimate platform for modern investors.
          </p>
          <div className="hero-cta">
            <button className="btn-primary-large" onClick={() => navigate('/register')}>
              Start Trading Now <ArrowRight size={20} />
            </button>
            <button className="btn-secondary-large" onClick={() => navigate('/login')}>
              View Live Markets
            </button>
          </div>
        </section>

        <section className="features-section">
          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon-wrapper">
                <Zap size={30} color="#3b82f6" />
              </div>
              <h3>Real-Time Execution</h3>
              <p>Lightning-fast trade execution with live market data updates every 5 seconds. Never miss a market movement.</p>
            </div>
            
            <div className="feature-card">
              <div className="feature-icon-wrapper">
                <Shield size={30} color="#3b82f6" />
              </div>
              <h3>Smart Analytics</h3>
              <p>Automated portfolio tracking, profit & loss calculations, and PDF report generation for your transaction history.</p>
            </div>

            <div className="feature-card">
              <div className="feature-icon-wrapper">
                <Globe size={30} color="#3b82f6" />
              </div>
              <h3>Global Markets</h3>
              <p>Access a wide range of assets including top Cryptocurrencies and global Stocks. Diversify your investments easily.</p>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

export default LandingPage;