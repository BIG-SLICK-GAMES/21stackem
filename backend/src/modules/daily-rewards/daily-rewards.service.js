const DAILY_REWARDS = [100, 150, 200, 250, 300, 400, 500];

function getUtcDayStart(date = new Date()) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

function getPreviousUtcDayStart(date = new Date()) {
  const previous = getUtcDayStart(date);
  previous.setUTCDate(previous.getUTCDate() - 1);
  return previous;
}

function isSameUtcDay(left, right = new Date()) {
  if (!left) {
    return false;
  }

  return getUtcDayStart(new Date(left)).getTime() === getUtcDayStart(right).getTime();
}

function wasYesterday(left, right = new Date()) {
  if (!left) {
    return false;
  }

  return getUtcDayStart(new Date(left)).getTime() === getPreviousUtcDayStart(right).getTime();
}

function getEligibleDay(user, now = new Date()) {
  const currentStreak = Math.max(0, Number(user.nDailyRewardStreak) || 0);

  if (isSameUtcDay(user.dLastRewardClaimDate, now)) {
    return Math.max(1, Math.min(currentStreak, DAILY_REWARDS.length));
  }

  if (wasYesterday(user.dLastRewardClaimDate, now)) {
    return Math.min(currentStreak + 1, DAILY_REWARDS.length);
  }

  return 1;
}

function getDailyRewardState(user, now = new Date()) {
  return {
    bTodayRewardClaimed: isSameUtcDay(user.dLastRewardClaimDate, now),
    eligibleDay: getEligibleDay(user, now),
    rewards: DAILY_REWARDS,
  };
}

async function claimDailyReward(user, now = new Date()) {
  if (isSameUtcDay(user.dLastRewardClaimDate, now)) {
    const error = new Error('Daily reward already claimed today.');
    error.statusCode = 409;
    throw error;
  }

  const eligibleDay = getEligibleDay(user, now);
  const amount = DAILY_REWARDS[eligibleDay - 1] || DAILY_REWARDS[0];

  user.nChips = (Number(user.nChips) || 0) + amount;
  user.nDailyRewardStreak = eligibleDay;
  user.dLastRewardClaimDate = now;
  await user.save();

  return {
    amount,
    state: getDailyRewardState(user, now),
  };
}

module.exports = {
  DAILY_REWARDS,
  claimDailyReward,
  getDailyRewardState,
};
