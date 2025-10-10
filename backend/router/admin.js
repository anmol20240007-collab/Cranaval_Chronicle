const bcrypt = require('bcrypt');
const Admin = require('../models/Admin');

const registerAdmin = async (req, res) => {
    try {

        const { requesterEmail, requesterPassword, newAdminEmail, newAdminPassword } = req.body;

        if (!requesterEmail || !requesterPassword || !newAdminEmail || !newAdminPassword) {
            return res.status(400).json({ ok: false, message: 'All fields are required' });
        }
        if (
            typeof requesterEmail !== 'string' ||
            typeof requesterPassword !== 'string' ||
            typeof newAdminEmail !== 'string' ||
            typeof newAdminPassword !== 'string'
        ) {
            return res.status(400).json({ ok: false, message: 'All fields must be strings' });
        }


        const lowerRequesterEmail = requesterEmail.toLowerCase();
        const requestingAdmin = await Admin.findOne({ email: lowerRequesterEmail });
        if (!requestingAdmin) {
            return res.status(401).json({ ok: false, message: 'Requesting admin not found' });
        }
        const validRequester = await bcrypt.compare(requesterPassword, requestingAdmin.password);
        if (!validRequester) {
            return res.status(403).json({ ok: false, message: 'Invalid requester admin password' });
        }


        const lowerNewEmail = newAdminEmail.toLowerCase();
        const exists = await Admin.findOne({ email: lowerNewEmail });
        if (exists) {
            return res.status(409).json({ ok: false, message: 'New admin email already registered' });
        }

        const newAdminHash = await bcrypt.hash(newAdminPassword, 10);
        const newAdmin = new Admin({ email: lowerNewEmail, password: newAdminHash });
        await newAdmin.save();

        console.log(`Admin (${lowerRequesterEmail}) registered a new admin (${lowerNewEmail})`);

        return res.json({ ok: true, message: 'New admin registered successfully', email: lowerNewEmail });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ ok: false, message: 'Server error' });
    }
};

const loginAdmin = async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({ ok: false, message: 'Email and password required' });
        }
        if (typeof email !== 'string' || typeof password !== 'string') {
            return res.status(400).json({ ok: false, message: 'Fields must be strings' });
        }

        const lowerEmail = email.toLowerCase();
        const admin = await Admin.findOne({ email: lowerEmail });
        if (!admin) return res.status(404).json({ ok: false, message: 'Admin not found' });

        const validPwd = await bcrypt.compare(password, admin.password);
        if (!validPwd) return res.status(401).json({ ok: false, message: 'Invalid password' });

        return res.json({ ok: true, message: 'Admin login successful', email: admin.email });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ ok: false, message: 'Server error' });
    }
};

module.exports = { registerAdmin, loginAdmin };