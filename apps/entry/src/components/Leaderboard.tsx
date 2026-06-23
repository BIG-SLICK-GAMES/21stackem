import React, { useState, useEffect } from 'react';
import { ArrowLeft, Trophy, Crown, Medal, Star, TrendingUp, Users, Gamepad2, Coins } from 'lucide-react';

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

interface LeaderboardEntry {
  id: string;
  username: string;
  chip_total: number;
  level: number;
  games_played: number;
  games_won: number;
  win_rate: number;
  rank: number;
  country?: string;
}

interface GameLeaderboardEntry {
  id: string;
  username: string;
  game_type: string;
  games_played: number;
  games_won: number;
  win_rate: number;
  chips_won: number;
  rank: number;
  country?: string;
}

interface LeaderboardProps {
  profile: UserProfile;
  onBack: () => void;
}

const gameTypes = [
  { id: 'overall', name: 'Overall Rankings', icon: Trophy, color: 'from-yellow-500 to-orange-500' },
  { id: 'stack-em', name: "21 Stack'em", icon: TrendingUp, color: 'from-orange-700 to-red-700' },
  { id: 'sink-em', name: 'Deck Realms', icon: Star, color: 'from-red-500 to-orange-500' },
  { id: 'multi-up', name: "21 Multi'Up", icon: Crown, color: 'from-orange-600 to-red-600' },
  { id: 'pokeroply', name: "Poker'oply", icon: Medal, color: 'from-green-500 to-emerald-600' }
];

