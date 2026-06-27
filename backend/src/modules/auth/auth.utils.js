const crypto = require('crypto');
const jwt = require('jsonwebtoken');

const jwtSecret = process.env.JWT_SECRET || 'local-dev-secret';

function hashPassword(password) {
  return crypto.createHmac('sha256', jwtSecret).update(password).digest('hex');
}

function createToken(payload, options) {
  return jwt.sign(payload, jwtSecret, options);
}

function decodeToken(token) {
  try {
    return jwt.verify(token, jwtSecret);
  } catch {
    return null;
  }
}

function serializeProfile(user) {
  return {
    _id: String(user._id),
    aPokerBoard: user.aPokerBoard ?? [],
    bMusicEnabled: user.bMusicEnabled ?? true,
    bSoundEnabled: user.bSoundEnabled ?? true,
    bVibrationEnabled: user.bVibrationEnabled ?? true,
    dLastRewardClaimDate: user.dLastRewardClaimDate ?? null,
    eStatus: user.eStatus ?? 'y',
    eUserType: user.eUserType ?? 'user',
    nChips: typeof user.nChips === 'number' ? user.nChips : 0,
    nDailyRewardStreak: user.nDailyRewardStreak ?? 0,
    nGameLost: user.nGameLost ?? 0,
    nGamePlayed: user.nGamePlayed ?? 0,
    nGameWon: user.nGameWon ?? 0,
    sAvatar: user.sAvatar ?? '',
    sDeviceId: user.sDeviceId ?? '',
    sEmail: user.sEmail ?? '',
    sPrivateCode: user.sPrivateCode ?? '',
    iReferredByUserId: user.iReferredByUserId ? String(user.iReferredByUserId) : null,
    sRootSocket: user.sRootSocket ?? '',
    sToken: user.sToken,
    sUserName: user.sUserName ?? 'Player',
  };
}

module.exports = {
  createToken,
  decodeToken,
  hashPassword,
  serializeProfile,
};
