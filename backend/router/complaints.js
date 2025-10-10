const Complaint = require('../models/Complaint');
const User = require('../models/User');
const { nanoid } = await import('nanoid');

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

    console.log(name, email, location, urgency, description);

    if (!name || !email || !location || !urgency || !description) {
      return res.status(400).json({ ok: false, message: 'All fields are required' });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) return res.status(401).json({ ok: false, message: 'This email is not registered' });

    const id = 'TC-' + new Date().getFullYear() + '-' + nanoid(6).toUpperCase();

    let imagePath = null;
    if (req.file) {
    imagePath = '/uploads/' + req.file.filename; 
    }

    const complaint = new Complaint({ id, name, email, location, urgency, description, image: imagePath });
    await complaint.save();

    return res.status(201).json({ ok: true, message: 'Complaint registered', complaint });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ ok: false, message: 'Server error' });
  }
};
const updateComplaint = async (req, res) => {
  try {
    const { id, status, email } = req.body;
    if (!id || !status || !email) {
      return res.status(400).json({ ok: false, message: 'Complaint id, status, and email are required' });
    }

    const staff = await User.findOne({ email, role: 'staff', approved: true });
    if (!staff) {
      return res.status(403).json({ ok: false, message: 'Only approved staff can update complaints' });
    }

    if (!['pending', 'in-progress', 'resolved', 'cancelled'].includes(status)) {
      return res.status(400).json({ ok: false, message: 'Invalid status' });
    }

    const updateData = {
      status: status,
      update: new Date(),
      $push: {
        statusHistory: {
          status: status,
          updatedBy: email,
          updatedAt: new Date()
        }
      }
    };

    const complaint = await Complaint.findOneAndUpdate(
      { id },
      updateData,
      { new: true } 
    );

    if (!complaint) {
      return res.status(404).json({ ok: false, message: 'Complaint not found' });
    }

    return res.json({ ok: true, message: 'Complaint status updated', complaint });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ ok: false, message: 'Server error' });
  }
};


module.exports = { getComplaints, registerComplaint, updateComplaint };