/**
 * Fully Refactored App Component
 * Implementing atomic design, OWASP security patterns, and performance optimizations
 */

import React, { Suspense, lazy, memo, useCallback, useMemo } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './store/AuthContext';
import { ErrorBoundary } from './components/atoms/ErrorBoundary';
import { Loading } from './components/atoms/Loading';
import { LoginForm } from './components/molecules/LoginForm';
import { ROUTES, MESSAGES } from './utils/constants';
import './App.css';

// Lazy loaded components for code splitting
const Dashboard = lazy(() => import('./components/Dashboard'));
const Register = lazy(() => import('./components/Register'));
const VerificationCode = lazy(() => import('./components/VerificationCode'));
const OAuthCallback = lazy(() => import('./components/OAuthCallback'));

/**
 * Loading fallback component with better UX
 */
const LoadingFallback = memo(() => (
  <div className="app-loading">
    <Loading 
      variant="spinner" 
      size="lg" 
      text={MESSAGES.LOADING.AUTHENTICATING}
      overlay={false}
    />
  </div>
));
LoadingFallback.displayName = 'LoadingFallback';

/**
 * Auth Loading component
 */
const AuthLoading = memo(() => (
  <div className="auth-loading-container">
    <Loading 
      variant="pulse" 
      size="md" 
      text={MESSAGES.LOADING.AUTHENTICATING}
    />
  </div>
));
AuthLoading.displayName = 'AuthLoading';

/**
 * Protected Route wrapper with OWASP 4.5.1 compliance
 */
const ProtectedRoute = memo<{ 
  children: React.ReactNode;
  requiredRole?: 'admin' | 'client';
  fallbackPath?: string;
}>(({ children, requiredRole, fallbackPath = ROUTES.ROOT }) => {
  const { isAuthenticated, isLoading, hasPermission, user } = useAuth();

  // Show loading while authentication state is being determined
  if (isLoading) {
    return <AuthLoading />;
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return <Navigate to={fallbackPath} replace />;
  }

  // Check role-based permissions (OWASP 4.5.3 - Testing for privilege escalation)
  if (requiredRole && !hasPermission(requiredRole)) {
    // Log unauthorized access attempt for security monitoring
    console.warn('Unauthorized access attempt:', {
      user: user?.email,
      requiredRole,
      userRole: user?.role,
      timestamp: new Date().toISOString(),
      path: window.location.pathname,
    });
    
    return <Navigate to={ROUTES.ROOT} replace />;
  }

  return <>{children}</>;
});
ProtectedRoute.displayName = 'ProtectedRoute';

/**
 * OAuth Callback wrapper with error handling
 */
const OAuthCallbackWrapper = memo(() => {
  const { login } = useAuth();
  
  const handleOAuthLogin = useCallback((userData: any) => {
    try {
      login(userData);
    } catch (error) {
      console.error('OAuth login error:', error);
      // Redirect to login with error
      window.location.href = `${ROUTES.ROOT}?error=oauth_failed`;
    }
  }, [login]);

  return (
    <ErrorBoundary 
      errorMessage="Eroare la autentificarea cu GitHub. Te rugăm să încerci din nou."
      onError={(error) => {
        console.error('OAuth callback error:', error);
      }}
    >
      <Suspense fallback={<LoadingFallback />}>
        <OAuthCallback onLogin={handleOAuthLogin} />
      </Suspense>
    </ErrorBoundary>
  );
});
OAuthCallbackWrapper.displayName = 'OAuthCallbackWrapper';

/**
 * Main App Content component with view state management
 */
