/**
 * Custom hook for authentication management
 * Handles all authentication logic with OWASP security patterns
 */

import { useState, useEffect, useCallback, useContext } from 'react';
import { AuthContext } from '../../store/AuthContext';
import { API_ENDPOINTS, MESSAGES, SECURITY_CONSTANTS } from '../../utils/constants';
import { validateEmail, validatePassword } from '../../utils/validators';
import { checkRateLimit, retryWithBackoff } from '../../utils/helpers';
import { apiService } from '../../services/api/apiService';

export interface User {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  role: 'admin' | 'client';
  isActive: boolean;
  isVerified: boolean;
  lastLogin?: string;
  createdAt?: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface RegisterData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone: string;
  confirmPassword: string;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  loginAttempts: number;
  isLocked: boolean;
}

/**
 * Custom hook pentru gestionarea autentificării
 */
export const useAuth = () => {
  const context = useContext(AuthContext);
  
  if (!context) {
    throw new Error('useAuth trebuie folosit în interiorul unui AuthProvider');
  }
  
  return context;
};

/**
 * Custom hook pentru operațiuni de autentificare
 */
export const useAuthOperations = () => {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
    isLoading: true,
    error: null,
    loginAttempts: 0,
    isLocked: false,
  });

  const [sessionTimeout, setSessionTimeout] = useState<NodeJS.Timeout | null>(null);

  /**
   * Resetează timeout-ul sesiunii
   */
  const resetSessionTimeout = useCallback(() => {
    if (sessionTimeout) {
      clearTimeout(sessionTimeout);
    }

    const timeout = setTimeout(() => {
      logout();
    }, SECURITY_CONSTANTS.SESSION_TIMEOUT_MS);

    setSessionTimeout(timeout);
  }, [sessionTimeout]);

  /**
   * Verifică sesiunea curentă
   */
  const checkSession = useCallback(async (): Promise<void> => {
    try {
      setAuthState(prev => ({ ...prev, isLoading: true, error: null }));

      const response = await retryWithBackoff(
        () => apiService.get(API_ENDPOINTS.AUTH.SESSION),
        2,
        1000
      );

      if (response.success && response.authenticated && response.user) {
        setAuthState(prev => ({
          ...prev,
          user: response.user,
          isAuthenticated: true,
          isLoading: false,
          error: null,
        }));
        resetSessionTimeout();
      } else {
        setAuthState(prev => ({
          ...prev,
          user: null,
          isAuthenticated: false,
          isLoading: false,
        }));
      }
    } catch (error) {
      console.error('Eroare la verificarea sesiunii:', error);
      setAuthState(prev => ({
        ...prev,
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: error instanceof Error ? error.message : MESSAGES.ERRORS.GENERIC_ERROR,
      }));
    }
  }, [resetSessionTimeout]);

  /**
   * Login cu rate limiting și security checks
   */
  const login = useCallback(async (credentials: LoginCredentials): Promise<{ success: boolean; requiresVerification?: boolean; verificationMethod?: string }> => {
    try {
      // Rate limiting check
      const rateLimitKey = `login_${credentials.email}`;
      if (!checkRateLimit(rateLimitKey, SECURITY_CONSTANTS.MAX_LOGIN_ATTEMPTS, SECURITY_CONSTANTS.LOCKOUT_DURATION_MS)) {
        setAuthState(prev => ({
          ...prev,
          error: MESSAGES.AUTH.ACCOUNT_LOCKED,
          isLocked: true,
        }));
        return { success: false };
      }

      // Validate input
      const email = validateEmail(credentials.email);
      const password = validatePassword(credentials.password);

      setAuthState(prev => ({
        ...prev,
        isLoading: true,
        error: null,
      }));

      const response = await apiService.post(API_ENDPOINTS.AUTH.LOGIN, {
        email,
        password,
        rememberMe: credentials.rememberMe || false,
      });

      if (response.success && response.user) {
        setAuthState(prev => ({
          ...prev,
          user: response.user,
          isAuthenticated: true,
          isLoading: false,
          error: null,
          loginAttempts: 0,
          isLocked: false,
        }));
        resetSessionTimeout();
        return { success: true };
      } else if (response.requiresVerification) {
        setAuthState(prev => ({
          ...prev,
          isLoading: false,
          error: null,
        }));
        return {
          success: false,
          requiresVerification: true,
          verificationMethod: response.verificationMethod,
        };
      } else {
        setAuthState(prev => ({
          ...prev,
          isLoading: false,
          error: response.message || MESSAGES.AUTH.LOGIN_FAILED,
          loginAttempts: prev.loginAttempts + 1,
        }));
        return { success: false };
      }
    } catch (error) {
      console.error('Eroare la autentificare:', error);
      setAuthState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : MESSAGES.ERRORS.GENERIC_ERROR,
        loginAttempts: prev.loginAttempts + 1,
      }));
      return { success: false };
    }
  }, [resetSessionTimeout]);

  /**
   * Register cu validare comprehensivă
   */
  const register = useCallback(async (data: RegisterData): Promise<{ success: boolean; requiresVerification?: boolean }> => {
    try {
      // Rate limiting check
      const rateLimitKey = `register_${data.email}`;
      if (!checkRateLimit(rateLimitKey, 3, 60000)) { // 3 attempts per minute
        setAuthState(prev => ({
          ...prev,
          error: 'Prea multe încercări de înregistrare. Încercați din nou mai târziu.',
        }));
        return { success: false };
      }

      // Validate all inputs
      const email = validateEmail(data.email);
      const password = validatePassword(data.password);

      if (password !== data.confirmPassword) {
        throw new Error('Parolele nu se potrivesc.');
      }

      setAuthState(prev => ({
        ...prev,
        isLoading: true,
        error: null,
      }));

      const response = await apiService.post(API_ENDPOINTS.AUTH.REGISTER, {
        email,
        password,
        firstName: data.firstName.trim(),
        lastName: data.lastName.trim(),
        phone: data.phone,
      });

      if (response.success) {
        setAuthState(prev => ({
          ...prev,
          isLoading: false,
          error: null,
        }));
        return { 
          success: true, 
          requiresVerification: response.requiresVerification 
        };
      } else {
        setAuthState(prev => ({
          ...prev,
          isLoading: false,
          error: response.message || 'Eroare la înregistrare.',
        }));
        return { success: false };
      }
    } catch (error) {
      console.error('Eroare la înregistrare:', error);
      setAuthState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : MESSAGES.ERRORS.GENERIC_ERROR,
      }));
      return { success: false };
    }
  }, []);

  /**
   * Logout cu cleanup complet
   */
  const logout = useCallback(async (): Promise<void> => {
    try {
      if (sessionTimeout) {
        clearTimeout(sessionTimeout);
        setSessionTimeout(null);
      }

      // Attempt to logout on backend
      await apiService.post(API_ENDPOINTS.AUTH.LOGOUT, {});
    } catch (error) {
      console.error('Eroare la logout:', error);
    } finally {
      // Always clear local state
      setAuthState({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
        loginAttempts: 0,
        isLocked: false,
      });
    }
  }, [sessionTimeout]);

  /**
   * Verifică codul de verificare
   */
  const verifyCode = useCallback(async (email: string, code: string, method: 'email' | 'sms'): Promise<{ success: boolean; user?: User }> => {
    try {
      setAuthState(prev => ({
        ...prev,
        isLoading: true,
        error: null,
      }));

      const response = await apiService.post(API_ENDPOINTS.AUTH.VERIFY, {
        email: validateEmail(email),
        code: code.trim(),
        method,
      });

      if (response.success && response.user) {
        setAuthState(prev => ({
          ...prev,
          user: response.user,
          isAuthenticated: true,
          isLoading: false,
          error: null,
        }));
        resetSessionTimeout();
        return { success: true, user: response.user };
      } else {
        setAuthState(prev => ({
          ...prev,
          isLoading: false,
          error: response.message || 'Cod de verificare invalid.',
        }));
        return { success: false };
      }
    } catch (error) {
      console.error('Eroare la verificarea codului:', error);
      setAuthState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : MESSAGES.ERRORS.GENERIC_ERROR,
      }));
      return { success: false };
    }
  }, [resetSessionTimeout]);

  /**
   * Verifică permisiunile utilizatorului
   */
  const hasPermission = useCallback((requiredRole: 'admin' | 'client'): boolean => {
    if (!authState.user || !authState.isAuthenticated) {
      return false;
    }

    // Admin has access to everything
    if (authState.user.role === 'admin') {
      return true;
    }

    // Check specific role
    return authState.user.role === requiredRole;
  }, [authState.user, authState.isAuthenticated]);

  /**
   * Resetează eroarea
   */
  const clearError = useCallback(() => {
    setAuthState(prev => ({ ...prev, error: null }));
  }, []);

  // Initialize session check
  useEffect(() => {
    checkSession();
  }, [checkSession]);

  return {
    ...authState,
    login,
    register,
    logout,
    verifyCode,
    checkSession,
    hasPermission,
    clearError,
  };
};