/**
 * LoginForm Molecule Component
 * Combines Input and Button atoms for login functionality
 */

import React, { memo, useCallback, useState, useMemo } from 'react';
import { Input } from '../../atoms/Input';
import { Button } from '../../atoms/Button';
import { useAuth } from '../../../store/AuthContext';
import { MESSAGES } from '../../../utils/constants';
import { validateEmail } from '../../../utils/validators';
import { calculatePasswordStrength, debounce } from '../../../utils/helpers';
import './LoginForm.css';

export interface LoginFormProps {
  /** Callback when login is successful */
  onLoginSuccess?: (user: any) => void;
  /** Callback when verification is needed */
  onNeedVerification?: (email: string, method: 'email' | 'sms') => void;
  /** Callback to show register form */
  onShowRegister?: () => void;
  /** Show remember me option */
  showRememberMe?: boolean;
  /** Custom CSS class */
  className?: string;
}

interface LoginFormData {
  email: string;
  password: string;
  rememberMe: boolean;
}

interface FormErrors {
  email?: string;
  password?: string;
  general?: string;
}

/**
 * Email Icon component
 */
const EmailIcon: React.FC = memo(() => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0 1.1.9 2 2 2z"/>
    <polyline points="22,6 12,13 2,6"/>
  </svg>
));
EmailIcon.displayName = 'EmailIcon';

/**
 * Password Icon component
 */
const PasswordIcon: React.FC = memo(() => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
    <circle cx="12" cy="16" r="1"/>
    <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
  </svg>
));
PasswordIcon.displayName = 'PasswordIcon';

/**
 * Password visibility toggle icon
 */
const EyeIcon: React.FC<{ visible: boolean }> = memo(({ visible }) => {
  if (visible) {
    return (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
        <circle cx="12" cy="12" r="3"/>
      </svg>
    );
  }
  
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
      <line x1="1" y1="1" x2="23" y2="23"/>
    </svg>
  );
});
EyeIcon.displayName = 'EyeIcon';

/**
 * LoginForm component with comprehensive validation and security
 */
