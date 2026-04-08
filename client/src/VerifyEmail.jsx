import { useEffect, useState } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';
import './Register.css';

function VerifyEmail() {
  const [message, setMessage] = useState('Verifying your new email...');
  const [error, setError] = useState('');
  const { token } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    const verifyToken = async () => {
      try {
        const response = await axios.put(`http://localhost:3000/api/auth/verify-email/${token}`);
        setMessage(response.data.message);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setTimeout(() => navigate('/'), 3000);
      } catch (err) {
        setError(err.response?.data?.message || 'Verification failed');
        setMessage('');
      }
    };
    verifyToken();
  }, [token, navigate]);

  return (
    <div className="auth-container">
      <div className="auth-card" style={{ textAlign: 'center', padding: '40px' }}>
        <h1 style={{ marginBottom: '20px', color: '#0f172a' }}>Email Verification</h1>
        {message && <p style={{ color: '#10b981', fontSize: '18px', fontWeight: '500' }}>{message}</p>}
        {error && <p style={{ color: '#dc2626', fontSize: '18px', fontWeight: '500' }}>{error}</p>}
        {message && <p style={{ marginTop: '20px', color: '#64748b' }}>You will be redirected to login shortly...</p>}
      </div>
    </div>
  );
}

export default VerifyEmail;