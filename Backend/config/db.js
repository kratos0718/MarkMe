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
        console.error('\n⚠️  TROUBLESHOOTING STEPS:');
        console.error('1. Verify MONGO_URI is correct in .env file');
        console.error('2. Whitelist your IP in MongoDB Atlas: https://cloud.mongodb.com/v2/network/access');
        console.error('3. Ensure your network allows outbound connections to MongoDB');
        console.error('4. Check if MongoDB credentials are valid\n');
        process.exit(1);
    }
};

module.exports = connectDB;
