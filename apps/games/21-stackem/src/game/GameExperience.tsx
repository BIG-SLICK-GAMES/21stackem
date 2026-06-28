import { Href, router, useLocalSearchParams } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { activateKeepAwakeAsync, deactivateKeepAwake } from "expo-keep-awake";
import { createContext, useContext, useEffect, useRef, useState } from "react";
import {
  Animated,
  Easing,
  Image,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View
} from "react-native";
import { PanResponder } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { AppBackdrop } from "../components/layout/AppBackdrop";
import { GameButton } from "../components/ui/GameButton";
import { getStackemAppearance, StackemAppearance } from "./appearance";
import { useDeviceProfile } from "../hooks/useDeviceProfile";
import { stackemRoutes } from "../navigation/routes";
import { hubStackemApi } from "../platform/api/stackem";
import { useHubSession } from "../platform/auth/session";
import { formatChipCount } from "../platform/lib/format";
import { openBigSlickGamesWebsite } from "../platform/lib/external-links";
import { fireHaptic } from "../services/haptics";
import { useGameSettings } from "../store/game-settings";
import { clamp, theme } from "../theme";
import {
  getLeaderboardSummary,
  loadLeaderboard,
  saveLeaderboardEntry
} from "./leaderboard";
import {
  GameWorld,
  GameMode,
  GRID_SIZE,
  HAND_SIZE,
  LineSummary,
  StackTile,
  StandardTileRank,
  TARGET_TOTAL
} from "./types";
import {
  SHOE_COUNT,
  calculateBlackjackBonus,
  calculateBustPenalty,
  canSelectQuakeTile,
  canPlaceAt,
  canSwapAt,
  createWorld,
  createSelectedTile,
  getDeckCountLabel,
  isSwapTile,
  isWildTile,
  placeQueueTile,
  previewPlacement,
  selectQuakeTile,
  swapBoardTile,
  triggerQuake
} from "./world";

const RUN_DURATION_SECONDS = 180;
const DEFAULT_LOCAL_BANKROLL = 10000;
const STACKEM_EXTRA_GAME_COST = 50;
const STACKEM_FREE_GAMES_PER_DIFFICULTY_DAILY = 3;
const MULTIPLIER_DURATION_SECONDS = 10;
const MULTIPLIER_RECHARGE_SECONDS = 40;
const LIGHTNING_RECHARGE_SECONDS = 60;
const LIGHTNING_BONUS_MULTIPLIER = 1.5;
const EARLY_FINISH_BONUS_MULTIPLIER = 1.3;
const PREVIEW_SEED_CELLS: Array<{ col: number; row: number }> = [
  { row: 1, col: 1 },
  { row: 2, col: 2 },
  { row: 3, col: 3 },
  { row: 1, col: 3 },
  { row: 3, col: 1 },
  { row: 2, col: 1 }
];

const DIFFICULTY_OPTIONS = [
  {
    blackjackBonus: 100,
    bustPenalty: 50,
    description: "Clean board. x2 to x5 rewards.",
    key: "easy",
    label: "Easy",
    openingTiles: 0,
    startingBankrollLabel: "Use full bankroll"
  },
  {
    blackjackBonus: 338,
    bustPenalty: 100,
    description: "3 seeded tiles. x5.5 to x7.5 rewards.",
    key: "medium",
    label: "Medium",
    openingTiles: 3,
    startingBankrollLabel: "Use full bankroll"
  },
  {
    blackjackBonus: 625,
    bustPenalty: 200,
    description: "6 seeded tiles. x8 to x12.5 rewards.",
    key: "hard",
    label: "Hard",
    openingTiles: 6,
    startingBankrollLabel: "Use full bankroll"
  }
] as const;
const SPECIAL_VALUE_OPTIONS: Array<{ label: string; rank: StandardTileRank }> = [
  { label: "A", rank: "A" },
  { label: "2", rank: "2" },
  { label: "3", rank: "3" },
  { label: "4", rank: "4" },
  { label: "5", rank: "5" },
  { label: "6", rank: "6" },
  { label: "7", rank: "7" },
  { label: "8", rank: "8" },
  { label: "9", rank: "9" },
  { label: "10", rank: "10" }
] as const;
const LIGHTNING_STRIKE_GIF = require("../../assets/images/Lihtning Pack/01 - GIF/Lightning_03.gif");
const QUAKE_TILE_IMAGE = require("../../assets/images/quake-tile.png");

function getSpecialOptionHint(rank: StandardTileRank) {
  return rank === "A" ? "1 or 11" : `value ${rank}`;
}

