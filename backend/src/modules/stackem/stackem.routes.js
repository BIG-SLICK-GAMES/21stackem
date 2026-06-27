const express = require('express');

const { requireAuth } = require('../auth/auth.middleware');
const {
  completeStackemGame,
  dailyStatus,
  listLeaderboard,
  saveStackemRun,
  startStackemGame,
  stackemProfile,
} = require('./stackem.controller');

const router = express.Router();

router.get('/leaderboard', listLeaderboard);
router.get('/daily-status', requireAuth, dailyStatus);
router.get('/profile', requireAuth, stackemProfile);
router.post('/start', requireAuth, startStackemGame);
router.post('/complete', requireAuth, completeStackemGame);
router.post('/run', requireAuth, saveStackemRun);

module.exports = router;
