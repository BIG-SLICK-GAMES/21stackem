const cors = require('cors');
const express = require('express');

const authRoutes = require('./modules/auth/auth.routes');
const dailyRewardsRoutes = require('./modules/daily-rewards/daily-rewards.routes');
const profileRoutes = require('./modules/profile/profile.routes');
const socialRoutes = require('./modules/social/social.routes');
const stackemRoutes = require('./modules/stackem/stackem.routes');

const app = express();

app.use(cors());
app.use(express.json());

app.get('/health', (_req, res) => {
  res.json({ message: 'ok' });
});

app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/daily_rewards', dailyRewardsRoutes);
app.use('/api/v1/profile', profileRoutes);
app.use('/api/v1/social', socialRoutes);
app.use('/api/v1/stackem', stackemRoutes);

app.use((error, _req, res, _next) => {
  console.error(error);
  res.status(500).json({
    message: error?.message || 'server error',
  });
});

module.exports = app;
