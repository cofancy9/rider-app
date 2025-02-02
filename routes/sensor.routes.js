
const express = require('express');
const { auth } = require('../middleware/auth');
const {
    recordSensorData,
    getRideSummary
} = require('../controllers/sensor.controller');

const router = express.Router();
router.use(auth);

// Record sensor data
router.post('/rides/:rideId/sensor-data', recordSensorData);

// Get ride summary
router.get('/rides/:rideId/summary', getRideSummary);

module.exports = router;
