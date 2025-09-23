/**
 * Constants for the React Notificări application
 * All hardcoded strings and configuration values
 */

export const APP_CONSTANTS = {
  APP_NAME: 'React Notificări',
  VERSION: '2.0.0',
  API_BASE_URL: process.env.REACT_APP_API_URL || 'http://localhost:3001',
  DEFAULT_TIMEOUT: 30000,
  RETRY_ATTEMPTS: 3,
} as const;

export const ROUTES = {
  ROOT: '/',
  DASHBOARD: '/dashboard',
  LOGIN: '/login',
  REGISTER: '/register',
  VERIFICATION: '/verification',
  OAUTH_CALLBACK: '/auth/github/callback',
} as const;

export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: '/api/auth/login',
    REGISTER: '/api/auth/register',
    LOGOUT: '/api/auth/logout',
    SESSION: '/api/auth/session',
    VERIFY: '/api/auth/verify',
  },
  ADMIN: {
    CLIENTS: '/api/admin/clients',
    MANAGE_USERS: '/api/admin/manage-users',
    CPANEL: '/api/admin/cpanel',
  },
  CLIENT: {
    SCHEDULE: '/api/client/schedule',
  },
  NOTIFICATIONS: {
    CHECK: '/api/notifications/check',
    SEND: '/api/notifications/send',
  },
  HEALTH: '/api/health',
} as const;

export const USER_ROLES = {
  ADMIN: 'admin',
  CLIENT: 'client',
} as const;

export const VERIFICATION_METHODS = {
  EMAIL: 'email',
  SMS: 'sms',
} as const;

export const VALIDATION_RULES = {
  EMAIL_REGEX: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  PHONE_REGEX: /^(\+4|4|0)[0-9]{8,9}$/,
  PASSWORD_MIN_LENGTH: 8,
  PASSWORD_REGEX: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
  VERIFICATION_CODE_LENGTH: 6,
} as const;

export const MESSAGES = {
  AUTH: {
    LOGIN_SUCCESS: 'Autentificare reușită!',
    LOGIN_FAILED: 'Email sau parolă incorectă.',
    ACCESS_DENIED: 'Nu ai permisiunea să accesezi această resursă.',
    ROLE_ADMIN: 'Acces complet la CPanel administrativ.',
    ROLE_CLIENT: 'Acces la meniul personal de programări.',
    ACCOUNT_LOCKED: 'Cont temporar blocat din motive de securitate.',
    TOKEN_EXPIRED: 'Sesiunea a expirat. Te rugăm să te autentifici din nou.',
    LOGOUT_SUCCESS: 'Deconectare reușită.',
    REGISTRATION_SUCCESS: 'Contul a fost creat cu succes!',
    VERIFICATION_REQUIRED: 'Este necesară verificarea contului.',
  },
  VALIDATION: {
    EMAIL_INVALID: 'Adresa de email nu este validă.',
    PASSWORD_WEAK: 'Parola trebuie să conțină minim 8 caractere, litere mari și mici, cifre și caractere speciale.',
    REQUIRED_FIELD: 'Câmpul este obligatoriu.',
    SMS_INVALID: 'Numărul de telefon nu este valid.',
    VERIFICATION_CODE_INVALID: 'Codul de verificare nu este valid.',
    PHONE_INVALID: 'Numărul de telefon nu este valid.',
  },
  ERRORS: {
    NETWORK_ERROR: 'Eroare de rețea. Verifică conexiunea la internet.',
    SERVER_ERROR: 'Eroare de server. Încearcă din nou mai târziu.',
    GENERIC_ERROR: 'A apărut o eroare neașteptată.',
    UNAUTHORIZED: 'Nu ai autorizația necesară pentru această acțiune.',
    FORBIDDEN: 'Acces interzis.',
    NOT_FOUND: 'Resursa căutată nu a fost găsită.',
  },
  LOADING: {
    DEFAULT: 'Se încarcă...',
    AUTHENTICATING: 'Se verifică autentificarea...',
    SAVING: 'Se salvează...',
    DELETING: 'Se șterge...',
    SENDING: 'Se trimite...',
  },
  SUCCESS: {
    SAVE_SUCCESS: 'Datele au fost salvate cu succes!',
    DELETE_SUCCESS: 'Ștergerea a fost realizată cu succes!',
    SEND_SUCCESS: 'Trimiterea a fost realizată cu succes!',
  },
} as const;

export const THEME_CONSTANTS = {
  COLORS: {
    PRIMARY: '#667eea',
    SECONDARY: '#764ba2',
    SUCCESS: '#10b981',
    WARNING: '#f59e0b',
    ERROR: '#ef4444',
    INFO: '#3b82f6',
  },
  BREAKPOINTS: {
    XS: '480px',
    SM: '768px',
    MD: '1024px',
    LG: '1280px',
    XL: '1536px',
  },
  SPACING: {
    XS: '4px',
    SM: '8px',
    MD: '16px',
    LG: '24px',
    XL: '32px',
    XXL: '48px',
  },
} as const;

export const SECURITY_CONSTANTS = {
  MAX_LOGIN_ATTEMPTS: 5,
  LOCKOUT_DURATION_MS: 15 * 60 * 1000, // 15 minutes
  SESSION_TIMEOUT_MS: 24 * 60 * 60 * 1000, // 24 hours
  CSRF_HEADER: 'X-CSRF-Token',
  RATE_LIMIT_WINDOW: 15 * 60 * 1000, // 15 minutes
  RATE_LIMIT_MAX_REQUESTS: 100,
} as const;