const mongoose = require('mongoose');

/**
 * Configurația pentru conectarea la MongoDB
 */
const connectDB = async () => {
    try {
        const conn = await mongoose.connect('mongodb://localhost:27017/react-notificari');

        console.log(`✅ MongoDB conectat: ${conn.connection.host}`);
        return conn;
    } catch (error) {
        console.error('❌ Eroare conectare MongoDB:', error.message);
        process.exit(1);
    }
};

/**
 * Închide conexiunea la MongoDB
 */
const disconnectDB = async () => {
    try {
        await mongoose.connection.close();
        console.log('✅ Conexiunea MongoDB închisă');
    } catch (error) {
        console.error('❌ Eroare închidere conexiune MongoDB:', error.message);
    }
};

module.exports = {
    connectDB,
    disconnectDB
};