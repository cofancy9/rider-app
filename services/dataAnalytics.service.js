const AiMetrics = require('../models/aiMetrics.model');
const Challenge = require('../models/challenge.model');
const logger = require('../utils/logger');

class DataAnalyticsService {
  constructor() {
    this.minimumRequiredRecords = 100;
    this.qualityThreshold = 70;
    this.confidenceThreshold = 80;
  }

  async analyzeDataSufficiency(challengeId) {
    try {
      const challenge = await Challenge.findById(challengeId);
      let aiMetrics = await AiMetrics.findOne({ challengeId });

      if (!aiMetrics) {
        aiMetrics = new AiMetrics({ challengeId });
      }

      // Update total records
      aiMetrics.dataSufficiency.totalRecords = challenge.participants.length;

      // Calculate quality score based on data completeness and validity
      const qualityScore = this.calculateDataQuality(challenge);
      aiMetrics.dataSufficiency.qualityScore = qualityScore;

      // Check if data is sufficient
      aiMetrics.dataSufficiency.isDataSufficient = 
        aiMetrics.dataSufficiency.totalRecords >= this.minimumRequiredRecords &&
        qualityScore >= this.qualityThreshold;

      await aiMetrics.save();
      return aiMetrics.dataSufficiency;
    } catch (error) {
      logger.error('Error analyzing data sufficiency:', error);
      throw error;
    }
  }

  calculateDataQuality(challenge) {
    let qualityScore = 100;
    const completedParticipants = challenge.participants.filter(p => p.status === 'completed');

    // Factor 1: Completion rate
    const completionRate = completedParticipants.length / challenge.participants.length;
    if (completionRate < 0.5) qualityScore -= 20;

    // Factor 2: Data consistency
    const hasInconsistentData = challenge.participants.some(p => 
      !p.startTime || !p.completionTime || !p.distanceCovered
    );
    if (hasInconsistentData) qualityScore -= 15;

    // Factor 3: Participant diversity
    const uniqueUsers = new Set(challenge.participants.map(p => p.userId.toString())).size;
    if (uniqueUsers < 10) qualityScore -= 10;

    return Math.max(0, qualityScore);
  }

  async updateAnalytics(challengeId) {
    try {
      const aiMetrics = await AiMetrics.findOne({ challengeId });
      if (!aiMetrics) return;

      // Update analysis timestamps
      aiMetrics.analysis.lastAnalysisDate = new Date();
      aiMetrics.analysis.nextScheduledAnalysis = new Date(
        Date.now() + 24 * 60 * 60 * 1000 // Next analysis in 24 hours
      );

      // Calculate data growth rate
      const previousTotal = aiMetrics.dataSufficiency.totalRecords;
      await this.analyzeDataSufficiency(challengeId);
      const currentTotal = aiMetrics.dataSufficiency.totalRecords;
      aiMetrics.analysis.dataGrowthRate = (currentTotal - previousTotal) / previousTotal;

      await aiMetrics.save();
      return aiMetrics;
    } catch (error) {
      logger.error('Error updating analytics:', error);
      throw error;
    }
  }

  async checkAiReadiness() {
    try {
      const readyChallenges = await AiMetrics.getReadyForAiDecisions();
      return {
        totalReady: readyChallenges.length,
        challenges: readyChallenges.map(c => ({
          challengeId: c.challengeId,
          qualityScore: c.dataSufficiency.qualityScore,
          confidenceScore: c.predictions.confidenceScore
        }))
      };
    } catch (error) {
      logger.error('Error checking AI readiness:', error);
      throw error;
    }
  }
}

module.exports = new DataAnalyticsService();