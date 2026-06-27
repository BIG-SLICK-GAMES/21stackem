import { Href, router, useFocusEffect } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { ScreenContainer } from "../components/layout/ScreenContainer";
import { AppNav } from "../components/layout/AppNav";
import { LeaderboardEntry, loadLeaderboard } from "../game/leaderboard";
import { stackemRoutes } from "../navigation/routes";
import { hubStackemApi } from "../platform/api/stackem";
import { useHubSession } from "../platform/auth/session";
import { formatChipCount } from "../platform/lib/format";
import type { HubStackemWeeklyEntry } from "../platform/types";
import { theme } from "../theme";

const MEDALS = ["#1", "#2", "#3"];

export function LeaderboardScreen() {
  const { status, token } = useHubSession();
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [weeklyEntries, setWeeklyEntries] = useState<HubStackemWeeklyEntry[]>([]);

  useFocusEffect(
    useCallback(() => {
      let active = true;

      async function hydrate() {
        const nextEntries = await loadLeaderboard({
          token,
          useRemote: status === "authenticated"
        });
        let nextWeeklyEntries: HubStackemWeeklyEntry[] = [];

        try {
          const weeklyResponse = await hubStackemApi.getLeaderboard(24);
          nextWeeklyEntries = weeklyResponse.body.data.entries;
        } catch {
          nextWeeklyEntries = [];
        }

        if (active) {
          setEntries(nextEntries);
          setWeeklyEntries(nextWeeklyEntries);
        }
      }

      void hydrate();
      return () => {
        active = false;
      };
    }, [status, token])
  );

  const winners = useMemo(() => [...entries].slice(0, 8), [entries]);
  const timeLeaders = useMemo(
    () =>
      [...entries]
        .filter((entry) => entry.spareSeconds > 0)
        .sort((left, right) => {
          if (right.spareSeconds !== left.spareSeconds) {
            return right.spareSeconds - left.spareSeconds;
          }

          return right.adjustedScore - left.adjustedScore;
        })
        .slice(0, 8),
    [entries]
  );
  const lineLeaders = useMemo(
    () =>
      [...entries]
        .sort((left, right) => {
          if (right.linesCompleted !== left.linesCompleted) {
            return right.linesCompleted - left.linesCompleted;
          }

          return right.adjustedScore - left.adjustedScore;
        })
        .slice(0, 8),
    [entries]
  );

  return (
    <ScreenContainer scroll contentContainerStyle={styles.content}>
      <AppNav />
      <View style={styles.hero}>
        <Text style={styles.kicker}>Ranked Tables</Text>
        <Text style={styles.title}>Winners Board</Text>
        <Text style={styles.body}>
          {status === "authenticated"
            ? "Signed in leaderboard is shared across your backend profile."
            : "Local leaderboard data stays on this device until you sign in."}
        </Text>
        <Pressable
          onPress={() => router.replace(stackemRoutes.lobby)}
          style={({ pressed }) => [styles.playAgainButton, pressed && styles.playAgainButtonPressed]}
        >
          <Text style={styles.playAgainLabel}>Lobby</Text>
        </Pressable>
      </View>

      <LeaderboardTable
        emptyBody="Win chips from an exact 21 to enter this week's table."
        entries={weeklyEntries}
        kind="weekly"
        title="Weekly Stack'em Chips"
      />
      <LeaderboardTable
        emptyBody="Finish a run to claim the first medal."
        entries={winners}
        kind="winners"
        title="Overall Winners"
      />
      <LeaderboardTable
        emptyBody="End a run early to appear on the spare time table."
        entries={timeLeaders}
        kind="time"
        title="Time Bonus Leaders"
      />
      <LeaderboardTable
        emptyBody="Lock more 21s to climb the category board."
        entries={lineLeaders}
        kind="lines"
        title="Most 21s"
      />
    </ScreenContainer>
  );
}

function LeaderboardTable({
  emptyBody,
  entries,
  kind,
  title
}: {
  emptyBody: string;
  entries: Array<LeaderboardEntry | HubStackemWeeklyEntry>;
  kind: "lines" | "time" | "weekly" | "winners";
  title: string;
}) {
  return (
    <View style={styles.table}>
      <View style={styles.tableHeader}>
        <Text style={styles.tableTitle}>{title}</Text>
      </View>
      {entries.length ? (
        entries.map((entry, index) => (
          <View key={`${kind}-${getEntryId(entry, index)}`} style={styles.row}>
            <Text style={styles.medal}>{MEDALS[index] ?? `#${index + 1}`}</Text>
            <View style={styles.playerBlock}>
              <Text numberOfLines={1} style={styles.playerName}>
                {entry.playerName}
              </Text>
              <Text style={styles.playerMeta}>{formatMeta(entry, kind)}</Text>
            </View>
            <View style={styles.metricBlock}>
              <Text style={styles.metricLabel}>{metricLabel(kind)}</Text>
              <Text style={styles.metricValue}>{formatMetric(entry, kind)}</Text>
            </View>
          </View>
        ))
      ) : (
        <View style={styles.emptyState}>
          <Text style={styles.emptyBody}>{emptyBody}</Text>
        </View>
      )}
    </View>
  );
}

function getEntryId(entry: LeaderboardEntry | HubStackemWeeklyEntry, index: number) {
  return "id" in entry ? entry.id : entry._id ?? `${entry.playerId}-${entry.difficulty}-${index}`;
}

