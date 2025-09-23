const bcrypt = require('bcryptjs');
const path = require('path');

// Import database utility (it's exported as instance, not class)
const db = require('./utils/database.js');

async function testAdmin() {
    console.log('🔍 Testing admin account...');

    // Get user from database
    const user = db.getUserByEmail('aduadu321@gmail.com');
    console.log('👤 User found:', user ? 'YES' : 'NO');

    if (user) {
        console.log('📧 Email:', user.email);
        console.log('👤 Name:', user.firstName, user.lastName);
        console.log('📱 Phone:', user.phone);
        console.log('🔑 Role:', user.role);
        console.log('✅ Active:', user.isActive);
        console.log('✅ Verified:', user.isVerified);
        console.log('🔒 Password hash:', user.password.substring(0, 20) + '...');

        // Test password
        const testPassword = 'Kreator1234!';
        console.log('\n🔐 Testing password:', testPassword);

        try {
            const isValid = await bcrypt.compare(testPassword, user.password);
            console.log('✅ Password valid:', isValid);
        } catch (error) {
            console.log('❌ Password test error:', error.message);
        }
    } else {
        console.log('❌ User not found in database!');

        // Show all users
        const data = db.readAccounts();
        console.log('\n📋 All users in database:');
        console.log('Users:', data.users.length);
        console.log('Pending:', data.pendingUsers.length);

        data.users.forEach(u => {
            console.log(`  - ${u.email} (${u.role})`);
        });
    }
}

testAdmin().catch(console.error);