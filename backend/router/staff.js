const User = require('../models/User');

const staffPending = async (req, res) => {
    try {
        const pending = await User.find({ role: 'staff', approved: false }).select('-password');
        return res.json({ ok: true, pending });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ ok: false, message: 'Server error' });
    }
}

const staffApprove = async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) return res.status(400).json({ ok: false, message: 'staffId required' });
        const u = await User.findOneAndUpdate({ email: email, role: 'staff' }, { approved: true }, { new: true }).select('-password');
        if (!u) return res.status(404).json({ ok: false, message: 'Staff not found' });
        return res.json({ ok: true, message: 'Approved', user: u });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ ok: false, message: 'Server error' });
    }
}

module.exports = { staffPending, staffApprove };