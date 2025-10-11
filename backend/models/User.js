import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema({
    fullName: { type: String, required: true },
    role: { type: String, enum: ['user', 'staff'], required: true },
    email: { type: String, required: true, unique: true },
    location: { type: String, required: true },
    password: { type: String, required: true },
    approved: { type: Boolean, default: false }, 
    createdAt: { type: Date, default: Date.now }
});

export default mongoose.model('User', UserSchema);