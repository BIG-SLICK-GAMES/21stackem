const express = require('express');

const { requireAuth } = require('../auth/auth.middleware');
const { claimPostShare, status } = require('./social.controller');

const router = express.Router();

router.use(requireAuth);
router.get('/status', status);
router.post('/claim-post-share', claimPostShare);

module.exports = router;
