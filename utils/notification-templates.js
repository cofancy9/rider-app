const templates = {
  safetyAlert: {
    suddenBrake: {
      title: 'Sudden Brake Detected',
      message: 'Please maintain smooth braking for safer rides.'
    },
    speedViolation: {
      title: 'Speed Limit Exceeded',
      message: 'Please reduce your speed to maintain safety.'
    },
    sharpTurn: {
      title: 'Sharp Turn Detected',
      message: 'Take turns gradually for better control.'
    }
  },
  restReminder: {
    initial: {
      title: 'Rest Break Reminder',
      message: 'Time for a quick break! You\'ve been riding for {duration}.'
    },
    urgent: {
      title: 'Urgent Rest Required',
      message: 'Please take a break now for your safety.'
    }
  },
  pointUpdate: {
    earned: {
      title: 'Points Earned',
      message: 'You earned {points} points for safe riding!'
    },
    deducted: {
      title: 'Points Deducted',
      message: 'Safety violation detected. {points} points deducted.'
    }
  },
  challengeUpdate: {
    joined: {
      title: 'Challenge Joined',
      message: 'Welcome to {challengeName}! Start riding to earn rewards.'
    },
    progress: {
      title: 'Challenge Progress',
      message: 'You\'ve completed {progress}% of the challenge!'
    },
    completed: {
      title: 'Challenge Completed',
      message: 'Congratulations! You\'ve completed {challengeName}.'
    }
  }
};

module.exports = templates;
