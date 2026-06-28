import {
  BoardPaletteKey,
  TilePaletteKey,
  VisualThemeKey
} from "../types/settings";

export type StackemAppearance = {
  bannerAccent: string;
  bannerGlowCool: string;
  bannerGlowWarm: string;
  bannerGradient: [string, string, string];
  boardBackground: string;
  boardBorder: string;
  cellBackground: string;
  cellBorder: string;
  cellPlayableBorder: string;
  lineLockedBackground: string;
  lineNeutralBackground: string;
  lineText: string;
  tileCoreGlow: string;
  tileGloss: [string, string, string];
  tileRank: string;
  tileSurface: [string, string, string];
};

const THEMES: Record<VisualThemeKey, Pick<StackemAppearance, "bannerAccent" | "bannerGlowCool" | "bannerGlowWarm" | "bannerGradient">> = {
  classic: {
    bannerAccent: "#d7ecfb",
    bannerGlowCool: "rgba(111, 168, 216, 0.24)",
    bannerGlowWarm: "rgba(155, 130, 217, 0.12)",
    bannerGradient: ["#26394c", "#172433", "#101d2b"]
  },
  ocean: {
    bannerAccent: "#d7ecfb",
    bannerGlowCool: "rgba(111, 168, 216, 0.28)",
    bannerGlowWarm: "rgba(131, 190, 220, 0.18)",
    bannerGradient: ["#2a4860", "#172433", "#10283b"]
  },
  sunset: {
    bannerAccent: "#d7ecfb",
    bannerGlowCool: "rgba(111, 168, 216, 0.22)",
    bannerGlowWarm: "rgba(216, 154, 98, 0.16)",
    bannerGradient: ["#2c4054", "#172433", "#263045"]
  }
};

const BOARDS: Record<BoardPaletteKey, Pick<StackemAppearance, "boardBackground" | "boardBorder" | "cellBackground" | "cellBorder" | "cellPlayableBorder" | "lineLockedBackground" | "lineNeutralBackground" | "lineText">> = {
  felt: {
    boardBackground: "rgba(22, 36, 50, 0.96)",
    boardBorder: "rgba(133, 169, 195, 0.54)",
    cellBackground: "rgba(25, 42, 58, 0.86)",
    cellBorder: "rgba(103, 137, 163, 0.54)",
    cellPlayableBorder: "rgba(111, 168, 216, 0.68)",
    lineLockedBackground: "rgba(111, 168, 216, 0.34)",
    lineNeutralBackground: "rgba(30, 52, 70, 0.92)",
    lineText: "#f5f8ff"
  },
  midnight: {
    boardBackground: "rgba(3, 13, 24, 0.96)",
    boardBorder: "rgba(133, 183, 255, 0.38)",
    cellBackground: "rgba(12, 36, 59, 0.78)",
    cellBorder: "rgba(145, 174, 231, 0.22)",
    cellPlayableBorder: "rgba(157, 224, 255, 0.5)",
    lineLockedBackground: "rgba(94, 173, 255, 0.28)",
    lineNeutralBackground: "rgba(255, 255, 255, 0.08)",
    lineText: "#f5f8ff"
  },
  ember: {
    boardBackground: "rgba(23, 36, 50, 0.96)",
    boardBorder: "rgba(155, 130, 217, 0.34)",
    cellBackground: "rgba(43, 48, 72, 0.78)",
    cellBorder: "rgba(155, 130, 217, 0.2)",
    cellPlayableBorder: "rgba(168, 148, 220, 0.46)",
    lineLockedBackground: "rgba(155, 130, 217, 0.24)",
    lineNeutralBackground: "rgba(30, 52, 70, 0.66)",
    lineText: "#f5f8ff"
  }
};

const TILES: Record<TilePaletteKey, Pick<StackemAppearance, "tileCoreGlow" | "tileGloss" | "tileRank" | "tileSurface">> = {
  ivory: {
    tileCoreGlow: "rgba(255, 255, 255, 0.18)",
    tileGloss: [
      "rgba(255, 255, 255, 0.22)",
      "rgba(255, 255, 255, 0.04)",
      "rgba(0, 0, 0, 0.08)"
    ],
    tileRank: "#ffffff",
    tileSurface: ["#effbff", "#83bedc", "#2d6080"]
  },
  jade: {
    tileCoreGlow: "rgba(158, 223, 255, 0.3)",
    tileGloss: [
      "rgba(210, 245, 255, 0.78)",
      "rgba(78, 155, 210, 0.38)",
      "rgba(2, 22, 37, 0.24)"
    ],
    tileRank: "#ffffff",
    tileSurface: ["#84d4f4", "#2f74aa", "#0c2d48"]
  },
  rose: {
    tileCoreGlow: "rgba(168, 148, 220, 0.22)",
    tileGloss: [
      "rgba(255, 236, 178, 0.7)",
      "rgba(88, 140, 190, 0.32)",
      "rgba(4, 19, 32, 0.24)"
    ],
    tileRank: "#f8fbff",
    tileSurface: ["#f8f4ff", "#a894dc", "#4f4184"]
  }
};

export function getStackemAppearance(settings: {
  boardPalette: BoardPaletteKey;
  tilePalette: TilePaletteKey;
  visualTheme: VisualThemeKey;
}): StackemAppearance {
  return {
    ...THEMES[settings.visualTheme],
    ...BOARDS[settings.boardPalette],
    ...TILES[settings.tilePalette]
  };
}
