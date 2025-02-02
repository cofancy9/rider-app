const express = require('express');
const { auth } = require('../middleware/auth');
const { 
    createRide, 
    startRide, 
    listRides,
    updateRideLocation,
    pauseRide,
    resumeRide,
    completeRide
} = require('../controllers/ride.controller');

const router = express.Router();

router.use(auth);

router.get('/', listRides);
router.post('/', createRide);
router.post('/challenges/:challengeId/start', startRide);
router.patch('/:rideId/location', updateRideLocation); // Corrected here
router.post('/:rideId/pause', pauseRide);
router.post('/:rideId/resume', resumeRide);
router.post('/:rideId/complete', completeRide);

module.exports = router;
