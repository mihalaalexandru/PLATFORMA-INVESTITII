import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

const CancelAccount = () => {
  const { token } = useParams(); // preluam token-ul de anulare din URL
  const navigate = useNavigate();
  const [status, setStatus] = useState('loading'); // 'loading', 'success', 'error'
  const [message, setMessage] = useState('Processing your request...');

  useEffect(() => {
    // apeleaza API-ul pentru a sterge contul folosind token-ul din link-ul de email
    const cancelRegistration = async () => {
      try {
        const response = await fetch(`http://localhost:3000/api/auth/cancel-registration/${token}`, {
          method: 'DELETE',
        });

        const data = await response.json();

        if (response.ok) {
          setStatus('success');
          setMessage('Account successfully deleted. You will no longer receive emails from us. We apologize for any inconvenience.');
        } else {
          setStatus('error');
          setMessage(data.message || 'Invalid or expired link.');
        }
      } catch (error) {
        setStatus('error');
        setMessage('A network error occurred. Please try again later.');
      }
    };

    if (token) {
      cancelRegistration();
    }
  }, [token]);

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#030712', color: '#fff', fontFamily: 'sans-serif' }}>
      <div style={{ maxWidth: '500px', padding: '40px', backgroundColor: '#0f172a', borderRadius: '16px', border: '1px solid #1f2937', textAlign: 'center' }}>
        
        <h1 style={{ color: '#3b82f6', marginBottom: '20px' }}>InvestPro</h1>
        
        {status === 'loading' && (
          <div>
            <h2 style={{ color: '#cbd5e1' }}>Please wait...</h2>
            <p style={{ color: '#94a3b8' }}>{message}</p>
          </div>
        )}

        {status === 'success' && (
          <div>
            <h2 style={{ color: '#10b981', marginBottom: '15px' }}>Action Successful</h2>
            <p style={{ color: '#cbd5e1', lineHeight: '1.6', marginBottom: '30px' }}>{message}</p>
            <button 
              onClick={() => navigate('/')}
              style={{ backgroundColor: '#3b82f6', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}
            >
              Go to Homepage
            </button>
          </div>
        )}

        {status === 'error' && (
          <div>
            <h2 style={{ color: '#ef4444', marginBottom: '15px' }}>Action Failed</h2>
            <p style={{ color: '#cbd5e1', lineHeight: '1.6', marginBottom: '30px' }}>{message}</p>
            <button 
              onClick={() => navigate('/')}
              style={{ backgroundColor: '#1f2937', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}
            >
              Return Home
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default CancelAccount;