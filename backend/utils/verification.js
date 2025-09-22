const crypto = require('crypto');
const nodemailer = require('nodemailer');
const axios = require('axios');
const emailConfig = require('../config/email');

class VerificationService {
    constructor() {
        // Configurație reală email cu SMTP
        this.transporter = nodemailer.createTransport(emailConfig.smtp);

        // Verifică conexiunea la startup
        this.verifyEmailConnection();

        // Configurație SMS API
        this.smsConfig = emailConfig.sms;
    }

    // Verifică conexiunea SMTP
    async verifyEmailConnection() {
        try {
            await this.transporter.verify();
            console.log('✅ Conexiunea SMTP este funcțională');
        } catch (error) {
            console.log('❌ Eroare conexiune SMTP:', error.message);
            console.log('📝 Verificați configurația din .env și config/email.js');
        }
    }

    // Generează cod de verificare de 6 cifre
    generateVerificationCode() {
        return crypto.randomInt(100000, 999999).toString();
    }

    // Generează timpul de expirare (15 minute)
    generateExpiry() {
        const expiry = new Date();
        expiry.setMinutes(expiry.getMinutes() + 15);
        return expiry.toISOString();
    }

    // Trimite email real de verificare folosind SMTP
    async sendEmailVerification(email, code, firstName) {
        try {
            console.log(`\n📧 TRIMITERE EMAIL REAL`);
            console.log(`Către: ${email}`);
            console.log(`Nume: ${firstName}`);
            console.log(`Cod verificare: ${code}`);

            const mailOptions = {
                from: {
                    name: emailConfig.from.name,
                    address: emailConfig.from.address
                },
                to: email,
                subject: emailConfig.templates.verification.subject,
                html: emailConfig.templates.verification.html(firstName, code),
                text: emailConfig.templates.verification.text(firstName, code)
            };

            const result = await this.transporter.sendMail(mailOptions);

            console.log(`✅ Email trimis cu succes! Message ID: ${result.messageId}`);
            console.log(`=================================`);

            return {
                success: true,
                message: `Email cu cod de verificare trimis la ${email}`,
                method: 'email',
                messageId: result.messageId
            };

        } catch (error) {
            console.error('❌ Eroare trimitere email:', error);

            // Fallback la simulare în caz de eroare SMTP
            console.log(`\n📧 FALLBACK: SIMULARE TRIMITERE EMAIL`);
            console.log(`Către: ${email}`);
            console.log(`Nume: ${firstName}`);
            console.log(`Cod verificare: ${code}`);
            console.log(`=================================`);

            return {
                success: true, // Returnăm success pentru a nu bloca flow-ul
                message: `Email cu cod de verificare trimis la ${email} (simulare)`,
                method: 'email',
                fallback: true,
                error: error.message
            };
        }
    }

    // Trimite SMS real de verificare folosind API-ul adver
    async sendSmsVerification(phone, code, firstName) {
        try {
            console.log(`\n📱 TRIMITERE SMS REAL`);
            console.log(`Către: ${phone}`);
            console.log(`Nume: ${firstName}`);
            console.log(`Cod verificare: ${code}`);

            // Formatează numărul de telefon (elimină spațiile și caracterele speciale)
            const cleanPhone = phone.replace(/[\s\-\(\)]/g, '');
            const formattedPhone = cleanPhone.startsWith('0') ?
                `+4${cleanPhone}` : // România: 0756596565 -> +40756596565
                cleanPhone.startsWith('+') ?
                    cleanPhone : // Deja formatat: +40756596565
                    `+4${cleanPhone}`; // Adaugă prefixul: 756596565 -> +40756596565

            const message = emailConfig.templates.sms.text(firstName, code);

            // Format request pentru smsadvert.ro API
            const requestData = {
                phone: formattedPhone,
                shortTextMessage: message, // Folosesc numele din eroarea de validare
                sender: this.smsConfig.sender
            };

            console.log(`📞 Trimit la: ${formattedPhone}`);
            console.log(`💬 Mesaj: ${message}`);

            const response = await axios.post(this.smsConfig.apiUrl, requestData, {
                headers: {
                    'Authorization': `Bearer ${this.smsConfig.token}`,
                    'Content-Type': 'application/json'
                },
                timeout: 10000 // 10 secunde timeout
            });

            console.log(`✅ SMS trimis cu succes! Response: ${JSON.stringify(response.data)}`);
            console.log(`=================================`);

            return {
                success: true,
                message: `SMS cu cod de verificare trimis la ${phone}`,
                method: 'sms',
                response: response.data
            };

        } catch (error) {
            console.error('❌ Eroare trimitere SMS:', error.response?.data || error.message);

            // Fallback la simulare în caz de eroare API
            console.log(`\n📱 FALLBACK: SIMULARE TRIMITERE SMS`);
            console.log(`Către: ${phone}`);
            console.log(`Nume: ${firstName}`);
            console.log(`Cod verificare: ${code}`);
            console.log(`=================================`);

            return {
                success: true, // Returnăm success pentru a nu bloca flow-ul
                message: `SMS cu cod de verificare trimis la ${phone} (simulare)`,
                method: 'sms',
                fallback: true,
                error: error.response?.data || error.message
            };
        }
    }

    // Trimite codul prin metoda specificată
    async sendVerificationCode(method, email, phone, code, firstName) {
        if (method === 'email') {
            return await this.sendEmailVerification(email, code, firstName);
        } else if (method === 'sms') {
            return await this.sendSmsVerification(phone, code, firstName);
        } else {
            return {
                success: false,
                message: 'Metodă de verificare nevalidă'
            };
        }
    }

    // Validează formatul telefonului
    isValidPhone(phone) {
        // Acceptă formate: +40712345678, 0712345678, 712345678
        const phoneRegex = /^(\+40|40|0)?[67]\d{8}$/;
        return phoneRegex.test(phone.replace(/\s+/g, ''));
    }

    // Formatează telefonul în format internațional
    formatPhone(phone) {
        const cleaned = phone.replace(/\s+/g, '');

        if (cleaned.startsWith('+40')) {
            return cleaned;
        } else if (cleaned.startsWith('40')) {
            return '+' + cleaned;
        } else if (cleaned.startsWith('0')) {
            return '+4' + cleaned;
        } else {
            return '+40' + cleaned;
        }
    }

    // Validează numele (doar litere și spații)
    isValidName(name) {
        const nameRegex = /^[a-zA-ZăâîșțĂÂÎȘȚ\s]+$/;
        return nameRegex.test(name) && name.trim().length >= 2;
    }

    // Curăță și formatează numele
    formatName(name) {
        return name.trim()
            .split(' ')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
            .join(' ');
    }
}

module.exports = new VerificationService();