import React, { useState } from 'react';
import './Login.css';

interface LoginFormData {
    email: string;
    password: string;
}

interface LoginProps {
    onLogin: (userData: { email: string; name: string }) => void;
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

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validateForm()) {
            return;
        }

        setIsLoading(true);

        try {
            // Facem cererea reală către backend
            const response = await fetch('http://localhost:3002/api/auth/login', {
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

                onLogin(userData);
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