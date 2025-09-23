const express = require('express');
const router = express.Router();
const VehicleRegistration = require('../models/VehicleRegistration');
const { requireAuth, requireOwnership } = require('../middleware/AuthMiddleware');

/**
 * @route GET /api/vehicles
 * @desc Obține toate înregistrările de vehicule ale utilizatorului autentificat
 * @access Private
 */
router.get('/', requireAuth, async (req, res) => {
    try {
        const vehicles = await VehicleRegistration.find({
            owner: req.user.id,
            isActive: true
        }).sort({ expirationDate: 1 });

        const displayVehicles = vehicles.map(vehicle => vehicle.toDisplay());

        res.json({
            success: true,
            count: vehicles.length,
            data: displayVehicles
        });
    } catch (error) {
        console.error('Eroare la obținerea vehiculelor:', error);
        res.status(500).json({
            success: false,
            error: 'Eroare de server la obținerea vehiculelor'
        });
    }
});

/**
 * @route GET /api/vehicles/:id
 * @desc Obține detaliile unui vehicul specific
 * @access Private
 */
router.get('/:id', requireAuth, async (req, res) => {
    try {
        const vehicle = await VehicleRegistration.findOne({
            _id: req.params.id,
            owner: req.user.id,
            isActive: true
        }).populate('owner', 'firstName lastName email');

        if (!vehicle) {
            return res.status(404).json({
                success: false,
                error: 'Vehiculul nu a fost găsit'
            });
        }

        res.json({
            success: true,
            data: vehicle
        });
    } catch (error) {
        console.error('Eroare la obținerea vehiculului:', error);
        res.status(500).json({
            success: false,
            error: 'Eroare de server la obținerea vehiculului'
        });
    }
});

/**
 * @route POST /api/vehicles
 * @desc Creează o nouă înregistrare de vehicul
 * @access Private
 */
router.post('/', requireAuth, async (req, res) => {
    try {
        const { registrationNumber, validity, expirationDate, notes, notificationSettings } = req.body;

        // Validare input
        if (!registrationNumber || !validity) {
            return res.status(400).json({
                success: false,
                error: 'Numărul de înmatriculare și valabilitatea sunt obligatorii'
            });
        }

        // Verifică dacă numărul de înmatriculare există deja
        const existingVehicle = await VehicleRegistration.findOne({
            registrationNumber: registrationNumber.toUpperCase(),
            isActive: true
        });

        if (existingVehicle) {
            return res.status(400).json({
                success: false,
                error: 'Numărul de înmatriculare există deja în sistem'
            });
        }

        // Creează noul vehicul
        const vehicleData = {
            registrationNumber: registrationNumber.toUpperCase(),
            validity,
            owner: req.user.id,
            notes: notes || '',
            notificationSettings: {
                emailNotification: notificationSettings?.emailNotification ?? true,
                smsNotification: notificationSettings?.smsNotification ?? true,
                notifyBefore: notificationSettings?.notifyBefore ?? 30
            }
        };

        // Dacă este manual, setează data de expirare din input
        if (validity === 'manual' && expirationDate) {
            vehicleData.expirationDate = new Date(expirationDate);
        }

        const vehicle = new VehicleRegistration(vehicleData);
        await vehicle.save();

        // Populează owner pentru răspuns
        await vehicle.populate('owner', 'firstName lastName email');

        res.status(201).json({
            success: true,
            message: 'Vehiculul a fost adăugat cu succes',
            data: vehicle.toDisplay()
        });
    } catch (error) {
        console.error('Eroare la crearea vehiculului:', error);

        if (error.name === 'ValidationError') {
            const errors = Object.values(error.errors).map(err => err.message);
            return res.status(400).json({
                success: false,
                error: 'Date invalid',
                details: errors
            });
        }

        res.status(500).json({
            success: false,
            error: 'Eroare de server la crearea vehiculului'
        });
    }
});

/**
 * @route PUT /api/vehicles/:id
 * @desc Actualizează o înregistrare de vehicul
 * @access Private
 */
