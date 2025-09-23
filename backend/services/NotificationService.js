const database = require('../utils/database');
const emailConfig = require('../config/email');

// Import nodemailer only if needed
let nodemailer;
try {
    nodemailer = require('nodemailer');
} catch (error) {
    console.log('ℹ️ Nodemailer nu este disponibil - notificările email vor fi simulate');
}

/**
 * Service pentru trimiterea notificărilor către clienți
 * Verifică clienții care expiră în curând și trimite notificări SMS/Email
 */
class NotificationService {
    constructor() {
        this.emailTransporter = this.createEmailTransporter();
    }

    /**
     * Creează transporter SMTP pentru email
     */
    createEmailTransporter() {
        try {
            if (!nodemailer) {
                console.log('📧 Email transporter simulat (nodemailer nu este disponibil)');
                return null;
            }
            return nodemailer.createTransporter(emailConfig.smtp);
        } catch (error) {
            console.error('❌ Eroare configurare SMTP:', error);
            return null;
        }
    }

    /**
     * Găsește clienții care expiră în numărul specificat de zile
     * @param {number} days - Numărul de zile până la expirare (default: 7)
     * @returns {Array} Lista clienților care expiră curând
     */
    findExpiringClients(days = 7) {
        try {
            const db = database.read('accounts.json');
            const clients = db.clients || [];
            
            if (clients.length === 0) {
                console.log('📭 Nu există clienți în baza de date');
                return [];
            }

            const currentDate = new Date();
            const warningDate = new Date();
            warningDate.setDate(currentDate.getDate() + days);

            const expiringClients = clients.filter(client => {
                if (!client.expirationDate) return false;
                
                const expirationDate = new Date(client.expirationDate);
                return expirationDate >= currentDate && expirationDate <= warningDate;
            });

            console.log(`🔍 Găsiți ${expiringClients.length} clienți care expiră în următoarele ${days} zile`);
            return expiringClients;
        } catch (error) {
            console.error('❌ Eroare căutare clienți care expiră:', error);
            return [];
        }
    }

