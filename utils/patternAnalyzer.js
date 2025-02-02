const logger = require('./logger');

class PatternAnalyzer {
    static analyzePatterns(readings) {
        if (!readings || readings.length === 0) {
            return {
                speedPattern: { average: 0, variance: 0, consistency: 'NO_DATA' },
                brakePattern: { hardBrakes: 0, suddenBrakes: 0, brakeScore: 0, rating: 'NO_DATA' },
                violationPattern: { totalViolations: 0, violationTypes: {}, frequency: 0 },
                challengeMetrics: { completionRate: 0, avgTime: 0, efficiency: 0 }
            };
        }

        return {
            speedPattern: this.analyzeSpeedPattern(readings),
            brakePattern: this.analyzeBrakePattern(readings),
            violationPattern: this.analyzeViolationPattern(readings),
            challengeMetrics: this.analyzeChallengeMetrics(readings)
        };
    }

    static analyzeSpeedPattern(readings) {
        const speeds = readings.map(r => r.gps?.speed || 0);
        const avgSpeed = speeds.reduce((a, b) => a + b, 0) / speeds.length;
        const variance = speeds.reduce((a, b) => a + Math.pow(b - avgSpeed, 2), 0) / speeds.length;

        return {
            average: avgSpeed,
            variance,
            consistency: variance < 50 ? 'GOOD' : variance < 100 ? 'MODERATE' : 'POOR',
            trend: this.calculateTrend(speeds)
        };
    }

    static analyzeBrakePattern(readings) {
        const brakeTypes = readings.map(r => r.processed?.brakeType || 'NORMAL');
        const hardBrakes = brakeTypes.filter(t => t === 'HARD').length;
        const suddenBrakes = brakeTypes.filter(t => t === 'SUDDEN').length;

        return {
            hardBrakes,
            suddenBrakes,
            brakeScore: hardBrakes * 2 + suddenBrakes * 5,
            rating: this.calculateBrakeRating(hardBrakes, suddenBrakes, readings.length),
            pattern: this.analyzeBrakeDistribution(brakeTypes)
        };
    }

    static analyzeViolationPattern(readings) {
        const violations = readings
            .filter(r => r.processed?.violations)
            .map(r => r.processed.violations)
            .flat();

        const violationCounts = violations.reduce((acc, v) => {
            acc[v] = (acc[v] || 0) + 1;
            return acc;
        }, {});

        return {
            totalViolations: violations.length,
            violationTypes: violationCounts,
            frequency: readings.length > 0 ? violations.length / readings.length : 0,
            severity: this.calculateViolationSeverity(violationCounts)
        };
    }

    static analyzeChallengeMetrics(readings) {
        const completedReadings = readings.filter(r => r.processed?.isCompleted);
        const times = completedReadings.map(r => r.processed?.completionTime || 0);
        const distances = completedReadings.map(r => r.processed?.distance || 0);

        return {
            completionRate: readings.length > 0 ? completedReadings.length / readings.length : 0,
            avgTime: times.length > 0 ? times.reduce((a, b) => a + b, 0) / times.length : 0,
            efficiency: this.calculateEfficiencyScore(times, distances),
            completionPattern: this.analyzeCompletionPattern(completedReadings)
        };
    }

    static calculateBrakeRating(hard, sudden, total) {
        if (total === 0) return 'NO_DATA';
        const score = (hard * 2 + sudden * 5) / total;
        if (score < 0.1) return 'EXCELLENT';
        if (score < 0.2) return 'GOOD';
        if (score < 0.3) return 'MODERATE';
        return 'POOR';
    }

    static calculateTrend(values) {
        if (values.length < 2) return 'STABLE';
        const changes = [];
        for (let i = 1; i < values.length; i++) {
            changes.push(values[i] - values[i-1]);
        }
        const avgChange = changes.reduce((a, b) => a + b, 0) / changes.length;
        if (Math.abs(avgChange) < 0.5) return 'STABLE';
        return avgChange > 0 ? 'INCREASING' : 'DECREASING';
    }

    static analyzeBrakeDistribution(brakeTypes) {
        const segments = Math.ceil(brakeTypes.length / 10);
        const distribution = [];
        for (let i = 0; i < segments; i++) {
            const segment = brakeTypes.slice(i * 10, (i + 1) * 10);
            const suddenCount = segment.filter(t => t === 'SUDDEN').length;
            distribution.push(suddenCount / segment.length);
        }
        return distribution;
    }

    static calculateViolationSeverity(violationCounts) {
        const weights = {
            SPEED_VIOLATION: 3,
            SUDDEN_BRAKE: 2,
            SHARP_TURN: 1
        };
        let severityScore = 0;
        let totalViolations = 0;

        for (const [type, count] of Object.entries(violationCounts)) {
            severityScore += (weights[type] || 1) * count;
            totalViolations += count;
        }

        if (totalViolations === 0) return 'NONE';
        const avgSeverity = severityScore / totalViolations;
        if (avgSeverity > 2.5) return 'HIGH';
        if (avgSeverity > 1.5) return 'MEDIUM';
        return 'LOW';
    }

    static calculateEfficiencyScore(times, distances) {
        if (times.length === 0 || distances.length === 0) return 0;
        const avgSpeed = distances.reduce((a, b) => a + b, 0) / times.reduce((a, b) => a + b, 0);
        const maxEfficiency = 30; // Example maximum efficient speed
        return Math.min(100, (avgSpeed / maxEfficiency) * 100);
    }

    static analyzeCompletionPattern(completedReadings) {
        if (completedReadings.length === 0) return 'NO_DATA';
        const timeDistribution = completedReadings
            .map(r => r.processed?.completionTime || 0)
            .sort((a, b) => a - b);
        
        const median = timeDistribution[Math.floor(timeDistribution.length / 2)];
        const average = timeDistribution.reduce((a, b) => a + b, 0) / timeDistribution.length;
        
        if (Math.abs(median - average) / average < 0.1) return 'CONSISTENT';
        if (median < average) return 'IMPROVING';
        return 'VARYING';
    }
}

module.exports = PatternAnalyzer;