router.put('/:id', requireAuth, async (req, res) => {
    try {
        const { validity, expirationDate, notes, notificationSettings } = req.body;

        const vehicle = await VehicleRegistration.findOne({
            _id: req.params.id,
            owner: req.user.id,
            isActive: true
        });

        if (!vehicle) {
            return res.status(404).json({
                success: false,
                error: 'Vehiculul nu a fost găsit'
            });
        }

        // Actualizează câmpurile
        if (validity) {
            vehicle.validity = validity;
        }

        if (validity === 'manual' && expirationDate) {
            vehicle.expirationDate = new Date(expirationDate);
        } else if (validity && validity !== 'manual') {
            // Recalculează data de expirare bazată pe noua valabilitate
            const issueDate = vehicle.issuedDate || new Date();
            let monthsToAdd = 0;

            switch (validity) {
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

            const newExpirationDate = new Date(issueDate);
            newExpirationDate.setMonth(newExpirationDate.getMonth() + monthsToAdd);
            vehicle.expirationDate = newExpirationDate;
        }

        if (notes !== undefined) {
            vehicle.notes = notes;
        }

        if (notificationSettings) {
            vehicle.notificationSettings = {
                ...vehicle.notificationSettings,
                ...notificationSettings
            };
        }

        await vehicle.save();
        await vehicle.populate('owner', 'firstName lastName email');

        res.json({
            success: true,
            message: 'Vehiculul a fost actualizat cu succes',
            data: vehicle.toDisplay()
        });
    } catch (error) {
        console.error('Eroare la actualizarea vehiculului:', error);

        if (error.name === 'ValidationError') {
            const errors = Object.values(error.errors).map(err => err.message);
            return res.status(400).json({
                success: false,
                error: 'Date invalid',
                details: errors
            });
        }

        res.status(500).json({
            success: false,
            error: 'Eroare de server la actualizarea vehiculului'
        });
    }
});

/**
 * @route DELETE /api/vehicles/:id
 * @desc Șterge o înregistrare de vehicul (soft delete)
 * @access Private
 */
router.delete('/:id', requireAuth, async (req, res) => {
    try {
        const vehicle = await VehicleRegistration.findOne({
            _id: req.params.id,
            owner: req.user.id,
            isActive: true
        });

        if (!vehicle) {
            return res.status(404).json({
                success: false,
                error: 'Vehiculul nu a fost găsit'
            });
        }

        // Soft delete - marchează ca inactiv
        vehicle.isActive = false;
        await vehicle.save();

        res.json({
            success: true,
            message: 'Vehiculul a fost șters cu succes'
        });
    } catch (error) {
        console.error('Eroare la ștergerea vehiculului:', error);
        res.status(500).json({
            success: false,
            error: 'Eroare de server la ștergerea vehiculului'
        });
    }
});

/**
 * @route GET /api/vehicles/expiring/:days
 * @desc Obține vehiculele care expiră în următoarele X zile
 * @access Private
 */
router.get('/expiring/:days', requireAuth, async (req, res) => {
    try {
        const days = parseInt(req.params.days) || 30;
        const futureDate = new Date();
        futureDate.setDate(futureDate.getDate() + days);

        const expiringVehicles = await VehicleRegistration.find({
            owner: req.user.id,
            isActive: true,
            expirationDate: {
                $gte: new Date(),
                $lte: futureDate
            }
        }).sort({ expirationDate: 1 });

        const displayVehicles = expiringVehicles.map(vehicle => vehicle.toDisplay());

        res.json({
            success: true,
            count: expiringVehicles.length,
            days: days,
            data: displayVehicles
        });
    } catch (error) {
        console.error('Eroare la obținerea vehiculelor care expiră:', error);
        res.status(500).json({
            success: false,
            error: 'Eroare de server'
        });
    }
});

/**
 * @route GET /api/vehicles/stats
 * @desc Obține statistici despre vehiculele utilizatorului
 * @access Private
 */
router.get('/stats/overview', requireAuth, async (req, res) => {
    try {
        const userId = req.user.id;

        // Contorizează vehiculele pe categorii
        const totalVehicles = await VehicleRegistration.countDocuments({
            owner: userId,
            isActive: true
        });

        const expiredVehicles = await VehicleRegistration.countDocuments({
            owner: userId,
            isActive: true,
            expirationDate: { $lt: new Date() }
        });

        const expiringNext30Days = await VehicleRegistration.countDocuments({
            owner: userId,
            isActive: true,
            expirationDate: {
                $gte: new Date(),
                $lte: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
            }
        });

        const validVehicles = totalVehicles - expiredVehicles;

        res.json({
            success: true,
            data: {
                total: totalVehicles,
                valid: validVehicles,
                expired: expiredVehicles,
                expiringNext30Days: expiringNext30Days
            }
        });
    } catch (error) {
        console.error('Eroare la obținerea statisticilor:', error);
        res.status(500).json({
            success: false,
            error: 'Eroare de server'
        });
    }
});

module.exports = router;