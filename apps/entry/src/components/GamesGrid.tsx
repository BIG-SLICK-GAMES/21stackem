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
                <p className="text-orange-300 text-xs font-bold uppercase tracking-wider shadow-none [text-shadow:none]">
                  {game.status}
                </p>
                <h3 className="text-white font-black text-xl shadow-none [text-shadow:none] sm:text-2xl">
                  {game.name}
                </h3>
              </div>

              {game.launchUrl ? (
                <div className="flex justify-center">
                  <button
                    onClick={() => onGameClick(game.id)}
                    className="inline-flex min-w-36 items-center justify-center gap-2 rounded-full border border-orange-300 bg-orange-500 px-6 py-2.5 text-sm font-black text-white shadow-none outline-none backdrop-blur-0 filter-none transition-colors duration-200 [text-shadow:none] hover:border-orange-200 hover:bg-orange-400 active:scale-95"
                  >
                    <Play className="h-4 w-4" />
                    <span>PLAY NOW</span>
                  </button>
                </div>
              ) : (
                <div className="flex justify-center">
                  <Link
                    to={game.infoPath}
                    className="inline-flex min-w-32 items-center justify-center gap-2 rounded-full border border-orange-300 bg-orange-500 px-6 py-2.5 text-sm font-black text-white shadow-none outline-none backdrop-blur-0 filter-none transition-colors duration-200 [text-shadow:none] hover:border-orange-200 hover:bg-orange-400 active:scale-95"
                  >
                    <Info className="h-4 w-4" />
                    <span>INFO</span>
                  </Link>
                </div>
              )}

              {game.launchUrl && (
                <Link
                  to={game.infoPath}
                  className="block text-center text-sm font-semibold text-orange-300 shadow-none [text-shadow:none] hover:text-orange-200"
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
