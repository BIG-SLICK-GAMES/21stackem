const {
  completeGame,
  getDailyStatus,
  getLegacyLeaderboard,
  getStackemProfile,
  getWeeklyLeaderboard,
  saveLegacyRun,
  startGame,
} = require('./stackem.service');

function normalizeLimit(value, fallback = 24, max = 100) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return fallback;
  }

  return Math.min(Math.floor(parsed), max);
}

function handleStackemError(error, res, next) {
  if (error?.statusCode) {
    return res.status(error.statusCode).json({
      data: null,
      message: error.message,
    });
  }

  return next(error);
}

async function listLeaderboard(req, res, next) {
  try {
    const limit = normalizeLimit(req.query.limit);

    if (req.query.legacy === 'true') {
      const data = await getLegacyLeaderboard(limit);
      return res.json({
        data,
        message: 'success',
      });
    }

    const data = await getWeeklyLeaderboard({
      difficulty: req.query.difficulty,
      limit,
    });

    return res.json({
      data,
      message: 'success',
    });
  } catch (error) {
    return handleStackemError(error, res, next);
  }
}

async function dailyStatus(req, res, next) {
  try {
    const data = await getDailyStatus(req.user);
    return res.json({
      data,
      message: 'success',
    });
  } catch (error) {
    return handleStackemError(error, res, next);
  }
}

async function startStackemGame(req, res, next) {
  try {
    const data = await startGame(req.user, req.body?.difficulty);
    return res.json({
      data,
      message: 'success',
    });
  } catch (error) {
    return handleStackemError(error, res, next);
  }
}

async function completeStackemGame(req, res, next) {
  try {
    const data = await completeGame(req.user, {
      cardsUsed: req.body?.cardsUsed,
      finalTotal: req.body?.finalTotal,
      gameSessionId: req.body?.gameSessionId,
    });
    return res.json({
      data,
      message: data.message,
    });
  } catch (error) {
    return handleStackemError(error, res, next);
  }
}

async function stackemProfile(req, res, next) {
  try {
    const data = await getStackemProfile(req.user);
    return res.json({
      data,
      message: 'success',
    });
  } catch (error) {
    return handleStackemError(error, res, next);
  }
}

async function saveStackemRun(req, res, next) {
  try {
    const data = await saveLegacyRun(req.user, req.body);
    return res.json({
      data,
      message: 'success',
    });
  } catch (error) {
    return handleStackemError(error, res, next);
  }
}

module.exports = {
  completeStackemGame,
  dailyStatus,
  listLeaderboard,
  saveStackemRun,
  startStackemGame,
  stackemProfile,
};
