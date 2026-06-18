const express = require('express');

const {
  addCash,
  deleteAccount,
  getProfile,
  logout,
  updateProfile,
  updateSettings,
} = require('./profile.controller');
const { requireAuth } = require('../auth/auth.middleware');

const router = express.Router();

router.use(requireAuth);

router.get('/', getProfile);
router.post('/update', updateProfile);
router.post('/setting', updateSettings);
router.get('/logout', logout);
router.get('/delete/account', deleteAccount);
router.post('/addCash', addCash);

module.exports = router;
