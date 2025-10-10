const path = require('path');
const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config(); 

const { registerAdmin, loginAdmin } = require('./router/admin');
const { register, userLogin, staffLogin} = require('./router/auth');
const { userPortal,staffPortal } = require('./router/portals');
const { getComplaints, registerComplaint, updateComplaint } = require('./router/complaints');
const { staffPending, staffApprove } = require('./router/staff');
const upload = require('./middleware/upload');
const exportRoutes = require('./router/complaintData');

const app = express();
app.use(cors());
app.use(express.json());


mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));


app.use('/', express.static(path.join(__dirname, '..', 'frontend')));
app.use('/uploads', express.static(path.join(__dirname, 'middleware', 'uploads')));
app.use('/api/export', exportRoutes);


router.post('/api/register', register);
router.post('/api/login', userLogin);
router.post('/api/userportal', userPortal);
router.post('/api/staff/login', staffLogin);
router.post('/api/staffportal', staffPortal);
router.get('/api/staff/pending', staffPending);
router.post('/api/staff/approve', staffApprove);
router.post('/api/admin/register', registerAdmin);
router.post('/api/admin/login', loginAdmin);
router.post('/api/complaints/register', upload.single('image'), registerComplaint);
router.post('/api/complaints/update-status', updateComplaint);
router.get('/api/complaints/all', getComplaints);


app.use(router);

app.use((req, res, next) => {
  if (req.path.startsWith('/api/')) return next();
  res.sendFile(path.join(__dirname, '..', 'frontend', 'index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
