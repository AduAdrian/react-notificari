import React from 'react';
import { render, screen, act } from '@testing-library/react';
import App from './App';

// Mock pentru AuthContext să nu verifice sesiunea în teste
jest.mock('./context/AuthContext', () => {
  const mockReact = require('react');
  return {
    AuthProvider: ({ children }: { children: React.ReactNode }) => mockReact.createElement('div', null, children),
    useAuth: () => ({
      user: null,
      login: jest.fn(),
      logout: jest.fn(),
      isLoading: false
    })
  };
});

test('renders login page when not authenticated', async () => {
  await act(async () => {
    render(<App />);
  });
  const welcomeElement = screen.getByText(/Bine ai venit!/i);
  expect(welcomeElement).toBeInTheDocument();
});

test('localStorage is available for non-auth data', () => {
  // Verifică că localStorage este disponibil pentru date non-critice
  expect(typeof localStorage.setItem).toBe('function');
  expect(typeof localStorage.getItem).toBe('function');
});
