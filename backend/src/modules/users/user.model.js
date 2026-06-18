const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema(
  {
    aPokerBoard: { type: [mongoose.Schema.Types.ObjectId], default: [] },
    sUserName: { type: String, unique: true, default: '' },
    sEmail: { type: String, default: '' },
    sDeviceId: { type: String, default: '' },
    sPassword: { type: String },
    eUserType: {
      type: String,
      enum: ['user', 'admin', 'bot', 'guest'],
      default: 'user',
    },
    sAvatar: { type: String, default: '' },
    sRootSocket: { type: String, default: '' },
    eStatus: {
      type: String,
      enum: ['y', 'n', 'd'],
      default: 'y',
    },
    sToken: String,
    nChips: { type: Number, default: 10000 },
    isEmailVerified: { type: Boolean, default: true },
    bVibrationEnabled: { type: Boolean, default: true },
    bSoundEnabled: { type: Boolean, default: true },
    bMusicEnabled: { type: Boolean, default: true },
    sVerificationToken: String,
    eGender: {
      type: String,
      enum: ['male', 'female', 'unspecified'],
      default: 'male',
    },
    sPushToken: { type: String, default: '' },
    dDob: Date,
    nWithdrawable: Number,
    nGameWon: { type: Number, default: 0 },
    nGamePlayed: { type: Number, default: 0 },
    nGameLost: { type: Number, default: 0 },
    nTotalBetAmount: { type: Number, default: 0 },
    nTotalWinningAmount: { type: Number, default: 0 },
    sGoogleId: String,
    nDailyRewardStreak: { type: Number },
    dLastRewardClaimDate: { type: Date },
    sPrivateCode: String,
    iReferredByUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'users',
      default: null,
    },
    oBotProfile: { type: Object, default: null },
  },
  { collection: 'users', timestamps: { createdAt: 'dCreatedDate', updatedAt: 'dUpdatedDate' } }
);

module.exports = mongoose.models.users || mongoose.model('users', UserSchema);
