import path from 'path';
import express from 'express';
const router = express.Router();
import mongoose from 'mongoose';
import cors from 'cors';
import { dirname } from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv'; 
dotenv.config();

import { registerAdmin, loginAdmin } from './router/admin.js';
import { register, userLogin, staffLogin } from './router/auth.js';
import { userPortal, staffPortal } from './router/portals.js';
import { getComplaints, registerComplaint, updateComplaint } from './router/complaints.js';
import { staffPending, staffApprove } from './router/staff.js';
import upload from './middleware/upload.js';
import exportRoutes from './router/complaintData.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
app.use(cors());
app.use(express.json());

const MONGO_URI = process.env.MONGO_URI;
if (!MONGO_URI) {
  throw new Error('MONGODB_URI environment variable not set');
}

mongoose.connect(MONGO_URI)
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

// ⚡ Vercel exports the app (no app.listen)
if (process.env.NODE_ENV !== 'production') {
  // For local testing
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
}

// ✅ Export the app for Vercel
export default app;
