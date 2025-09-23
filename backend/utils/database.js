const fs = require('fs');
const path = require('path');

class Database {
    constructor() {
        this.accountsPath = path.join(__dirname, '../data/accounts.json');
        this.sessionsPath = path.join(__dirname, '../data/sessions.json');
    }

    // Citește fișierul de conturi
    readAccounts() {
        try {
            const data = fs.readFileSync(this.accountsPath, 'utf8');
            const parsed = JSON.parse(data);
            // Asigură-te că avem structura corectă
            if (!parsed.users) parsed.users = [];
            if (!parsed.pendingUsers) parsed.pendingUsers = [];
            return parsed;
        } catch (error) {
            console.error('Eroare la citirea conturilor:', error);
            return { users: [], pendingUsers: [] };
        }
    }

    // Citește fișierul de sesiuni
    readSessions() {
        try {
            const data = fs.readFileSync(this.sessionsPath, 'utf8');
            const parsed = JSON.parse(data);
            // Asigură-te că avem structura corectă
            if (!parsed.sessions) parsed.sessions = [];
            return parsed;
        } catch (error) {
            console.error('Eroare la citirea sesiunilor:', error);
            return { sessions: [] };
        }
    }

    // Scrie în fișierul de sesiuni
    writeSessions(data) {
        try {
            fs.writeFileSync(this.sessionsPath, JSON.stringify(data, null, 2));
            return true;
        } catch (error) {
            console.error('Eroare la scrierea sesiunilor:', error);
            return false;
        }
    }

    // Funcții generale pentru orice fișier JSON
    read(filename = 'accounts.json') {
        try {
            const filePath = path.join(__dirname, '../data', filename);
            const data = fs.readFileSync(filePath, 'utf8');
            return JSON.parse(data);
        } catch (error) {
            console.error(`Eroare la citirea fișierului ${filename}:`, error);
            return {};
        }
    }

