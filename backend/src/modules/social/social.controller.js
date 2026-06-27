const { claimPostShareReward, getSocialStatus } = require('./social.service');

async function status(req, res, next) {
  try {
    const data = await getSocialStatus(req.user);
    return res.json({ data, message: 'success' });
  } catch (error) {
    return next(error);
  }
}

function handleSocialError(error, res, next) {
  if (error?.statusCode) {
    return res.status(error.statusCode).json({
      data: null,
      message: error.message,
    });
  }

  return next(error);
}

async function claimPostShare(req, res, next) {
  try {
    const data = await claimPostShareReward(req.user, req.body);
    return res.json({
      data,
      message: `Social reward credited: ${data.amount} chips`,
    });
  } catch (error) {
    return handleSocialError(error, res, next);
  }
}

module.exports = {
  claimPostShare,
  status,
};
