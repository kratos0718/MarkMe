const mongoose = require('mongoose');

const connectDB = async () => {
    if (mongoose.connection.readyState >= 1) {
        console.log('✓ MongoDB connection already established.');
        return;
    }

    try {
        const mongoURI = process.env.MONGO_URI;
        
        if (!mongoURI) {
            throw new Error('MONGO_URI is not defined in .env file');
        }

        await mongoose.connect(mongoURI, {
            serverSelectionTimeoutMS: 5000,
            socketTimeoutMS: 45000,
            retryWrites: true,
            w: 'majority',
            tls: true
        });
        console.log('✓ MongoDB Connected Successfully');
    } catch (error) {
        console.error('✗ MongoDB Connection Failed:', error.message);
        // Do NOT call process.exit() — it kills Vercel serverless functions
        throw error;
    }
};

module.exports = connectDB;
