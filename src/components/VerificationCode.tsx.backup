import React, { useState, useRef, useEffect } from 'react';
import './VerificationCode.css';

interface VerificationCodeProps {
    email: string;
    method: 'email' | 'sms';
    onVerificationSuccess: (userData: { email: string; name: string }) => void;
    onBackToRegister: () => void;
}

const VerificationCode: React.FC<VerificationCodeProps> = ({
    email,
    method,
    onVerificationSuccess,
    onBackToRegister
}) => {
    const [code, setCode] = useState<string[]>(['', '', '', '', '', '']);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string>('');
    const [canResend, setCanResend] = useState(false);
    const [countdown, setCountdown] = useState(60);
    const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

    // Countdown pentru resend
    useEffect(() => {
        if (countdown > 0) {
            const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
            return () => clearTimeout(timer);
        } else {
            setCanResend(true);
        }
    }, [countdown]);

    // Focus primul input la mount
    useEffect(() => {
        inputRefs.current[0]?.focus();
    }, []);

    const handleInputChange = (index: number, value: string) => {
        // Permite doar cifre
        if (!/^\d*$/.test(value)) return;

        const newCode = [...code];
        newCode[index] = value;
        setCode(newCode);
        setError('');

        // Auto-focus următorul input
        if (value && index < 5) {
            inputRefs.current[index + 1]?.focus();
        }

        // Auto-submit când toate câmpurile sunt completate
        if (value && index === 5) {
            const completeCode = [...newCode];
            if (completeCode.every(digit => digit !== '')) {
                setTimeout(() => handleVerification(completeCode.join('')), 100);
            }
        }
    };

    const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Backspace') {
            if (code[index] === '' && index > 0) {
                // Dacă câmpul curent este gol, șterge din câmpul anterior
                const newCode = [...code];
                newCode[index - 1] = '';
                setCode(newCode);
                inputRefs.current[index - 1]?.focus();
            } else {
                // Șterge din câmpul curent
                const newCode = [...code];
                newCode[index] = '';
                setCode(newCode);
            }
        } else if (e.key === 'ArrowLeft' && index > 0) {
            inputRefs.current[index - 1]?.focus();
        } else if (e.key === 'ArrowRight' && index < 5) {
            inputRefs.current[index + 1]?.focus();
        }
    };

    const handlePaste = (e: React.ClipboardEvent) => {
        e.preventDefault();
        const pastedText = e.clipboardData.getData('text');
        const digits = pastedText.replace(/\D/g, '').slice(0, 6);

        if (digits.length === 6) {
            const newCode = digits.split('');
            setCode(newCode);
            // Auto-submit după paste
            setTimeout(() => handleVerification(digits), 100);
        }
    };

    const handleVerification = async (verificationCode: string) => {
        setIsLoading(true);
        setError('');

        try {
            const response = await fetch('http://localhost:3001/api/auth/verify', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    email,
                    verificationCode
                })
            });

            const data = await response.json();

            if (data.success) {
                // Salvăm token-ul în localStorage
                localStorage.setItem('token', data.token);

                const userData = {
                    email: data.user.email,
                    name: `${data.user.firstName} ${data.user.lastName}`
                };

                onVerificationSuccess(userData);
            } else {
                setError(data.message || 'Cod de verificare incorect');
                // Resetează codul la eroare
                setCode(['', '', '', '', '', '']);
                inputRefs.current[0]?.focus();
            }
        } catch (error) {
            console.error('Eroare de verificare:', error);
            setError('Eroare de conexiune. Verificați dacă backend-ul rulează.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleResendCode = async () => {
        setIsLoading(true);
        setError('');

        try {
            const response = await fetch('http://localhost:3001/api/auth/resend-code', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email })
            });

            const data = await response.json();

            if (data.success) {
                setCanResend(false);
                setCountdown(60);
                setCode(['', '', '', '', '', '']);
                inputRefs.current[0]?.focus();
            } else {
                setError(data.message || 'Eroare la retrimierea codului');
            }
        } catch (error) {
            console.error('Eroare retrimite cod:', error);
            setError('Eroare de conexiune. Încercați din nou.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleManualSubmit = () => {
        const fullCode = code.join('');
        if (fullCode.length === 6) {
            handleVerification(fullCode);
        } else {
            setError('Vă rugăm să introduceți toate cele 6 cifre');
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        handleManualSubmit();
    }; return (
        <div className="verification-container">
            <div className="verification-card">
                <div className="verification-header">
                    <div className="icon-large">
                        {method === 'email' ? '📧' : '📱'}
                    </div>
                    <h2>Verifică contul</h2>
                    <p>
                        Am trimis un cod de verificare de 6 cifre {method === 'email' ? 'la email-ul' : 'prin SMS la numărul'} tău.
                    </p>
                    <div className="contact-info">
                        <strong>{email}</strong>
                    </div>
                </div>

                <div className="verification-form">
                    <form onSubmit={handleSubmit} role="form" aria-labelledby="verification-title" aria-describedby="verification-instructions">
                        <div className="code-inputs" onPaste={handlePaste}>
                            {code.map((digit, index) => (
                                <input
                                    key={index}
                                    ref={el => { inputRefs.current[index] = el; }}
                                    type="text"
                                    maxLength={1}
                                    value={digit}
                                    onChange={e => handleInputChange(index, e.target.value)}
                                    onKeyDown={e => handleKeyDown(index, e)}
                                    className={`code-input ${error ? 'error' : ''} ${digit ? 'filled' : ''}`}
                                    disabled={isLoading}
                                    placeholder="0"
                                    aria-label={`Cifra ${index + 1} din codul de verificare`}
                                />
                            ))}
                        </div>

                        {error && (
                            <div className="error-message">
                                <span className="error-icon">⚠️</span>
                                {error}
                            </div>
                        )}

                        <button
                            onClick={handleManualSubmit}
                            className={`verify-button ${isLoading ? 'loading' : ''}`}
                            disabled={isLoading || code.join('').length !== 6}
                        >
                            {isLoading ? 'Se verifică...' : 'Verifică codul'}
                        </button>

                        <div className="resend-section">
                            {!canResend ? (
                                <p className="countdown-text">
                                    Poți retrimite codul în <strong>{countdown}</strong> secunde
                                </p>
                            ) : (
                                <button
                                    onClick={handleResendCode}
                                    className="resend-button"
                                    disabled={isLoading}
                                >
                                    📤 Retrimite codul
                                </button>
                            )}
                        </div>

                        <div className="back-section">
                            <button
                                onClick={onBackToRegister}
                                className="back-button"
                                disabled={isLoading}
                            >
                                ← Înapoi la înregistrare
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default VerificationCode;