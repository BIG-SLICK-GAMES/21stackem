const User = require('../users/user.model');
const { decodeToken } = require('./auth.utils');

async function requireAuth(req, res, next) {
  try {
    const token = req.header('authorization');

    if (!token) {
      return res.status(401).json({ message: 'authentication Error, please try logging again', data: null });
    }

    const decoded = decodeToken(token);
    if (!decoded?._id) {
      return res.status(401).json({ message: 'authentication Error, please try logging again', data: null });
    }

    const user = await User.findById(decoded._id);
    if (!user || user.sToken !== token || user.eStatus !== 'y') {
      return res.status(401).json({ message: 'authentication Error, please try logging again', data: null });
    }

    req.user = user;
    next();
  } catch (error) {
    next(error);
  }
}

module.exports = {
  requireAuth,
};
