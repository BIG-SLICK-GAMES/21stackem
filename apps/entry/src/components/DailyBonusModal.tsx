import React, { useState, useEffect } from "react";
import { X, Coins, Flame, Calendar, Trophy, Sparkles } from "lucide-react";

interface DailyBonusModalProps {
  isOpen: boolean;
  onClaim: (day: number, reward: number) => void;
  onClose: () => void;
  currentStreak: number;
  longestStreak: number;
  lastClaimDate: string | null;
}

const DAILY_REWARDS = [
  { day: 1, reward: 100 },
  { day: 2, reward: 200 },
  { day: 3, reward: 300 },
  { day: 4, reward: 500 },
  { day: 5, reward: 700 },
  { day: 6, reward: 900 },
  { day: 7, reward: 1500 },
];

export default function DailyBonusModal({
  isOpen,
  onClaim,
  onClose,
  currentStreak,
  longestStreak,
  lastClaimDate,
}: DailyBonusModalProps) {
  const [isAnimating, setIsAnimating] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);

  if (!isOpen) return null;

  const today = new Date().toDateString();
  const lastClaim = lastClaimDate
    ? new Date(lastClaimDate).toDateString()
    : null;
  const canClaim = lastClaim !== today;

  const nextDay = canClaim
    ? currentStreak % 7 === 0
      ? 7
      : (currentStreak % 7) + 1
    : currentStreak % 7 === 0
      ? 7
      : currentStreak % 7;

  const todayReward = DAILY_REWARDS[nextDay - 1] || DAILY_REWARDS[0];

  const handleClaim = () => {
    if (!canClaim) return;

    setIsAnimating(true);
    setShowConfetti(true);

    setTimeout(() => {
      onClaim(nextDay, todayReward.reward);
      setIsAnimating(false);
    }, 1000);

    setTimeout(() => {
      setShowConfetti(false);
    }, 3000);
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
      {showConfetti && (
        <div className="absolute inset-0 pointer-events-none">
          {[...Array(30)].map((_, i) => (
            <div
              key={i}
              className="absolute animate-bounce"
              style={{
                left: `${Math.random() * 100}%`,
                top: `-10%`,
                animationDelay: `${Math.random() * 0.5}s`,
                animationDuration: `${2 + Math.random()}s`,
              }}
            >
              <Sparkles className="w-4 h-4 text-yellow-400" />
            </div>
          ))}
        </div>
      )}

      <div className="bg-gradient-to-br from-gray-800/95 to-gray-900/95 backdrop-blur-xl border border-orange-500/30 rounded-2xl max-w-md w-full relative shadow-2xl shadow-orange-500/20 overflow-y-auto max-h-[90vh]">
        <div className="absolute inset-0 bg-gradient-to-br from-orange-500/5 via-transparent to-purple-500/5 pointer-events-none"></div>

        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 text-gray-400 hover:text-white transition-colors p-2 hover:bg-white/10 rounded-lg"
        >
          <X className="w-6 h-6" />
        </button>

        <div className="relative h-24 bg-gradient-to-r from-orange-600/20 via-orange-700/15 to-orange-500/20 backdrop-blur-xl border-b border-orange-500/30">
          <div className="absolute inset-0 bg-gradient-to-r from-white/3 via-white/8 to-white/3"></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <div className="flex items-center justify-center space-x-3 mb-1">
                <Flame className="w-8 h-8 text-orange-400 animate-pulse" />
                <h2 className="text-3xl font-bold text-white drop-shadow-lg">
                  Daily Rewards Streak
                </h2>
                <Flame className="w-8 h-8 text-orange-400 animate-pulse" />
              </div>
              <p className="text-gray-300 text-sm">Keep your streak alive!</p>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-6 relative z-10">
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gradient-to-br from-orange-500/20 to-red-500/20 border border-orange-500/40 rounded-xl p-4 text-center backdrop-blur-sm">
              <Flame className="w-6 h-6 mx-auto mb-2 text-orange-400" />
              <div className="text-3xl font-bold text-white mb-1">
                {currentStreak}
              </div>
              <div className="text-xs text-gray-300">Current Streak</div>
            </div>

            <div className="bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-purple-500/40 rounded-xl p-4 text-center backdrop-blur-sm">
              <Trophy className="w-6 h-6 mx-auto mb-2 text-purple-400" />
              <div className="text-3xl font-bold text-white mb-1">
                {longestStreak}
              </div>
              <div className="text-xs text-gray-300">Longest Streak</div>
            </div>
          </div>

          <div className="bg-black/40 rounded-xl p-5 border border-gray-700/50 overflow-x-auto">
            <div className="flex items-center justify-center space-x-2 mb-5">
              <Calendar className="w-5 h-5 text-orange-400" />
              <h3 className="text-white font-semibold text-base">
                Today's Reward
              </h3>
            </div>

            <div className="flex space-x-3 min-w-max">
              <div
                className={`relative rounded-xl p-4 text-center transition-all duration-300 border-2 ${
                  canClaim
                    ? "bg-orange-500/30 border-orange-400 animate-pulse shadow-lg shadow-orange-500/30"
                    : "bg-green-500/20 border-green-500/50"
                }`}
              >
                {canClaim ? null : (
                  <div className="absolute -top-2 -right-2 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center border-2 border-gray-900 shadow-lg">
                    <span className="text-white text-xs font-bold">✓</span>
                  </div>
                )}

                <div className="text-sm font-bold mb-1 text-orange-300">
                  Day {nextDay}
                </div>
                <div className="text-sm font-bold text-orange-400">
                  {todayReward.reward} Chips
                </div>
              </div>
            </div>
          </div>

          {canClaim && (
            <div className="bg-gradient-to-r from-orange-500/20 to-yellow-500/20 border border-orange-500/40 rounded-xl p-6 text-center backdrop-blur-sm relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-white/5"></div>
              <div className="relative z-10">
                <Sparkles className="w-8 h-8 mx-auto mb-3 text-yellow-400 animate-pulse" />
                <h3 className="text-white font-bold text-lg mb-2">
                  Today's Reward
                </h3>
                <div className="flex items-center justify-center space-x-3 mb-2">
                  <Coins className="w-10 h-10 text-yellow-400" />
                  <span className="text-4xl font-bold text-yellow-400">
                    {todayReward.reward.toLocaleString()}
                  </span>
                </div>
                <p className="text-yellow-300 font-semibold">Free Chips!</p>
              </div>
            </div>
          )}

          {!canClaim && (
            <div className="bg-gray-800/50 border border-gray-700/50 rounded-xl p-6 text-center">
              <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-3 border-2 border-green-500/50">
                <span className="text-3xl">✓</span>
              </div>
              <h3 className="text-white font-bold text-lg mb-2">
                Already Claimed!
              </h3>
              <p className="text-gray-400 text-sm">
                Come back tomorrow for Day{" "}
                {currentStreak % 7 === 0 ? 1 : (currentStreak % 7) + 1}
              </p>
            </div>
          )}

          <button
            onClick={handleClaim}
            disabled={!canClaim || isAnimating}
            className={`w-full py-4 rounded-xl font-bold text-lg transition-all transform shadow-lg relative overflow-hidden ${
              canClaim && !isAnimating
                ? "bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white hover:scale-[1.02] active:scale-[0.98] shadow-orange-500/30"
                : "bg-gray-700 text-gray-400 cursor-not-allowed opacity-50"
            }`}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 animate-shimmer"></div>
            <span className="relative z-10">
              {isAnimating ? (
                <span className="flex items-center justify-center space-x-2">
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  <span>Claiming...</span>
                </span>
              ) : canClaim ? (
                <>Claim {todayReward.reward} Chips</>
              ) : (
                "Already Claimed Today"
              )}
            </span>
          </button>

          <p className="text-gray-400 text-sm text-center">
            {canClaim
              ? `Claim your reward to continue your ${currentStreak}-day streak!`
              : "Your streak continues tomorrow. Don't miss a day!"}
          </p>
        </div>
      </div>

      <style>{`
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        .animate-shimmer {
          animation: shimmer 2s infinite;
        }
      `}</style>
    </div>
  );
}
