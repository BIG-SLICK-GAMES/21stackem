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
    bannerAccent: "#ffb02e",
    bannerGlowCool: "rgba(50, 210, 255, 0.18)",
    bannerGlowWarm: "rgba(255, 144, 36, 0.24)",
    bannerGradient: ["#172640", "#0a1020", "#20112f"]
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
    boardBackground: "rgba(12, 18, 35, 0.98)",
    boardBorder: "rgba(255, 176, 46, 0.55)",
    cellBackground: "rgba(24, 32, 56, 0.92)",
    cellBorder: "rgba(255, 255, 255, 0.12)",
    cellPlayableBorder: "rgba(255, 176, 46, 0.72)",
    lineLockedBackground: "rgba(38, 209, 124, 0.34)",
    lineNeutralBackground: "rgba(38, 48, 78, 0.92)",
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
    tileCoreGlow: "rgba(255, 255, 255, 0.18)",
    tileGloss: [
      "rgba(255, 255, 255, 0.22)",
      "rgba(255, 255, 255, 0.04)",
      "rgba(0, 0, 0, 0.08)"
    ],
    tileRank: "#ffffff",
    tileSurface: ["#ff9b21", "#f97316", "#b84208"]
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
