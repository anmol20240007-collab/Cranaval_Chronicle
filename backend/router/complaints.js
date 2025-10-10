const getComplaints = async (req, res) => {
  try {
    const complaints = await Complaint.find().select('-__v -password').lean();
    return res.json(complaints);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ ok: false, message: 'Server error' });
  }
};

const registerComplaint = async (req, res) => {
    try {
        const { name, email, location, urgency, description } = req.body;

        if (!name || !email || !location || !urgency || !description) {
            return res.status(400).json({ ok: false, message: 'All fields are required' });
        }

        const user = await User.findOne({ email: email.toLowerCase() });
        if (!user) return res.status(401).json({ ok: false, message: 'This email is not registered' });

        const id = 'TC-' + new Date().getFullYear() + '-' + nanoid(6).toUpperCase(); // example: TC-2025-1A2B3C

        const complaint = new Complaint({ id, name, email, location, urgency, description });
        await complaint.save();

        return res.status(201).json({ ok: true, message: 'Complaint registered', complaint });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ ok: false, message: 'Server error' });
    }
};

const updateComplaint =  async (req, res) => {
    try {
        const { id, status, email } = req.body;
        if (!id || !status || !email) {
            return res.status(400).json({ ok: false, message: 'Complaint id, status, and email are required' });
        }
        const staff = await User.findOne({ email, role: 'staff', approved: true });
        if (!staff) {
            return res.status(403).json({ ok: false, message: 'Only approved staff can update complaints' });
        }
        
        const complaint = await Complaint.findOne({ id });
        if (!complaint) {
            return res.status(404).json({ ok: false, message: 'Complaint not found' });
        }

        if (!['pending', 'in-progress', 'resolved', 'cancelled'].includes(status)) {
            return res.status(400).json({ ok: false, message: 'Invalid status' });
        }

        complaint.status = status;
        complaint.update = new Date();

        // Push to status history
        complaint.statusHistory.push({
            status: status,
            updatedBy: email,
            updatedAt: new Date()
        });

        await complaint.save();

        return res.json({ ok: true, message: 'Complaint status updated', complaint });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ ok: false, message: 'Server error' });
    }
};

module.exports = { getComplaints, registerComplaint, updateComplaint };