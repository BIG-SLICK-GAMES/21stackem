import { Platform } from "react-native";

export const theme = {
  colors: {
    background: "#172433",
    backgroundAlt: "#101d2b",
    card: "rgba(20, 34, 48, 0.84)",
    cardMuted: "rgba(30, 52, 70, 0.78)",
    border: "rgba(133, 169, 195, 0.44)",
    surface: "#6fa8d8",
    surfacePressed: "#416c91",
    accent: "#d7ecfb",
    text: "#f5f8ff",
    subtleText: "#9fb7ca",
    warning: "#d89a62",
    joystickBase: "rgba(111, 168, 216, 0.24)",
    joystickKnob: "#d7ecfb",
    player: "#d7ecfb",
    orb: "#6fa8d8",
    hazard: "#d87373"
  },
  spacing: {
    xs: 6,
    sm: 10,
    md: 16,
    lg: 22,
    xl: 28,
    xxl: 36,
    xxxl: 52
  },
  radius: {
    md: 14,
    lg: 18,
    xl: 24
  },
  fonts: {
    display: Platform.select({
      ios: "AvenirNextCondensed-Heavy",
      android: "sans-serif-condensed",
      default: "System"
    }),
    body: Platform.select({
      ios: "Avenir Next",
      android: "sans-serif",
      default: "System"
    }),
    bodyBold: Platform.select({
      ios: "AvenirNext-DemiBold",
      android: "sans-serif-medium",
      default: "System"
    }),
    label: Platform.select({
      ios: "AvenirNextCondensed-DemiBold",
      android: "sans-serif-medium",
      default: "System"
    })
  }
} as const;

export function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}
