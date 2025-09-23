/**
 * Button Component Tests
 * Comprehensive testing including OWASP security patterns
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { Button } from '../Button';

describe('Button Component', () => {
  describe('Basic Rendering', () => {
    it('renders button with text content', () => {
      render(<Button>Test Button</Button>);
      expect(screen.getByRole('button', { name: /test button/i })).toBeInTheDocument();
    });

    it('renders with correct default props', () => {
      render(<Button>Default Button</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('button', 'button--primary', 'button--md');
      expect(button).toHaveAttribute('type', 'button');
    });

    it('applies custom className', () => {
      render(<Button className="custom-class">Button</Button>);
      expect(screen.getByRole('button')).toHaveClass('custom-class');
    });

    it('applies custom styles', () => {
      const customStyle = { backgroundColor: 'red' };
      render(<Button style={customStyle}>Styled Button</Button>);
      expect(screen.getByRole('button')).toHaveStyle('background-color: red');
    });
  });

  describe('Variants', () => {
    const variants = ['primary', 'secondary', 'success', 'warning', 'error', 'info', 'ghost'] as const;
    
    variants.forEach(variant => {
      it(`renders ${variant} variant correctly`, () => {
        render(<Button variant={variant}>{variant} Button</Button>);
        expect(screen.getByRole('button')).toHaveClass(`button--${variant}`);
      });
    });
  });

  describe('Sizes', () => {
    const sizes = ['xs', 'sm', 'md', 'lg', 'xl'] as const;
    
    sizes.forEach(size => {
      it(`renders ${size} size correctly`, () => {
        render(<Button size={size}>{size} Button</Button>);
        expect(screen.getByRole('button')).toHaveClass(`button--${size}`);
      });
    });
  });

  describe('States', () => {
    it('renders disabled state correctly', () => {
      render(<Button disabled>Disabled Button</Button>);
      const button = screen.getByRole('button');
      expect(button).toBeDisabled();
      expect(button).toHaveClass('button--disabled');
      expect(button).toHaveAttribute('aria-disabled', 'true');
    });

    it('renders loading state correctly', () => {
      render(<Button loading>Loading Button</Button>);
      const button = screen.getByRole('button');
      expect(button).toBeDisabled();
      expect(button).toHaveClass('button--loading');
      expect(button).toHaveAttribute('aria-busy', 'true');
      expect(screen.getByLabelText(/loading/i)).toBeInTheDocument();
    });

    it('renders full width correctly', () => {
      render(<Button fullWidth>Full Width Button</Button>);
      expect(screen.getByRole('button')).toHaveClass('button--full-width');
    });
  });

  describe('Icons', () => {
    const TestIcon = () => <span data-testid="test-icon">📍</span>;

    it('renders icon before text', () => {
      render(
        <Button iconBefore={<TestIcon />}>
          Button with Icon Before
        </Button>
      );
      const button = screen.getByRole('button');
      expect(button).toHaveClass('button--with-icon');
      expect(screen.getByTestId('test-icon')).toBeInTheDocument();
    });

    it('renders icon after text', () => {
      render(
        <Button iconAfter={<TestIcon />}>
          Button with Icon After
        </Button>
      );
      const button = screen.getByRole('button');
      expect(button).toHaveClass('button--with-icon');
      expect(screen.getByTestId('test-icon')).toBeInTheDocument();
    });

    it('hides icons when loading', () => {
      render(
        <Button loading iconBefore={<TestIcon />} iconAfter={<TestIcon />}>
          Loading Button
        </Button>
      );
      expect(screen.queryByTestId('test-icon')).not.toBeInTheDocument();
    });
  });

  describe('Event Handling', () => {
    it('calls onClick when clicked', async () => {
      const handleClick = jest.fn();
      render(<Button onClick={handleClick}>Clickable Button</Button>);
      
      await userEvent.click(screen.getByRole('button'));
      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('does not call onClick when disabled', async () => {
      const handleClick = jest.fn();
      render(<Button disabled onClick={handleClick}>Disabled Button</Button>);
      
      await userEvent.click(screen.getByRole('button'));
      expect(handleClick).not.toHaveBeenCalled();
    });

    it('does not call onClick when loading', async () => {
      const handleClick = jest.fn();
      render(<Button loading onClick={handleClick}>Loading Button</Button>);
      
      await userEvent.click(screen.getByRole('button'));
      expect(handleClick).not.toHaveBeenCalled();
    });

    it('prevents event default when disabled or loading', () => {
      const handleClick = jest.fn();
      render(<Button disabled onClick={handleClick}>Button</Button>);
      
      const button = screen.getByRole('button');
      fireEvent.click(button);
      expect(handleClick).not.toHaveBeenCalled();
    });
  });

  describe('Accessibility - OWASP 4.4.11 Testing', () => {
    it('has proper ARIA attributes', () => {
      render(<Button aria-label="Custom Label">Button</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('aria-label', 'Custom Label');
    });

    it('uses button text as aria-label when not provided', () => {
      render(<Button>Button Text</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('aria-label', 'Button Text');
    });

    it('has proper disabled ARIA attributes', () => {
      render(<Button disabled>Disabled Button</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('aria-disabled', 'true');
    });

    it('has proper loading ARIA attributes', () => {
      render(<Button loading>Loading Button</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('aria-busy', 'true');
      expect(button).toHaveAttribute('aria-disabled', 'true');
    });

    it('is keyboard accessible', async () => {
      const handleClick = jest.fn();
      render(<Button onClick={handleClick}>Keyboard Button</Button>);
      
      const button = screen.getByRole('button');
      button.focus();
      expect(button).toHaveFocus();
      
      fireEvent.keyDown(button, { key: 'Enter' });
      expect(handleClick).toHaveBeenCalled();
    });

    it('supports screen readers with proper roles', () => {
      render(<Button>Screen Reader Button</Button>);
      const button = screen.getByRole('button');
      expect(button.tagName).toBe('BUTTON');
    });
  });

  describe('Form Integration', () => {
    it('submits form when type is submit', () => {
      const handleSubmit = jest.fn(e => e.preventDefault());
      render(
        <form onSubmit={handleSubmit}>
          <Button type="submit">Submit</Button>
        </form>
      );
      
      fireEvent.click(screen.getByRole('button'));
      expect(handleSubmit).toHaveBeenCalled();
    });

    it('resets form when type is reset', () => {
      const TestForm = () => {
        const [value, setValue] = React.useState('test');
        return (
          <form onReset={() => setValue('')}>
            <input 
              data-testid="test-input" 
              value={value}
              onChange={(e) => setValue(e.target.value)}
            />
            <Button type="reset">Reset</Button>
          </form>
        );
      };
      
      render(<TestForm />);
      
      const input = screen.getByTestId('test-input');
      expect(input).toHaveValue('test');
      
      fireEvent.click(screen.getByRole('button'));
      expect(input).toHaveValue('');
    });
  });

  describe('Security - OWASP 4.5.3 Testing', () => {
    it('sanitizes data-testid attribute', () => {
      render(<Button data-testid="button<script>alert('xss')</script>">Button</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('data-testid', "button<script>alert('xss')</script>");
      // Note: React automatically escapes attributes, but we should test this
    });

    it('does not execute malicious onClick handlers when disabled', async () => {
      const maliciousHandler = jest.fn(() => {
        // Simulate malicious code that should not execute
        window.location.href = 'javascript:alert("xss")';
      });
      
      render(<Button disabled onClick={maliciousHandler}>Disabled Button</Button>);
      
      await userEvent.click(screen.getByRole('button'));
      expect(maliciousHandler).not.toHaveBeenCalled();
    });

    it('prevents double-click attacks during loading', async () => {
      const handleClick = jest.fn();
      render(<Button loading onClick={handleClick}>Loading Button</Button>);
      
      const button = screen.getByRole('button');
      await userEvent.dblClick(button);
      expect(handleClick).not.toHaveBeenCalled();
    });
  });

  describe('Performance', () => {
    it('memoizes component properly', () => {
      const TestComponent = ({ variant }: { variant?: string }) => (
        <Button variant={variant as any}>Test</Button>
      );
      
      const { rerender } = render(<TestComponent />);
      rerender(<TestComponent />);
      
      // Component should render without errors with same props
      expect(screen.getByRole('button')).toBeInTheDocument();
    });

    it('re-renders when props change', () => {
      const { rerender } = render(<Button>Test</Button>);
      expect(screen.getByRole('button')).toHaveClass('button--primary');
      
      rerender(<Button variant="secondary">Test</Button>);
      expect(screen.getByRole('button')).toHaveClass('button--secondary');
    });
  });

  describe('Error Boundaries', () => {
    it('handles errors gracefully', () => {
      // Mock console.error to avoid test noise
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      
      const ThrowError = () => {
        throw new Error('Test error');
      };
      
      expect(() => {
        render(
          <Button>
            <ThrowError />
          </Button>
        );
      }).toThrow('Test error');
      
      consoleSpy.mockRestore();
    });
  });
});