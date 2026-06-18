import AsyncStorage from "@react-native-async-storage/async-storage";

import { hubStackemApi } from "../platform/api/stackem";
import type { HubStackemProfile } from "../platform/types";

export interface LeaderboardEntry {
  adjustedScore: number;
  bonusMultiplier: number;
  buyIn: number;
  createdAt: string;
  difficulty?: "easy" | "medium" | "hard";
  id: string;
  linesCompleted: number;
  playerName: string;
  result: "board-sealed" | "bust" | "timeout";
  score: number;
  spareSeconds: number;
  turns: number;
}

const STORAGE_KEY = "21-stackem/leaderboard";
const MAX_ENTRIES = 24;

type LeaderboardOptions = {
  token?: string | null;
  useRemote?: boolean;
};

export async function loadLeaderboard(options?: LeaderboardOptions) {
  if (options?.useRemote) {
    try {
      const response = await hubStackemApi.getLegacyLeaderboard(MAX_ENTRIES);
      return sortEntries(response.body.data.map(normalizeEntry));
    } catch {
      // Fall through to local cache.
    }
  }

  let raw: string | null = null;

  try {
    raw = await AsyncStorage.getItem(STORAGE_KEY);
  } catch {
    raw = null;
  }

  if (!raw) {
    return [] as LeaderboardEntry[];
  }

  try {
    const parsed = JSON.parse(raw) as Array<Partial<LeaderboardEntry>>;
    return sortEntries(parsed.map(normalizeEntry));
  } catch {
    return [] as LeaderboardEntry[];
  }
}

export async function saveLeaderboardEntry(
  entry: Omit<LeaderboardEntry, "createdAt" | "id">,
  options?: LeaderboardOptions
) {
  if (options?.useRemote && options.token) {
    try {
      await hubStackemApi.saveRun(options.token, {
        adjustedScore: entry.adjustedScore,
        bonusMultiplier: entry.bonusMultiplier,
        buyIn: entry.buyIn,
        difficulty: entry.difficulty ?? "easy",
        linesCompleted: entry.linesCompleted,
        result: entry.result,
        score: entry.score,
        spareSeconds: entry.spareSeconds,
        turns: entry.turns
      });

      return await loadLeaderboard({ useRemote: true });
    } catch {
      // Fall through to local cache.
    }
  }

  const current = await loadLeaderboard();
  const nextEntry: LeaderboardEntry = {
    ...entry,
    createdAt: new Date().toISOString(),
    id: `${Date.now()}-${Math.round(Math.random() * 100000)}`
  };
  const next = sortEntries([nextEntry, ...current]).slice(0, MAX_ENTRIES);

  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    return next;
  }

  return next;
}

export function sortEntries(entries: LeaderboardEntry[]) {
  return [...entries].sort((left, right) => {
    if (right.adjustedScore !== left.adjustedScore) {
      return right.adjustedScore - left.adjustedScore;
    }

    if (right.linesCompleted !== left.linesCompleted) {
      return right.linesCompleted - left.linesCompleted;
    }

    return (
      new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime()
    );
  });
}

export function getLeaderboardSummary(entries: LeaderboardEntry[]) {
  return {
    bestLines: entries.reduce(
      (best, entry) => Math.max(best, entry.linesCompleted),
      0
    ),
    bestScore: entries[0]?.adjustedScore ?? 0,
    runs: entries.length
  };
}

export async function loadLeaderboardProfile(token?: string | null) {
  if (!token) {
    return {
      recentRuns: [] as LeaderboardEntry[],
      stats: {
        bestAdjustedScore: 0,
        bestLinesCompleted: 0,
        totalRuns: 0,
        totalScore: 0,
        wins: 0
      }
    };
  }

  try {
    const response = await hubStackemApi.getProfile(token);
    const data = response.body.data as HubStackemProfile;

    return {
      recentRuns: (data.recentRuns ?? []).map(normalizeEntry),
      stats: {
        bestAdjustedScore: Number(data.stats?.bestAdjustedScore) || 0,
        bestLinesCompleted: Number(data.stats?.bestLinesCompleted) || 0,
        totalRuns: Number(data.stats?.totalRuns) || 0,
        totalScore: Number(data.stats?.totalScore) || 0,
        wins: Number(data.stats?.wins) || 0
      }
    };
  } catch {
    return {
      recentRuns: [] as LeaderboardEntry[],
      stats: {
        bestAdjustedScore: 0,
        bestLinesCompleted: 0,
        totalRuns: 0,
        totalScore: 0,
        wins: 0
      }
    };
  }
}

function normalizeEntry(entry: Partial<LeaderboardEntry>): LeaderboardEntry {
  const score = typeof entry.score === "number" ? entry.score : 0;
  const spareSeconds = typeof entry.spareSeconds === "number" ? entry.spareSeconds : 0;
  const bonusMultiplier =
    typeof entry.bonusMultiplier === "number" ? entry.bonusMultiplier : 1;
  const adjustedScore =
    typeof entry.adjustedScore === "number"
      ? entry.adjustedScore
      : Math.round(score * bonusMultiplier);

  return {
    adjustedScore,
    bonusMultiplier,
    buyIn: typeof entry.buyIn === "number" ? entry.buyIn : 0,
    createdAt: entry.createdAt ?? new Date(0).toISOString(),
    difficulty:
      entry.difficulty === "easy" || entry.difficulty === "medium" || entry.difficulty === "hard"
        ? entry.difficulty
        : "easy",
    id: entry.id ?? `legacy-${Math.random().toString(36).slice(2)}`,
    linesCompleted: typeof entry.linesCompleted === "number" ? entry.linesCompleted : 0,
    playerName: entry.playerName ?? "Player",
    result: entry.result === "board-sealed" || entry.result === "bust" || entry.result === "timeout"
      ? entry.result
      : "timeout",
    score,
    spareSeconds,
    turns: typeof entry.turns === "number" ? entry.turns : 0
  };
}
