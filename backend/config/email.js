require('dotenv').config();

const emailConfig = {
    // Configurație SMTP pentru noreply@misedainspectsrl.ro
    smtp: {
        host: 'mail.misedainspectsrl.ro',
        port: 465,
        secure: true, // SSL
        auth: {
            user: 'noreply@misedainspectsrl.ro',
            pass: process.env.EMAIL_PASSWORD || 'your-email-password-here' // Setează în .env
        },
        tls: {
            rejectUnauthorized: false // Pentru self-signed certificates
        }
    },

    // Configurație SMS API (smsadvert.ro)
    sms: {
        apiUrl: 'https://www.smsadvert.ro/api/sms', // Încercăm cu /api/sms
        token: process.env.SMS_API_TOKEN,
        sender: 'ReactApp' // Numele afișat pentru SMS
    },

    // Setări email
    from: {
        name: 'React Notificări - Verificare',
        address: 'noreply@misedainspectsrl.ro'
    },

    // Template-uri email
    templates: {
        verification: {
            subject: 'Cod de verificare - React Notificări',
            html: (name, code) => `
                <!DOCTYPE html>
                <html>
                <head>
                    <meta charset="utf-8">
                    <style>
                        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                                 color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
                        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
                        .code { background: #667eea; color: white; font-size: 32px; font-weight: bold; 
                               padding: 20px; text-align: center; border-radius: 10px; margin: 20px 0; 
                               letter-spacing: 8px; }
                        .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
                        .warning { background: #fff3cd; border: 1px solid #ffeeba; color: #856404; 
                                  padding: 15px; border-radius: 5px; margin: 20px 0; }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <div class="header">
                            <h1>🔐 Verificare Cont</h1>
                            <p>React Notificări</p>
                        </div>
                        <div class="content">
                            <h2>Bună ziua, ${name}!</h2>
                            <p>Pentru a vă activa contul, utilizați codul de verificare de mai jos:</p>
                            
                            <div class="code">${code}</div>
                            
                            <p><strong>Instrucțiuni:</strong></p>
                            <ul>
                                <li>Introduceți codul în aplicația React Notificări</li>
                                <li>Codul este valabil pentru 15 minute</li>
                                <li>Nu distribuiți acest cod nimănui</li>
                            </ul>
                            
                            <div class="warning">
                                <strong>⚠️ Important:</strong> Dacă nu ați solicitat această verificare, ignorați acest email.
                            </div>
                        </div>
                        <div class="footer">
                            <p>© 2025 React Notificări - Sistem de verificare automatizat</p>
                            <p>Acest email a fost trimis automat, vă rugăm să nu răspundeți.</p>
                        </div>
                    </div>
                </body>
                </html>
            `,
            text: (name, code) => `
Bună ziua, ${name}!

Pentru a vă activa contul React Notificări, utilizați codul de verificare:

${code}

Instrucțiuni:
- Introduceți codul în aplicația React Notificări
- Codul este valabil pentru 15 minute
- Nu distribuiți acest cod nimănui

Dacă nu ați solicitat această verificare, ignorați acest email.

© 2025 React Notificări
            `
        },

        sms: {
            text: (name, code) => `Buna ziua, ${name}! Codul dvs. de verificare pentru React Notificari este: ${code}. Codul expira in 15 minute. Nu distribuiti acest cod.`
        }
    }
};

module.exports = emailConfig;