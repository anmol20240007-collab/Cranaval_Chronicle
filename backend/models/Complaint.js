import mongoose from 'mongoose';

const StatusHistorySchema = new mongoose.Schema({
    status: { type: String, enum: ['pending', 'in-progress', 'resolved', 'cancelled'], required: true },
    updatedBy: { type: String, required: true }, // email of staff who updated
    updatedAt: { type: Date, default: Date.now }
}, { _id: false });

const ComplaintSchema = new mongoose.Schema({
    id: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    email: { type: String, required: true },
    location: { type: String, required: true },
    urgency: { 
        type: String, 
        enum: ['least', 'lesser', 'normal', 'more', 'most'], 
        required: false 
    },
    description: { type: String, required: true },
    image: { type: String, required: false },
    status: { 
        type: String, 
        enum: ['pending', 'in-progress', 'resolved', 'cancelled'],
        default: 'pending' 
    },
    statusHistory: [StatusHistorySchema],  // add status history array here
    date: { type: Date, default: Date.now },
    update: { type: Date, default: Date.now }
});

export default mongoose.model('Complaint', ComplaintSchema);
