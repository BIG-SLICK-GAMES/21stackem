const User = require('../users/user.model');
const SocialReward = require('./social-reward.model');

const SOCIAL_POST_REWARD = 100;
const SOCIAL_TAG_REWARD = 50;
const SOCIAL_REFERRAL_SIGNUP_REWARD = 100;
const MAX_REWARDED_TAGS_PER_POST = 10;

function getUtcDayStart(date = new Date()) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

function normalizeTag(value) {
  return String(value || '')
    .trim()
    .replace(/^@+/, '')
    .toLowerCase()
    .replace(/[^a-z0-9_.-]/g, '');
}

function normalizePlatform(value) {
  const platform = String(value || '').trim().toLowerCase();
  return ['facebook', 'instagram', 'tiktok', 'x', 'youtube', 'other'].includes(platform)
    ? platform
    : 'other';
}

function getReferralCode(user) {
  const existing = String(user.sPrivateCode || '').trim();
  if (existing) {
    return existing;
  }

  return `STK${String(user._id).slice(-8).toUpperCase()}`;
}

async function ensureReferralCode(user) {
  const code = getReferralCode(user);
  if (user.sPrivateCode !== code) {
    user.sPrivateCode = code;
    await user.save();
  }

  return code;
}

async function getSocialStatus(user) {
  const referralCode = await ensureReferralCode(user);
  const recentRewards = await SocialReward.find({ iUserId: user._id })
    .sort({ dCreatedDate: -1 })
    .limit(10)
    .lean();

  return {
    chipBalance: Number(user.nChips) || 0,
    referralCode,
    rewards: recentRewards.map((reward) => ({
      _id: String(reward._id),
      amount: Number(reward.nAmount) || 0,
      createdAt: reward.dCreatedDate,
      platform: reward.sPlatform,
      tags: reward.aTags || [],
      type: reward.eType,
    })),
    rewardRules: {
      postShare: SOCIAL_POST_REWARD,
      referralSignup: SOCIAL_REFERRAL_SIGNUP_REWARD,
      tag: SOCIAL_TAG_REWARD,
      maxRewardedTagsPerPost: MAX_REWARDED_TAGS_PER_POST,
    },
  };
}

async function claimPostShareReward(user, payload) {
  const existingToday = await SocialReward.findOne({
    dCreatedDate: { $gte: getUtcDayStart() },
    eType: 'post-share',
    iUserId: user._id,
  });

  if (existingToday) {
    const error = new Error('Social post reward already claimed today.');
    error.statusCode = 409;
    throw error;
  }

  const platform = normalizePlatform(payload?.platform);
  const tags = Array.from(
    new Set((Array.isArray(payload?.tags) ? payload.tags : []).map(normalizeTag).filter(Boolean))
  ).slice(0, MAX_REWARDED_TAGS_PER_POST);
  const postText = String(payload?.postText || '').trim().slice(0, 1000);
  const amount = SOCIAL_POST_REWARD + tags.length * SOCIAL_TAG_REWARD;

  const updatedUser = await User.findByIdAndUpdate(
    user._id,
    { $inc: { nChips: amount } },
    { new: true }
  );
  const reward = await SocialReward.create({
    aTags: tags,
    eType: 'post-share',
    iUserId: user._id,
    nAmount: amount,
    sPlatform: platform,
    sPostText: postText,
  });

  return {
    amount,
    chipBalance: Number(updatedUser?.nChips) || 0,
    rewardId: String(reward._id),
    tagsRewarded: tags.length,
  };
}

async function rewardReferralSignup(referrer, referee) {
  const existing = await SocialReward.findOne({
    eType: 'referral-signup',
    iRefereeUserId: referee._id,
  });

  if (existing) {
    return null;
  }

  await User.findByIdAndUpdate(referrer._id, {
    $inc: { nChips: SOCIAL_REFERRAL_SIGNUP_REWARD },
  });

  return SocialReward.create({
    eType: 'referral-signup',
    iRefereeUserId: referee._id,
    iUserId: referrer._id,
    nAmount: SOCIAL_REFERRAL_SIGNUP_REWARD,
    sDescription: 'Referral signup reward',
  });
}

module.exports = {
  SOCIAL_POST_REWARD,
  SOCIAL_REFERRAL_SIGNUP_REWARD,
  SOCIAL_TAG_REWARD,
  claimPostShareReward,
  ensureReferralCode,
  getSocialStatus,
  rewardReferralSignup,
};
