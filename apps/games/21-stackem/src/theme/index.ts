import { Platform } from "react-native";

export const theme = {
  colors: {
    background: "#020b13",
    backgroundAlt: "#071c2c",
    card: "rgba(7, 24, 38, 0.84)",
    cardMuted: "rgba(20, 56, 84, 0.78)",
    border: "rgba(118, 169, 207, 0.44)",
    surface: "#5fa7e7",
    surfacePressed: "#347ec0",
    accent: "#9edfff",
    text: "#f5f8ff",
    subtleText: "#9fb7ca",
    warning: "#ffcc73",
    joystickBase: "rgba(58, 111, 156, 0.28)",
    joystickKnob: "#8bd2ff",
    player: "#8bd2ff",
    orb: "#ffd678",
    hazard: "#ff6f7f"
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
