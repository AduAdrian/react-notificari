// Export pentru toate componentele de verificare
export { default as SmsVerification } from './SmsVerification';
export { default as EmailVerification } from './EmailVerification';
export { default as VerificationWrapper } from './VerificationWrapper';

// Export pentru CSS-ul componentelor
import './VerificationComponents.css';

// Tipuri utile pentru alte componente
export type VerificationMethod = 'sms' | 'email';

export interface VerificationCallbacks {
    onVerificationSuccess: (code: string) => Promise<void>;
    onResendCode: () => Promise<void>;
    onBack?: () => void;
}