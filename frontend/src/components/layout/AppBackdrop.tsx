import { LinearGradient } from "expo-linear-gradient";
import { StyleSheet, View } from "react-native";

import { theme } from "../../theme";

const GRID_H_POSITIONS = [90, 200, 320, 450, 590, 740, 880];
const GRID_V_POSITIONS = [75, 175, 285, 390];

export function AppBackdrop() {
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      <LinearGradient
        colors={[
          theme.colors.background,
          theme.colors.backgroundAlt,
          theme.colors.background
        ]}
        end={{ x: 1, y: 1 }}
        start={{ x: 0, y: 0 }}
        style={StyleSheet.absoluteFill}
      />
      {GRID_H_POSITIONS.map((top) => (
        <View key={`gh${top}`} style={[styles.gridLineH, { top }]} />
      ))}
      {GRID_V_POSITIONS.map((left) => (
        <View key={`gv${left}`} style={[styles.gridLineV, { left }]} />
      ))}
      <View style={styles.glowCyan} />
      <View style={styles.glowMagenta} />
      <View style={styles.glowBlue} />
      <View style={styles.glowPurple} />
      <View style={styles.outerVeil} />
    </View>
  );
}

const styles = StyleSheet.create({
  gridLineH: {
    backgroundColor: "rgba(118, 169, 207, 0.08)",
    height: 1,
    left: 0,
    position: "absolute",
    right: 0
  },
  gridLineV: {
    backgroundColor: "rgba(118, 169, 207, 0.07)",
    bottom: 0,
    position: "absolute",
    top: 0,
    width: 1
  },
  glowCyan: {
    backgroundColor: "rgba(95, 167, 231, 0.13)",
    borderRadius: 300,
    height: 300,
    left: -80,
    position: "absolute",
    top: 40,
    width: 300
  },
  glowMagenta: {
    backgroundColor: "rgba(255, 214, 120, 0.07)",
    borderRadius: 240,
    height: 240,
    position: "absolute",
    right: -60,
    top: 110,
    width: 240
  },
  glowBlue: {
    backgroundColor: "rgba(44, 102, 153, 0.12)",
    borderRadius: 360,
    bottom: -50,
    height: 360,
    position: "absolute",
    right: -100,
    width: 360
  },
  glowPurple: {
    backgroundColor: "rgba(20, 56, 84, 0.12)",
    borderRadius: 220,
    bottom: 80,
    height: 220,
    left: -60,
    position: "absolute",
    width: 220
  },
  outerVeil: {
    borderColor: "rgba(118, 169, 207, 0.12)",
    borderWidth: 1,
    inset: 18,
    position: "absolute"
  }
});