const AppContent = memo(() => {
  const { isAuthenticated, isLoading } = useAuth();
  const [currentView, setCurrentView] = React.useState<'login' | 'register' | 'verification'>('login');
  const [verificationData, setVerificationData] = React.useState<{
    email: string;
    method: 'email' | 'sms';
  } | null>(null);

  // Memoized callbacks for better performance
  const handleShowRegister = useCallback(() => {
    setCurrentView('register');
  }, []);

  const handleBackToLogin = useCallback(() => {
    setCurrentView('login');
    setVerificationData(null);
  }, []);

  const handleNeedVerification = useCallback((email: string, method: 'email' | 'sms') => {
    setVerificationData({ email, method });
    setCurrentView('verification');
  }, []);

  const handleLoginSuccess = useCallback(() => {
    // Login success is handled by the auth context
    // User will be redirected by the authentication flow
  }, []);

  const handleRegisterSuccess = useCallback((userData: any) => {
    // Registration success - user might need verification
    // This is handled in the register component
  }, []);

  const handleVerificationSuccess = useCallback((userData: any) => {
    // Verification success is handled by the auth context
  }, []);

  // Memoized components to prevent unnecessary re-renders
  const LoginComponent = useMemo(() => (
    <LoginForm
      onLoginSuccess={handleLoginSuccess}
      onShowRegister={handleShowRegister}
      onNeedVerification={handleNeedVerification}
      showRememberMe={true}
    />
  ), [handleLoginSuccess, handleShowRegister, handleNeedVerification]);

  const RegisterComponent = useMemo(() => (
    <Suspense fallback={<LoadingFallback />}>
      <Register
        onRegisterSuccess={handleRegisterSuccess}
        onBackToLogin={handleBackToLogin}
        onNeedVerification={handleNeedVerification}
      />
    </Suspense>
  ), [handleRegisterSuccess, handleBackToLogin, handleNeedVerification]);

  const VerificationComponent = useMemo(() => {
    if (!verificationData) return null;
    
    return (
      <Suspense fallback={<LoadingFallback />}>
        <VerificationCode
          email={verificationData.email}
          method={verificationData.method}
          onVerificationSuccess={handleVerificationSuccess}
          onBackToRegister={() => setCurrentView('register')}
        />
      </Suspense>
    );
  }, [verificationData, handleVerificationSuccess]);

  // Show loading while authentication state is being determined
  if (isLoading) {
    return <AuthLoading />;
  }

  // Redirect authenticated users to dashboard
  if (isAuthenticated) {
    return <Navigate to={ROUTES.DASHBOARD} replace />;
  }

  // Render appropriate view based on current state
  const renderCurrentView = () => {
    switch (currentView) {
      case 'register':
        return RegisterComponent;
      case 'verification':
        return VerificationComponent;
      default:
        return LoginComponent;
    }
  };

  return (
    <div className="app-content">
      <ErrorBoundary
        onError={(error, errorInfo) => {
          console.error('App content error:', error, errorInfo);
        }}
      >
        {renderCurrentView()}
      </ErrorBoundary>
    </div>
  );
});
AppContent.displayName = 'AppContent';

/**
 * Main App Component with comprehensive error handling and routing
 */
const App = memo(() => {
  return (
    <ErrorBoundary
      onError={(error, errorInfo) => {
        // Global error handler
        console.error('Global app error:', error, errorInfo);
        
        // Here you would send to your error reporting service
        // e.g., Sentry, LogRocket, etc.
      }}
      errorMessage="Aplicația a întâmpinat o eroare neașteptată. Te rugăm să reîmprospătezi pagina."
    >
      <AuthProvider>
        <Router>
          <div className="App">
            <Routes>
              {/* OAuth callback route */}
              <Route 
                path={ROUTES.OAUTH_CALLBACK} 
                element={<OAuthCallbackWrapper />} 
              />
              
              {/* Protected dashboard route */}
              <Route 
                path={ROUTES.DASHBOARD} 
                element={
                  <ProtectedRoute>
                    <ErrorBoundary
                      errorMessage="Eroare la încărcarea dashboard-ului."
                      onError={(error) => {
                        console.error('Dashboard error:', error);
                      }}
                    >
                      <Suspense fallback={<LoadingFallback />}>
                        <Dashboard />
                      </Suspense>
                    </ErrorBoundary>
                  </ProtectedRoute>
                } 
              />
              
              {/* Admin-only routes (if needed) */}
              <Route 
                path="/admin/*" 
                element={
                  <ProtectedRoute requiredRole="admin">
                    <ErrorBoundary errorMessage="Eroare la accesarea panoului de administrare.">
                      <div>Admin Panel - To be implemented</div>
                    </ErrorBoundary>
                  </ProtectedRoute>
                } 
              />
              
              {/* Client-only routes (if needed) */}
              <Route 
                path="/client/*" 
                element={
                  <ProtectedRoute requiredRole="client">
                    <ErrorBoundary errorMessage="Eroare la accesarea panoului de client.">
                      <div>Client Panel - To be implemented</div>
                    </ErrorBoundary>
                  </ProtectedRoute>
                } 
              />
              
              {/* Main auth route */}
              <Route 
                path={ROUTES.ROOT} 
                element={<AppContent />} 
              />
              
              {/* 404 handler */}
              <Route 
                path="*" 
                element={
                  <div className="not-found">
                    <h2>Pagina nu a fost găsită</h2>
                    <p>Pagina pe care o cauți nu există.</p>
                    <Navigate to={ROUTES.ROOT} replace />
                  </div>
                } 
              />
            </Routes>
          </div>
        </Router>
      </AuthProvider>
    </ErrorBoundary>
  );
});
App.displayName = 'App';

export default App;