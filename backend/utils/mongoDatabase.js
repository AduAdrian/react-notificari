const { User, PendingUser } = require('../models/User');

/**
 * Clase pentru operații cu MongoDB
 */
class MongoDatabase {
    constructor() {
        console.log('✅ MongoDatabase inițializat');
    }

    /**
     * Returnează toți utilizatorii
     * @returns {Array} Lista utilizatorilor
     */
    async getAllUsers() {
        try {
            return await User.find({}).select('-password');
        } catch (error) {
            console.error('Eroare la obținerea utilizatorilor:', error);
            return [];
        }
    }

    /**
     * Caută un utilizator după email
     * @param {string} email - Email-ul utilizatorului
     * @returns {Object|null} Utilizatorul găsit sau null
     */
    async findUserByEmail(email) {
        try {
            return await User.findOne({ email: email.toLowerCase() });
        } catch (error) {
            console.error('Eroare la căutarea utilizatorului:', error);
            return null;
        }
    }

    /**
     * Caută un utilizator după ID
     * @param {string} id - ID-ul utilizatorului
     * @returns {Object|null} Utilizatorul găsit sau null
     */
    async findUserById(id) {
        try {
            return await User.findById(id).select('-password');
        } catch (error) {
            console.error('Eroare la căutarea utilizatorului după ID:', error);
            return null;
        }
    }

    /**
     * Adaugă un utilizator nou
     * @param {Object} userData - Datele utilizatorului
     * @returns {Object} Utilizatorul adăugat
     */
    async addUser(userData) {
        try {
            const user = new User(userData);
            const savedUser = await user.save();

            // Returnează utilizatorul fără parolă
            const userObj = savedUser.toObject();
            delete userObj.password;

            return userObj;
        } catch (error) {
            console.error('Eroare la adăugarea utilizatorului:', error);

            if (error.code === 11000) {
                throw new Error('Email-ul există already în baza de date');
            }

            if (error.name === 'ValidationError') {
                const errorMessages = Object.values(error.errors).map(err => err.message);
                throw new Error(`Erori de validare: ${errorMessages.join(', ')}`);
            }

            throw new Error('Nu s-a putut adăuga utilizatorul');
        }
    }

    /**
     * Actualizează un utilizator
     * @param {string} email - Email-ul utilizatorului
     * @param {Object} updates - Actualizările de făcut
     * @returns {Object|null} Utilizatorul actualizat sau null
     */
    async updateUser(email, updates) {
        try {
            const updatedUser = await User.findOneAndUpdate(
                { email: email.toLowerCase() },
                { $set: updates },
                { new: true, runValidators: true }
            ).select('-password');

            return updatedUser;
        } catch (error) {
            console.error('Eroare la actualizarea utilizatorului:', error);
            return null;
        }
    }

    /**
     * Actualizează un utilizator după ID
     * @param {string} id - ID-ul utilizatorului
     * @param {Object} updates - Actualizările de făcut
     * @returns {Object|null} Utilizatorul actualizat sau null
     */
    async updateUserById(id, updates) {
        try {
            const updatedUser = await User.findByIdAndUpdate(
                id,
                { $set: updates },
                { new: true, runValidators: true }
            ).select('-password');

            return updatedUser;
        } catch (error) {
            console.error('Eroare la actualizarea utilizatorului:', error);
            return null;
        }
    }

    /**
     * Șterge un utilizator
     * @param {string} email - Email-ul utilizatorului
     * @returns {boolean} True dacă a fost șters, false altfel
     */
    async deleteUser(email) {
        try {
            const result = await User.deleteOne({ email: email.toLowerCase() });
            return result.deletedCount > 0;
        } catch (error) {
            console.error('Eroare la ștergerea utilizatorului:', error);
            return false;
        }
    }

    /**
     * Adaugă un utilizator în așteptare
     * @param {Object} pendingUserData - Datele utilizatorului în așteptare
     */
    async addPendingUser(pendingUserData) {
        try {
            const pendingUser = new PendingUser(pendingUserData);
            await pendingUser.save();
        } catch (error) {
            console.error('Eroare la adăugarea utilizatorului în așteptare:', error);
            throw new Error('Nu s-a putut adăuga utilizatorul în așteptare');
        }
    }

    /**
     * Caută un utilizator în așteptare după email
     * @param {string} email - Email-ul utilizatorului
     * @returns {Object|null} Utilizatorul în așteptare găsit sau null
     */
    async findPendingUserByEmail(email) {
        try {
            return await PendingUser.findOne({ email: email.toLowerCase() });
        } catch (error) {
            console.error('Eroare la căutarea utilizatorului în așteptare:', error);
            return null;
        }
    }

    /**
     * Șterge un utilizator din lista de așteptare
     * @param {string} email - Email-ul utilizatorului
     */
    async removePendingUser(email) {
        try {
            await PendingUser.deleteOne({ email: email.toLowerCase() });
        } catch (error) {
            console.error('Eroare la ștergerea utilizatorului din așteptare:', error);
        }
    }

    /**
     * Verifică dacă utilizatorul este blocat
     * @param {Object} user - Utilizatorul
     * @returns {boolean} True dacă este blocat
     */
    isUserLocked(user) {
        return user.lockUntil && user.lockUntil > Date.now();
    }

    /**
     * Resetează încercările de login pentru un utilizator
     * @param {string} email - Email-ul utilizatorului
     */
    async resetLoginAttempts(email) {
        try {
            await User.updateOne(
                { email: email.toLowerCase() },
                {
                    $unset: {
                        loginAttempts: 1,
                        lockUntil: 1
                    }
                }
            );
        } catch (error) {
            console.error('Eroare la resetarea încercărilor de login:', error);
        }
    }

    /**
     * Alias pentru findUserByEmail (pentru compatibilitate)
     */
    async getUserByEmail(email) {
        return await this.findUserByEmail(email);
    }

    /**
     * Pentru compatibilitate - nu mai e necesar cu MongoDB
     */
    writeAccounts(accounts) {
        console.log('writeAccounts: Operația nu mai e necesară cu MongoDB');
    }

    /**
     * Pentru compatibilitate - nu mai e necesar cu MongoDB
     */
    readData() {
        console.log('readData: Folosește metodele async pentru MongoDB');
        return { users: [], pendingUsers: [] };
    }

    /**
     * Pentru compatibilitate - nu mai e necesar cu MongoDB
     */
    writeData(data) {
        console.log('writeData: Operația nu mai e necesară cu MongoDB');
    }

    /**
     * Pentru compatibilitate - folosește metodele MongoDB
     */
    async readAccounts() {
        try {
            const users = await this.getAllUsers();
            const pendingUsers = await PendingUser.find({});
            return { users, pendingUsers };
        } catch (error) {
            console.error('Eroare la citirea conturilor din MongoDB:', error);
            return { users: [], pendingUsers: [] };
        }
    }
}

module.exports = new MongoDatabase();