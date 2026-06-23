import React from "react";

interface ScrollingAdsProps {
  onGameClick: (gameId: string) => void;
}

const ads = [
  {
    id: "stack-em",
    text: "STACK'EM",
    subtitle: "Build Your Way to Victory",
    emoji: "🎯",
    gradient: "from-orange-500 to-red-500",
    glow: "shadow-orange-500/50",
  },
  {
    id: "sink-em",
    text: "DECK REALMS",
    subtitle: "Ultimate Card Combinations",
    emoji: "🃏",
    gradient: "from-yellow-500 to-orange-500",
    glow: "shadow-yellow-500/50",
  },
  {
    id: "multi-up",
    text: "MULTI'UP",
    subtitle: "Progressive Big Wins",
    emoji: "🚀",
    gradient: "from-purple-500 to-pink-500",
    glow: "shadow-purple-500/50",
  },
  {
    id: "pokeroply",
    text: "POKER'OPLY",
    subtitle: "Poker Meets Property",
    emoji: "🏆",
    gradient: "from-green-500 to-emerald-500",
    glow: "shadow-green-500/50",
  },
  {
    id: "space-crash",
    text: "SPACE CRASH",
    subtitle: "Crash Landing Adventure",
    emoji: "🌌",
    gradient: "from-blue-500 to-purple-500",
    glow: "shadow-blue-500/50",
  },
];

export default function ScrollingAds({ onGameClick }: ScrollingAdsProps) {
  return (
    <div className="relative overflow-hidden">
      {/* Background Glow Effects */}
      <div className="absolute inset-0 bg-gradient-to-r from-orange-500/5 via-red-500/5 to-purple-500/5 blur-xl"></div>

      {/* Main Container */}
      <div className="relative bg-gradient-to-br from-gray-900/95 via-gray-800/95 to-gray-900/95 backdrop-blur-xl border border-orange-500/30 rounded-2xl overflow-hidden shadow-2xl">
        {/* Top Accent Bar */}
        <div className="h-1 bg-gradient-to-r from-orange-500 via-red-500 to-purple-500"></div>

        {/* Header */}
        <div className="bg-gradient-to-r from-orange-500/10 to-red-500/10 border-b border-gray-700/50 px-6 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse"></div>
              <span className="text-white font-bold text-sm">
                FEATURED GAMES
              </span>
              <span className="px-2 py-0.5 bg-orange-500/20 text-orange-400 text-xs font-bold rounded-full">
                LIVE
              </span>
            </div>
            <div className="text-xs text-gray-400">
              🔥 <span className="font-semibold">Trending Now</span>
            </div>
          </div>
        </div>

        {/* Scrolling Content */}
        <div className="relative py-6">
          {/* Fade Edges */}
          <div className="absolute left-0 top-0 bottom-0 w-20 bg-gradient-to-r from-gray-900 via-gray-900/80 to-transparent z-10 pointer-events-none"></div>
          <div className="absolute right-0 top-0 bottom-0 w-20 bg-gradient-to-l from-gray-900 via-gray-900/80 to-transparent z-10 pointer-events-none"></div>

          {/* Scrolling Track */}
          <div className="animate-scroll flex items-center space-x-4">
            {[...ads, ...ads, ...ads].map((ad, index) => (
              <button
                key={`${ad.id}-${index}`}
                onClick={() => onGameClick(ad.id)}
                className="group relative flex-shrink-0"
              >
                {/* Card */}
                <div
                  className={`relative bg-gradient-to-br from-gray-800/90 to-gray-900/90 backdrop-blur-sm border border-gray-700/50 rounded-xl px-6 py-4 min-w-[280px] hover:border-gray-600 transition-all duration-300 hover:scale-105 hover:shadow-xl ${ad.glow}`}
                >
                  {/* Gradient Overlay on Hover */}
                  <div
                    className={`absolute inset-0 bg-gradient-to-r ${ad.gradient} opacity-0 group-hover:opacity-10 rounded-xl transition-opacity duration-300`}
                  ></div>

                  <div className="relative flex items-center space-x-4">
                    {/* Icon */}
                    <div
                      className={`w-12 h-12 bg-gradient-to-br ${ad.gradient} rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300`}
                    >
                      <span className="text-2xl">{ad.emoji}</span>
                    </div>

                    {/* Text Content */}
                    <div className="flex-1 text-left">
                      <h4 className="text-white font-bold text-sm mb-0.5 group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-white group-hover:to-gray-300 transition-all">
                        {ad.text}
                      </h4>
                      <p className="text-gray-400 text-xs">{ad.subtitle}</p>
                    </div>

                    {/* Arrow */}
                    <div className="text-gray-500 group-hover:text-white group-hover:translate-x-1 transition-all duration-300">
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 5l7 7-7 7"
                        />
                      </svg>
                    </div>
                  </div>

                  {/* Badge */}
                  <div className="absolute -top-2 -right-2 px-2 py-0.5 bg-gradient-to-r from-orange-500 to-red-500 text-white text-xs font-bold rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    PLAY
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Bottom Info Bar */}
        <div className="bg-gray-800/50 border-t border-gray-700/50 px-6 py-2.5 flex items-center justify-between">
          <div className="flex items-center space-x-4 text-xs text-gray-400">
            <span className="flex items-center space-x-1">
              <span>⚡</span>
              <span>Instant play</span>
            </span>
            <span className="w-1 h-1 bg-gray-600 rounded-full"></span>
            <span className="flex items-center space-x-1">
              <span>🎁</span>
              <span>Daily rewards</span>
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse"></div>
            <span className="text-xs text-green-400 font-medium">
              All games active
            </span>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes scroll {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-33.333%);
          }
        }
        
        .animate-scroll {
          animation: scroll 35s linear infinite;
          will-change: transform;
        }

        .animate-scroll:hover {
          animation-play-state: paused;
        }
      `}</style>
    </div>
  );
}

