const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
    userId: { type: String, required: true, unique: true }, // Uxxxxx or Sxxxxx
    fullName: { type: String, required: true },
    role: { type: String, enum: ['user', 'staff'], required: true },
    email: { type: String, required: true, unique: true },
    mobile: { type: String, required: true },
    location: { type: String, required: true },
    password: { type: String, required: true },
    approved: { type: Boolean, default: false }, // admins must approve staff
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('User', UserSchema);