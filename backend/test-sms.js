require('dotenv').config();
const verificationService = require('./utils/verification');

async function testSmsConfiguration() {
    console.log('📱 Testare configurație SMS API...\n');

    // Generează un cod de test
    const testCode = verificationService.generateVerificationCode();

    console.log('Parametri de test:');
    console.log(`- Telefon: 0756596565`);
    console.log(`- Nume: Test User`);
    console.log(`- Cod: ${testCode}\n`);

    try {
        const result = await verificationService.sendSmsVerification(
            '0756596565',
            testCode,
            'Test User'
        );

        console.log('\n✅ Rezultat testare:');
        console.log(JSON.stringify(result, null, 2));

        if (result.success && !result.fallback) {
            console.log('\n🎉 Configurația SMS funcționează perfect!');
            console.log('Verificați SMS-ul la 0756596565');
        } else if (result.fallback) {
            console.log('\n⚠️ S-a folosit fallback-ul (simulare)');
            console.log('Verificați configurația API SMS în .env');
        }

    } catch (error) {
        console.error('\n❌ Eroare în timpul testării:', error.message);
    }
}

// Rulează testul
testSmsConfiguration();