const mongoose = require('mongoose');

const locationSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['Point'],
    required: true,
    default: 'Point'
  },
  coordinates: {
    type: [Number],
    required: true,
    validate: {
      validator: function(coords) {
        return coords.length === 2 &&
               coords[0] >= -180 && coords[0] <= 180 &&
               coords[1] >= -90 && coords[1] <= 90;
      },
      message: 'Invalid coordinates'
    }
  }
});

const brakePatternSchema = new mongoose.Schema({
  timestamp: {
    type: Date,
    required: true
  },
  severity: {
    type: String,
    enum: ['normal', 'sudden', 'emergency'],
    required: true
  },
  deceleration: {
    type: Number,
    required: true
  },
  location: locationSchema,
  pointsDeducted: {
    type: Number,
    default: 0
  },
  context: {
    speed: Number,
    roadType: String,
    weatherCondition: String
  }
});

const restBreakSchema = new mongoose.Schema({
  startTime: {
    type: Date,
    required: true
  },
  endTime: Date,
  duration: Number,
  type: {
    type: String,
    enum: ['quick', 'meal', 'long', 'emergency'],
    required: true
  },
  location: locationSchema,
  isCompleted: {
    type: Boolean,
    default: false
  },
  effectiveness: {
    type: Number,
    min: 0,
    max: 100
  }
});

const ridePatternSchema = new mongoose.Schema({
  rideId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Ride',
    required: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  brakePatterns: [brakePatternSchema],
  restBreaks: [restBreakSchema],
  phoneUsage: [{
    startTime: Date,
    endTime: Date,
    duration: Number,
    pointsDeducted: Number,
    context: {
      speed: Number,
      location: locationSchema
    }
  }],
  safetyScore: {
    type: Number,
    default: 100,
    min: 0,
    max: 100
  },
  pointsEarned: {
    type: Number,
    default: 0
  },
  pointsDeducted: {
    type: Number,
    default: 0
  },
  rideMetrics: {
    averageSpeed: Number,
    maxSpeed: Number,
    suddenBrakes: Number,
    totalRestTime: Number,
    totalPhoneUsage: Number,
    safetyViolations: {
      type: Map,
      of: Number,
      default: () => new Map()
    },
    distanceCovered: Number,
    totalDuration: Number,
    efficiencyScore: Number
  },
  weatherConditions: {
    temperature: Number,
    weather: String,
    visibility: Number,
    roadCondition: String
  },
  achievements: [{
    type: {
      type: String,
      enum: ['SAFETY', 'DISTANCE', 'TIME', 'SPECIAL']
    },
    name: String,
    earnedAt: Date,
    points: Number
  }]
}, {
  timestamps: true
});

ridePatternSchema.methods.calculateSafetyScore = function() {
  const baseScore = 100;
  let deductions = 0;
  
  // Brake pattern deductions
  const suddenBrakes = this.brakePatterns.filter(bp => bp.severity === 'sudden').length;
  const emergencyBrakes = this.brakePatterns.filter(bp => bp.severity === 'emergency').length;
  deductions += (suddenBrakes * 2) + (emergencyBrakes * 5);

  // Phone usage deductions
  const totalPhoneTime = this.phoneUsage.reduce((total, usage) => 
    total + (usage.duration || 0), 0);
  deductions += Math.floor(totalPhoneTime / 60) * 3;

  // Rest break compliance bonus
  const restCompliance = this.restBreaks.filter(rb => rb.isCompleted).length;
  const bonus = Math.min(restCompliance * 2, 10);

  return Math.max(0, Math.min(100, baseScore - deductions + bonus));
};

ridePatternSchema.methods.updateMetrics = async function() {
  const metrics = { ...this.rideMetrics };
  metrics.suddenBrakes = this.brakePatterns.filter(bp => 
    bp.severity === 'sudden' || bp.severity === 'emergency'
  ).length;
  
  metrics.totalRestTime = this.restBreaks.reduce((total, rb) => 
    total + (rb.duration || 0), 0);
  
  metrics.totalPhoneUsage = this.phoneUsage.reduce((total, pu) => 
    total + (pu.duration || 0), 0);

  this.rideMetrics = metrics;
  this.safetyScore = this.calculateSafetyScore();
  
  return this.save();
};

const RidePattern = mongoose.model('RidePattern', ridePatternSchema);
module.exports = RidePattern;