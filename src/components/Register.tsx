import React, { useState } from 'react';
import './Register.css';

interface RegisterFormData {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    password: string;
    confirmPassword: string;
    verificationMethod: 'email' | 'sms';
}

interface RegisterProps {
    onRegisterSuccess: (userData: { email: string; name: string }, token: string) => void;
    onBackToLogin: () => void;
    onNeedVerification: (email: string, method: 'email' | 'sms') => void;
}

const Register: React.FC<RegisterProps> = ({ onRegisterSuccess, onBackToLogin, onNeedVerification }) => {
    const [formData, setFormData] = useState<RegisterFormData>({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        password: '',
        confirmPassword: '',
        verificationMethod: 'email'
    });
    const [errors, setErrors] = useState<Partial<RegisterFormData>>({});
    const [isLoading, setIsLoading] = useState(false);

    const validateForm = (): boolean => {
        const newErrors: Partial<RegisterFormData> = {};

        // Validare prenume
        if (!formData.firstName.trim()) {
            newErrors.firstName = 'Prenumele este obligatoriu';
        } else if (formData.firstName.trim().length < 2) {
            newErrors.firstName = 'Prenumele trebuie să aibă cel puțin 2 caractere';
        } else if (!/^[a-zA-ZăâîșțĂÂÎȘȚ\s]+$/.test(formData.firstName)) {
            newErrors.firstName = 'Prenumele poate conține doar litere';
        }

        // Validare nume
        if (!formData.lastName.trim()) {
            newErrors.lastName = 'Numele este obligatoriu';
        } else if (formData.lastName.trim().length < 2) {
            newErrors.lastName = 'Numele trebuie să aibă cel puțin 2 caractere';
        } else if (!/^[a-zA-ZăâîșțĂÂÎȘȚ\s]+$/.test(formData.lastName)) {
            newErrors.lastName = 'Numele poate conține doar litere';
        }

        // Validare email
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!formData.email) {
            newErrors.email = 'Email-ul este obligatoriu';
        } else if (!emailRegex.test(formData.email)) {
            newErrors.email = 'Email-ul nu este valid';
        }

        // Validare telefon
        const phoneRegex = /^(\+40|40|0)?[67]\d{8}$/;
        if (!formData.phone) {
            newErrors.phone = 'Numărul de telefon este obligatoriu';
        } else if (!phoneRegex.test(formData.phone.replace(/\s+/g, ''))) {
            newErrors.phone = 'Numărul de telefon nu este valid (ex: 0712345678)';
        }

        // Validare parolă
        if (!formData.password) {
            newErrors.password = 'Parola este obligatorie';
        } else if (formData.password.length < 8) {
            newErrors.password = 'Parola trebuie să aibă cel puțin 8 caractere';
        } else if (!/[a-zA-Z]/.test(formData.password)) {
            newErrors.password = 'Parola trebuie să conțină cel puțin o literă';
        } else if (!/[0-9]/.test(formData.password)) {
            newErrors.password = 'Parola trebuie să conțină cel puțin un număr';
        }

        // Validare confirmare parolă
        if (!formData.confirmPassword) {
            newErrors.confirmPassword = 'Confirmarea parolei este obligatorie';
        } else if (formData.password !== formData.confirmPassword) {
            newErrors.confirmPassword = 'Parolele nu se potrivesc';
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
            const response = await fetch('http://localhost:3001/api/auth/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    firstName: formData.firstName.trim(),
                    lastName: formData.lastName.trim(),
                    email: formData.email,
                    phone: formData.phone,
                    password: formData.password,
                    confirmPassword: formData.confirmPassword,
                    verificationMethod: formData.verificationMethod
                })
            });

            const data = await response.json();

            if (data.success) {
                // Redirecționează către componenta de verificare
                onNeedVerification(data.email, data.verificationMethod);
            } else {
                // Afișăm erorile de la backend
                if (data.errors && Array.isArray(data.errors)) {
                    const backendErrors: Partial<RegisterFormData> = {};
                    data.errors.forEach((error: any) => {
                        if (error.path) {
                            backendErrors[error.path as keyof RegisterFormData] = error.msg;
                        }
                    });
                    setErrors(backendErrors);
                } else {
                    setErrors({ email: data.message || 'Eroare la înregistrare. Încercați din nou.' });
                }
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

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));

        // Ștergem eroarea pentru câmpul curent
        if (errors[name as keyof RegisterFormData]) {
            setErrors(prev => ({
                ...prev,
                [name]: undefined
            }));
        }
    };

    return (
        <div className="register-container">
            <div className="register-card">
                <div className="register-header">
                    <h2>Creează cont nou</h2>
                    <p>Completează datele pentru a te înregistra</p>
                </div>

                <form onSubmit={handleSubmit} className="register-form">
                    <div className="form-row">
                        <div className="form-group">
                            <label htmlFor="firstName">Prenume *</label>
                            <input
                                type="text"
                                id="firstName"
                                name="firstName"
                                value={formData.firstName}
                                onChange={handleInputChange}
                                className={errors.firstName ? 'error' : ''}
                                placeholder="Prenumele tău"
                                disabled={isLoading}
                            />
                            {errors.firstName && <span className="error-message">{errors.firstName}</span>}
                        </div>

                        <div className="form-group">
                            <label htmlFor="lastName">Nume *</label>
                            <input
                                type="text"
                                id="lastName"
                                name="lastName"
                                value={formData.lastName}
                                onChange={handleInputChange}
                                className={errors.lastName ? 'error' : ''}
                                placeholder="Numele tău de familie"
                                disabled={isLoading}
                            />
                            {errors.lastName && <span className="error-message">{errors.lastName}</span>}
                        </div>
                    </div>

                    <div className="form-group">
                        <label htmlFor="email">Email *</label>
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

                    <div className="form-row">
                        <div className="form-group">
                            <label htmlFor="phone">Telefon *</label>
                            <input
                                type="tel"
                                id="phone"
                                name="phone"
                                value={formData.phone}
                                onChange={handleInputChange}
                                className={errors.phone ? 'error' : ''}
                                placeholder="0712345678"
                                disabled={isLoading}
                            />
                            {errors.phone && <span className="error-message">{errors.phone}</span>}
                        </div>

                    </div>

                    <div className="form-group">
                        <label htmlFor="password">Parolă *</label>
                        <input
                            type="password"
                            id="password"
                            name="password"
                            value={formData.password}
                            onChange={handleInputChange}
                            className={errors.password ? 'error' : ''}
                            placeholder="Minim 6 caractere, o literă și un număr"
                            disabled={isLoading}
                        />
                        {errors.password && <span className="error-message">{errors.password}</span>}
                    </div>

                    <div className="form-group">
                        <label htmlFor="confirmPassword">Confirmă parola *</label>
                        <input
                            type="password"
                            id="confirmPassword"
                            name="confirmPassword"
                            value={formData.confirmPassword}
                            onChange={handleInputChange}
                            className={errors.confirmPassword ? 'error' : ''}
                            placeholder="Introdu din nou parola"
                            disabled={isLoading}
                        />
                        {errors.confirmPassword && <span className="error-message">{errors.confirmPassword}</span>}
                    </div>

                    <div className="form-group">
                        <label htmlFor="verificationMethod">Metoda de verificare *</label>
                        <select
                            id="verificationMethod"
                            name="verificationMethod"
                            value={formData.verificationMethod}
                            onChange={handleInputChange}
                            className="verification-select"
                            disabled={isLoading}
                        >
                            <option value="email">📧 Verificare prin Email</option>
                            <option value="sms">📱 Verificare prin SMS</option>
                        </select>
                    </div>

                    <button
                        type="submit"
                        className={`register-button ${isLoading ? 'loading' : ''}`}
                        disabled={isLoading}
                    >
                        {isLoading ? 'Se înregistrează...' : 'Înregistrare'}
                    </button>
                </form>

                <div className="register-footer">
                    <p>Ai deja cont?
                        <button
                            type="button"
                            className="link-button"
                            onClick={onBackToLogin}
                            disabled={isLoading}
                        >
                            Conectează-te aici
                        </button>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Register;
