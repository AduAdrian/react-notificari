require('dotenv').config();

/**
 * Configurare și validare variabile de mediu
 * pentru aplicația React Notificări
 */

class ConfigValidator {
    constructor() {
        this.requiredVars = [
            { name: 'JWT_SECRET', type: 'string', minLength: 16 },
            { name: 'PORT', type: 'number', default: 3001 },
            { name: 'NODE_ENV', type: 'string', default: 'development' }
        ];
        
        this.optionalVars = [
            { name: 'EMAIL_PASSWORD', type: 'string', description: 'Password pentru SMTP email' },
            { name: 'SMS_API_TOKEN', type: 'string', description: 'Token pentru SMS API' }
        ];

        this.config = {};
        this.warnings = [];
        this.errors = [];
    }

    /**
     * Validează și încarcă toate variabilele de mediu
     */
    validateAndLoad() {
        console.log('🔧 Validare configurație backend...');
        
        // Verifică variabilele obligatorii
        this.validateRequired();
        
        // Verifică variabilele opționale
        this.validateOptional();
        
        // Raportează rezultatele
        this.reportResults();
        
        // Returnează configurația
        return {
            isValid: this.errors.length === 0,
            config: this.config,
            warnings: this.warnings,
            errors: this.errors
        };
    }

    validateRequired() {
        for (const varDef of this.requiredVars) {
            const value = process.env[varDef.name] || varDef.default;
            
            if (!value && !varDef.default) {
                this.errors.push(`Variabila ${varDef.name} este obligatorie!`);
                continue;
            }
            
            // Validează tipul
            if (varDef.type === 'number') {
                const numValue = parseInt(value, 10);
                if (isNaN(numValue)) {
                    this.errors.push(`${varDef.name} trebuie să fie un număr valid`);
                    continue;
                }
                this.config[varDef.name] = numValue;
            } else {
                this.config[varDef.name] = value;
            }
            
            // Validează lungimea minimă pentru string-uri
            if (varDef.type === 'string' && varDef.minLength) {
                if (value.length < varDef.minLength) {
                    this.errors.push(`${varDef.name} trebuie să aibă cel puțin ${varDef.minLength} caractere`);
                }
            }
            
            // Verifică JWT_SECRET pentru dezvoltare
            if (varDef.name === 'JWT_SECRET' && value.includes('dev-') && process.env.NODE_ENV === 'production') {
                this.errors.push('JWT_SECRET pentru dezvoltare nu poate fi folosit în producție!');
            }
        }
    }

    validateOptional() {
        for (const varDef of this.optionalVars) {
            const value = process.env[varDef.name];
            
            if (!value) {
                this.warnings.push(`${varDef.name} nu este setat - ${varDef.description}`);
                this.config[varDef.name] = null;
            } else {
                // Verifică placeholder values
                if (value.includes('placeholder') || value.includes('your-') || value.includes('change-')) {
                    this.warnings.push(`${varDef.name} pare să folosească o valoare placeholder`);
                }
                this.config[varDef.name] = value;
            }
        }
    }

    reportResults() {
        // Raportează erorile
        if (this.errors.length > 0) {
            console.log('\n❌ ERORI DE CONFIGURAȚIE:');
            this.errors.forEach(error => console.log(`  • ${error}`));
        }
        
        // Raportează avertismentele
        if (this.warnings.length > 0) {
            console.log('\n⚠️  AVERTISMENTE:');
            this.warnings.forEach(warning => console.log(`  • ${warning}`));
        }
        
        // Raportează succesul
        if (this.errors.length === 0) {
            console.log('\n✅ Configurație validă');
            console.log(`   • Environment: ${this.config.NODE_ENV}`);
            console.log(`   • Port: ${this.config.PORT}`);
            console.log(`   • JWT: ${this.config.JWT_SECRET ? 'Configurat' : 'Lipsește'}`);
            console.log(`   • Email: ${this.config.EMAIL_PASSWORD ? 'Configurat' : 'Nu este configurat'}`);
            console.log(`   • SMS: ${this.config.SMS_API_TOKEN ? 'Configurat' : 'Nu este configurat'}`);
        }
    }

    /**
     * Returnează configurația pentru utilizare în aplicație
     */
    getConfig() {
        return this.config;
    }

    /**
     * Verifică dacă email-ul este configurat corect
     */
    isEmailConfigured() {
        return this.config.EMAIL_PASSWORD && !this.config.EMAIL_PASSWORD.includes('placeholder');
    }

    /**
     * Verifică dacă SMS-ul este configurat corect
     */
    isSMSConfigured() {
        return this.config.SMS_API_TOKEN && !this.config.SMS_API_TOKEN.includes('placeholder');
    }
}

// Export ca singleton
const configValidator = new ConfigValidator();
const validationResult = configValidator.validateAndLoad();

if (!validationResult.isValid) {
    console.log('\n🚨 CONFIGURAȚIA NU ESTE VALIDĂ! Aplicația se oprește.');
    console.log('💡 Verifică fișierul .env și .env.example pentru exemple.');
    process.exit(1);
}

module.exports = {
    config: configValidator.getConfig(),
    validator: configValidator,
    isEmailConfigured: configValidator.isEmailConfigured(),
    isSMSConfigured: configValidator.isSMSConfigured()
};