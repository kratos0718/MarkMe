const express = require('express');
const { registerUser, loginUser, getMe } = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.post('/register', registerUser);
router.post('/login', loginUser);
router.get('/me', protect, getMe);
router.post('/forgotpassword', require('../controllers/authController').forgotPassword);
router.put('/resetpassword/:resetToken', require('../controllers/authController').resetPassword);

/* ── Demo Seed ─────────────────────────────────────────────────────
   GET /api/auth/seed-demo
   Creates 3 demo accounts + 1 always-active demo session if missing.
   Safe to call multiple times (idempotent).
──────────────────────────────────────────────────────────────────── */
router.get('/seed-demo', async (req, res) => {
    try {
        const User    = require('../models/User');
        const Session = require('../models/Session');

        const DEMO_PASS = 'Demo@1234';

        // Pass PLAIN password — the User model's pre('save') hook hashes it.
        // Do NOT pre-hash here or the password gets double-hashed and login fails.
        const demoUsers = [
            { name: 'Demo Student', email: 'demo.student@gitam.edu', role: 'student', rollNo: '2099999999' },
            { name: 'Demo Faculty', email: 'demo.faculty@gitam.edu', role: 'faculty' },
            { name: 'Demo Admin',   email: 'demo.admin@gitam.edu',   role: 'admin'   },
        ];

        const created = [];
        for (const u of demoUsers) {
            const exists = await User.findOne({ email: u.email });
            if (!exists) {
                await User.create({ ...u, password: DEMO_PASS });
                created.push(u.email + ' (created)');
            } else {
                // Always reset password so broken hashes are fixed
                exists.password = DEMO_PASS;
                await exists.save(); // triggers pre('save') bcrypt hook
                created.push(u.email + ' (password reset)');
            }
        }

        const demoFaculty = await User.findOne({ email: 'demo.faculty@gitam.edu' });

        // Upsert demo session — always isActive:true, huge radius, far future expiry
        let demoSession = await Session.findOne({ sessionKey: '123456' });
        if (!demoSession) {
            demoSession = await Session.create({
                faculty:    demoFaculty._id,
                sessionKey: '123456',
                subject:    'Demo Class',
                className:  'Demo-Room-1',
                location:   { lat: 17.7339, lng: 83.2318, radius: 10000000 },
                isActive:   true,
                expireAt:   new Date('2099-12-31'),
            });
        } else {
            // Revive regardless — make sure it's always usable
            demoSession.isActive = true;
            demoSession.expireAt = new Date('2099-12-31');
            await demoSession.save();
        }

        res.json({
            message: 'Demo accounts ready',
            created,
            credentials: {
                student: { email: 'demo.student@gitam.edu', password: DEMO_PASS },
                faculty: { email: 'demo.faculty@gitam.edu', password: DEMO_PASS },
                admin:   { email: 'demo.admin@gitam.edu',   password: DEMO_PASS },
            },
            demoSessionKey: '123456',
        });
    } catch (err) {
        console.error('Seed demo error:', err);
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;
