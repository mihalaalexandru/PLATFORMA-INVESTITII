import { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import './Register.css';

function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post('http://localhost:3000/api/auth/forgotpassword', { email });
      setMessage(response.data.message);
      setError('');
    } catch (err) {
      setError(err.response?.data?.message || 'An error occurred');
      setMessage('');
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <h1>Forgot Password</h1>
          <p>Enter your email to receive a reset link</p>
        </div>
        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label>Email Address</label>
            <input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          {message && <div style={{ color: '#10b981', marginBottom: '10px' }}>{message}</div>}
          {error && <div style={{ color: '#dc2626', marginBottom: '10px' }}>{error}</div>}
          <button type="submit" className="submit-btn">Send Reset Link</button>
        </form>
        <div className="auth-footer">
          <button onClick={() => navigate('/')} className="toggle-btn" type="button">
            Back to Login
          </button>
        </div>
      </div>
    </div>
  );
}

export default ForgotPassword;