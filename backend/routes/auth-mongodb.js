const express = require('express');
const { body, validationResult } = require('express-validator');
const mongoDatabase = require('../utils/mongoDatabase');
const authUtils = require('../utils/auth');
const verificationService = require('../utils/verification');
const { User } = require('../models/User');

const router = express.Router();

/**
 * Middleware pentru validarea erorilor de input
 */
const handleValidationErrors = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            success: false,
            error: 'Date de intrare invalide',
            details: errors.array().map(err => err.msg)
        });
    }
    next();
};

/**
 * POST /api/auth/login - Autentificare utilizator
 */
router.post('/login', [
    body('email').isEmail().normalizeEmail().withMessage('Email invalid'),
    body('password').isLength({ min: 1 }).withMessage('Parola este obligatorie'),
    handleValidationErrors
], async (req, res) => {
    try {
        const { email, password } = req.body;

        console.log(`🔐 Tentativă login pentru: ${email}`);

        // Găsește utilizatorul în MongoDB
        const user = await mongoDatabase.findUserByEmail(email);

        if (!user) {
            console.log(`❌ Utilizator negăsit: ${email}`);
            return res.status(401).json({
                success: false,
                error: 'Email sau parolă incorectă'
            });
        }

        // Verifică dacă contul este activ și verificat
        if (!user.isActive) {
            return res.status(401).json({
                success: false,
                error: 'Contul este dezactivat'
            });
        }

        if (!user.isVerified) {
            return res.status(401).json({
                success: false,
                error: 'Contul nu este verificat'
            });
        }

        // Verifică parola folosind metoda din model
        const isValidPassword = await user.comparePassword(password);

        if (!isValidPassword) {
            console.log(`❌ Parolă incorectă pentru: ${email}`);
            return res.status(401).json({
                success: false,
                error: 'Email sau parolă incorectă'
            });
        }

        // Actualizează lastLogin
        await mongoDatabase.updateUser(email, {
            lastLogin: new Date(),
            loginAttempts: 0,
            lockUntil: null
        });

        console.log(`✅ Login reușit pentru: ${email} (${user.role})`);

        // Determină mesajul și redirectul bazat pe rol
        let successMessage, redirectTo, accessLevel, permissions;

        if (user.role === 'admin') {
            successMessage = 'Autentificare reușită! Acces complet CPanel administrativ';
            redirectTo = '/admin/cpanel';
            accessLevel = 'Acces complet CPanel administrativ';
            permissions = ['manage_users', 'view_all_schedules', 'system_settings', 'cpanel_access', 'security_logs'];
        } else {
            successMessage = 'Autentificare reușită! Bine ai venit!';
            redirectTo = '/client/dashboard';
            accessLevel = 'Acces client - meniu personal';
            permissions = ['view_own_schedule', 'create_appointment', 'update_profile'];
        }

        // Setează cookie de sesiune
        res.cookie('auth_session', user._id.toString(), {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 24 * 60 * 60 * 1000 // 24 ore
        });

        res.json({
            success: true,
            message: successMessage,
            user: {
                id: user._id,
                firstName: user.firstName,
                lastName: user.lastName,
                email: user.email,
                role: user.role
            },
            redirectTo,
            accessLevel,
            permissions
        });

    } catch (error) {
        console.error('❌ Eroare login:', error);
        res.status(500).json({
            success: false,
            error: 'Eroare internă de server'
        });
    }
});

/**
 * POST /api/auth/register - Înregistrare utilizator nou
 */
router.post('/register', [
    body('firstName').isLength({ min: 2, max: 50 }).trim().withMessage('Prenumele trebuie să aibă între 2 și 50 caractere'),
    body('lastName').isLength({ min: 2, max: 50 }).trim().withMessage('Numele trebuie să aibă între 2 și 50 caractere'),
    body('email').isEmail().normalizeEmail().withMessage('Email invalid'),
    body('password').isLength({ min: 8 }).matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/).withMessage('Parola trebuie să conțină minim 8 caractere, litere mari/mici, cifre și caractere speciale'),
    body('phone').matches(/^(\+4|0)[0-9]{9,10}$/).withMessage('Număr de telefon invalid (format acceptat: 07xxxxxxxx sau +407xxxxxxxx)'),
    handleValidationErrors
], async (req, res) => {
    try {
        const { firstName, lastName, email, password, phone } = req.body;

        // Verifică dacă utilizatorul există deja
        const existingUser = await mongoDatabase.findUserByEmail(email);
        if (existingUser) {
            return res.status(400).json({
                success: false,
                error: 'Un cont cu acest email există deja'
            });
        }

        // Creează utilizatorul nou
        const newUser = await mongoDatabase.addUser({
            firstName,
            lastName,
            email,
            password,
            phone,
            role: 'client',
            isActive: true,
            isVerified: true, // Pentru simplitate, îl fac verificat direct
            verificationCode: null,
            verificationExpiry: null,
            verificationMethod: 'email'
        });

        console.log(`✅ Utilizator nou înregistrat: ${email}`);

        res.status(201).json({
            success: true,
            message: 'Contul a fost creat cu succes!',
            user: {
                id: newUser.id,
                firstName: newUser.firstName,
                lastName: newUser.lastName,
                email: newUser.email,
                role: newUser.role
            }
        });

    } catch (error) {
        console.error('❌ Eroare înregistrare:', error);

        if (error.message.includes('Email-ul există')) {
            return res.status(400).json({
                success: false,
                error: 'Un cont cu acest email există deja'
            });
        }

        res.status(500).json({
            success: false,
            error: 'Eroare la crearea contului'
        });
    }
});

/**
 * POST /api/auth/logout - Delogare
 */
router.post('/logout', (req, res) => {
    try {
        res.clearCookie('auth_session');

        res.json({
            success: true,
            message: 'Delogare reușită'
        });
    } catch (error) {
        console.error('❌ Eroare logout:', error);
        res.status(500).json({
            success: false,
            error: 'Eroare la delogare'
        });
    }
});

/**
 * GET /api/auth/session - Verifică sesiunea curentă
 */
router.get('/session', async (req, res) => {
    try {
        const sessionId = req.cookies.auth_session;

        if (!sessionId) {
            return res.status(401).json({
                success: false,
                error: 'Nu există sesiune activă'
            });
        }

        const user = await mongoDatabase.findUserById(sessionId);

        if (!user || !user.isActive) {
            res.clearCookie('auth_session');
            return res.status(401).json({
                success: false,
                error: 'Sesiune invalidă'
            });
        }

        res.json({
            success: true,
            user: {
                id: user._id,
                firstName: user.firstName,
                lastName: user.lastName,
                email: user.email,
                role: user.role
            }
        });

    } catch (error) {
        console.error('❌ Eroare verificare sesiune:', error);
        res.status(500).json({
            success: false,
            error: 'Eroare de server'
        });
    }
});

/**
 * GET /api/health - Verificare stare server
 */
router.get('/health', (req, res) => {
    res.json({
        status: 'OK',
        message: 'Backend funcționează perfect!',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        memory: process.memoryUsage()
    });
});

module.exports = router;