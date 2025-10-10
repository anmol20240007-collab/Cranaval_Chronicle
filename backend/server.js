const path = require('path');
const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config(); 

const { register, userLogin, userPortal, staffLogin, staffPortal,staffPending, staffApprove, registerAdmin, loginAdmin, registerComplaint, updateComplaint, getComplaints } = require('./router/auth');
const { get } = require('http');

const app = express();
app.use(cors());
app.use(express.json());

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

// Serve frontend static files
app.use('/', express.static(path.join(__dirname, '..', 'frontend')));

// Define API routes on router
router.post('/api/register', register);
router.post('/api/login', userLogin);
router.post('/api/userportal', userPortal);
router.post('/api/staff/login', staffLogin);
router.post('/api/staffportal', staffPortal);
router.get('/api/staff/pending', staffPending);
router.post('/api/staff/approve', staffApprove);
router.post('/api/admin/register', registerAdmin);
router.post('/api/admin/login', loginAdmin);
router.post('/api/complaints/register', registerComplaint);
router.post('/api/complaints/update-status', updateComplaint);
router.get('/api/complaints/all', getComplaints);


// Use router in app
app.use(router);

// Fallback that ignores API routes but serves frontend
app.use((req, res, next) => {
  if (req.path.startsWith('/api/')) return next();
  res.sendFile(path.join(__dirname, '..', 'frontend', 'index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
