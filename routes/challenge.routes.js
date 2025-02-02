const express = require('express');
const { auth, isAdmin } = require('../middleware/auth');  // Import both auth and isAdmin
const {
  createChallenge,
  listChallenges,
  joinChallenge,
  getChallenge,
  listCompletedChallenges,
  updateChallenge,
  updateChallengeProgress,
  // New controller methods
  getAiMetrics,
  getAnalytics,
  checkDataSufficiency,
  toggleAiMode
} = require('../controllers/challenge.controller');
const logger = require('../utils/logger');

const router = express.Router();

// Public routes
logger.info('Setting up public routes');
router.get('/', listChallenges);
router.get('/completed', listCompletedChallenges);
router.get('/:challengeId', getChallenge);

// Protected routes
logger.info('Setting up protected routes');
router.use(auth);

// User routes
router.post('/:challengeId/join', joinChallenge);
router.patch('/:challengeId/progress', updateChallengeProgress);

// Admin-only routes
router.post('/', auth, isAdmin, createChallenge);  // Change here
router.put('/:challengeId', auth, isAdmin, updateChallenge);  // Change here

// AI and Analytics routes (admin only)
router.get('/analytics/metrics', auth, isAdmin, getAiMetrics);  // Change here
router.get('/analytics/data', auth, isAdmin, getAnalytics);  // Change here
router.get('/analytics/data-status', auth, isAdmin, checkDataSufficiency);  // Change here
router.post('/:challengeId/ai-mode', auth, isAdmin, toggleAiMode);  // Change here

logger.info('Challenge routes setup completed');
module.exports = router;