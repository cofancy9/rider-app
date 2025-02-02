const mongoose = require('mongoose');
const Challenge = require('../models/challenge.model');
const AiMetrics = require('../models/aiMetrics.model');
const notificationService = require('../services/notification.service');
const dataAnalyticsService = require('../services/dataAnalytics.service');
const logger = require('../utils/logger');
const { validationResult } = require('express-validator');

const createChallenge = async (req, res) => {
  const startTime = process.hrtime();
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        status: 'error',
        errors: errors.array()
      });
    }

    const {
      name,
      type,
      minDistance,
      maxDistance,
      timeLimit,
      entryFee,
      reward,
      minParticipants,
      maxParticipants,
      rules,
      status,
      isAutoReward
    } = req.body;

    const challenge = new Challenge({
      name,
      type,
      minDistance,
      maxDistance,
      timeLimit,
      entryFee,
      reward: isAutoReward ? entryFee * 0.2 : reward,
      isAutoReward,
      minParticipants,
      maxParticipants,
      rules,
      status: status || 'draft',
      creationType: 'manual'
    });

    await challenge.save({ session });

    const aiMetrics = new AiMetrics({
      challengeId: challenge._id,
      dataSufficiency: {
        totalRecords: 0,
        qualityScore: 0,
        isDataSufficient: false
      }
    });

    await aiMetrics.save({ session });
    await session.commitTransaction();

    try {
      await notificationService.broadcast('NEW_CHALLENGE', {
        challengeId: challenge._id,
        name: challenge.name,
        type: challenge.type,
        reward: challenge.reward,
        minDistance,
        maxDistance,
        timeLimit
      });
    } catch (notificationError) {
      logger.warn('Notification failed during challenge creation:', notificationError);
    }

    const endTime = process.hrtime(startTime);
    logger.info(`Challenge creation completed in ${endTime[0]}s ${endTime[1]/1000000}ms`);

    res.status(201).json({
      status: 'success',
      data: { challenge }
    });
  } catch (error) {
    await session.abortTransaction();
    logger.error('Challenge creation error:', {
      error,
      user: req.user,
      payload: req.body
    });
    res.status(500).json({
      status: 'error',
      message: error.message || 'Error creating challenge'
    });
  } finally {
    session.endSession();
  }
};

const listChallenges = async (req, res) => {
  const startTime = process.hrtime();
  try {
    const { page = 1, limit = 10 } = req.query;

    const challenges = await Challenge.find({
      status: 'active'
    })
      .skip((page - 1) * limit)
      .limit(Number(limit))
      .lean();

    const endingSoonChallenges = challenges.filter((challenge) => {
      const timeLeft = challenge.timeLimit - (new Date() - challenge.createdAt) / (1000 * 60);
      return timeLeft <= 120;
    });

    for (const challenge of endingSoonChallenges) {
      for (const participant of challenge.participants) {
        try {
          await notificationService.sendToUser(participant.userId, 'CHALLENGE_ENDING_SOON', {
            challengeId: challenge._id,
            name: challenge.name,
            timeLeft: challenge.timeLimit
          });
        } catch (notificationError) {
          logger.warn('Notification failed during ending soon reminder:', notificationError);
        }
      }
    }

    const endTime = process.hrtime(startTime);
    logger.info(`Challenge listing completed in ${endTime[0]}s ${endTime[1]/1000000}ms`);

    res.status(200).json({
      status: 'success',
      data: { challenges }
    });
  } catch (error) {
    logger.error('Challenge list error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Error retrieving challenges'
    });
  }
};

const joinChallenge = async (req, res) => {
  const startTime = process.hrtime();
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { challengeId } = req.params;
    const userId = req.user.id;

    const challenge = await Challenge.findById(challengeId).session(session);
    if (!challenge) {
      return res.status(404).json({
        status: 'error',
        message: 'Challenge not found'
      });
    }

    if (challenge.status !== 'active') {
      return res.status(400).json({
        status: 'error',
        message: 'Challenge is not active'
      });
    }

    if (challenge.maxParticipants && 
        challenge.participants.length >= challenge.maxParticipants) {
      return res.status(400).json({
        status: 'error',
        message: 'Challenge has reached maximum participants limit'
      });
    }

    if (challenge.participants.some(p => p.userId.equals(userId))) {
      return res.status(400).json({
        status: 'error',
        message: 'You have already joined this challenge'
      });
    }

    challenge.participants.push({
      userId,
      status: 'joined',
      joinedAt: new Date()
    });
    
    await challenge.save({ session });
    await session.commitTransaction();

    try {
      await notificationService.sendToUser(userId, 'CHALLENGE_JOINED', {
        challengeId: challenge._id,
        name: challenge.name,
        reward: challenge.reward,
        minDistance: challenge.minDistance,
        maxDistance: challenge.maxDistance,
        timeLimit: challenge.timeLimit
      });

      if (challenge.participants.length === challenge.minParticipants) {
        const notifyPromises = challenge.participants.map(p =>
          notificationService.sendToUser(p.userId, 'CHALLENGE_STARTING', {
            challengeId: challenge._id,
            name: challenge.name,
            timeLimit: challenge.timeLimit
          })
        );
        await Promise.all(notifyPromises);
      }
    } catch (notificationError) {
      logger.warn('Join notification failed:', notificationError);
    }

    const endTime = process.hrtime(startTime);
    logger.info(`Challenge join completed in ${endTime[0]}s ${endTime[1]/1000000}ms`);

    res.status(200).json({
      status: 'success',
      data: {
        message: 'Successfully joined challenge',
        challenge
      }
    });
  } catch (error) {
    await session.abortTransaction();
    logger.error('Challenge join error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Error joining challenge'
    });
  } finally {
    session.endSession();
  }
};

