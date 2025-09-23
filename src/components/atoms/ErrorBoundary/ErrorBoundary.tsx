/**
 * ErrorBoundary Component
 * Catches JavaScript errors anywhere in the child component tree
 * Following OWASP guidelines for secure error handling
 */

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { MESSAGES } from '../../../utils/constants';
import './ErrorBoundary.css';

interface ErrorBoundaryProps {
  /** Child components */
  children: ReactNode;
  /** Custom fallback UI */
  fallback?: ReactNode;
  /** Error callback */
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  /** Show error details in development */
  showDetails?: boolean;
  /** Custom error message */
  errorMessage?: string;
  /** Reset key - changing this will reset the error boundary */
  resetKey?: string | number;
  /** Custom CSS class */
  className?: string;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  eventId: string | null;
}

/**
 * Default Error UI Component
 */
const DefaultErrorUI: React.FC<{
  error?: Error | null;
  errorInfo?: ErrorInfo | null;
  onRetry: () => void;
  showDetails: boolean;
  errorMessage?: string;
}> = ({ error, errorInfo, onRetry, showDetails, errorMessage }) => (
  <div className="error-boundary" role="alert">
    <div className="error-boundary__content">
      <div className="error-boundary__icon">
        ⚠️
      </div>
      
      <h2 className="error-boundary__title">
        Oops! Ceva nu a mers bine
      </h2>
      
      <p className="error-boundary__message">
        {errorMessage || MESSAGES.ERRORS.GENERIC_ERROR}
      </p>
      
      {showDetails && error && (
        <details className="error-boundary__details">
          <summary>Detalii tehnice</summary>
          <div className="error-boundary__error-info">
            <p><strong>Error:</strong> {error.message}</p>
            {error.stack && (
              <pre className="error-boundary__stack">
                {error.stack}
              </pre>
            )}
            {errorInfo?.componentStack && (
              <pre className="error-boundary__component-stack">
                <strong>Component Stack:</strong>
                {errorInfo.componentStack}
              </pre>
            )}
          </div>
        </details>
      )}
      
      <div className="error-boundary__actions">
        <button 
          className="error-boundary__retry-button"
          onClick={onRetry}
          type="button"
        >
          Încearcă din nou
        </button>
        
        <button 
          className="error-boundary__reload-button"
          onClick={() => window.location.reload()}
          type="button"
        >
          Reîncarcă pagina
        </button>
      </div>
    </div>
  </div>
);

/**
 * ErrorBoundary Class Component
 * Catches and handles JavaScript errors in React components
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  private resetTimeoutId: number | null = null;

  constructor(props: ErrorBoundaryProps) {
    super(props);
    
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      eventId: null,
    };
  }

  /**
   * Update state when an error is caught
   */
  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return {
      hasError: true,
      error,
    };
  }

  /**
   * Handle the error and log it securely
   */
  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    const eventId = this.generateEventId();
    
    this.setState({
      error,
      errorInfo,
      eventId,
    });

    // Log error securely (don't expose sensitive information)
    const sanitizedError = {
      message: error.message,
      name: error.name,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      timestamp: new Date().toISOString(),
      eventId,
      url: window.location.href,
      userAgent: navigator.userAgent,
      componentStack: process.env.NODE_ENV === 'development' ? errorInfo.componentStack : undefined,
    };

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.group(`🚨 Error Boundary Caught Error [${eventId}]`);
      console.error('Error:', error);
      console.error('Error Info:', errorInfo);
      console.error('Sanitized Error:', sanitizedError);
      console.groupEnd();
    }

    // Call external error handler if provided
    this.props.onError?.(error, errorInfo);

    // Here you would typically send to error reporting service
    this.reportError(sanitizedError);
  }

  /**
   * Reset error boundary when resetKey changes
   */
  componentDidUpdate(prevProps: ErrorBoundaryProps) {
    if (this.props.resetKey !== prevProps.resetKey && this.state.hasError) {
      this.resetErrorBoundary();
    }
  }

  /**
   * Cleanup on component unmount
   */
  componentWillUnmount() {
    if (this.resetTimeoutId) {
      clearTimeout(this.resetTimeoutId);
    }
  }

  /**
   * Generate a unique event ID for error tracking
   */
  private generateEventId(): string {
    return `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Report error to external service (mock implementation)
   */
  private reportError(errorData: any) {
    // In a real application, you would send this to your error reporting service
    // like Sentry, LogRocket, or your own backend
    
    try {
      // Mock API call
      if (process.env.NODE_ENV === 'production') {
        fetch('/api/errors', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(errorData),
        }).catch(err => {
          console.warn('Failed to report error:', err);
        });
      }
    } catch (reportingError) {
      console.warn('Error reporting failed:', reportingError);
    }
  }

  /**
   * Reset the error boundary state
   */
  private resetErrorBoundary = () => {
    if (this.resetTimeoutId) {
      clearTimeout(this.resetTimeoutId);
    }

    this.resetTimeoutId = window.setTimeout(() => {
      this.setState({
        hasError: false,
        error: null,
        errorInfo: null,
        eventId: null,
      });
    }, 100);
  };

  render() {
    const { children, fallback, showDetails = process.env.NODE_ENV === 'development', errorMessage, className } = this.props;
    const { hasError, error, errorInfo } = this.state;

    if (hasError) {
      // Custom fallback UI
      if (fallback) {
        return (
          <div className={`error-boundary-wrapper ${className || ''}`}>
            {fallback}
          </div>
        );
      }

      // Default error UI
      return (
        <div className={`error-boundary-wrapper ${className || ''}`}>
          <DefaultErrorUI
            error={error}
            errorInfo={errorInfo}
            onRetry={this.resetErrorBoundary}
            showDetails={showDetails}
            errorMessage={errorMessage}
          />
        </div>
      );
    }

    return children;
  }
}

/**
 * HOC for wrapping components with ErrorBoundary
 */
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryProps?: Omit<ErrorBoundaryProps, 'children'>
) {
  const WrappedComponent = (props: P) => (
    <ErrorBoundary {...errorBoundaryProps}>
      <Component {...props} />
    </ErrorBoundary>
  );

  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`;
  
  return WrappedComponent;
}

/**
 * Hook for triggering error boundaries programmatically
 */
export function useErrorHandler() {
  return React.useCallback((error: Error) => {
    throw error;
  }, []);
}

export default ErrorBoundary;