function formatTimerLabel(seconds: number) {
  const safeSeconds = Math.max(0, seconds);
  const minutes = Math.floor(safeSeconds / 60);
  const remainder = safeSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(remainder).padStart(2, "0")}`;
}

function formatAbilityCooldown(seconds: number) {
  return seconds > 0 ? `${seconds}s` : "Ready";
}

function getEarlyFinishMultiplier(result: "board-sealed" | "bust" | "timeout", spareSeconds: number) {
  if (result !== "board-sealed" || spareSeconds < 10) {
    return 1;
  }

  return Math.pow(EARLY_FINISH_BONUS_MULTIPLIER, Math.floor(spareSeconds / 10));
}

function getSessionBankroll(chips?: number) {
  return typeof chips === "number" && chips > 0 ? chips : DEFAULT_LOCAL_BANKROLL;
}

const EMPTY_LINE: LineSummary = {
  cards: [],
  index: 0,
  isSoft: false,
  status: "open",
  total: 0
};
const EMPTY_LINES = Array.from({ length: GRID_SIZE }, (_, index) => ({
  ...EMPTY_LINE,
  index
}));
const EMPTY_BOARD = Array.from({ length: GRID_SIZE }, () =>
  Array.from({ length: GRID_SIZE }, () => null as StackTile | null)
);

type BoardMetrics = { height: number; width: number; x: number; y: number };
type GridCell = { col: number; row: number };
type TileFrame = {
  height: number;
  x: number;
  y: number;
  width: number;
};
type DragGhost = TileFrame & {
  tile: StackTile;
};
type QueueSnapshot = Array<StackTile | null>;
type QueueAdvanceCard = {
  fromIndex: number;
  kind: "deal" | "shift";
  lead: boolean;
  tile: StackTile;
  toIndex: number;
};
type QueueAdvanceEffect = {
  cards: QueueAdvanceCard[];
  nonce: number;
};
type PendingSpecialMove = {
  kind: "swap" | "wild";
  target: GridCell;
  tile: StackTile;
};
type PlacementFlight = {
  col: number;
  end: TileFrame;
  nonce: number;
  row: number;
  sourceTileId: string;
  start: TileFrame;
  tile: StackTile;
};
type SetupDifficulty = (typeof DIFFICULTY_OPTIONS)[number]["key"];
type LightningStrikeAnimation = {
  nonce: number;
  targetKeys: string[];
};

const UNDO_LIMIT = 3;
const COUNTDOWN_ALERTS: Record<number, string> = {
  120: "2 MIN!",
  60: "1 MIN!"
};
const StackemAppearanceContext = createContext<StackemAppearance | null>(null);

function createQueueSnapshot(queue: StackTile[]) {
  return Array.from({ length: HAND_SIZE }, (_, index) => queue[index] ?? null);
}

function isQueueAdvance(previous: QueueSnapshot, next: QueueSnapshot) {
  return Boolean(
    previous[1] &&
      next[0] &&
      previous[1]?.id === next[0]?.id &&
      (previous[2]?.id === next[1]?.id || !next[1])
  );
}

function createQueueAdvanceEffect(previous: QueueSnapshot, next: QueueSnapshot) {
  if (!isQueueAdvance(previous, next)) {
    return null;
  }

  const cards = next.reduce<QueueAdvanceCard[]>((result, tile, toIndex) => {
    if (!tile) {
      return result;
    }

    const fromIndex = previous.findIndex((candidate) => candidate?.id === tile.id);

    result.push({
      fromIndex: fromIndex >= 0 ? fromIndex : HAND_SIZE,
      kind: fromIndex >= 0 ? "shift" : "deal",
      lead: toIndex === 0,
      tile,
      toIndex
    });

    return result;
  }, []);

  return cards.length ? cards : null;
}

function useStackemAppearance() {
  const context = useContext(StackemAppearanceContext);

  if (!context) {
    throw new Error("useStackemAppearance must be used inside GameExperience.");
  }

  return context;
}

function getBlockTileSurface(tile: StackTile): [string, string, string] {
  if (tile.kind === "wild") {
    return ["#fffbe8", "#d7b85f", "#6f5b2b"];
  }

  if (tile.kind === "swap") {
    return ["#f8f4ff", "#a894dc", "#4f4184"];
  }

  const rankSurfaces: Record<StandardTileRank, [string, string, string]> = {
    A: ["#fffbdc", "#d7b85f", "#6f5b2b"],
    "2": ["#edf8ff", "#6fa8d8", "#24537c"],
    "3": ["#ffefef", "#d87373", "#7b2f35"],
    "4": ["#f7f1ff", "#9b82d9", "#493a82"],
    "5": ["#fff4e8", "#d89a62", "#7a4822"],
    "6": ["#eefff7", "#6fbf9a", "#2d6752"],
    "7": ["#ffeef3", "#bd7184", "#673044"],
    "8": ["#f4f8fc", "#8ea0b7", "#344356"],
    "9": ["#fffde5", "#d2bd72", "#6f5e2d"],
    "10": ["#effbff", "#83bedc", "#2d6080"],
    J: ["#fff1f1", "#d78686", "#773439"],
    Q: ["#f8f4ff", "#a894dc", "#4f4184"],
    K: ["#fff5eb", "#d9a36e", "#794c27"]
  };

  return rankSurfaces[tile.rank as StandardTileRank];
}

function getBlockTileTextColor(tile: StackTile) {
  return tile.kind === "standard" && (tile.rank === "A" || tile.rank === "9")
    ? "#231608"
    : "#ffffff";
}

function getPoolTileTextColor(tile: StackTile) {
  if (tile.kind !== "standard") {
    return "#111111";
  }

  const textColors: Record<StandardTileRank, string> = {
    A: "#d8a900",
    "2": "#155ec9",
    "3": "#c51f1a",
    "4": "#6a32c5",
    "5": "#e46f13",
    "6": "#1f8e39",
    "7": "#7b1823",
    "8": "#111111",
    "9": "#d8a900",
    "10": "#155ec9",
    J: "#c51f1a",
    Q: "#6a32c5",
    K: "#e46f13"
  };

  return textColors[tile.rank as StandardTileRank];
}

function getQuakeTileGradient(tile: StackTile): [string, string, string] {
  if (tile.kind !== "standard") {
    return ["rgba(244, 250, 255, 0.96)", "rgba(142, 167, 193, 0.86)", "rgba(65, 86, 110, 0.96)"];
  }

  const gradients: Record<StandardTileRank, [string, string, string]> = {
    A: ["rgba(255, 251, 220, 0.98)", "rgba(215, 184, 95, 0.9)", "rgba(111, 91, 43, 0.98)"],
    "2": ["rgba(237, 248, 255, 0.98)", "rgba(111, 168, 216, 0.9)", "rgba(36, 83, 124, 0.98)"],
    "3": ["rgba(255, 239, 239, 0.98)", "rgba(216, 115, 115, 0.9)", "rgba(123, 47, 53, 0.98)"],
    "4": ["rgba(247, 241, 255, 0.98)", "rgba(155, 130, 217, 0.9)", "rgba(73, 58, 130, 0.98)"],
    "5": ["rgba(255, 244, 232, 0.98)", "rgba(216, 154, 98, 0.9)", "rgba(122, 72, 34, 0.98)"],
    "6": ["rgba(238, 255, 247, 0.98)", "rgba(111, 191, 154, 0.9)", "rgba(45, 103, 82, 0.98)"],
    "7": ["rgba(255, 238, 243, 0.98)", "rgba(189, 113, 132, 0.9)", "rgba(103, 48, 68, 0.98)"],
    "8": ["rgba(244, 248, 252, 0.98)", "rgba(142, 160, 183, 0.9)", "rgba(52, 67, 86, 0.98)"],
    "9": ["rgba(255, 253, 229, 0.98)", "rgba(210, 189, 114, 0.9)", "rgba(111, 94, 45, 0.98)"],
    "10": ["rgba(239, 251, 255, 0.98)", "rgba(131, 190, 220, 0.9)", "rgba(45, 96, 128, 0.98)"],
    J: ["rgba(255, 241, 241, 0.98)", "rgba(215, 134, 134, 0.9)", "rgba(119, 52, 57, 0.98)"],
    Q: ["rgba(248, 244, 255, 0.98)", "rgba(168, 148, 220, 0.9)", "rgba(79, 65, 132, 0.98)"],
    K: ["rgba(255, 245, 235, 0.98)", "rgba(217, 163, 110, 0.9)", "rgba(121, 76, 39, 0.98)"]
  };

  return gradients[tile.rank as StandardTileRank];
}

function getCountdownCue(seconds: number) {
  if (seconds <= 10 && seconds >= 1) {
    return `${seconds}!`;
  }

  return COUNTDOWN_ALERTS[seconds] ?? null;
}

export function GameExperience() {
  const device = useDeviceProfile();
  const { settings } = useGameSettings();
  const appearance = getStackemAppearance(settings);
  const { isReady, profile, refreshProfile, status, token } = useHubSession();
  const params = useLocalSearchParams<{
    buyIn?: string | string[];
    difficulty?: string | string[];
    fresh?: string | string[];
    mode?: string | string[];
  }>();
  const buyInParam = Array.isArray(params.buyIn) ? params.buyIn[0] : params.buyIn;
  const difficultyParam = Array.isArray(params.difficulty)
    ? params.difficulty[0]
    : params.difficulty;
  const freshParam = Array.isArray(params.fresh) ? params.fresh[0] : params.fresh;
  const modeParam = Array.isArray(params.mode) ? params.mode[0] : params.mode;
  const parsedBuyIn = Number(buyInParam);
  const requestedBuyIn =
    parsedBuyIn === 10 || parsedBuyIn === 100 || parsedBuyIn === 1000
      ? parsedBuyIn
      : null;
  const initialDifficulty: SetupDifficulty =
    difficultyParam === "easy" || difficultyParam === "medium" || difficultyParam === "hard"
      ? difficultyParam
      : "easy";
  const requestedDifficulty: SetupDifficulty =
    difficultyParam === "easy" || difficultyParam === "medium" || difficultyParam === "hard"
      ? difficultyParam
      : "easy";
  const requestedMode: GameMode = modeParam === "quake" ? "quake" : "classic";
  const [selectedBuyIn, setSelectedBuyIn] = useState<number>(
    requestedBuyIn ?? getSessionBankroll(profile?.nChips)
  );
  const [selectedDifficulty, setSelectedDifficulty] =
    useState<SetupDifficulty>(initialDifficulty);
  const [selectedMode, setSelectedMode] = useState<GameMode>(requestedMode);
  const [world, setWorld] = useState<GameWorld | null>(null);
  const [timeRemaining, setTimeRemaining] = useState(RUN_DURATION_SECONDS);
  const [clockNow, setClockNow] = useState(Date.now());
  const [countdownCue, setCountdownCue] = useState<string | null>(null);
  const [hoveredCell, setHoveredCell] = useState<GridCell | null>(null);
  const [leaderboardBest, setLeaderboardBest] = useState(0);
  const [leaderboardRuns, setLeaderboardRuns] = useState(0);
  const [dailyFreeGames, setDailyFreeGames] = useState<Record<SetupDifficulty, number>>({
    easy: STACKEM_FREE_GAMES_PER_DIFFICULTY_DAILY,
    hard: STACKEM_FREE_GAMES_PER_DIFFICULTY_DAILY,
    medium: STACKEM_FREE_GAMES_PER_DIFFICULTY_DAILY
  });
  const [economyMessage, setEconomyMessage] = useState<string | null>(null);
  const [isStartingSession, setIsStartingSession] = useState(false);
  const [activeSession, setActiveSession] = useState<{
    entryCostCharged: number;
    freeAttempt: boolean;
    id: string;
  } | null>(null);
  const [completedSessionId, setCompletedSessionId] = useState<string | null>(null);
  const [savedRunId, setSavedRunId] = useState<number | null>(null);
  const [celebrationBurst, setCelebrationBurst] = useState<{
    cols: number[];
    nonce: number;
    rows: number[];
  } | null>(null);
  const [warningBurst, setWarningBurst] = useState<{
    cols: number[];
    nonce: number;
    rows: number[];
  } | null>(null);
  const [undoStack, setUndoStack] = useState<GameWorld[]>([]);
  const [undosUsed, setUndosUsed] = useState(0);
  const [pendingSpecialMove, setPendingSpecialMove] = useState<PendingSpecialMove | null>(null);
  const [placementFlight, setPlacementFlight] = useState<PlacementFlight | null>(null);
  const [dragging, setDragging] = useState(false);
  const [dragGhost, setDragGhost] = useState<DragGhost | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [multiplierEndsAt, setMultiplierEndsAt] = useState(0);
  const [multiplierReadyAt, setMultiplierReadyAt] = useState(0);
  const [lightningReadyAt, setLightningReadyAt] = useState(0);
  const [lightningAnimation, setLightningAnimation] =
    useState<LightningStrikeAnimation | null>(null);
  const boardRef = useRef<View>(null);
  const bannerRef = useRef<View>(null);
  const dealButtonRef = useRef<View>(null);
  const leadTileRef = useRef<View>(null);
  const queueStageRef = useRef<View>(null);
  const undoButtonRef = useRef<View>(null);
  const boardMetricsRef = useRef<BoardMetrics | null>(null);
  const pendingPlacementWorldRef = useRef<GameWorld | null>(null);
  const worldRef = useRef<GameWorld | null>(null);
  const countdownCueRef = useRef<string | null>(null);
  const pausedQuakeRemainingRef = useRef<number | null>(null);
  const dragOffset = useRef(new Animated.ValueXY({ x: 0, y: 0 })).current;
  const placementImpact = useRef(new Animated.Value(0)).current;
  const placementFlightProgress = useRef(new Animated.Value(0)).current;
  const lineFlash = useRef(new Animated.Value(0)).current;
  const boardPulse = useRef(new Animated.Value(0)).current;
  const boardShake = useRef(new Animated.Value(0)).current;
  const timerFlash = useRef(new Animated.Value(0)).current;
  const lastFreshParamRef = useRef<string | null>(null);
  const isDesktop = device.width >= 960;
  const isMobile = !isDesktop;
  const isPortraitMobile = isMobile && !device.isLandscape;
  const isLandscapeMobile = isMobile && device.isLandscape;
  const outerPad = isDesktop ? 24 : isLandscapeMobile ? 8 : 10;
  const availableWidth = device.width - outerPad * 2;
  const tabDockReserve = 12;
  const availableHeight =
    device.height -
    device.insets.top -
    device.insets.bottom -
    outerPad * 2 -
    tabDockReserve;
  const frameWidth = Math.min(430, availableWidth);
  const framePad = isDesktop ? 16 : isLandscapeMobile ? 8 : 10;
  const frameGap = isDesktop ? 10 : 8;
  const topHeight = isPortraitMobile
    ? clamp(Math.round(availableHeight * 0.12), 68, 92)
    : clamp(Math.round(availableHeight * 0.13), 76, 102);
  const trayHeightReserve = isPortraitMobile ? 150 : 132;
  const portraitBottomHeight = trayHeightReserve;
  const radius = clamp(Math.round(frameWidth * 0.05), 18, 28);
  const boardPadX = isLandscapeMobile ? 8 : 10;
  const boardPadY = isPortraitMobile ? 4 : 8;
  const boardGap = clamp(Math.round(Math.min(frameWidth, availableHeight) * 0.006), 1, 3);
  const sideRailWidth = isPortraitMobile
    ? 0
    : clamp(Math.round(frameWidth * (isDesktop ? 0.24 : 0.32)), 164, 260);
  const isRequestedQuake = selectedMode === "quake";
  const boardRail = isRequestedQuake
    ? 0
    : clamp(
        Math.round(Math.min(frameWidth, availableHeight) * (isPortraitMobile ? 0.08 : 0.075)),
        28,
        42
      );
  const boardRailGap = boardRail > 0 ? boardGap : 0;
  const boardWidthBudget = frameWidth - framePad * 2 - boardPadX * 2;
  const boardHeightBudget = isPortraitMobile
    ? availableHeight -
      framePad * 2 -
      topHeight -
      portraitBottomHeight -
      frameGap * 2 -
      boardPadY * 2
    : Math.min(availableHeight, isDesktop ? 760 : availableHeight) -
      framePad * 2 -
      topHeight -
      trayHeightReserve -
      frameGap * 2 -
      boardPadY * 2;
  const boardCell = Math.max(
    isPortraitMobile ? 28 : 24,
    Math.floor(
      Math.min(
        (boardWidthBudget - boardRail - boardRailGap - boardGap * (GRID_SIZE - 1)) / GRID_SIZE,
        (boardHeightBudget - boardRail - boardRailGap - boardGap * (GRID_SIZE - 1)) / GRID_SIZE
      )
    )
  );
  const boardDense = boardCell < 56;
  const matrixSize = boardCell * GRID_SIZE + boardGap * (GRID_SIZE - 1);
  const boardSize = boardRail + boardRailGap + matrixSize;
  const boardPanelHeight = boardSize + boardPadY * 2;
  const boardPanelWidth = boardSize + boardPadX * 2;
  const portraitFrameHeight = Math.min(
    availableHeight,
    framePad * 2 + topHeight + boardPanelHeight + portraitBottomHeight + frameGap * 2
  );
  const splitFrameHeight = Math.min(availableHeight, isDesktop ? 820 : availableHeight);
  const frameHeight = isPortraitMobile ? portraitFrameHeight : splitFrameHeight;
  const portraitQueueGap = clamp(Math.round(frameWidth * 0.014), 4, 8);
  const portraitQueueWidth = Math.max(248, frameWidth - framePad * 4);
  const portraitQueueTileWidth = clamp(
    Math.floor((portraitQueueWidth - portraitQueueGap * 3) / 4),
    40,
    70
  );
  const portraitQueueTileHeight = portraitQueueTileWidth;
  const railPad = isDesktop ? 14 : 10;
  const railGap = isDesktop ? 10 : 8;
  const railInnerWidth = Math.max(120, sideRailWidth - railPad * 2);
  const railQueueTileWidth = clamp(
    Math.floor((railInnerWidth - railGap * 3) / 4),
    30,
    52
  );
  const railQueueTileHeight = railQueueTileWidth;
  const queueDense = isPortraitMobile
    ? portraitQueueTileWidth < 62
    : railQueueTileWidth < 48;
  const effectiveFrameHeight = frameHeight;
  const stripPad = framePad;
  const middleHeight = boardPanelHeight;
  const boardStripHeight = boardPanelHeight;
  const bottomHeight = portraitBottomHeight;
  const controlWidth = clamp(Math.round(frameWidth * 0.3), 100, 136);
  const queueGap = portraitQueueGap;
  const queueTileWidth = portraitQueueTileWidth;
  const queueTileHeight = portraitQueueTileHeight;
  const currentWorld = world;
  const isQuakeMode = currentWorld?.mode === "quake" || selectedMode === "quake";
  const quakeHolding = currentWorld?.mode === "quake" ? currentWorld.quake?.holding ?? [] : [];
  const queue = currentWorld?.mode === "quake" ? quakeHolding : currentWorld?.queue ?? [];
  const board = currentWorld?.board ?? EMPTY_BOARD;
  const rowLines = currentWorld?.rowLines ?? EMPTY_LINES;
  const columnLines = currentWorld?.columnLines ?? EMPTY_LINES;
  const leadTile = queue[0] ?? null;
  const [queueAdvanceEffect, setQueueAdvanceEffect] = useState<QueueAdvanceEffect | null>(null);
  const queueAnimating = Boolean(queueAdvanceEffect);
  const placementAnimating = Boolean(placementFlight);
  const motionLocked = queueAnimating || placementAnimating;
  const interactionLocked = motionLocked || Boolean(pendingSpecialMove);
  const preview =
    currentWorld?.mode !== "quake" && currentWorld && hoveredCell && leadTile?.kind === "standard"
      ? previewPlacement(currentWorld, hoveredCell.row, hoveredCell.col)
      : null;
  const selectedFreeGamesRemaining = dailyFreeGames[selectedDifficulty] ?? 0;
  const canAffordDifficulty = (_difficulty: SetupDifficulty) => true;
  const canAfford = canAffordDifficulty(selectedDifficulty);
  const selectedDifficultyOption =
    DIFFICULTY_OPTIONS.find((option) => option.key === selectedDifficulty) ??
    DIFFICULTY_OPTIONS[0];

  useEffect(() => {
    if (currentWorld?.status === "playing") {
      return;
    }

    setSelectedBuyIn(requestedBuyIn ?? getSessionBankroll(profile?.nChips));
  }, [currentWorld?.status, profile?.nChips, requestedBuyIn]);

  useEffect(() => {
    if (currentWorld?.status !== "playing" || currentWorld.mode === "quake" || currentWorld.result) {
      return;
    }

    if (timeRemaining <= 0) {
      setWorld((previous) => {
        if (!previous || previous.status !== "playing" || previous.result) {
          return previous;
        }

        const placedTiles = previous.board.flat().filter(Boolean).length;

        return {
          ...previous,
          event: "clear",
          eventNonce: previous.eventNonce + 1,
          message: "Time expired. Bank the score and hit the leaderboard.",
          result: {
            bankroll: previous.bankroll,
            linesCompleted: previous.linesCompleted,
            payout: previous.payout,
            placedTiles,
            reason: "timeout",
            runId: previous.runId,
            score: previous.score,
            turns: previous.turns
          },
          status: "cleared"
        };
      });

      return;
    }

    const interval = setInterval(() => {
      setClockNow(Date.now());
      setTimeRemaining((current) => Math.max(0, current - 1));
    }, 1000);

    return () => clearInterval(interval);
  }, [currentWorld?.mode, currentWorld?.result, currentWorld?.status, timeRemaining]);

  useEffect(() => {
    if (currentWorld?.status !== "playing" || currentWorld.mode !== "quake" || currentWorld.result) {
      return;
    }

    const interval = setInterval(() => {
      if (menuOpen) {
        return;
      }

      const now = Date.now();
      let quakeTriggered = false;

      setClockNow(now);
      setWorld((previous) => {
        if (
          previous?.mode !== "quake" ||
          previous.status !== "playing" ||
          previous.result ||
          !previous.quake ||
          previous.quake.nextQuakeAt > now
        ) {
          return previous;
        }

        quakeTriggered = true;
        return triggerQuake(previous, now);
      });

      if (quakeTriggered) {
        playQuakeShake();
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [currentWorld?.mode, currentWorld?.result, currentWorld?.status, menuOpen]);

  useEffect(() => {
    const activeWorld = worldRef.current;

    if (activeWorld?.mode !== "quake" || activeWorld.status !== "playing" || activeWorld.result) {
      pausedQuakeRemainingRef.current = null;
      return;
    }

    if (menuOpen) {
      pausedQuakeRemainingRef.current = Math.max(0, activeWorld.quake!.nextQuakeAt - Date.now());
      return;
    }

    const pausedRemaining = pausedQuakeRemainingRef.current;

    if (pausedRemaining === null) {
      return;
    }

    pausedQuakeRemainingRef.current = null;
    const resumedAt = Date.now();
    setClockNow(resumedAt);
    setWorld((previous) => {
      if (previous?.mode !== "quake" || previous.status !== "playing" || previous.result || !previous.quake) {
        return previous;
      }

      return {
        ...previous,
        quake: {
          ...previous.quake,
          nextQuakeAt: resumedAt + pausedRemaining
        }
      };
    });
  }, [menuOpen]);

  useEffect(() => {
    if (currentWorld?.status !== "playing" || currentWorld.mode === "quake" || currentWorld.result) {
      return;
    }

    const nextCue = getCountdownCue(timeRemaining);

    if (!nextCue || countdownCueRef.current === nextCue) {
      return;
    }

    countdownCueRef.current = nextCue;
    setCountdownCue(nextCue);
    timerFlash.stopAnimation();
    timerFlash.setValue(0);
    Animated.sequence([
      Animated.timing(timerFlash, {
        duration: 160,
        toValue: 1,
        useNativeDriver: true
      }),
      Animated.delay(420),
      Animated.timing(timerFlash, {
        duration: 280,
        toValue: 0,
        useNativeDriver: true
      })
    ]).start(({ finished }) => {
      if (finished) {
        setCountdownCue((current) => (current === nextCue ? null : current));
      }
    });
  }, [currentWorld?.mode, currentWorld?.result, currentWorld?.status, timeRemaining, timerFlash]);

  useEffect(() => {
    if (currentWorld?.result?.reason !== "timeout") {
      return;
    }

    const timeoutCue = "TIME'S UP!";
    countdownCueRef.current = timeoutCue;
    setCountdownCue(timeoutCue);
    timerFlash.stopAnimation();
    timerFlash.setValue(0);
    Animated.sequence([
      Animated.timing(timerFlash, {
        duration: 180,
        toValue: 1,
        useNativeDriver: true
      }),
      Animated.delay(900),
      Animated.timing(timerFlash, {
        duration: 320,
        toValue: 0,
        useNativeDriver: true
      })
    ]).start(({ finished }) => {
      if (finished) {
        setCountdownCue((current) => (current === timeoutCue ? null : current));
      }
    });

    const redirect = setTimeout(() => {
      router.replace(stackemRoutes.leaderboard);
    }, 1400);

    return () => clearTimeout(redirect);
  }, [currentWorld?.result?.reason, timerFlash]);

  useEffect(() => {
    if (!lightningAnimation) {
      return;
    }

    const timeout = setTimeout(() => {
      setLightningAnimation(null);
    }, 680);

    return () => clearTimeout(timeout);
  }, [lightningAnimation]);
  const currentBuyIn = currentWorld?.buyIn ?? selectedBuyIn;
  const currentBlackjackBonus =
    currentWorld?.blackjackBonus ??
    calculateBlackjackBonus(currentBuyIn, selectedDifficultyOption.blackjackBonus);
  const currentBustPenalty =
    currentWorld?.bustPenalty ??
    calculateBustPenalty(currentBuyIn, selectedDifficultyOption.bustPenalty);
  const currentScoreLabel = formatChipCount(currentWorld?.score ?? 0);
  const quakeSecondsUntilNext =
    currentWorld?.mode === "quake" && currentWorld.quake
      ? Math.max(0, Math.ceil((currentWorld.quake.nextQuakeAt - clockNow) / 1000))
      : 0;
  const timerDisplay =
    currentWorld?.mode === "quake"
      ? formatTimerLabel(quakeSecondsUntilNext)
      : countdownCue ?? formatTimerLabel(timeRemaining);
  const timerProgress =
    currentWorld?.mode === "quake" && currentWorld.quake
      ? Math.max(
          0,
          Math.min(1, quakeSecondsUntilNext / Math.max(1, currentWorld.quake.quakeIntervalSeconds))
        )
      : Math.max(0, Math.min(1, timeRemaining / RUN_DURATION_SECONDS));
  const multiplierActive = multiplierEndsAt > clockNow;
  const multiplierCooldownSeconds = Math.max(
    0,
    Math.ceil((Math.max(multiplierReadyAt, multiplierEndsAt) - clockNow) / 1000)
  );
  const lightningCooldownSeconds = Math.max(
    0,
    Math.ceil((lightningReadyAt - clockNow) / 1000)
  );
  const completedTwentyOnes =
    rowLines.filter((line) => line.total === TARGET_TOTAL).length +
    columnLines.filter((line) => line.total === TARGET_TOTAL).length;
  const undoRemaining = Math.max(0, UNDO_LIMIT - undosUsed);
  const undoAvailable =
    currentWorld?.status === "playing" &&
    undoStack.length > 0 &&
    undoRemaining > 0;
  const dragEnabled =
    currentWorld?.status === "playing" &&
    Boolean(leadTile) &&
    !interactionLocked;

  useEffect(() => {
    worldRef.current = world;
  }, [world]);

  useEffect(() => {
    async function syncKeepAwake() {
      try {
        if (settings.keepAwake) {
          await activateKeepAwakeAsync("stackem-session");
        } else {
          await deactivateKeepAwake("stackem-session");
        }
      } catch {}
    }

    void syncKeepAwake();
    return () => {
      void deactivateKeepAwake("stackem-session").catch(() => {});
    };
  }, [settings.keepAwake]);

  useEffect(() => {
    if (Platform.OS !== "web") {
      return;
    }

    const { body, documentElement } = document;
    const prevHtmlOverflow = documentElement.style.overflow;
    const prevHtmlOverscroll = documentElement.style.overscrollBehavior;
    const prevBodyOverflow = body.style.overflow;
    const prevBodyOverscroll = body.style.overscrollBehavior;
    const prevTouch = body.style.touchAction;

    documentElement.style.overflow = isMobile ? "auto" : "hidden";
    documentElement.style.overscrollBehavior = isMobile ? "auto" : "none";
    body.style.overflow = isMobile ? "auto" : "hidden";
    body.style.overscrollBehavior = isMobile ? "auto" : "none";
    body.style.touchAction = isDesktop ? "none" : "manipulation";

    return () => {
      documentElement.style.overflow = prevHtmlOverflow;
      documentElement.style.overscrollBehavior = prevHtmlOverscroll;
      body.style.overflow = prevBodyOverflow;
      body.style.overscrollBehavior = prevBodyOverscroll;
      body.style.touchAction = prevTouch;
    };
  }, [isDesktop, isMobile]);

  useEffect(() => {
    let cancelled = false;

    async function hydrateDailyStatus() {
      if (status !== "authenticated" || !token) {
        setDailyFreeGames({
          easy: STACKEM_FREE_GAMES_PER_DIFFICULTY_DAILY,
          hard: STACKEM_FREE_GAMES_PER_DIFFICULTY_DAILY,
          medium: STACKEM_FREE_GAMES_PER_DIFFICULTY_DAILY
        });
        return;
      }

      try {
        const response = await hubStackemApi.getDailyStatus(token);
        if (cancelled) {
          return;
        }

        setDailyFreeGames(response.body.data.freeGamesRemaining);
      } catch {
        if (!cancelled) {
          setEconomyMessage("Daily Stack'em status is unavailable.");
        }
      }
    }

    void hydrateDailyStatus();
    return () => {
      cancelled = true;
    };
  }, [status, token]);

  useEffect(() => {
    let cancelled = false;

    async function hydrateLeaderboard() {
      const entries = await loadLeaderboard({
        token,
        useRemote: status === "authenticated"
      });
      if (cancelled) {
        return;
      }

      const summary = getLeaderboardSummary(entries);
      setLeaderboardBest(summary.bestScore);
      setLeaderboardRuns(summary.runs);
    }

    void hydrateLeaderboard();
    return () => {
      cancelled = true;
    };
  }, [status, token]);

  useEffect(() => {
    if (!world?.result || savedRunId === world.result.runId) {
      return;
    }

    const finished = world;
    const result = finished.result as NonNullable<GameWorld["result"]>;
    const spareSeconds =
      result.reason === "board-sealed" ? Math.max(0, timeRemaining) : 0;
    const bonusMultiplier = getEarlyFinishMultiplier(result.reason, spareSeconds);
    const adjustedScore = Math.round(result.score * bonusMultiplier);
    setSavedRunId(result.runId);

    async function persistRun() {
      const entries = await saveLeaderboardEntry({
        adjustedScore,
        bonusMultiplier,
        buyIn: finished.buyIn,
        difficulty: finished.difficulty,
        linesCompleted: result.linesCompleted,
        playerName:
          profile?.sUserName ?? (status === "authenticated" ? "Player" : "Local"),
        result: result.reason,
        score: result.score,
        spareSeconds,
        turns: result.turns
      }, {
        token,
        useRemote: status === "authenticated"
      });

      const summary = getLeaderboardSummary(entries);
      setLeaderboardBest(summary.bestScore);
      setLeaderboardRuns(summary.runs);
    }

    void persistRun();
  }, [profile?.sUserName, savedRunId, status, token, world?.buyIn, world?.result]);

  useEffect(() => {
    if (!activeSession || !token || completedSessionId === activeSession.id || !world) {
      return;
    }

    const completedLine =
      world.event === "lock"
        ? world.lineBurst.rows.length
          ? world.rowLines[world.lineBurst.rows[0]]
          : world.lineBurst.columns.length
            ? world.columnLines[world.lineBurst.columns[0]]
            : null
        : null;
    const missResult = world.result && world.result.reason !== "board-sealed";

    if (!completedLine && !missResult) {
      return;
    }

    const cardsUsed = completedLine
      ? completedLine.cards.filter((card) => !card.seeded).length
      : Math.min(5, Math.max(2, world.turns || 2));
    const finalTotal = completedLine?.total ?? 0;

    const sessionId = activeSession.id;
    const authToken = token;

    setCompletedSessionId(sessionId);

    async function completeSession() {
      try {
        const response = await hubStackemApi.completeGame(authToken, {
          cardsUsed,
          finalTotal,
          gameSessionId: sessionId
        });
        setEconomyMessage(response.body.data.message);
        await refreshProfile();
      } catch (error) {
        const message = error instanceof Error ? error.message : "No reward this time";
        setEconomyMessage(message);
      }
    }

    void completeSession();
  }, [activeSession, completedSessionId, refreshProfile, token, world]);

  useEffect(() => {
    if (!world) {
      return;
    }

    if (
      world.event === "place" ||
      world.event === "lock" ||
      world.event === "clear" ||
      world.event === "bust"
    ) {
      placementImpact.stopAnimation();
      placementImpact.setValue(0);
      Animated.sequence([
        Animated.timing(placementImpact, {
          duration: 95,
          toValue: 1,
          useNativeDriver: true
        }),
        Animated.spring(placementImpact, {
          bounciness: 10,
          speed: 20,
          toValue: 0,
          useNativeDriver: true
        })
      ]).start();

      boardPulse.stopAnimation();
      boardPulse.setValue(0);
      Animated.sequence([
        Animated.timing(boardPulse, {
          duration: world.event === "bust" ? 120 : 90,
          toValue: world.event === "bust" ? 1 : 0.82,
          useNativeDriver: true
        }),
        Animated.spring(boardPulse, {
          bounciness: world.event === "bust" ? 6 : 10,
          speed: world.event === "bust" ? 14 : 18,
          toValue: 0,
          useNativeDriver: true
        })
      ]).start();
    }

    if (
      (world.event === "lock" || world.event === "clear") &&
      (world.lineBurst.rows.length || world.lineBurst.columns.length)
    ) {
      setWarningBurst(null);
      setCelebrationBurst({
        cols: world.lineBurst.columns,
        nonce: world.eventNonce,
        rows: world.lineBurst.rows
      });
      lineFlash.stopAnimation();
      lineFlash.setValue(0);
      Animated.sequence([
        Animated.timing(lineFlash, {
          duration: 90,
          toValue: 1,
          useNativeDriver: true
        }),
        Animated.timing(lineFlash, {
          duration: 120,
          toValue: 0.62,
          useNativeDriver: true
        }),
        Animated.timing(lineFlash, {
          duration: 280,
          toValue: 0,
          useNativeDriver: true
        })
      ]).start();
      return;
    }

    if (world.event === "bust" && (world.lineBurst.rows.length || world.lineBurst.columns.length)) {
      setCelebrationBurst(null);
      setWarningBurst({
        cols: world.lineBurst.columns,
        nonce: world.eventNonce,
        rows: world.lineBurst.rows
      });
      lineFlash.stopAnimation();
      lineFlash.setValue(0);
      Animated.sequence([
        Animated.timing(lineFlash, {
          duration: 80,
          toValue: 1,
          useNativeDriver: true
        }),
        Animated.timing(lineFlash, {
          duration: 260,
          toValue: 0,
          useNativeDriver: true
        })
      ]).start();

      boardShake.stopAnimation();
      boardShake.setValue(0);
      Animated.sequence([
        Animated.timing(boardShake, {
          duration: 38,
          toValue: 1,
          useNativeDriver: true
        }),
        Animated.timing(boardShake, {
          duration: 46,
          toValue: -1,
          useNativeDriver: true
        }),
        Animated.timing(boardShake, {
          duration: 54,
          toValue: 0.7,
          useNativeDriver: true
        }),
        Animated.timing(boardShake, {
          duration: 72,
          toValue: 0,
          useNativeDriver: true
        })
      ]).start();
    }
  }, [boardPulse, boardShake, lineFlash, placementImpact, world]);

  useEffect(() => {
    if (!celebrationBurst) {
      return;
    }

    const timeout = setTimeout(() => {
      setCelebrationBurst((current) =>
        current?.nonce === celebrationBurst.nonce ? null : current
      );
    }, 900);

    return () => clearTimeout(timeout);
  }, [celebrationBurst]);

  useEffect(() => {
    if (!warningBurst) {
      return;
    }

    const timeout = setTimeout(() => {
      setWarningBurst((current) =>
        current?.nonce === warningBurst.nonce ? null : current
      );
    }, 650);

    return () => clearTimeout(timeout);
  }, [warningBurst]);

  useEffect(() => {
    const timeout = setTimeout(syncBoardMetrics, 0);
    return () => clearTimeout(timeout);
  }, [boardCell, matrixSize, device.height, device.width, world?.status]);

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponderCapture: (_, gesture) =>
        dragEnabled && Math.abs(gesture.dx) + Math.abs(gesture.dy) > 4,
      onMoveShouldSetPanResponder: (_, gesture) =>
        dragEnabled && Math.abs(gesture.dx) + Math.abs(gesture.dy) > 4,
      onPanResponderGrant: (_, gesture) => {
        syncBoardMetrics();
        dragOffset.setValue({ x: 0, y: 0 });
        leadTileRef.current?.measureInWindow((x, y, width, height) => {
          const activeTile = worldRef.current?.queue[0];

          if (activeTile) {
            setDragGhost({
              height,
              tile: activeTile,
              width,
              x,
              y
            });
          }
        });
        setDragging(true);
      },
      onPanResponderMove: (_, gesture) => {
        dragOffset.setValue({ x: gesture.dx, y: gesture.dy });
        updateHoveredCell(gesture.moveX, gesture.moveY);
      },
      onPanResponderRelease: (_, gesture) => finishDrag(gesture.moveX, gesture.moveY),
      onPanResponderTerminationRequest: () => false,
      onPanResponderTerminate: resetDrag,
      onStartShouldSetPanResponderCapture: () => dragEnabled,
      onStartShouldSetPanResponder: () => dragEnabled
    })
  ).current;

  function syncBoardMetrics() {
    boardRef.current?.measureInWindow((x, y, width, height) => {
      boardMetricsRef.current = { height, width, x, y };
    });
  }

  function measureViewFrame(
    ref: { current: View | null },
    onMeasured: (frame: TileFrame | null) => void
  ) {
    ref.current?.measureInWindow((x, y, width, height) => {
      onMeasured(
        width && height
          ? {
              height,
              width,
              x,
              y
            }
          : null
      );
    });
  }

  function resetTransientState() {
    dragOffset.stopAnimation();
    dragOffset.setValue({ x: 0, y: 0 });
    placementFlightProgress.stopAnimation();
    placementFlightProgress.setValue(0);
    pendingPlacementWorldRef.current = null;
    setQueueAdvanceEffect(null);
    setPendingSpecialMove(null);
    setPlacementFlight(null);
    setDragging(false);
    setDragGhost(null);
    setHoveredCell(null);
  }

  function getBoardCellFrame(row: number, col: number): TileFrame | null {
    const metrics = boardMetricsRef.current;

    if (!metrics) {
      return null;
    }

    const cellInset = boardDense ? 4 : 8;

    return {
      height: boardCell - cellInset,
      width: boardCell - cellInset,
      x: metrics.x + col * (boardCell + boardGap) + cellInset / 2,
      y: metrics.y + row * (boardCell + boardGap) + cellInset / 2
    };
  }

  function measureLeadTileFrame(onMeasured: (frame: TileFrame | null) => void) {
    if (!leadTileRef.current) {
      onMeasured(null);
      return;
    }

    leadTileRef.current.measureInWindow((x, y, width, height) => {
      onMeasured(
        width && height
          ? {
              height,
              width,
              x,
              y
            }
          : null
      );
    });
  }

  function pointToCell(x: number, y: number) {
    const metrics = boardMetricsRef.current;

    if (
      !metrics ||
      x < metrics.x ||
      y < metrics.y ||
      x > metrics.x + metrics.width ||
      y > metrics.y + metrics.height
    ) {
      return null;
    }

    const col = Math.floor(((x - metrics.x) / metrics.width) * GRID_SIZE);
    const row = Math.floor(((y - metrics.y) / metrics.height) * GRID_SIZE);
    return row >= 0 && row < GRID_SIZE && col >= 0 && col < GRID_SIZE
      ? { col, row }
      : null;
  }

  function updateHoveredCell(x: number, y: number) {
    const cell = pointToCell(x, y);
    const nextWorld = worldRef.current;

    if (cell && nextWorld && canPlaceAt(nextWorld, cell.row, cell.col)) {
      setHoveredCell(cell);
    } else {
      setHoveredCell(null);
    }
  }

  function resetDrag() {
    setHoveredCell(null);
    Animated.spring(dragOffset, {
      bounciness: 0,
      speed: 24,
      toValue: { x: 0, y: 0 },
      useNativeDriver: true
    }).start(() => {
      setDragging(false);
      setDragGhost(null);
    });
  }

  function finishDrag(x: number, y: number) {
    const cell = pointToCell(x, y);
    if (cell) {
      const activeGhost = dragGhost;

      dragOffset.stopAnimation((offset) => {
        const startFrame = activeGhost
          ? {
              height: activeGhost.height,
              width: activeGhost.width,
              x: activeGhost.x + offset.x,
              y: activeGhost.y + offset.y
            }
          : undefined;

        dragOffset.setValue({ x: 0, y: 0 });
        setDragging(false);
        setHoveredCell(null);
        setDragGhost(null);
        commitPlacement(cell.row, cell.col, startFrame);
      });
      return;
    }

    resetDrag();
  }

  function applyPlacedWorld(placedWorld: GameWorld) {
    const previousWorld = worldRef.current;
    const gainedLines = Math.max(
      0,
      (placedWorld.linesCompleted ?? 0) - (previousWorld?.linesCompleted ?? 0)
    );
    const boostReward =
      gainedLines > 0 && Date.now() < multiplierEndsAt
        ? gainedLines * (previousWorld?.blackjackBonus ?? placedWorld.blackjackBonus)
        : 0;
    const nextWorld =
      boostReward > 0
        ? {
            ...placedWorld,
            bankroll: placedWorld.bankroll + boostReward,
            message: `${placedWorld.message} X2 boost adds ${formatChipCount(boostReward)}.`,
            payout: placedWorld.payout + boostReward,
            result: placedWorld.result
              ? {
                  ...placedWorld.result,
                  bankroll: placedWorld.result.bankroll + boostReward,
                  payout: placedWorld.result.payout + boostReward,
                  score: placedWorld.result.score + boostReward
                }
              : null,
            score: placedWorld.score + boostReward
          }
        : placedWorld;

    if (previousWorld?.runId === placedWorld.runId) {
      setUndoStack((current) => [...current.slice(-(UNDO_LIMIT * 2)), previousWorld]);
    }

    pendingPlacementWorldRef.current = null;
    setPendingSpecialMove(null);
    setWorld(nextWorld);

    if (nextWorld.event === "bust") {
      void fireHaptic(settings.haptics, "damage");
    } else if (nextWorld.event === "lock" || nextWorld.event === "clear") {
      void fireHaptic(settings.haptics, "confirm");
    } else {
      void fireHaptic(settings.haptics, "tap");
    }
  }

  function beginPlacementFlight({
    action = "place",
    col,
    resolvedTile,
    row,
    sourceTileId,
    startFrame
  }: {
    action?: "place" | "swap";
    col: number;
    resolvedTile?: StackTile;
    row: number;
    sourceTileId?: string;
    startFrame?: TileFrame;
  }) {
    if (motionLocked) {
      return;
    }

    const nextWorld = worldRef.current;
    const lead = nextWorld?.queue[0];

    if (!nextWorld || !lead) {
      return;
    }

    const placedWorld =
      action === "swap"
        ? resolvedTile
          ? swapBoardTile(nextWorld, row, col, resolvedTile)
          : nextWorld
        : placeQueueTile(nextWorld, row, col, resolvedTile);

    if (placedWorld === nextWorld) {
      return;
    }

    const targetFrame = getBoardCellFrame(row, col);
    const queueEffectCards = createQueueAdvanceEffect(
      createQueueSnapshot(nextWorld.queue),
      createQueueSnapshot(placedWorld.queue)
    );

    if (!targetFrame) {
      applyPlacedWorld(placedWorld);
      return;
    }

    const launch = (measuredFrame: TileFrame | null) => {
      if (!measuredFrame) {
        applyPlacedWorld(placedWorld);
        return;
      }

      const nonce = Date.now();
      placementFlightProgress.stopAnimation();
      placementFlightProgress.setValue(0);
      pendingPlacementWorldRef.current = placedWorld;
      setHoveredCell(null);
      setQueueAdvanceEffect(
        queueEffectCards
          ? {
              cards: queueEffectCards,
              nonce
            }
          : null
      );
      setPlacementFlight({
        col,
        end: targetFrame,
        nonce,
        row,
        sourceTileId: sourceTileId ?? lead.id,
        start: measuredFrame,
        tile: resolvedTile ?? lead
      });

      Animated.timing(placementFlightProgress, {
        duration: 700,
        easing: Easing.bezier(0.18, 0.82, 0.22, 1),
        toValue: 1,
        useNativeDriver: true
      }).start(({ finished }) => {
        setQueueAdvanceEffect((current) => (current?.nonce === nonce ? null : current));
        setPlacementFlight((current) => (current?.nonce === nonce ? null : current));

        if (!finished) {
          pendingPlacementWorldRef.current = null;
          return;
        }

        if (pendingPlacementWorldRef.current) {
          applyPlacedWorld(pendingPlacementWorldRef.current);
        }
      });
    };

    if (startFrame) {
      launch(startFrame);
      return;
    }

    syncBoardMetrics();
    measureLeadTileFrame(launch);
  }

  function commitPlacement(row: number, col: number, startFrame?: TileFrame) {
    const nextWorld = worldRef.current;
    const tile = nextWorld?.queue[0];

    if (!nextWorld || interactionLocked) {
      return;
    }

    if (nextWorld.mode === "quake") {
      if (!canSelectQuakeTile(nextWorld, row, col)) {
        return;
      }

      const selectedWorld = selectQuakeTile(nextWorld, row, col);

      if (selectedWorld === nextWorld) {
        return;
      }

      setUndoStack((current) => [...current.slice(-(UNDO_LIMIT * 2)), nextWorld]);
      setWorld(selectedWorld);

      if (selectedWorld.event === "lock") {
        setCelebrationBurst({ cols: [], nonce: selectedWorld.eventNonce, rows: [] });
        void fireHaptic(settings.haptics, "confirm");
      } else if (selectedWorld.event === "bust") {
        setWarningBurst({ cols: [], nonce: selectedWorld.eventNonce, rows: [] });
        void fireHaptic(settings.haptics, "damage");
      } else {
        void fireHaptic(settings.haptics, "tap");
      }

      return;
    }

    if (!tile) {
      return;
    }

    if (isSwapTile(tile)) {
      if (!canSwapAt(nextWorld, row, col)) {
        return;
      }

      setPendingSpecialMove({
        kind: "swap",
        target: { col, row },
        tile
      });
      return;
    }

    if (isWildTile(tile)) {
      if (!canPlaceAt(nextWorld, row, col)) {
        return;
      }

      setPendingSpecialMove({
        kind: "wild",
        target: { col, row },
        tile
      });
      return;
    }

    beginPlacementFlight({
      col,
      row,
      startFrame
    });
  }

  function completeSpecialMove(rank: StandardTileRank) {
    const move = pendingSpecialMove;

    if (!move) {
      return;
    }

    setPendingSpecialMove(null);
    beginPlacementFlight({
      action: move.kind === "swap" ? "swap" : "place",
      col: move.target.col,
      resolvedTile: createSelectedTile(move.tile, rank),
      row: move.target.row,
      sourceTileId: move.tile.id
    });
  }

  function cancelSpecialMove() {
    setPendingSpecialMove(null);
  }

  function undoLastMove() {
    if (!undoAvailable) {
      return;
    }

    resetTransientState();
    setUndoStack((current) => {
      const previousWorld = current[current.length - 1];

      if (previousWorld) {
        setWorld(previousWorld);
      }

      return current.slice(0, -1);
    });
    setUndosUsed((current) => current + 1);

    void fireHaptic(settings.haptics, "tap");
  }

  function buildDifficultyConfig(
    difficultyKey: SetupDifficulty,
    modeOverride: GameMode = selectedMode
  ) {
    const option =
      DIFFICULTY_OPTIONS.find((candidate) => candidate.key === difficultyKey) ??
      DIFFICULTY_OPTIONS[0];

    return {
      blackjackBonus: option.blackjackBonus,
      bustPenalty: option.bustPenalty,
      difficulty: option.key,
      mode: modeOverride,
      openingTiles: option.openingTiles
    };
  }

  useEffect(() => {
    setSelectedDifficulty(requestedDifficulty);
    setSelectedMode(requestedMode);
  }, [requestedDifficulty, requestedMode]);

  useEffect(() => {
    if (currentWorld) {
      return;
    }

    if (!isReady) {
      return;
    }

    if (status === "authenticated") {
      return;
    }

    setClockNow(Date.now());
    setMultiplierEndsAt(0);
    setMultiplierReadyAt(0);
    setLightningReadyAt(0);
    setTimeRemaining(RUN_DURATION_SECONDS);
    setCountdownCue(null);
    countdownCueRef.current = null;
    setWorld(createWorld(selectedBuyIn, buildDifficultyConfig(selectedDifficulty, selectedMode)));
  }, [currentWorld, isReady, selectedBuyIn, selectedDifficulty, selectedMode, status]);

  useEffect(() => {
    if (!freshParam || lastFreshParamRef.current === freshParam) {
      return;
    }

    if (!isReady) {
      return;
    }

    if (status === "authenticated" && !token) {
      return;
    }

    lastFreshParamRef.current = freshParam;
    resetTransientState();
    setCelebrationBurst(null);
    setWarningBurst(null);
    setUndoStack([]);
    setUndosUsed(0);
    setDragging(false);
    setDragGhost(null);
    setHoveredCell(null);
    setMenuOpen(false);
    setSavedRunId(null);
    setClockNow(Date.now());
    setMultiplierEndsAt(0);
    setMultiplierReadyAt(0);
    setLightningReadyAt(0);
    setTimeRemaining(RUN_DURATION_SECONDS);
    setCountdownCue(null);
    countdownCueRef.current = null;

    const nextDifficulty: SetupDifficulty = requestedDifficulty;
    const nextMode: GameMode = requestedMode;
    const nextBuyIn = getSessionBankroll(profile?.nChips);

    setSelectedDifficulty(nextDifficulty);
    setSelectedMode(nextMode);
    setSelectedBuyIn(nextBuyIn);
    setWorld(null);
    void startRun(nextDifficulty, nextBuyIn, nextMode);
  }, [freshParam, isReady, profile?.nChips, requestedDifficulty, requestedMode, status, token]);

  async function startRun(
    difficultyOverride: SetupDifficulty = selectedDifficulty,
    buyInOverride = selectedBuyIn,
    modeOverride: GameMode = selectedMode
  ) {
    if (!canAffordDifficulty(difficultyOverride) || isStartingSession) {
      return;
    }

    setIsStartingSession(false);
    setEconomyMessage(
      status === "authenticated"
        ? "Stack'em run started."
        : "Local practice game. Sign in for chip rewards."
    );

    resetTransientState();
    setCelebrationBurst(null);
    setWarningBurst(null);
    setUndoStack([]);
    setUndosUsed(0);
    setDragging(false);
    setDragGhost(null);
    setHoveredCell(null);
    setMenuOpen(false);
    setSavedRunId(null);
    setClockNow(Date.now());
    setMultiplierEndsAt(0);
    setMultiplierReadyAt(0);
    setLightningReadyAt(0);
    setTimeRemaining(RUN_DURATION_SECONDS);
    setActiveSession(null);
    setCompletedSessionId(null);
    setSelectedDifficulty(difficultyOverride);
    setSelectedMode(modeOverride);
    setWorld(createWorld(buyInOverride, buildDifficultyConfig(difficultyOverride, modeOverride)));
    void fireHaptic(settings.haptics, "confirm");
  }

  function restartRun() {
    const difficultyKey = currentWorld?.difficulty ?? selectedDifficulty;
    const modeKey = currentWorld?.mode ?? selectedMode;

    void startRun(difficultyKey, currentWorld?.buyIn ?? selectedBuyIn, modeKey);
  }

  function startFreshRun() {
    void startRun();
  }

  function playQuakeShake() {
    boardShake.stopAnimation();
    boardShake.setValue(0);
    Animated.sequence([
      Animated.timing(boardShake, {
        duration: 70,
        easing: Easing.linear,
        toValue: 1,
        useNativeDriver: true
      }),
      Animated.timing(boardShake, {
        duration: 70,
        easing: Easing.linear,
        toValue: -1,
        useNativeDriver: true
      }),
      Animated.timing(boardShake, {
        duration: 70,
        easing: Easing.linear,
        toValue: 0,
        useNativeDriver: true
      })
    ]).start();
  }

  function manualQuake() {
    const activeWorld = worldRef.current;

    if (activeWorld?.mode !== "quake" || activeWorld.status !== "playing" || activeWorld.result) {
      return;
    }

    setWorld((previous) => {
      if (previous?.mode !== "quake" || previous.status !== "playing" || previous.result) {
        return previous;
      }

      return triggerQuake(previous, Date.now());
    });
    playQuakeShake();
    void fireHaptic(settings.haptics, "damage");
  }

  function endRun(redirectToLeaderboard = false) {
    const activeWorld = worldRef.current;

    if (!activeWorld || activeWorld.result) {
      return;
    }

    const placedTiles = activeWorld.board.flat().filter(Boolean).length;

    setWorld({
      ...activeWorld,
      event: "clear",
      eventNonce: activeWorld.eventNonce + 1,
      message: "Run banked. Saving progress to the leaderboard.",
      result: {
        bankroll: activeWorld.bankroll,
        linesCompleted: activeWorld.linesCompleted,
        payout: activeWorld.payout,
        placedTiles,
        reason: "board-sealed",
        runId: activeWorld.runId,
        score: activeWorld.score,
        turns: activeWorld.turns
      },
      status: "cleared"
    });
    setMenuOpen(false);
    void fireHaptic(settings.haptics, "confirm");

    if (redirectToLeaderboard) {
      setTimeout(() => {
        router.replace(stackemRoutes.leaderboard);
      }, 280);
    }
  }

  function activateMultiplierBoost() {
    if (!currentWorld || currentWorld.mode === "quake" || currentWorld.result || multiplierCooldownSeconds > 0) {
      return;
    }

    const now = Date.now();
    setClockNow(now);
    setMultiplierEndsAt(now + MULTIPLIER_DURATION_SECONDS * 1000);
    setMultiplierReadyAt(now + MULTIPLIER_RECHARGE_SECONDS * 1000);
    setWorld({
      ...currentWorld,
      message: "X2 live for 10 seconds. Every new 21 pays double."
    });
    void fireHaptic(settings.haptics, "confirm");
  }

  function activateLightningStrike() {
    if (
      !currentWorld ||
      currentWorld.mode === "quake" ||
      currentWorld.result ||
      lightningCooldownSeconds > 0 ||
      completedTwentyOnes <= 0
    ) {
      return;
    }

    const now = Date.now();
    const completedRows = rowLines
      .filter((line) => line.total === TARGET_TOTAL)
      .map((line) => line.index);
    const completedCols = columnLines
      .filter((line) => line.total === TARGET_TOTAL)
      .map((line) => line.index);
    const strikeBonus = Math.round(
      completedTwentyOnes * currentWorld.blackjackBonus * LIGHTNING_BONUS_MULTIPLIER
    );
    setClockNow(now);
    setLightningReadyAt(now + LIGHTNING_RECHARGE_SECONDS * 1000);
    setLightningAnimation({
      nonce: currentWorld.eventNonce + 1,
      targetKeys: board.reduce<string[]>((result, row, rowIndex) => {
        row.forEach((tile, colIndex) => {
          if (!tile) {
            return;
          }

          if (completedRows.includes(rowIndex) || completedCols.includes(colIndex)) {
            result.push(`${rowIndex}:${colIndex}`);
          }
        });

        return result;
      }, [])
    });
    setWorld({
      ...currentWorld,
      bankroll: currentWorld.bankroll + strikeBonus,
      event: "lock",
      eventNonce: currentWorld.eventNonce + 1,
      message: `Lightning strike cashes ${completedTwentyOnes} completed 21s for ${formatChipCount(strikeBonus)}.`,
      payout: currentWorld.payout + strikeBonus,
      score: currentWorld.score + strikeBonus
    });
    void fireHaptic(settings.haptics, "confirm");
  }

  function canSelectBoardCell(row: number, col: number) {
    if (!currentWorld) {
      return false;
    }

    if (currentWorld.mode === "quake") {
      return canSelectQuakeTile(currentWorld, row, col);
    }

    return isSwapTile(leadTile)
      ? canSwapAt(currentWorld, row, col)
      : canPlaceAt(currentWorld, row, col);
  }

  const playerName =
    profile?.sUserName ??
    (status === "authenticated" ? "Player" : "Local");
  const playerMode = `${leaderboardRuns} saved runs`;
  const quakeStackTiles =
    currentWorld?.mode === "quake" && currentWorld.quake
      ? currentWorld.quake.stacks.reduce(
          (total, row) => total + row.reduce((rowTotal, stack) => rowTotal + stack.length, 0),
          0
        )
      : 0;
  const quakeMaxStack =
    currentWorld?.mode === "quake" && currentWorld.quake
      ? currentWorld.quake.stacks.reduce(
          (max, row) => Math.max(max, ...row.map((stack) => stack.length)),
          0
        )
      : 0;
  const cardsLeft = String(
    currentWorld?.mode === "quake"
      ? quakeStackTiles
      : currentWorld
        ? getDeckCountLabel(currentWorld)
        : SHOE_COUNT
  );
  const activeCelebrationRows = celebrationBurst?.rows ?? [];
  const activeCelebrationCols = celebrationBurst?.cols ?? [];
  const activeLightningTargets = lightningAnimation?.targetKeys ?? [];
  const activeLightningFrame = lightningAnimation ? LIGHTNING_STRIKE_GIF : null;
  const activeWarningRows = warningBurst?.rows ?? [];
  const activeWarningCols = warningBurst?.cols ?? [];
  const bustedRows = isQuakeMode
    ? []
    : rowLines
        .filter((line) => line.total > TARGET_TOTAL)
        .map((line) => line.index);
  const bustedCols = isQuakeMode
    ? []
    : columnLines
        .filter((line) => line.total > TARGET_TOTAL)
        .map((line) => line.index);
  const activeBustedRows = Array.from(new Set([...bustedRows, ...activeWarningRows]));
  const activeBustedCols = Array.from(new Set([...bustedCols, ...activeWarningCols]));
  const burstRows = activeBustedRows;
  const burstCols = activeBustedCols;
  const effectsKind = celebrationBurst ? "celebrate" : warningBurst ? "warning" : null;
  const bannerRules =
    currentWorld?.mode === "quake"
      ? [
          { label: "Mode", value: "Quake" },
          { label: "Hold", value: String(currentWorld.quake?.selectedTotal ?? 0) },
          { label: "Stack", value: `${quakeMaxStack}/10` },
          { label: "Tiles", value: cardsLeft }
        ]
      : [
          { label: "Mode", value: "Classic" },
          { label: "21", value: `+${formatChipCount(currentBlackjackBonus)}` },
          {
            label: "Free",
            value: `${dailyFreeGames[currentWorld?.difficulty ?? selectedDifficulty] ?? 0}`
          },
          { label: "Bust", value: `-${formatChipCount(currentBustPenalty)}` },
          { label: "Timer", value: formatTimerLabel(timeRemaining) }
        ];
  const bannerStats = [{ label: "Score", value: currentScoreLabel }];
  const setupWizardTitle = "Choose your difficulty";
  const setupWizardBody =
    "Pick the board pressure and start a 3 minute run.";
  const setupSelectedOpeningLabel = selectedDifficultyOption.openingTiles
    ? `${selectedDifficultyOption.openingTiles} tiles start on the board`
    : "The board starts empty";
  const setupDifficultySummary = `${setupSelectedOpeningLabel}. A 21 pays +${formatChipCount(
    calculateBlackjackBonus(selectedBuyIn, selectedDifficultyOption.blackjackBonus)
  )} and a bust costs -${formatChipCount(
    calculateBustPenalty(selectedBuyIn, selectedDifficultyOption.bustPenalty)
  )}.`;
  const showGameMenu = !currentWorld;
  const specialTargetLabel = pendingSpecialMove
    ? `Row ${pendingSpecialMove.target.row + 1} - Column ${pendingSpecialMove.target.col + 1}`
    : "";
  const specialPickerColumns = isPortraitMobile ? 3 : isLandscapeMobile ? 4 : 5;
  const specialModalWidth = clamp(
    Math.min(frameWidth - outerPad * 2, isDesktop ? 560 : 500),
    320,
    560
  );
  const specialValueTileWidth = clamp(
    Math.floor(
      (specialModalWidth - theme.spacing.lg * 2 - theme.spacing.sm * (specialPickerColumns - 1)) /
        specialPickerColumns
    ),
    82,
    104
  );
  const dragGhostLayer = dragGhost ? (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.dragGhost,
        {
          height: dragGhost.height,
          left: dragGhost.x,
          top: dragGhost.y,
          transform: [
            ...dragOffset.getTranslateTransform(),
            { rotate: "-4deg" },
            { scale: 1.08 }
          ],
          width: dragGhost.width
        }
      ]}
    >
      <TileFace compact dense={queueDense} lead tile={dragGhost.tile} />
    </Animated.View>
  ) : null;
  const placementFlightLayer = placementFlight
    ? (() => {
        const deltaX = placementFlight.end.x - placementFlight.start.x;
        const deltaY = placementFlight.end.y - placementFlight.start.y;
        const direction = deltaX === 0 ? 1 : Math.sign(deltaX);
        const bank = Math.min(4.5, Math.max(1.4, Math.abs(deltaX) / 80)) * direction;
        const arcHeight = Math.max(18, Math.min(36, Math.hypot(deltaX, deltaY) * 0.12));

        return (
          <Animated.View
            pointerEvents="none"
            style={[
              styles.placementFlightCard,
              {
                height: placementFlightProgress.interpolate({
                  inputRange: [0, 0.2, 0.78, 1],
                  outputRange: [
                    placementFlight.start.height,
                    placementFlight.start.height * 1.02,
                    placementFlight.end.height * 1.01,
                    placementFlight.end.height
                  ]
                }),
                left: placementFlight.start.x,
                opacity: placementFlightProgress.interpolate({
                  inputRange: [0, 0.1, 1],
                  outputRange: [0.96, 1, 1]
                }),
                top: placementFlight.start.y,
                transform: [
                  {
                    translateX: placementFlightProgress.interpolate({
                      inputRange: [0, 0.14, 0.82, 1],
                      outputRange: [0, deltaX * 0.06, deltaX + direction * 3, deltaX]
                    })
                  },
                  {
                    translateY: Animated.add(
                      placementFlightProgress.interpolate({
                        inputRange: [0, 0.14, 0.82, 1],
                        outputRange: [0, deltaY * 0.08, deltaY + 3, deltaY]
                      }),
                      placementFlightProgress.interpolate({
                        inputRange: [0, 0.12, 0.48, 0.82, 1],
                        outputRange: [0, -arcHeight * 0.52, -arcHeight, -arcHeight * 0.2, 0]
                      })
                    )
                  },
                  {
                    scale: placementFlightProgress.interpolate({
                      inputRange: [0, 0.16, 0.5, 0.84, 1],
                      outputRange: [1, 1.05, 1.045, 1.01, 1]
                    })
                  },
                  {
                    rotate: placementFlightProgress.interpolate({
                      inputRange: [0, 0.16, 0.72, 1],
                      outputRange: [`${-0.8 * direction}deg`, `${bank}deg`, `${bank * 0.32}deg`, "0deg"]
                    })
                  }
                ],
                width: placementFlightProgress.interpolate({
                  inputRange: [0, 0.2, 0.78, 1],
                  outputRange: [
                    placementFlight.start.width,
                    placementFlight.start.width * 1.02,
                    placementFlight.end.width * 1.01,
                    placementFlight.end.width
                  ]
                })
              }
            ]}
          >
            <TileFace compact dense={queueDense || boardDense} lead tile={placementFlight.tile} />
          </Animated.View>
        );
      })()
    : null;
  const setupOverlay = null;
  const menuOverlay = currentWorld && menuOpen ? (
    <View style={styles.menuOverlay}>
      <Pressable onPress={() => setMenuOpen(false)} style={styles.menuBackdrop} />
      <View style={[styles.bannerMenuPanel, { width: Math.min(frameWidth - outerPad * 2, 360) }]}>
        {!currentWorld.result ? (
          <Pressable
            onPress={() => setMenuOpen(false)}
            style={({ pressed }) => [
              styles.bannerMenuButton,
              pressed && styles.bannerMenuButtonPressed
            ]}
          >
            <Text style={styles.bannerMenuLabel}>Resume Game</Text>
          </Pressable>
        ) : (
          <Pressable
            onPress={() => {
              setMenuOpen(false);
              restartRun();
            }}
            style={({ pressed }) => [
              styles.bannerMenuButton,
              styles.bannerMenuButtonPrimary,
              pressed && styles.bannerMenuButtonPressed
            ]}
          >
            <Text style={styles.bannerMenuLabelPrimary}>Start Game</Text>
          </Pressable>
        )}
        <Pressable
          onPress={() => {
            setMenuOpen(false);
            startFreshRun();
          }}
          style={({ pressed }) => [
            styles.bannerMenuButton,
            pressed && styles.bannerMenuButtonPressed
          ]}
        >
          <Text style={styles.bannerMenuLabel}>New Game</Text>
          <Text style={styles.bannerMenuMeta}>Cancels current progress</Text>
        </Pressable>
        <View style={styles.bannerMenuGrid}>
          <Pressable
            onPress={() => {
              setMenuOpen(false);
              router.push(stackemRoutes.leaderboard);
            }}
            style={({ pressed }) => [
              styles.bannerMenuMiniButton,
              pressed && styles.bannerMenuButtonPressed
            ]}
          >
            <Text style={styles.bannerMenuMiniLabel}>Leaderboard</Text>
          </Pressable>
          <Pressable
            onPress={() => {
              setMenuOpen(false);
              router.push(stackemRoutes.store);
            }}
            style={({ pressed }) => [
              styles.bannerMenuMiniButton,
              pressed && styles.bannerMenuButtonPressed
            ]}
          >
            <Text style={styles.bannerMenuMiniLabel}>Store</Text>
          </Pressable>
          <Pressable
            onPress={() => {
              setMenuOpen(false);
              router.push(stackemRoutes.settings);
            }}
            style={({ pressed }) => [
              styles.bannerMenuMiniButton,
              pressed && styles.bannerMenuButtonPressed
            ]}
          >
            <Text style={styles.bannerMenuMiniLabel}>Settings</Text>
          </Pressable>
          <Pressable
            onPress={() => {
              setMenuOpen(false);
              router.replace(stackemRoutes.lobby);
            }}
            style={({ pressed }) => [
              styles.bannerMenuMiniButton,
              pressed && styles.bannerMenuButtonPressed
            ]}
          >
            <Text style={styles.bannerMenuMiniLabel}>Home</Text>
          </Pressable>
          <Pressable
            onPress={() => {
              setMenuOpen(false);
              void fireHaptic(settings.haptics, "tap");
              void openBigSlickGamesWebsite();
            }}
            style={({ pressed }) => [
              styles.bannerMenuMiniButton,
              styles.bannerMenuHubButton,
              pressed && styles.bannerMenuButtonPressed
            ]}
          >
            <Text style={styles.bannerMenuMiniLabel}>BSG Hub</Text>
          </Pressable>
        </View>
      </View>
    </View>
  ) : null;
  const specialOverlay = pendingSpecialMove ? (
    <View style={styles.specialOverlay}>
      <Pressable onPress={cancelSpecialMove} style={styles.menuBackdrop} />
      <View style={[styles.specialModal, { width: specialModalWidth }]}>
        <LinearGradient
          colors={pendingSpecialMove.kind === "wild" ? ["#f0d78f", "#d59f55"] : ["#bce4ff", "#6baee5"]}
          end={{ x: 1, y: 1 }}
          start={{ x: 0, y: 0 }}
          style={styles.specialHero}
        >
          <View style={styles.specialHeroOrb} />
          <View style={styles.specialHeroCopy}>
            <Text style={styles.specialKicker}>
              {pendingSpecialMove.kind === "wild" ? "Wild Tile" : "Swap Tile"}
            </Text>
            <Text style={styles.specialTitle}>
              {pendingSpecialMove.kind === "wild" ? "Choose a value" : "Swap the target"}
            </Text>
            <Text style={styles.specialHint}>
              {pendingSpecialMove.kind === "wild"
                ? `Select the value for ${specialTargetLabel}.`
                : `Choose the tile that will replace ${specialTargetLabel}.`}
            </Text>
          </View>
          <View style={styles.specialHeroTile}>
            <TileFace compact lead tile={pendingSpecialMove.tile} />
          </View>
        </LinearGradient>
        <View style={styles.specialMetaRow}>
          <View style={styles.specialMetaCard}>
            <Text style={styles.specialMetaLabel}>Target</Text>
            <Text style={styles.specialMetaValue}>{specialTargetLabel}</Text>
          </View>
          <View style={styles.specialMetaCard}>
            <Text style={styles.specialMetaLabel}>Action</Text>
            <Text style={styles.specialMetaValue}>
              {pendingSpecialMove.kind === "wild" ? "Place chosen value" : "Replace existing tile"}
            </Text>
          </View>
        </View>
        <View style={styles.specialValueGrid}>
          {SPECIAL_VALUE_OPTIONS.map((option) => (
            <Pressable
              key={option.rank}
              onPress={() => completeSpecialMove(option.rank)}
              style={({ pressed }) => [
                styles.specialValueChip,
                { width: specialValueTileWidth },
                pressed && styles.specialValueChipPressed
              ]}
            >
              <LinearGradient
                colors={["#f7f4e8", "#d4be78"]}
                end={{ x: 1, y: 1 }}
                start={{ x: 0, y: 0 }}
                style={styles.specialValueSurface}
              >
                <Text style={styles.specialValueText}>{option.label}</Text>
                <Text style={styles.specialValueNote}>{getSpecialOptionHint(option.rank)}</Text>
              </LinearGradient>
            </Pressable>
          ))}
        </View>
        <Pressable onPress={cancelSpecialMove} style={styles.specialCancel}>
          <Text style={styles.specialCancelText}>Cancel</Text>
        </Pressable>
      </View>
    </View>
  ) : null;
  function renderGameBanner(padding: number, compact: boolean) {
    if (isQuakeMode) {
      return (
        <View
          ref={bannerRef}
          style={[
            styles.quakeHud,
            compact && styles.quakeHudCompact,
            { borderRadius: radius, minHeight: compact ? topHeight : topHeight, padding }
          ]}
        >
          <View style={styles.quakeHudPlate} />
          <View style={styles.quakeHudScorePanel}>
            <Text style={styles.quakeHudLabel}>Score</Text>
            <Text style={styles.quakeHudScore}>{currentScoreLabel}</Text>
            <Text style={styles.quakeHudBest}>Best {formatChipCount(leaderboardBest)}</Text>
          </View>

          <View style={styles.quakeHudTimerPanel}>
            <Text style={styles.quakeHudLabel}>Next Quake</Text>
            <Text style={styles.quakeHudTimer}>{timerDisplay}</Text>
            <View style={styles.quakeHudProgressTrack}>
              {Array.from({ length: 6 }, (_, index) => (
                <View
                  key={`quake-timer-segment-${index}`}
                  style={[
                    styles.quakeHudProgressSegment,
                    index / 6 < timerProgress && styles.quakeHudProgressSegmentLit
                  ]}
                />
              ))}
            </View>
          </View>

          <View style={styles.quakeHudActions}>
            {currentWorld ? (
              <Pressable
                onPress={() => setMenuOpen((current) => !current)}
                style={({ pressed }) => [
                  styles.quakeHudButton,
                  pressed && styles.quakeHudButtonPressed
                ]}
              >
                <Text style={styles.quakeHudButtonText}>II</Text>
              </Pressable>
            ) : null}
            <Pressable
              onPress={() => router.replace(stackemRoutes.lobby)}
              style={({ pressed }) => [
                styles.quakeHudButton,
                pressed && styles.quakeHudButtonPressed
              ]}
            >
              <Text style={styles.quakeHudButtonText}>X</Text>
            </Pressable>
          </View>
        </View>
      );
    }

    return (
      <View
        ref={bannerRef}
        style={[
        styles.strip,
        styles.bannerScoreBar,
          { borderRadius: radius, minHeight: compact ? topHeight : topHeight, padding },
          isQuakeMode && styles.bannerScoreBarQuake
        ]}
      >
        <View style={styles.bannerHeader}>
          <View style={styles.bannerHeaderMeta}>
            <Text style={styles.bannerHeaderKicker}>Score</Text>
            <Text style={styles.bannerHeaderValue}>{currentScoreLabel}</Text>
            <Text numberOfLines={1} style={styles.bannerHeaderKicker}>
              {playerName.toUpperCase()} / {cardsLeft} TILES
            </Text>
            {economyMessage ? (
              <Text numberOfLines={1} style={styles.bannerEconomyMessage}>
                {economyMessage}
              </Text>
            ) : null}
          </View>
          <View style={styles.bannerHeaderActions}>
            <Animated.View
              style={[
                styles.bannerRuleChip,
                styles.bannerRuleChipTimer,
                {
                  opacity: timerFlash.interpolate({
                    inputRange: [0, 1],
                    outputRange: [1, 0.54]
                  }),
                  transform: [
                    {
                      scale: timerFlash.interpolate({
                        inputRange: [0, 1],
                        outputRange: [1, 1.08]
                      })
                    }
                  ]
                }
              ]}
            >
              <View
                pointerEvents="none"
                style={[
                  styles.bannerTimerFill,
                  { width: `${timerProgress * 100}%` }
                ]}
              />
              <Text style={styles.bannerRuleLabel}>{isQuakeMode ? "Next Quake" : "Timer"}</Text>
              <Text style={styles.bannerRuleValue}>{timerDisplay}</Text>
            </Animated.View>
            {currentWorld ? (
              <Pressable
                onPress={() => setMenuOpen((current) => !current)}
                style={({ pressed }) => [
                  styles.bannerExitButton,
                  pressed && styles.bannerExitButtonPressed
                ]}
              >
                <Text style={styles.bannerExitGlyph}>|||</Text>
              </Pressable>
            ) : null}
            <Pressable
              onPress={() => router.replace(stackemRoutes.lobby)}
              style={({ pressed }) => [
                styles.bannerExitButton,
                pressed && styles.bannerExitButtonPressed
              ]}
            >
              <Text style={styles.bannerExitGlyph}>X</Text>
            </Pressable>
          </View>
        </View>
      </View>
    );
  }

  function renderQueueUndoTray(tileWidth: number, tileHeight: number, gap: number) {
    const queueSlots = isQuakeMode ? GRID_SIZE : HAND_SIZE;
    const effectiveTileWidth = isQuakeMode
      ? boardCell
      : tileWidth;
    const effectiveTileHeight = isQuakeMode ? boardCell : tileHeight;
    const queueWidth = effectiveTileWidth * queueSlots + gap * (queueSlots - 1);
    const queueWithUndoWidth = isQuakeMode ? queueWidth : queueWidth + gap + effectiveTileWidth;

    if (!currentWorld) {
      return (
        <View style={[styles.utilityColumn, styles.utilityColumnCentered, { gap, width: queueWithUndoWidth }]}>
          <Pressable
            disabled={isStartingSession || !canAfford}
            onPress={startFreshRun}
            style={({ pressed }) => [
              styles.utilityButton,
              styles.utilityActionButton,
              styles.utilityButtonFull,
              { minHeight: tileHeight, width: queueWithUndoWidth },
              (isStartingSession || !canAfford) && styles.utilityButtonDisabled,
              pressed && !isStartingSession && canAfford && styles.utilityButtonPressed
            ]}
          >
            <Text style={styles.utilityButtonText}>
              {isStartingSession ? "Starting" : isQuakeMode ? "Start Quake" : "Start Game"}
            </Text>
            <Text style={styles.utilityMeta}>
              {!canAfford ? "Need 50 chips" : isQuakeMode ? "Full board" : "Load waiting tiles"}
            </Text>
          </Pressable>
        </View>
      );
    }

    return (
      <View style={[styles.utilityColumn, styles.utilityColumnCentered, { gap, width: queueWithUndoWidth }]}>
        {currentWorld.mode === "quake" ? (
          <View style={styles.quakeHoldingMeta}>
            <Text style={styles.quakeHoldingLabel}>Holding Zone</Text>
            <Text style={styles.quakeHoldingValue}>
              Total {currentWorld.quake?.selectedTotal ?? 0} - {5 - (currentWorld.quake?.holding.length ?? 0)} spots left
            </Text>
          </View>
        ) : null}
        <View style={[styles.queueUndoRow, { gap, width: queueWithUndoWidth }]}>
          <View ref={queueStageRef}>{renderQueue(effectiveTileWidth, effectiveTileHeight, gap)}</View>
          {!isQuakeMode ? (
            <View ref={undoButtonRef}>
              <Pressable
                disabled={!undoAvailable}
                onPress={undoLastMove}
                style={({ pressed }) => [
                  styles.utilityButton,
                  styles.queueUndoButton,
                  { height: tileHeight, width: tileWidth },
                  !undoAvailable && styles.utilityButtonDisabled,
                  pressed && undoAvailable && styles.utilityButtonPressed
                ]}
              >
                <Text style={styles.utilityGlyph}>{"\u21B6"}</Text>
                <Text style={styles.utilityMeta}>{undoRemaining}</Text>
              </Pressable>
            </View>
          ) : null}
        </View>
        {currentWorld.mode !== "quake" ? (
          <View style={styles.utilityRow}>
            <Pressable
              disabled={!currentWorld || Boolean(currentWorld.result)}
              onPress={() => endRun(true)}
              style={({ pressed }) => [
                styles.utilityButton,
                styles.utilityActionButton,
                styles.utilityButtonFull,
                (!currentWorld || currentWorld.result) && styles.utilityButtonDisabled,
                pressed && currentWorld && !currentWorld.result && styles.utilityButtonPressed
              ]}
            >
              <Text style={styles.utilityButtonText}>End Game</Text>
              <Text style={styles.utilityMeta}>Save + leaderboard</Text>
            </Pressable>
          </View>
        ) : null}
      </View>
    );
  }

  function renderQueueContent(
    tile: StackTile | null,
    tileWidth: number,
    tileHeight: number,
    lead: boolean
  ) {
    if (!tile) {
      const emptyInset = isQuakeMode ? Math.max(5, Math.round(tileWidth * 0.12)) : 0;
      return (
        <View style={{ alignItems: "center", height: tileHeight, justifyContent: "center", width: tileWidth }}>
          <View
            style={[
              styles.emptyTile,
              isQuakeMode && styles.emptyTileQuakeHolding,
              { height: tileHeight - emptyInset * 2, width: tileWidth - emptyInset * 2 }
            ]}
          />
        </View>
      );
    }

    return (
      <TileFace
        compact
        dense={queueDense}
        dimmed={!lead && !isQuakeMode}
        lead={lead}
        quake={isQuakeMode}
        tile={tile}
      />
    );
  }

  function renderQueueAdvanceOverlay(tileWidth: number, tileHeight: number, gap: number) {
    if (!queueAdvanceEffect) {
      return null;
    }

    const slotStep = tileWidth + gap;

    return (
      <View pointerEvents="none" style={styles.queueEffectsLayer}>
        {queueAdvanceEffect.cards.map((card, index) => {
          const liftHeight =
            card.kind === "deal"
              ? Math.max(16, Math.round(tileHeight * 0.26))
              : Math.max(10, Math.round(tileHeight * 0.18));
          const settleOvershoot = card.kind === "deal" ? -6 : -4;
          const startOffset =
            (card.fromIndex - card.toIndex) * slotStep +
            (card.kind === "deal" ? Math.min(24, Math.round(tileWidth * 0.18)) : 0);
          const holdStart = card.kind === "deal" ? 0.48 + index * 0.05 : 0.3 + index * 0.04;
          const movePeak = Math.min(0.9, holdStart + (card.kind === "deal" ? 0.32 : 0.36));

          return (
            <Animated.View
              key={`queue-advance-${queueAdvanceEffect.nonce}-${card.tile.id}`}
              style={[
                styles.queueEffectCard,
                card.lead && styles.queueCardLead,
                {
                  height: tileHeight,
                  left: card.toIndex * slotStep,
                  opacity: placementFlightProgress.interpolate({
                    inputRange:
                      card.kind === "deal" ? [0, holdStart - 0.08, holdStart, 1] : [0, 1],
                    outputRange:
                      card.kind === "deal" ? [0, 0, 0.82, 1] : [0.92, 1],
                    extrapolate: "clamp"
                  }),
                  transform: [
                    {
                      translateX: placementFlightProgress.interpolate({
                        inputRange: [0, holdStart, movePeak, 1],
                        extrapolate: "clamp",
                        outputRange: [startOffset, startOffset, settleOvershoot, 0]
                      })
                    },
                    {
                      translateY: placementFlightProgress.interpolate({
                        inputRange: [0, holdStart, holdStart + 0.16, movePeak, 1],
                        extrapolate: "clamp",
                        outputRange: [0, 0, -liftHeight, -2, 0]
                      })
                    },
                    {
                      scale: placementFlightProgress.interpolate({
                        inputRange: [0, holdStart, holdStart + 0.14, movePeak, 1],
                        extrapolate: "clamp",
                        outputRange: [
                          card.kind === "deal" ? 0.96 : 1,
                          card.kind === "deal" ? 0.96 : 1,
                          1.03,
                          1.01,
                          1
                        ]
                      })
                    },
                    {
                      rotate: placementFlightProgress.interpolate({
                        inputRange: [0, holdStart, movePeak, 1],
                        extrapolate: "clamp",
                        outputRange: [
                          "0deg",
                          "0deg",
                          card.lead ? "-0.8deg" : "-0.35deg",
                          "0deg"
                        ]
                      })
                    }
                  ],
                  width: tileWidth
                }
              ]}
            >
              {renderQueueContent(card.tile, tileWidth, tileHeight, card.lead)}
            </Animated.View>
          );
        })}
      </View>
    );
  }

  function renderQueue(tileWidth: number, tileHeight: number, gap: number) {
    const queueSlots = isQuakeMode ? GRID_SIZE : HAND_SIZE;
    const totalWidth = tileWidth * queueSlots + gap * (queueSlots - 1);
    const hiddenTileIds = new Set<string>();

    return (
      <View style={[styles.queueStage, { height: tileHeight, width: totalWidth }]}>
        <View style={[styles.queueRow, { gap }]}>
          {Array.from({ length: queueSlots }, (_, index) => {
            const tile = queue[index] ?? null;
            const visibleTile = tile && !hiddenTileIds.has(tile.id) ? tile : null;
            const lead = !isQuakeMode && index === 0;
            const content = renderQueueContent(visibleTile, tileWidth, tileHeight, lead);

            if (visibleTile && lead && dragEnabled) {
              return (
                <Animated.View
                  key={`q-${index}`}
                  {...panResponder.panHandlers}
                  ref={leadTileRef}
                  style={[
                    styles.queueCard,
                    styles.queueCardLead,
                    dragging && styles.queueCardDragging,
                    {
                      height: tileHeight,
                      opacity: dragging ? 0.14 : 1,
                      width: tileWidth
                    }
                  ]}
                >
                  {content}
                </Animated.View>
              );
            }

            return (
              <View
                key={`q-${index}`}
                style={[styles.queueSlot, { height: tileHeight, width: tileWidth }]}
              >
                {content}
              </View>
            );
          })}
        </View>
        {renderQueueAdvanceOverlay(tileWidth, tileHeight, gap)}
      </View>
    );
  }

  const boardBurstLayer =
    activeCelebrationRows.length ||
    activeCelebrationCols.length ||
    activeWarningRows.length ||
    activeWarningCols.length ? (
      <View
        pointerEvents="none"
        style={[styles.lineBurstLayer, { height: boardSize, left: boardPadX, top: boardPadY, width: boardSize }]}
      >
        {activeCelebrationRows.map((rowIndex) => (
          <Animated.View
            key={`line-burst-row-celebrate-${rowIndex}`}
            style={[
              styles.lineBurstBand,
              styles.lineBurstBandRow,
              styles.lineBurstCelebrate,
              {
                height: boardCell,
                top: boardRail + boardGap + rowIndex * (boardCell + boardGap),
                width: boardSize
              },
              {
                opacity: lineFlash.interpolate({
                  inputRange: [0, 0.18, 1],
                  outputRange: [0, 1, 0]
                }),
                transform: [
                  {
                    scaleX: lineFlash.interpolate({
                      inputRange: [0, 0.2, 1],
                      outputRange: [0.94, 1.02, 1]
                    })
                  }
                ]
              }
            ]}
          />
        ))}
        {activeCelebrationCols.map((colIndex) => (
          <Animated.View
            key={`line-burst-col-celebrate-${colIndex}`}
            style={[
              styles.lineBurstBand,
              styles.lineBurstBandColumn,
              styles.lineBurstCelebrate,
              {
                height: boardSize,
                left: boardRail + boardGap + colIndex * (boardCell + boardGap),
                width: boardCell
              },
              {
                opacity: lineFlash.interpolate({
                  inputRange: [0, 0.18, 1],
                  outputRange: [0, 1, 0]
                }),
                transform: [
                  {
                    scaleY: lineFlash.interpolate({
                      inputRange: [0, 0.2, 1],
                      outputRange: [0.94, 1.02, 1]
                    })
                  }
                ]
              }
            ]}
          />
        ))}
        {activeWarningRows.map((rowIndex) => (
          <Animated.View
            key={`line-burst-row-warning-${rowIndex}`}
            style={[
              styles.lineBurstBand,
              styles.lineBurstBandRow,
              styles.lineBurstWarning,
              {
                height: boardCell,
                top: boardRail + boardGap + rowIndex * (boardCell + boardGap),
                width: boardSize
              },
              {
                opacity: lineFlash.interpolate({
                  inputRange: [0, 0.14, 1],
                  outputRange: [0, 1, 0]
                }),
                transform: [
                  {
                    scaleX: lineFlash.interpolate({
                      inputRange: [0, 0.16, 1],
                      outputRange: [0.96, 1.02, 1]
                    })
                  }
                ]
              }
            ]}
          />
        ))}
        {activeWarningCols.map((colIndex) => (
          <Animated.View
            key={`line-burst-col-warning-${colIndex}`}
            style={[
              styles.lineBurstBand,
              styles.lineBurstBandColumn,
              styles.lineBurstWarning,
              {
                height: boardSize,
                left: boardRail + boardGap + colIndex * (boardCell + boardGap),
                width: boardCell
              },
              {
                opacity: lineFlash.interpolate({
                  inputRange: [0, 0.14, 1],
                  outputRange: [0, 1, 0]
                }),
                transform: [
                  {
                    scaleY: lineFlash.interpolate({
                      inputRange: [0, 0.16, 1],
                      outputRange: [0.96, 1.02, 1]
                    })
                  }
                ]
              }
            ]}
          />
        ))}
      </View>
    ) : null;

  const boardPanel = (
    <Animated.View
      style={[
        styles.strip,
        styles.boardStrip,
        {
          backgroundColor: appearance.boardBackground,
          borderColor: appearance.boardBorder,
          borderRadius: radius,
          height: boardPanelHeight,
          paddingHorizontal: boardPadX,
          paddingVertical: boardPadY,
          transform: [
            {
              translateX: boardShake.interpolate({
                inputRange: [-1, 0, 1],
                outputRange: [-7, 0, 7]
              })
            },
            {
              scale: boardPulse.interpolate({
                inputRange: [0, 1],
                outputRange: [1, effectsKind === "celebrate" ? 1.012 : 0.992]
              })
            }
          ],
          width: boardPanelWidth
        },
        isQuakeMode && styles.boardStripQuake
      ]}
    >
      {boardBurstLayer}
      {isQuakeMode ? (
        <View pointerEvents="none" style={styles.quakeBoardSurface}>
          <View style={[styles.quakeBoardCrack, styles.quakeBoardCrackA]} />
          <View style={[styles.quakeBoardCrack, styles.quakeBoardCrackB]} />
          <View style={[styles.quakeBoardCrack, styles.quakeBoardCrackC]} />
          <View style={[styles.quakeBoardGlow, styles.quakeBoardGlowA]} />
          <View style={[styles.quakeBoardGlow, styles.quakeBoardGlowB]} />
        </View>
      ) : null}
      <View style={[styles.boardShell, { gap: boardGap, height: boardSize, width: boardSize }]}>
        {!isQuakeMode ? (
          <View style={[styles.axisRow, { gap: boardGap }]}>
            <View style={{ height: boardRail, width: boardRail }} />
            <View style={[styles.axisTrack, { gap: boardGap, height: boardRail, width: matrixSize }]}>
              {columnLines.map((line, index) => (
                <View key={`c-${index}`} style={{ height: boardRail, width: boardCell }}>
                  <LinePill
                    busted={activeBustedCols.includes(index)}
                    celebrating={activeCelebrationCols.includes(index)}
                    dense={boardDense}
                    flashValue={
                      activeCelebrationCols.includes(index) || activeWarningCols.includes(index)
                        ? lineFlash
                        : undefined
                    }
                    flashVariant={
                      activeCelebrationCols.includes(index)
                        ? "celebrate"
                        : activeWarningCols.includes(index)
                          ? "warning"
                          : undefined
                    }
                    label={`C${index + 1}`}
                    line={preview && hoveredCell?.col === index ? preview.column : line}
                  />
                </View>
              ))}
            </View>
          </View>
        ) : null}

        <View style={[styles.boardBody, { gap: boardGap }]}>
          {!isQuakeMode ? (
            <View style={[styles.axisColumn, { gap: boardGap, width: boardRail }]}>
              {rowLines.map((line, index) => (
                <View key={`r-${index}`} style={{ height: boardCell, width: boardRail }}>
                  <LinePill
                    busted={activeBustedRows.includes(index)}
                    celebrating={activeCelebrationRows.includes(index)}
                    dense={boardDense}
                    flashValue={
                      activeCelebrationRows.includes(index) || activeWarningRows.includes(index)
                        ? lineFlash
                        : undefined
                    }
                    flashVariant={
                      activeCelebrationRows.includes(index)
                        ? "celebrate"
                        : activeWarningRows.includes(index)
                          ? "warning"
                          : undefined
                    }
                    label={`R${index + 1}`}
                    line={preview && hoveredCell?.row === index ? preview.row : line}
                  />
                </View>
              ))}
            </View>
          ) : null}

          <View
            ref={boardRef}
            onLayout={syncBoardMetrics}
            style={[styles.matrix, { gap: boardGap, height: matrixSize, width: matrixSize }]}
          >
            {board.map((row, rowIndex) => (
              <View key={`row-${rowIndex}`} style={[styles.matrixRow, { gap: boardGap, height: boardCell }]}>
                {row.map((tile, colIndex) => (
                  <View key={`cell-${rowIndex}-${colIndex}`} style={{ height: boardCell, width: boardCell }}>
                    <BoardCell
                      busted={
                        activeBustedRows.includes(rowIndex) || activeBustedCols.includes(colIndex)
                      }
                      canPlace={
                        currentWorld
                          ? canSelectBoardCell(rowIndex, colIndex)
                          : false
                      }
                      dense={boardDense}
                      hovered={hoveredCell?.row === rowIndex && hoveredCell?.col === colIndex}
                      impactValue={
                        currentWorld?.lastPlacement?.row === rowIndex &&
                        currentWorld?.lastPlacement?.col === colIndex
                          ? placementImpact
                          : undefined
                      }
                      lastPlaced={
                        currentWorld?.lastPlacement?.row === rowIndex &&
                        currentWorld?.lastPlacement?.col === colIndex
                      }
                      lightningFrame={activeLightningFrame}
                      lightningStriking={activeLightningTargets.includes(`${rowIndex}:${colIndex}`)}
                      locked={
                        rowLines[rowIndex].status === "locked" ||
                        columnLines[colIndex].status === "locked"
                      }
                      mode={currentWorld?.mode}
                      onPress={() => commitPlacement(rowIndex, colIndex)}
                      stackHeight={currentWorld?.quake?.stacks[rowIndex]?.[colIndex]?.length ?? 0}
                      stackTiles={currentWorld?.quake?.stacks[rowIndex]?.[colIndex] ?? []}
                      tile={tile}
                    />
                  </View>
                ))}
              </View>
            ))}
          </View>
        </View>
      </View>

    </Animated.View>
  );

  const portraitProfile = renderGameBanner(framePad, false);
  const bottomTray = (
    <View
      style={[
        styles.strip,
        styles.sideCard,
        isQuakeMode && styles.sideCardQuake,
        {
          borderRadius: radius,
          padding: isPortraitMobile ? framePad : railPad,
          width: "100%"
        }
      ]}
    >
      {renderQueueUndoTray(
        isPortraitMobile ? portraitQueueTileWidth : railQueueTileWidth,
        isPortraitMobile ? portraitQueueTileHeight : railQueueTileHeight,
        isPortraitMobile ? portraitQueueGap : railGap
      )}
    </View>
  );
  const manualQuakeButton = isQuakeMode ? (
    <Pressable
      disabled={!currentWorld || currentWorld.status !== "playing" || Boolean(currentWorld.result)}
      onPress={manualQuake}
      style={({ pressed }) => [
        styles.manualQuakeButton,
        (!currentWorld || currentWorld.status !== "playing" || currentWorld.result) &&
          styles.manualQuakeButtonDisabled,
        pressed &&
          currentWorld?.status === "playing" &&
          !currentWorld.result &&
          styles.manualQuakeButtonPressed
      ]}
    >
      <Text style={styles.manualQuakeButtonText}>Quake</Text>
      <Text style={styles.manualQuakeButtonMeta}>Force wave · timer advances</Text>
    </Pressable>
  ) : null;
  const quakeFrameChrome = isQuakeMode ? (
    <View pointerEvents="none" style={styles.quakeFrameChrome}>
      <View style={[styles.quakeLavaRail, styles.quakeLavaRailLeft]} />
      <View style={[styles.quakeLavaRail, styles.quakeLavaRailRight]} />
      <View style={[styles.quakeLavaGlow, styles.quakeLavaGlowTop]} />
      <View style={[styles.quakeLavaGlow, styles.quakeLavaGlowBottom]} />
      <View style={[styles.quakeRockShard, styles.quakeRockShardA]} />
      <View style={[styles.quakeRockShard, styles.quakeRockShardB]} />
      <View style={[styles.quakeRockShard, styles.quakeRockShardC]} />
      <View style={[styles.quakeRockShard, styles.quakeRockShardD]} />
    </View>
  ) : null;
  const portraitShell = (
    <View
      style={[
        styles.frame,
        styles.mobileFrame,
        styles.gameStackFrame,
        isQuakeMode && styles.gameStackFrameQuake,
        { gap: frameGap, width: frameWidth }
      ]}
    >
      {quakeFrameChrome}
      <View style={isQuakeMode && styles.quakeContentLayer}>{portraitProfile}</View>
      <View style={isQuakeMode && styles.quakeContentLayer}>{manualQuakeButton}</View>
      <View style={[styles.boardWrap, isQuakeMode && styles.quakeContentLayer]}>{boardPanel}</View>
      <View style={isQuakeMode && styles.quakeContentLayer}>{bottomTray}</View>
    </View>
  );

  const splitShell = (
    <View
      style={[
        styles.frame,
        styles.splitFrame,
        isQuakeMode && styles.gameStackFrameQuake,
        {
          gap: frameGap,
          height: frameHeight,
          padding: framePad,
          width: frameWidth
        }
      ]}
    >
      {quakeFrameChrome}
      <View style={isQuakeMode && styles.quakeContentLayer}>{renderGameBanner(framePad, true)}</View>
      <View style={isQuakeMode && styles.quakeContentLayer}>{manualQuakeButton}</View>
      <View style={[styles.boardWrap, isQuakeMode && styles.quakeContentLayer]}>{boardPanel}</View>
      <View style={isQuakeMode && styles.quakeContentLayer}>{bottomTray}</View>
    </View>
  );

  if (isMobile) {
    return (
      <StackemAppearanceContext.Provider value={appearance}>
        <View style={[styles.root, isQuakeMode && styles.rootQuake]}>
          <AppBackdrop />
          <SafeAreaView edges={["top", "bottom", "left", "right"]} style={styles.safe}>
            <ScrollView
              contentContainerStyle={[
                styles.mobileScrollContent,
                { paddingBottom: outerPad, paddingHorizontal: outerPad, paddingTop: outerPad }
              ]}
              scrollEnabled={!dragging}
              showsVerticalScrollIndicator={false}
              style={styles.safe}
            >
              {isPortraitMobile ? portraitShell : splitShell}
            </ScrollView>
          </SafeAreaView>
      {setupOverlay}
      {menuOverlay}
      {specialOverlay}
      {placementFlightLayer}
      {dragGhostLayer}
        </View>
      </StackemAppearanceContext.Provider>
    );
  }

  return (
    <StackemAppearanceContext.Provider value={appearance}>
      <View style={[styles.root, isQuakeMode && styles.rootQuake]}>
        <AppBackdrop />
        <SafeAreaView edges={["top", "bottom", "left", "right"]} style={styles.safe}>
          <View style={[styles.stage, { padding: outerPad }]}>{splitShell}</View>
        </SafeAreaView>
        {setupOverlay}
        {menuOverlay}
        {specialOverlay}
        {placementFlightLayer}
        {dragGhostLayer}
      </View>
    </StackemAppearanceContext.Provider>
  );

  return (
    <View style={styles.root}>
      <AppBackdrop />
      <SafeAreaView edges={["top", "bottom", "left", "right"]} style={styles.safe}>
        <View
          style={[
            styles.stage,
            { justifyContent: isDesktop ? "center" : "flex-start", padding: outerPad }
          ]}
        >
          <View
            style={[
              styles.frame,
              {
                gap: frameGap,
                height: effectiveFrameHeight,
                padding: framePad,
                width: frameWidth
              }
            ]}
          >
            <View
              style={[
                styles.strip,
                styles.topStrip,
                { borderRadius: radius, minHeight: topHeight, padding: stripPad }
              ]}
            >
              <View style={styles.identity}>
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{playerName.slice(0, 2).toUpperCase()}</Text>
                </View>
                <View style={styles.identityCopy}>
                  <Text numberOfLines={1} style={styles.playerName}>
                    {playerName}
                  </Text>
                  <Text numberOfLines={1} style={styles.playerMeta}>
                    {playerMode} · {leaderboardRuns} saved
                  </Text>
                </View>
              </View>
              <View style={styles.statRow}>
                {!isQuakeMode ? (
                  <Stat
                    flashValue={timerFlash}
                    label="Timer"
                    value={timerDisplay}
                  />
                ) : null}
                <Stat label="Best" value={String(leaderboardBest)} />
                <Stat label="Bank" value={formatChipCount(currentBuyIn)} />
              </View>
            </View>

            <View
              style={[
                styles.strip,
                styles.boardStrip,
                isDesktop
                  ? {
                      borderRadius: radius,
                      minHeight: middleHeight,
                      paddingHorizontal: boardPadX,
                      paddingVertical: boardPadY
                    }
                  : {
                      borderRadius: radius,
                      height: boardStripHeight,
                      paddingHorizontal: boardPadX,
                      paddingVertical: boardPadY
                    }
              ]}
            >
              <View style={[styles.boardShell, { gap: boardGap, height: boardSize, width: boardSize }]}>
                {!isQuakeMode ? (
                  <View style={[styles.axisRow, { gap: boardGap }]}>
                    <View style={{ height: boardRail, width: boardRail }} />
                    <View
                      style={[styles.axisTrack, { gap: boardGap, height: boardRail, width: matrixSize }]}
                    >
                      {columnLines.map((line, index) => (
                        <View key={`c-${index}`} style={{ height: boardRail, width: boardCell }}>
                          <LinePill
                            busted={activeBustedCols.includes(index)}
                            dense={boardDense}
                            label={`C${index + 1}`}
                            line={preview && hoveredCell?.col === index ? preview.column : line}
                          />
                        </View>
                      ))}
                    </View>
                  </View>
                ) : null}

                <View style={[styles.boardBody, { gap: boardGap }]}>
                  {!isQuakeMode ? (
                    <View style={[styles.axisColumn, { gap: boardGap, width: boardRail }]}>
                      {rowLines.map((line, index) => (
                        <View key={`r-${index}`} style={{ height: boardCell, width: boardRail }}>
                          <LinePill
                            busted={activeBustedRows.includes(index)}
                            dense={boardDense}
                            label={`R${index + 1}`}
                            line={preview && hoveredCell?.row === index ? preview.row : line}
                          />
                        </View>
                      ))}
                    </View>
                  ) : null}

                  <View
                    ref={boardRef}
                    onLayout={syncBoardMetrics}
                    style={[styles.matrix, { gap: boardGap, height: matrixSize, width: matrixSize }]}
                  >
                    {board.map((row, rowIndex) => (
                      <View key={`row-${rowIndex}`} style={[styles.matrixRow, { gap: boardGap, height: boardCell }]}>
                        {row.map((tile, colIndex) => (
                          <View key={`cell-${rowIndex}-${colIndex}`} style={{ height: boardCell, width: boardCell }}>
                            <BoardCell
                              busted={
                                activeBustedRows.includes(rowIndex) ||
                                activeBustedCols.includes(colIndex)
                              }
                              canPlace={currentWorld ? canSelectBoardCell(rowIndex, colIndex) : false}
                              dense={boardDense}
                              hovered={hoveredCell?.row === rowIndex && hoveredCell?.col === colIndex}
                              lastPlaced={
                                currentWorld?.lastPlacement?.row === rowIndex &&
                                currentWorld?.lastPlacement?.col === colIndex
                              }
                              lightningFrame={activeLightningFrame}
                              lightningStriking={activeLightningTargets.includes(`${rowIndex}:${colIndex}`)}
                              locked={
                                rowLines[rowIndex].status === "locked" ||
                                columnLines[colIndex].status === "locked"
                              }
                              mode={currentWorld?.mode}
                              onPress={() => commitPlacement(rowIndex, colIndex)}
                              stackHeight={currentWorld?.quake?.stacks[rowIndex]?.[colIndex]?.length ?? 0}
                              stackTiles={currentWorld?.quake?.stacks[rowIndex]?.[colIndex] ?? []}
                              tile={tile}
                            />
                          </View>
                        ))}
                      </View>
                    ))}
                  </View>
                </View>
              </View>

            </View>

            <View
              style={[
                styles.strip,
                styles.bottomStrip,
                { borderRadius: radius, minHeight: bottomHeight, padding: stripPad }
              ]}
            >
              <View style={[styles.bottomMain, { gap: frameGap }]}>
                <View style={[styles.controlWell, { width: controlWidth }]}>
                  <GameButton
                    compact
                    disabled={isStartingSession || (!currentWorld && (!canAfford || selectedBuyIn <= 0))}
                    label={
                      isStartingSession
                        ? "Starting"
                        : currentWorld?.status === "playing"
                          ? "Restart"
                          : "Start"
                    }
                    onPress={currentWorld?.status === "playing" ? restartRun : startRun}
                    subtitle={
                      !canAfford
                        ? "Need 50 chips"
                        : selectedBuyIn > 0
                        ? `${cardsLeft} cards · ${timerDisplay}`
                        : "No bankroll loaded"
                    }
                    subtitleStyle={styles.actionSubtitle}
                    tone="primary"
                  />
                </View>

                <View style={styles.queueWell}>
                  <View style={[styles.queueRow, { gap: queueGap }]}>
                    {Array.from({ length: 3 }, (_, index) => {
                      const tile = queue[index] ?? null;
                      const lead = index === 0;
                      const content = tile ? (
                        <TileFace compact dense={queueDense} dimmed={!lead} lead={lead} tile={tile} />
                      ) : (
                        <View style={[styles.emptyTile, { height: queueTileHeight, width: queueTileWidth }]}>
                          <Text style={styles.emptyTileText}>EMPTY</Text>
                        </View>
                      );

                      if (tile && lead && dragEnabled) {
                        return (
                          <Animated.View
                            key={`q-${index}`}
                            {...panResponder.panHandlers}
                            style={[
                              styles.queueCard,
                              dragging && styles.queueCardDragging,
                              {
                                height: queueTileHeight,
                                transform: dragOffset.getTranslateTransform(),
                                width: queueTileWidth
                              }
                            ]}
                          >
                            {content}
                          </Animated.View>
                        );
                      }

                      return (
                        <View key={`q-${index}`} style={{ height: queueTileHeight, width: queueTileWidth }}>
                          {content}
                        </View>
                      );
                    })}
                    <View ref={undoButtonRef}>
                      <Pressable
                        disabled={!undoAvailable}
                        onPress={undoLastMove}
                        style={({ pressed }) => [
                          styles.utilityButton,
                          styles.queueUndoButton,
                          { height: queueTileHeight, width: queueTileWidth },
                          !undoAvailable && styles.utilityButtonDisabled,
                          pressed && undoAvailable && styles.utilityButtonPressed
                        ]}
                      >
                        <Text style={styles.utilityGlyph}>{"\u21B6"}</Text>
                        <Text style={styles.utilityMeta}>{undoRemaining}</Text>
                      </Pressable>
                    </View>
                  </View>
                </View>
              </View>

            </View>
          </View>
        </View>
      </SafeAreaView>
    </View>
  );
}

function Stat({
  flashValue,
  label,
  value
}: {
  flashValue?: Animated.Value;
  label: string;
  value: string;
}) {
  return (
    <Animated.View
      style={[
        styles.stat,
        flashValue
          ? {
              opacity: flashValue.interpolate({
                inputRange: [0, 1],
                outputRange: [1, 0.56]
              }),
              transform: [
                {
                  scale: flashValue.interpolate({
                    inputRange: [0, 1],
                    outputRange: [1, 1.06]
                  })
                }
              ]
            }
          : null
      ]}
    >
      <Text style={styles.statLabel}>{label}</Text>
      <Text numberOfLines={1} style={styles.statValue}>
        {value}
      </Text>
    </Animated.View>
  );
}

function DifficultyBoardPreview({
  openings,
  selected
}: {
  openings: number;
  selected?: boolean;
}) {
  const filledIndexes = new Set(
    PREVIEW_SEED_CELLS.slice(0, openings).map((cell) => cell.row * GRID_SIZE + cell.col)
  );

  return (
    <View style={[styles.difficultyPreviewBoard, selected && styles.difficultyPreviewBoardSelected]}>
      {Array.from({ length: GRID_SIZE * GRID_SIZE }, (_, index) => {
        return (
          <View
            key={`preview-${index}`}
            style={[
              styles.difficultyPreviewCell,
              filledIndexes.has(index) && styles.difficultyPreviewCellFilled,
              selected && styles.difficultyPreviewCellSelected
            ]}
          />
        );
      })}
    </View>
  );
}

function LinePill({
  busted,
  celebrating,
  dense,
  flashValue,
  flashVariant,
  label: _label,
  line
}: {
  busted?: boolean;
  celebrating?: boolean;
  dense?: boolean;
  flashValue?: Animated.Value;
  flashVariant?: "celebrate" | "warning";
  label: string;
  line: LineSummary;
}) {
  const appearance = useStackemAppearance();
  const isTwentyOne = line.total === 21;
  const showBusted = busted && !isTwentyOne;

  return (
    <Animated.View
      style={[
        styles.linePill,
        dense && styles.linePillDense,
        celebrating && styles.linePillCelebrating,
        isTwentyOne && styles.linePillLocked,
        showBusted && styles.linePillBusted,
        {
          backgroundColor: isTwentyOne
            ? appearance.lineLockedBackground
            : appearance.lineNeutralBackground
        },
        flashValue
          ? {
              transform: [
                {
                  scale: flashValue.interpolate({
                    inputRange: [0, 0.2, 1],
                    outputRange: [1, flashVariant === "celebrate" ? 1.08 : 1.04, 1]
                  })
                }
              ]
            }
          : null
      ]}
    >
      {flashValue ? (
        <Animated.View
          pointerEvents="none"
          style={[
            styles.lineFlash,
            flashVariant === "celebrate"
              ? styles.lineFlashCelebrate
              : styles.lineFlashWarning,
            { opacity: flashValue }
          ]}
        />
      ) : null}
      <Text
        style={[
          styles.lineValue,
          dense && styles.lineValueDense,
          isTwentyOne && styles.lineValueTwentyOne,
          { color: appearance.lineText }
        ]}
      >
        {isTwentyOne ? "21" : line.total}
      </Text>
    </Animated.View>
  );
}

function BoardCell({
  busted,
  canPlace,
  dense,
  hovered,
  impactValue,
  lastPlaced,
  lightningFrame,
  lightningStriking,
  locked,
  mode = "classic",
  onPress,
  stackHeight = 0,
  stackTiles = [],
  tile
}: {
  busted?: boolean;
  canPlace: boolean;
  dense?: boolean;
  hovered?: boolean;
  impactValue?: Animated.Value;
  lastPlaced?: boolean;
  lightningFrame?: typeof LIGHTNING_STRIKE_GIF | null;
  lightningStriking?: boolean;
  locked?: boolean;
  mode?: GameMode;
  onPress: () => void;
  stackHeight?: number;
  stackTiles?: StackTile[];
  tile: StackTile | null;
}) {
  const appearance = useStackemAppearance();
  return (
    <Pressable
      disabled={!canPlace}
      onPress={onPress}
      style={({ pressed }) => [
        styles.cell,
        dense && styles.cellDense,
        canPlace && styles.cellPlayable,
        locked && styles.cellLocked,
        hovered && styles.cellHovered,
        lastPlaced && styles.cellLastPlaced,
        busted && !locked && styles.cellBusted,
        pressed && canPlace && styles.cellPressed,
        {
          backgroundColor: appearance.cellBackground,
          borderColor: canPlace ? appearance.cellPlayableBorder : appearance.cellBorder
        },
        mode === "quake" && styles.cellQuakeBase,
        mode === "quake" && stackHeight >= 1 && styles.cellQuakeStack,
        mode === "quake" && stackHeight >= 4 && styles.cellQuakeStackMedium,
        mode === "quake" && stackHeight >= 7 && styles.cellQuakeStackHigh,
        mode === "quake" && stackHeight >= 9 && styles.cellQuakeStackCritical
      ]}
    >
      <Animated.View
        style={[
          styles.cellContent,
          impactValue
            ? {
                transform: [
                  {
                    scale: impactValue.interpolate({
                      inputRange: [0, 0.35, 1],
                      outputRange: [1, 0.92, 1.05]
                    })
                  }
                ]
              }
            : null
        ]}
      >
        {tile ? (
          <TileFace
            compact
            dense={dense}
            locked={locked}
            quake={mode === "quake"}
            stackHeight={stackHeight}
            stackTiles={stackTiles}
            tile={tile}
          />
        ) : (
          <View
            style={[
              styles.cellVoid,
              dense && styles.cellVoidDense,
              canPlace && styles.cellVoidPlayable,
              locked && styles.cellVoidLocked,
              {
                backgroundColor: canPlace
                  ? "rgba(255, 255, 255, 0.05)"
                  : "rgba(255, 255, 255, 0.035)",
                borderColor: canPlace
                  ? appearance.cellPlayableBorder
                  : "rgba(255, 255, 255, 0.18)"
              }
            ]}
          />
        )}
        {lightningStriking && lightningFrame ? (
          <View pointerEvents="none" style={styles.cellLightningOverlay}>
            <View style={styles.cellLightningGlow} />
            <Image
              resizeMode="contain"
              source={lightningFrame}
              style={styles.cellLightningImage}
            />
          </View>
        ) : null}
      </Animated.View>
    </Pressable>
  );
}

function TileFace({
  compact = false,
  dense = false,
  dimmed = false,
  lead = false,
  locked = false,
  quake = false,
  stackHeight = 1,
  stackTiles = [],
  tile
}: {
  compact?: boolean;
  dense?: boolean;
  dimmed?: boolean;
  lead?: boolean;
  locked?: boolean;
  quake?: boolean;
  stackHeight?: number;
  stackTiles?: StackTile[];
  tile: StackTile;
}) {
  const appearance = useStackemAppearance();
  const pulseAnim = useRef(new Animated.Value(0)).current;
  const spawnAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (tile.kind === "standard" && tile.rank === "2" && locked) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1, duration: 480, useNativeDriver: true }),
          Animated.delay(260),
          Animated.timing(pulseAnim, { toValue: 0, duration: 480, useNativeDriver: true }),
          Animated.delay(160)
        ])
      ).start();
    } else {
      pulseAnim.stopAnimation();
      pulseAnim.setValue(0);
    }
    return () => { pulseAnim.stopAnimation(); };
  }, [tile.kind, tile.rank, locked, pulseAnim]);

  useEffect(() => {
    spawnAnim.stopAnimation();
    spawnAnim.setValue(0);
    Animated.spring(spawnAnim, {
      bounciness: 10,
      speed: 18,
      toValue: 1,
      useNativeDriver: true
    }).start();
  }, [spawnAnim, tile.id]);

  const isSpecial = tile.kind !== "standard";
  const specialLabel = tile.kind === "wild" ? "W" : tile.kind === "swap" ? "S" : tile.rank;
  const specialMeta = tile.kind === "wild" ? "WILD" : tile.kind === "swap" ? "SWAP" : "";
  const blockSurface = getBlockTileSurface(tile);
  const blockText = getBlockTileTextColor(tile);
  const quakeTileGradient = getQuakeTileGradient(tile);
  const quakeText = "#f8fbff";
  const spawnScale = spawnAnim.interpolate({
    inputRange: [0, 0.55, 1],
    outputRange: [0.86, 1.08, 1]
  });
  const spawnLift = spawnAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [8, 0]
  });
  const visibleDepthLayers = quake ? Math.min(Math.max(stackHeight - 1, 0), 9) : 0;
  const depthTiles = quake
    ? stackTiles.slice(Math.max(0, stackTiles.length - 1 - visibleDepthLayers), -1)
    : [];
  const quakeLayerDepth = 7;
  const quakeStackLift = quake
    ? -Math.min(visibleDepthLayers * quakeLayerDepth, 63)
    : 0;

  return (
    <Animated.View
      style={[
        styles.tile,
        locked && styles.tileLocked,
        isSpecial && styles.tileSpecial,
        compact && styles.tileCompact,
        dense && styles.tileDense,
        dimmed && styles.tileDimmed,
        lead && styles.tileLead,
        quake && styles.tileQuake,
        quake && stackHeight >= 7 && styles.tileQuakeDanger,
        { transform: [{ translateY: quakeStackLift }, { translateY: spawnLift }, { scale: spawnScale }] }
      ]}
    >
      {quake && visibleDepthLayers > 0 ? (
        <>
          {Array.from({ length: visibleDepthLayers }, (_, index) => {
            const depthTile = depthTiles[index] ?? tile;

            return (
            <LinearGradient
              colors={getQuakeTileGradient(depthTile)}
              end={{ x: 1, y: 1 }}
              key={`quake-depth-${index}`}
              start={{ x: 0, y: 0 }}
              style={[
                styles.tileQuakeImageLayer,
                {
                  opacity: 0.72 + index * 0.025,
                  transform: [
                    {
                      translateY: (visibleDepthLayers - index) * quakeLayerDepth
                    }
                  ]
                }
              ]}
            >
              <Image
                resizeMode="stretch"
                source={QUAKE_TILE_IMAGE}
                style={styles.tileQuakeLayerImage}
              />
            </LinearGradient>
            );
          })}
        </>
      ) : null}
      {quake ? (
        <LinearGradient
          colors={quakeTileGradient}
          end={{ x: 1, y: 1 }}
          start={{ x: 0, y: 0 }}
          style={[
            styles.tileSurface,
            styles.tileSurfaceQuake,
            stackHeight <= 1 && styles.tileSurfaceQuakeFlat
          ]}
        >
          <Image
            resizeMode="stretch"
            source={QUAKE_TILE_IMAGE}
            style={styles.tileQuakeImage}
          />
          <View pointerEvents="none" style={styles.tileGlassSheen} />
          <View pointerEvents="none" style={styles.tileGlassGlow} />
        </LinearGradient>
      ) : (
        <LinearGradient
          colors={blockSurface}
          end={{ x: 1, y: 1 }}
          start={{ x: 0, y: 0 }}
          style={styles.tileSurface}
        />
      )}
      <View
        style={[
          styles.tileCenter,
          quake && styles.tileCenterQuake,
          quake && stackHeight <= 1 && styles.tileCenterQuakeFlat
        ]}
      >
        <Text
          style={[
            styles.tileRank,
            isSpecial && styles.tileRankSpecial,
            compact && styles.tileRankCompact,
            dense && styles.tileRankDense,
            quake && styles.tileRankQuake,
            { color: quake ? quakeText : blockText }
          ]}
        >
          {specialLabel}
        </Text>
        {isSpecial ? <Text style={styles.tileSpecialMeta}>{specialMeta}</Text> : null}
      </View>
      {locked && tile.kind === "standard" && tile.rank === "2" ? (
        <Animated.View
          pointerEvents="none"
          style={[styles.tileLockPulse, { opacity: pulseAnim }]}
        />
      ) : null}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  actionSubtitle: { color: "rgba(5, 5, 5, 0.68)" },
  axisColumn: { justifyContent: "space-between" },
  axisRow: { flexDirection: "row" },
  axisTrack: { flexDirection: "row" },
  badge: {
    alignItems: "center",
    backgroundColor: theme.colors.surface,
    borderRadius: 999,
    height: 46,
    justifyContent: "center",
    width: 46
  },
  badgeText: {
    color: "#050505",
    fontFamily: theme.fonts.display,
    fontSize: 22,
    lineHeight: 22
  },
  bannerAnteCard: {
    alignItems: "flex-end",
    backgroundColor: "rgba(5, 18, 30, 0.8)",
    borderColor: "rgba(118, 169, 207, 0.42)",
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    gap: 2,
    minWidth: 94,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs
  },
  bannerAnteLabel: {
    color: "rgba(191, 213, 232, 0.82)",
    fontFamily: theme.fonts.label,
    fontSize: 9,
    letterSpacing: 1.3,
    textTransform: "uppercase"
  },
  bannerAnteValue: {
    color: "#d7ecfb",
    fontFamily: theme.fonts.display,
    fontSize: 22,
    lineHeight: 22
  },
  bannerCard: {
    gap: theme.spacing.sm,
    overflow: "hidden"
  },
  bannerScoreBar: {
    backgroundColor: "rgba(20, 34, 48, 0.9)",
    borderColor: "rgba(133, 169, 195, 0.44)",
    borderWidth: 2,
    shadowColor: "#6fa8d8",
    shadowOffset: { height: 0, width: 0 },
    shadowOpacity: 0.16,
    shadowRadius: 18
  },
  bannerScoreBarQuake: {
    backgroundColor: "rgba(28, 43, 58, 0.96)",
    borderColor: "rgba(133, 169, 195, 0.58)",
    shadowColor: "#6fa8d8",
    shadowOpacity: 0.32,
    shadowRadius: 24
  },
  quakeHud: {
    alignItems: "center",
    backgroundColor: "rgba(26, 40, 55, 0.96)",
    borderColor: "rgba(142, 179, 206, 0.62)",
    borderWidth: 2,
    flexDirection: "row",
    gap: theme.spacing.sm,
    justifyContent: "space-between",
    overflow: "hidden",
    position: "relative",
    shadowColor: "#6fa8d8",
    shadowOffset: { height: 0, width: 0 },
    shadowOpacity: 0.32,
    shadowRadius: 22
  },
  quakeHudCompact: {
    gap: theme.spacing.xs
  },
  quakeHudPlate: {
    backgroundColor: "rgba(255, 255, 255, 0.08)",
    borderBottomColor: "rgba(142, 179, 206, 0.2)",
    borderBottomWidth: 2,
    height: "42%",
    left: 0,
    position: "absolute",
    right: 0,
    top: 0
  },
  quakeHudScorePanel: {
    alignItems: "center",
    backgroundColor: "rgba(15, 28, 42, 0.72)",
    borderColor: "rgba(174, 204, 226, 0.2)",
    borderWidth: 1,
    flex: 0.9,
    gap: 2,
    justifyContent: "center",
    minWidth: 92,
    paddingHorizontal: theme.spacing.xs,
    paddingVertical: theme.spacing.xs
  },
  quakeHudTimerPanel: {
    alignItems: "center",
    backgroundColor: "rgba(18, 34, 50, 0.9)",
    borderColor: "rgba(111, 168, 216, 0.62)",
    borderWidth: 2,
    flex: 1.25,
    gap: 2,
    justifyContent: "center",
    minWidth: 124,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    shadowColor: "#6fa8d8",
    shadowOffset: { height: 0, width: 0 },
    shadowOpacity: 0.38,
    shadowRadius: 12
  },
  quakeHudActions: {
    alignItems: "center",
    flexDirection: "row",
    gap: theme.spacing.xs,
    justifyContent: "flex-end"
  },
  quakeHudButton: {
    alignItems: "center",
    backgroundColor: "rgba(20, 35, 50, 0.9)",
    borderColor: "rgba(142, 179, 206, 0.52)",
    borderWidth: 2,
    height: 42,
    justifyContent: "center",
    shadowColor: "#6fa8d8",
    shadowOffset: { height: 0, width: 0 },
    shadowOpacity: 0.28,
    shadowRadius: 10,
    width: 42
  },
  quakeHudButtonPressed: {
    backgroundColor: "rgba(111, 168, 216, 0.28)"
  },
  quakeHudButtonText: {
    color: "#eaf6ff",
    fontFamily: theme.fonts.display,
    fontSize: 24,
    lineHeight: 24
  },
  quakeHudLabel: {
    color: "#b6ccdc",
    fontFamily: theme.fonts.label,
    fontSize: 10,
    letterSpacing: 1.4,
    textTransform: "uppercase"
  },
  quakeHudScore: {
    color: "#eaf6ff",
    fontFamily: theme.fonts.display,
    fontSize: 26,
    lineHeight: 26,
    textShadowColor: "rgba(111, 168, 216, 0.72)",
    textShadowOffset: { height: 0, width: 0 },
    textShadowRadius: 8
  },
  quakeHudBest: {
    color: "#b6ccdc",
    fontFamily: theme.fonts.bodyBold,
    fontSize: 11
  },
  quakeHudTimer: {
    color: "#eaf6ff",
    fontFamily: theme.fonts.display,
    fontSize: 28,
    lineHeight: 28,
    textShadowColor: "rgba(111, 168, 216, 0.7)",
    textShadowOffset: { height: 0, width: 0 },
    textShadowRadius: 10
  },
  quakeHudProgressTrack: {
    flexDirection: "row",
    gap: 3,
    width: "100%"
  },
  quakeHudProgressSegment: {
    backgroundColor: "rgba(8, 19, 32, 0.76)",
    borderColor: "rgba(142, 179, 206, 0.28)",
    borderWidth: 1,
    flex: 1,
    height: 8
  },
  quakeHudProgressSegmentLit: {
    backgroundColor: "#6fa8d8",
    borderColor: "#d7ecfb"
  },
  bannerCopy: {
    flex: 1,
    gap: 4,
    minWidth: 0
  },
  bannerEyebrow: {
    color: "rgba(191, 213, 232, 0.84)",
    fontFamily: theme.fonts.label,
    fontSize: 10,
    letterSpacing: 1.7,
    textTransform: "uppercase"
  },
  bannerExitButton: {
    alignItems: "center",
    backgroundColor: "rgba(12, 42, 68, 0.72)",
    borderColor: "rgba(118, 169, 207, 0.54)",
    borderRadius: 999,
    borderWidth: 1,
    height: 34,
    justifyContent: "center",
    width: 34
  },
  bannerExitButtonPressed: {
    backgroundColor: "rgba(255, 255, 255, 0.12)"
  },
  bannerExitGlyph: {
    color: "#f7fbff",
    fontFamily: theme.fonts.label,
    fontSize: 11,
    letterSpacing: 1.2,
    textTransform: "uppercase"
  },
  bannerFooter: {
    alignItems: "center",
    flexDirection: "row",
    gap: theme.spacing.sm,
    justifyContent: "space-between"
  },
  bannerFooterCompact: {
    alignItems: "stretch",
    flexDirection: "column"
  },
  bannerGlow: {
    borderRadius: 999,
    height: 148,
    position: "absolute",
    width: 148
  },
  bannerGlowCool: {
    backgroundColor: "rgba(86, 255, 173, 0.18)",
    bottom: -72,
    left: -28
  },
  bannerGlowWarm: {
    backgroundColor: "rgba(255, 120, 72, 0.24)",
    right: -30,
    top: -60
  },
  bannerHeader: {
    alignItems: "center",
    flexDirection: "row",
    gap: theme.spacing.sm,
    justifyContent: "space-between"
  },
  bannerHeaderKicker: {
    color: "rgba(191, 213, 232, 0.82)",
    fontFamily: theme.fonts.label,
    fontSize: 9,
    letterSpacing: 1.2,
    textTransform: "uppercase"
  },
  bannerEconomyMessage: {
    color: "#b8f4cf",
    fontFamily: theme.fonts.bodyBold,
    fontSize: 11,
    lineHeight: 14
  },
  bannerHeaderMeta: {
    flex: 1,
    gap: 2,
    minWidth: 0
  },
  bannerHeaderValue: {
    color: "#d7ecfb",
    fontFamily: theme.fonts.bodyBold,
    fontSize: 22
  },
  bannerHeaderActions: {
    flexDirection: "row",
    gap: theme.spacing.xs
  },
  bannerHeaderCompact: {
    alignItems: "center",
    flexDirection: "row"
  },
  bannerMenuButton: {
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: theme.radius.md,
    borderWidth: 1,
    gap: 2,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.sm
  },
  bannerMenuButtonPressed: {
    backgroundColor: "rgba(255, 255, 255, 0.12)"
  },
  bannerMenuButtonPrimary: {
    backgroundColor: "rgba(244, 249, 236, 0.96)",
    borderColor: "rgba(244, 249, 236, 0.96)"
  },
  bannerMenuGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: theme.spacing.xs
  },
  bannerMenuLabel: {
    color: theme.colors.text,
    fontFamily: theme.fonts.bodyBold,
    fontSize: 14
  },
  bannerMenuLabelPrimary: {
    color: "#050505",
    fontFamily: theme.fonts.bodyBold,
    fontSize: 14
  },
  bannerMenuMeta: {
    color: theme.colors.subtleText,
    fontFamily: theme.fonts.body,
    fontSize: 11,
    lineHeight: 15
  },
  bannerMenuMiniButton: {
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.04)",
    borderColor: "rgba(255, 255, 255, 0.08)",
    borderRadius: 999,
    borderWidth: 1,
    justifyContent: "center",
    minHeight: 34,
    minWidth: 96,
    paddingHorizontal: theme.spacing.sm
  },
  bannerMenuHubButton: {
    backgroundColor: "rgba(111, 168, 216, 0.18)",
    borderColor: "rgba(215, 236, 251, 0.34)"
  },
  bannerMenuMiniLabel: {
    color: theme.colors.text,
    fontFamily: theme.fonts.label,
    fontSize: 10,
    letterSpacing: 1.1,
    textTransform: "uppercase"
  },
  bannerMenuPanel: {
    backgroundColor: "rgba(10, 12, 14, 0.98)",
    borderColor: "rgba(255, 255, 255, 0.12)",
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    gap: theme.spacing.sm,
    padding: theme.spacing.sm
  },
  bannerMenuWrap: {
    paddingTop: theme.spacing.xs
  },
  menuBackdrop: {
    ...StyleSheet.absoluteFillObject
  },
  menuOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    backgroundColor: "rgba(5, 5, 5, 0.72)",
    justifyContent: "center",
    padding: theme.spacing.lg,
    zIndex: 38
  },
  bannerHero: {
    borderRadius: theme.radius.lg,
    gap: theme.spacing.xs,
    overflow: "hidden",
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.md,
    position: "relative"
  },
  bannerHeroCompact: {
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.sm
  },
  bannerMetric: {
    backgroundColor: "rgba(255, 255, 255, 0.04)",
    borderColor: "rgba(255, 255, 255, 0.08)",
    borderRadius: theme.radius.md,
    borderWidth: 1,
    gap: 4,
    minWidth: 76,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs
  },
  bannerMetricCompact: {
    flexGrow: 1,
    width: "48%"
  },
  bannerMetricGrid: {
    flex: 1,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: theme.spacing.xs,
    justifyContent: "flex-end"
  },
  bannerNavChip: {
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 999,
    borderWidth: 1,
    justifyContent: "center",
    minHeight: 32,
    minWidth: 72,
    paddingHorizontal: theme.spacing.sm
  },
  bannerNavChipPressed: { backgroundColor: "rgba(255, 255, 255, 0.14)" },
  bannerNavLabel: {
    color: theme.colors.text,
    fontFamily: theme.fonts.label,
    fontSize: 10,
    letterSpacing: 1.2,
    textTransform: "uppercase"
  },
  bannerNavRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: theme.spacing.xs,
    paddingHorizontal: theme.spacing.md,
    paddingBottom: theme.spacing.sm
  },
  bannerMetricLabel: {
    color: theme.colors.subtleText,
    fontFamily: theme.fonts.label,
    fontSize: 9,
    letterSpacing: 1.2,
    textTransform: "uppercase"
  },
  bannerMetricValue: {
    color: theme.colors.text,
    fontFamily: theme.fonts.bodyBold,
    fontSize: 13
  },
  bannerQueueStrip: {
    alignItems: "center",
    justifyContent: "center"
  },
  bannerRuleChip: {
    backgroundColor: "rgba(20, 56, 84, 0.78)",
    borderColor: "rgba(118, 169, 207, 0.44)",
    borderRadius: 999,
    borderWidth: 1,
    gap: 2,
    minWidth: 62,
    overflow: "hidden",
    paddingHorizontal: theme.spacing.sm,
    position: "relative",
    paddingVertical: theme.spacing.xs
  },
  bannerRuleChipTimer: {
    backgroundColor: "rgba(20, 56, 84, 0.88)"
  },
  bannerRuleLabel: {
    color: "rgba(191, 213, 232, 0.82)",
    fontFamily: theme.fonts.label,
    fontSize: 9,
    letterSpacing: 1.2,
    textTransform: "uppercase"
  },
  bannerRuleRow: {
    alignItems: "stretch",
    flexDirection: "row",
    flexWrap: "wrap",
    gap: theme.spacing.xs
  },
  bannerRuleValue: {
    color: "#f7fbff",
    fontFamily: theme.fonts.bodyBold,
    fontSize: 13
  },
  bannerTimerFill: {
    backgroundColor: "rgba(95, 167, 231, 0.28)",
    bottom: 0,
    left: 0,
    position: "absolute",
    top: 0
  },
  bannerSubtitle: {
    color: "rgba(241, 245, 233, 0.84)",
    fontFamily: theme.fonts.body,
    fontSize: 12,
    lineHeight: 16,
    maxWidth: 320
  },
  bannerTitle: {
    color: "#f4f9ec",
    fontFamily: theme.fonts.display,
    fontSize: 32,
    lineHeight: 32
  },
  bannerTitleCompact: {
    fontSize: 26,
    lineHeight: 26
  },
  boardBody: { flexDirection: "row", overflow: "visible" },
  boardShell: { alignItems: "center", justifyContent: "center", overflow: "visible" },
  boardStrip: {
    alignSelf: "center",
    justifyContent: "center",
    overflow: "visible",
    position: "relative",
    shadowColor: "#6fa8d8",
    shadowOffset: { height: 0, width: 0 },
    shadowOpacity: 0.16,
    shadowRadius: 22
  },
  boardStripQuake: {
    backgroundColor: "rgba(22, 36, 50, 0.96)",
    borderColor: "rgba(133, 169, 195, 0.54)",
    shadowColor: "#6fa8d8",
    shadowOpacity: 0.34,
    shadowRadius: 32
  },
  quakeBoardSurface: {
    backgroundColor: "rgba(16, 29, 43, 0.94)",
    borderColor: "rgba(133, 169, 195, 0.32)",
    borderWidth: 1,
    bottom: 8,
    left: 8,
    overflow: "hidden",
    position: "absolute",
    right: 8,
    top: 8
  },
  quakeBoardCrack: {
    backgroundColor: "#6fa8d8",
    height: 2,
    opacity: 0.48,
    position: "absolute",
    shadowColor: "#6fa8d8",
    shadowOffset: { height: 0, width: 0 },
    shadowOpacity: 0.64,
    shadowRadius: 8
  },
  quakeBoardCrackA: {
    left: "-8%",
    top: "22%",
    transform: [{ rotate: "18deg" }],
    width: "72%"
  },
  quakeBoardCrackB: {
    right: "-10%",
    top: "58%",
    transform: [{ rotate: "-24deg" }],
    width: "82%"
  },
  quakeBoardCrackC: {
    left: "18%",
    top: "82%",
    transform: [{ rotate: "7deg" }],
    width: "58%"
  },
  quakeBoardGlow: {
    backgroundColor: "rgba(111, 168, 216, 0.18)",
    borderRadius: 999,
    height: 110,
    position: "absolute",
    shadowColor: "#6fa8d8",
    shadowOffset: { height: 0, width: 0 },
    shadowOpacity: 0.62,
    shadowRadius: 34,
    width: 110
  },
  quakeBoardGlowA: {
    left: -50,
    top: -42
  },
  quakeBoardGlowB: {
    bottom: -48,
    right: -44
  },
  lineBurstBand: {
    borderRadius: theme.radius.lg,
    position: "absolute",
    shadowOffset: { height: 0, width: 0 },
    shadowOpacity: 0.45,
    shadowRadius: 18
  },
  lineBurstBandColumn: {
    top: 0
  },
  lineBurstBandRow: {
    left: 0
  },
  lineBurstCelebrate: {
    backgroundColor: "rgba(125, 255, 178, 0.34)",
    borderColor: "rgba(214, 255, 230, 0.95)",
    borderWidth: 1,
    shadowColor: "#7dffb2"
  },
  lineBurstLayer: {
    position: "absolute",
    zIndex: 3
  },
  lineBurstWarning: {
    backgroundColor: "rgba(255, 195, 192, 0.36)",
    borderColor: "rgba(255, 214, 214, 0.95)",
    borderWidth: 1,
    shadowColor: "#ffc3c0"
  },
  boardWrap: { alignItems: "center", flex: 1, justifyContent: "center" },
  bottomMain: { flex: 1, flexDirection: "row" },
  bottomMainPortrait: { flexDirection: "column" },
  bottomStrip: { gap: theme.spacing.sm },
  buyInChip: {
    alignItems: "center",
    backgroundColor: theme.colors.cardMuted,
    borderColor: theme.colors.border,
    borderRadius: 999,
    borderWidth: 1,
    flexBasis: 0,
    flexGrow: 1,
    justifyContent: "center",
    minHeight: 38,
    minWidth: 56
  },
  buyInChipPressed: { opacity: 0.84 },
  buyInChipSelected: { backgroundColor: theme.colors.surface },
  buyInRow: { flexDirection: "row", gap: theme.spacing.xs, width: "100%" },
  buyInRowCompact: { flexWrap: "wrap" },
  buyInText: { color: theme.colors.text, fontFamily: theme.fonts.bodyBold, fontSize: 12 },
  buyInTextSelected: { color: "#050505" },
  cell: {
    alignItems: "center",
    backgroundColor: "rgba(20, 28, 48, 0.94)",
    borderColor: "rgba(255, 255, 255, 0.12)",
    borderRadius: 12,
    borderWidth: 1,
    height: "100%",
    justifyContent: "center",
    overflow: "visible",
    padding: 4,
    width: "100%"
  },
  cellQuakeBase: {
    backgroundColor: "rgba(25, 42, 58, 0.86)",
    borderBottomColor: "rgba(5, 12, 20, 0.45)",
    borderColor: "rgba(103, 137, 163, 0.54)",
    borderLeftColor: "rgba(186, 213, 232, 0.22)",
    borderRightColor: "rgba(5, 12, 20, 0.36)",
    borderTopColor: "rgba(186, 213, 232, 0.28)",
    borderWidth: 2,
    shadowColor: "#07131f",
    shadowOffset: { height: 4, width: 0 },
    shadowOpacity: 0.36,
    shadowRadius: 5
  },
  cellBusted: { backgroundColor: "rgba(255, 143, 143, 0.14)", borderColor: "rgba(255, 143, 143, 0.36)" },
  cellContent: {
    alignItems: "center",
    height: "100%",
    justifyContent: "center",
    overflow: "visible",
    width: "100%"
  },
  cellDense: { padding: 2 },
  cellHovered: { backgroundColor: "rgba(42, 52, 82, 0.96)", borderColor: "rgba(111, 168, 216, 0.82)" },
  cellLightningGlow: {
    backgroundColor: "rgba(168, 233, 255, 0.34)",
    borderRadius: 999,
    bottom: 10,
    height: 24,
    position: "absolute",
    shadowColor: "#9fe7ff",
    shadowOffset: { height: 0, width: 0 },
    shadowOpacity: 0.95,
    shadowRadius: 22,
    width: "78%"
  },
  cellLightningImage: {
    height: 360,
    opacity: 0.96,
    shadowColor: "#d5f7ff",
    shadowOffset: { height: 0, width: 0 },
    shadowOpacity: 0.95,
    shadowRadius: 18,
    width: "170%"
  },
  cellLightningOverlay: {
    alignItems: "center",
    bottom: 0,
    justifyContent: "flex-end",
    left: 0,
    pointerEvents: "none",
    position: "absolute",
    right: 0,
    top: -284,
    zIndex: 6
  },
  cellLastPlaced: { borderColor: "#d7ecfb" },
  cellLocked: {
    backgroundColor: "rgba(34, 197, 94, 0.18)",
    borderColor: "rgba(74, 222, 128, 0.74)"
  },
  cellPlayable: { borderColor: "rgba(111, 168, 216, 0.58)" },
  cellPressed: { opacity: 0.86 },
  cellQuakeStack: {
    backgroundColor: "rgba(30, 52, 70, 0.92)",
    borderColor: "rgba(111, 168, 216, 0.54)",
    shadowColor: "#6fa8d8",
    shadowOffset: { height: 0, width: 0 },
    shadowOpacity: 0.28,
    shadowRadius: 10
  },
  cellQuakeStackCritical: {
    backgroundColor: "rgba(75, 45, 63, 0.95)",
    borderColor: "rgba(216, 115, 115, 0.82)",
    shadowColor: "#d87373",
    shadowOpacity: 0.78,
    shadowRadius: 22
  },
  cellQuakeStackHigh: {
    backgroundColor: "rgba(65, 55, 45, 0.95)",
    borderColor: "rgba(216, 154, 98, 0.74)",
    shadowColor: "#d89a62",
    shadowOpacity: 0.58,
    shadowRadius: 18
  },
  cellQuakeStackMedium: {
    backgroundColor: "rgba(43, 48, 72, 0.95)",
    borderColor: "rgba(155, 130, 217, 0.68)",
    shadowColor: "#9b82d9",
    shadowOpacity: 0.42,
    shadowRadius: 14
  },
  cellVoid: {
    backgroundColor: "rgba(13, 27, 42, 0.46)",
    borderColor: "rgba(133, 169, 195, 0.24)",
    borderRadius: 10,
    borderWidth: 1,
    height: "100%",
    width: "100%"
  },
  cellVoidDense: { borderRadius: theme.radius.md - 4 },
  cellVoidLocked: {
    backgroundColor: "rgba(95, 167, 231, 0.16)",
    borderColor: "rgba(158, 223, 255, 0.38)"
  },
  cellVoidPlayable: { borderStyle: "dashed" },
  controlMenu: { gap: theme.spacing.sm, width: "100%" },
  controlMenuCompact: { gap: theme.spacing.xs },
  controlSection: { gap: theme.spacing.xs, width: "100%" },
  controlSectionLabel: {
    color: theme.colors.subtleText,
    fontFamily: theme.fonts.label,
    fontSize: 10,
    letterSpacing: 1.4,
    textTransform: "uppercase"
  },
  controlSectionSurface: {
    backgroundColor: "rgba(255, 255, 255, 0.035)",
    borderColor: "rgba(255, 255, 255, 0.08)",
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    gap: theme.spacing.xs,
    padding: theme.spacing.sm,
    width: "100%"
  },
  controlWell: { gap: theme.spacing.sm, justifyContent: "space-between" },
  controlWellFull: { width: "100%" },
  dragGhost: {
    elevation: 18,
    position: "absolute",
    shadowColor: "#000000",
    shadowOffset: { height: 20, width: 0 },
    shadowOpacity: 0.34,
    shadowRadius: 26,
    zIndex: 30
  },
  placementFlightCard: {
    elevation: 20,
    position: "absolute",
    shadowColor: "#000000",
    shadowOffset: { height: 18, width: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 22,
    zIndex: 32
  },
  emptyTile: {
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.03)",
    borderColor: "rgba(255, 255, 255, 0.08)",
    borderRadius: theme.radius.md,
    borderWidth: 1,
    justifyContent: "center"
  },
  emptyTileQuakeHolding: {
    backgroundColor: "rgba(0, 184, 217, 0.12)",
    borderColor: "rgba(255, 212, 0, 0.34)",
    borderRadius: 4
  },
  emptyTileText: {
    color: theme.colors.subtleText,
    fontFamily: theme.fonts.label,
    fontSize: 10,
    letterSpacing: 1.2
  },
  frame: { maxWidth: "100%" },
  gameStackFrame: {
    backgroundColor: "rgba(4, 17, 29, 0.58)",
    borderColor: "rgba(68, 105, 138, 0.38)",
    borderRadius: 28,
    borderWidth: 1,
    padding: 8
  },
  gameStackFrameQuake: {
    backgroundColor: "rgba(20, 34, 48, 0.94)",
    borderColor: "rgba(133, 169, 195, 0.5)",
    position: "relative",
    shadowColor: "#6fa8d8",
    shadowOffset: { height: 0, width: 0 },
    shadowOpacity: 0.28,
    shadowRadius: 28
  },
  quakeContentLayer: {
    position: "relative",
    zIndex: 2
  },
  quakeFrameChrome: {
    bottom: -10,
    left: -10,
    overflow: "hidden",
    position: "absolute",
    right: -10,
    top: -10,
    zIndex: 0
  },
  quakeLavaRail: {
    backgroundColor: "rgba(17, 30, 44, 0.82)",
    borderColor: "rgba(133, 169, 195, 0.36)",
    borderWidth: 1,
    bottom: 18,
    position: "absolute",
    shadowColor: "#6fa8d8",
    shadowOffset: { height: 0, width: 0 },
    shadowOpacity: 0.46,
    shadowRadius: 22,
    top: 18,
    width: 28
  },
  quakeLavaRailLeft: {
    left: 0
  },
  quakeLavaRailRight: {
    right: 0
  },
  quakeLavaGlow: {
    backgroundColor: "rgba(111, 168, 216, 0.2)",
    height: 32,
    left: 24,
    position: "absolute",
    right: 24,
    shadowColor: "#6fa8d8",
    shadowOffset: { height: 0, width: 0 },
    shadowOpacity: 0.62,
    shadowRadius: 28
  },
  quakeLavaGlowTop: {
    top: 0
  },
  quakeLavaGlowBottom: {
    bottom: 0
  },
  quakeRockShard: {
    backgroundColor: "#22374b",
    borderColor: "rgba(133, 169, 195, 0.32)",
    borderWidth: 1,
    position: "absolute",
    shadowColor: "#6fa8d8",
    shadowOffset: { height: 0, width: 0 },
    shadowOpacity: 0.28,
    shadowRadius: 10,
    transform: [{ rotate: "18deg" }]
  },
  quakeRockShardA: {
    height: 34,
    left: 4,
    top: 72,
    width: 22
  },
  quakeRockShardB: {
    height: 46,
    right: 0,
    top: 164,
    width: 28
  },
  quakeRockShardC: {
    bottom: 102,
    height: 42,
    left: 0,
    width: 30
  },
  quakeRockShardD: {
    bottom: 42,
    height: 34,
    right: 6,
    width: 24
  },
  mobileFrame: { alignSelf: "center" },
  mobileScrollContent: { alignItems: "center" },
  identity: { alignItems: "center", flex: 1, flexDirection: "row", gap: theme.spacing.sm, minWidth: 0 },
  identityCopy: { flex: 1, gap: 2, minWidth: 0 },
  lineLabel: { color: theme.colors.subtleText, fontFamily: theme.fonts.label, fontSize: 10, letterSpacing: 1.2 },
  lineLabelDense: { fontSize: 8 },
  lineMeta: { color: theme.colors.subtleText, fontFamily: theme.fonts.label, fontSize: 9, letterSpacing: 1 },
  lineMetaDense: { fontSize: 7 },
  linePill: {
    alignItems: "center",
    backgroundColor: theme.colors.cardMuted,
    borderColor: theme.colors.border,
    borderRadius: 12,
    borderWidth: 1,
    height: "100%",
    justifyContent: "center",
    overflow: "hidden",
    paddingHorizontal: 4,
    paddingVertical: 4,
    position: "relative",
    width: "100%"
  },
  linePillBusted: { backgroundColor: "rgba(255, 111, 127, 0.16)", borderColor: "rgba(255, 111, 127, 0.4)" },
  linePillCelebrating: { borderColor: "rgba(158, 223, 255, 0.82)" },
  linePillDense: { paddingHorizontal: 2, paddingVertical: 2 },
  lineFlash: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: theme.radius.md
  },
  lineFlashCelebrate: {
    backgroundColor: "rgba(95, 167, 231, 0.42)"
  },
  lineFlashWarning: {
    backgroundColor: "rgba(255, 143, 143, 0.38)"
  },
  linePillLocked: {
    backgroundColor: "rgba(95, 167, 231, 0.3)",
    borderColor: "rgba(158, 223, 255, 0.7)"
  },
  lineValue: { color: theme.colors.text, fontFamily: theme.fonts.display, fontSize: 24, lineHeight: 24 },
  lineValueDense: { fontSize: 16, lineHeight: 16 },
  lineValueTwentyOne: { color: "#f7fbff" },
  manualQuakeButton: {
    alignItems: "center",
    alignSelf: "center",
    backgroundColor: "rgba(23, 39, 55, 0.92)",
    borderColor: "rgba(111, 168, 216, 0.58)",
    borderWidth: 2,
    gap: 2,
    justifyContent: "center",
    minHeight: 44,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.xs,
    shadowColor: "#6fa8d8",
    shadowOffset: { height: 0, width: 0 },
    shadowOpacity: 0.32,
    shadowRadius: 16,
    width: "72%"
  },
  manualQuakeButtonDisabled: {
    opacity: 0.48
  },
  manualQuakeButtonPressed: {
    backgroundColor: "rgba(111, 168, 216, 0.28)",
    borderColor: "#d7ecfb",
    transform: [{ scale: 0.98 }]
  },
  manualQuakeButtonText: {
    color: "#eaf6ff",
    fontFamily: theme.fonts.display,
    fontSize: 20,
    lineHeight: 20,
    textShadowColor: "rgba(111, 168, 216, 0.7)",
    textShadowOffset: { height: 0, width: 0 },
    textShadowRadius: 10,
    textTransform: "uppercase"
  },
  manualQuakeButtonMeta: {
    color: "#b6ccdc",
    fontFamily: theme.fonts.label,
    fontSize: 9,
    letterSpacing: 1.1,
    textTransform: "uppercase"
  },
  matrix: { justifyContent: "space-between", overflow: "visible" },
  matrixRow: { flexDirection: "row", overflow: "visible" },
  playerMeta: { color: theme.colors.subtleText, fontFamily: theme.fonts.body, fontSize: 12, lineHeight: 16 },
  playerName: { color: theme.colors.text, fontFamily: theme.fonts.display, fontSize: 24, lineHeight: 24 },
  playerNameCompact: { fontSize: 20, lineHeight: 20 },
  queueHint: {
    color: theme.colors.subtleText,
    fontFamily: theme.fonts.body,
    fontSize: 11,
    lineHeight: 15,
    marginTop: theme.spacing.xs,
    textAlign: "right"
  },
  queueCard: { overflow: "visible" },
  queueCardDragging: {
    elevation: 12,
    shadowColor: "#ffffff",
    shadowOffset: { height: 16, width: 0 },
    shadowOpacity: 0.24,
    shadowRadius: 18,
    zIndex: 4
  },
  queueCardLead: { zIndex: 2 },
  queueEffectCard: {
    overflow: "visible",
    position: "absolute",
    top: 0
  },
  queueEffectsLayer: {
    ...StyleSheet.absoluteFillObject,
    overflow: "visible"
  },
  quakeHoldingLabel: {
    color: "#b6ccdc",
    fontFamily: theme.fonts.label,
    fontSize: 12,
    letterSpacing: 1.8,
    textShadowColor: "rgba(111, 168, 216, 0.62)",
    textShadowOffset: { height: 0, width: 0 },
    textShadowRadius: 8,
    textTransform: "uppercase"
  },
  quakeHoldingMeta: {
    alignItems: "center",
    backgroundColor: "rgba(16, 29, 43, 0.74)",
    borderColor: "rgba(133, 169, 195, 0.4)",
    borderWidth: 1,
    flexDirection: "column",
    gap: 2,
    justifyContent: "center",
    paddingVertical: 4,
    width: "100%"
  },
  quakeHoldingValue: {
    color: "#eaf6ff",
    fontFamily: theme.fonts.bodyBold,
    fontSize: 11
  },
  queueUndoButton: {
    gap: 4,
    paddingHorizontal: 0,
    paddingVertical: 0
  },
  queueUndoRow: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
    transform: [{ perspective: 900 }, { rotateX: "-2deg" }]
  },
  queueRow: {
    alignItems: "center",
    flexDirection: "row",
    height: "100%",
    justifyContent: "flex-end",
    overflow: "visible",
    width: "100%"
  },
  queueSlot: { overflow: "visible" },
  queueStage: {
    overflow: "visible",
    position: "relative"
  },
  queueWell: {
    alignItems: "flex-end",
    flex: 1,
    gap: theme.spacing.xs,
    justifyContent: "center",
    overflow: "visible"
  },
  queueSurface: {
    alignItems: "center",
    justifyContent: "center"
  },
  queueWellStructured: {
    alignItems: "stretch",
    width: "100%"
  },
  queueHintStructured: {
    textAlign: "left"
  },
  root: { backgroundColor: theme.colors.background, flex: 1, overflow: "hidden" },
  rootQuake: {
    backgroundColor: "#172433"
  },
  safe: { flex: 1 },
  sideCard: {
    gap: theme.spacing.sm,
    shadowColor: "#6fa8d8",
    shadowOffset: { height: 0, width: 0 },
    shadowOpacity: 0.14,
    shadowRadius: 18
  },
  sideCardQuake: {
    backgroundColor: "rgba(20, 34, 48, 0.82)",
    borderColor: "rgba(133, 169, 195, 0.34)",
    shadowColor: "#6fa8d8",
    shadowOpacity: 0.24,
    shadowRadius: 22
  },
  sideControls: { gap: theme.spacing.sm },
  sideRail: { flexShrink: 0 },
  splitFrame: {
    alignItems: "center",
    backgroundColor: "rgba(4, 17, 29, 0.58)",
    borderColor: "rgba(68, 105, 138, 0.38)",
    borderRadius: 28,
    borderWidth: 1,
    flexDirection: "column"
  },
  setupActions: {
    alignItems: "stretch",
    flexDirection: "row",
    gap: theme.spacing.sm,
    width: "100%"
  },
  setupActionsSplit: {
    alignItems: "stretch",
    flexDirection: "row",
    gap: theme.spacing.sm,
    width: "100%"
  },
  setupActionHalf: {
    flex: 1
  },
  setupBody: {
    color: "rgba(241, 245, 233, 0.84)",
    fontFamily: theme.fonts.body,
    fontSize: 13,
    lineHeight: 18,
    maxWidth: 360
  },
  setupCard: {
    backgroundColor: "rgba(10, 12, 14, 0.98)",
    borderColor: "rgba(255, 255, 255, 0.12)",
    borderRadius: theme.radius.xl,
    borderWidth: 1,
    gap: theme.spacing.sm,
    padding: theme.spacing.md,
    shadowColor: "#000000",
    shadowOffset: { height: 12, width: 0 },
    shadowOpacity: 0.22,
    shadowRadius: 18
  },
  setupHeader: {
    gap: theme.spacing.xs,
    paddingBottom: theme.spacing.xs
  },
  setupGuideButton: {
    alignSelf: "flex-start",
    backgroundColor: "rgba(255, 255, 255, 0.04)",
    borderColor: "rgba(255, 255, 255, 0.08)",
    borderRadius: 999,
    borderWidth: 1,
    marginTop: theme.spacing.xs,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 8
  },
  setupGuideButtonPressed: {
    backgroundColor: "rgba(255, 255, 255, 0.08)"
  },
  setupGuideButtonText: {
    color: theme.colors.text,
    fontFamily: theme.fonts.label,
    fontSize: 10,
    letterSpacing: 1.2,
    textTransform: "uppercase"
  },
  setupMetaCard: {
    backgroundColor: "rgba(255, 255, 255, 0.03)",
    borderColor: "rgba(255, 255, 255, 0.07)",
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    flex: 1,
    gap: 4,
    minWidth: 104,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.sm
  },
  setupMetaGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: theme.spacing.sm,
    width: "100%"
  },
  setupMetaGridCompact: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: theme.spacing.xs,
    width: "100%"
  },
  setupMetaLabel: {
    color: theme.colors.subtleText,
    fontFamily: theme.fonts.label,
    fontSize: 10,
    letterSpacing: 1.2,
    textTransform: "uppercase"
  },
  setupMetaValue: {
    color: theme.colors.text,
    fontFamily: theme.fonts.bodyBold,
    fontSize: 14
  },
  setupMetaCardCompact: {
    backgroundColor: "rgba(255, 255, 255, 0.025)",
    borderColor: "rgba(255, 255, 255, 0.06)",
    borderRadius: theme.radius.md,
    borderWidth: 1,
    flex: 1,
    gap: 4,
    minWidth: 96,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs
  },
  setupChip: {
    minHeight: 42,
    minWidth: 76,
    paddingHorizontal: theme.spacing.sm
  },
  setupChipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: theme.spacing.xs,
    width: "100%"
  },
  setupDifficultyCard: {
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.035)",
    borderColor: "rgba(255, 255, 255, 0.08)",
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    flexDirection: "row",
    gap: theme.spacing.xs,
    justifyContent: "space-between",
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.sm
  },
  setupDifficultyCardPressed: {
    backgroundColor: "rgba(255, 255, 255, 0.08)"
  },
  setupDifficultyCardSelected: {
    backgroundColor: "rgba(110, 255, 186, 0.12)",
    borderColor: "rgba(110, 255, 186, 0.34)"
  },
  setupDifficultyCopy: {
    flex: 1,
    gap: 4,
    minWidth: 0
  },
  difficultyPreviewBoard: {
    backgroundColor: "rgba(5, 9, 8, 0.72)",
    borderColor: "rgba(255, 255, 255, 0.08)",
    borderRadius: 10,
    borderWidth: 1,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 3,
    height: 58,
    padding: 5,
    width: 58
  },
  difficultyPreviewBoardSelected: {
    borderColor: "rgba(110, 255, 186, 0.3)"
  },
  difficultyPreviewCell: {
    backgroundColor: "rgba(255, 255, 255, 0.03)",
    borderColor: "rgba(255, 255, 255, 0.06)",
    borderRadius: 4,
    borderWidth: 1,
    height: 6.8,
    width: 6.8
  },
  difficultyPreviewCellFilled: {
    backgroundColor: "rgba(110, 255, 186, 0.76)",
    borderColor: "rgba(200, 255, 224, 0.92)"
  },
  difficultyPreviewCellSelected: {
    shadowColor: "#8ef0bc",
    shadowOffset: { height: 0, width: 0 },
    shadowOpacity: 0.12,
    shadowRadius: 4
  },
  setupDifficultyDescription: {
    color: theme.colors.subtleText,
    fontFamily: theme.fonts.body,
    fontSize: 11,
    lineHeight: 15
  },
  setupDifficultyLabel: {
    color: theme.colors.text,
    fontFamily: theme.fonts.bodyBold,
    fontSize: 14
  },
  setupDifficultyLabelSelected: {
    color: "#dfffea"
  },
  setupDifficultyStack: {
    gap: theme.spacing.sm,
    width: "100%"
  },
  setupDifficultyState: {
    backgroundColor: "rgba(255, 255, 255, 0.04)",
    borderColor: "rgba(255, 255, 255, 0.08)",
    borderRadius: 999,
    borderWidth: 1,
    color: theme.colors.subtleText,
    fontFamily: theme.fonts.label,
    fontSize: 10,
    letterSpacing: 1.2,
    minWidth: 68,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 7,
    textAlign: "center",
    textTransform: "uppercase"
  },
  setupDifficultyStateSelected: {
    backgroundColor: "rgba(110, 255, 186, 0.14)",
    borderColor: "rgba(110, 255, 186, 0.28)",
    color: "#dfffea"
  },
  setupFootnote: {
    color: theme.colors.subtleText,
    fontFamily: theme.fonts.body,
    fontSize: 11,
    lineHeight: 16
  },
  setupHelpButton: {
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.035)",
    borderColor: "rgba(255, 255, 255, 0.08)",
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    justifyContent: "center",
    minHeight: 56,
    width: 56
  },
  setupHelpButtonPressed: {
    backgroundColor: "rgba(255, 255, 255, 0.08)"
  },
  setupHelpGlyph: {
    color: theme.colors.text,
    fontFamily: theme.fonts.display,
    fontSize: 24,
    lineHeight: 24
  },
  setupHero: {
    borderRadius: theme.radius.xl,
    gap: theme.spacing.xs,
    overflow: "hidden",
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.lg,
    position: "relative"
  },
  setupIntroCard: {
    backgroundColor: "rgba(255, 255, 255, 0.03)",
    borderColor: "rgba(255, 255, 255, 0.07)",
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    flex: 1,
    gap: theme.spacing.xs,
    minWidth: 120,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.sm
  },
  setupIntroDetail: {
    color: "rgba(241, 245, 233, 0.74)",
    fontFamily: theme.fonts.body,
    fontSize: 12,
    lineHeight: 17
  },
  setupIntroGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: theme.spacing.sm,
    width: "100%"
  },
  setupIntroStep: {
    color: "#e6fff0",
    fontFamily: theme.fonts.bodyBold,
    fontSize: 13
  },
  setupKicker: {
    color: "#8ef0bc",
    fontFamily: theme.fonts.label,
    fontSize: 11,
    letterSpacing: 1.8,
    textTransform: "uppercase"
  },
  setupOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    backgroundColor: "rgba(5, 5, 5, 0.78)",
    justifyContent: "center",
    padding: theme.spacing.lg,
    zIndex: 50
  },
  setupOverlayContent: {
    alignItems: "center",
    flexGrow: 1,
    justifyContent: "center",
    paddingVertical: theme.spacing.lg
  },
  setupOverlayScroll: {
    width: "100%"
  },
  setupPrimaryAction: {
    flex: 1
  },
  setupProgressDot: {
    backgroundColor: "rgba(255, 255, 255, 0.18)",
    borderRadius: 999,
    height: 8,
    width: 8
  },
  setupProgressDotActive: {
    backgroundColor: "#f4f9ec",
    transform: [{ scale: 1.25 }]
  },
  setupProgressDotComplete: {
    backgroundColor: "#8ef0bc"
  },
  setupProgressLabel: {
    color: "rgba(241, 245, 233, 0.6)",
    fontFamily: theme.fonts.label,
    fontSize: 10,
    letterSpacing: 1.1,
    textTransform: "uppercase"
  },
  setupProgressLabelActive: {
    color: "#f4f9ec"
  },
  setupProgressRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: theme.spacing.md,
    marginTop: theme.spacing.sm
  },
  setupProgressStep: {
    alignItems: "center",
    flexDirection: "row",
    gap: theme.spacing.xs
  },
  setupSection: {
    gap: theme.spacing.sm,
    width: "100%"
  },
  setupSectionHint: {
    color: "rgba(241, 245, 233, 0.7)",
    fontFamily: theme.fonts.body,
    fontSize: 12,
    lineHeight: 17
  },
  setupSummaryCard: {
    backgroundColor: "rgba(255, 255, 255, 0.025)",
    borderColor: "rgba(255, 255, 255, 0.06)",
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    gap: 6,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.sm,
    width: "100%"
  },
  setupSummaryLabel: {
    color: theme.colors.subtleText,
    fontFamily: theme.fonts.label,
    fontSize: 10,
    letterSpacing: 1.2,
    textTransform: "uppercase"
  },
  setupSummaryText: {
    color: theme.colors.text,
    fontFamily: theme.fonts.body,
    fontSize: 13,
    lineHeight: 18
  },
  setupSimpleLine: {
    color: theme.colors.text,
    fontFamily: theme.fonts.body,
    fontSize: 13,
    lineHeight: 18
  },
  setupSimplePanel: {
    backgroundColor: "rgba(255, 255, 255, 0.03)",
    borderColor: "rgba(255, 255, 255, 0.08)",
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    gap: theme.spacing.sm,
    padding: theme.spacing.sm,
    width: "100%"
  },
  setupSectionLabel: {
    color: theme.colors.subtleText,
    fontFamily: theme.fonts.label,
    fontSize: 10,
    letterSpacing: 1.5,
    textTransform: "uppercase"
  },
  setupSectionSurface: {
    gap: theme.spacing.sm,
    padding: theme.spacing.md
  },
  setupTitle: {
    color: "#f4f9ec",
    fontFamily: theme.fonts.display,
    fontSize: 28,
    lineHeight: 28
  },
  setupTag: {
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderColor: "rgba(255, 255, 255, 0.08)",
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 6
  },
  setupTagRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: theme.spacing.xs
  },
  setupTagText: {
    color: theme.colors.subtleText,
    fontFamily: theme.fonts.label,
    fontSize: 10,
    letterSpacing: 1,
    textTransform: "uppercase"
  },
  setupWarning: {
    color: "#ffb1b1",
    fontFamily: theme.fonts.bodyBold,
    fontSize: 12
  },
  scoreCard: {
    borderColor: "rgba(255, 255, 255, 0.12)",
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    gap: 4,
    minHeight: 64,
    overflow: "hidden",
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm
  },
  scoreLabel: {
    color: "rgba(240, 246, 231, 0.7)",
    fontFamily: theme.fonts.label,
    fontSize: 10,
    letterSpacing: 1.4,
    textTransform: "uppercase"
  },
  scoreMeta: {
    color: "rgba(241, 245, 233, 0.72)",
    fontFamily: theme.fonts.body,
    fontSize: 12
  },
  scoreValue: {
    color: "#f6f9ef",
    fontFamily: theme.fonts.display,
    fontSize: 26,
    lineHeight: 26
  },
  inlineSpecialBack: {
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.06)",
    borderColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 999,
    borderWidth: 1,
    justifyContent: "center",
    minHeight: 32,
    paddingHorizontal: theme.spacing.sm
  },
  inlineSpecialBackText: {
    color: theme.colors.text,
    fontFamily: theme.fonts.bodyBold,
    fontSize: 12
  },
  inlineSpecialChip: {
    alignItems: "center",
    backgroundColor: "rgba(248, 248, 248, 0.96)",
    borderRadius: theme.radius.md,
    gap: 4,
    justifyContent: "center",
    minHeight: 64,
    paddingHorizontal: theme.spacing.xs,
    paddingVertical: theme.spacing.sm
  },
  inlineSpecialChipNote: {
    color: "rgba(17, 17, 17, 0.62)",
    fontFamily: theme.fonts.label,
    fontSize: 9,
    letterSpacing: 0.9,
    textTransform: "uppercase"
  },
  inlineSpecialChipPressed: {
    opacity: 0.82
  },
  inlineSpecialChipValue: {
    color: "#111111",
    fontFamily: theme.fonts.display,
    fontSize: 22,
    lineHeight: 22
  },
  inlineSpecialCopy: {
    flex: 1,
    gap: 4,
    minWidth: 0
  },
  inlineSpecialGrid: {
    flexDirection: "row",
    flexWrap: "wrap"
  },
  inlineSpecialHeader: {
    alignItems: "center",
    flexDirection: "row",
    gap: theme.spacing.sm,
    justifyContent: "space-between"
  },
  inlineSpecialKicker: {
    color: "#9ef5c8",
    fontFamily: theme.fonts.label,
    fontSize: 10,
    letterSpacing: 1.4,
    textTransform: "uppercase"
  },
  inlineSpecialPanel: {
    backgroundColor: "rgba(11, 13, 12, 0.96)",
    borderColor: "rgba(158, 245, 200, 0.16)",
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    padding: theme.spacing.sm
  },
  inlineSpecialTitle: {
    color: theme.colors.text,
    fontFamily: theme.fonts.bodyBold,
    fontSize: 14,
    lineHeight: 18
  },
  stage: { alignItems: "center", flex: 1, justifyContent: "center" },
  stat: {
    backgroundColor: theme.colors.cardMuted,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    flex: 1,
    gap: 4,
    minWidth: 56,
    paddingHorizontal: theme.spacing.xs,
    paddingVertical: theme.spacing.xs
  },
  statLabel: { color: theme.colors.subtleText, fontFamily: theme.fonts.label, fontSize: 9, letterSpacing: 1.1, textTransform: "uppercase" },
  statRow: { flexDirection: "row", gap: theme.spacing.xs, justifyContent: "flex-end" },
  statValue: { color: theme.colors.text, fontFamily: theme.fonts.bodyBold, fontSize: 14 },
  strip: {
    backgroundColor: "rgba(5, 18, 30, 0.92)",
    borderColor: "rgba(105, 150, 190, 0.56)",
    borderWidth: 2
  },
  specialCancel: {
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.04)",
    borderColor: "rgba(255, 255, 255, 0.14)",
    borderRadius: 999,
    borderWidth: 1,
    justifyContent: "center",
    minHeight: 46,
    paddingHorizontal: theme.spacing.md
  },
  specialCancelText: {
    color: theme.colors.text,
    fontFamily: theme.fonts.bodyBold,
    fontSize: 14
  },
  specialHint: {
    color: "rgba(239, 244, 233, 0.82)",
    fontFamily: theme.fonts.body,
    fontSize: 13,
    lineHeight: 18,
    textAlign: "left"
  },
  specialHero: {
    borderRadius: theme.radius.xl,
    flexDirection: "row",
    gap: theme.spacing.md,
    overflow: "hidden",
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.md,
    position: "relative"
  },
  specialHeroCopy: {
    flex: 1,
    gap: theme.spacing.xs,
    minWidth: 0
  },
  specialHeroOrb: {
    backgroundColor: "rgba(255, 255, 255, 0.08)",
    borderRadius: 999,
    height: 150,
    position: "absolute",
    right: -36,
    top: -64,
    width: 150
  },
  specialHeroTile: {
    height: 88,
    width: 74
  },
  specialKicker: {
    color: "#f4f9ec",
    fontFamily: theme.fonts.label,
    fontSize: 10,
    letterSpacing: 1.8,
    textAlign: "left",
    textTransform: "uppercase"
  },
  specialMetaCard: {
    backgroundColor: "rgba(255, 255, 255, 0.04)",
    borderColor: "rgba(255, 255, 255, 0.08)",
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    flex: 1,
    gap: 4,
    minWidth: 128,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.sm
  },
  specialMetaLabel: {
    color: theme.colors.subtleText,
    fontFamily: theme.fonts.label,
    fontSize: 9,
    letterSpacing: 1.2,
    textTransform: "uppercase"
  },
  specialMetaRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: theme.spacing.sm
  },
  specialMetaValue: {
    color: theme.colors.text,
    fontFamily: theme.fonts.bodyBold,
    fontSize: 13,
    lineHeight: 17
  },
  specialModal: {
    backgroundColor: "rgba(10, 10, 10, 0.96)",
    borderColor: "rgba(255, 255, 255, 0.12)",
    borderRadius: theme.radius.xl,
    borderWidth: 1,
    gap: theme.spacing.md,
    maxWidth: 560,
    padding: theme.spacing.md,
    width: "100%"
  },
  specialOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    backgroundColor: "rgba(5, 5, 5, 0.82)",
    justifyContent: "center",
    padding: theme.spacing.lg,
    zIndex: 40
  },
  specialTitle: {
    color: theme.colors.text,
    fontFamily: theme.fonts.display,
    fontSize: 30,
    lineHeight: 30,
    textAlign: "left"
  },
  specialValueChip: {
    borderRadius: theme.radius.lg,
    overflow: "hidden"
  },
  specialValueChipPressed: {
    opacity: 0.86
  },
  specialValueNote: {
    color: "rgba(17, 17, 17, 0.62)",
    fontFamily: theme.fonts.label,
    fontSize: 10,
    letterSpacing: 1,
    textTransform: "uppercase"
  },
  specialValueGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: theme.spacing.sm,
    justifyContent: "center"
  },
  specialValueSurface: {
    alignItems: "center",
    borderRadius: theme.radius.lg,
    gap: 6,
    justifyContent: "center",
    minHeight: 92,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.md
  },
  specialValueText: {
    color: "#050505",
    fontFamily: theme.fonts.display,
    fontSize: 28,
    lineHeight: 28
  },
  tile: {
    alignItems: "center",
    backgroundColor: "transparent",
    borderColor: "rgba(255, 255, 255, 0.22)",
    borderRadius: 12,
    borderWidth: 0,
    height: "100%",
    justifyContent: "center",
    overflow: "visible",
    position: "relative",
    width: "100%"
  },
  tileCompact: {},
  tileDense: {},
  tileDimmed: { opacity: 0.62 },
  tileImageShell: {
    overflow: "hidden"
  },
  tileImageOverlay: {
    bottom: 0,
    left: 0,
    position: "absolute",
    right: 0,
    top: 0
  },
  tileFullImage: {
    borderRadius: theme.radius.md,
    height: "100%",
    width: "100%"
  },
  tileFullImageCompact: {
    borderRadius: theme.radius.md
  },
  tileFullImageDense: {
    borderRadius: theme.radius.md
  },
  tileLead: {
    elevation: 0
  },
  tileQuake: {
    elevation: 0,
    shadowOpacity: 0
  },
  tileQuakeDanger: {
    shadowColor: "#ffc3c0",
    shadowOpacity: 0.28,
    shadowRadius: 18
  },
  tileQuakeImageLayer: {
    borderColor: "rgba(151, 181, 204, 0.22)",
    borderRadius: 15,
    borderWidth: 1,
    bottom: 0,
    left: 0,
    overflow: "hidden",
    position: "absolute",
    right: 0,
    top: 0,
    shadowOpacity: 0
  },
  tileQuakeLayerImage: {
    height: "100%",
    opacity: 0.2,
    width: "100%"
  },
  tileGlassGlow: {
    backgroundColor: "rgba(255, 255, 255, 0.18)",
    borderRadius: 999,
    bottom: "18%",
    left: "18%",
    position: "absolute",
    right: "18%",
    top: "28%"
  },
  tileGlassSheen: {
    backgroundColor: "rgba(255, 255, 255, 0.34)",
    borderRadius: 999,
    height: "34%",
    left: "10%",
    position: "absolute",
    top: "7%",
    transform: [{ rotate: "-12deg" }],
    width: "72%"
  },
  tileLocked: {
    opacity: 0.92
  },
  tileLockPulse: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(255, 255, 255, 0.16)",
    borderRadius: 12
  },
  tileShadow: {
    backgroundColor: "rgba(0, 0, 0, 0.22)",
    borderRadius: 7,
    bottom: -2,
    left: 5,
    position: "absolute",
    right: 2,
    top: 7
  },
  tileDepth: {
    backgroundColor: "rgba(0, 0, 0, 0.24)",
    borderRadius: 7,
    borderWidth: 0,
    bottom: -1,
    left: 3,
    position: "absolute",
    right: -1,
    top: 5
  },
  tileSurface: {
    borderRadius: 12,
    bottom: 0,
    left: 0,
    position: "absolute",
    right: 0,
    top: 0
  },
  tileSurfaceQuake: {
    borderColor: "rgba(233, 244, 255, 0.68)",
    borderRadius: 15,
    borderWidth: 1,
    bottom: 0,
    left: 0,
    overflow: "hidden",
    right: 0,
    top: 0
  },
  tileSurfaceQuakeFlat: {
    bottom: 0,
    left: 0,
    right: 0
  },
  tileQuakeImage: {
    height: "100%",
    opacity: 0.16,
    width: "100%"
  },
  tileQuakeGloss: {
    borderRadius: 15,
    bottom: 22,
    left: 6,
    opacity: 0.86,
    position: "absolute",
    right: 14,
    top: 2
  },
  tileQuakeInnerRim: {
    borderColor: "rgba(255, 255, 255, 0.52)",
    borderRadius: 13,
    borderWidth: 1,
    bottom: 25,
    left: 9,
    position: "absolute",
    right: 18,
    top: 5
  },
  tileGloss: {
    borderRadius: 13,
    bottom: 5,
    left: 0,
    position: "absolute",
    right: 0,
    top: 0
  },
  tileInset: {
    borderColor: "rgba(208, 239, 255, 0.34)",
    borderRadius: 12,
    borderWidth: 1,
    bottom: 8,
    left: 4,
    position: "absolute",
    right: 4,
    top: 4
  },
  tileTopRim: {
    backgroundColor: "rgba(232, 248, 255, 0.7)",
    height: 1,
    left: 8,
    position: "absolute",
    right: 8,
    top: 6
  },
  tileLeftRim: {
    backgroundColor: "rgba(232, 248, 255, 0.34)",
    bottom: 12,
    left: 6,
    position: "absolute",
    top: 8,
    width: 1
  },
  tileBottomRim: {
    backgroundColor: "rgba(0, 0, 0, 0.34)",
    bottom: 8,
    height: 1,
    left: 8,
    position: "absolute",
    right: 8
  },
  tileCoreGlow: {
    backgroundColor: "rgba(158, 223, 255, 0.24)",
    borderRadius: 999,
    height: "44%",
    left: "16%",
    position: "absolute",
    top: "20%",
    width: "68%"
  },
  tileCenter: {
    alignItems: "center",
    flex: 1,
    justifyContent: "center",
    paddingBottom: 0,
    width: "100%"
  },
  tileCenterQuake: {
    bottom: 0,
    left: 0,
    paddingBottom: 0,
    paddingRight: 0,
    position: "absolute",
    right: 0,
    top: 0
  },
  tileCenterQuakeFlat: {
    bottom: 0
  },
  tileMiniPip: {
    backgroundColor: "rgba(255, 255, 255, 0.76)",
    borderRadius: 999,
    height: 4,
    marginBottom: 3,
    width: 16
  },
  tileAceImage: {
    height: 46,
    width: 46
  },
  tileAceImageCompact: {
    height: 28,
    width: 28
  },
  tileAceImageDense: {
    height: 22,
    width: 22
  },
  tileRank: {
    color: "#111111",
    fontFamily: theme.fonts.display,
    fontSize: 42,
    lineHeight: 42,
    textShadowColor: "transparent",
    textShadowOffset: { height: 0, width: 0 },
    textShadowRadius: 0
  },
  tileRankCompact: { fontSize: 24, lineHeight: 24 },
  tileRankDense: { fontSize: 18, lineHeight: 18 },
  tileRankQuake: {
    fontSize: 38,
    lineHeight: 38,
    textShadowColor: "rgba(255, 255, 255, 0.78)",
    textShadowOffset: { height: 1, width: 0 },
    textShadowRadius: 2
  },
  tileRankSpecial: {
    color: "#d7ecfb"
  },
  tileSpecial: {
    borderColor: "rgba(215, 236, 251, 0.5)"
  },
  tileSpecialMeta: {
    color: "rgba(255, 246, 220, 0.82)",
    fontFamily: theme.fonts.label,
    fontSize: 8,
    letterSpacing: 1,
    marginTop: -2
  },
  topStrip: { alignItems: "center", flexDirection: "row", gap: theme.spacing.sm },
  tutorialActionText: {
    color: theme.colors.subtleText,
    fontFamily: theme.fonts.body,
    fontSize: 12,
    lineHeight: 16
  },
  tutorialActions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: theme.spacing.sm
  },
  tutorialActionsCompact: {
    gap: theme.spacing.xs
  },
  tutorialActionCompact: {
    minHeight: 38,
    paddingHorizontal: theme.spacing.sm
  },
  tutorialBody: {
    color: theme.colors.text,
    fontFamily: theme.fonts.body,
    fontSize: 14,
    lineHeight: 20
  },
  tutorialBodyCompact: {
    fontSize: 13,
    lineHeight: 18
  },
  tutorialCard: {
    backgroundColor: "rgba(11, 12, 14, 0.98)",
    borderColor: "rgba(255, 255, 255, 0.12)",
    borderRadius: theme.radius.xl,
    borderWidth: 1,
    gap: theme.spacing.sm,
    padding: theme.spacing.lg,
    position: "absolute",
    shadowColor: "#000000",
    shadowOffset: { height: 16, width: 0 },
    shadowOpacity: 0.32,
    shadowRadius: 24,
    zIndex: 65
  },
  tutorialCardCompact: {
    gap: theme.spacing.xs,
    padding: theme.spacing.md
  },
  tutorialKicker: {
    color: "#8ef0bc",
    fontFamily: theme.fonts.label,
    fontSize: 11,
    letterSpacing: 1.8,
    textTransform: "uppercase"
  },
  tutorialKickerCompact: {
    fontSize: 10,
    letterSpacing: 1.4
  },
  tutorialOverlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 60
  },
  tutorialPrimaryAction: {
    alignItems: "center",
    backgroundColor: theme.colors.surface,
    borderRadius: 999,
    justifyContent: "center",
    minHeight: 42,
    paddingHorizontal: theme.spacing.md
  },
  tutorialPrimaryActionPressed: {
    backgroundColor: theme.colors.surfacePressed
  },
  tutorialPrimaryActionText: {
    color: "#050505",
    fontFamily: theme.fonts.bodyBold,
    fontSize: 14
  },
  tutorialSecondaryAction: {
    alignItems: "center",
    borderColor: "rgba(255, 255, 255, 0.16)",
    borderRadius: 999,
    borderWidth: 1,
    justifyContent: "center",
    minHeight: 42,
    paddingHorizontal: theme.spacing.md
  },
  tutorialSecondaryActionPressed: {
    backgroundColor: "rgba(255, 255, 255, 0.08)"
  },
  tutorialSecondaryActionText: {
    color: theme.colors.text,
    fontFamily: theme.fonts.bodyBold,
    fontSize: 14
  },
  tutorialActionTextCompact: {
    fontSize: 11,
    lineHeight: 15
  },
  tutorialActionTextCompactButton: {
    fontSize: 13
  },
  tutorialShade: {
    backgroundColor: "rgba(5, 5, 5, 0.8)",
    position: "absolute"
  },
  tutorialShadeFull: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(5, 5, 5, 0.8)"
  },
  tutorialSpotlight: {
    borderColor: "#8ef0bc",
    borderRadius: theme.radius.xl,
    borderWidth: 2,
    position: "absolute",
    shadowColor: "#8ef0bc",
    shadowOffset: { height: 0, width: 0 },
    shadowOpacity: 0.32,
    shadowRadius: 20
  },
  tutorialTargetTag: {
    backgroundColor: "#8ef0bc",
    borderRadius: 999,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 6,
    position: "absolute",
    zIndex: 64
  },
  tutorialTargetTagText: {
    color: "#05110a",
    fontFamily: theme.fonts.label,
    fontSize: 10,
    letterSpacing: 1.2,
    textTransform: "uppercase"
  },
  tutorialTitle: {
    color: theme.colors.text,
    fontFamily: theme.fonts.display,
    fontSize: 26,
    lineHeight: 28
  },
  tutorialTitleCompact: {
    fontSize: 22,
    lineHeight: 24
  },
  utilityButton: {
    alignItems: "center",
    backgroundColor: theme.colors.cardMuted,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    justifyContent: "center",
    minHeight: 38,
    paddingHorizontal: theme.spacing.sm
  },
  utilityButtonDisabled: {
    opacity: 0.42
  },
  utilityButtonHelp: {
    backgroundColor: "rgba(110, 255, 186, 0.12)",
    borderColor: "rgba(110, 255, 186, 0.34)"
  },
  utilityButtonIcon: {
    flex: 1,
    flexDirection: "row",
    gap: theme.spacing.xs,
    minHeight: 52,
    paddingHorizontal: theme.spacing.md
  },
  utilityButtonFull: {
    width: "100%"
  },
  utilityButtonGrow: {
    flex: 1,
    minWidth: 0
  },
  utilityGlyph: {
    color: theme.colors.text,
    fontFamily: theme.fonts.display,
    fontSize: 24,
    lineHeight: 24
  },
  utilityButtonAccent: {
    backgroundColor: "rgba(110, 255, 186, 0.12)",
    borderColor: "rgba(110, 255, 186, 0.34)"
  },
  utilityActionButton: {
    backgroundColor: "rgba(255, 208, 126, 0.12)",
    borderColor: "rgba(255, 208, 126, 0.34)"
  },
  utilityLightningButton: {
    backgroundColor: "rgba(134, 204, 255, 0.14)",
    borderColor: "rgba(134, 204, 255, 0.34)"
  },
  utilityMeta: {
    color: theme.colors.subtleText,
    fontFamily: theme.fonts.label,
    fontSize: 10,
    letterSpacing: 1.1,
    textTransform: "uppercase"
  },
  utilityPowerButton: {
    backgroundColor: "rgba(110, 255, 186, 0.12)",
    borderColor: "rgba(110, 255, 186, 0.34)"
  },
  utilityButtonPressed: {
    backgroundColor: "rgba(255, 255, 255, 0.14)"
  },
  utilityButtonText: {
    color: theme.colors.text,
    fontFamily: theme.fonts.label,
    fontSize: 11,
    letterSpacing: 1.2,
    textTransform: "uppercase"
  },
  utilityButtonWrap: {
    width: "100%"
  },
  utilityButtonWrapHalf: {
    flex: 1
  },
  utilityColumn: {
    gap: theme.spacing.xs
  },
  utilityColumnCentered: {
    alignItems: "center",
    alignSelf: "center"
  },
  utilityRow: {
    flexDirection: "row",
    gap: theme.spacing.xs,
    width: "100%"
  }
});
