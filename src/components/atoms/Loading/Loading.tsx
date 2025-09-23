/**
 * Loading Atom Component
 * Reusable loading spinner with different variants
 */

import React, { memo } from 'react';
import './Loading.css';

export interface LoadingProps {
  /** Loading variant/style */
  variant?: 'spinner' | 'dots' | 'pulse' | 'skeleton';
  /** Loading size */
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  /** Loading color */
  color?: 'primary' | 'secondary' | 'white' | 'gray';
  /** Loading text message */
  text?: string;
  /** Full screen overlay */
  overlay?: boolean;
  /** Custom CSS class */
  className?: string;
  /** Test ID for testing */
  'data-testid'?: string;
}

/**
 * Spinner Loading Component
 */
const SpinnerLoading: React.FC<{ size: string; color: string }> = memo(({ size, color }) => (
  <div className={`loading-spinner loading-spinner--${size} loading-spinner--${color}`}>
    <div className="spinner-ring">
      <div></div>
      <div></div>
      <div></div>
      <div></div>
    </div>
  </div>
));
SpinnerLoading.displayName = 'SpinnerLoading';

/**
 * Dots Loading Component
 */
const DotsLoading: React.FC<{ size: string; color: string }> = memo(({ size, color }) => (
  <div className={`loading-dots loading-dots--${size} loading-dots--${color}`}>
    <div className="dot dot-1"></div>
    <div className="dot dot-2"></div>
    <div className="dot dot-3"></div>
  </div>
));
DotsLoading.displayName = 'DotsLoading';

/**
 * Pulse Loading Component
 */
const PulseLoading: React.FC<{ size: string; color: string }> = memo(({ size, color }) => (
  <div className={`loading-pulse loading-pulse--${size} loading-pulse--${color}`}>
    <div className="pulse-circle"></div>
  </div>
));
PulseLoading.displayName = 'PulseLoading';

/**
 * Skeleton Loading Component
 */
const SkeletonLoading: React.FC<{ size: string }> = memo(({ size }) => (
  <div className={`loading-skeleton loading-skeleton--${size}`}>
    <div className="skeleton-line skeleton-line--title"></div>
    <div className="skeleton-line skeleton-line--subtitle"></div>
    <div className="skeleton-line skeleton-line--content"></div>
  </div>
));
SkeletonLoading.displayName = 'SkeletonLoading';

/**
 * Loading component with multiple variants and full accessibility
 */
export const Loading = memo<LoadingProps>(({
  variant = 'spinner',
  size = 'md',
  color = 'primary',
  text,
  overlay = false,
  className = '',
  'data-testid': testId,
}) => {
  /**
   * Render loading variant
   */
  const renderLoadingVariant = () => {
    switch (variant) {
      case 'dots':
        return <DotsLoading size={size} color={color} />;
      case 'pulse':
        return <PulseLoading size={size} color={color} />;
      case 'skeleton':
        return <SkeletonLoading size={size} />;
      default:
        return <SpinnerLoading size={size} color={color} />;
    }
  };

  /**
   * Generate CSS classes
   */
  const classes = [
    'loading',
    `loading--${variant}`,
    `loading--${size}`,
    overlay && 'loading--overlay',
    className
  ].filter(Boolean).join(' ');

  const content = (
    <div className={classes} data-testid={testId}>
      {renderLoadingVariant()}
      {text && (
        <div className="loading-text" role="status" aria-live="polite">
          {text}
        </div>
      )}
    </div>
  );

  // Return overlay version if requested
  if (overlay) {
    return (
      <div className="loading-overlay-backdrop" role="dialog" aria-modal="true" aria-label="Loading">
        {content}
      </div>
    );
  }

  return content;
});

Loading.displayName = 'Loading';

export default Loading;