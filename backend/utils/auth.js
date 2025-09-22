const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Secret pentru JWT (în producție ar trebui să fie în variabile de mediu)
const JWT_SECRET = 'react_notificari_secret_key_2025';
const JWT_EXPIRES_IN = '24h';

class AuthUtils {
    // Hash parola
    async hashPassword(password) {
        try {
            const saltRounds = 12;
            return await bcrypt.hash(password, saltRounds);
        } catch (error) {
            throw new Error('Eroare la hash-uirea parolei');
        }
    }

    // Verifică parola
    async verifyPassword(password, hashedPassword) {
        try {
            return await bcrypt.compare(password, hashedPassword);
        } catch (error) {
            throw new Error('Eroare la verificarea parolei');
        }
    }

    // Generează JWT token
    generateToken(user) {
        try {
            const payload = {
                id: user.id,
                email: user.email,
                name: user.name,
                role: user.role
            };

            return jwt.sign(payload, JWT_SECRET, {
                expiresIn: JWT_EXPIRES_IN
            });
        } catch (error) {
            throw new Error('Eroare la generarea token-ului');
        }
    }

    // Verifică JWT token
    verifyToken(token) {
        try {
            return jwt.verify(token, JWT_SECRET);
        } catch (error) {
            if (error.name === 'TokenExpiredError') {
                throw new Error('Token-ul a expirat');
            } else if (error.name === 'JsonWebTokenError') {
                throw new Error('Token invalid');
            } else {
                throw new Error('Eroare la verificarea token-ului');
            }
        }
    }

    // Validare email
    isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    // Validare parolă
    isValidPassword(password) {
        // Minim 6 caractere, cel puțin o literă și un număr
        if (password.length < 6) {
            return { valid: false, message: 'Parola trebuie să aibă cel puțin 6 caractere' };
        }

        if (!/[a-zA-Z]/.test(password)) {
            return { valid: false, message: 'Parola trebuie să conțină cel puțin o literă' };
        }

        if (!/[0-9]/.test(password)) {
            return { valid: false, message: 'Parola trebuie să conțină cel puțin un număr' };
        }

        return { valid: true };
    }

    // Sanitizare nume
    sanitizeName(name) {
        return name.trim().replace(/[<>]/g, '');
    }

    // Middleware pentru verificarea token-ului
    authenticateToken(req, res, next) {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];

        if (!token) {
            return res.status(401).json({
                success: false,
                message: 'Token de acces necesar'
            });
        }

        try {
            const user = this.verifyToken(token);
            req.user = user;
            next();
        } catch (error) {
            return res.status(403).json({
                success: false,
                message: error.message
            });
        }
    }

    // Middleware pentru verificarea rolului de admin
    requireAdmin(req, res, next) {
        if (req.user && req.user.role === 'admin') {
            next();
        } else {
            return res.status(403).json({
                success: false,
                message: 'Acces interzis. Rolul de administrator este necesar.'
            });
        }
    }
}

module.exports = new AuthUtils();