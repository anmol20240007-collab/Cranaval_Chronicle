const User = require('../models/user');
const Complaint = require('../models/Complaint');

const userPortal = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ ok: false, message: 'Email required' });

    const user = await User.findOne({ email: email.toLowerCase() }).select('-password -__v').lean();
    if (!user) return res.status(404).json({ ok: false, message: 'User not found' });

    const complaints = await Complaint.find({ email: email.toLowerCase() }).select('-__v').lean();
    return res.json({ ok: true, user, complaints });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ ok: false, message: 'Server error' });
  }
}

const staffPortal = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ ok: false, message: 'Email required' });

    const staff = await User.findOne({ email: email.toLowerCase() }).select('fullName email role').lean();
    if (!staff) return res.status(404).json({ ok: false, message: 'Staff not found' });

    res.json({ ok: true, staff });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, message: 'Server error' });
  }
}

module.exports = { userPortal, staffPortal };