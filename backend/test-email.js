require('dotenv').config();
const verificationService = require('./utils/verification');

async function testEmailConfiguration() {
    console.log('🧪 Testare configurație email SMTP...\n');

    // Generează un cod de test
    const testCode = verificationService.generateVerificationCode();

    console.log('Parametri de test:');
    console.log(`- Email: aduadu321@gmail.com`);
    console.log(`- Nume: Test User`);
    console.log(`- Cod: ${testCode}\n`);

    try {
        const result = await verificationService.sendEmailVerification(
            'aduadu321@gmail.com',
            testCode,
            'Test User'
        );

        console.log('\n✅ Rezultat testare:');
        console.log(JSON.stringify(result, null, 2));

        if (result.success && !result.fallback) {
            console.log('\n🎉 Configurația email funcționează perfect!');
            console.log('Verificați inbox-ul la aduadu321@gmail.com');
        } else if (result.fallback) {
            console.log('\n⚠️ S-a folosit fallback-ul (simulare)');
            console.log('Verificați configurația SMTP în .env');
        }

    } catch (error) {
        console.error('\n❌ Eroare în timpul testării:', error.message);
    }
}

// Rulează testul
testEmailConfiguration();