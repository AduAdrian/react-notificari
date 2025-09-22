import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface User {
    email: string;
    name: string;
}

interface AuthContextType {
    user: User | null;
    isAuthenticated: boolean;
    login: (userData: User) => void;
    logout: () => void;
    isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
    children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    // Verificăm localStorage la încărcarea aplicației
    useEffect(() => {
        const checkAuthStatus = () => {
            try {
                const savedUser = localStorage.getItem('user');
                if (savedUser) {
                    const userData = JSON.parse(savedUser);
                    setUser(userData);
                }
            } catch (error) {
                console.error('Eroare la citirea datelor din localStorage:', error);
                localStorage.removeItem('user'); // Ștergem datele corupte
            } finally {
                setIsLoading(false);
            }
        };

        checkAuthStatus();
    }, []);

    const login = (userData: User) => {
        setUser(userData);
        try {
            localStorage.setItem('user', JSON.stringify(userData));
        } catch (error) {
            console.error('Eroare la salvarea în localStorage:', error);
        }
    };

    const logout = () => {
        setUser(null);
        try {
            localStorage.removeItem('user');
        } catch (error) {
            console.error('Eroare la ștergerea din localStorage:', error);
        }
    };

    const value: AuthContextType = {
        user,
        isAuthenticated: !!user,
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