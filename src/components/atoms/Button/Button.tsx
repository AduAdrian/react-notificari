/**
 * Button Atom Component
 * Reusable button component following atomic design principles
 */

import React, { memo, useCallback } from 'react';
import { THEME_CONSTANTS } from '../../../utils/constants';
import './Button.css';

export interface ButtonProps {
  /** Button text content */
  children: React.ReactNode;
  /** Button variant/style */
  variant?: 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'info' | 'ghost';
  /** Button size */
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  /** Button type for forms */
  type?: 'button' | 'submit' | 'reset';
  /** Disabled state */
  disabled?: boolean;
  /** Loading state with spinner */
  loading?: boolean;
  /** Full width button */
  fullWidth?: boolean;
  /** Icon before text */
  iconBefore?: React.ReactNode;
  /** Icon after text */
  iconAfter?: React.ReactNode;
  /** Click handler */
  onClick?: (event: React.MouseEvent<HTMLButtonElement>) => void;
  /** Custom CSS class */
  className?: string;
  /** Custom styles */
  style?: React.CSSProperties;
  /** Accessibility label */
  'aria-label'?: string;
  /** Test ID for testing */
  'data-testid'?: string;
  /** Ref forwarding */
  ref?: React.Ref<HTMLButtonElement>;
}

/**
 * LoadingSpinner component for button loading state
 */
const LoadingSpinner: React.FC<{ size: string }> = memo(({ size }) => (
  <span className={`button-spinner button-spinner--${size}`} aria-hidden="true">
    <span className="spinner-inner"></span>
  </span>
));
LoadingSpinner.displayName = 'LoadingSpinner';

/**
 * Button component with comprehensive styling and accessibility
 */
export const Button = memo<ButtonProps>(({
  children,
  variant = 'primary',
  size = 'md',
  type = 'button',
  disabled = false,
  loading = false,
  fullWidth = false,
  iconBefore,
  iconAfter,
  onClick,
  className = '',
  style,
  'aria-label': ariaLabel,
  'data-testid': testId,
  ...props
}) => {
  /**
   * Handle click with loading state prevention
   */
  const handleClick = useCallback((event: React.MouseEvent<HTMLButtonElement>) => {
    if (loading || disabled) {
      event.preventDefault();
      return;
    }
    
    onClick?.(event);
  }, [onClick, loading, disabled]);

  /**
   * Handle keyboard events
   */
  const handleKeyDown = useCallback((event: React.KeyboardEvent<HTMLButtonElement>) => {
    if (event.key === 'Enter' || event.key === ' ') {
      if (loading || disabled) {
        event.preventDefault();
        return;
      }
      onClick?.(event as any);
    }
  }, [onClick, loading, disabled]);

  /**
   * Generate CSS classes
   */
  const classes = [
    'button',
    `button--${variant}`,
    `button--${size}`,
    fullWidth && 'button--full-width',
    loading && 'button--loading',
    disabled && 'button--disabled',
    (iconBefore || iconAfter) && 'button--with-icon',
    className
  ].filter(Boolean).join(' ');

  /**
   * Generate ARIA attributes
   */
  const ariaAttributes = {
    'aria-label': ariaLabel || (typeof children === 'string' ? children : undefined),
    'aria-disabled': disabled || loading,
    'aria-busy': loading,
  };

  return (
    <button
      type={type}
      className={classes}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      disabled={disabled || loading}
      style={style}
      data-testid={testId}
      {...ariaAttributes}
      {...props}
    >
      {loading && <LoadingSpinner size={size} />}
      
      {iconBefore && !loading && (
        <span className="button-icon button-icon--before" aria-hidden="true">
          {iconBefore}
        </span>
      )}
      
      <span className={`button-content ${loading ? 'button-content--loading' : ''}`}>
        {children}
      </span>
      
      {iconAfter && !loading && (
        <span className="button-icon button-icon--after" aria-hidden="true">
          {iconAfter}
        </span>
      )}
    </button>
  );
});

Button.displayName = 'Button';

export default Button;