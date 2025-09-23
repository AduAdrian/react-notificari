// jest-dom adds custom jest matchers for asserting on DOM nodes.
// allows you to do things like:
// expect(element).toHaveTextContent(/react/i)
// learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom';

// Mock pentru fetch API în toate testele
global.fetch = jest.fn(() =>
    Promise.resolve({
        ok: false,
        json: () => Promise.resolve({ success: false, authenticated: false })
    })
);
