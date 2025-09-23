// jest-dom adds custom jest matchers for asserting on DOM nodes.
// allows you to do things like:
// expect(element).toHaveTextContent(/react/i)
// learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom';
import React from 'react';

// Mock pentru fetch API în toate testele
const mockResponse = {
    ok: false,
    json: () => Promise.resolve({ success: false, authenticated: false })
};

jest.spyOn(global, 'fetch').mockImplementation(() => Promise.resolve(mockResponse) as any);

// Mock pentru react-router-dom
jest.mock('react-router-dom', () => ({
    BrowserRouter: ({ children }: { children: React.ReactNode }) => React.createElement('div', null, children),
    Routes: ({ children }: { children: React.ReactNode }) => React.createElement('div', null, children),
    Route: ({ element }: { element: React.ReactElement }) => element,
    Navigate: () => React.createElement('div', null, 'Navigate component'),
    useNavigate: () => jest.fn(),
    useLocation: () => ({ pathname: '/', search: '', hash: '', state: null }),
    useParams: () => ({}),
    Link: ({ children, to }: { children: React.ReactNode; to: string }) =>
        React.createElement('a', { href: to }, children),
}));

// Curăță localStorage și sessionStorage înainte de fiecare test pentru a evita interferențe
// NOTĂ: Nu mai ștergem datele de autentificare deoarece acum folosim sesiuni pe backend
beforeEach(() => {
    // Curățăm doar datele non-critice (cache, preferințe UI, etc.)
    // Datele de autentificare sunt gestionate de backend prin sesiuni
    localStorage.clear();
    sessionStorage.clear();
});// Mock pentru localStorage și sessionStorage în cazul în care nu sunt disponibile
const createMockStorage = () => {
    let storage: { [key: string]: string } = {};
    return {
        getItem: (key: string) => storage[key] || null,
        setItem: (key: string, value: string) => {
            storage[key] = value.toString();
        },
        removeItem: (key: string) => {
            delete storage[key];
        },
        clear: () => {
            storage = {};
        },
        get length() {
            return Object.keys(storage).length;
        },
        key: (index: number) => {
            const keys = Object.keys(storage);
            return keys[index] || null;
        },
    };
};

// Asigură că localStorage și sessionStorage sunt disponibile în teste
Object.defineProperty(window, 'localStorage', {
    value: createMockStorage(),
    writable: true,
});

Object.defineProperty(window, 'sessionStorage', {
    value: createMockStorage(),
    writable: true,
});
