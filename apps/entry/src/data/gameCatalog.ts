import { Club, Spade as Spades, type LucideIcon } from "lucide-react";

export type GameCatalogItem = {
  accent: string;
  bannerImage: string;
  color: string;
  description: string;
  details: string[];
  glowColor: string;
  headerBorder: string;
  headerGlass: string;
  hoverColor: string;
  icon: LucideIcon;
  id: "poker-opoly" | "stack-em";
  infoPath: string;
  launchUrl?: string;
  minBet?: number;
  name: string;
  status: "Live" | "Offline build" | "Planned";
  tagline: string;
};

export const gameCatalog: GameCatalogItem[] = [
  {
    accent: "green",
    bannerImage: "/hub-images/21-stackem.png",
    color: "from-green-600 to-green-900",
    description: "The new local Stackem game wired into the BSG platform.",
    details: [
      "Runs locally from D:\\BSG PLATFORM\\apps\\games\\21-stackem.",
      "Launches from the entry app with the current BSG session when available.",
      "Uses the BSG platform account and wallet direction."
    ],
    glowColor: "shadow-green-700/40",
    headerBorder: "border-green-500/40",
    headerGlass: "from-green-600/20 via-green-700/15 to-green-800/20",
    hoverColor: "hover:from-green-500 hover:to-green-800",
    icon: Club,
    id: "stack-em",
    infoPath: "/games/stack-em",
    launchUrl: "http://127.0.0.1:8094/stackem",
    minBet: 100,
    name: "21 Stack'em",
    status: "Offline build",
    tagline: "Local game integration"
  },
  {
    accent: "emerald",
    bannerImage: "/hub-images/pokeropoly.png",
    color: "from-emerald-300 to-green-900",
    description: "Poker hand strategy blended with board-game trading.",
    details: [
      "Kept as an offline platform game candidate.",
      "Needs profile, wallet, and room/session behavior reviewed before production use.",
      "Information page is ready now; live launch remains gated."
    ],
    glowColor: "shadow-emerald-500/40",
    headerBorder: "border-emerald-300/40",
    headerGlass: "from-emerald-400/20 via-green-400/15 to-emerald-500/20",
    hoverColor: "hover:from-emerald-200 hover:to-green-800",
    icon: Spades,
    id: "poker-opoly",
    infoPath: "/games/poker-opoly",
    minBet: 250,
    name: "Poker'oply",
    status: "Planned",
    tagline: "Board strategy candidate"
  }
];

export function getGameById(gameId: string | undefined) {
  return gameCatalog.find((game) => game.id === gameId);
}
