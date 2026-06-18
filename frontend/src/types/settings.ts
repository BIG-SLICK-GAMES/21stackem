export type OrientationPreference = "adaptive" | "portrait" | "landscape";
export type HapticsLevel = "off" | "subtle" | "full";
export type HandPreference = "left" | "right";
export type VisualThemeKey = "classic" | "ocean" | "sunset";
export type TilePaletteKey = "ivory" | "jade" | "rose";
export type BoardPaletteKey = "felt" | "midnight" | "ember";

export interface GameSettings {
  boardPalette: BoardPaletteKey;
  orientation: OrientationPreference;
  haptics: HapticsLevel;
  handPreference: HandPreference;
  keepAwake: boolean;
  showTouchGuide: boolean;
  reducedMotion: boolean;
  tilePalette: TilePaletteKey;
  visualTheme: VisualThemeKey;
}

export const DEFAULT_SETTINGS: GameSettings = {
  boardPalette: "felt",
  orientation: "adaptive",
  haptics: "full",
  handPreference: "right",
  keepAwake: true,
  showTouchGuide: true,
  reducedMotion: false,
  tilePalette: "ivory",
  visualTheme: "classic"
};
