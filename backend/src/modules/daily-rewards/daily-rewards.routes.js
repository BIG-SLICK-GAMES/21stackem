const express = require('express');

const { requireAuth } = require('../auth/auth.middleware');
const { claim, getDailyRewards } = require('./daily-rewards.controller');

const router = express.Router();

router.use(requireAuth);
router.get('/', getDailyRewards);
router.post('/claim', claim);

module.exports = router;
