import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

interface OAuthCallbackProps {
    onLogin: (userData: { id: number; email: string; firstName: string; lastName: string; role: string }) => void;
}

const OAuthCallback: React.FC<OAuthCallbackProps> = ({ onLogin }) => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const [error, setError] = useState<string>('');
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const handleOAuthCallback = async () => {
            try {
                const code = searchParams.get('code');
                const state = searchParams.get('state');
                const error = searchParams.get('error');

                // Verificăm dacă utilizatorul a anulat autorizația
                if (error) {
                    setError('Autorizația a fost anulată.');
                    setTimeout(() => navigate('/'), 3000);
                    return;
                }

                // Verificăm dacă avem codul de autorizare
                if (!code) {
                    setError('Cod de autorizare lipsă.');
                    setTimeout(() => navigate('/'), 3000);
                    return;
                }

                // Verificăm state-ul pentru securitate
                const savedState = localStorage.getItem('oauth_state');
                if (!state || state !== savedState) {
                    setError('State invalid. Posibil atac CSRF.');
                    setTimeout(() => navigate('/'), 3000);
                    return;
                }

                // Curățăm state-ul din localStorage
                localStorage.removeItem('oauth_state');

                // Trimitem codul la backend pentru a obține token-ul
                const response = await fetch('http://localhost:3001/api/auth/github', {
                    method: 'POST',
                    credentials: 'include', // Include cookie-urile
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ code })
                });

                const data = await response.json();

                if (data.success) {
                    const userData = {
                        id: data.user.id,
                        email: data.user.email,
                        firstName: data.user.firstName,
                        lastName: data.user.lastName,
                        role: data.user.role
                    };

                    onLogin(userData);
                    navigate('/dashboard');
                } else {
                    setError(data.message || 'Eroare la autentificarea cu GitHub.');
                    setTimeout(() => navigate('/'), 3000);
                }

            } catch (error) {
                console.error('Eroare OAuth callback:', error);
                setError('Eroare de conexiune cu serverul.');
                setTimeout(() => navigate('/'), 3000);
            } finally {
                setIsLoading(false);
            }
        };

        handleOAuthCallback();
    }, [searchParams, navigate, onLogin]);

    return (
        <div style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            fontFamily: 'Segoe UI, Tahoma, Geneva, Verdana, sans-serif'
        }}>
            <div style={{
                background: 'white',
                borderRadius: '20px',
                boxShadow: '0 20px 40px rgba(0, 0, 0, 0.1)',
                padding: '40px',
                textAlign: 'center',
                maxWidth: '400px',
                width: '100%',
                margin: '20px'
            }}>
                {isLoading ? (
                    <>
                        <div style={{
                            width: '50px',
                            height: '50px',
                            border: '3px solid #e2e8f0',
                            borderTop: '3px solid #667eea',
                            borderRadius: '50%',
                            animation: 'spin 1s linear infinite',
                            margin: '0 auto 20px'
                        }}></div>
                        <h2 style={{ color: '#2d3748', marginBottom: '10px' }}>
                            Se procesează autentificarea...
                        </h2>
                        <p style={{ color: '#718096' }}>
                            Te rugăm să aștepți...
                        </p>
                    </>
                ) : error ? (
                    <>
                        <div style={{
                            width: '50px',
                            height: '50px',
                            background: '#e53e3e',
                            borderRadius: '50%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            margin: '0 auto 20px',
                            color: 'white',
                            fontSize: '24px'
                        }}>
                            ✕
                        </div>
                        <h2 style={{ color: '#e53e3e', marginBottom: '10px' }}>
                            Eroare de autentificare
                        </h2>
                        <p style={{ color: '#718096', marginBottom: '20px' }}>
                            {error}
                        </p>
                        <p style={{ color: '#718096', fontSize: '14px' }}>
                            Vei fi redirecționat în curând...
                        </p>
                    </>
                ) : (
                    <>
                        <div style={{
                            width: '50px',
                            height: '50px',
                            background: '#38a169',
                            borderRadius: '50%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            margin: '0 auto 20px',
                            color: 'white',
                            fontSize: '24px'
                        }}>
                            ✓
                        </div>
                        <h2 style={{ color: '#38a169', marginBottom: '10px' }}>
                            Autentificare reușită!
                        </h2>
                        <p style={{ color: '#718096' }}>
                            Vei fi redirecționat către dashboard...
                        </p>
                    </>
                )}

                <style>{`
                    @keyframes spin {
                        0% { transform: rotate(0deg); }
                        100% { transform: rotate(360deg); }
                    }
                `}</style>
            </div>
        </div>
    );
};

export default OAuthCallback;