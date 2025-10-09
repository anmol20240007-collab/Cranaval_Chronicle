const bcrypt = require('bcrypt');
const { nanoid } = require('nanoid'); 
const User = require('../models/user');
const Admin = require('../models/Admin');
const Complaint = require('../models/Complaint');

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
const registerAdmin = async (req, res) => {
    try {
        // These credentials belong to the requesting (existing) admin
        const { requesterEmail, requesterPassword, newAdminEmail, newAdminPassword } = req.body;

        // Validate all fields are present and string
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

        // Authenticate the requester's credentials
        const lowerRequesterEmail = requesterEmail.toLowerCase();
        const requestingAdmin = await Admin.findOne({ email: lowerRequesterEmail });
        if (!requestingAdmin) {
            return res.status(401).json({ ok: false, message: 'Requesting admin not found' });
        }
        const validRequester = await bcrypt.compare(requesterPassword, requestingAdmin.password);
        if (!validRequester) {
            return res.status(403).json({ ok: false, message: 'Invalid requester admin password' });
        }

        // Check if new admin already exists
        const lowerNewEmail = newAdminEmail.toLowerCase();
        const exists = await Admin.findOne({ email: lowerNewEmail });
        if (exists) {
            return res.status(409).json({ ok: false, message: 'New admin email already registered' });
        }

        // Register the new admin
        const newAdminHash = await bcrypt.hash(newAdminPassword, 10);
        const newAdmin = new Admin({ email: lowerNewEmail, password: newAdminHash });
        await newAdmin.save();

        // Optionally, log who registered whom
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


module.exports = {
    userLogin,
    register,
    staffLogin,
    staffPending,
    staffApprove,
    registerAdmin,
    loginAdmin,
    registerComplaint,
    updateComplaint,
    getComplaints
}
