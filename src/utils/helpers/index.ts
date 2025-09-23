/**
 * Helper utility functions
 * Common utility functions used throughout the application
 */

import { SECURITY_CONSTANTS } from '../constants';

/**
 * Debounce function pentru optimizarea performanței
 * @param {Function} func - Funcția de executat
 * @param {number} wait - Timpul de așteptare în milisecunde
 * @returns {Function} Funcția debounced
 */
export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let timeout: NodeJS.Timeout;
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};

/**
 * Throttle function pentru limitarea ratei de execuție
 * @param {Function} func - Funcția de executat
 * @param {number} limit - Limita de timp în milisecunde
 * @returns {Function} Funcția throttled
 */
export const throttle = <T extends (...args: any[]) => any>(
  func: T,
  limit: number
): ((...args: Parameters<T>) => void) => {
  let inThrottle: boolean;
  
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
};

/**
 * Formatează o dată în format românesc
 * @param {Date | string} date - Data de formatat
 * @param {boolean} includeTime - Dacă să includă și ora
 * @returns {string} Data formatată
 */
export const formatDate = (date: Date | string, includeTime: boolean = false): string => {
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    
    if (isNaN(dateObj.getTime())) {
      return 'Data invalidă';
    }
    
    const options: Intl.DateTimeFormatOptions = {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      timeZone: 'Europe/Bucharest'
    };
    
    if (includeTime) {
      options.hour = '2-digit';
      options.minute = '2-digit';
    }
    
    return dateObj.toLocaleDateString('ro-RO', options);
  } catch (error) {
    console.error('Eroare la formatarea datei:', error);
    return 'Data invalidă';
  }
};

/**
 * Calculează numărul de zile până la expirare
 * @param {Date | string} expirationDate - Data de expirare
 * @returns {number} Numărul de zile (negativ dacă a expirat)
 */
export const getDaysUntilExpiration = (expirationDate: Date | string): number => {
  try {
    const expDate = typeof expirationDate === 'string' ? new Date(expirationDate) : expirationDate;
    const now = new Date();
    
    const diffTime = expDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return diffDays;
  } catch (error) {
    console.error('Eroare la calcularea zilelor până la expirare:', error);
    return 0;
  }
};

/**
 * Generează un ID unic
 * @returns {string} ID-ul generat
 */
export const generateUniqueId = (): string => {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

/**
 * Formateză un număr de telefon pentru afișare
 * @param {string} phone - Numărul de telefon
 * @returns {string} Numărul formatat
 */
export const formatPhone = (phone: string): string => {
  if (!phone) return '';
  
  // Remove all non-digits
  const digits = phone.replace(/\D/g, '');
  
  // Romanian phone number formatting
  if (digits.startsWith('40')) {
    // International format +40
    return `+${digits.slice(0, 2)} ${digits.slice(2, 5)} ${digits.slice(5, 8)} ${digits.slice(8)}`;
  } else if (digits.startsWith('0')) {
    // National format 0xxx xxx xxx
    return `${digits.slice(0, 4)} ${digits.slice(4, 7)} ${digits.slice(7)}`;
  }
  
  return phone;
};

/**
 * Verifică dacă o dată se apropie de expirare
 * @param {Date | string} date - Data de verificat
 * @param {number} daysThreshold - Pragul de zile (default: 7)
 * @returns {boolean} True dacă se apropie de expirare
 */
export const isApproachingExpiration = (date: Date | string, daysThreshold: number = 7): boolean => {
  const daysUntil = getDaysUntilExpiration(date);
  return daysUntil <= daysThreshold && daysUntil >= 0;
};

/**
 * Verifică dacă o dată a expirat
 * @param {Date | string} date - Data de verificat
 * @returns {boolean} True dacă a expirat
 */
export const isExpired = (date: Date | string): boolean => {
  const daysUntil = getDaysUntilExpiration(date);
  return daysUntil < 0;
};

/**
 * Creează un sleep/delay pentru async operations
 * @param {number} ms - Milisecundele de așteptare
 * @returns {Promise<void>} Promise care se rezolvă după delay
 */
export const sleep = (ms: number): Promise<void> => {
  return new Promise(resolve => setTimeout(resolve, ms));
};

/**
 * Retry mechanism cu exponential backoff
 * @param {Function} fn - Funcția de executat
 * @param {number} maxRetries - Numărul maxim de încercări
 * @param {number} baseDelay - Delay-ul de bază în ms
 * @returns {Promise<any>} Rezultatul funcției
 */
export const retryWithBackoff = async <T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<T> => {
  let lastError: Error;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      
      if (attempt === maxRetries) {
        throw lastError;
      }
      
      const delay = baseDelay * Math.pow(2, attempt);
      await sleep(delay);
    }
  }
  
  throw lastError!;
};

