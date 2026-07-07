import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Dashboard from './Dashboard';
import ForgotPassword from './ForgotPassword';
import ResetPassword from './ResetPassword';
import VerifyEmail from './VerifyEmail';
import LandingPage from './LandingPage';
import Register from './Register';
import { Toaster } from 'sonner';
import AuthSuccess from './AuthSuccess';
import { ThemeProvider } from './ThemeContext';
import CancelAccount from './CancelAccount';

function App() {
  return (
    <ThemeProvider>
      <Router>
        <Routes>
          {/* toate rutele aplicatiei: pagina principala, autentificare, dashboard etc. */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/register" element={<Register />} />
          <Route path="/login" element={<Register />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password/:token" element={<ResetPassword />} />
          <Route path="/verify-email/:token" element={<VerifyEmail />} />
          <Route path="/auth-success" element={<AuthSuccess />} />
          <Route path="/cancel-account/:token" element={<CancelAccount />} />
        </Routes>
        <Toaster position="top-right" theme="dark" richColors />
      </Router>
    </ThemeProvider>
  );
}

export default App;