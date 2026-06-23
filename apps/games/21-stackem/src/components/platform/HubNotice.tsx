import { StyleSheet, Text, View } from "react-native";

import { theme } from "../../theme";

type HubNoticeTone = "error" | "info" | "success";

export function HubNotice({
  message,
  tone = "info"
}: {
  message: string;
  tone?: HubNoticeTone;
}) {
  return (
    <View style={[styles.notice, tone === "error" && styles.error, tone === "success" && styles.success]}>
      <Text style={styles.text}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  error: {
    backgroundColor: "rgba(255, 0, 60, 0.12)",
    borderColor: "rgba(255, 0, 60, 0.38)"
  },
  notice: {
    backgroundColor: "rgba(0, 200, 255, 0.08)",
    borderColor: "rgba(0, 200, 255, 0.3)",
    borderRadius: theme.radius.md,
    borderWidth: 1,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm
  },
  success: {
    backgroundColor: "rgba(0, 220, 180, 0.09)",
    borderColor: "rgba(0, 220, 180, 0.32)"
  },
  text: {
    color: theme.colors.text,
    fontFamily: theme.fonts.body,
    fontSize: 14,
    lineHeight: 20
  }
});