/**
 * Verifică dacă browserul suportă localStorage
 * @returns {boolean} True dacă localStorage este disponibil
 */
export const isLocalStorageAvailable = (): boolean => {
  try {
    const test = '__localStorage_test__';
    localStorage.setItem(test, test);
    localStorage.removeItem(test);
    return true;
  } catch {
    return false;
  }
};

/**
 * Securizează un obiect prin copierea doar a proprietăților permise
 * @param {object} obj - Obiectul de securizat
 * @param {string[]} allowedKeys - Cheile permise
 * @returns {object} Obiectul securizat
 */
export const sanitizeObject = <T extends Record<string, any>>(
  obj: T,
  allowedKeys: (keyof T)[]
): Partial<T> => {
  const sanitized: Partial<T> = {};
  
  allowedKeys.forEach(key => {
    if (key in obj) {
      sanitized[key] = obj[key];
    }
  });
  
  return sanitized;
};

/**
 * Verifică rate limiting local pentru prevenir abuse
 * @param {string} key - Cheia pentru rate limiting
 * @param {number} maxAttempts - Numărul maxim de încercări
 * @param {number} windowMs - Fereastra de timp în milisecunde
 * @returns {boolean} True dacă acțiunea este permisă
 */
export const checkRateLimit = (
  key: string,
  maxAttempts: number = SECURITY_CONSTANTS.RATE_LIMIT_MAX_REQUESTS,
  windowMs: number = SECURITY_CONSTANTS.RATE_LIMIT_WINDOW
): boolean => {
  if (!isLocalStorageAvailable()) {
    return true; // Allow if localStorage not available
  }
  
  const now = Date.now();
  const rateLimitKey = `rate_limit_${key}`;
  
  try {
    const storedData = localStorage.getItem(rateLimitKey);
    const data = storedData ? JSON.parse(storedData) : { attempts: 0, windowStart: now };
    
    // Reset window if expired
    if (now - data.windowStart > windowMs) {
      data.attempts = 0;
      data.windowStart = now;
    }
    
    // Check if limit exceeded
    if (data.attempts >= maxAttempts) {
      return false;
    }
    
    // Increment and save
    data.attempts++;
    localStorage.setItem(rateLimitKey, JSON.stringify(data));
    
    return true;
  } catch (error) {
    console.error('Eroare la verificarea rate limit:', error);
    return true; // Allow on error
  }
};

/**
 * Calculează tăria unei parole
 * @param {string} password - Parola de evaluat
 * @returns {object} Obiect cu scorul și feedback
 */
export const calculatePasswordStrength = (password: string): {
  score: number;
  feedback: string[];
  strength: 'weak' | 'fair' | 'good' | 'strong';
} => {
  let score = 0;
  const feedback: string[] = [];
  
  if (!password) {
    return { score: 0, feedback: ['Introduceți o parolă'], strength: 'weak' };
  }
  
  // Length check
  if (password.length >= 8) score += 25;
  else feedback.push('Folosiți cel puțin 8 caractere');
  
  // Lowercase check
  if (/[a-z]/.test(password)) score += 25;
  else feedback.push('Adăugați litere mici');
  
  // Uppercase check
  if (/[A-Z]/.test(password)) score += 25;
  else feedback.push('Adăugați litere mari');
  
  // Number check
  if (/\d/.test(password)) score += 25;
  else feedback.push('Adăugați cifre');
  
  // Special character check
  if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) score += 25;
  else feedback.push('Adăugați caractere speciale');
  
  // Bonus for length
  if (password.length >= 12) score += 10;
  
  // Penalty for common patterns
  if (/(.)\1{2,}/.test(password)) score -= 10; // Repeated characters
  if (/123|abc|qwe/i.test(password)) score -= 15; // Sequential characters
  
  let strength: 'weak' | 'fair' | 'good' | 'strong';
  if (score < 50) strength = 'weak';
  else if (score < 75) strength = 'fair';
  else if (score < 90) strength = 'good';
  else strength = 'strong';
  
  return { score: Math.max(0, Math.min(100, score)), feedback, strength };
};