import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Info, Play } from "lucide-react";

import { gameCatalog } from "../data/gameCatalog";

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

interface GamesGridProps {
  onGameClick: (gameId: string) => void;
  profile: UserProfile;
}

export default function GamesGrid({ onGameClick }: GamesGridProps) {
  const [animatedGames, setAnimatedGames] = useState<Set<string>>(new Set());

  useEffect(() => {
    gameCatalog.forEach((game, index) => {
      setTimeout(() => {
        setAnimatedGames((current) => new Set([...current, game.id]));
      }, index * 90);
    });
  }, []);

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 pb-8">
      {gameCatalog.map((game, index) => {
        const isAnimated = animatedGames.has(game.id);

        return (
          <div
            key={game.id}
            className={`transform transition-all duration-500 ${
              isAnimated ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"
            }`}
            style={{ transitionDelay: `${index * 80}ms` }}
          >
            <div className="space-y-4">
              <div className="flex justify-center">
                <img
                  src={game.bannerImage}
                  alt={`${game.name} icon`}
                  className="block h-40 w-40 object-contain sm:h-48 sm:w-48"
                />
              </div>

              <div className="text-center">
                <p className="text-orange-300 text-xs font-bold uppercase tracking-wider">
                  {game.status}
                </p>
                <h3 className="text-white font-black text-xl sm:text-2xl">
                  {game.name}
                </h3>
              </div>

              {game.launchUrl ? (
                <button
                  onClick={() => onGameClick(game.id)}
                  className={`w-full bg-gradient-to-r ${game.color} ${game.hoverColor} text-white py-3 font-bold text-base transition-all duration-300 rounded-lg shadow-lg ${game.glowColor} hover:shadow-xl flex items-center justify-center gap-2 active:scale-95 hover:scale-[1.02] border border-white/20 hover:border-white/40`}
                >
                  <Play className="w-5 h-5" />
                  <span>PLAY NOW</span>
                </button>
              ) : (
                <Link
                  to={game.infoPath}
                  className={`w-full bg-gradient-to-r ${game.color} ${game.hoverColor} text-white py-3 font-bold text-base transition-all duration-300 rounded-lg shadow-lg ${game.glowColor} hover:shadow-xl flex items-center justify-center gap-2 active:scale-95 hover:scale-[1.02] border border-white/20 hover:border-white/40`}
                >
                  <Info className="w-5 h-5" />
                  <span>INFO</span>
                </Link>
              )}

              {game.launchUrl && (
                <Link
                  to={game.infoPath}
                  className="block text-center text-sm text-orange-300 hover:text-orange-200 font-semibold"
                >
                  View game information
                </Link>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
