/**
 * Input Atom Component
 * Reusable input component with validation and accessibility
 */

import React, { memo, useCallback, useState, useRef, useEffect } from 'react';
import { MESSAGES } from '../../../utils/constants';
import { sanitizeInput } from '../../../utils/validators';
import './Input.css';

export interface InputProps {
  /** Input type */
  type?: 'text' | 'email' | 'password' | 'tel' | 'number' | 'search' | 'url';
  /** Input value */
  value?: string;
  /** Default value for uncontrolled input */
  defaultValue?: string;
  /** Placeholder text */
  placeholder?: string;
  /** Input label */
  label?: string;
  /** Help text */
  helpText?: string;
  /** Error message */
  error?: string;
  /** Success message */
  success?: string;
  /** Required field */
  required?: boolean;
  /** Disabled state */
  disabled?: boolean;
  /** Readonly state */
  readOnly?: boolean;
  /** Input size */
  size?: 'sm' | 'md' | 'lg';
  /** Full width */
  fullWidth?: boolean;
  /** Icon before input */
  iconBefore?: React.ReactNode;
  /** Icon after input */
  iconAfter?: React.ReactNode;
  /** Maximum length */
  maxLength?: number;
  /** Minimum length */
  minLength?: number;
  /** Pattern for validation */
  pattern?: string;
  /** Autocomplete attribute */
  autoComplete?: string;
  /** Auto focus */
  autoFocus?: boolean;
  /** Sanitize input on change */
  sanitize?: boolean;
  /** Custom validation function */
  validate?: (value: string) => string | null;
  /** Change handler */
  onChange?: (value: string, event: React.ChangeEvent<HTMLInputElement>) => void;
  /** Focus handler */
  onFocus?: (event: React.FocusEvent<HTMLInputElement>) => void;
  /** Blur handler */
  onBlur?: (event: React.FocusEvent<HTMLInputElement>) => void;
  /** Key press handler */
  onKeyPress?: (event: React.KeyboardEvent<HTMLInputElement>) => void;
  /** Custom CSS class */
  className?: string;
  /** Custom styles */
  style?: React.CSSProperties;
  /** Test ID for testing */
  'data-testid'?: string;
  /** Input name */
  name?: string;
  /** Input ID */
  id?: string;
}

/**
 * Input Icon component
 */
const InputIcon: React.FC<{ 
  icon: React.ReactNode; 
  position: 'before' | 'after';
  onClick?: () => void;
}> = memo(({ icon, position, onClick }) => (
  <span 
    className={`input-icon input-icon--${position} ${onClick ? 'input-icon--clickable' : ''}`}
    onClick={onClick}
    role={onClick ? 'button' : undefined}
    tabIndex={onClick ? 0 : undefined}
  >
    {icon}
  </span>
));
InputIcon.displayName = 'InputIcon';

/**
 * Input component with comprehensive validation and accessibility
 */
