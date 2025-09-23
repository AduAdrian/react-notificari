const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

/**
 * Schema pentru utilizatori
 */
const userSchema = new mongoose.Schema({
    firstName: {
        type: String,
        required: true,
        trim: true,
        maxlength: 50
    },
    lastName: {
        type: String,
        required: true,
        trim: true,
        maxlength: 50
    },
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true,
        match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Email invalid']
    },
    password: {
        type: String,
        required: true,
        minlength: 8
    },
    phone: {
        type: String,
        required: true,
        trim: true,
        match: [/^(\+4|0)[0-9]{9,10}$/, 'Număr de telefon invalid']
    },
    role: {
        type: String,
        enum: ['admin', 'client'],
        default: 'client'
    },
    isActive: {
        type: Boolean,
        default: true
    },
    isVerified: {
        type: Boolean,
        default: false
    },
    verificationCode: {
        type: String,
        default: null
    },
    verificationExpiry: {
        type: Date,
        default: null
    },
    verificationMethod: {
        type: String,
        enum: ['email', 'sms'],
        default: 'email'
    },
    lastLogin: {
        type: Date,
        default: null
    },
    loginAttempts: {
        type: Number,
        default: 0
    },
    lockUntil: {
        type: Date,
        default: null
    }
}, {
    timestamps: true // Adaugă createdAt și updatedAt automat
});

/**
 * Index pentru căutări rapide
 */
userSchema.index({ phone: 1 });
userSchema.index({ role: 1 });

/**
 * Virtual pentru verificarea dacă contul este blocat
 */
userSchema.virtual('isLocked').get(function () {
    return !!(this.lockUntil && this.lockUntil > Date.now());
});

/**
 * Metodă pentru compararea parolei
 */
userSchema.methods.comparePassword = async function (candidatePassword) {
    try {
        return await bcrypt.compare(candidatePassword, this.password);
    } catch (error) {
        throw new Error('Eroare la compararea parolei');
    }
};

/**
 * Metodă pentru incrementarea încercărilor de login
 */
userSchema.methods.incrementLoginAttempts = async function () {
    // Dacă avem un lock expirat, resetează
    if (this.lockUntil && this.lockUntil < Date.now()) {
        return this.updateOne({
            $unset: {
                loginAttempts: 1,
                lockUntil: 1
            }
        });
    }

    const updates = { $inc: { loginAttempts: 1 } };

    // Dacă atingem maximul de încercări și nu suntem deja blocați, setează lockUntil
    if (this.loginAttempts + 1 >= 5 && !this.isLocked) {
        updates.$set = {
            lockUntil: Date.now() + 2 * 60 * 60 * 1000 // Blocat pentru 2 ore
        };
    }

    return this.updateOne(updates);
};

/**
 * Middleware pentru hash-uirea parolei înainte de salvare
 */
userSchema.pre('save', async function (next) {
    // Doar dacă parola a fost modificată
    if (!this.isModified('password')) return next();

    try {
        // Hash parola cu cost factor 12
        const salt = await bcrypt.genSalt(12);
        this.password = await bcrypt.hash(this.password, salt);
        next();
    } catch (error) {
        next(error);
    }
});

/**
 * Middleware pentru formatarea telefonului
 */
userSchema.pre('save', function (next) {
    // Formatează numărul de telefon
    if (this.phone && !this.phone.startsWith('+')) {
        if (this.phone.startsWith('07')) {
            this.phone = '+4' + this.phone;
        } else if (this.phone.startsWith('7') && this.phone.length === 9) {
            this.phone = '+40' + this.phone;
        }
    }
    next();
});

/**
 * Schema pentru utilizatori în așteptare (pending registration)
 */
const pendingUserSchema = new mongoose.Schema({
    firstName: String,
    lastName: String,
    email: String,
    password: String,
    phone: String,
    role: {
        type: String,
        enum: ['admin', 'client'],
        default: 'client'
    },
    verificationCode: String,
    verificationExpiry: Date,
    verificationMethod: {
        type: String,
        enum: ['email', 'sms'],
        default: 'email'
    }
}, {
    timestamps: true
});

// Index pentru expirarea automată după 24 ore
pendingUserSchema.index({ createdAt: 1 }, { expireAfterSeconds: 24 * 60 * 60 });

const User = mongoose.model('User', userSchema);
const PendingUser = mongoose.model('PendingUser', pendingUserSchema);

module.exports = {
    User,
    PendingUser
};