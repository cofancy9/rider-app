const Ride = require('../models/ride.model');
const notificationService = require('../services/notification.service');
const logger = require('../utils/logger');
const Challenge = require('../models/challenge.model');

// Create a new ride
const createRide = async (req, res) => {
    try {
        const { userId, challengeId, startLocation, endLocation, distance, mode } = req.body;

        if (!userId || !challengeId || !startLocation || !endLocation || !distance || !mode) {
            return res.status(400).json({
                status: 'error',
                message: 'All fields (userId, challengeId, startLocation, endLocation, distance, mode) are required',
            });
        }

        const ride = new Ride({
            userId,
            challengeId,
            startLocation,
            endLocation,
            distance,
            mode,
            status: 'pending',
        });

        const savedRide = await ride.save();

        // Send ride creation notification
        if (notificationService.sendToUser) {
            await notificationService.sendToUser(userId, 'RIDE_CREATED', {
                rideId: savedRide._id,
                challengeId: savedRide.challengeId,
            });
        } else {
            logger.warn('Notification service not available for sending RIDE_CREATED');
        }

        res.status(201).json({
            status: 'success',
            data: savedRide,
        });
    } catch (error) {
        logger.error('Create ride error:', error);
        res.status(500).json({
            status: 'error',
            message: 'Error creating ride',
        });
    }
};

// List all rides for a user
const listRides = async (req, res) => {
    try {
        const rides = await Ride.find({ userId: req.user.id }).sort({ createdAt: -1 });
        res.status(200).json({
            status: 'success',
            data: rides,
        });
    } catch (error) {
        logger.error('List rides error:', error);
        res.status(500).json({
            status: 'error',
            message: 'Error fetching rides',
        });
    }
};

// Start a ride
const startRide = async (req, res) => {
    try {
        const { challengeId } = req.params;
        const userId = req.user.id;

        // Validate challenge first
        const challenge = await Challenge.findById(challengeId);
        if (!challenge) {
            return res.status(404).json({
                status: 'error',
                message: 'Challenge not found'
            });
        }

        // Check challenge status
        if (challenge.status !== 'active') {
            return res.status(400).json({
                status: 'error',
                message: 'Challenge is not active'
            });
        }

        // Check if challenge has expired
        if (new Date() > new Date(challenge.endDate)) {
            return res.status(400).json({
                status: 'error',
                message: 'Challenge has expired'
            });
        }

        const ride = new Ride({
            challengeId,
            userId,
            startLocation: {
                type: 'Point',
                coordinates: [req.body.startLocation.longitude, req.body.startLocation.latitude]
            },
            status: 'started',
            startTime: new Date()
        });

        const savedRide = await ride.save();

        res.status(201).json({
            status: 'success',
            data: savedRide
        });
    } catch (error) {
        logger.error('Start ride error:', error);
        res.status(500).json({
            status: 'error',
            message: 'Error starting ride'
        });
    }
};

// Update ride location
const updateRideLocation = async (req, res) => {
    try {
        const { rideId } = req.params;
        const { latitude, longitude } = req.body;

        if (!latitude || !longitude) {
            return res.status(400).json({
                status: 'error',
                message: 'Latitude and longitude are required',
            });
        }

        const ride = await Ride.findByIdAndUpdate(
            rideId,
            {
                $push: { route: { latitude, longitude, timestamp: new Date() } },
                currentLocation: { type: 'Point', coordinates: [longitude, latitude] },
            },
            { new: true }
        );

        if (!ride) {
            return res.status(404).json({
                status: 'error',
                message: 'Ride not found',
            });
        }

        if (notificationService.sendToUser) {
            await notificationService.sendToUser(req.user.id, 'LOCATION_UPDATE', {
                rideId: ride._id,
                currentLocation: { latitude, longitude },
            });
        }

        res.status(200).json({
            status: 'success',
            data: ride,
        });
    } catch (error) {
        logger.error('Update ride location error:', error);
        res.status(500).json({
            status: 'error',
            message: 'Error updating ride location',
        });
    }
};

// Pause a ride
const pauseRide = async (req, res) => {
    try {
        const { rideId } = req.params;

        const ride = await Ride.findByIdAndUpdate(
            rideId,
            { status: 'paused', pauseTime: new Date() },
            { new: true }
        );

        if (!ride) {
            return res.status(404).json({
                status: 'error',
                message: 'Ride not found',
            });
        }

        if (notificationService.sendToUser) {
            await notificationService.sendToUser(req.user.id, 'RIDE_PAUSED', {
                rideId: ride._id,
                pauseTime: ride.pauseTime,
            });
        }

        res.status(200).json({
            status: 'success',
            data: ride,
        });
    } catch (error) {
        logger.error('Pause ride error:', error);
        res.status(500).json({
            status: 'error',
            message: 'Error pausing ride',
        });
    }
};

// Resume a ride
const resumeRide = async (req, res) => {
    try {
        const { rideId } = req.params;

        const ride = await Ride.findByIdAndUpdate(
            rideId,
            { status: 'started', resumeTime: new Date() },
            { new: true }
        );

        if (!ride) {
            return res.status(404).json({
                status: 'error',
                message: 'Ride not found',
            });
        }

        if (notificationService.sendToUser) {
            await notificationService.sendToUser(req.user.id, 'RIDE_RESUMED', {
                rideId: ride._id,
                resumeTime: ride.resumeTime,
            });
        }

        res.status(200).json({
            status: 'success',
            data: ride,
        });
    } catch (error) {
        logger.error('Resume ride error:', error);
        res.status(500).json({
            status: 'error',
            message: 'Error resuming ride',
        });
    }
};

// Complete a ride
const completeRide = async (req, res) => {
    try {
        const { rideId } = req.params;
        const { endLocation, distance } = req.body;
        const userId = req.user.id;

        const ride = await Ride.findById(rideId);
        if (!ride) {
            return res.status(404).json({
                status: 'error',
                message: 'Ride not found'
            });
        }

        // Check challenge status
        const challenge = await Challenge.findById(ride.challengeId);
        if (!challenge || challenge.status !== 'active') {
            return res.status(400).json({
                status: 'error',
                message: 'Associated challenge is not active'
            });
        }

        // Update ride
        ride.status = 'completed';
        ride.endLocation = {
            type: 'Point',
            coordinates: [endLocation.longitude, endLocation.latitude]
        };
        ride.distance = distance;
        ride.endTime = new Date();

        // Calculate stats
        const duration = ride.endTime - ride.startTime;
        ride.averageSpeed = distance / (duration / 3600000); // km/h

        await ride.save();

        // Update challenge progress
        const progress = (distance / challenge.distance) * 100;
        
        try {
            await Challenge.findByIdAndUpdate(
                challenge._id,
                { 
                    $inc: { 
                        [`participantProgress.${userId}`]: distance
                    }
                },
                { new: true }
            );
        } catch (progressError) {
            logger.error('Error updating challenge progress:', progressError);
        }

        res.status(200).json({
            status: 'success',
            data: ride
        });
    } catch (error) {
        logger.error('Complete ride error:', error);
        res.status(500).json({
            status: 'error',
            message: 'Error completing ride'
        });
    }
};

module.exports = {
    createRide,
    listRides,
    startRide,
    updateRideLocation,
    pauseRide,
    resumeRide,
    completeRide,
};
