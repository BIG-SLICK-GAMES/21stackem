import { Href, router } from "expo-router";
import { StyleSheet, Text, View } from "react-native";

import { theme } from "../../theme";
import { GameButton } from "../ui/GameButton";

export function HubAccessGate({
  ctaLabel = "Open Auth",
  message
}: {
  ctaLabel?: string;
  message: string;
}) {
  return (
    <View style={styles.card}>
      <Text style={styles.title}>Hub session required</Text>
      <Text style={styles.body}>{message}</Text>
      <GameButton
        label={ctaLabel}
        onPress={() => {
          router.push("/auth" as Href);
        }}
        subtitle="Sign in or create a user account"
        tone="primary"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  body: {
    color: theme.colors.subtleText,
    fontFamily: theme.fonts.body,
    fontSize: 15,
    lineHeight: 22
  },
  card: {
    backgroundColor: "rgba(5, 18, 30, 0.92)",
    borderColor: "rgba(105, 150, 190, 0.56)",
    borderRadius: 30,
    borderWidth: 2,
    elevation: 7,
    gap: theme.spacing.md,
    padding: theme.spacing.lg,
    shadowColor: "#7ecbff",
    shadowOffset: { height: 12, width: 0 },
    shadowOpacity: 0.18,
    shadowRadius: 22
  },
  title: {
    color: theme.colors.text,
    fontFamily: theme.fonts.display,
    fontSize: 30,
    lineHeight: 32
  }
});
