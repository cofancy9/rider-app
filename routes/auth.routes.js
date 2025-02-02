const express = require('express');
const { auth } = require('../middleware/auth');

// Import Controllers
const {
  register,
  login,
  verifyPhone,
  resendPhoneOTP,
  getProfile,
  updateProfile,
  addEmergencyContact,
  addSensorData,
} = require('../controllers/auth.controller');

const {
  createChallenge,
  listChallenges,
  joinChallenge,
  getChallenges,
} = require('../controllers/challenge.controller');

const {
  createRide,
  listRides,
  startRide,
  updateRideLocation,
  pauseRide,
  resumeRide,
  completeRide,
} = require('../controllers/ride.controller');

const {
  recordSensorData,
  getRideSummary,
} = require('../controllers/sensor.controller');

const router = express.Router();

// Add logging for route initialization
console.log('Initializing Auth Routes...');

// Authentication Routes
router.post('/register', register);
router.post('/login', login);
router.post('/verify-phone', auth, verifyPhone);
router.post('/resend-phone-otp', auth, resendPhoneOTP);
router.get('/profile', auth, getProfile);
router.put('/profile', auth, updateProfile);
router.post('/emergency-contacts', auth, addEmergencyContact);

// Challenge Routes
console.log('Initializing Challenge Routes...');
router.get('/challenges', auth, listChallenges);
router.post('/challenges', auth, createChallenge);
router.post('/challenges/:challengeId/join', auth, joinChallenge);
router.get('/challenges/all', auth, getChallenges);

// Ride Routes
console.log('Initializing Ride Routes...');
router.get('/rides', auth, listRides);
router.post('/rides', auth, createRide);
router.post('/rides/start', auth, startRide);
router.patch('/rides/:rideId/location', auth, updateRideLocation);
router.post('/rides/:rideId/pause', auth, pauseRide);
router.post('/rides/:rideId/resume', auth, resumeRide);
router.post('/rides/:rideId/complete', auth, completeRide);

// Sensor Routes
console.log('Initializing Sensor Routes...');
router.post('/sensor/rides/:rideId/sensor-data', auth, recordSensorData);
router.get('/sensor/rides/:rideId/summary', auth, getRideSummary);
router.post('/sensor/rides/:rideId/data', auth, addSensorData);

module.exports = router;