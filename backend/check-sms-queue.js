require('dotenv').config();
const axios = require('axios');

async function checkAndClearSMSQueue() {
    console.log('🔍 Verificare coada SMS...\n');

    const token = process.env.SMS_API_TOKEN;

    try {
        // Verifică coada SMS
        const queueResponse = await axios({
            method: 'get',
            url: 'https://www.smsadvert.ro/api/sms/queue',
            headers: {
                'Authorization': token,
                'Content-Type': 'application/json'
            },
            timeout: 10000
        });

        console.log('📊 Status coada SMS:');
        console.log(JSON.stringify(queueResponse.data, null, 2));

        // Dacă sunt mesaje în coadă, încearcă să le proceseze
        if (queueResponse.data && queueResponse.data.queueCount > 0) {
            console.log(`\n⚡ Procesez ${queueResponse.data.queueCount} mesaje din coadă...`);

            const processResponse = await axios({
                method: 'post',
                url: 'https://www.smsadvert.ro/api/sms/send-queue',
                headers: {
                    'Authorization': token,
                    'Content-Type': 'application/json'
                },
                timeout: 15000
            });

            console.log('✅ Procesare coadă completă:');
            console.log(JSON.stringify(processResponse.data, null, 2));
        } else {
            console.log('\n✅ Coada SMS este goală - nu sunt mesaje de procesat.');
        }

    } catch (error) {
        console.log('❌ ERROR:');
        if (error.response) {
            console.log(`Status: ${error.response.status}`);
            console.log(`Data: ${JSON.stringify(error.response.data, null, 2)}`);
        } else {
            console.log(`Message: ${error.message}`);
        }
    }
}

// Rulează verificarea
checkAndClearSMSQueue()
    .then(() => {
        console.log('\n🎉 Verificare completă!');
    })
    .catch(error => {
        console.log('\n💥 Eroare în verificare!');
    });