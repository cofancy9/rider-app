const express = require('express');
const { auth } = require('../middleware/auth');
const {
    detectSuddenBrake,
    recordRestBreak,
    completeRestBreak
} = require('../controllers/ridePattern.controller');

const router = express.Router();

router.use(auth);

router.post('/rides/:rideId/brake', detectSuddenBrake);
router.post('/rides/:rideId/break', recordRestBreak);
router.post('/rides/:rideId/break/:breakId/complete', completeRestBreak);

module.exports = router;