export default function Leaderboard({ profile, onBack }: LeaderboardProps) {
  const [selectedGame, setSelectedGame] = useState('overall');
  const [leaderboardData, setLeaderboardData] = useState<LeaderboardEntry[]>([]);
  const [gameLeaderboardData, setGameLeaderboardData] = useState<GameLeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeFilter, setTimeFilter] = useState<'all' | 'week' | 'month'>('all');

  useEffect(() => {
    loadLeaderboardData();
  }, [selectedGame, timeFilter]);

  const loadLeaderboardData = async () => {
    setLoading(true);
    
    if (selectedGame === 'overall') {
      // Load overall leaderboard - mock data for now
      const mockOverallData: LeaderboardEntry[] = [
        {
          id: '1',
          username: 'ChipMaster',
          chip_total: 2500000,
          level: 25,
          games_played: 1250,
          games_won: 875,
          win_rate: 70,
          rank: 1,
          country: 'USA'
        },
        {
          id: '2',
          username: 'ProGamer123',
          chip_total: 1800000,
          level: 22,
          games_played: 980,
          games_won: 637,
          win_rate: 65,
          rank: 2,
          country: 'Canada'
        },
        {
          id: '3',
          username: 'LuckyPlayer',
          chip_total: 1200000,
          level: 18,
          games_played: 750,
          games_won: 450,
          win_rate: 60,
          rank: 3,
          country: 'UK'
        },
        {
          id: '4',
          username: 'CardShark',
          chip_total: 950000,
          level: 16,
          games_played: 650,
          games_won: 364,
          win_rate: 56,
          rank: 4,
          country: 'Australia'
        },
        {
          id: '5',
          username: 'StackKing',
          chip_total: 800000,
          level: 15,
          games_played: 580,
          games_won: 319,
          win_rate: 55,
          rank: 5,
          country: 'Germany'
        },
        {
          id: profile.id,
          username: profile.username,
          chip_total: profile.chips,
          level: profile.level || 1,
          games_played: 45,
          games_won: 28,
          win_rate: 62,
          rank: 12,
          country: profile.country || 'Unknown'
        }
      ];
      setLeaderboardData(mockOverallData);
    } else {
      // Load game-specific leaderboard - mock data for now
      const mockGameData: GameLeaderboardEntry[] = [
        {
          id: '1',
          username: 'StackemHero',
          game_type: selectedGame,
          games_played: 450,
          games_won: 315,
          win_rate: 70,
          chips_won: 850000,
          rank: 1,
          country: 'USA'
        },
        {
          id: '2',
          username: 'PokerPro',
          game_type: selectedGame,
          games_played: 380,
          games_won: 247,
          win_rate: 65,
          chips_won: 620000,
          rank: 2,
          country: 'Canada'
        },
        {
          id: '3',
          username: 'CardMaster',
          game_type: selectedGame,
          games_played: 320,
          games_won: 192,
          win_rate: 60,
          chips_won: 480000,
          rank: 3,
          country: 'UK'
        },
        {
          id: profile.id,
          username: profile.username,
          game_type: selectedGame,
          games_played: 45,
          games_won: 28,
          win_rate: 62,
          chips_won: 125000,
          rank: 8,
          country: profile.country || 'Unknown'
        }
      ];
      setGameLeaderboardData(mockGameData);
    }
    
    setLoading(false);
  };

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1: return <Crown className="w-6 h-6 text-yellow-400" />;
      case 2: return <Medal className="w-6 h-6 text-gray-400" />;
      case 3: return <Medal className="w-6 h-6 text-orange-600" />;
      default: return <span className="text-gray-400 font-bold">#{rank}</span>;
    }
  };

  const getRankBg = (rank: number) => {
    switch (rank) {
      case 1: return 'from-yellow-500/20 to-orange-500/20 border-yellow-500/40';
      case 2: return 'from-gray-400/20 to-gray-500/20 border-gray-400/40';
      case 3: return 'from-orange-500/20 to-red-500/20 border-orange-500/40';
      default: return 'from-gray-800/80 to-gray-900/80 border-orange-500/20';
    }
  };

  const selectedGameData = gameTypes.find(g => g.id === selectedGame);
  const IconComponent = selectedGameData?.icon || Trophy;

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="flex items-center space-x-2 text-gray-400 hover:text-white transition-colors group touch-manipulation"
        >
          <ArrowLeft className="w-5 h-5 group-hover:transform group-hover:-translate-x-1 transition-transform" />
          <span>Back to Dashboard</span>
        </button>
      </div>

      <div className="text-center">
        <div className="w-16 h-16 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg shadow-yellow-500/50">
          <Trophy className="w-8 h-8 text-white" />
        </div>
        <h2 className="text-2xl sm:text-4xl font-bold text-white mb-4">Leaderboards</h2>
        <p className="text-gray-400 text-sm sm:text-lg">Compete with players worldwide</p>
      </div>

      {/* Game Selection Tabs */}
      <div className="flex flex-wrap justify-center gap-2 sm:gap-4">
        {gameTypes.map((game) => {
          const GameIcon = game.icon;
          return (
            <button
              key={game.id}
              onClick={() => setSelectedGame(game.id)}
              className={`flex items-center space-x-2 px-3 sm:px-4 py-2 rounded-lg font-semibold transition-all text-sm sm:text-base touch-manipulation ${
                selectedGame === game.id
                  ? `bg-gradient-to-r ${game.color} text-white shadow-lg`
                  : 'bg-gray-800/50 text-gray-400 hover:text-white hover:bg-gray-700/50'
              }`}
            >
              <GameIcon className="w-4 h-4" />
              <span className="hidden sm:inline">{game.name}</span>
              <span className="sm:hidden">{game.name.split(' ')[0]}</span>
            </button>
          );
        })}
      </div>

      {/* Time Filter */}
      <div className="flex justify-center space-x-4">
        {[
          { id: 'all', label: 'All Time' },
          { id: 'month', label: 'This Month' },
          { id: 'week', label: 'This Week' }
        ].map((filter) => (
          <button
            key={filter.id}
            onClick={() => setTimeFilter(filter.id as any)}
            className={`px-4 py-2 rounded-lg font-semibold transition-all text-sm touch-manipulation ${
              timeFilter === filter.id
                ? 'bg-orange-500 text-white'
                : 'bg-gray-800/50 text-gray-400 hover:text-white'
            }`}
          >
            {filter.label}
          </button>
        ))}
      </div>

      {/* Leaderboard Content */}
      {loading ? (
        <div className="text-center py-12">
          <div className="w-12 h-12 border-4 border-orange-500/30 border-t-orange-500 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400">Loading leaderboard...</p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Current User Highlight */}
          {selectedGame === 'overall' ? (
            leaderboardData.find(entry => entry.id === profile.id) && (
              <div className="bg-gradient-to-r from-blue-800/20 to-purple-800/20 border border-blue-500/30 rounded-2xl p-6">
                <div className="flex items-center space-x-3 mb-4">
                  <Users className="w-6 h-6 text-blue-400" />
                  <h3 className="text-xl font-bold text-white">Your Ranking</h3>
                </div>
                {(() => {
                  const userEntry = leaderboardData.find(entry => entry.id === profile.id)!;
                  return (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                      <div>
                        <p className="text-blue-400 font-bold text-2xl">#{userEntry.rank}</p>
                        <p className="text-gray-400 text-sm">Global Rank</p>
                      </div>
                      <div>
                        <p className="text-yellow-400 font-bold text-2xl">{userEntry.chip_total.toLocaleString()}</p>
                        <p className="text-gray-400 text-sm">Total Chips</p>
                      </div>
                      <div>
                        <p className="text-green-400 font-bold text-2xl">{userEntry.win_rate}%</p>
                        <p className="text-gray-400 text-sm">Win Rate</p>
                      </div>
                      <div>
                        <p className="text-purple-400 font-bold text-2xl">{userEntry.games_played}</p>
                        <p className="text-gray-400 text-sm">Games Played</p>
                      </div>
                    </div>
                  );
                })()}
              </div>
            )
          ) : (
            gameLeaderboardData.find(entry => entry.id === profile.id) && (
              <div className="bg-gradient-to-r from-blue-800/20 to-purple-800/20 border border-blue-500/30 rounded-2xl p-6">
                <div className="flex items-center space-x-3 mb-4">
                  <IconComponent className="w-6 h-6 text-blue-400" />
                  <h3 className="text-xl font-bold text-white">Your {selectedGameData?.name} Ranking</h3>
                </div>
                {(() => {
                  const userEntry = gameLeaderboardData.find(entry => entry.id === profile.id)!;
                  return (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                      <div>
                        <p className="text-blue-400 font-bold text-2xl">#{userEntry.rank}</p>
                        <p className="text-gray-400 text-sm">Game Rank</p>
                      </div>
                      <div>
                        <p className="text-yellow-400 font-bold text-2xl">{userEntry.chips_won.toLocaleString()}</p>
                        <p className="text-gray-400 text-sm">Chips Won</p>
                      </div>
                      <div>
                        <p className="text-green-400 font-bold text-2xl">{userEntry.win_rate}%</p>
                        <p className="text-gray-400 text-sm">Win Rate</p>
                      </div>
                      <div>
                        <p className="text-purple-400 font-bold text-2xl">{userEntry.games_played}</p>
                        <p className="text-gray-400 text-sm">Games Played</p>
                      </div>
                    </div>
                  );
                })()}
              </div>
            )
          )}

          {/* Leaderboard Table */}
          <div className="bg-gradient-to-br from-gray-800/80 to-gray-900/80 backdrop-blur-xl border border-orange-500/20 rounded-2xl overflow-hidden shadow-xl shadow-orange-500/10">
            <div className="p-6 border-b border-orange-500/20">
              <div className="flex items-center space-x-3">
                <IconComponent className="w-6 h-6 text-orange-400" />
                <h3 className="text-xl font-bold text-white">{selectedGameData?.name} Rankings</h3>
              </div>
            </div>

            <div className="space-y-2 p-6">
              {selectedGame === 'overall' ? (
                leaderboardData.slice(0, 10).map((entry) => (
                  <div
                    key={entry.id}
                    className={`bg-gradient-to-r ${getRankBg(entry.rank)} backdrop-blur-xl border rounded-xl p-4 transition-all hover:scale-[1.02] ${
                      entry.id === profile.id ? 'ring-2 ring-blue-500/50' : ''
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="flex items-center justify-center w-12 h-12">
                          {getRankIcon(entry.rank)}
                        </div>
                        
                        <div>
                          <div className="flex items-center space-x-2">
                            <h4 className="text-white font-bold">{entry.username}</h4>
                            {entry.id === profile.id && (
                              <span className="bg-blue-500 text-white text-xs px-2 py-1 rounded">YOU</span>
                            )}
                          </div>
                          <div className="flex items-center space-x-4 text-sm text-gray-400">
                            <span>Level {entry.level}</span>
                            {entry.country && <span>🌍 {entry.country}</span>}
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-6 text-right">
                        <div>
                          <p className="text-yellow-400 font-bold">{entry.chip_total.toLocaleString()}</p>
                          <p className="text-gray-400 text-xs">Chips</p>
                        </div>
                        <div>
                          <p className="text-green-400 font-bold">{entry.win_rate}%</p>
                          <p className="text-gray-400 text-xs">Win Rate</p>
                        </div>
                        <div>
                          <p className="text-purple-400 font-bold">{entry.games_played}</p>
                          <p className="text-gray-400 text-xs">Played</p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                gameLeaderboardData.slice(0, 10).map((entry) => (
                  <div
                    key={entry.id}
                    className={`bg-gradient-to-r ${getRankBg(entry.rank)} backdrop-blur-xl border rounded-xl p-4 transition-all hover:scale-[1.02] ${
                      entry.id === profile.id ? 'ring-2 ring-blue-500/50' : ''
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="flex items-center justify-center w-12 h-12">
                          {getRankIcon(entry.rank)}
                        </div>
                        
                        <div>
                          <div className="flex items-center space-x-2">
                            <h4 className="text-white font-bold">{entry.username}</h4>
                            {entry.id === profile.id && (
                              <span className="bg-blue-500 text-white text-xs px-2 py-1 rounded">YOU</span>
                            )}
                          </div>
                          <div className="flex items-center space-x-4 text-sm text-gray-400">
                            {entry.country && <span>🌍 {entry.country}</span>}
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-6 text-right">
                        <div>
                          <p className="text-yellow-400 font-bold">{entry.chips_won.toLocaleString()}</p>
                          <p className="text-gray-400 text-xs">Won</p>
                        </div>
                        <div>
                          <p className="text-green-400 font-bold">{entry.win_rate}%</p>
                          <p className="text-gray-400 text-xs">Win Rate</p>
                        </div>
                        <div>
                          <p className="text-purple-400 font-bold">{entry.games_played}</p>
                          <p className="text-gray-400 text-xs">Played</p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
