const mongoose = require('mongoose');

const challengeSchema = new mongoose.Schema({
 name: {
   type: String,
   required: true,
   trim: true
 },
 type: {
   type: String,
   enum: ['micro', 'mini', 'small', 'long', 'extraLong'],
   required: true
 },
 minDistance: {
   type: Number,
   required: true,
   validate: {
     validator: function(value) {
       const ranges = {
         micro: [10, 15],
         mini: [15, 20],
         small: [20, 25],
         long: [25, 30],
         extraLong: [30, Infinity]
       };
       return value >= ranges[this.type][0];
     },
     message: 'Minimum distance is invalid for the selected challenge type'
   }
 },
 maxDistance: {
   type: Number,
   required: true,
   validate: {
     validator: function(value) {
       const ranges = {
         micro: [10, 15],
         mini: [15, 20],
         small: [20, 25],
         long: [25, 30],
         extraLong: [30, Infinity]
       };
       return value <= ranges[this.type][1] || (this.type === 'extraLong' && value > 30);
     },
     message: 'Maximum distance is invalid for the selected challenge type'
   }
 },
 timeLimit: {
   type: Number,
   required: true,
   min: 1,
   description: 'Time limit in minutes to complete the challenge'
 },
 entryFee: {
   type: Number,
   required: true,
   min: 0
 },
 reward: {
  type: Number,
  required: true,
  min: 0
},
 
 creationType: {
   type: String,
   enum: ['manual', 'ai'],
   default: 'manual'
 },
 status: {
   type: String,
   enum: ['active', 'inactive', 'completed', 'draft'],
   default: 'draft'
 },
 participants: [{
   userId: {
     type: mongoose.Schema.Types.ObjectId,
     ref: 'User',
     required: true
   },
   joinedAt: {
     type: Date,
     default: Date.now
   },
   startTime: Date,
   completionTime: Date,
   distanceCovered: {
     type: Number,
     default: 0
   },
   averageSpeed: Number,
   restBreaks: [{
     startTime: Date,
     duration: Number
   }],
   status: {
     type: String,
     enum: ['joined', 'inProgress', 'completed', 'failed'],
     default: 'joined'
   }
 }],
 minParticipants: {
   type: Number,
   default: 1,
   min: 1
 },
 maxParticipants: {
   type: Number,
   validate: {
     validator: function(value) {
       return value >= this.minParticipants;
     },
     message: 'Maximum participants must be greater than or equal to minimum participants'
   }
 },
 rules: {
   type: [String],
   default: []
 },
 statistics: {
   totalParticipants: {
     type: Number,
     default: 0
   },
   completedParticipants: {
     type: Number,
     default: 0
   },
   averageCompletionTime: {
     type: Number,
     default: 0
   },
   totalRewardsDistributed: {
     type: Number,
     default: 0
   },
   successRate: {
     type: Number,
     default: 0
   },
   averageDistanceCovered: {
     type: Number,
     default: 0
   },
   dropoutRate: {
     type: Number,
     default: 0
   }
 },
 analytics: {
   participationTrend: {
     daily: [{
       date: Date,
       count: Number
     }],
     weekly: [{
       week: Number,
       year: Number,
       count: Number
     }],
     monthly: [{
       month: Number,
       year: Number,
       count: Number
     }]
   },
   completionMetrics: {
     averageSpeed: Number,
     averageRestBreaks: Number,
     popularStartTimes: [{
       hour: Number,
       count: Number
     }]
   },
   aiMetrics: {
     dataQualityScore: {
       type: Number,
       min: 0,
       max: 100,
       default: 0
     },
     confidenceScore: {
       type: Number,
       min: 0,
       max: 100,
       default: 0
     },
     lastAnalysisDate: Date,
     isDataSufficient: {
       type: Boolean,
       default: false
     }
   }
 }
}, {
 timestamps: true
});

// Pre-save middleware for auto reward calculation
challengeSchema.pre('save', function(next) {
 if (this.isAutoReward) {
   this.reward = this.entryFee * 0.2;
 }
 next();
});

// Instance method to check if challenge is completable
challengeSchema.methods.isCompletable = function(distance, timeInMinutes) {
 return distance >= this.minDistance &&
        distance <= this.maxDistance &&
        timeInMinutes <= this.timeLimit;
};

// Instance method to update participant progress
challengeSchema.methods.updateParticipantProgress = async function(userId, distance, timeSpent) {
 const participant = this.participants.find(p => p.userId.equals(userId));
 if (participant) {
   participant.distanceCovered = distance;
   
   if (this.isCompletable(distance, timeSpent)) {
     participant.status = 'completed';
     participant.completionTime = new Date();
     this.statistics.completedParticipants += 1;
     this.statistics.totalRewardsDistributed += this.reward;
     
     // Update analytics
     this.updateCompletionMetrics(participant);
   }
   
   await this.updateStatistics();
   return this.save();
 }
 return null;
};

// Method to update challenge statistics
challengeSchema.methods.updateStatistics = function() {
 const totalParticipants = this.participants.length;
 const completed = this.participants.filter(p => p.status === 'completed').length;
 
 this.statistics.totalParticipants = totalParticipants;
 this.statistics.successRate = totalParticipants ? (completed / totalParticipants) * 100 : 0;
 this.statistics.dropoutRate = totalParticipants ? 
   (this.participants.filter(p => p.status === 'failed').length / totalParticipants) * 100 : 0;
 
 if (completed > 0) {
   const completedParticipants = this.participants.filter(p => p.status === 'completed');
   this.statistics.averageCompletionTime = completedParticipants.reduce((acc, p) => 
     acc + (p.completionTime - p.startTime), 0) / completed;
   this.statistics.averageDistanceCovered = completedParticipants.reduce((acc, p) => 
     acc + p.distanceCovered, 0) / completed;
 }
};

// Static method to get available challenges 
challengeSchema.statics.getAvailableChallenges = function(userId) {
 return this.find({
   status: 'active',
   'participants.userId': { $ne: userId },
   $where: 'this.participants.length < this.maxParticipants'
 });
};

const Challenge = mongoose.model('Challenge', challengeSchema);
module.exports = Challenge;