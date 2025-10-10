const bcrypt = require('bcrypt');
const User = require('../models/user');
const register = async (req, res) => {
    try {
        const { fullName, role, email, location, password } = req.body;
        if (!fullName || !role || !email || !location || !password) {
            return res.status(400).json({ ok: false, message: 'All fields are required' });
        }

        if (typeof fullName !== 'string' || typeof role !== 'string' || typeof email !== 'string' || typeof location !== 'string' || typeof password !== 'string') {
            return res.status(400).json({ ok: false, message: 'All fields must be strings' });
        }

        const lowerEmail = email.toLowerCase();
        const exists = await User.findOne({ email: lowerEmail });
        if (exists) return res.status(409).json({ ok: false, message: 'Email already registered' });

        const hash = await bcrypt.hash(password, 10);
        console.log(`Registering new ${role}:(${lowerEmail})`);
        const user = new User({
            fullName,
            role,
            email: lowerEmail,
            location,
            password: hash,
            approved: role === 'staff' ? false : true
        });
        const savedUser = await user.save().catch(err => {
            console.error(err);
            throw err;
        });

        return res.json({ ok: true, message: 'Registered', email: savedUser.email });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ ok: false, message: 'Server error' });
    }
}
        

const userLogin = async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) return res.status(400).json({ ok: false, message: 'User ID and password required' });

        const user = await User.findOne({ email, role: 'user' });
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
}

const staffLogin = async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) return res.status(400).json({ ok: false, message: 'Staff ID and password required' });

        const user = await User.findOne({ email: email, role: 'staff' });
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
}


module.exports = { register, userLogin, staffLogin }
