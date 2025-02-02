const SensorData = require('../models/sensorData.model');
const Ride = require('../models/ride.model');
const SensorProcessor = require('../utils/sensorProcessor');
const PointsProcessor = require('../utils/pointsProcessor');
const RestMonitor = require('../utils/restMonitor');
const PatternAnalyzer = require('../utils/patternAnalyzer');
const notificationService = require('../services/notification.service');
const logger = require('../utils/logger');
const mongoose = require('mongoose');

const recordSensorData = async (req, res) => {
  const startTime = process.hrtime();
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { rideId } = req.params;
    const userId = req.user.id;
    const { gps, accelerometer, gyroscope } = req.body;

    const ride = await Ride.findById(rideId).session(session);
    if (!ride || ride.userId.toString() !== userId || ride.status !== 'started') {
      return res.status(404).json({
        status: 'error',
        message: 'Active ride not found'
      });
    }

    // Process sensor data
    const processedData = SensorProcessor.processSensorData({
      gps, accelerometer, gyroscope
    });

    // Send real-time safety alerts if violations detected
    if (processedData.violations && processedData.violations.length > 0) {
      await notificationService.sendSafetyAlert(userId, {
        message: `Safety violations detected: ${processedData.violations.join(', ')}`,
        severity: processedData.violations.length > 1 ? 'high' : 'warning'
      });
    }

    // Calculate points
    const points = PointsProcessor.calculatePoints(processedData);

    // Send point updates if there are deductions
    if (points.deductions !== 0) {
      await notificationService.sendPointUpdate(userId, {
        points: points.deductions,
        reason: 'Safety violation penalties'
      });
    }

    // Check rest needed
    const restStatus = RestMonitor.checkRestNeeded(
      ride.startTime,
      ride.lastRestTime
    );

    // Send rest reminder if needed
    if (restStatus.needsRest) {
      await notificationService.sendRestReminder(userId, {
        message: 'Time for a rest break',
        timeElapsed: restStatus.timeSinceLastRest
      });
    }

    // Get recent readings for pattern analysis
    const recentReadings = await SensorData.find({ rideId })
      .sort({ timestamp: -1 })
      .limit(60)
      .lean();

    const patterns = PatternAnalyzer.analyzePatterns([
      { gps, accelerometer, gyroscope, processed: processedData },
      ...recentReadings
    ]);

    const sensorData = new SensorData({
      rideId,
      userId,
      gps,
      accelerometer,
      gyroscope,
      processed: processedData,
      points,
      patterns
    });

    await sensorData.save({ session });

    // Update ride points
    ride.points = {
      earned: (ride.points?.earned || 0) + points.earned,
      deducted: (ride.points?.deducted || 0) + Math.abs(points.deductions),
      total: (ride.points?.total || 0) + points.total
    };

    if (processedData.isResting) {
      ride.lastRestTime = new Date();
    }

    await ride.save({ session });
    await session.commitTransaction();

    // Send significant pattern updates
    if (patterns.speedPattern.consistency === 'POOR' || 
        patterns.brakePattern.rating === 'POOR') {
      await notificationService.sendSafetyAlert(userId, {
        message: 'Riding pattern needs improvement',
        severity: 'warning'
      });
    }

    const endTime = process.hrtime(startTime);
    logger.info(`Sensor data recording completed in ${endTime[0]}s ${endTime[1]/1000000}ms`);

    res.status(200).json({
      status: 'success',
      data: {
        sensorData,
        analysis: processedData,
        points,
        ridePoints: ride.points,
        patterns,
        restStatus
      }
    });
  } catch (error) {
    await session.abortTransaction();
    logger.error('Sensor data recording error:', error);
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  } finally {
    session.endSession();
  }
};

const getRideSummary = async (req, res) => {
  const startTime = process.hrtime();
  try {
    const { rideId } = req.params;
    const userId = req.user.id;

    const ride = await Ride.findById(rideId).populate('sensorData').lean();

    if (!ride) {
      return res.status(404).json({
        status: 'error',
        message: 'Ride not found'
      });
    }

    if (ride.userId.toString() !== userId) {
      return res.status(403).json({
        status: 'error',
        message: 'Not authorized to access this ride'
      });
    }

    const readings = await SensorData.find({ rideId, userId }).lean();
    
    // Get rest periods
    const restPeriods = readings
      .filter(r => r.processed && r.processed.isResting)
      .map(r => ({
        timestamp: r.timestamp,
        duration: r.processed.restDuration || 0
      }));

    // Get patterns
    const patterns = PatternAnalyzer.analyzePatterns(readings);

    // Calculate violations
    const violations = readings.reduce((acc, r) => {
      if (r.processed && r.processed.violations) {
        r.processed.violations.forEach(v => {
          acc[v] = (acc[v] || 0) + 1;
        });
      }
      return acc;
    }, {});

    // Calculate safety score
    const safetyScore = calculateSafetyScore(violations, patterns);

    // Send ride summary notification
    await notificationService.sendToUser(userId, 'RIDE_SUMMARY', {
      duration: new Date() - ride.startTime,
      totalPoints: ride.points.total,
      violations: Object.keys(violations).length,
      safetyScore: patterns.brakePattern.rating
    });

    const endTime = process.hrtime(startTime);
    logger.info(`Ride summary generation completed in ${endTime[0]}s ${endTime[1]/1000000}ms`);

    res.status(200).json({
      status: 'success',
      data: {
        summary: {
          duration: new Date() - ride.startTime,
          points: ride.points,
          restPeriods,
          patterns,
          violations,
          safetyScore,
          totalReadings: readings.length,
          averageSpeed: calculateAverageSpeed(readings),
          totalDistance: calculateTotalDistance(readings)
        }
      }
    });
  } catch (error) {
    logger.error('Summary generation error:', error);
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

// Helper functions
const calculateSafetyScore = (violations, patterns) => {
  let baseScore = 100;
  
  // Deduct for violations
  Object.entries(violations).forEach(([type, count]) => {
    switch(type) {
      case 'SUDDEN_BRAKE':
        baseScore -= count * 5;
        break;
      case 'SPEED_VIOLATION':
        baseScore -= count * 8;
        break;
      case 'SHARP_TURN':
        baseScore -= count * 3;
        break;
    }
  });

  // Adjust for patterns
  if (patterns.brakePattern.rating === 'POOR') baseScore -= 15;
  if (patterns.speedPattern.consistency === 'POOR') baseScore -= 10;

  return Math.max(0, Math.min(100, baseScore));
};

const calculateAverageSpeed = (readings) => {
  const speeds = readings
    .filter(r => r.gps && r.gps.speed)
    .map(r => r.gps.speed);
  return speeds.length ? 
    speeds.reduce((sum, speed) => sum + speed, 0) / speeds.length : 0;
};

const calculateTotalDistance = (readings) => {
  return readings.reduce((total, reading) => 
    total + (reading.processed?.distanceCovered || 0), 0);
};

module.exports = {
  recordSensorData,
  getRideSummary
};