export const LoginForm = memo<LoginFormProps>(({
  onLoginSuccess,
  onNeedVerification,
  onShowRegister,
  showRememberMe = false,
  className = '',
}) => {
  const { login, isLoading, error, clearError, loginAttempts, isLocked } = useAuth();
  
  const [formData, setFormData] = useState<LoginFormData>({
    email: '',
    password: '',
    rememberMe: false,
  });
  
  const [errors, setErrors] = useState<FormErrors>({});
  const [showPassword, setShowPassword] = useState(false);
  const [emailTouched, setEmailTouched] = useState(false);
  const [passwordTouched, setPasswordTouched] = useState(false);

  /**
   * Debounced validation functions
   */
  const debouncedEmailValidation = useMemo(
    () => debounce((email: string) => {
      if (emailTouched && email) {
        try {
          validateEmail(email);
          setErrors(prev => ({ ...prev, email: undefined }));
        } catch (error) {
          setErrors(prev => ({ 
            ...prev, 
            email: error instanceof Error ? error.message : MESSAGES.VALIDATION.EMAIL_INVALID 
          }));
        }
      }
    }, 500),
    [emailTouched]
  );

  const debouncedPasswordValidation = useMemo(
    () => debounce((password: string) => {
      if (passwordTouched && password) {
        const strength = calculatePasswordStrength(password);
        if (strength.strength === 'weak' && password.length >= 3) {
          setErrors(prev => ({
            ...prev,
            password: 'Parola este prea slabă'
          }));
        } else {
          setErrors(prev => ({ ...prev, password: undefined }));
        }
      }
    }, 500),
    [passwordTouched]
  );

  /**
   * Handle input changes
   */
  const handleInputChange = useCallback((field: keyof LoginFormData) => 
    (value: string | boolean) => {
      setFormData(prev => ({
        ...prev,
        [field]: value
      }));

      // Clear general error when user starts typing
      if (error) {
        clearError();
      }

      // Run debounced validation
      if (field === 'email' && typeof value === 'string') {
        debouncedEmailValidation(value);
      } else if (field === 'password' && typeof value === 'string') {
        debouncedPasswordValidation(value);
      }
    }, [error, clearError, debouncedEmailValidation, debouncedPasswordValidation]);

  /**
   * Handle form submission
   */
  const handleSubmit = useCallback(async (event: React.FormEvent) => {
    event.preventDefault();
    
    if (isLoading || isLocked) return;

    // Clear previous errors
    setErrors({});
    
    // Validate form
    const newErrors: FormErrors = {};
    
    try {
      validateEmail(formData.email);
    } catch (error) {
      newErrors.email = error instanceof Error ? error.message : MESSAGES.VALIDATION.EMAIL_INVALID;
    }
    
    if (!formData.password) {
      newErrors.password = MESSAGES.VALIDATION.REQUIRED_FIELD;
    }
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    try {
      const result = await login({
        email: formData.email,
        password: formData.password,
        rememberMe: formData.rememberMe,
      });

      if (result.success) {
        onLoginSuccess?.(null); // User data will be in context
      } else if (result.requiresVerification) {
        onNeedVerification?.(formData.email, result.verificationMethod as 'email' | 'sms');
      }
    } catch (error) {
      console.error('Eroare la autentificare:', error);
    }
  }, [
    formData, 
    isLoading, 
    isLocked, 
    login, 
    onLoginSuccess, 
    onNeedVerification
  ]);

  /**
   * Handle password visibility toggle
   */
  const togglePasswordVisibility = useCallback(() => {
    setShowPassword(prev => !prev);
  }, []);

  /**
   * Generate form CSS classes
   */
  const formClasses = [
    'login-form',
    isLocked && 'login-form--locked',
    className
  ].filter(Boolean).join(' ');

  return (
    <form className={formClasses} onSubmit={handleSubmit} noValidate>
      <div className="login-form__header">
        <h2 className="login-form__title">Autentificare</h2>
        <p className="login-form__subtitle">
          Introdu datele tale pentru a accesa contul
        </p>
      </div>

      {isLocked && (
        <div className="login-form__lockout-warning" role="alert">
          <strong>Cont temporar blocat</strong>
          <p>Prea multe încercări de autentificare. Încearcă din nou mai târziu.</p>
        </div>
      )}

      {loginAttempts >= 3 && !isLocked && (
        <div className="login-form__warning" role="alert">
          <strong>Atenție!</strong> Ai mai rămas {5 - loginAttempts} încercări înainte de blocarea contului.
        </div>
      )}

      <div className="login-form__fields">
        <Input
          type="email"
          label="Adresa de email"
          placeholder="exemplu@email.com"
          value={formData.email}
          error={errors.email}
          required
          autoComplete="email"
          iconBefore={<EmailIcon />}
          onChange={handleInputChange('email')}
          onBlur={() => setEmailTouched(true)}
          disabled={isLoading || isLocked}
          data-testid="login-email-input"
        />

        <Input
          type={showPassword ? 'text' : 'password'}
          label="Parola"
          placeholder="Introdu parola ta"
          value={formData.password}
          error={errors.password}
          required
          autoComplete="current-password"
          iconBefore={<PasswordIcon />}
          iconAfter={
            <EyeIcon visible={showPassword} />
          }
          onChange={handleInputChange('password')}
          onBlur={() => setPasswordTouched(true)}
          disabled={isLoading || isLocked}
          data-testid="login-password-input"
        />
      </div>

      {showRememberMe && (
        <label className="login-form__remember-me">
          <input
            type="checkbox"
            checked={formData.rememberMe}
            onChange={(e) => handleInputChange('rememberMe')(e.target.checked)}
            disabled={isLoading || isLocked}
          />
          <span>Ține-mă minte</span>
        </label>
      )}

      {(error || errors.general) && (
        <div className="login-form__error" role="alert">
          {error || errors.general}
        </div>
      )}

      <div className="login-form__actions">
        <Button
          type="submit"
          variant="primary"
          size="lg"
          fullWidth
          loading={isLoading}
          disabled={isLocked}
          data-testid="login-submit-button"
        >
          {isLoading ? 'Se autentifică...' : 'Autentificare'}
        </Button>

        {onShowRegister && (
          <Button
            type="button"
            variant="ghost"
            size="md"
            fullWidth
            onClick={onShowRegister}
            disabled={isLoading}
            data-testid="show-register-button"
          >
            Nu ai cont? Înregistrează-te
          </Button>
        )}
      </div>
    </form>
  );
});

LoginForm.displayName = 'LoginForm';

export default LoginForm;