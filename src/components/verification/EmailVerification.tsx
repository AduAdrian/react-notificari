import React, { useState, useRef, useEffect } from 'react';
import './VerificationComponents.css';

interface EmailVerificationProps {
    email: string;
    onVerificationSuccess: (code: string) => void;
    onResendCode: () => void;
    onBack?: () => void;
    isLoading?: boolean;
}

const EmailVerification: React.FC<EmailVerificationProps> = ({
    email,
    onVerificationSuccess,
    onResendCode,
    onBack,
    isLoading = false
}) => {
    const [code, setCode] = useState<string[]>(['', '', '', '', '', '']);
    const [error, setError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

    useEffect(() => {
        // Focus pe primul input la mount
        if (inputRefs.current[0]) {
            inputRefs.current[0].focus();
        }
    }, []);

    const handleInputChange = (index: number, value: string) => {
        // Permite doar cifre
        if (value && !/^\d$/.test(value)) {
            return;
        }

        const newCode = [...code];
        newCode[index] = value;
        setCode(newCode);
        setError(''); // Clear error când utilizatorul tipărește

        // Mută focus-ul la următorul input dacă s-a introdus o cifră
        if (value && index < 5 && inputRefs.current[index + 1]) {
            inputRefs.current[index + 1]?.focus();
        }

        // Auto-submit când toate 6 cifre sunt completate
        if (newCode.every(digit => digit !== '')) {
            handleSubmit(newCode.join(''));
        }
    };

    const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Backspace' && !code[index] && index > 0) {
            // Mută focus-ul la input-ul anterior când se face backspace pe unul gol
            inputRefs.current[index - 1]?.focus();
        } else if (e.key === 'ArrowLeft' && index > 0) {
            inputRefs.current[index - 1]?.focus();
        } else if (e.key === 'ArrowRight' && index < 5) {
            inputRefs.current[index + 1]?.focus();
        } else if (e.key === 'Enter') {
            handleSubmit(code.join(''));
        }
    };

    const handlePaste = (e: React.ClipboardEvent) => {
        e.preventDefault();
        const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
        
        if (pastedData.length === 6) {
            const newCode = pastedData.split('');
            setCode(newCode);
            setError('');
            
            // Focus pe ultimul input
            inputRefs.current[5]?.focus();
            
            // Auto-submit
            handleSubmit(pastedData);
        }
    };

    const handleSubmit = async (codeToSubmit: string) => {
        if (codeToSubmit.length !== 6) {
            setError('Vă rugăm să introduceți toate cele 6 cifre');
            return;
        }

        if (isSubmitting) return;

        try {
            setIsSubmitting(true);
            setError('');
            await onVerificationSuccess(codeToSubmit);
        } catch (error: any) {
            setError(error.message || 'Cod invalid. Vă rugăm să încercați din nou.');
            // Clear codul în caz de eroare
            setCode(['', '', '', '', '', '']);
            inputRefs.current[0]?.focus();
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleResendCode = () => {
        setCode(['', '', '', '', '', '']);
        setError('');
        onResendCode();
        // Focus pe primul input după resend
        setTimeout(() => {
            inputRefs.current[0]?.focus();
        }, 100);
    };

    const maskEmail = (email: string) => {
        // Masca email-ul (ex: test@example.com -> t***@example.com)
        const [localPart, domain] = email.split('@');
        if (localPart && domain) {
            const maskedLocal = localPart.charAt(0) + '***' + localPart.slice(-1);
            return `${maskedLocal}@${domain}`;
        }
        return email;
    };

    return (
        <div className="verification-container">
            <div className="verification-card">
                <div className="verification-header">
                    <div className="verification-icon">
                        📧
                    </div>
                    <h2>Verifică codul</h2>
                    <p className="verification-message">
                        Am trimis un cod de verificare de 6 cifre prin email la adresa ta.
                    </p>
                    <div className="email-display">
                        {maskEmail(email)}
                    </div>
                </div>

                <div className="verification-form">
                    <div className="code-input-container" onPaste={handlePaste}>
                        {code.map((digit, index) => (
                            <input
                                key={index}
                                ref={el => {
                                    inputRefs.current[index] = el;
                                }}
                                type="text"
                                inputMode="numeric"
                                pattern="[0-9]"
                                maxLength={1}
                                value={digit}
                                onChange={e => handleInputChange(index, e.target.value)}
                                onKeyDown={e => handleKeyDown(index, e)}
                                className={`code-input ${error ? 'error' : ''} ${digit ? 'filled' : ''}`}
                                disabled={isSubmitting || isLoading}
                                autoComplete="one-time-code"
                                placeholder="0"
                                title={`Cifra ${index + 1} din codul de verificare`}
                                aria-label={`Cifra ${index + 1} din codul de verificare`}
                            />
                        ))}
                    </div>

                    {error && (
                        <div className="error-message">
                            ⚠️ {error}
                        </div>
                    )}

                    <button
                        type="button"
                        onClick={() => handleSubmit(code.join(''))}
                        disabled={code.some(digit => !digit) || isSubmitting || isLoading}
                        className="verify-button"
                    >
                        {isSubmitting || isLoading ? (
                            <div className="loading-spinner">
                                <div className="spinner"></div>
                                Verificare...
                            </div>
                        ) : (
                            'VERIFICĂ CODUL'
                        )}
                    </button>

                    <div className="verification-actions">
                        <button
                            type="button"
                            onClick={handleResendCode}
                            disabled={isSubmitting || isLoading}
                            className="resend-button"
                        >
                            📧 Retrimite codul
                        </button>

                        {onBack && (
                            <button
                                type="button"
                                onClick={onBack}
                                disabled={isSubmitting || isLoading}
                                className="back-button"
                            >
                                ← Înapoi la înregistrare
                            </button>
                        )}
                    </div>
                </div>

                <div className="email-help">
                    <p className="help-text">
                        💡 <strong>Sfat:</strong> Verifică și folderul Spam/Junk în cazul în care nu vezi email-ul în inbox.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default EmailVerification;