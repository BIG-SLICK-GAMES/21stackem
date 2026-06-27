import React from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, Play } from "lucide-react";

import { getGameById } from "../data/gameCatalog";
import { getStackemLaunchUrl } from "../lib/bsgApi";

export default function GameInfoPage() {
  const { gameId } = useParams();
  const game = getGameById(gameId);
  const launchUrl =
    game?.id === "stack-em"
        ? getStackemLaunchUrl()
        : game?.launchUrl;

  if (!game) {
    return (
      <main className="min-h-screen px-4 py-8 text-white">
        <div className="mx-auto max-w-3xl">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-orange-300 hover:text-orange-200 font-semibold"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to hub
          </Link>
          <h1 className="mt-8 text-3xl font-black">Game not found</h1>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen px-4 py-8 text-white">
      <div className="mx-auto max-w-4xl">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-orange-300 hover:text-orange-200 font-semibold"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to hub
        </Link>

        <section className="mt-8 grid gap-8 md:grid-cols-[220px_1fr] md:items-start">
          <div className="flex justify-center md:justify-start">
            <img
              src={game.bannerImage}
              alt={`${game.name} icon`}
              className="h-48 w-48 object-contain sm:h-56 sm:w-56"
            />
          </div>

          <div>
            <p className="text-orange-300 text-xs font-bold uppercase tracking-wider shadow-none [text-shadow:none]">
              {game.status}
            </p>
            <h1 className="mt-2 text-4xl font-black shadow-none [text-shadow:none] sm:text-5xl">{game.name}</h1>
            <p className="mt-3 text-lg font-semibold text-orange-100 shadow-none [text-shadow:none]">
              {game.tagline}
            </p>
            <p className="mt-5 text-base leading-7 text-white/80">
              {game.description}
            </p>

            <ul className="mt-6 space-y-3 text-sm leading-6 text-white/75">
              {game.details.map((detail) => (
                <li key={detail} className="border-l-2 border-orange-400/60 pl-4">
                  {detail}
                </li>
              ))}
            </ul>

            {launchUrl && (
              <a
                href={launchUrl}
                className="mt-8 inline-flex min-w-36 items-center justify-center gap-2 rounded-full border border-orange-300 bg-orange-500 px-6 py-2.5 text-sm font-black text-white shadow-none outline-none backdrop-blur-0 filter-none transition-colors duration-200 [text-shadow:none] hover:border-orange-200 hover:bg-orange-400 active:scale-95"
              >
                <Play className="h-4 w-4" />
                PLAY NOW
              </a>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
