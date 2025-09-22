import React, { useState } from 'react';
import './Login.css';

interface LoginFormData {
    email: string;
    password: string;
}

interface LoginProps {
    onLogin: (userData: { email: string; name: string }, token: string) => void;
    onShowRegister: () => void;
}

const Login: React.FC<LoginProps> = ({ onLogin, onShowRegister }) => {
    const [formData, setFormData] = useState<LoginFormData>({
        email: '',
        password: ''
    });
    const [errors, setErrors] = useState<Partial<LoginFormData>>({});
    const [isLoading, setIsLoading] = useState(false);

    const validateForm = (): boolean => {
        const newErrors: Partial<LoginFormData> = {};

        // Validare email
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!formData.email) {
            newErrors.email = 'Email-ul este obligatoriu';
        } else if (!emailRegex.test(formData.email)) {
            newErrors.email = 'Email-ul nu este valid';
        }

        // Validare parolă
        if (!formData.password) {
            newErrors.password = 'Parola este obligatorie';
        } else if (formData.password.length < 6) {
            newErrors.password = 'Parola trebuie să aibă cel puțin 6 caractere';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleGitHubLogin = () => {
        const clientId = process.env.REACT_APP_GITHUB_CLIENT_ID;
        const redirectUri = encodeURIComponent('http://localhost:3000/auth/github/callback');
        const state = encodeURIComponent(Math.random().toString(36).substring(2, 15));
        
        // Salvăm state-ul în localStorage pentru verificare ulterioară
        localStorage.setItem('oauth_state', state);
        
        const githubAuthUrl = `https://github.com/login/oauth/authorize?client_id=${clientId}&redirect_uri=${redirectUri}&scope=user:email&state=${state}`;
        
        window.location.href = githubAuthUrl;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validateForm()) {
            return;
        }

        setIsLoading(true);

        try {
            // Facem cererea reală către backend
            const response = await fetch('http://localhost:3001/api/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    email: formData.email,
                    password: formData.password
                })
            });

            const data = await response.json();

            if (data.success) {
                // Salvăm token-ul în localStorage
                localStorage.setItem('token', data.token);

                const userData = {
                    email: data.user.email,
                    name: data.user.name
                };

                onLogin(userData, data.token);
            } else {
                // Afișăm eroarea de la backend
                setErrors({
                    email: data.message || 'Eroare la autentificare. Încercați din nou.'
                });
            }
        } catch (error) {
            console.error('Eroare de conectare:', error);
            setErrors({
                email: 'Eroare de conexiune. Verificați dacă backend-ul rulează.'
            });
        } finally {
            setIsLoading(false);
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));

        // Ștergem eroarea pentru câmpul curent
        if (errors[name as keyof LoginFormData]) {
            setErrors(prev => ({
                ...prev,
                [name]: undefined
            }));
        }
    };

    return (
        <div className="login-container">
            <div className="login-card">
                <div className="login-header">
                    <h2>Bine ai venit!</h2>
                    <p>Conectează-te la contul tău</p>
                </div>

                <form onSubmit={handleSubmit} className="login-form">
                    <div className="form-group">
                        <label htmlFor="email">Email</label>
                        <input
                            type="email"
                            id="email"
                            name="email"
                            value={formData.email}
                            onChange={handleInputChange}
                            className={errors.email ? 'error' : ''}
                            placeholder="exemplu@email.com"
                            disabled={isLoading}
                        />
                        {errors.email && <span className="error-message">{errors.email}</span>}
                    </div>

                    <div className="form-group">
                        <label htmlFor="password">Parolă</label>
                        <input
                            type="password"
                            id="password"
                            name="password"
                            value={formData.password}
                            onChange={handleInputChange}
                            className={errors.password ? 'error' : ''}
                            placeholder="Introdu parola"
                            disabled={isLoading}
                        />
                        {errors.password && <span className="error-message">{errors.password}</span>}
                    </div>

                    <button
                        type="submit"
                        className={`login-button ${isLoading ? 'loading' : ''}`}
                        disabled={isLoading}
                    >
                        {isLoading ? 'Se conectează...' : 'Conectare'}
                    </button>
                </form>

                <div className="oauth-section">
                    <div className="divider">
                        <span>sau</span>
                    </div>
                    <button
                        type="button"
                        className="github-login-button"
                        onClick={handleGitHubLogin}
                        disabled={isLoading}
                    >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/>
                        </svg>
                        Continuă cu GitHub
                    </button>
                </div>

                <div className="login-footer">
                    <p>Nu ai cont?
                        <button
                            type="button"
                            className="link-button"
                            onClick={onShowRegister}
                            disabled={isLoading}
                        >
                            Înregistrează-te aici
                        </button>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Login;

