import { Href, router } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { ScreenContainer } from "../components/layout/ScreenContainer";
import { VIRTUAL_CHIP_NOTICE } from "../platform/compliance/virtual-chips";
import { theme } from "../theme";

const RULES = [
  {
    body: "Every run lasts 3 minutes. If you bank the run early, every full 10 seconds left multiplies the final score by 1.3x.",
    title: "Timer"
  },
  {
    body: "Easy starts with 0 filled tiles and pays x2 to x5. Medium starts with 3 filled tiles and pays x5.5 to x7.5. Hard starts with 6 filled tiles and pays x8 to x12.5.",
    title: "Difficulties"
  },
  {
    body: "Each difficulty gets 3 free games per day. After that, extra games cost 50 chips. Rewards are based on 50 chips even when the game was free.",
    title: "Entry"
  },
  {
    body: "Rows and columns score like blackjack. Aces flex between 1 and 11, face cards are 10, and lines that hit 21 lock in green.",
    title: "21 Lines"
  },
  {
    body: "Wild lets you choose any value from A to 10 on an empty square. Swap replaces an occupied square with any value you choose.",
    title: "Special Tiles"
  },
  {
    body: "Undo rewinds the last move. X2 doubles new 21 payouts for 10 seconds and recharges in 40 seconds. Lightning cashes all current 21s for 1.5x and recharges in 60 seconds.",
    title: "Power-Ups"
  },
  {
    body: VIRTUAL_CHIP_NOTICE,
    title: "Virtual Chips"
  }
];

export function HowToPlayScreen() {
  return (
    <ScreenContainer scroll contentContainerStyle={styles.content}>
      <View style={styles.hero}>
        <Text style={styles.kicker}>Rules</Text>
        <Text style={styles.title}>21 Stackem Rules</Text>
        <Text style={styles.body}>
          The current run format, scoring, special tiles, and power-ups all in one place.
        </Text>
        <Pressable
          onPress={() => router.push("/terms" as Href)}
          style={({ pressed }) => [styles.heroAction, pressed && styles.heroActionPressed]}
        >
          <Text style={styles.heroActionText}>Virtual Chip Terms</Text>
        </Pressable>
      </View>

      {RULES.map((rule) => (
        <View key={rule.title} style={styles.card}>
          <Text style={styles.cardTitle}>{rule.title}</Text>
          <Text style={styles.cardBody}>{rule.body}</Text>
        </View>
      ))}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  body: {
    color: theme.colors.subtleText,
    fontFamily: theme.fonts.body,
    fontSize: 15,
    lineHeight: 22,
    maxWidth: 1000
  },
  card: {
    backgroundColor: theme.colors.card,
    borderColor: theme.colors.border,
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
  heroAction: {
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
  heroActionPressed: {
    opacity: 0.86
  },
  heroActionText: {
    color: theme.colors.text,
    fontFamily: theme.fonts.label,
    fontSize: 12,
    letterSpacing: 1.2,
    textTransform: "uppercase"
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
