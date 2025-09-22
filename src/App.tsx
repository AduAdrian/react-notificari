import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './components/Login';
import Register from './components/Register';
import VerificationCode from './components/VerificationCode';
import Dashboard from './components/Dashboard';
import OAuthCallback from './components/OAuthCallback';
import './App.css';

type ViewType = 'login' | 'register' | 'verification' | 'dashboard';

interface VerificationData {
  email: string;
  method: 'email' | 'sms';
}

// Componenta pentru afișarea conținutului în funcție de autentificare
const AppContent: React.FC = () => {
  const { isAuthenticated, isLoading, login } = useAuth();
  const [currentView, setCurrentView] = useState<ViewType>('login');
  const [verificationData, setVerificationData] = useState<VerificationData | null>(null);

  if (isLoading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Se încarcă...</p>
      </div>
    );
  }

  // Dacă utilizatorul este autentificat, redirecționează la dashboard
  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  if (currentView === 'register') {
    return (
      <Register
        onRegisterSuccess={(userData, token) => login(userData, token)}
        onBackToLogin={() => setCurrentView('login')}
        onNeedVerification={(email: string, method: 'email' | 'sms') => {
          setVerificationData({ email, method });
          setCurrentView('verification');
        }}
      />
    );
  }

  if (currentView === 'verification' && verificationData) {
    return (
      <VerificationCode
        email={verificationData.email}
        method={verificationData.method}
        onVerificationSuccess={(userData, token) => login(userData, token)}
        onBackToRegister={() => setCurrentView('register')}
      />
    );
  }

  return (
    <Login
      onLogin={(userData, token) => login(userData, token)}
      onShowRegister={() => setCurrentView('register')}
    />
  );
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="App">
          <Routes>
            <Route path="/auth/github/callback" element={<OAuthCallbackWrapper />} />
            <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/" element={<AppContent />} />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}

// Wrapper pentru OAuth Callback
const OAuthCallbackWrapper: React.FC = () => {
  const { login } = useAuth();
  return <OAuthCallback onLogin={(userData, token) => login(userData, token)} />;
};

// Componentă pentru rute protejate
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Se încarcă...</p>
      </div>
    );
  }

  return isAuthenticated ? <>{children}</> : <Navigate to="/" replace />;
};

export default App;




