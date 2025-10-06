const path = require('path');
const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const cors = require('cors');
require('dotenv').config();

const User = require('./models/User');

const app = express();
app.use(cors());
app.use(express.json());

// Serve frontend static files
app.use('/', express.static(path.join(__dirname, '..', 'frontend')));

// MongoDB connection
const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/caravan';
mongoose.connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log('MongoDB connected'))
    .catch(err => {
        console.error('MongoDB connection error:', err.message);
        process.exit(1);
    });

// Helpers
function makeId(prefix = 'U') {
    // simple short id: prefix + timestamp last 6 + random 2 digits
    const t = Date.now().toString().slice(-6);
    const r = Math.floor(Math.random() * 90 + 10).toString();
    return `${prefix}${t}${r}`;
}

// Routes
// POST /api/register
// body: { fullName, role ('user'|'staff'), email, mobile, location, password }
app.post('/api/register', async (req, res) => {
    try {
        const { fullName, role, email, mobile, location, password } = req.body;
        if (!fullName || !role || !email || !mobile || !location || !password) {
            return res.status(400).json({ ok: false, message: 'All fields are required' });
        }
        const exists = await User.findOne({ email: email.toLowerCase() });
        if (exists) return res.status(409).json({ ok: false, message: 'Email already registered' });

        const hash = await bcrypt.hash(password, 10);
        const prefix = role === 'staff' ? 'S' : 'U';
        const userId = makeId(prefix);
        console.log(`Registering new ${role}: ${userId} (${email})`);
        const user = new User({
            userId,
            fullName,
            role,
            email: email.toLowerCase(),
            mobile,
            location,
            password: hash,
            // auto-approve regular users; staff require admin approval
            approved: role === 'staff' ? false : true
        });
        await user.save();
        return res.json({ ok: true, message: 'Registered', userId });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ ok: false, message: 'Server error' });
    }
});

// POST /api/user-login
// body: { userId, password }
app.post('/api/user-login', async (req, res) => {
    try {
        const { userId, password } = req.body;
        if (!userId || !password) return res.status(400).json({ ok: false, message: 'User ID and password required' });

        const user = await User.findOne({ userId, role: 'user' });
        if (!user) return res.status(401).json({ ok: false, message: 'Invalid credentials' });

        const ok = await bcrypt.compare(password, user.password);
        if (!ok) return res.status(401).json({ ok: false, message: 'Invalid credentials' });

        const out = user.toObject();
        delete out.password;
        return res.json({ ok: true, user: out });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ ok: false, message: 'Server error' });
    }
});

// POST /api/staff-login
// body: { staffId, password }
app.post('/api/staff-login', async (req, res) => {
    try {
        const { staffId, password } = req.body;
        if (!staffId || !password) return res.status(400).json({ ok: false, message: 'Staff ID and password required' });

        const user = await User.findOne({ userId: staffId, role: 'staff' });
        if (!user) return res.status(401).json({ ok: false, message: 'Invalid credentials' });

        // block login if not approved
        if (!user.approved) {
            return res.status(403).json({ ok: false, message: 'Account awaiting admin approval' });
        }

        const ok = await bcrypt.compare(password, user.password);
        if (!ok) return res.status(401).json({ ok: false, message: 'Invalid credentials' });

        const out = user.toObject();
        delete out.password;
        return res.json({ ok: true, user: out });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ ok: false, message: 'Server error' });
    }
});

// Admin endpoints for approving staff
// GET /api/staff/pending  -> list staff where approved=false
app.get('/api/staff/pending', async (req, res) => {
    try {
        const pending = await User.find({ role: 'staff', approved: false }).select('-password');
        return res.json({ ok: true, pending });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ ok: false, message: 'Server error' });
    }
});

// POST /api/staff/approve  -> body { staffId }
app.post('/api/staff/approve', async (req, res) => {
    try {
        const { staffId } = req.body;
        if (!staffId) return res.status(400).json({ ok: false, message: 'staffId required' });
        const u = await User.findOneAndUpdate({ userId: staffId, role: 'staff' }, { approved: true }, { new: true }).select('-password');
        if (!u) return res.status(404).json({ ok: false, message: 'Staff not found' });
        return res.json({ ok: true, message: 'Approved', user: u });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ ok: false, message: 'Server error' });
    }
});

// Fallback that ignores API routes
app.use((req, res, next) => {
  if (req.path.startsWith('/api/')) return next();
  res.sendFile(path.join(__dirname, '..', 'frontend', 'index.html'));
});

// Start
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));