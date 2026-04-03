const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const connectDB = require('./config/db');
const authRoutes = require('./routes/authRoutes');
const facultyRoutes = require('./routes/facultyRoutes');
const studentRoutes = require('./routes/studentRoutes');
const adminRoutes = require('./routes/adminRoutes');

dotenv.config();

const app = express();

// CORS must be first — before DB middleware and error handler
// so every response (including errors) gets CORS headers
app.use(cors({ origin: '*', methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'] }));
app.options('*', cors()); // handle preflight for all routes

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Connect to DB on each request (serverless-safe, cached after first connect)
app.use(async (req, res, next) => {
    try {
        await connectDB();
        next();
    } catch (error) {
        return res.status(503).json({ message: 'Database connection failed: ' + error.message });
    }
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/faculty', facultyRoutes);
app.use('/api/student', studentRoutes);
app.use('/api/admin', adminRoutes);

// Health check
app.get('/', (req, res) => {
    res.json({
        name: 'MarkMe Smart Attendance API',
        author: 'Abhinav Tarigoopula',
        status: 'running',
        version: '2.0',
        env: {
            mongo: !!process.env.MONGO_URI,
            jwt: !!process.env.JWT_SECRET,
            cloudinary: !!process.env.CLOUDINARY_CLOUD_NAME,
            node_env: process.env.NODE_ENV || 'not set'
        }
    });
});

// Error handler
app.use((err, req, res, next) => {
    console.error('[Error]', err.message);
    res.status(res.statusCode === 200 ? 500 : res.statusCode)
       .json({ message: err.message });
});

const PORT = process.env.PORT || 5000;

if (process.env.NODE_ENV !== 'production') {
    const missingEnvVars = ['MONGO_URI', 'JWT_SECRET'].filter(v => !process.env[v]);
    if (missingEnvVars.length > 0) {
        console.error(`❌ Missing env vars: ${missingEnvVars.join(', ')}`);
        process.exit(1);
    }
    app.listen(PORT, () => {
        console.log(`✓ Server running on port ${PORT}`);
    });
}

module.exports = app;
