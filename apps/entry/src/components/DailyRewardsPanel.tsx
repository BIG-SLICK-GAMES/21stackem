import React, { useEffect, useMemo, useState } from "react";
import { Calendar, Coins, Flame, Gift, Sparkles } from "lucide-react";

import {
  bsgClaimDailyReward,
  bsgGetDailyRewards,
  bsgGetProfile,
  type BsgDailyRewards,
  type BsgUser,
} from "../lib/bsgApi";

interface DailyRewardsPanelProps {
  onProfileUpdate: (profile: BsgUser) => void;
}

export default function DailyRewardsPanel({
  onProfileUpdate,
}: DailyRewardsPanelProps) {
  const [rewardState, setRewardState] = useState<BsgDailyRewards | null>(null);
  const [loading, setLoading] = useState(true);
  const [claiming, setClaiming] = useState(false);
  const [message, setMessage] = useState("");

  const rewards = rewardState?.rewards?.length ? rewardState.rewards : [];
  const eligibleDay = rewardState?.eligibleDay || 1;
  const todayReward = rewards[(eligibleDay - 1) % Math.max(rewards.length, 1)] || 0;
  const canClaim = Boolean(rewardState && !rewardState.bTodayRewardClaimed);

  const nextClaimText = useMemo(() => {
    if (!rewardState?.dNextClaimAt) return "Available from BSG rewards";
    return new Date(rewardState.dNextClaimAt).toLocaleString();
  }, [rewardState?.dNextClaimAt]);

  async function loadRewards() {
    setLoading(true);
    setMessage("");
    try {
      const data = await bsgGetDailyRewards();
      setRewardState(data);
    } catch (error: any) {
      setMessage(error.message || "Failed to load daily rewards.");
    } finally {
      setLoading(false);
    }
  }

  async function claimReward() {
    if (!canClaim || claiming) return;
    setClaiming(true);
    setMessage("");

    try {
      const claim = await bsgClaimDailyReward();
      const updatedProfile = await bsgGetProfile();
      const updatedRewards = await bsgGetDailyRewards();

      onProfileUpdate(updatedProfile);
      setRewardState(updatedRewards);
      setMessage(
        `Claimed ${(claim.reward || todayReward).toLocaleString()} chips.`
      );
    } catch (error: any) {
      setMessage(error.message || "Reward claim failed.");
      await loadRewards();
    } finally {
      setClaiming(false);
    }
  }

  useEffect(() => {
    loadRewards();
  }, []);

  return (
    <div className="relative overflow-hidden rounded-2xl border border-orange-500/20 bg-gradient-to-br from-gray-800/80 to-gray-950/90 shadow-xl shadow-orange-500/10">
      <div className="border-b border-orange-500/20 bg-gradient-to-r from-orange-600/20 via-orange-700/10 to-yellow-500/10 p-4 text-center">
        <div className="flex items-center justify-center gap-2">
          <Flame className="h-5 w-5 text-orange-300" />
          <h3 className="text-lg font-black text-white">Daily Rewards</h3>
        </div>
        <p className="mt-1 text-xs text-gray-300">
          Stored on your BSG account
        </p>
      </div>

      <div className="space-y-4 p-4">
        {loading ? (
          <div className="rounded-xl border border-gray-700/60 bg-black/20 p-5 text-center text-sm text-gray-300">
            Loading rewards...
          </div>
        ) : (
          <>
            <div className="rounded-xl border border-yellow-500/25 bg-yellow-500/10 p-4 text-center">
              <Sparkles className="mx-auto mb-2 h-6 w-6 text-yellow-300" />
              <p className="text-xs font-bold uppercase tracking-wide text-yellow-200">
                Day {eligibleDay} Reward
              </p>
              <div className="mt-2 flex items-center justify-center gap-2 text-yellow-300">
                <Coins className="h-8 w-8" />
                <span className="text-3xl font-black">
                  {todayReward.toLocaleString()}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-7 gap-1">
              {rewards.slice(0, 7).map((reward, index) => {
                const day = index + 1;
                const isEligible = day === eligibleDay && canClaim;
                const isClaimed = day < eligibleDay || rewardState?.bTodayRewardClaimed;

                return (
                  <div
                    key={`${day}-${reward}`}
                    className={`rounded-lg border p-2 text-center ${
                      isEligible
                        ? "border-orange-400 bg-orange-500/20"
                        : isClaimed
                          ? "border-green-500/25 bg-green-500/10"
                          : "border-gray-700/50 bg-gray-800/50"
                    }`}
                  >
                    <p className="text-[10px] font-bold text-gray-300">D{day}</p>
                    <p className="text-[11px] font-bold text-yellow-300">
                      {reward}
                    </p>
                  </div>
                );
              })}
            </div>

            <button
              onClick={claimReward}
              disabled={!canClaim || claiming}
              className={`flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-black transition ${
                canClaim && !claiming
                  ? "bg-gradient-to-r from-orange-500 to-red-600 text-white shadow-lg shadow-orange-500/20 hover:from-orange-400 hover:to-red-500"
                  : "cursor-not-allowed bg-gray-700 text-gray-400"
              }`}
            >
              <Gift className="h-4 w-4" />
              {claiming
                ? "Claiming..."
                : canClaim
                  ? "Claim In Hub"
                  : "Already Claimed Today"}
            </button>

            <div className="flex items-start gap-2 rounded-xl border border-gray-700/50 bg-black/20 p-3 text-xs text-gray-300">
              <Calendar className="mt-0.5 h-4 w-4 shrink-0 text-orange-300" />
              <span>Next claim: {nextClaimText}</span>
            </div>
          </>
        )}

        {message && (
          <div className="rounded-xl border border-orange-500/30 bg-orange-500/10 p-3 text-center text-xs font-semibold text-orange-100">
            {message}
          </div>
        )}
      </div>
    </div>
  );
}
