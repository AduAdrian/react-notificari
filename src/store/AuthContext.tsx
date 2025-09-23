/**
 * Optimized AuthContext with OWASP security patterns
 * Role-based access control and comprehensive error handling
 */

import React, { createContext, useContext, ReactNode } from 'react';
import { useAuthOperations, User } from '../hooks/auth/useAuth';

export interface AuthContextType {
  // User state
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  loginAttempts: number;
  isLocked: boolean;

  // Authentication methods
  login: (credentials: { email: string; password: string; rememberMe?: boolean }) => Promise<{ success: boolean; requiresVerification?: boolean; verificationMethod?: string }>;
  register: (data: { email: string; password: string; firstName: string; lastName: string; phone: string; confirmPassword: string }) => Promise<{ success: boolean; requiresVerification?: boolean }>;
  logout: () => Promise<void>;
  verifyCode: (email: string, code: string, method: 'email' | 'sms') => Promise<{ success: boolean; user?: User }>;
  checkSession: () => Promise<void>;

  // Authorization methods
  hasPermission: (requiredRole: 'admin' | 'client') => boolean;

  // Utility methods
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

/**
 * AuthProvider with comprehensive security features
 */
export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const authOperations = useAuthOperations();

  const contextValue: AuthContextType = {
    ...authOperations,
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

/**
 * Hook pentru folosirea contextului de autentificare
 * @returns {AuthContextType} Context de autentificare
 * @throws {Error} Dacă este folosit în afara AuthProvider
 */
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  
  if (context === undefined) {
    throw new Error('useAuth trebuie folosit în interiorul unui AuthProvider');
  }
  
  return context;
};

export default AuthContext;