const mongoose = require('mongoose');

const aiMetricsSchema = new mongoose.Schema({
  challengeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Challenge',
    required: true
  },
  dataSufficiency: {
    totalRecords: { type: Number, default: 0 },
    qualityScore: { type: Number, min: 0, max: 100 },
    isDataSufficient: { type: Boolean, default: false }
  },
  predictions: {
    recommendedEntryFee: Number,
    recommendedTimeLimit: Number,
    expectedParticipation: Number,
    confidenceScore: { type: Number, min: 0, max: 100 }
  },
  patterns: {
    participationTrend: {
      trend: String,
      confidence: Number,
      lastUpdated: Date
    },
    completionRate: {
      rate: Number,
      trend: String,
      lastUpdated: Date
    },
    revenuePattern: {
      pattern: String,
      confidence: Number,
      lastUpdated: Date
    }
  },
  analysis: {
    lastAnalysisDate: Date,
    nextScheduledAnalysis: Date,
    analysisFrequency: String,
    dataGrowthRate: Number
  },
  decisionMetrics: {
    decisionsMade: Number,
    successfulDecisions: Number,
    accuracyRate: Number,
    lastDecisionDate: Date
  }
}, {
  timestamps: true
});

// Method to check if data is sufficient for AI decisions
aiMetricsSchema.methods.isReadyForAiDecisions = function() {
  return this.dataSufficiency.isDataSufficient && 
         this.dataSufficiency.qualityScore >= 70 &&
         this.predictions.confidenceScore >= 80;
};

// Method to update data sufficiency
aiMetricsSchema.methods.updateDataSufficiency = function() {
  const minimumRequiredRecords = 100; // Adjust based on your needs
  const isEnoughData = this.dataSufficiency.totalRecords >= minimumRequiredRecords;
  const isQualityGood = this.dataSufficiency.qualityScore >= 70;
  
  this.dataSufficiency.isDataSufficient = isEnoughData && isQualityGood;
  return this.save();
};

// Static method to get challenges ready for AI decisions
aiMetricsSchema.statics.getReadyForAiDecisions = function() {
  return this.find({
    'dataSufficiency.isDataSufficient': true,
    'dataSufficiency.qualityScore': { $gte: 70 },
    'predictions.confidenceScore': { $gte: 80 }
  });
};

const AiMetrics = mongoose.model('AiMetrics', aiMetricsSchema);
module.exports = AiMetrics;