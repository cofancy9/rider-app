const RidePattern = require('../models/ridePattern.model');
const Ride = require('../models/ride.model');
const notificationService = require('../services/notification.service');
const logger = require('../utils/logger');

// Constants for point deductions
const POINTS = {
   SUDDEN_BRAKE: -10,
   PHONE_USAGE: -15,
   MISSED_BREAK: -20,
   CONSECUTIVE_BRAKES: -15
};

const detectSuddenBrake = async (req, res) => {
   try {
       const { rideId } = req.params;
       const { deceleration, timestamp } = req.body;
       const userId = req.user.id;

       let ridePattern = await RidePattern.findOne({ rideId, userId });
       
       // Create new ride pattern if doesn't exist
       if (!ridePattern) {
           ridePattern = new RidePattern({
               rideId,
               userId
           });
       }

       // Check for sudden brake
       const severity = deceleration > 7 ? 'sudden' : 'normal';
       const pointsDeducted = severity === 'sudden' ? POINTS.SUDDEN_BRAKE : 0;

       // Add brake pattern
       ridePattern.brakePatterns.push({
           timestamp: new Date(timestamp),
           severity,
           deceleration,
           pointsDeducted
       });

       // Send notification for sudden brake
       if (severity === 'sudden') {
           await notificationService.sendSafetyAlert(userId, {
               message: 'Sudden braking detected! Please brake gradually.',
               severity: 'warning',
               deceleration: deceleration,
               pointsDeducted: pointsDeducted
           });
       }

       // Check for consecutive sudden brakes
       const recentBrakes = ridePattern.brakePatterns.filter(brake => 
           brake.severity === 'sudden' &&
           new Date(timestamp) - new Date(brake.timestamp) <= 5 * 60 * 1000 // within 5 minutes
       );

       if (recentBrakes.length >= 2) {
           const consecutivePoints = POINTS.CONSECUTIVE_BRAKES;
           ridePattern.pointsDeducted += consecutivePoints;
           ridePattern.safetyScore = Math.max(0, ridePattern.safetyScore + consecutivePoints);

           // Send notification for consecutive brakes
           await notificationService.sendSafetyAlert(userId, {
               message: 'Multiple sudden brakes detected! Please maintain safer braking habits.',
               severity: 'high',
               consecutiveBrakes: recentBrakes.length,
               pointsDeducted: consecutivePoints
           });
       }

       // Update metrics
       ridePattern.rideMetrics.suddenBrakes = 
           ridePattern.brakePatterns.filter(b => b.severity === 'sudden').length;

       await ridePattern.save();

       // Send safety score update if significant change
       if (pointsDeducted !== 0) {
           await notificationService.sendPointUpdate(userId, {
               points: pointsDeducted,
               reason: 'Braking violation',
               safetyScore: ridePattern.safetyScore
           });
       }

       res.status(200).json({
           status: 'success',
           data: {
               ridePattern,
               safetyScore: ridePattern.safetyScore,
               isConsecutive: recentBrakes.length >= 2
           }
       });

   } catch (error) {
       logger.error('Brake detection error:', error);
       res.status(500).json({
           status: 'error',
           message: error.message || 'Error processing brake pattern'
       });
   }
};

const recordRestBreak = async (req, res) => {
   try {
       const { rideId } = req.params;
       const { startTime, type } = req.body;
       const userId = req.user.id;

       let ridePattern = await RidePattern.findOne({ rideId, userId });
       
       if (!ridePattern) {
           ridePattern = new RidePattern({
               rideId,
               userId
           });
       }

       // Add rest break
       ridePattern.restBreaks.push({
           startTime: new Date(startTime),
           type,
           isCompleted: false
       });

       await ridePattern.save();

       // Send rest break start notification
       await notificationService.sendRestReminder(userId, {
           message: `${type} break started. Take time to rest and refresh.`,
           type: type,
           startTime: startTime
       });

       res.status(200).json({
           status: 'success',
           data: {
               ridePattern,
               currentBreak: ridePattern.restBreaks[ridePattern.restBreaks.length - 1]
           }
       });

   } catch (error) {
       logger.error('Rest break recording error:', error);
       res.status(500).json({
           status: 'error',
           message: error.message || 'Error recording rest break'
       });
   }
};

const completeRestBreak = async (req, res) => {
   try {
       const { rideId, breakId } = req.params;
       const userId = req.user.id;

       const ridePattern = await RidePattern.findOne({ rideId, userId });
       
       if (!ridePattern) {
           return res.status(404).json({
               status: 'error',
               message: 'Ride pattern not found'
           });
       }

       const restBreak = ridePattern.restBreaks.id(breakId);
       if (!restBreak) {
           return res.status(404).json({
               status: 'error',
               message: 'Rest break not found'
           });
       }

       // Complete the break
       restBreak.endTime = new Date();
       restBreak.duration = (restBreak.endTime - new Date(restBreak.startTime)) / (1000 * 60); // in minutes
       restBreak.isCompleted = true;

       // Update total rest time
       ridePattern.rideMetrics.totalRestTime = ridePattern.restBreaks.reduce(
           (total, break_) => total + (break_.duration || 0), 0
       );

       await ridePattern.save();

       // Send break completion notification
       await notificationService.sendToUser(userId, 'REST_BREAK_COMPLETED', {
           type: restBreak.type,
           duration: restBreak.duration,
           totalRestTime: ridePattern.rideMetrics.totalRestTime
       });

       // Send bonus points notification if break duration is optimal
       if (restBreak.duration >= 15 && restBreak.duration <= 30) {
           const bonusPoints = 5;
           await notificationService.sendPointUpdate(userId, {
               points: bonusPoints,
               reason: 'Optimal rest break duration',
               message: 'Bonus points earned for taking a proper rest break!'
           });
       }

       res.status(200).json({
           status: 'success',
           data: {
               ridePattern,
               completedBreak: restBreak
           }
       });

   } catch (error) {
       logger.error('Rest break completion error:', error);
       res.status(500).json({
           status: 'error',
           message: error.message || 'Error completing rest break'
       });
   }
};

module.exports = {
   detectSuddenBrake,
   recordRestBreak,
   completeRestBreak
};
