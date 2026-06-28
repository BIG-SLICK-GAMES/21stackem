import { Href, router } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { ScreenContainer } from "../components/layout/ScreenContainer";
import { AppNav } from "../components/layout/AppNav";
import { VIRTUAL_CHIP_NOTICE } from "../platform/compliance/virtual-chips";
import { theme } from "../theme";

const TERMS = [
  {
    body: VIRTUAL_CHIP_NOTICE,
    title: "Virtual Chips"
  },
  {
    body: "Stack'em does not offer real-money gambling, cash withdrawals, cash prizes, crypto rewards, or rewards with real-world value.",
    title: "No Real Money"
  },
  {
    body: "Scores, chips, leaderboards, daily rewards, and game progress are entertainment features only.",
    title: "Entertainment Use"
  },
  {
    body: "Telegram mode opens the same Stack'em web game inside Telegram. Telegram user identity may be used later to connect a player profile, but the game remains virtual-chip only.",
    title: "Telegram Mini App"
  }
];

export function TermsScreen() {
  return (
    <ScreenContainer scroll contentContainerStyle={styles.content}>
      <AppNav />
      <View style={styles.hero}>
        <Text style={styles.kicker}>Compliance</Text>
        <Text style={styles.title}>Virtual Chip Terms</Text>
        <Text style={styles.body}>
          Stack'em is a casual card puzzle game. Chips are used only for scoring,
          progression, and leaderboard play.
        </Text>
        <Pressable
          onPress={() => router.push("/stackem" as Href)}
          style={({ pressed }) => [styles.action, pressed && styles.actionPressed]}
        >
          <Text style={styles.actionText}>Back To Lobby</Text>
        </Pressable>
      </View>

      {TERMS.map((term) => (
        <View key={term.title} style={styles.card}>
          <Text style={styles.cardTitle}>{term.title}</Text>
          <Text style={styles.cardBody}>{term.body}</Text>
        </View>
      ))}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  action: {
    alignItems: "center",
    alignSelf: "flex-start",
    backgroundColor: "rgba(110, 255, 186, 0.14)",
    borderColor: "rgba(110, 255, 186, 0.34)",
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    justifyContent: "center",
    minHeight: 44,
    paddingHorizontal: theme.spacing.lg
  },
  actionPressed: { opacity: 0.86 },
  actionText: {
    color: theme.colors.text,
    fontFamily: theme.fonts.label,
    fontSize: 12,
    letterSpacing: 1.2,
    textTransform: "uppercase"
  },
  body: {
    color: theme.colors.subtleText,
    fontFamily: theme.fonts.body,
    fontSize: 15,
    lineHeight: 22,
    maxWidth: 1000
  },
  card: {
    backgroundColor: "rgba(5, 18, 30, 0.92)",
    borderColor: "rgba(105, 150, 190, 0.56)",
    borderRadius: theme.radius.xl,
    borderWidth: 1,
    gap: theme.spacing.sm,
    padding: theme.spacing.lg,
    width: "100%"
  },
  cardBody: {
    color: theme.colors.subtleText,
    fontFamily: theme.fonts.body,
    fontSize: 15,
    lineHeight: 22
  },
  cardTitle: {
    color: theme.colors.text,
    fontFamily: theme.fonts.bodyBold,
    fontSize: 20
  },
  content: {
    gap: theme.spacing.lg,
    marginHorizontal: "auto",
    maxWidth: 430,
    paddingBottom: theme.spacing.xxxl + 96,
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.xl,
    width: "100%"
  },
  hero: {
    gap: theme.spacing.sm
  },
  kicker: {
    color: theme.colors.subtleText,
    fontFamily: theme.fonts.label,
    fontSize: 11,
    letterSpacing: 1.8,
    textTransform: "uppercase"
  },
  title: {
    color: theme.colors.text,
    fontFamily: theme.fonts.display,
    fontSize: 36,
    lineHeight: 36
  }
});
