import { LinearGradient } from "expo-linear-gradient";
import {
  Pressable,
  StyleProp,
  StyleSheet,
  Text,
  TextStyle,
  View,
  ViewStyle
} from "react-native";

import { theme } from "../../theme";

export function GameButton({
  compact = false,
  disabled = false,
  label,
  labelStyle,
  onPress,
  style,
  subtitle,
  subtitleStyle,
  tone = "secondary"
}: {
  compact?: boolean;
  disabled?: boolean;
  label: string;
  labelStyle?: StyleProp<TextStyle>;
  onPress: () => void;
  style?: StyleProp<ViewStyle>;
  subtitle?: string;
  subtitleStyle?: StyleProp<TextStyle>;
  tone?: "primary" | "secondary";
}) {
  return (
    <Pressable
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        compact && styles.buttonCompact,
        tone === "primary" ? styles.primary : styles.secondary,
        disabled && styles.disabled,
        style,
        pressed &&
          !disabled &&
          (tone === "primary" ? styles.primaryPressed : styles.secondaryPressed)
      ]}
    >
      {tone === "primary" ? (
        <LinearGradient
          colors={["#6ec4f1", "#1e5a9e"]}
          end={{ x: 1, y: 1 }}
          start={{ x: 0, y: 0 }}
          style={styles.gradientFill}
        >
          <View style={styles.copy}>
            <Text
              style={[
                styles.label,
                compact && styles.labelCompact,
                styles.labelPrimary,
                labelStyle
              ]}
            >
              {label}
            </Text>
            {subtitle ? (
              <Text
                style={[
                  styles.subtitle,
                  compact && styles.subtitleCompact,
                  styles.subtitlePrimary,
                  subtitleStyle
                ]}
              >
                {subtitle}
              </Text>
            ) : null}
          </View>
        </LinearGradient>
      ) : (
        <View style={styles.copy}>
          <Text
            style={[
              styles.label,
              compact && styles.labelCompact,
              labelStyle
            ]}
          >
            {label}
          </Text>
          {subtitle ? (
            <Text
              style={[
                styles.subtitle,
                compact && styles.subtitleCompact,
                subtitleStyle
              ]}
            >
              {subtitle}
            </Text>
          ) : null}
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    borderRadius: 24,
    minHeight: 82,
    overflow: "hidden",
    paddingHorizontal: 0,
    paddingVertical: 0
  },
  buttonCompact: {
    minHeight: 64
  },
  gradientFill: {
    flex: 1,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md
  },
  primary: {
    shadowColor: "#7ecbff",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 18,
    elevation: 8
  },
  primaryPressed: {
    opacity: 0.88
  },
  secondary: {
    backgroundColor: "rgba(7, 24, 40, 0.88)",
    borderColor: "rgba(84, 130, 171, 0.62)",
    borderWidth: 2,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.24,
    shadowRadius: 12,
    elevation: 4
  },
  secondaryPressed: {
    backgroundColor: theme.colors.cardMuted
  },
  disabled: {
    opacity: 0.5
  },
  copy: {
    gap: 6
  },
  label: {
    color: theme.colors.text,
    flexShrink: 1,
    fontFamily: theme.fonts.display,
    fontSize: 22,
    lineHeight: 24
  },
  labelPrimary: {
    color: "#ffffff"
  },
  labelCompact: {
    fontSize: 16
  },
  subtitle: {
    color: theme.colors.subtleText,
    flexShrink: 1,
    fontFamily: theme.fonts.body,
    fontSize: 14,
    lineHeight: 20
  },
  subtitlePrimary: {
    color: "rgba(255, 255, 255, 0.78)"
  },
  subtitleCompact: {
    fontSize: 12,
    lineHeight: 17
  }
});
