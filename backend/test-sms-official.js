require('dotenv').config();
const axios = require('axios');

async function testSmsOfficialAPI() {
    console.log('📱 Testare SMS API cu format oficial...\n');

    const testPhone = '+40756596565';
    const testMessage = 'Test mesaj prin API oficial smsadvert.ro. Cod verificare: 123456';
    const token = process.env.SMS_API_TOKEN;

    console.log(`Telefon: ${testPhone}`);
    console.log(`Mesaj: ${testMessage}`);
    console.log(`Token: ${token ? token.substring(0, 20) + '...' : 'NEDEFINIUT'}\n`);

    try {
        const response = await axios({
            method: 'post',
            url: 'https://www.smsadvert.ro/api/sms/',
            headers: {
                'Authorization': token,
                'Content-Type': 'application/json'
            },
            data: {
                phone: testPhone,
                shortTextMessage: testMessage,
                sendAsShort: true  // Pentru trimitere prin rețeaua smsadvert.ro
            },
            timeout: 15000
        });

        console.log('✅ SUCCESS - Răspuns API:');
        console.log(JSON.stringify(response.data, null, 2));

        return response.data;

    } catch (error) {
        console.log('❌ ERROR - Detalii eroare:');
        if (error.response) {
            console.log(`Status: ${error.response.status}`);
            console.log(`Data: ${JSON.stringify(error.response.data, null, 2)}`);
        } else {
            console.log(`Message: ${error.message}`);
        }

        throw error;
    }
}

// Rulează testul
testSmsOfficialAPI()
    .then(result => {
        console.log('\n🎉 Test finalizat cu succes!');
    })
    .catch(error => {
        console.log('\n💥 Test eșuat!');
    });