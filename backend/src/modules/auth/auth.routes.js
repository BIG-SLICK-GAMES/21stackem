const express = require('express');

const {
  changePassword,
  forgotPassword,
  guestLogin,
  login,
  refreshToken,
  register,
  resetPassword,
  verifyForgotPasswordMailLink,
} = require('./auth.controller');
const { requireAuth } = require('./auth.middleware');

const router = express.Router();

router.post('/login', login);
router.post('/register', register);
router.post('/guestLogin', guestLogin);
router.post('/token/refresh', requireAuth, refreshToken);
router.post('/change-password', requireAuth, changePassword);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password/:token', resetPassword);
router.post('/verify-forgotpassword-maillink/:token', verifyForgotPasswordMailLink);

module.exports = router;