const updateChallengeProgress = async (req, res) => {
  const startTime = process.hrtime();
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { challengeId } = req.params;
    const userId = req.user.id;
    const { distance, timeSpent } = req.body;

    const challenge = await Challenge.findById(challengeId).session(session);
    if (!challenge) {
      return res.status(404).json({
        status: 'error',
        message: 'Challenge not found'
      });
    }

    const participant = challenge.participants.find(p => p.userId.equals(userId));
    if (!participant) {
      return res.status(404).json({
        status: 'error',
        message: 'Not a participant in this challenge'
      });
    }

    const progress = (distance / challenge.maxDistance) * 100;
    participant.distanceCovered = distance;
    participant.timeSpent = timeSpent;

    if (challenge.isCompletable(distance, timeSpent)) {
      participant.status = 'completed';
      challenge.statistics.completedParticipants += 1;
      challenge.statistics.totalRewardsDistributed += challenge.reward;
    }

    await challenge.save({ session });
    await dataAnalyticsService.updateAnalytics(challengeId);
    await session.commitTransaction();

    try {
      if (progress >= 25 && progress < 50) {
        await notificationService.sendToUser(userId, 'CHALLENGE_PROGRESS', {
          challengeId: challenge._id,
          progress: 25,
          message: "You've completed 25% of the challenge!"
        });
      } else if (progress >= 50 && progress < 75) {
        await notificationService.sendToUser(userId, 'CHALLENGE_PROGRESS', {
          challengeId: challenge._id,
          progress: 50,
          message: 'Halfway there! Keep going!'
        });
      } else if (progress >= 75 && progress < 100) {
        await notificationService.sendToUser(userId, 'CHALLENGE_PROGRESS', {
          challengeId: challenge._id,
          progress: 75,
          message: 'Almost there! Just a little more!'
        });
      } else if (progress >= 100) {
        await notificationService.sendToUser(userId, 'CHALLENGE_COMPLETED', {
          challengeId: challenge._id,
          reward: challenge.reward,
          completionTime: new Date()
        });
      }
    } catch (notificationError) {
      logger.warn('Progress notification failed:', notificationError);
    }

    const endTime = process.hrtime(startTime);
    logger.info(`Challenge progress update completed in ${endTime[0]}s ${endTime[1]/1000000}ms`);

    res.status(200).json({
      status: 'success',
      data: { 
        progress,
        challenge
      }
    });
  } catch (error) {
    await session.abortTransaction();
    logger.error('Challenge progress update error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Error updating challenge progress'
    });
  } finally {
    session.endSession();
  }
};

const getChallenge = async (req, res) => {
  const startTime = process.hrtime();
  try {
    const { challengeId } = req.params;
    const challenge = await Challenge.findById(challengeId).lean();
    
    if (!challenge) {
      return res.status(404).json({
        status: 'error',
        message: 'Challenge not found'
      });
    }

    const endTime = process.hrtime(startTime);
    logger.info(`Challenge retrieval completed in ${endTime[0]}s ${endTime[1]/1000000}ms`);

    res.status(200).json({
      status: 'success',
      data: { challenge }
    });
  } catch (error) {
    logger.error('Get challenge error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Error retrieving challenge'
    });
  }
};

const getAnalytics = async (req, res) => {
  const startTime = process.hrtime();
  try {
    const challenges = await Challenge.find().lean();
    const analyticsData = {
      totalChallenges: challenges.length,
      participationStats: {
        total: 0,
        completed: 0,
        ongoing: 0
      },
      categoryDistribution: {},
      rewardStats: {
        totalDistributed: 0,
        averagePerChallenge: 0
      }
    };

    challenges.forEach(challenge => {
      const total = challenge.participants.length;
      const completed = challenge.participants.filter(p => p.status === 'completed').length;
      
      analyticsData.participationStats.total += total;
      analyticsData.participationStats.completed += completed;
      analyticsData.participationStats.ongoing += (total - completed);

      analyticsData.categoryDistribution[challenge.type] = 
        (analyticsData.categoryDistribution[challenge.type] || 0) + 1;

      analyticsData.rewardStats.totalDistributed += 
        challenge.statistics.totalRewardsDistributed || 0;
    });

    analyticsData.rewardStats.averagePerChallenge = 
      analyticsData.rewardStats.totalDistributed / challenges.length || 0;

    const endTime = process.hrtime(startTime);
    logger.info(`Analytics generation completed in ${endTime[0]}s ${endTime[1]/1000000}ms`);

    res.status(200).json({
      status: 'success',
      data: analyticsData
    });
  } catch (error) {
    logger.error('Analytics fetch error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Error retrieving analytics'
    });
  }
};

