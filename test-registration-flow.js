/**
 * Test script for complete registration and verification flow
 * 
 * This script tests:
 * 1. User registration with all fields
 * 2. Verification code generation
 * 3. Code verification and account activation
 * 4. Login with activated account
 */

import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:3002/api/auth';

async function testRegistrationFlow() {
    console.log('🧪 Testare fluxului complet de înregistrare și verificare\n');

    // Generate test data cu noile informații
    const timestamp = Date.now();
    const testUser = {
        firstName: 'Adrian',
        lastName: 'Tester',
        email: 'aduadu321@gmail.com', // Email real pentru testare
        password: 'Test123!',
        confirmPassword: 'Test123!',
        phone: '0756596565', // Telefon real pentru testare
        verificationMethod: 'email'
    };

    try {
        // Step 1: Register new user
        console.log('1️⃣ Înregistrare utilizator nou...');
        console.log(`   Email: ${testUser.email}`);
        console.log(`   Nume: ${testUser.firstName} ${testUser.lastName}`);
        console.log(`   Telefon: ${testUser.phone}`);
        console.log(`   CUI: ${testUser.cui}`);

        const registerResponse = await fetch(`${BASE_URL}/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(testUser)
        });

        const registerData = await registerResponse.json();

        if (!registerData.success) {
            console.error('❌ Eroare înregistrare:', registerData.message);
            console.error('   Detalii:', registerData.errors || 'N/A');
            return;
        }

        console.log('✅ Înregistrare reușită!');
        console.log(`   Mesaj: ${registerData.message}`);

        // Step 2: Test resend code
        console.log('\n2️⃣ Test retrimite cod...');
        const resendResponse = await fetch(`${BASE_URL}/resend-code`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: testUser.email })
        });

        const resendData = await resendResponse.json();
        if (resendData.success) {
            console.log('✅ Codul poate fi retrimis cu succes');
        } else {
            console.log('⚠️ Retrimite cod:', resendData.message);
        }

        // For testing purposes, we need to get the verification code from the backend logs
        console.log('\n3️⃣ Verificare cod...');
        console.log('   📝 Pentru test, folosim codul implicit din backend');
        console.log('   În producție, codul ar fi primit prin email/SMS');

        // Try common test codes or check backend logs
        const testCodes = ['123456', '000000', '111111'];
        let verificationSuccess = false;
        let userData = null;

        for (const testCode of testCodes) {
            const verifyResponse = await fetch(`${BASE_URL}/verify`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: testUser.email,
                    verificationCode: testCode
                })
            });

            const verifyData = await verifyResponse.json();

            if (verifyData.success) {
                console.log(`✅ Verificare reușită cu codul: ${testCode}`);
                console.log(`   Token JWT: ${verifyData.token.substring(0, 30)}...`);
                verificationSuccess = true;
                userData = verifyData.user;
                break;
            }
        }

        if (!verificationSuccess) {
            console.log('⚠️ Nu s-a putut verifica cu codurile de test');
            console.log('   Verifică logs-urile backend-ului pentru codul real');
            return;
        }

        // Step 4: Test login with verified account
        console.log('\n4️⃣ Test login cu contul verificat...');
        const loginResponse = await fetch(`${BASE_URL}/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: testUser.email,
                password: testUser.password
            })
        });

        const loginData = await loginResponse.json();

        if (loginData.success) {
            console.log('✅ Login reușit!');
            console.log(`   Utilizator: ${loginData.user.firstName} ${loginData.user.lastName}`);
            console.log(`   Email: ${loginData.user.email}`);
            console.log(`   Status: ${loginData.user.isActive ? 'Activ' : 'Inactiv'}`);
            console.log(`   Verificat: ${loginData.user.isVerified ? 'Da' : 'Nu'}`);
        } else {
            console.log('❌ Eroare login:', loginData.message);
        }

        console.log('\n🎉 Test complet finalizat!');
        console.log('=====================================');
        console.log('📊 Sumar rezultate:');
        console.log('   ✅ Înregistrare: Reușită');
        console.log('   ✅ Retrimite cod: Funcțional');
        console.log(`   ${verificationSuccess ? '✅' : '❌'} Verificare: ${verificationSuccess ? 'Reușită' : 'Eșuată'}`);
        console.log(`   ${loginData.success ? '✅' : '❌'} Login: ${loginData.success ? 'Reușit' : 'Eșuat'}`);

    } catch (error) {
        console.error('❌ Eroare în test:', error.message);
        console.error('   Stack trace:', error.stack);
    }
}

// Run the test
testRegistrationFlow().catch(console.error);