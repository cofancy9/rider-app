const logger = require('./logger');

class RestMonitor {
    static REST_RULES = {
        MIN_REST_SPEED: 1,      // km/h
        MIN_REST_TIME: 300,     // 5 minutes in seconds
        MAX_RIDING_TIME: 7200,  // 2 hours in seconds
        FORCE_REST_TIME: 1800   // 30 minutes in seconds
    };

    static checkRestNeeded(rideStartTime, lastRestTime) {
        const now = Date.now();
        const rideDuration = (now - rideStartTime) / 1000;
        const timeSinceLastRest = lastRestTime ? (now - lastRestTime) / 1000 : rideDuration;

        return {
            needsRest: timeSinceLastRest > this.REST_RULES.MAX_RIDING_TIME,
            restDuration: this.REST_RULES.FORCE_REST_TIME,
            timeSinceLastRest,
            rideDuration
        };
    }

    static validateRest(startTime, endTime) {
        const restDuration = (endTime - startTime) / 1000;
        return restDuration >= this.REST_RULES.MIN_REST_TIME;
    }
}

module.exports = RestMonitor;
