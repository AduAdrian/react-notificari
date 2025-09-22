import React, { useState } from 'react';
import { VerificationWrapper } from './verification';

// Exemplu de component care demonstrează utilizarea componentelor de verificare
const VerificationExample: React.FC = () => {
    const [showVerification, setShowVerification] = useState(false);
    const [verificationMethod, setVerificationMethod] = useState<'sms' | 'email'>('sms');
    const [contact, setContact] = useState('');

    const handleStartSmsVerification = () => {
        setContact('+40756596565'); // Numărul de telefon al utilizatorului
        setVerificationMethod('sms');
        setShowVerification(true);
    };

    const handleStartEmailVerification = () => {
        setContact('aduadu321@gmail.com'); // Email-ul utilizatorului
        setVerificationMethod('email');
        setShowVerification(true);
    };

    const handleVerificationSuccess = () => {
        console.log('Verificare reușită!');
        setShowVerification(false);
        // Aici poți redirecționa utilizatorul sau actualiza starea aplicației
        // Exemplu: navigate('/dashboard');
    };

    const handleBack = () => {
        setShowVerification(false);
    };

    if (showVerification) {
        return (
            <VerificationWrapper
                method={verificationMethod}
                contact={contact}
                onSuccess={handleVerificationSuccess}
                onBack={handleBack}
            />
        );
    }

    return (
        <div style={{ padding: '20px', textAlign: 'center' }}>
            <h2>Demo Componente Verificare</h2>
            <p>Alege metoda de verificare pentru a vedea componentele în acțiune:</p>

            <div style={{ marginTop: '20px', gap: '10px', display: 'flex', justifyContent: 'center' }}>
                <button
                    onClick={handleStartSmsVerification}
                    style={{
                        padding: '12px 24px',
                        background: '#667eea',
                        color: 'white',
                        border: 'none',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        fontSize: '16px',
                        marginRight: '10px'
                    }}
                >
                    📱 Verificare SMS
                </button>

                <button
                    onClick={handleStartEmailVerification}
                    style={{
                        padding: '12px 24px',
                        background: '#764ba2',
                        color: 'white',
                        border: 'none',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        fontSize: '16px'
                    }}
                >
                    📧 Verificare Email
                </button>
            </div>

            <div style={{ marginTop: '40px', background: '#f8f9fa', padding: '20px', borderRadius: '8px', textAlign: 'left' }}>
                <h3>Cum să folosești componentele:</h3>

                <h4>1. Import:</h4>
                <pre style={{ background: '#fff', padding: '10px', borderRadius: '4px', overflow: 'auto' }}>
                    {`import { 
    SmsVerification, 
    EmailVerification, 
    VerificationWrapper 
} from './components/verification';`}
                </pre>

                <h4>2. Utilizare SMS:</h4>
                <pre style={{ background: '#fff', padding: '10px', borderRadius: '4px', overflow: 'auto' }}>
                    {`<SmsVerification
    phoneNumber="+40756596565"
    onVerificationSuccess={(code) => {
        // Logica ta de verificare
        console.log('Cod SMS:', code);
    }}
    onResendCode={() => {
        // Logica de retrimitere cod
        console.log('Retrimite cod SMS');
    }}
    onBack={() => {
        // Înapoi la formularul anterior
    }}
/>`}
                </pre>

                <h4>3. Utilizare Email:</h4>
                <pre style={{ background: '#fff', padding: '10px', borderRadius: '4px', overflow: 'auto' }}>
                    {`<EmailVerification
    email="user@example.com"
    onVerificationSuccess={(code) => {
        // Logica ta de verificare
        console.log('Cod Email:', code);
    }}
    onResendCode={() => {
        // Logica de retrimitere cod
        console.log('Retrimite cod Email');
    }}
    onBack={() => {
        // Înapoi la formularul anterior
    }}
/>`}
                </pre>

                <h4>4. Wrapper unificat (recomandat):</h4>
                <pre style={{ background: '#fff', padding: '10px', borderRadius: '4px', overflow: 'auto' }}>
                    {`<VerificationWrapper
    method="sms" // sau "email"
    contact="+40756596565" // sau "user@example.com"
    onSuccess={() => {
        // Verificare reușită
    }}
    onBack={() => {
        // Înapoi
    }}
/>`}
                </pre>
            </div>
        </div>
    );
};

export default VerificationExample;