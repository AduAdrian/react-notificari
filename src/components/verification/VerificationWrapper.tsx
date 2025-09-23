import React from 'react';
import SmsVerification from './SmsVerification';
import EmailVerification from './EmailVerification';
import { useAuth } from '../../context/AuthContext';

type VerificationMethod = 'sms' | 'email';

interface VerificationWrapperProps {
    method: VerificationMethod;
    contact: string; // phoneNumber pentru SMS, email pentru Email
    onSuccess: () => void;
    onBack?: () => void;
}

const VerificationWrapper: React.FC<VerificationWrapperProps> = ({
    method,
    contact,
    onSuccess,
    onBack
}) => {
    const { token } = useAuth();
    const [isLoading, setIsLoading] = React.useState(false);

    const handleVerificationSuccess = async (code: string) => {
        setIsLoading(true);

        try {
            const response = await fetch('/api/auth/verify', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...(token && { 'Authorization': `Bearer ${token}` })
                },
                body: JSON.stringify({
                    verificationCode: code,
                    method: method
                })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Cod de verificare invalid');
            }

            if (data.success) {
                // Apelează callback-ul de succes
                onSuccess();
            } else {
                throw new Error(data.message || 'Verificare eșuată');
            }

        } catch (error: any) {
            throw new Error(error.message || 'Eroare la verificarea codului');
        } finally {
            setIsLoading(false);
        }
    };

    const handleResendCode = async () => {
        setIsLoading(true);

        try {
            const response = await fetch('/api/auth/resend-code', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...(token && { 'Authorization': `Bearer ${token}` })
                },
                body: JSON.stringify({
                    method: method,
                    contact: contact
                })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Eroare la retrimiterea codului');
            }

            // Afișează mesaj de succes (opțional)
            if (data.success) {
                // Poți adăuga o notificare de success aici
                console.log(`Cod ${method === 'sms' ? 'SMS' : 'email'} retrimis cu succes`);
            }

        } catch (error: any) {
            console.error('Eroare la retrimiterea codului:', error);
            // Poți afișa o notificare de eroare aici
        } finally {
            setIsLoading(false);
        }
    };

    if (method === 'sms') {
        return (
            <SmsVerification
                phoneNumber={contact}
                onVerificationSuccess={handleVerificationSuccess}
                onResendCode={handleResendCode}
                onBack={onBack}
                isLoading={isLoading}
            />
        );
    }

    if (method === 'email') {
        return (
            <EmailVerification
                email={contact}
                onVerificationSuccess={handleVerificationSuccess}
                onResendCode={handleResendCode}
                onBack={onBack}
                isLoading={isLoading}
            />
        );
    }

    return null;
};

export default VerificationWrapper;