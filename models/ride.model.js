const mongoose = require('mongoose');

const locationSchema = new mongoose.Schema({
    type: {
        type: String,
        enum: ['Point'],
        default: 'Point'
    },
    coordinates: {
        type: [Number],
        required: true
    }
});

const rideSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    challengeId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Challenge',
        required: true
    },
    status: {
        type: String,
        enum: ['started', 'paused', 'completed', 'cancelled', 'pending'], // Added 'pending'
        default: 'started'
    },
    startLocation: {
        type: locationSchema,
        required: true
    },
    currentLocation: {
        type: locationSchema
    },
    endLocation: {
        type: locationSchema
    },
    startTime: {
        type: Date,
        default: Date.now
    },
    endTime: Date,
    distance: {
        type: Number,
        default: 0
    },
    averageSpeed: {
        type: Number,
        default: 0
    },
    maxSpeed: {
        type: Number,
        default: 0
    },
    pauseHistory: [{
        startTime: Date,
        endTime: Date,
        reason: String
    }],
    route: [{
        location: locationSchema,
        timestamp: Date,
        speed: Number,
        acceleration: Number
    }]
}, {
    timestamps: true
});

const Ride = mongoose.model('Ride', rideSchema);
module.exports = Ride;
