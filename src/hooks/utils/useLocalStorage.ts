/**
 * Custom hook for secure localStorage management
 * Implements OWASP secure storage patterns
 */

import { useState, useEffect, useCallback } from 'react';
import { isLocalStorageAvailable } from '../../utils/helpers';

/**
 * Hook pentru gestionarea securizată a localStorage
 * @param key - Cheia pentru localStorage
 * @param defaultValue - Valoarea implicită
 * @returns [value, setValue, removeValue]
 */
export function useLocalStorage<T>(
  key: string,
  defaultValue: T
): [T, (value: T) => void, () => void] {
  // Check if localStorage is available
  const isAvailable = isLocalStorageAvailable();

  const [storedValue, setStoredValue] = useState<T>(() => {
    if (!isAvailable) {
      return defaultValue;
    }

    try {
      const item = localStorage.getItem(key);
      if (item === null) {
        return defaultValue;
      }
      
      // Parse JSON safely
      return JSON.parse(item);
    } catch (error) {
      console.warn(`Eroare la citirea din localStorage pentru cheia "${key}":`, error);
      return defaultValue;
    }
  });

  /**
   * Set value în localStorage
   */
  const setValue = useCallback((value: T) => {
    try {
      setStoredValue(value);
      
      if (isAvailable) {
        // Remove item if value is null or undefined
        if (value === null || value === undefined) {
          localStorage.removeItem(key);
        } else {
          localStorage.setItem(key, JSON.stringify(value));
        }
      }
    } catch (error) {
      console.error(`Eroare la scrierea în localStorage pentru cheia "${key}":`, error);
    }
  }, [key, isAvailable]);

  /**
   * Remove value din localStorage
   */
  const removeValue = useCallback(() => {
    try {
      setStoredValue(defaultValue);
      
      if (isAvailable) {
        localStorage.removeItem(key);
      }
    } catch (error) {
      console.error(`Eroare la ștergerea din localStorage pentru cheia "${key}":`, error);
    }
  }, [key, defaultValue, isAvailable]);

  // Listen for storage changes from other tabs/windows
  useEffect(() => {
    if (!isAvailable) return;

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === key && e.newValue !== null) {
        try {
          setStoredValue(JSON.parse(e.newValue));
        } catch (error) {
          console.warn(`Eroare la parsarea valorii din storage event pentru cheia "${key}":`, error);
        }
      } else if (e.key === key && e.newValue === null) {
        setStoredValue(defaultValue);
      }
    };

    window.addEventListener('storage', handleStorageChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [key, defaultValue, isAvailable]);

  return [storedValue, setValue, removeValue];
}

/**
 * Hook pentru secure session storage
 */
export function useSessionStorage<T>(
  key: string,
  defaultValue: T
): [T, (value: T) => void, () => void] {
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = sessionStorage.getItem(key);
      return item ? JSON.parse(item) : defaultValue;
    } catch (error) {
      console.warn(`Eroare la citirea din sessionStorage pentru cheia "${key}":`, error);
      return defaultValue;
    }
  });

  const setValue = useCallback((value: T) => {
    try {
      setStoredValue(value);
      
      if (value === null || value === undefined) {
        sessionStorage.removeItem(key);
      } else {
        sessionStorage.setItem(key, JSON.stringify(value));
      }
    } catch (error) {
      console.error(`Eroare la scrierea în sessionStorage pentru cheia "${key}":`, error);
    }
  }, [key]);

  const removeValue = useCallback(() => {
    try {
      setStoredValue(defaultValue);
      sessionStorage.removeItem(key);
    } catch (error) {
      console.error(`Eroare la ștergerea din sessionStorage pentru cheia "${key}":`, error);
    }
  }, [key, defaultValue]);

  return [storedValue, setValue, removeValue];
}

export default useLocalStorage;