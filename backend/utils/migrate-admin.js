const { User } = require('../models/User');

/**
 * Script pentru migrarea contului admin din accounts.json în MongoDB
 */
async function migrateAdminAccount() {
    try {
        console.log('🔄 Încep migrarea contului admin în MongoDB...');

        // Date admin din accounts.json
        const adminData = {
            firstName: "Adrian",
            lastName: "Avram",
            email: "aduadu321@gmail.com",
            password: "Kreator1234!", // Se va hash-a automat prin pre-save hook
            phone: "+40756596565",
            role: "admin",
            isActive: true,
            isVerified: true,
            verificationCode: null,
            verificationExpiry: null,
            verificationMethod: "email"
        };

        // Verifică dacă adminul există deja
        const existingAdmin = await User.findOne({ email: adminData.email });

        if (existingAdmin) {
            console.log('✅ Contul admin există deja în MongoDB');
            console.log(`👤 Admin: ${existingAdmin.firstName} ${existingAdmin.lastName} (${existingAdmin.email})`);
            return existingAdmin;
        }

        // Creează contul admin
        const admin = new User(adminData);
        const savedAdmin = await admin.save();

        console.log('✅ Contul admin a fost migrat în MongoDB cu succes!');
        console.log(`👤 Admin creat: ${savedAdmin.firstName} ${savedAdmin.lastName} (${savedAdmin.email})`);
        console.log(`🔑 Role: ${savedAdmin.role}`);
        console.log(`🆔 MongoDB ID: ${savedAdmin._id}`);

        return savedAdmin;

    } catch (error) {
        console.error('❌ Eroare la migrarea contului admin:', error.message);
        throw error;
    }
}

module.exports = { migrateAdminAccount };