    /**
     * Trimite notificare email către un client
     * @param {Object} client - Datele clientului
     * @returns {Promise<boolean>} Succes/eșec
     */
    async sendEmailNotification(client) {
        if (!this.emailTransporter) {
            // Simulare email dacă transporter nu este disponibil
            console.log(`📧 Email simulat către client-${client.nrInmatriculare}@example.com:`);
            const expirationDate = new Date(client.expirationDate);
            const daysLeft = Math.ceil((expirationDate - new Date()) / (1000 * 60 * 60 * 24));
            console.log(`   Subiect: ⚠️ Certificatul pentru ${client.nrInmatriculare} expiră în ${daysLeft} zile`);
            console.log(`   Mesaj: Certificatul va expira pe ${expirationDate.toLocaleDateString('ro-RO')}`);
            return true;
        }

        try {
            const expirationDate = new Date(client.expirationDate);
            const daysLeft = Math.ceil((expirationDate - new Date()) / (1000 * 60 * 60 * 24));
            
            const emailContent = {
                from: `"${emailConfig.from.name}" <${emailConfig.from.address}>`,
                to: client.email || `client-${client.nrInmatriculare}@example.com`, // Mock email if not provided
                subject: `⚠️ Atenție: Certificatul pentru ${client.nrInmatriculare} expiră în ${daysLeft} zile`,
                html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; text-align: center;">
                        <h1>⚠️ Notificare Expirare Certificat</h1>
                    </div>
                    
                    <div style="padding: 30px; background: #f9f9f9;">
                        <h2>Stimate client,</h2>
                        
                        <p>Vă notificăm că certificatul pentru vehiculul dvs. <strong>${client.nrInmatriculare}</strong> 
                           va expira în <strong style="color: #e53e3e;">${daysLeft} zile</strong>.</p>
                        
                        <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
                            <h3>Detalii Certificate:</h3>
                            <ul>
                                <li><strong>Număr înmatriculare:</strong> ${client.nrInmatriculare}</li>
                                <li><strong>Telefon contact:</strong> ${client.nrTelefon}</li>
                                <li><strong>Data expirării:</strong> ${expirationDate.toLocaleDateString('ro-RO')}</li>
                                <li><strong>Zile rămase:</strong> ${daysLeft}</li>
                            </ul>
                        </div>
                        
                        <p style="color: #666;">Pentru reînnoirea certificatului, vă rugăm să ne contactați 
                           la numărul <strong>${client.nrTelefon}</strong> sau prin email.</p>
                        
                        <div style="background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0;">
                            <strong>⚠️ Important:</strong> Nu ignorați această notificare! 
                            Circulația cu certificate expirate poate atrage sancțiuni.
                        </div>
                    </div>
                    
                    <div style="background: #333; color: white; padding: 15px; text-align: center; font-size: 12px;">
                        <p>© 2025 React Notificări - Sistem automatizat de notificări</p>
                        <p>Acest email a fost generat automat. Pentru întrebări, contactați-ne.</p>
                    </div>
                </div>
                `,
                text: `
Stimate client,

Certificatul pentru vehiculul ${client.nrInmatriculare} va expira în ${daysLeft} zile.

Detalii:
- Număr înmatriculare: ${client.nrInmatriculare}
- Telefon: ${client.nrTelefon}
- Data expirării: ${expirationDate.toLocaleDateString('ro-RO')}
- Zile rămase: ${daysLeft}

Pentru reînnoire, contactați-ne urgent!

© 2025 React Notificări
                `
            };

            const result = await this.emailTransporter.sendMail(emailContent);
            console.log(`✅ Email trimis cu succes pentru ${client.nrInmatriculare}:`, result.messageId);
            return true;
        } catch (error) {
            console.error(`❌ Eroare trimitere email pentru ${client.nrInmatriculare}:`, error);
            return false;
        }
    }

    /**
     * Trimite notificare SMS către un client
     * @param {Object} client - Datele clientului
     * @returns {Promise<boolean>} Succes/eșec
     */
    async sendSMSNotification(client) {
        try {
            const expirationDate = new Date(client.expirationDate);
            const daysLeft = Math.ceil((expirationDate - new Date()) / (1000 * 60 * 60 * 24));
            
            const smsText = `⚠️ ATENȚIE: Certificatul pentru ${client.nrInmatriculare} expiră în ${daysLeft} zile (${expirationDate.toLocaleDateString('ro-RO')}). Contactați-ne urgent pentru reînnoire! React Notificări`;

            // Simulăm trimiterea SMS (în implementarea reală ar folosi SMS API)
            console.log(`📱 SMS simulat către ${client.nrTelefon}:`);
            console.log(`   Mesaj: ${smsText}`);
            
            // În implementarea reală, aici ar fi apelul către SMS API
            // const smsResult = await this.sendSMSViaAPI(client.nrTelefon, smsText);
            
            return true;
        } catch (error) {
            console.error(`❌ Eroare trimitere SMS pentru ${client.nrInmatriculare}:`, error);
            return false;
        }
    }

    /**
     * Trimite notificări către toți clienții care expiră curând
     * @param {number} days - Numărul de zile până la expirare (default: 7)
     * @returns {Promise<Object>} Statistici notificări trimise
     */
    async sendExpirationNotifications(days = 7) {
        console.log(`🚀 Începem verificarea clienților care expiră în următoarele ${days} zile...`);
        
        const expiringClients = this.findExpiringClients(days);
        
        if (expiringClients.length === 0) {
            console.log('✅ Nu există clienți care expiră curând. Totul este în regulă!');
            return {
                totalClients: 0,
                emailsSent: 0,
                smsSent: 0,
                errors: 0
            };
        }

        const stats = {
            totalClients: expiringClients.length,
            emailsSent: 0,
            smsSent: 0,
            errors: 0
        };

        console.log(`📋 Procesăm ${expiringClients.length} clienți...`);

        for (const client of expiringClients) {
            try {
                console.log(`\n🔄 Procesăm clientul ${client.nrInmatriculare}...`);
                
                // Trimite email
                const emailSent = await this.sendEmailNotification(client);
                if (emailSent) {
                    stats.emailsSent++;
                }

                // Trimite SMS
                const smsSent = await this.sendSMSNotification(client);
                if (smsSent) {
                    stats.smsSent++;
                }

                // Pauză între notificări pentru a evita rate limiting
                await new Promise(resolve => setTimeout(resolve, 1000));
                
            } catch (error) {
                console.error(`❌ Eroare procesare client ${client.nrInmatriculare}:`, error);
                stats.errors++;
            }
        }

        console.log(`\n📊 Raport final notificări:`);
        console.log(`   - Total clienți procesați: ${stats.totalClients}`);
        console.log(`   - Email-uri trimise: ${stats.emailsSent}`);
        console.log(`   - SMS-uri trimise: ${stats.smsSent}`);
        console.log(`   - Erori: ${stats.errors}`);

        return stats;
    }

    /**
     * Verifică și trimite notificări zilnice (de rulat cu cron job)
     */
    async runDailyCheck() {
        console.log(`\n🕐 ${new Date().toISOString()} - Verificare zilnică notificări`);
        
        try {
            // Notifică clienții care expiră în 7 zile
            await this.sendExpirationNotifications(7);
            
            // Opțional: notifică și cei care expiră în 1 zi (urgență maximă)
            await this.sendExpirationNotifications(1);
            
            console.log('✅ Verificare zilnică completă!');
        } catch (error) {
            console.error('❌ Eroare verificare zilnică:', error);
        }
    }
}

module.exports = NotificationService;