/**
 * Validation utilities following OWASP guidelines
 * All input validation and sanitization functions
 */

import { VALIDATION_RULES, MESSAGES } from '../constants';

/**
 * Validează o adresă de email
 * @param {string} email - Adresa de email de validat
 * @returns {string} Email validat
 * @throws {Error} Dacă email-ul este invalid
 */
export const validateEmail = (email: string): string => {
  if (!email || typeof email !== 'string') {
    throw new Error(MESSAGES.VALIDATION.REQUIRED_FIELD);
  }
  
  const cleanEmail = email.trim().toLowerCase();
  
  if (!VALIDATION_RULES.EMAIL_REGEX.test(cleanEmail)) {
    throw new Error(MESSAGES.VALIDATION.EMAIL_INVALID);
  }
  
  // Additional OWASP security checks
  if (cleanEmail.length > 254) {
    throw new Error(MESSAGES.VALIDATION.EMAIL_INVALID);
  }
  
  return cleanEmail;
};

/**
 * Validează o parolă conform standardelor OWASP
 * @param {string} password - Parola de validat
 * @returns {string} Parola validată
 * @throws {Error} Dacă parola este slabă
 */
export const validatePassword = (password: string): string => {
  if (!password || typeof password !== 'string') {
    throw new Error(MESSAGES.VALIDATION.REQUIRED_FIELD);
  }
  
  if (password.length < VALIDATION_RULES.PASSWORD_MIN_LENGTH) {
    throw new Error(MESSAGES.VALIDATION.PASSWORD_WEAK);
  }
  
  if (!VALIDATION_RULES.PASSWORD_REGEX.test(password)) {
    throw new Error(MESSAGES.VALIDATION.PASSWORD_WEAK);
  }
  
  // Check against common weak passwords
  const commonPasswords = ['password', '123456', 'qwerty', 'admin', 'user'];
  if (commonPasswords.some(weak => password.toLowerCase().includes(weak))) {
    throw new Error(MESSAGES.VALIDATION.PASSWORD_WEAK);
  }
  
  return password;
};

/**
 * Validează un număr de telefon românesc
 * @param {string} phone - Numărul de telefon de validat
 * @returns {string} Numărul de telefon validat
 * @throws {Error} Dacă numărul este invalid
 */
export const validatePhone = (phone: string): string => {
  if (!phone || typeof phone !== 'string') {
    throw new Error(MESSAGES.VALIDATION.REQUIRED_FIELD);
  }
  
  const cleanPhone = phone.replace(/\s+/g, '').replace(/[()-]/g, '');
  
  if (!VALIDATION_RULES.PHONE_REGEX.test(cleanPhone)) {
    throw new Error(MESSAGES.VALIDATION.PHONE_INVALID);
  }
  
  return cleanPhone;
};

/**
 * Validează un cod de verificare
 * @param {string} code - Codul de verificare
 * @returns {string} Codul validat
 * @throws {Error} Dacă codul este invalid
 */
export const validateVerificationCode = (code: string): string => {
  if (!code || typeof code !== 'string') {
    throw new Error(MESSAGES.VALIDATION.REQUIRED_FIELD);
  }
  
  const cleanCode = code.trim();
  
  if (cleanCode.length !== VALIDATION_RULES.VERIFICATION_CODE_LENGTH) {
    throw new Error(MESSAGES.VALIDATION.VERIFICATION_CODE_INVALID);
  }
  
  if (!/^\d+$/.test(cleanCode)) {
    throw new Error(MESSAGES.VALIDATION.VERIFICATION_CODE_INVALID);
  }
  
  return cleanCode;
};

/**
 * Validează un nume (first name, last name)
 * @param {string} name - Numele de validat
 * @returns {string} Numele validat
 * @throws {Error} Dacă numele este invalid
 */
export const validateName = (name: string): string => {
  if (!name || typeof name !== 'string') {
    throw new Error(MESSAGES.VALIDATION.REQUIRED_FIELD);
  }
  
  const cleanName = name.trim();
  
  if (cleanName.length < 2 || cleanName.length > 50) {
    throw new Error('Numele trebuie să aibă între 2 și 50 de caractere.');
  }
  
  // Allow letters, spaces, hyphens and Romanian characters
  if (!/^[a-zA-ZăâîșțĂÂÎȘȚ\s-]+$/.test(cleanName)) {
    throw new Error('Numele poate conține doar litere, spații și cratime.');
  }
  
  return cleanName;
};

/**
 * Sanitizează input pentru prevenir XSS
 * @param {string} input - Input-ul de sanitizat
 * @returns {string} Input-ul sanitizat
 */
export const sanitizeInput = (input: string): string => {
  if (!input || typeof input !== 'string') {
    return '';
  }
  
  return input
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;')
    .trim();
};

/**
 * Validează un număr de înmatriculare auto
 * @param {string} plateNumber - Numărul de înmatriculare
 * @returns {string} Numărul validat
 * @throws {Error} Dacă numărul este invalid
 */
export const validateLicensePlate = (plateNumber: string): string => {
  if (!plateNumber || typeof plateNumber !== 'string') {
    throw new Error(MESSAGES.VALIDATION.REQUIRED_FIELD);
  }
  
  const cleanPlate = plateNumber.toUpperCase().replace(/\s+/g, '');
  
  // Romanian license plate formats
  const romanianPlateRegex = /^[A-Z]{1,2}\d{2,3}[A-Z]{3}$|^B\d{3}[A-Z]{3}$/;
  
  if (!romanianPlateRegex.test(cleanPlate)) {
    throw new Error('Format invalid pentru numărul de înmatriculare.');
  }
  
  return cleanPlate;
};

/**
 * Verifică dacă un string conține caractere malițioase
 * @param {string} input - Input-ul de verificat
 * @returns {boolean} True dacă input-ul este sigur
 */
export const isSafeInput = (input: string): boolean => {
  if (!input || typeof input !== 'string') {
    return true;
  }
  
  // Check for common injection patterns
  const maliciousPatterns = [
    /<script/i,
    /javascript:/i,
    /on\w+\s*=/i,
    /eval\s*\(/i,
    /expression\s*\(/i,
    /<iframe/i,
    /<object/i,
    /<embed/i,
    /vbscript:/i,
    /data:text\/html/i
  ];
  
  return !maliciousPatterns.some(pattern => pattern.test(input));
};

/**
 * Validează o dată de expirare
 * @param {string} dateStr - Data în format string
 * @returns {Date} Data validată
 * @throws {Error} Dacă data este invalidă
 */
export const validateExpirationDate = (dateStr: string): Date => {
  if (!dateStr || typeof dateStr !== 'string') {
    throw new Error(MESSAGES.VALIDATION.REQUIRED_FIELD);
  }
  
  const date = new Date(dateStr);
  
  if (isNaN(date.getTime())) {
    throw new Error('Data de expirare este invalidă.');
  }
  
  const now = new Date();
  if (date <= now) {
    throw new Error('Data de expirare trebuie să fie în viitor.');
  }
  
  // Check if date is not too far in the future (e.g., more than 10 years)
  const maxFutureDate = new Date();
  maxFutureDate.setFullYear(maxFutureDate.getFullYear() + 10);
  
  if (date > maxFutureDate) {
    throw new Error('Data de expirare este prea departe în viitor.');
  }
  
  return date;
};