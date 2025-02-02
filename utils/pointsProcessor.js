const logger = require('./logger');

class PointsProcessor {
    static POINTS = {
        BASE_POINTS: 2,
        VIOLATIONS: {
            HARD_BRAKE: -2,
            SUDDEN_BRAKE: -5,
            SPEED_VIOLATION: -5,
            SHARP_TURN: -3
        },
        CHALLENGE_BONUSES: {
            EARLY_COMPLETION: 10,
            EFFICIENCY_BONUS: 5,
            CONSISTENCY_BONUS: 8,
            SAFETY_BONUS: 15
        },
        STREAK_BONUSES: {
            THREE_CHALLENGES: 20,
            FIVE_CHALLENGES: 40,
            TEN_CHALLENGES: 100
        }
    };

    static calculatePoints(processedData) {
        let points = {
            earned: this.POINTS.BASE_POINTS,
            deductions: 0,
            bonuses: 0,
            total: 0
        };

        // Calculate deductions
        if (processedData.violations && processedData.violations.length > 0) {
            processedData.violations.forEach(violation => {
                points.deductions += this.POINTS.VIOLATIONS[violation] || 0;
            });
        }

        // Calculate challenge bonuses
        if (processedData.challengeCompletion) {
            points.bonuses += this.calculateChallengeBonus(processedData.challengeCompletion);
        }

        // Calculate streak bonuses
        if (processedData.challengeStreak) {
            points.bonuses += this.calculateStreakBonus(processedData.challengeStreak);
        }

        points.total = points.earned + points.deductions + points.bonuses;
        return points;
    }

    static calculateChallengeBonus(completion) {
        let bonus = 0;

        // Early completion bonus
        if (completion.timePercent < 80) {
            bonus += this.POINTS.CHALLENGE_BONUSES.EARLY_COMPLETION;
        }

        // Efficiency bonus
        if (completion.efficiency > 90) {
            bonus += this.POINTS.CHALLENGE_BONUSES.EFFICIENCY_BONUS;
        }

        // Consistency bonus
        if (completion.consistency > 85) {
            bonus += this.POINTS.CHALLENGE_BONUSES.CONSISTENCY_BONUS;
        }

        // Safety bonus
        if (completion.safetyScore > 95) {
            bonus += this.POINTS.CHALLENGE_BONUSES.SAFETY_BONUS;
        }

        return bonus;
    }

    static calculateStreakBonus(streak) {
        if (streak >= 10) return this.POINTS.STREAK_BONUSES.TEN_CHALLENGES;
        if (streak >= 5) return this.POINTS.STREAK_BONUSES.FIVE_CHALLENGES;
        if (streak >= 3) return this.POINTS.STREAK_BONUSES.THREE_CHALLENGES;
        return 0;
    }
}

module.exports = PointsProcessor;