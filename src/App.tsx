import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './components/Login';
import Register from './components/Register';
import VerificationCode from './components/VerificationCode';
import Dashboard from './components/Dashboard';
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

  if (!isAuthenticated) {
    if (currentView === 'register') {
      return (
        <Register
          onRegisterSuccess={login}
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
          onVerificationSuccess={login}
          onBackToRegister={() => setCurrentView('register')}
        />
      );
    }

    return (
      <Login
        onLogin={login}
        onShowRegister={() => setCurrentView('register')}
      />
    );
  }

  return <Dashboard />;
};

function App() {
  return (
    <AuthProvider>
      <div className="App">
        <AppContent />
      </div>
    </AuthProvider>
  );
}

export default App;
