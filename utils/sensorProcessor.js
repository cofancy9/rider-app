const logger = require('./logger');

class SensorProcessor {
    // Constants for thresholds
    static THRESHOLDS = {
        BRAKE: {
            NORMAL: 4,    // m/s²
            HARD: 7,      // m/s²
            SUDDEN: 10    // m/s²
        },
        SPEED: {
            CITY: 40,     // km/h
            WARNING: 50,   // km/h
            VIOLATION: 60  // km/h
        },
        TURN: {
            NORMAL: 0.5,  // rad/s
            SHARP: 1.0    // rad/s
        }
    };

    static processSensorData({ gps, accelerometer, gyroscope }) {
        return {
            brakeType: this.analyzeBraking(accelerometer),
            speedStatus: this.analyzeSpeed(gps.speed),
            turnSeverity: this.analyzeTurning(gyroscope),
            isResting: gps.speed < 1,
            violations: this.detectViolations({ gps, accelerometer, gyroscope })
        };
    }

    static analyzeBraking(accelerometer) {
        const deceleration = Math.sqrt(
            Math.pow(accelerometer.x, 2) + 
            Math.pow(accelerometer.y, 2) + 
            Math.pow(accelerometer.z - 9.8, 2)
        );

        if (deceleration > this.THRESHOLDS.BRAKE.SUDDEN) return 'SUDDEN';
        if (deceleration > this.THRESHOLDS.BRAKE.HARD) return 'HARD';
        return 'NORMAL';
    }

    static analyzeSpeed(speed) {
        if (speed > this.THRESHOLDS.SPEED.VIOLATION) return 'VIOLATION';
        if (speed > this.THRESHOLDS.SPEED.WARNING) return 'WARNING';
        return 'NORMAL';
    }

    static analyzeTurning(gyroscope) {
        const turnRate = Math.sqrt(
            Math.pow(gyroscope.x, 2) + 
            Math.pow(gyroscope.y, 2) + 
            Math.pow(gyroscope.z, 2)
        );

        if (turnRate > this.THRESHOLDS.TURN.SHARP) return 'SHARP';
        return 'NORMAL';
    }

    static detectViolations({ gps, accelerometer, gyroscope }) {
        const violations = [];
        
        const deceleration = Math.sqrt(
            Math.pow(accelerometer.x, 2) + 
            Math.pow(accelerometer.y, 2) + 
            Math.pow(accelerometer.z - 9.8, 2)
        );

        if (deceleration > this.THRESHOLDS.BRAKE.SUDDEN) {
            violations.push('SUDDEN_BRAKE');
        }

        if (gps.speed > this.THRESHOLDS.SPEED.VIOLATION) {
            violations.push('SPEED_VIOLATION');
        }

        const turnRate = Math.sqrt(
            Math.pow(gyroscope.x, 2) + 
            Math.pow(gyroscope.y, 2) + 
            Math.pow(gyroscope.z, 2)
        );

        if (turnRate > this.THRESHOLDS.TURN.SHARP) {
            violations.push('SHARP_TURN');
        }

        return violations;
    }
}

module.exports = SensorProcessor;
