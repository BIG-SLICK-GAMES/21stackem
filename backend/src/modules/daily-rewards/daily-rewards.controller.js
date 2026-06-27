const { claimDailyReward, getDailyRewardState } = require('./daily-rewards.service');

function handleDailyRewardError(error, res, next) {
  if (error?.statusCode) {
    return res.status(error.statusCode).json({
      data: null,
      message: error.message,
    });
  }

  return next(error);
}

async function getDailyRewards(req, res, next) {
  try {
    return res.json({
      data: getDailyRewardState(req.user),
      message: 'success',
    });
  } catch (error) {
    return handleDailyRewardError(error, res, next);
  }
}

async function claim(req, res, next) {
  try {
    const result = await claimDailyReward(req.user);
    return res.json({
      data: result.state,
      message: `Daily reward claimed: ${result.amount} chips`,
    });
  } catch (error) {
    return handleDailyRewardError(error, res, next);
  }
}

module.exports = {
  claim,
  getDailyRewards,
};
