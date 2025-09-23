import React from 'react';
import { render, screen } from '@testing-library/react';
import App from './App';

test('renders login page when not authenticated', () => {
  render(<App />);
  const welcomeElement = screen.getByText(/Bine ai venit!/i);
  expect(welcomeElement).toBeInTheDocument();
});

test('localStorage is cleared before test', () => {
  // Verifică că localStorage este gol la începutul testului
  expect(localStorage.getItem('token')).toBeNull();
  expect(localStorage.getItem('user')).toBeNull();
  expect(localStorage.length).toBe(0);
});
