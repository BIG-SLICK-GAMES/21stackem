import React from 'react';
import { Star, Trophy, GamepadIcon, Twitter, MessageCircle, Tv, Spade, Heart, Diamond, Club, Target, Crown, Medal, TrendingUp } from 'lucide-react';

interface UserProfile {
  id: string;
  email: string;
  username: string;
  chips: number;
  created_at: string;
  country?: string | null;
  level?: number;
  experience?: number;
}

interface ProfileCardProps {
  profile: UserProfile;
  onMissionsClick?: () => void;
}

export default function ProfileCard({ profile, onMissionsClick }: ProfileCardProps) {
  const xpForNextLevel = profile.level * 1000;
  const currentLevelXP = (profile.experience || 0) % 1000; // XP within current level
  const xpProgress = (currentLevelXP / 1000) * 100; // Progress percentage
  
  // Mock game stats - in real implementation, these would come from the database
  const gameStats = {
    'stack-em': { played: 32, won: 19, winRate: 59 },
    'deck-realms': { played: 18, won: 12, winRate: 67 },
    'multi-up': { played: 23, won: 11, winRate: 48 },
    'pokeroply': { played: 8, won: 5, winRate: 63 }
  };
  
  const totalGamesPlayed = Object.values(gameStats).reduce((sum, stat) => sum + stat.played, 0);
  const totalGamesWon = Object.values(gameStats).reduce((sum, stat) => sum + stat.won, 0);
  const overallWinRate = totalGamesPlayed > 0 ? Math.round((totalGamesWon / totalGamesPlayed) * 100) : 0;

  // Mock leaderboard ranks - in real implementation, these would come from the leaderboards table
  const leaderboardRanks = {
    'overall': { rank: 12, totalPlayers: 1247 },
    'stack-em': { rank: 15, totalPlayers: 743 },
    'deck-realms': { rank: 6, totalPlayers: 456 },
    'multi-up': { rank: 23, totalPlayers: 634 },
    'pokeroply': { rank: 4, totalPlayers: 289 }
  };

  const getRankIcon = (rank: number) => {
    if (rank === 1) return <Crown className="w-4 h-4 text-yellow-400" />;
    if (rank <= 3) return <Medal className="w-4 h-4 text-orange-400" />;
    if (rank <= 10) return <Trophy className="w-4 h-4 text-purple-400" />;
    return <TrendingUp className="w-4 h-4 text-blue-400" />;
  };

  const getRankColor = (rank: number) => {
    if (rank === 1) return 'text-yellow-400';
    if (rank <= 3) return 'text-orange-400';
    if (rank <= 10) return 'text-purple-400';
    return 'text-blue-400';
  };

  return (
    <div className="bg-gradient-to-br from-gray-800/80 to-gray-900/80 backdrop-blur-xl border border-orange-500/20 rounded-2xl p-4 sm:p-6 space-y-4 sm:space-y-6 shadow-xl shadow-orange-500/10">
      <div className="text-center">
        <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-orange-500 to-red-500 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4 shadow-lg shadow-orange-500/50">
          <span className="text-white text-xl sm:text-2xl font-bold">
            {profile.username.charAt(0).toUpperCase()}
          </span>
        </div>
        <h3 className="text-lg sm:text-xl font-bold text-white">{profile.username}</h3>
        <p className="text-gray-400 text-sm">Player since {new Date(profile.created_at).getFullYear()}</p>
      </div>

      <div className="space-y-3 sm:space-y-4">
        <div className="bg-gray-800/50 rounded-lg p-3 sm:p-4 border border-gray-700/50">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-400 text-sm">Level</span>
            <span className="text-white font-bold text-sm">Level {profile.level}</span>
          </div>
          <div className="w-full bg-gray-700 rounded-full h-2">
            <div 
              className="bg-gradient-to-r from-orange-500 to-red-500 h-2 rounded-full transition-all duration-500 shadow-sm shadow-orange-500/50"
              style={{ width: `${xpProgress}%` }}
            ></div>
          </div>
          <p className="text-xs text-gray-400 mt-1">
            {currentLevelXP} / 1000 XP to next level
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:gap-4">
          <div className="bg-gray-800/50 rounded-lg p-2 sm:p-3 text-center border border-gray-700/50">
            <GamepadIcon className="w-5 h-5 sm:w-6 sm:h-6 text-orange-400 mx-auto mb-1" />
            <p className="text-white font-semibold text-sm sm:text-base">{totalGamesPlayed}</p>
            <p className="text-gray-400 text-xs">Games Played</p>
          </div>
          
          <div className="bg-gray-800/50 rounded-lg p-2 sm:p-3 text-center border border-gray-700/50">
            <Trophy className="w-5 h-5 sm:w-6 sm:h-6 text-yellow-400 mx-auto mb-1" />
            <p className="text-white font-semibold text-sm sm:text-base">{totalGamesWon}</p>
            <p className="text-gray-400 text-xs">Wins</p>
          </div>
        </div>

        <div className="bg-gray-800/50 rounded-lg p-2 sm:p-3 text-center border border-gray-700/50">
          <Star className="w-5 h-5 sm:w-6 sm:h-6 text-yellow-400 mx-auto mb-1" />
          <p className="text-white font-semibold text-sm sm:text-base">
            {overallWinRate}%
          </p>
          <p className="text-gray-400 text-xs">Win Rate</p>
        </div>
        
        {/* Individual Game Stats */}
        <div className="space-y-3 sm:space-y-4">
          <h4 className="text-white font-semibold text-xs sm:text-sm">Game Performance & Rankings</h4>
          
          <div className="space-y-1 sm:space-y-2">
            <div className="flex items-center justify-between bg-gray-800/30 rounded-lg p-1.5 sm:p-2">
              <div className="flex items-center space-x-2">
                <Club className="w-4 h-4 text-orange-400" />
                <span className="text-white text-xs sm:text-sm font-medium">Stack'em</span>
              </div>
              <div className="text-right space-y-0.5">
                <div className="flex items-center space-x-1">
                  {getRankIcon(leaderboardRanks['stack-em'].rank)}
                  <span className={`text-xs font-bold ${getRankColor(leaderboardRanks['stack-em'].rank)}`}>
                    #{leaderboardRanks['stack-em'].rank}
                  </span>
                </div>
                <div className="text-white text-xs">{gameStats['stack-em'].winRate}% WR</div>
              </div>
            </div>
            
            <div className="flex items-center justify-between bg-gray-800/30 rounded-lg p-1.5 sm:p-2">
              <div className="flex items-center space-x-2">
                <Diamond className="w-4 h-4 text-yellow-400" />
                <span className="text-white text-xs sm:text-sm font-medium">Deck Realms</span>
              </div>
              <div className="text-right space-y-0.5">
                <div className="flex items-center space-x-1">
                  {getRankIcon(leaderboardRanks['deck-realms'].rank)}
                  <span className={`text-xs font-bold ${getRankColor(leaderboardRanks['deck-realms'].rank)}`}>
                    #{leaderboardRanks['deck-realms'].rank}
                  </span>
                </div>
                <div className="text-white text-xs">{gameStats['deck-realms'].winRate}% WR</div>
              </div>
            </div>
            
            <div className="flex items-center justify-between bg-gray-800/30 rounded-lg p-1.5 sm:p-2">
              <div className="flex items-center space-x-2">
                <Heart className="w-4 h-4 text-red-400" />
                <span className="text-white text-xs sm:text-sm font-medium">Multi'Up</span>
              </div>
              <div className="text-right space-y-0.5">
                <div className="flex items-center space-x-1">
                  {getRankIcon(leaderboardRanks['multi-up'].rank)}
                  <span className={`text-xs font-bold ${getRankColor(leaderboardRanks['multi-up'].rank)}`}>
                    #{leaderboardRanks['multi-up'].rank}
                  </span>
                </div>
                <div className="text-white text-xs">{gameStats['multi-up'].winRate}% WR</div>
              </div>
            </div>
            
            <div className="flex items-center justify-between bg-gray-800/30 rounded-lg p-1.5 sm:p-2">
              <div className="flex items-center space-x-2">
                <Spade className="w-4 h-4 text-green-400" />
                <span className="text-white text-xs sm:text-sm font-medium">Poker'oply</span>
              </div>
              <div className="text-right space-y-0.5">
                <div className="flex items-center space-x-1">
                  {getRankIcon(leaderboardRanks['pokeroply'].rank)}
                  <span className={`text-xs font-bold ${getRankColor(leaderboardRanks['pokeroply'].rank)}`}>
                    #{leaderboardRanks['pokeroply'].rank}
                  </span>
                </div>
                <div className="text-white text-xs">{gameStats['pokeroply'].winRate}% WR</div>
              </div>
              </div>
            </div>
          </div>
          
          {/* Overall Leaderboard Rank */}
          <div className="bg-gradient-to-r from-blue-800/20 to-purple-800/20 border border-blue-500/30 rounded-lg p-2 sm:p-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Trophy className="w-4 h-4 text-blue-400" />
                <span className="text-blue-300 text-xs sm:text-sm font-semibold">Overall Rank</span>
              </div>
              <div className="text-right">
                <div className="flex items-center space-x-1">
                  {getRankIcon(leaderboardRanks['overall'].rank)}
                  <span className={`text-sm font-bold ${getRankColor(leaderboardRanks['overall'].rank)}`}>
                    #{leaderboardRanks['overall'].rank}
                  </span>
                </div>
                <div className="text-blue-300 text-xs">
                  of {leaderboardRanks['overall'].totalPlayers.toLocaleString()} players
                </div>
              </div>
            </div>
          </div>
          
          <div className="text-center pt-1 border-t border-gray-700/50">
            <p className="text-gray-400 text-xs">WR = Win Rate • Rankings update daily</p>
          </div>
        </div>
      </div>

      {/* Missions Overview */}
      {false && (
      <div className="bg-gray-800/50 rounded-lg p-3 sm:p-4 border border-gray-700/50">
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-white font-semibold text-xs sm:text-sm flex items-center space-x-2">
            <Target className="w-4 h-4 text-purple-400" />
            <span>Active Missions</span>
          </h4>
          <div className="flex items-center space-x-1 bg-purple-500/20 px-2 py-1 rounded-full">
            <Star className="w-3 h-3 text-purple-400" />
            <span className="text-purple-400 text-xs font-semibold">150 pts</span>
          </div>
        </div>
        
        <div className="space-y-1 sm:space-y-2 mb-3">
          <div className="flex items-center justify-between text-xs">
            <span className="text-gray-300">Stack'em Starter (7/10)</span>
            <span className="text-purple-400">25 pts</span>
          </div>
          <div className="w-full bg-gray-700 rounded-full h-1">
            <div className="bg-gradient-to-r from-purple-500 to-pink-500 h-1 rounded-full" style={{ width: '70%' }}></div>
          </div>
          
          <div className="flex items-center justify-between text-xs">
            <span className="text-gray-300">Multi Champion (3/5)</span>
            <span className="text-purple-400">75 pts</span>
          </div>
          <div className="w-full bg-gray-700 rounded-full h-1">
            <div className="bg-gradient-to-r from-purple-500 to-pink-500 h-1 rounded-full" style={{ width: '60%' }}></div>
          </div>
        </div>
        
        <button 
          onClick={onMissionsClick}
          className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-2 rounded-lg font-semibold hover:from-purple-700 hover:to-pink-700 transition-all text-xs shadow-lg shadow-purple-500/30 touch-manipulation"
        >
          View All Missions
        </button>
      </div>
      )}
      <div className="border-t border-orange-500/20 pt-4">
        <h4 className="text-white font-semibold mb-3 text-sm">Social Links</h4>
        <div className="flex justify-center space-x-4">
          <button className="p-2 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 rounded-lg transition-all hover:shadow-lg hover:shadow-blue-500/20 touch-manipulation">
            <Twitter className="w-5 h-5" />
          </button>
          <button className="p-2 bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-400 rounded-lg transition-all hover:shadow-lg hover:shadow-indigo-500/20 touch-manipulation">
            <MessageCircle className="w-5 h-5" />
          </button>
          <button className="p-2 bg-orange-500/20 hover:bg-orange-500/30 text-orange-400 rounded-lg transition-all hover:shadow-lg hover:shadow-orange-500/20 touch-manipulation">
            <Tv className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
