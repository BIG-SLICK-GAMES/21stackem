import { StyleProp, StyleSheet, Text, View, ViewStyle } from "react-native";

import { theme } from "../../theme";

export function HubPanel({
  children,
  style,
  subtitle,
  title
}: {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  subtitle?: string;
  title: string;
}) {
  return (
    <View style={[styles.panel, style]}>
      <View pointerEvents="none" style={styles.glare} />
      <View style={styles.header}>
        <Text style={styles.title}>{title}</Text>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      </View>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  panel: {
    backgroundColor: "rgba(5, 18, 30, 0.92)",
    borderColor: "rgba(105, 150, 190, 0.56)",
    borderRadius: 30,
    borderWidth: 2,
    elevation: 7,
    gap: theme.spacing.md,
    overflow: "hidden",
    padding: theme.spacing.lg,
    shadowColor: "#7ecbff",
    shadowOffset: { height: 12, width: 0 },
    shadowOpacity: 0.18,
    shadowRadius: 22
  },
  glare: {
    backgroundColor: "rgba(210, 240, 255, 0.05)",
    height: 28,
    left: 0,
    position: "absolute",
    right: 0,
    top: 0
  },
  header: {
    gap: 6
  },
  subtitle: {
    color: theme.colors.subtleText,
    fontFamily: theme.fonts.body,
    fontSize: 14,
    lineHeight: 20
  },
  title: {
    color: theme.colors.text,
    fontFamily: theme.fonts.display,
    fontSize: 30,
    lineHeight: 32
  }
});
