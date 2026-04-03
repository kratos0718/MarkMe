const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const connectDB = require('./config/db');
const authRoutes = require('./routes/authRoutes');
const facultyRoutes = require('./routes/facultyRoutes');
const studentRoutes = require('./routes/studentRoutes');
const adminRoutes = require('./routes/adminRoutes');

// Load env vars
dotenv.config();

// Validate required environment variables
const requiredEnvVars = ['MONGO_URI', 'JWT_SECRET'];
const missingEnvVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingEnvVars.length > 0) {
    console.error(`❌ Missing required environment variables: ${missingEnvVars.join(', ')}`);
    console.error('Please check your .env file');
    process.exit(1);
}

const app = express();

// Database connection middleware for serverless
app.use(async (req, res, next) => {
    try {
        await connectDB();
        next();
    } catch (error) {
        next(error);
    }
});

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/faculty', facultyRoutes);
app.use('/api/student', studentRoutes);
app.use('/api/admin', adminRoutes);

// Base route
app.get('/', (req, res) => {
    res.json({
        name: 'MarkMe Smart Attendance API',
        author: 'Abhinav Tarigoopula',
        institution: 'GITAM University',
        status: 'running',
        version: '2.0'
    });
});

// Error handling middleware
app.use((err, req, res, next) => {
    const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
    res.status(statusCode);
    res.json({
        message: err.message,
        stack: process.env.NODE_ENV === 'production' ? null : err.stack,
    });
});

const PORT = process.env.PORT || 5000;

// Only bind to a port if running locally
if (process.env.NODE_ENV !== 'production') {
    app.listen(PORT, () => {
        console.log(`✓ Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
        console.log(`✓ API available at http://localhost:${PORT}`);
    });
}

// Export the app for Vercel's serverless functions
module.exports = app;