    write(data, filename = 'accounts.json') {
        try {
            const filePath = path.join(__dirname, '../data', filename);

            // Creează directorul dacă nu există
            const dir = path.dirname(filePath);
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }

            // Face backup dacă fișierul există
            if (fs.existsSync(filePath)) {
                const backupPath = filePath + '.backup';
                fs.copyFileSync(filePath, backupPath);
            }

            fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
            return true;
        } catch (error) {
            console.error(`Eroare la scrierea fișierului ${filename}:`, error);
            return false;
        }
    }

    // Scrie în fișierul de conturi
    writeAccounts(data) {
        try {
            fs.writeFileSync(this.accountsPath, JSON.stringify(data, null, 2));
            return true;
        } catch (error) {
            console.error('Eroare la scrierea conturilor:', error);
            return false;
        }
    }

    // Găsește utilizator după email
    findUserByEmail(email) {
        const data = this.readAccounts();
        return data.users.find(user => user.email.toLowerCase() === email.toLowerCase());
    }

    // Alias pentru compatibilitate
    getUserByEmail(email) {
        return this.findUserByEmail(email);
    }

    // Găsește utilizator după ID
    findUserById(id) {
        const data = this.readAccounts();
        return data.users.find(user => user.id === parseInt(id));
    }

    // Creează un utilizator pending (neconfirmat)
    createPendingUser(userData) {
        const data = this.readAccounts();

        // Verifică dacă email-ul există deja în utilizatorii activi
        const existingUser = this.findUserByEmail(userData.email);
        if (existingUser && existingUser.isActive) {
            return { success: false, message: 'Un cont activ cu acest email există deja' };
        }

        // Verifică dacă email-ul există în pending
        const existingPending = data.pendingUsers.find(u => u.email.toLowerCase() === userData.email.toLowerCase());
        if (existingPending) {
            // Actualizează utilizatorul pending existent
            Object.assign(existingPending, userData);
        } else {
            // Generează ID nou pentru pending
            const newId = Date.now(); // Folosim timestamp pentru pending users
            const newPendingUser = { id: newId, ...userData };
            data.pendingUsers.push(newPendingUser);
        }

        if (this.writeAccounts(data)) {
            return { success: true, message: 'Utilizator pending creat cu succes' };
        }

        return { success: false, message: 'Eroare la salvarea utilizatorului pending' };
    }

    // Găsește utilizator pending după email
    findPendingUserByEmail(email) {
        const data = this.readAccounts();
        return data.pendingUsers.find(user => user.email.toLowerCase() === email.toLowerCase());
    }

    // Activează un utilizator pending după verificare
    activatePendingUser(email, verificationCode) {
        const data = this.readAccounts();

        const pendingIndex = data.pendingUsers.findIndex(
            user => user.email.toLowerCase() === email.toLowerCase()
        );

        if (pendingIndex === -1) {
            return { success: false, message: 'Utilizator pending negăsit' };
        }

        const pendingUser = data.pendingUsers[pendingIndex];

        // Verifică codul și expirarea
        if (pendingUser.verificationCode !== verificationCode) {
            return { success: false, message: 'Cod de verificare incorect' };
        }

        if (new Date() > new Date(pendingUser.verificationExpiry)) {
            return { success: false, message: 'Codul de verificare a expirat' };
        }

        // Generează ID nou pentru utilizatorul activ
        const newId = data.users.length > 0 ? Math.max(...data.users.map(u => u.id)) + 1 : 1;

        // Verifică dacă este primul utilizator - îi acordă automat rolul de admin
        const isFirstUser = data.users.length === 0;

        // Creează utilizatorul activ
        const newUser = {
            id: newId,
            firstName: pendingUser.firstName,
            lastName: pendingUser.lastName,
            email: pendingUser.email,
            password: pendingUser.password,
            phone: pendingUser.phone,
            cui: pendingUser.cui,
            role: isFirstUser ? 'admin' : (pendingUser.role || 'user'),
            createdAt: new Date().toISOString(),
            lastLogin: null,
            isActive: true,
            isVerified: true,
            verificationCode: null,
            verificationExpiry: null,
            verificationMethod: pendingUser.verificationMethod
        };

        // Adaugă la utilizatorii activi
        data.users.push(newUser);

        // Șterge din pending
        data.pendingUsers.splice(pendingIndex, 1);

        if (this.writeAccounts(data)) {
            const { password, ...userWithoutPassword } = newUser;
            return { success: true, user: userWithoutPassword };
        }

        return { success: false, message: 'Eroare la activarea utilizatorului' };
    }

    // Șterge utilizator pending expirat
    cleanExpiredPendingUsers() {
        const data = this.readAccounts();
        const now = new Date();

        data.pendingUsers = data.pendingUsers.filter(user =>
            new Date(user.verificationExpiry) > now
        );

        return this.writeAccounts(data);
    }

    // Actualizează timpul ultimei autentificări
    updateLastLogin(userId) {
        const data = this.readAccounts();
        const userIndex = data.users.findIndex(user => user.id === parseInt(userId));

        if (userIndex !== -1) {
            data.users[userIndex].lastLogin = new Date().toISOString();
            return this.writeAccounts(data);
        }

        return false;
    }

    // Actualizează parola utilizatorului
    updatePassword(userId, hashedPassword) {
        const data = this.readAccounts();
        const userIndex = data.users.findIndex(user => user.id === parseInt(userId));

        if (userIndex !== -1) {
            data.users[userIndex].password = hashedPassword;
            return this.writeAccounts(data);
        }

        return false;
    }

    // Dezactivează utilizatorul
    deactivateUser(userId) {
        const data = this.readAccounts();
        const userIndex = data.users.findIndex(user => user.id === parseInt(userId));

        if (userIndex !== -1) {
            data.users[userIndex].isActive = false;
            return this.writeAccounts(data);
        }

        return false;
    }

    // Obține toate conturile (fără parole)
    getAllUsers() {
        const data = this.readAccounts();
        return data.users.map(user => {
            const { password, ...userWithoutPassword } = user;
            return userWithoutPassword;
        });
    }

    // Statistici
    getStats() {
        const data = this.readAccounts();
        const totalUsers = data.users.length;
        const activeUsers = data.users.filter(user => user.isActive).length;
        const adminUsers = data.users.filter(user => user.role === 'admin').length;

        return {
            totalUsers,
            activeUsers,
            inactiveUsers: totalUsers - activeUsers,
            adminUsers,
            regularUsers: totalUsers - adminUsers
        };
    }

    // === FUNCȚII PENTRU SESIUNI ===

    // Creează o sesiune nouă
    createSession(userId, sessionData = {}) {
        const data = this.readSessions();
        const sessionId = require('crypto').randomUUID();

        const session = {
            id: sessionId,
            userId: parseInt(userId),
            refreshToken: sessionData.refreshToken || null,
            expiresAt: sessionData.expiresAt || new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 ore
            createdAt: new Date().toISOString(),
            lastActivity: new Date().toISOString(),
            ipAddress: sessionData.ipAddress || null,
            userAgent: sessionData.userAgent || null,
            isActive: true
        };

        data.sessions.push(session);

        if (this.writeSessions(data)) {
            return { success: true, sessionId, session };
        }

        return { success: false, message: 'Eroare la crearea sesiunii' };
    }

    // Găsește sesiune după ID
    findSessionById(sessionId) {
        const data = this.readSessions();
        return data.sessions.find(session =>
            session.id === sessionId && session.isActive
        );
    }

    // Găsește sesiuni active ale unui utilizator
    findActiveSessionsByUserId(userId) {
        const data = this.readSessions();
        return data.sessions.filter(session =>
            session.userId === parseInt(userId) &&
            session.isActive &&
            new Date(session.expiresAt) > new Date()
        );
    }

    // Actualizează activitatea sesiunii
    updateSessionActivity(sessionId) {
        const data = this.readSessions();
        const sessionIndex = data.sessions.findIndex(session => session.id === sessionId);

        if (sessionIndex !== -1) {
            data.sessions[sessionIndex].lastActivity = new Date().toISOString();
            return this.writeSessions(data);
        }

        return false;
    }

    // Dezactivează o sesiune
    deactivateSession(sessionId) {
        const data = this.readSessions();
        const sessionIndex = data.sessions.findIndex(session => session.id === sessionId);

        if (sessionIndex !== -1) {
            data.sessions[sessionIndex].isActive = false;
            return this.writeSessions(data);
        }

        return false;
    }

    // Dezactivează toate sesiunile unui utilizator
    deactivateAllUserSessions(userId) {
        const data = this.readSessions();
        let updated = false;

        data.sessions.forEach(session => {
            if (session.userId === parseInt(userId) && session.isActive) {
                session.isActive = false;
                updated = true;
            }
        });

        if (updated) {
            return this.writeSessions(data);
        }

        return false;
    }

    // Curăță sesiunile expirate
    cleanupExpiredSessions() {
        const data = this.readSessions();
        const now = new Date();
        const initialCount = data.sessions.length;

        data.sessions = data.sessions.filter(session => {
            const expiresAt = new Date(session.expiresAt);
            return session.isActive && expiresAt > now;
        });

        const cleanedCount = initialCount - data.sessions.length;

        if (cleanedCount > 0) {
            this.writeSessions(data);
            console.log(`Curățate ${cleanedCount} sesiuni expirate`);
        }

        return cleanedCount;
    }

    // Obține toate sesiunile active (pentru admin)
    getAllActiveSessions() {
        const data = this.readSessions();
        return data.sessions.filter(session =>
            session.isActive &&
            new Date(session.expiresAt) > new Date()
        );
    }
}

module.exports = new Database();

// Export functions for direct use
module.exports.read = (filename = null) => {
    const db = new Database();
    if (filename === 'accounts.json') return db.readAccounts();
    return db.read(filename);
};

module.exports.write = (filename, data) => {
    const db = new Database();
    if (filename === 'accounts.json') return db.writeAccounts(data);
    return db.write(data, filename);
};