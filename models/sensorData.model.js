const mongoose = require('mongoose');

const sensorReadingSchema = new mongoose.Schema({
    rideId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Ride',
        required: true
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    timestamp: {
        type: Date,
        default: Date.now
    },
    gps: {
        latitude: Number,
        longitude: Number,
        speed: Number,
        accuracy: Number
    },
    accelerometer: {
        x: Number,
        y: Number,
        z: Number
    },
    gyroscope: {
        x: Number,
        y: Number,
        z: Number
    },
    isResting: {
        type: Boolean,
        default: false
    }
});

const SensorData = mongoose.model('SensorData', sensorReadingSchema);
module.exports = SensorData;
