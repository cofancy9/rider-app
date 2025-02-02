const logger = require('../utils/logger');
const socketService = require('./socket.service');
const notificationTemplates = require('../utils/notification-templates');

class NotificationService {
  constructor() {
    this.notificationTypes = {
      SAFETY_ALERT: 'safety_alert',
      POINT_UPDATE: 'point_update',
      REST_REMINDER: 'rest_reminder',
      CHALLENGE_UPDATE: 'challenge_update',
      REWARD_NOTIFICATION: 'reward_notification',
      RIDE_UPDATE: 'ride_update',
      ACHIEVEMENT: 'achievement',
      CHALLENGE_AI: 'challenge_ai'
    };
    this.retryAttempts = 3;
    this.retryDelay = 1000;
    this.queue = [];
    this.processing = false;
  }

  async sendToUser(userId, type, data) {
    await this.sendNotification(userId, type, data);
  }

  async sendNotification(userId, type, data, priority = 'normal') {
    const notification = {
      userId,
      type,
      data: {
        ...data,
        timestamp: new Date().toISOString()
      },
      priority,
      attempts: 0
    };

    await this.addToQueue(notification);
  }

  async addToQueue(notification) {
    this.queue.push(notification);
    if (!this.processing) {
      await this.processQueue();
    }
  }

  async processQueue() {
    if (this.queue.length === 0) {
      this.processing = false;
      return;
    }

    this.processing = true;
    const notification = this.queue.shift();

    try {
      await this.sendToSocket(notification);
    } catch (error) {
      if (notification.attempts < this.retryAttempts) {
        notification.attempts++;
        setTimeout(() => {
          this.queue.unshift(notification);
        }, this.retryDelay * Math.pow(2, notification.attempts));
      } else {
        logger.error('Failed to send notification after max retries:', {
          notification,
          error
        });
      }
    }

    await this.processQueue();
  }

  async sendToSocket(notification) {
    try {
      if (socketService && typeof socketService.sendToUser === 'function') {
        await socketService.sendToUser(
          notification.userId,
          notification.type,
          notification.data
        );
      } else {
        // Fallback if socket service is not available
        logger.warn(`Socket service unavailable, notification queued: ${notification.type}`);
      }
    } catch (error) {
      logger.error(`Socket send failed: ${error.message}`);
      // Don't throw error, just log it
    }
  }

  async sendSafetyAlert(userId, alertData) {
    await this.sendNotification(userId, this.notificationTypes.SAFETY_ALERT, {
      type: 'SAFETY_ALERT',
      title: 'Safety Alert',
      message: alertData.message,
      severity: alertData.severity
    }, 'high');
  }

  async sendPointUpdate(userId, pointData) {
    await this.sendNotification(userId, this.notificationTypes.POINT_UPDATE, {
      type: 'POINT_UPDATE',
      title: 'Points Updated',
      points: pointData.points,
      reason: pointData.reason
    });
  }

  async sendRestReminder(userId, restData) {
    await this.sendNotification(userId, this.notificationTypes.REST_REMINDER, {
      type: 'REST_REMINDER',
      title: 'Rest Break Reminder',
      message: restData.message,
      timeElapsed: restData.timeElapsed
    }, 'high');
  }

  async sendChallengeUpdate(userId, challengeData) {
    await this.sendNotification(userId, this.notificationTypes.CHALLENGE_UPDATE, {
      type: 'CHALLENGE_UPDATE',
      title: 'Challenge Update',
      status: challengeData.status,
      message: challengeData.message,
      progress: challengeData.progress,
      timeRemaining: challengeData.timeRemaining
    });
  }

  async sendAiModeUpdate(userId, aiData) {
    await this.sendNotification(userId, this.notificationTypes.CHALLENGE_AI, {
      type: 'CHALLENGE_AI',
      title: 'AI Mode Update',
      status: aiData.status,
      message: aiData.message,
      metrics: aiData.metrics
    });
  }

  async broadcast(type, data) {
    try {
      if (socketService && typeof socketService.broadcast === 'function') {
        await socketService.broadcast(type, {
          ...data,
          timestamp: new Date().toISOString()
        });
      } else {
        logger.warn(`Socket broadcast service unavailable: ${type}`);
      }
    } catch (error) {
      logger.error('Broadcast error:', error);
    }
  }

  async sendAchievement(userId, achievementData) {
    await this.sendNotification(userId, this.notificationTypes.ACHIEVEMENT, {
      type: 'ACHIEVEMENT',
      title: 'New Achievement!',
      achievement: achievementData.name,
      description: achievementData.description
    });
  }

  async sendDataSufficiencyUpdate(userId, data) {
    await this.sendNotification(userId, this.notificationTypes.CHALLENGE_AI, {
      type: 'DATA_SUFFICIENCY',
      title: 'AI Data Status Update',
      status: data.isDataSufficient ? 'Sufficient' : 'Insufficient',
      message: data.message,
      metrics: data.metrics
    });
  }
}

const notificationService = new NotificationService();
module.exports = notificationService;