const mongoose = require('mongoose');

const SocialRewardSchema = new mongoose.Schema(
  {
    aTags: { type: [String], default: [] },
    eType: {
      type: String,
      enum: ['post-share', 'referral-signup'],
      required: true,
      index: true,
    },
    iRefereeUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'users',
      default: null,
    },
    iUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'users',
      required: true,
      index: true,
    },
    nAmount: { type: Number, required: true },
    sPlatform: { type: String, default: '' },
    sPostText: { type: String, default: '' },
  },
  {
    collection: 'social_rewards',
    timestamps: { createdAt: 'dCreatedDate', updatedAt: 'dUpdatedDate' },
  }
);

SocialRewardSchema.index({ iUserId: 1, eType: 1, dCreatedDate: -1 });
SocialRewardSchema.index({ iRefereeUserId: 1, eType: 1 }, { sparse: true });

module.exports =
  mongoose.models.social_rewards || mongoose.model('social_rewards', SocialRewardSchema);
