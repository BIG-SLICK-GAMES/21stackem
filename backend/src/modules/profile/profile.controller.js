const { serializeProfile } = require('../auth/auth.utils');

async function getProfile(req, res, next) {
  try {
    return res.json({
      message: 'success',
      data: serializeProfile(req.user),
    });
  } catch (error) {
    next(error);
  }
}

async function updateProfile(req, res, next) {
  try {
    if (req.user.eUserType === 'guest') {
      return res.status(401).json({ message: 'A verified user session is required.', data: null });
    }

    const { sAvatar, sUserName } = req.body;

    if (typeof sAvatar === 'string') {
      req.user.sAvatar = sAvatar.trim();
    }

    if (typeof sUserName === 'string' && sUserName.trim()) {
      req.user.sUserName = sUserName.trim();
    }

    await req.user.save();

    return res.json({
      message: 'Profile updated.',
      data: serializeProfile(req.user),
    });
  } catch (error) {
    next(error);
  }
}

async function updateSettings(req, res, next) {
  try {
    if (req.user.eUserType === 'guest') {
      return res.status(401).json({ message: 'A verified user session is required.', data: null });
    }

    const { bMusicEnabled, bSoundEnabled, bVibrationEnabled } = req.body;

    if (typeof bMusicEnabled === 'boolean') {
      req.user.bMusicEnabled = bMusicEnabled;
    }
    if (typeof bSoundEnabled === 'boolean') {
      req.user.bSoundEnabled = bSoundEnabled;
    }
    if (typeof bVibrationEnabled === 'boolean') {
      req.user.bVibrationEnabled = bVibrationEnabled;
    }

    await req.user.save();

    return res.json({
      message: 'success',
      data: serializeProfile(req.user),
    });
  } catch (error) {
    next(error);
  }
}

async function logout(req, res, next) {
  try {
    req.user.sToken = '';
    await req.user.save();

    return res.json({ message: 'success', data: null });
  } catch (error) {
    next(error);
  }
}

async function deleteAccount(req, res, next) {
  try {
    if (req.user.eUserType !== 'user') {
      return res.status(404).json({ message: 'user not found', data: null });
    }

    req.user.eStatus = 'd';
    req.user.sToken = '';
    await req.user.save();

    return res.json({ message: 'Account Deleted successfully.', data: null });
  } catch (error) {
    next(error);
  }
}

async function addCash(req, res, next) {
  try {
    const amount = Number(req.body?.nChips) || 0;
    req.user.nChips = (Number(req.user.nChips) || 0) + amount;
    await req.user.save();

    return res.json({
      message: 'Cash added successfully.',
      data: serializeProfile(req.user),
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  addCash,
  deleteAccount,
  getProfile,
  logout,
  updateProfile,
  updateSettings,
};
