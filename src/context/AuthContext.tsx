import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface User {
    id: number;
    email: string;
    name: string;
    firstName: string;
    lastName: string;
    role: string;
    phone: string;
    isVerified: boolean;
}

interface AuthContextType {
    user: User | null;
    token: string | null;
    isAuthenticated: boolean;
    login: (userData: User, authToken: string) => void;
    logout: () => void;
    isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
    children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [token, setToken] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    // Verificăm localStorage la încărcarea aplicației
    useEffect(() => {
        const checkAuthStatus = () => {
            try {
                const savedUser = localStorage.getItem('user');
                const savedToken = localStorage.getItem('token');
                if (savedUser && savedToken) {
                    const userData = JSON.parse(savedUser);
                    setUser(userData);
                    setToken(savedToken);
                }
            } catch (error) {
                console.error('Eroare la citirea datelor din localStorage:', error);
                localStorage.removeItem('user');
                localStorage.removeItem('token');
            } finally {
                setIsLoading(false);
            }
        };

        checkAuthStatus();
    }, []);

    const login = (userData: User, authToken: string) => {
        setUser(userData);
        setToken(authToken);
        try {
            localStorage.setItem('user', JSON.stringify(userData));
            localStorage.setItem('token', authToken);
        } catch (error) {
            console.error('Eroare la salvarea în localStorage:', error);
        }
    };

    const logout = () => {
        setUser(null);
        setToken(null);
        try {
            localStorage.removeItem('user');
            localStorage.removeItem('token');
        } catch (error) {
            console.error('Eroare la ștergerea din localStorage:', error);
        }
    };

    const value: AuthContextType = {
        user,
        token,
        isAuthenticated: !!user && !!token,
        login,
        logout,
        isLoading
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};

// Hook personalizat pentru utilizarea contextului
export const useAuth = (): AuthContextType => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth trebuie folosit în interiorul unui AuthProvider');
    }
    return context;
};

export default AuthContext;