export const Input = memo<InputProps>(({
  type = 'text',
  value,
  defaultValue,
  placeholder,
  label,
  helpText,
  error,
  success,
  required = false,
  disabled = false,
  readOnly = false,
  size = 'md',
  fullWidth = false,
  iconBefore,
  iconAfter,
  maxLength,
  minLength,
  pattern,
  autoComplete,
  autoFocus = false,
  sanitize = false,
  validate,
  onChange,
  onFocus,
  onBlur,
  onKeyPress,
  className = '',
  style,
  'data-testid': testId,
  name,
  id,
  ...props
}) => {
  const [internalValue, setInternalValue] = useState(defaultValue || '');
  const [isFocused, setIsFocused] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  
  // Generate unique ID if not provided
  const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`;
  const helpTextId = `${inputId}-help`;
  const errorId = `${inputId}-error`;
  
  // Use controlled or uncontrolled value
  const inputValue = value !== undefined ? value : internalValue;
  const isControlled = value !== undefined;

  /**
   * Handle input change with validation and sanitization
   */
  const handleChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    let newValue = event.target.value;
    
    // Sanitize input if enabled
    if (sanitize) {
      newValue = sanitizeInput(newValue);
    }
    
    // Update internal state if uncontrolled
    if (!isControlled) {
      setInternalValue(newValue);
    }
    
    // Custom validation
    if (validate) {
      const validationResult = validate(newValue);
      setValidationError(validationResult);
    }
    
    // Call external onChange
    onChange?.(newValue, event);
  }, [sanitize, isControlled, validate, onChange]);

  /**
   * Handle focus
   */
  const handleFocus = useCallback((event: React.FocusEvent<HTMLInputElement>) => {
    setIsFocused(true);
    onFocus?.(event);
  }, [onFocus]);

  /**
   * Handle blur with validation
   */
  const handleBlur = useCallback((event: React.FocusEvent<HTMLInputElement>) => {
    setIsFocused(false);
    
    // Run validation on blur
    if (validate && inputValue) {
      const validationResult = validate(inputValue);
      setValidationError(validationResult);
    }
    
    onBlur?.(event);
  }, [validate, inputValue, onBlur]);

  /**
   * Handle key press
   */
  const handleKeyPress = useCallback((event: React.KeyboardEvent<HTMLInputElement>) => {
    onKeyPress?.(event);
  }, [onKeyPress]);

  /**
   * Auto focus effect
   */
  useEffect(() => {
    if (autoFocus && inputRef.current) {
      inputRef.current.focus();
    }
  }, [autoFocus]);

  /**
   * Generate CSS classes
   */
  const wrapperClasses = [
    'input-wrapper',
    `input-wrapper--${size}`,
    fullWidth && 'input-wrapper--full-width',
    disabled && 'input-wrapper--disabled',
    isFocused && 'input-wrapper--focused',
    (error || validationError) && 'input-wrapper--error',
    success && 'input-wrapper--success',
    iconBefore && 'input-wrapper--with-icon-before',
    iconAfter && 'input-wrapper--with-icon-after',
    className
  ].filter(Boolean).join(' ');

  const inputClasses = [
    'input',
    `input--${size}`,
  ].filter(Boolean).join(' ');

  /**
   * Get current error message
   */
  const currentError = error || validationError;

  /**
   * Generate ARIA attributes
   */
  const ariaAttributes = {
    'aria-invalid': !!currentError,
    'aria-describedby': [
      helpText && helpTextId,
      currentError && errorId
    ].filter(Boolean).join(' ') || undefined,
    'aria-required': required,
  };

  return (
    <div className={wrapperClasses} style={style}>
      {label && (
        <label 
          htmlFor={inputId} 
          className={`input-label ${required ? 'input-label--required' : ''}`}
        >
          {label}
          {required && <span className="input-required-indicator" aria-label="obligatoriu">*</span>}
        </label>
      )}
      
      <div className="input-container">
        {iconBefore && <InputIcon icon={iconBefore} position="before" />}
        
        <input
          ref={inputRef}
          id={inputId}
          name={name}
          type={type}
          value={inputValue}
          placeholder={placeholder}
          className={inputClasses}
          disabled={disabled}
          readOnly={readOnly}
          required={required}
          maxLength={maxLength}
          minLength={minLength}
          pattern={pattern}
          autoComplete={autoComplete}
          onChange={handleChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          onKeyPress={handleKeyPress}
          data-testid={testId}
          {...ariaAttributes}
          {...props}
        />
        
        {iconAfter && <InputIcon icon={iconAfter} position="after" />}
      </div>

      {helpText && !currentError && !success && (
        <div id={helpTextId} className="input-help-text">
          {helpText}
        </div>
      )}

      {currentError && (
        <div id={errorId} className="input-error-message" role="alert">
          {currentError}
        </div>
      )}

      {success && !currentError && (
        <div className="input-success-message" role="status">
          {success}
        </div>
      )}
    </div>
  );
});

Input.displayName = 'Input';

export default Input;