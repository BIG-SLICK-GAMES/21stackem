const User = require('../users/user.model');
const { ensureReferralCode, rewardReferralSignup } = require('../social/social.service');
const {
  createToken,
  hashPassword,
  serializeProfile,
} = require('./auth.utils');

function sendAuth(res, message, user) {
  res.setHeader('authorization', user.sToken);
  return res.json({
    message,
    data: serializeProfile(user),
  });
}

async function register(req, res, next) {
  try {
    const { referralCode, sEmail, sPassword, sUserName } = req.body;

    if (!sEmail || !sPassword || !sUserName) {
      return res.status(400).json({ message: 'Required fields are missing.', data: null });
    }

    const email = String(sEmail).trim().toLowerCase();
    const username = String(sUserName).trim();

    const existing = await User.findOne({
      $or: [{ sEmail: email }, { sUserName: username }],
      eStatus: { $ne: 'd' },
    });

    if (existing) {
      return res.status(409).json({ message: 'User already exists.', data: null });
    }

    const normalizedReferralCode = String(referralCode || '').trim();
    const referrer = normalizedReferralCode
      ? await User.findOne({
          eStatus: { $ne: 'd' },
          sPrivateCode: normalizedReferralCode,
        })
      : null;

    const user = await User.create({
      eUserType: 'user',
      iReferredByUserId: referrer?._id || null,
      isEmailVerified: true,
      nChips: 10000,
      sEmail: email,
      sPassword: hashPassword(String(sPassword)),
      sPrivateCode: `STK${String(Date.now()).slice(-4)}${Math.random().toString(36).slice(2, 6).toUpperCase()}`,
      sUserName: username,
    });

    await ensureReferralCode(user);
    if (referrer && String(referrer._id) !== String(user._id)) {
      await rewardReferralSignup(referrer, user);
    }

    return res.json({
      message: 'Registration completed. You can log in now.',
      data: { _id: String(user._id) },
    });
  } catch (error) {
    next(error);
  }
}

async function login(req, res, next) {
  try {
    const { sEmail, sPassword } = req.body;
    const identity = String(sEmail || '').trim();
    const hashedPassword = hashPassword(String(sPassword || ''));

    const user = await User.findOne({
      $or: [{ sEmail: identity.toLowerCase() }, { sUserName: identity }],
      eStatus: { $ne: 'd' },
    });

    if (!user || user.sPassword !== hashedPassword) {
      return res.status(401).json({ message: 'Invalid credentials.', data: null });
    }

    user.sToken = createToken({ _id: String(user._id), eUserType: user.eUserType });
    await user.save();

    return sendAuth(res, 'Login', user);
  } catch (error) {
    next(error);
  }
}

async function guestLogin(req, res, next) {
  try {
    const { sDeviceId, sPushToken } = req.body;

    if (!sDeviceId) {
      return res.status(400).json({ message: 'Device ID is required.', data: null });
    }

    let user = await User.findOne({ sDeviceId, eUserType: 'guest', eStatus: { $ne: 'd' } });

    if (!user) {
      user = await User.create({
        eUserType: 'guest',
        isEmailVerified: true,
        nChips: 1000,
        sDeviceId,
        sPushToken: sPushToken || '',
        sUserName: `Guest-${String(sDeviceId).slice(-4)}`,
      });
    }

    user.sToken = createToken({ _id: String(user._id), eUserType: user.eUserType });
    if (sPushToken) {
      user.sPushToken = sPushToken;
    }
    await user.save();

    return sendAuth(res, 'Login', user);
  } catch (error) {
    next(error);
  }
}

async function refreshToken(req, res, next) {
  try {
    req.user.sToken = createToken({ _id: String(req.user._id), eUserType: req.user.eUserType });
    await req.user.save();

    return sendAuth(res, 'Login', req.user);
  } catch (error) {
    next(error);
  }
}

async function changePassword(req, res, next) {
  try {
    const { sNewPassword, sOldPassword } = req.body;

    if (req.user.eUserType === 'guest') {
      return res.status(401).json({ message: 'A verified user session is required.', data: null });
    }

    if (req.user.sPassword !== hashPassword(String(sOldPassword || ''))) {
      return res.status(400).json({ message: 'Old Password is wrong.', data: null });
    }

    req.user.sPassword = hashPassword(String(sNewPassword || ''));
    await req.user.save();

    return res.json({ message: 'Password changed successfully.', data: null });
  } catch (error) {
    next(error);
  }
}

async function forgotPassword(req, res, next) {
  try {
    const email = String(req.body?.sEmail || '').trim().toLowerCase();
    const user = await User.findOne({ sEmail: email, eUserType: 'user', eStatus: { $ne: 'd' } });

    if (!user) {
      return res.json({ message: 'If the account exists, a reset link is ready.', data: null });
    }

    user.sVerificationToken = createToken({ _id: String(user._id), eUserType: user.eUserType }, { expiresIn: '1h' });
    await user.save();

    return res.json({
      message: 'Reset link prepared. Use the token in the frontend reset route.',
      data: { forgotPasswordToken: user.sVerificationToken },
    });
  } catch (error) {
    next(error);
  }
}

async function resetPassword(req, res, next) {
  try {
    const token = req.params.token;
    const { decodeToken } = require('./auth.utils');
    const decoded = decodeToken(token);

    if (!decoded?._id) {
      return res.status(401).json({ message: 'Reset link expired or invalid.', data: null });
    }

    const user = await User.findById(decoded._id);
    if (!user || user.sVerificationToken !== token) {
      return res.status(401).json({ message: 'Reset link expired or invalid.', data: null });
    }

    user.sPassword = hashPassword(String(req.body?.sPassword || ''));
    user.sVerificationToken = '';
    user.sToken = '';
    await user.save();

    return res.json({ message: 'Password reset successfully.', data: null });
  } catch (error) {
    next(error);
  }
}

async function verifyForgotPasswordMailLink(req, res, next) {
  try {
    const token = req.params.token;
    const { decodeToken } = require('./auth.utils');
    const decoded = decodeToken(token);

    if (!decoded?._id) {
      return res.status(401).json({ message: 'Reset link expired or invalid.', data: null });
    }

    const user = await User.findById(decoded._id);
    if (!user || user.sVerificationToken !== token) {
      return res.status(401).json({ message: 'Reset link expired or invalid.', data: null });
    }

    return res.json({ message: 'success', data: { sEmail: user.sEmail } });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  changePassword,
  forgotPassword,
  guestLogin,
  login,
  refreshToken,
  register,
  resetPassword,
  verifyForgotPasswordMailLink,
};