const checkDataSufficiency = async (req, res) => {
  const startTime = process.hrtime();
  try {
    const status = await dataAnalyticsService.checkAiReadiness();

    const endTime = process.hrtime(startTime);
    logger.info(`Data sufficiency check completed in ${endTime[0]}s ${endTime[1]/1000000}ms`);

    res.status(200).json({
      status: 'success',
      data: status
    });
  } catch (error) {
    logger.error('Data sufficiency check error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Error checking data sufficiency'
    });
  }
};

const toggleAiMode = async (req, res) => {
  const startTime = process.hrtime();
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { challengeId } = req.params;
    const { enableAi } = req.body;

    const challenge = await Challenge.findById(challengeId).session(session);
    if (!challenge) {
      return res.status(404).json({
        status: 'error',
        message: 'Challenge not found'
      });
    }

    if (enableAi) {
      const aiMetrics = await AiMetrics.findOne({ challengeId });
      if (!aiMetrics?.dataSufficiency.isDataSufficient) {
        return res.status(400).json({
          status: 'error',
          message: 'Insufficient data for AI mode'
        });
      }
    }

    challenge.creationType = enableAi ? 'ai' : 'manual';
    await challenge.save({ session });
    await session.commitTransaction();

    const endTime = process.hrtime(startTime);
    logger.info(`AI mode toggle completed in ${endTime[0]}s ${endTime[1]/1000000}ms`);

    res.status(200).json({
      status: 'success',
      data: {
        message: `AI mode ${enableAi ? 'enabled' : 'disabled'}`,
        challenge
      }
    });
  } catch (error) {
    await session.abortTransaction();
    logger.error('AI mode toggle error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Error toggling AI mode'
    });
  } finally {
    session.endSession();
  }
};
const listCompletedChallenges = async (req, res) => {
  const startTime = process.hrtime();
  try {
    const challenges = await Challenge.find({
      status: 'completed'
    }).lean();

    const endTime = process.hrtime(startTime);
    logger.info(`Completed challenges listing completed in ${endTime[0]}s ${endTime[1]/1000000}ms`);

    res.status(200).json({
      status: 'success',
      data: { challenges }
    });
  } catch (error) {
    logger.error('List completed challenges error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Error retrieving completed challenges'
    });
  }
};

const updateChallenge = async (req, res) => {
  const startTime = process.hrtime();
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { challengeId } = req.params;
    const updates = req.body;

    const challenge = await Challenge.findByIdAndUpdate(
      challengeId,
      updates,
      { new: true, runValidators: true, session }
    );

    if (!challenge) {
      return res.status(404).json({
        status: 'error',
        message: 'Challenge not found'
      });
    }

    await session.commitTransaction();

    const endTime = process.hrtime(startTime);
    logger.info(`Challenge update completed in ${endTime[0]}s ${endTime[1]/1000000}ms`);

    res.status(200).json({
      status: 'success',
      data: { challenge }
    });
  } catch (error) {
    await session.abortTransaction();
    logger.error('Update challenge error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Error updating challenge'
    });
  } finally {
    session.endSession();
  }
};

const getAiMetrics = async (req, res) => {
  const startTime = process.hrtime();
  try {
    const metrics = await AiMetrics.find().populate('challengeId').lean();

    const endTime = process.hrtime(startTime);
    logger.info(`AI metrics retrieval completed in ${endTime[0]}s ${endTime[1]/1000000}ms`);

    res.status(200).json({
      status: 'success',
      data: { metrics }
    });
  } catch (error) {
    logger.error('Error fetching AI metrics:', error);
    res.status(500).json({
      status: 'error',
      message: 'Error retrieving AI metrics'
    });
  }
};


const getChallenges = async (req, res) => {
  const startTime = process.hrtime();
  try {
    const challenges = await Challenge.find().lean();
    
    const endTime = process.hrtime(startTime);
    logger.info(`Challenges fetching completed in ${endTime[0]}s ${endTime[1]/1000000}ms`);

    res.status(200).json({
      status: 'success',
      data: { challenges }
    });
  } catch (error) {
    logger.error('Error fetching challenges:', error);
    res.status(500).json({
      status: 'error',
      message: 'Error fetching challenges'
    });
  }
};

module.exports = {
  createChallenge,
  listChallenges,
  joinChallenge,
  updateChallengeProgress,
  getChallenge,
  listCompletedChallenges,
  updateChallenge,
  getChallenges,    // Add this line to exports
  getAiMetrics,
  getAnalytics,
  checkDataSufficiency,
  toggleAiMode
};
