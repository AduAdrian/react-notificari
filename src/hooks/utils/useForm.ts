/**
 * Custom hook for form management
 * Handles form state, validation, and submission with security patterns
 */

import { useState, useCallback, useMemo, useRef } from 'react';
import { debounce } from '../../utils/helpers';

export interface FormField<T = any> {
  value: T;
  error?: string;
  touched?: boolean;
  dirty?: boolean;
}

export interface FormState<T extends Record<string, any>> {
  [K in keyof T]: FormField<T[K]>;
}

export interface ValidationRules<T> {
  [K in keyof T]?: {
    required?: boolean;
    validator?: (value: T[K], formData: T) => string | null;
    asyncValidator?: (value: T[K], formData: T) => Promise<string | null>;
  };
}

export interface UseFormOptions<T> {
  initialValues: T;
  validationRules?: ValidationRules<T>;
  onSubmit?: (values: T) => Promise<void> | void;
  validateOnChange?: boolean;
  validateOnBlur?: boolean;
  debounceMs?: number;
}

export interface UseFormReturn<T> {
  values: T;
  errors: Partial<Record<keyof T, string>>;
  touched: Partial<Record<keyof T, boolean>>;
  dirty: Partial<Record<keyof T, boolean>>;
  isValid: boolean;
  isSubmitting: boolean;
  isDirty: boolean;
  
  // Methods
  setValue: <K extends keyof T>(field: K, value: T[K]) => void;
  setError: <K extends keyof T>(field: K, error: string) => void;
  clearError: <K extends keyof T>(field: K) => void;
  clearAllErrors: () => void;
  setTouched: <K extends keyof T>(field: K, touched?: boolean) => void;
  validateField: <K extends keyof T>(field: K) => Promise<boolean>;
  validateAll: () => Promise<boolean>;
  handleSubmit: (event?: React.FormEvent) => Promise<void>;
  reset: (newValues?: Partial<T>) => void;
  
  // Field helpers
  getFieldProps: <K extends keyof T>(field: K) => {
    value: T[K];
    onChange: (value: T[K]) => void;
    onBlur: () => void;
    error?: string;
    name: string;
  };
}

/**
 * Custom hook pentru gestionarea formularelor cu validare și securitate
 */
