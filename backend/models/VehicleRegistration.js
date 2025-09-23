const mongoose = require('mongoose');

/**
 * Schema pentru înregistrările de vehicule
 * Stochează numărul de înmatriculare și valabilitatea
 */
const vehicleRegistrationSchema = new mongoose.Schema({
    registrationNumber: {
        type: String,
        required: [true, 'Numărul de înmatriculare este obligatoriu'],
        trim: true,
        uppercase: true,
        match: [/^[A-Z]{1,2}[0-9]{2,3}[A-Z]{3}$/, 'Format număr înmatriculare invalid (ex: B123ABC)'],
        maxlength: 8
    },
    validity: {
        type: String,
        required: [true, 'Valabilitatea este obligatorie'],
        enum: {
            values: ['6 luni', '1 an', '2 ani', 'manual'],
            message: 'Valabilitatea trebuie să fie: 6 luni, 1 an, 2 ani sau manual'
        }
    },
    expirationDate: {
        type: Date,
        required: [true, 'Data expirării este obligatorie'],
        validate: {
            validator: function (date) {
                return date > new Date();
            },
            message: 'Data expirării trebuie să fie în viitor'
        }
    },
    issuedDate: {
        type: Date,
        default: Date.now
    },
    owner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'Proprietarul este obligatoriu']
    },
    isActive: {
        type: Boolean,
        default: true
    },
    notes: {
        type: String,
        trim: true,
        maxlength: 500
    },
    notificationSettings: {
        emailNotification: {
            type: Boolean,
            default: true
        },
        smsNotification: {
            type: Boolean,
            default: true
        },
        notifyBefore: {
            type: Number, // zile înainte de expirare
            default: 30,
            min: 1,
            max: 90
        }
    }
}, {
    timestamps: true, // adaugă createdAt și updatedAt automat
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

/**
 * Virtual pentru calcularea zilelor rămase până la expirare
 */
vehicleRegistrationSchema.virtual('daysUntilExpiration').get(function () {
    const today = new Date();
    const expiration = new Date(this.expirationDate);
    const diffTime = expiration - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
});

/**
 * Virtual pentru status-ul înregistrării
 */
vehicleRegistrationSchema.virtual('status').get(function () {
    const daysLeft = this.daysUntilExpiration;

    if (daysLeft < 0) {
        return 'expirat';
    } else if (daysLeft <= 7) {
        return 'critic';
    } else if (daysLeft <= 30) {
        return 'atenție';
    } else {
        return 'valid';
    }
});

/**
 * Middleware pre-save pentru calcularea automată a datei de expirare
 */
vehicleRegistrationSchema.pre('save', function (next) {
    if (this.validity !== 'manual' && this.isNew) {
        const issueDate = this.issuedDate || new Date();
        let monthsToAdd = 0;

        switch (this.validity) {
            case '6 luni':
                monthsToAdd = 6;
                break;
            case '1 an':
                monthsToAdd = 12;
                break;
            case '2 ani':
                monthsToAdd = 24;
                break;
        }

        const expirationDate = new Date(issueDate);
        expirationDate.setMonth(expirationDate.getMonth() + monthsToAdd);
        this.expirationDate = expirationDate;
    }
    next();
});

/**
 * Index pentru căutări rapide
 */
vehicleRegistrationSchema.index({ registrationNumber: 1 }, { unique: true });
vehicleRegistrationSchema.index({ owner: 1 });
vehicleRegistrationSchema.index({ expirationDate: 1 });
vehicleRegistrationSchema.index({ isActive: 1 });

/**
 * Metodă statică pentru găsirea înregistrărilor care expiră curând
 */
vehicleRegistrationSchema.statics.findExpiringVehicles = function (days = 30) {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + days);

    return this.find({
        isActive: true,
        expirationDate: {
            $gte: new Date(),
            $lte: futureDate
        }
    }).populate('owner', 'firstName lastName email phone');
};

/**
 * Metodă de instanță pentru verificarea dacă vehiculul necesită notificare
 */
vehicleRegistrationSchema.methods.needsNotification = function () {
    const daysLeft = this.daysUntilExpiration;
    return daysLeft <= this.notificationSettings.notifyBefore && daysLeft > 0;
};

/**
 * Formatarea pentru afișare
 */
vehicleRegistrationSchema.methods.toDisplay = function () {
    return {
        id: this._id,
        registrationNumber: this.registrationNumber,
        validity: this.validity,
        expirationDate: this.expirationDate.toLocaleDateString('ro-RO'),
        daysUntilExpiration: this.daysUntilExpiration,
        status: this.status,
        owner: this.owner ? `${this.owner.firstName} ${this.owner.lastName}` : 'N/A',
        isActive: this.isActive
    };
};

const VehicleRegistration = mongoose.model('VehicleRegistration', vehicleRegistrationSchema);

module.exports = VehicleRegistration;