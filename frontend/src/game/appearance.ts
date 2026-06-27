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
    bannerAccent: "#ffd678",
    bannerGlowCool: "rgba(129, 201, 255, 0.24)",
    bannerGlowWarm: "rgba(255, 214, 120, 0.16)",
    bannerGradient: ["#173855", "#061421", "#0a1e2c"]
  },
  ocean: {
    bannerAccent: "#9edfff",
    bannerGlowCool: "rgba(142, 217, 255, 0.26)",
    bannerGlowWarm: "rgba(255, 214, 120, 0.14)",
    bannerGradient: ["#123452", "#061420", "#09283b"]
  },
  sunset: {
    bannerAccent: "#ffd678",
    bannerGlowCool: "rgba(129, 201, 255, 0.2)",
    bannerGlowWarm: "rgba(255, 214, 120, 0.22)",
    bannerGradient: ["#1b3445", "#07131f", "#382515"]
  }
};

const BOARDS: Record<BoardPaletteKey, Pick<StackemAppearance, "boardBackground" | "boardBorder" | "cellBackground" | "cellBorder" | "cellPlayableBorder" | "lineLockedBackground" | "lineNeutralBackground" | "lineText">> = {
  felt: {
    boardBackground: "rgba(4, 17, 29, 0.95)",
    boardBorder: "rgba(112, 164, 205, 0.42)",
    cellBackground: "rgba(12, 40, 62, 0.74)",
    cellBorder: "rgba(117, 167, 206, 0.24)",
    cellPlayableBorder: "rgba(159, 224, 255, 0.55)",
    lineLockedBackground: "rgba(88, 159, 213, 0.32)",
    lineNeutralBackground: "rgba(22, 55, 81, 0.7)",
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
    boardBackground: "rgba(9, 18, 28, 0.96)",
    boardBorder: "rgba(255, 214, 120, 0.28)",
    cellBackground: "rgba(24, 42, 58, 0.78)",
    cellBorder: "rgba(255, 214, 120, 0.16)",
    cellPlayableBorder: "rgba(255, 221, 139, 0.42)",
    lineLockedBackground: "rgba(255, 214, 120, 0.24)",
    lineNeutralBackground: "rgba(22, 55, 81, 0.66)",
    lineText: "#fff8e8"
  }
};

const TILES: Record<TilePaletteKey, Pick<StackemAppearance, "tileCoreGlow" | "tileGloss" | "tileRank" | "tileSurface">> = {
  ivory: {
    tileCoreGlow: "rgba(158, 223, 255, 0.28)",
    tileGloss: [
      "rgba(190, 235, 255, 0.72)",
      "rgba(55, 126, 190, 0.42)",
      "rgba(3, 18, 32, 0.2)"
    ],
    tileRank: "#f7fbff",
    tileSurface: ["#6bb6ee", "#1f5f9d", "#0b2742"]
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
    tileCoreGlow: "rgba(255, 214, 120, 0.22)",
    tileGloss: [
      "rgba(255, 236, 178, 0.7)",
      "rgba(88, 140, 190, 0.32)",
      "rgba(4, 19, 32, 0.24)"
    ],
    tileRank: "#fff8df",
    tileSurface: ["#5fa7e7", "#235f99", "#112a43"]
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