function metricLabel(kind: "lines" | "time" | "weekly" | "winners") {
  if (kind === "weekly") {
    return "Won";
  }

  if (kind === "time") {
    return "Spare";
  }

  if (kind === "lines") {
    return "21s";
  }

  return "Score";
}

function formatMetric(entry: LeaderboardEntry | HubStackemWeeklyEntry, kind: "lines" | "time" | "weekly" | "winners") {
  if (kind === "weekly" && "totalStackemChipsWon" in entry) {
    return formatChipCount(entry.totalStackemChipsWon);
  }

  const legacyEntry = entry as LeaderboardEntry;

  if (kind === "time") {
    return `${legacyEntry.spareSeconds}s`;
  }

  if (kind === "lines") {
    return String(legacyEntry.linesCompleted);
  }

  return formatChipCount(legacyEntry.adjustedScore);
}

function formatMeta(entry: LeaderboardEntry | HubStackemWeeklyEntry, kind: "lines" | "time" | "weekly" | "winners") {
  if (kind === "weekly" && "successful21Count" in entry) {
    return `${entry.successful21Count} successful 21s | best ${formatChipCount(entry.bestSingleWin)} | ${entry.difficulty}`;
  }

  const legacyEntry = entry as LeaderboardEntry;

  if (kind === "time") {
    return `${formatChipCount(legacyEntry.score)} base | ${legacyEntry.bonusMultiplier.toFixed(2)}x bonus`;
  }

  if (kind === "lines") {
    return `${formatChipCount(legacyEntry.adjustedScore)} adjusted | ${legacyEntry.turns} moves`;
  }

  return legacyEntry.result === "timeout"
    ? "Time expired"
    : legacyEntry.result === "bust"
      ? "Busted"
      : `${legacyEntry.spareSeconds}s spare | ${legacyEntry.bonusMultiplier.toFixed(2)}x`;
}

const styles = StyleSheet.create({
  body: {
    color: theme.colors.subtleText,
    fontFamily: theme.fonts.body,
    fontSize: 15,
    lineHeight: 22,
    maxWidth: 1000
  },
  content: {
    gap: theme.spacing.md,
    marginHorizontal: "auto",
    maxWidth: 430,
    paddingBottom: theme.spacing.xxxl + 96,
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.xl,
    width: "100%"
  },
  emptyBody: {
    color: theme.colors.subtleText,
    fontFamily: theme.fonts.body,
    fontSize: 14,
    lineHeight: 20,
    textAlign: "center"
  },
  emptyState: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.lg
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
  medal: {
    color: theme.colors.text,
    fontFamily: theme.fonts.display,
    fontSize: 22,
    lineHeight: 22,
    textAlign: "center",
    width: 38
  },
  metricBlock: {
    alignItems: "flex-end",
    minWidth: 88
  },
  metricLabel: {
    color: theme.colors.subtleText,
    fontFamily: theme.fonts.label,
    fontSize: 9,
    letterSpacing: 1.2,
    textTransform: "uppercase"
  },
  metricValue: {
    color: theme.colors.text,
    fontFamily: theme.fonts.bodyBold,
    fontSize: 15
  },
  playAgainButton: {
    alignItems: "center",
    alignSelf: "flex-start",
    backgroundColor: "rgba(110, 196, 241, 0.14)",
    borderColor: "rgba(110, 196, 241, 0.38)",
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    justifyContent: "center",
    minHeight: 44,
    paddingHorizontal: theme.spacing.lg
  },
  playAgainButtonPressed: {
    opacity: 0.86
  },
  playAgainLabel: {
    color: theme.colors.text,
    fontFamily: theme.fonts.label,
    fontSize: 12,
    letterSpacing: 1.2,
    textTransform: "uppercase"
  },
  playerBlock: {
    flex: 1,
    gap: 2,
    minWidth: 0
  },
  playerMeta: {
    color: theme.colors.subtleText,
    fontFamily: theme.fonts.body,
    fontSize: 12
  },
  playerName: {
    color: theme.colors.text,
    fontFamily: theme.fonts.bodyBold,
    fontSize: 16
  },
  row: {
    alignItems: "center",
    backgroundColor: "rgba(7, 24, 40, 0.88)",
    borderColor: "rgba(84, 130, 171, 0.5)",
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    flexDirection: "row",
    gap: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm
  },
  table: {
    backgroundColor: "rgba(5, 18, 30, 0.92)",
    borderColor: "rgba(105, 150, 190, 0.56)",
    borderRadius: theme.radius.xl,
    borderWidth: 2,
    elevation: 7,
    gap: theme.spacing.xs,
    padding: theme.spacing.md,
    shadowColor: "#7ecbff",
    shadowOffset: { height: 12, width: 0 },
    shadowOpacity: 0.18,
    shadowRadius: 22,
    width: "100%"
  },
  tableHeader: {
    paddingBottom: theme.spacing.xs,
    paddingHorizontal: theme.spacing.xs
  },
  tableTitle: {
    color: theme.colors.text,
    fontFamily: theme.fonts.bodyBold,
    fontSize: 20
  },
  title: {
    color: theme.colors.text,
    fontFamily: theme.fonts.display,
    fontSize: 36,
    lineHeight: 36
  }
});
