const mongoose = require('mongoose');

const ReportSchema = new mongoose.Schema({
    type: {
        type: String,
        required: true,
    },
    description: {
        type: String,
        required: true,
    },
    photo_url: {
        type: String,
    },
    location_lat: {
        type: Number,
    },
    location_lng: {
        type: Number,
    },
    status: {
        type: String,
        enum: ['submitted', 'in-progress', 'resolved', 'closed'],
        default: 'submitted',
    },
    contact: {
        type: String,
    },
    name: {
        type: String,
    },
    address: {
        type: String,
    },
    email: {
        type: String,
    },
    assigned_department_id: {
        type: String,
        default: null,
    },
    quarantined: {
        type: Boolean,
        default: false,
    },
    quarantine_reason: {
        type: String,
    },
    created_by: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
    updatedAt: {
        type: Date,
        default: Date.now,
    },
});

ReportSchema.pre('save', function () {
    this.updatedAt = Date.now();
});

module.exports = mongoose.model('Report', ReportSchema);
