const path = require('path');
const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const cors = require('cors');
require('dotenv').config();
const {register, userLogin, staffLogin, staffPending, staffApprove} = require('./router/auth');


const User = require('./models/User');

const app = express();
app.use(cors());
app.use(express.json());

// Serve frontend static files
app.use('/', express.static(path.join(__dirname, '..', 'frontend')));

// MongoDB connection
const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/caravan';
mongoose.connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log('MongoDB connected'))
    .catch(err => {
        console.error('MongoDB connection error:', err.message);
        process.exit(1);
    });

// Routes
router.post('/api/register', register);

router.post('/api/user-login', userLogin);

router.post('/api/staff-login', staffLogin);

router.get('/api/staff/pending', staffPending);

router.post('/api/staff/approve', staffApprove);

// Fallback that ignores API routes
app.use((req, res, next) => {
  if (req.path.startsWith('/api/')) return next();
  res.sendFile(path.join(__dirname, '..', 'frontend', 'index.html'));
});

// Start
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));