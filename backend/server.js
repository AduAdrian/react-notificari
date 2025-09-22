// Validare configurație înaintea încărcării aplicației
const { config, isEmailConfigured, isSMSConfigured } = require('./config/env-validator');

const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = config.PORT;

// Middleware
app.use(cors({
    origin: ['http://localhost:3000', 'http://localhost:3002'],
    credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Logging middleware
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
    next();
});

// Routes
const authRoutes = require('./routes/auth');
app.use('/api/auth', authRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'OK', 
        message: 'Backend funcționează perfect!',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        configuration: {
            environment: config.NODE_ENV,
            emailConfigured: isEmailConfigured,
            smsConfigured: isSMSConfigured,
            jwtConfigured: !!config.JWT_SECRET
        }
    });
});

// Root endpoint
app.get('/', (req, res) => {
    res.json({ 
        message: 'React Notificari Backend API',
        version: '1.0.0',
        endpoints: {
            health: '/api/health',
            register: 'POST /api/auth/register',
            verify: 'POST /api/auth/verify',
            login: 'POST /api/auth/login'
        }
    });
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Error:', err.stack);
    res.status(500).json({ 
        success: false, 
        message: 'Eroare interna server',
        error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({ 
        success: false, 
        message: `Endpoint ${req.path} nu exista` 
    });
});

// Start server
const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`
+------------------------------------------------------+
│         BACKEND SERVER PORNIT CU SUCCES!            │
│------------------------------------------------------│
│  🌐 Server URL: http://localhost:${PORT}              │
│  📧 Email SMTP: ${isEmailConfigured ? 'Configurat și funcțional' : 'Nu este configurat (dev mode)'}            │
│  📱 SMS API: ${isSMSConfigured ? 'Configurat și funcțional' : 'Nu este configurat (dev mode)'}               │
│  🔐 JWT: ${config.JWT_SECRET ? 'Activ' : 'Inactiv'}                                      │
│  🛠️  Environment: ${config.NODE_ENV}                     │
+------------------------------------------------------+
    `);
    
    // Afișează avertismente dacă serviciile nu sunt configurate
    if (!isEmailConfigured || !isSMSConfigured) {
        console.log('\n⚠️  AVERTISMENT: Unele servicii nu sunt configurate complet:');
        if (!isEmailConfigured) {
            console.log('   • Email SMTP: Configurați EMAIL_PASSWORD în .env');
        }
        if (!isSMSConfigured) {
            console.log('   • SMS API: Configurați SMS_API_TOKEN în .env');
        }
        console.log('   • Pentru dezvoltare, aplicația va funcționa fără acestea.\n');
    }
});

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('SIGTERM received, closing server...');
    server.close(() => {
        console.log('Server closed');
        process.exit(0);
    });
});

process.on('SIGINT', () => {
    console.log('\nSIGINT received, closing server...');
    server.close(() => {
        console.log('Server closed');
        process.exit(0);
    });
});

module.exports = app;
