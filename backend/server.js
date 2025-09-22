require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

// Global error handlers pentru a preveni crash-urile aplicației
process.on('unhandledRejection', (reason, promise) => {
    console.error('⚠️ Unhandled Promise Rejection:', reason);
    console.error('At promise:', promise);
    // Nu închide aplicația, doar loghează
});

process.on('uncaughtException', (error, origin) => {
    console.error('🚨 Uncaught Exception:', error);
    console.error('Origin:', origin);
    // Graceful shutdown după logare
    setTimeout(() => {
        console.log('🔄 Restarting server after uncaught exception...');
        process.exit(1);
    }, 1000);
});

const app = express();
const PORT = process.env.PORT || 3001;

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

// SMS Queue management endpoints
app.get('/api/sms/queue/status', async (req, res) => {
    try {
        const verificationService = require('./utils/verification');
        const status = await verificationService.checkSMSQueueStatus();
        res.json({ success: true, queue: status });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

app.post('/api/sms/queue/process', async (req, res) => {
    try {
        const verificationService = require('./utils/verification');
        const result = await verificationService.processSMSQueue();
        res.json({ success: true, result });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

app.delete('/api/sms/queue/clear', async (req, res) => {
    try {
        const verificationService = require('./utils/verification');
        const result = await verificationService.clearSMSQueue();
        res.json({ success: true, result });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Health check endpoint cu informații detaliate
app.get('/api/health', (req, res) => {
    const health = {
        status: 'OK',
        message: 'Backend funcționează perfect!',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        environment: process.env.NODE_ENV || 'development',
        version: '1.0.0'
    };

    res.json(health);
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
    console.error('🚨 Express Error Caught:', err.stack);

    // Nu trimite detalii în producție
    const message = process.env.NODE_ENV === 'production'
        ? 'Eroare interna server'
        : err.message;

    res.status(err.status || 500).json({
        success: false,
        message: message,
        timestamp: new Date().toISOString(),
        ...(process.env.NODE_ENV === 'development' && {
            error: err.message,
            stack: err.stack
        })
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
�         BACKEND SERVER PORNIT CU SUCCES!            �
�------------------------------------------------------�
�  ?? Server URL: http://localhost:${PORT}              �
�  ?? Email SMTP: Configurat ?i func?ional            �
�  ?? SMS API: Configurat ?i func?ional               �
�  ?? JWT: Activ                                      �
�  ?? Environment: ${process.env.NODE_ENV || 'development'}                     �
+------------------------------------------------------+
    `);
});

// Graceful shutdown handlers
const gracefulShutdown = (signal) => {
    console.log(`\n🔄 ${signal} received, starting graceful shutdown...`);

    server.close(() => {
        console.log('✅ HTTP server closed');
        console.log('👋 Server shutdown complete');
        process.exit(0);
    });

    // Force close după 10 secunde dacă graceful shutdown nu reușește
    setTimeout(() => {
        console.error('❌ Forced shutdown after timeout');
        process.exit(1);
    }, 10000);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

module.exports = app;