export function useForm<T extends Record<string, any>>({
  initialValues,
  validationRules = {},
  onSubmit,
  validateOnChange = true,
  validateOnBlur = true,
  debounceMs = 300,
}: UseFormOptions<T>): UseFormReturn<T> {
  
  // Form state
  const [formState, setFormState] = useState<FormState<T>>(() => {
    const state: any = {};
    Object.keys(initialValues).forEach(key => {
      state[key] = {
        value: initialValues[key as keyof T],
        error: undefined,
        touched: false,
        dirty: false,
      };
    });
    return state;
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const submitAttempted = useRef(false);

  // Extract current values, errors, etc.
  const values = useMemo(() => {
    const vals: any = {};
    Object.keys(formState).forEach(key => {
      vals[key] = formState[key as keyof T].value;
    });
    return vals as T;
  }, [formState]);

  const errors = useMemo(() => {
    const errs: any = {};
    Object.keys(formState).forEach(key => {
      const error = formState[key as keyof T].error;
      if (error) {
        errs[key] = error;
      }
    });
    return errs as Partial<Record<keyof T, string>>;
  }, [formState]);

  const touched = useMemo(() => {
    const touchedFields: any = {};
    Object.keys(formState).forEach(key => {
      if (formState[key as keyof T].touched) {
        touchedFields[key] = true;
      }
    });
    return touchedFields as Partial<Record<keyof T, boolean>>;
  }, [formState]);

  const dirty = useMemo(() => {
    const dirtyFields: any = {};
    Object.keys(formState).forEach(key => {
      if (formState[key as keyof T].dirty) {
        dirtyFields[key] = true;
      }
    });
    return dirtyFields as Partial<Record<keyof T, boolean>>;
  }, [formState]);

  const isValid = useMemo(() => {
    return Object.keys(errors).length === 0;
  }, [errors]);

  const isDirty = useMemo(() => {
    return Object.keys(dirty).length > 0;
  }, [dirty]);

  /**
   * Validate a single field
   */
  const validateField = useCallback(async <K extends keyof T>(field: K): Promise<boolean> => {
    const rules = validationRules[field];
    if (!rules) return true;

    const value = formState[field].value;
    let error: string | null = null;

    // Required validation
    if (rules.required) {
      if (value === null || value === undefined || value === '') {
        error = 'Câmpul este obligatoriu';
      }
    }

    // Custom synchronous validation
    if (!error && rules.validator) {
      try {
        error = rules.validator(value, values);
      } catch (err) {
        error = 'Eroare de validare';
        console.error('Validation error:', err);
      }
    }

    // Async validation
    if (!error && rules.asyncValidator) {
      try {
        error = await rules.asyncValidator(value, values);
      } catch (err) {
        error = 'Eroare de validare';
        console.error('Async validation error:', err);
      }
    }

    // Update field error
    setFormState(prev => ({
      ...prev,
      [field]: {
        ...prev[field],
        error: error || undefined,
      },
    }));

    return !error;
  }, [formState, validationRules, values]);

  /**
   * Validate all fields
   */
  const validateAll = useCallback(async (): Promise<boolean> => {
    const fieldNames = Object.keys(formState) as (keyof T)[];
    const validationResults = await Promise.all(
      fieldNames.map(field => validateField(field))
    );
    
    return validationResults.every(result => result);
  }, [formState, validateField]);

  /**
   * Debounced validation for better UX
   */
  const debouncedValidateField = useMemo(
    () => debounce(validateField, debounceMs),
    [validateField, debounceMs]
  );

  /**
   * Set field value
   */
  const setValue = useCallback(<K extends keyof T>(field: K, value: T[K]) => {
    setFormState(prev => ({
      ...prev,
      [field]: {
        ...prev[field],
        value,
        dirty: value !== initialValues[field],
      },
    }));

    // Validate on change if enabled
    if (validateOnChange && (formState[field].touched || submitAttempted.current)) {
      debouncedValidateField(field);
    }
  }, [formState, initialValues, validateOnChange, debouncedValidateField]);

  /**
   * Set field error
   */
  const setError = useCallback(<K extends keyof T>(field: K, error: string) => {
    setFormState(prev => ({
      ...prev,
      [field]: {
        ...prev[field],
        error,
      },
    }));
  }, []);

  /**
   * Clear field error
   */
  const clearError = useCallback(<K extends keyof T>(field: K) => {
    setFormState(prev => ({
      ...prev,
      [field]: {
        ...prev[field],
        error: undefined,
      },
    }));
  }, []);

  /**
   * Clear all errors
   */
  const clearAllErrors = useCallback(() => {
    setFormState(prev => {
      const newState = { ...prev };
      Object.keys(newState).forEach(key => {
        newState[key as keyof T] = {
          ...newState[key as keyof T],
          error: undefined,
        };
      });
      return newState;
    });
  }, []);

  /**
   * Set field touched
   */
  const setTouched = useCallback(<K extends keyof T>(field: K, touchedValue = true) => {
    setFormState(prev => ({
      ...prev,
      [field]: {
        ...prev[field],
        touched: touchedValue,
      },
    }));

    // Validate on blur if enabled and field has value
    if (validateOnBlur && touchedValue && formState[field].value) {
      validateField(field);
    }
  }, [formState, validateOnBlur, validateField]);

  /**
   * Handle form submission
   */
  const handleSubmit = useCallback(async (event?: React.FormEvent) => {
    if (event) {
      event.preventDefault();
    }

    submitAttempted.current = true;
    setIsSubmitting(true);

    try {
      // Mark all fields as touched
      setFormState(prev => {
        const newState = { ...prev };
        Object.keys(newState).forEach(key => {
          newState[key as keyof T] = {
            ...newState[key as keyof T],
            touched: true,
          };
        });
        return newState;
      });

      // Validate all fields
      const isFormValid = await validateAll();
      
      if (!isFormValid) {
        console.warn('Form validation failed');
        return;
      }

      // Call submit handler
      if (onSubmit) {
        await onSubmit(values);
      }
    } catch (error) {
      console.error('Form submission error:', error);
      throw error;
    } finally {
      setIsSubmitting(false);
    }
  }, [validateAll, onSubmit, values]);

  /**
   * Reset form
   */
  const reset = useCallback((newValues?: Partial<T>) => {
    const resetValues = { ...initialValues, ...newValues };
    
    setFormState(() => {
      const state: any = {};
      Object.keys(resetValues).forEach(key => {
        state[key] = {
          value: resetValues[key as keyof T],
          error: undefined,
          touched: false,
          dirty: false,
        };
      });
      return state;
    });

    submitAttempted.current = false;
    setIsSubmitting(false);
  }, [initialValues]);

  /**
   * Get field props for easy integration with form components
   */
  const getFieldProps = useCallback(<K extends keyof T>(field: K) => ({
    value: formState[field].value,
    onChange: (value: T[K]) => setValue(field, value),
    onBlur: () => setTouched(field, true),
    error: formState[field].error,
    name: String(field),
  }), [formState, setValue, setTouched]);

  return {
    values,
    errors,
    touched,
    dirty,
    isValid,
    isSubmitting,
    isDirty,
    setValue,
    setError,
    clearError,
    clearAllErrors,
    setTouched,
    validateField,
    validateAll,
    handleSubmit,
    reset,
    getFieldProps,
  };
}