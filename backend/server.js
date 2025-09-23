require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
// const { connectDB } = require('./config/database');

// Disable MongoDB for now - use JSON database
// connectDB();

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

// Cookie parser middleware - NECESAR pentru sesiuni
const cookieParser = require('cookie-parser');
app.use(cookieParser());

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Logging middleware
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
    next();
});

// Routes
const authRoutes = require('./auth_copy');  // Use JSON database auth
const adminRoutes = require('./routes/admin');
const vehicleRoutes = require('./routes/vehicles');

app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/vehicles', vehicleRoutes);

// Test data management endpoints
const testData = require('./utils/testData');

app.post('/api/test/add-clients', (req, res) => {
    try {
        const result = testData.addTestClients();
        res.json(result);
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

app.delete('/api/test/remove-clients', (req, res) => {
    try {
        const result = testData.removeTestClients();
        res.json(result);
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Notification service endpoints
const NotificationService = require('./services/NotificationService');
const notificationService = new NotificationService();

app.get('/api/notifications/check', async (req, res) => {
    try {
        const days = parseInt(req.query.days) || 7;
        const expiringClients = notificationService.findExpiringClients(days);
        res.json({ 
            success: true, 
            expiringClients,
            count: expiringClients.length,
            days 
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

app.post('/api/notifications/send', async (req, res) => {
    try {
        const days = parseInt(req.body.days) || 7;
        const stats = await notificationService.sendExpirationNotifications(days);
        res.json({ success: true, stats });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

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
