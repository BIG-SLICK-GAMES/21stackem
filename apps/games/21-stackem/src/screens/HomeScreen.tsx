import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Href, router } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { startTransition, useEffect, useRef, useState } from "react";
import {
  Animated,
  Easing,
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View
} from "react-native";

import { AppNav, AppNavKey } from "../components/layout/AppNav";
import { ScreenContainer } from "../components/layout/ScreenContainer";
import { stackemRoutes } from "../navigation/routes";
import { hubStackemApi } from "../platform/api/stackem";
import { useHubSession } from "../platform/auth/session";
import { formatChipCount } from "../platform/lib/format";
import { fireHaptic } from "../services/haptics";
import { useGameSettings } from "../store/game-settings";
import { theme } from "../theme";

type EntryDifficulty = "easy" | "medium" | "hard";
type EntryMode = "classic" | "quake";
const PREVIEW_TARGET_TOTAL = 21;
const QUAKE_TILE_IMAGE = require("../../assets/images/quake-tile.png");

// ─── Logo ────────────────────────────────────────────────────────────────────

const logoStyles = StyleSheet.create({
  badge: {
    alignItems: "center",
    borderColor: "rgba(140, 200, 255, 0.5)",
    borderRadius: 14,
    borderWidth: 1.5,
    justifyContent: "center",
    overflow: "hidden",
    paddingHorizontal: 22,
    paddingVertical: 10
  },
  glare: {
    backgroundColor: "rgba(210, 240, 255, 0.13)",
    height: 22,
    left: 0,
    position: "absolute",
    right: 0,
    top: 0
  },
  name: {
    color: "rgba(200, 235, 255, 0.75)",
    fontFamily: theme.fonts.label,
    fontSize: 11,
    letterSpacing: 7,
    lineHeight: 14,
    marginTop: 2
  },
  number: {
    color: "#ffffff",
    fontFamily: theme.fonts.display,
    fontSize: 52,
    letterSpacing: -2,
    lineHeight: 52,
    textShadowColor: "#6fa8d8",
    textShadowOffset: { height: 0, width: 0 },
    textShadowRadius: 18
  },
  root: { alignItems: "center", justifyContent: "center" },
  stripe: {
    backgroundColor: "rgba(126, 203, 255, 0.18)",
    height: 2,
    left: 0,
    position: "absolute",
    right: 0,
    top: 56
  }
});

const logoShimmerStyle: import("react-native").ViewStyle = {
  backgroundColor: "rgba(255,255,255,0.12)",
  bottom: 0,
  left: 0,
  position: "absolute",
  top: 0,
  width: 40,
  transform: [{ skewX: "-18deg" }]
};

function StackemLogo() {
  const shimmer = useRef(new Animated.Value(-1)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.delay(2800),
        Animated.timing(shimmer, {
          toValue: 1,
          duration: 900,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true
        }),
        Animated.timing(shimmer, { toValue: -1, duration: 0, useNativeDriver: true })
      ])
    ).start();
  }, [shimmer]);

  return (
    <View style={logoStyles.root}>
      <LinearGradient
        colors={["#1a4d78", "#08213a"]}
        end={{ x: 0.6, y: 1 }}
        start={{ x: 0, y: 0 }}
        style={logoStyles.badge}
      >
        <View style={logoStyles.glare} />
        <View style={logoStyles.stripe} />
        <Text style={logoStyles.number}>21</Text>
        <Text style={logoStyles.name}>STACK’EM</Text>
        <Animated.View
          pointerEvents="none"
          style={[
            logoShimmerStyle,
            { transform: [{ translateX: shimmer.interpolate({ inputRange: [-1, 1], outputRange: [-120, 120] }) }] }
          ]}
        />
      </LinearGradient>
    </View>
  );
}

const difficultyOptions: Array<{
  body: string;
  key: EntryDifficulty;
  label: string;
  openingTiles: number;
  rewardRange: string;
}> = [
  { body: "Clean board / lower reward.", key: "easy", label: "Easy", openingTiles: 0, rewardRange: "x2 to x5" },
  { body: "3 filled tiles / better reward.", key: "medium", label: "Medium", openingTiles: 3, rewardRange: "x5.5 to x7.5" },
  { body: "6 filled tiles / highest reward.", key: "hard", label: "Hard", openingTiles: 6, rewardRange: "x8 to x12.5" }
];

const previewSeedCells = [
  { row: 1, col: 1 },
  { row: 2, col: 2 },
  { row: 3, col: 3 },
  { row: 1, col: 3 },
  { row: 3, col: 1 },
  { row: 2, col: 1 }
];

const previewBoardCells = Array.from({ length: 25 }, (_, index) => ({
  col: index % 5,
  key: `preview-cell-${index}`,
  row: Math.floor(index / 5)
}));

const previewBoardRows = Array.from({ length: 5 }, (_, rowIndex) =>
  previewBoardCells.slice(rowIndex * 5, rowIndex * 5 + 5)
);

const previewTutorialTiles = [
  { col: 0, label: "10", row: 0 },
  { col: 1, label: "6", row: 0 },
  { col: 2, label: "5", row: 0 }
];

const quakeSpawnCounts: Record<EntryDifficulty, number> = {
  easy: 4,
  hard: 12,
  medium: 6
};

const quakeBoardDemoTiles = [
  ["A", "2", "3", "4", "K"],
  ["8", "10", "7", "Q", "9"],
  ["J", "5", "6", "A", "3"],
  ["4", "K", "8", "2", "Q"],
  ["7", "9", "J", "6", "5"]
].flatMap((row, rowIndex) =>
  row.map((rank, colIndex) => ({
    col: colIndex,
    height: ((rowIndex + colIndex) % 3) + 1,
    label: rank,
    rank,
    row: rowIndex
  }))
);

const quakeTutorialTiles = [
  { col: 1, height: 1, label: "10", rank: "10", row: 1 },
  { col: 1, height: 2, label: "5", rank: "5", row: 2 },
  { col: 2, height: 3, label: "6", rank: "6", row: 2 }
];

const quakeHoldingDemo = [
  { label: "10", rank: "10" },
  { label: "5", rank: "5" },
  { label: "6", rank: "6" }
];

function getQuakePreviewTileGradient(rank: string): [string, string, string] {
  const gradients: Record<string, [string, string, string]> = {
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

  return gradients[rank] ?? ["rgba(244, 250, 255, 0.96)", "rgba(142, 167, 193, 0.86)", "rgba(65, 86, 110, 0.96)"];
}

export function HomeScreen() {
  const { settings } = useGameSettings();
  const { currentProduct, logout, profile, status, token } = useHubSession();
  const [activeMenu, setActiveMenu] = useState<AppNavKey>("game");
  const [selectedMode, setSelectedMode] = useState<EntryMode>("classic");
  const [selectedDifficulty, setSelectedDifficulty] = useState<EntryDifficulty>("easy");
  const [showPayoutRules, setShowPayoutRules] = useState(false);
  const [dailyFreeGames, setDailyFreeGames] = useState<Record<EntryDifficulty, number>>({
    easy: 3,
    hard: 3,
    medium: 3
  });
  const [previewStep, setPreviewStep] = useState(0);
  const playerName =
    profile?.sUserName?.trim() ||
    (status === "authenticated" ? "Player" : "Local");
  const rawBalance = profile?.nChips ?? 10000;
  const selectedDifficultyOption =
    difficultyOptions.find((option) => option.key === selectedDifficulty) ??
    difficultyOptions[0];
  const selectedFreeGamesRemaining = dailyFreeGames[selectedDifficulty] ?? 0;
  const selectedPlayCostLabel =
    selectedFreeGamesRemaining > 0 ? `${selectedFreeGamesRemaining}/3` : "50 chips";
  const balanceCounter = useRef(new Animated.Value(0)).current;
  const [displayBalance, setDisplayBalance] = useState("0");
  const hasMounted = useRef(false);

  useEffect(() => {
    let active = true;

    async function hydrateStackemStatus() {
      if (status !== "authenticated" || !token) {
        return;
      }

      try {
        const response = await hubStackemApi.getDailyStatus(token);
        if (active) {
          setDailyFreeGames(response.body.data.freeGamesRemaining);
        }
      } catch {}
    }

    void hydrateStackemStatus();
    return () => {
      active = false;
    };
  }, [status, token]);

  useEffect(() => {
    const interval = setInterval(() => {
      const stepCount = Math.max(previewTutorialTiles.length, quakeTutorialTiles.length) + 3;
      setPreviewStep((current) => (current + 1) % stepCount);
    }, 620);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    // small delay ensures the component is fully visible before counting up
    const startTimer = setTimeout(() => {
      balanceCounter.setValue(0);
      const id = balanceCounter.addListener(({ value }) => {
        setDisplayBalance(formatChipCount(Math.round(value)));
      });
      Animated.timing(balanceCounter, {
        toValue: rawBalance,
        duration: 1600,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: false
      }).start(() => {
        balanceCounter.removeListener(id);
        setDisplayBalance(formatChipCount(rawBalance));
      });
      hasMounted.current = true;
    }, 300);
    return () => clearTimeout(startTimer);
  }, [balanceCounter, rawBalance]);

  function navigate(path: Href, tone: "confirm" | "tap" = "tap") {
    void fireHaptic(settings.haptics, tone);
    startTransition(() => {
      router.navigate(path);
    });
  }

  function playGame() {
    navigate(
      {
        pathname: stackemRoutes.game,
        params: {
          buyIn: "100",
          difficulty: selectedDifficulty,
          fresh: String(Date.now()),
          mode: selectedMode
        }
      },
      "confirm"
    );
  }

  function renderQuakePreview() {
    const selectedTiles = quakeTutorialTiles.filter((_, index) => previewStep > index);
    const quakeWaveActive = previewStep > quakeTutorialTiles.length;
    const holdingTotal = selectedTiles.reduce((total, tile) => total + Number(tile.label), 0);

    return (
      <View style={styles.quakePreview}>
        <View style={styles.quakePreviewHud}>
          <View>
            <Text style={styles.quakePreviewHudLabel}>Next Quake</Text>
            <Text style={styles.quakePreviewHudValue}>00:{quakeWaveActive ? "55" : "60"}</Text>
          </View>
          <View style={styles.quakePreviewSpawnBadge}>
            <Text style={styles.quakePreviewSpawnText}>
              {quakeSpawnCounts[selectedDifficulty]} tiles / wave
            </Text>
          </View>
        </View>

        <View style={[styles.boardPreview, styles.quakePreviewBoard]}>
          {previewBoardRows.map((row, rowIndex) => (
            <View key={`quake-preview-row-${rowIndex}`} style={styles.boardPreviewRow}>
              {row.map((cell) => {
                const selectedTileIndex = selectedTiles.findIndex(
                  (candidate) => candidate.row === cell.row && candidate.col === cell.col
                );
                const tile =
                  selectedTileIndex >= 0
                    ? null
                    : quakeBoardDemoTiles.find(
                        (candidate) => candidate.row === cell.row && candidate.col === cell.col
                      );

                return (
                  <View
                    key={`quake-preview-${cell.key}`}
                    style={[
                      styles.boardPreviewCell,
                      styles.quakePreviewCell,
                      quakeWaveActive && styles.quakePreviewCellWave,
                      tile && styles.quakePreviewCellStack
                    ]}
                  >
                    {tile ? (
                      <LinearGradient
                        colors={getQuakePreviewTileGradient(tile.rank)}
                        end={{ x: 1, y: 1 }}
                        start={{ x: 0, y: 0 }}
                        style={[
                          styles.quakePreviewTile,
                          {
                            transform: [{ translateY: -Math.min(tile.height * 3, 12) }]
                          }
                        ]}
                      >
                        {Array.from({ length: Math.max(0, tile.height - 1) }, (_, layer) => (
                          <LinearGradient
                            colors={getQuakePreviewTileGradient(tile.rank)}
                            end={{ x: 1, y: 1 }}
                            key={`quake-layer-${cell.key}-${layer}`}
                            start={{ x: 0, y: 0 }}
                            style={[
                              styles.quakePreviewTileLayer,
                              {
                                transform: [{ translateY: (layer + 1) * 4 }]
                              }
                            ]}
                          >
                            <Image
                              resizeMode="stretch"
                              source={QUAKE_TILE_IMAGE}
                              style={styles.quakePreviewTileImage}
                            />
                          </LinearGradient>
                        ))}
                        <Image
                          resizeMode="stretch"
                          source={QUAKE_TILE_IMAGE}
                          style={styles.quakePreviewTileImage}
                        />
                        <View pointerEvents="none" style={styles.quakePreviewTileSheen} />
                        <View pointerEvents="none" style={styles.quakePreviewTileGlow} />
                        <Text style={styles.quakePreviewTileText}>{tile.label}</Text>
                      </LinearGradient>
                    ) : null}
                  </View>
                );
              })}
            </View>
          ))}
        </View>

        <View style={styles.quakePreviewHolding}>
          <Text style={styles.quakePreviewHoldingTitle}>Holding Zone</Text>
          <View style={styles.quakePreviewHoldingSlots}>
            {Array.from({ length: 5 }, (_, index) => {
              const tile = previewStep > index ? quakeHoldingDemo[index] : null;

              return (
                <View key={`quake-hold-${index}`} style={styles.quakePreviewHoldSlot}>
                  {tile ? (
                    <LinearGradient
                      colors={getQuakePreviewTileGradient(tile.rank)}
                      end={{ x: 1, y: 1 }}
                      start={{ x: 0, y: 0 }}
                      style={styles.quakePreviewHoldTile}
                    >
                      <Image
                        resizeMode="stretch"
                        source={QUAKE_TILE_IMAGE}
                        style={styles.quakePreviewTileImage}
                      />
                      <View pointerEvents="none" style={styles.quakePreviewTileSheen} />
                      <View pointerEvents="none" style={styles.quakePreviewTileGlow} />
                      <Text style={styles.quakePreviewTileText}>{tile.label}</Text>
                    </LinearGradient>
                  ) : null}
                </View>
              );
            })}
          </View>
          <Text style={styles.quakePreviewHoldingTotal}>
            Total {holdingTotal || 0}{holdingTotal === 21 ? " - Clear!" : ""}
          </Text>
          <Text style={styles.quakePreviewCaption}>
            Demo: select 10, 5, and 6 from the filled Quake board to make exactly 21.
          </Text>
        </View>
      </View>
    );
  }

  function renderGamePanel() {
    const visiblePreviewTiles = previewTutorialTiles.filter(
      (_, index) => previewStep > index
    );
    const previewColumnTotals = Array.from({ length: 5 }, (_, col) =>
      visiblePreviewTiles
        .filter((tile) => tile.col === col)
        .reduce((sum, tile) => sum + Number(tile.label), 0)
    );
    const previewRowTotals = Array.from({ length: 5 }, (_, row) =>
      visiblePreviewTiles
        .filter((tile) => tile.row === row)
        .reduce((sum, tile) => sum + Number(tile.label), 0)
    );

    return (
      <>
        <View style={styles.difficultyPillRow}>
          {(["classic", "quake"] as EntryMode[]).map((mode) => {
            const selected = selectedMode === mode;

            return (
              <Pressable
                key={mode}
                onPress={() => {
                  void fireHaptic(settings.haptics, "tap");
                  setSelectedMode(mode);
                }}
                style={({ pressed }) => [
                  styles.difficultyPill,
                  selected && styles.difficultyPillSelected,
                  pressed && styles.cardPressed
                ]}
              >
                <Text
                  style={[
                    styles.difficultyPillText,
                    selected && styles.difficultyPillTextSelected
                  ]}
                >
                  {mode === "classic" ? "Classic" : "Quake"}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <View style={styles.difficultyPillRow}>
          {difficultyOptions.map((option) => {
            const selected = selectedDifficulty === option.key;

            return (
              <Pressable
                key={option.key}
                onPress={() => {
                  void fireHaptic(settings.haptics, "tap");
                  setSelectedDifficulty(option.key);
                  setShowPayoutRules(false);
                }}
                style={({ pressed }) => [
                  styles.difficultyPill,
                  selected && styles.difficultyPillSelected,
                  pressed && styles.cardPressed
                ]}
              >
                <Text
                  style={[
                    styles.difficultyPillText,
                    selected && styles.difficultyPillTextSelected
                  ]}
                >
                  {option.label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <View style={styles.boardPreviewShell}>
          <View style={styles.boardPreviewMetaRow}>
            <Text style={styles.boardPreviewTitle}>
              {selectedMode === "quake" ? "Quake Preview" : "Preview Board"}
            </Text>
            <View style={styles.boardPreviewMetaActions}>
              <Text style={styles.boardPreviewMeta}>
                {selectedMode === "quake"
                  ? `${quakeSpawnCounts[selectedDifficulty]} tiles per quake`
                  : `${selectedDifficultyOption.openingTiles} filled tiles`}
              </Text>
              <Pressable
                accessibilityLabel="Open 21 Stack'em tutorial"
                onPress={() => setShowPayoutRules(true)}
                style={({ pressed }) => [
                  styles.infoButton,
                  showPayoutRules && styles.infoButtonActive,
                  pressed && styles.infoButtonPressed
                ]}
              >
                <MaterialCommunityIcons
                  color={showPayoutRules ? "#f8fbff" : "#d7ecfb"}
                  name="information-variant"
                  size={15}
                />
              </Pressable>
            </View>
          </View>
          {selectedMode === "quake" ? renderQuakePreview() : (
          <View style={styles.boardPreviewWithTotals}>
            <View style={styles.boardPreviewTopTotals}>
              {previewColumnTotals.map((total, index) => (
                <View
                  key={`preview-col-total-${index}`}
                  style={[
                    styles.previewTotalPill,
                    total === PREVIEW_TARGET_TOTAL && styles.previewTotalPillComplete
                  ]}
                >
                  <Text
                    style={[
                      styles.previewTotalText,
                      total === PREVIEW_TARGET_TOTAL && styles.previewTotalTextComplete
                    ]}
                  >
                    {total || "-"}
                  </Text>
                </View>
              ))}
            </View>

            <View style={styles.boardPreviewBodyRow}>
              <View style={styles.boardPreviewSideTotals}>
                {previewRowTotals.map((total, index) => (
                  <View
                    key={`preview-row-total-${index}`}
                    style={[
                      styles.previewTotalPill,
                      total === PREVIEW_TARGET_TOTAL && styles.previewTotalPillComplete
                    ]}
                  >
                    <Text
                      style={[
                        styles.previewTotalText,
                        total === PREVIEW_TARGET_TOTAL && styles.previewTotalTextComplete
                      ]}
                    >
                      {total || "-"}
                    </Text>
                  </View>
                ))}
              </View>

              <View style={styles.boardPreview}>
                {previewBoardRows.map((row, rowIndex) => (
                  <View key={`preview-row-${rowIndex}`} style={styles.boardPreviewRow}>
                    {row.map((cell) => {
                      const seedIndex = previewSeedCells
                        .slice(0, selectedDifficultyOption.openingTiles)
                        .findIndex(
                          (seedCell) =>
                            seedCell.row === cell.row && seedCell.col === cell.col
                        );
                      const seeded = seedIndex >= 0;
                      const tutorialIndex = previewTutorialTiles.findIndex(
                        (tile) => tile.row === cell.row && tile.col === cell.col
                      );
                      const tutorialTile =
                        tutorialIndex >= 0 && previewStep > tutorialIndex
                          ? previewTutorialTiles[tutorialIndex]
                          : null;
                      const tutorialComplete =
                        tutorialTile && previewStep > previewTutorialTiles.length;

                      return (
                        <View
                          key={cell.key}
                          style={[
                            styles.boardPreviewCell,
                            seeded && styles.boardPreviewSeedCell,
                            tutorialTile && styles.boardPreviewTutorialCell,
                            tutorialComplete && styles.boardPreviewTutorialCellComplete
                          ]}
                        >
                          {tutorialTile ? (
                            <Text
                              style={[
                                styles.boardPreviewTutorialText,
                                tutorialComplete && styles.boardPreviewTutorialTextComplete
                              ]}
                            >
                              {tutorialTile.label}
                            </Text>
                          ) : seeded ? (
                            <Text style={styles.boardPreviewSeedText}>?</Text>
                          ) : null}
                        </View>
                      );
                    })}
                  </View>
                ))}
              </View>
            </View>
          </View>
          )}
        </View>

        <Pressable
          onPress={playGame}
          style={({ pressed }) => [
            styles.playButton,
            pressed && styles.playButtonPressed
          ]}
        >
          <LinearGradient
            colors={["#effbff", "#6fa8d8", "#2d6080"]}
            end={{ x: 1, y: 1 }}
            start={{ x: 0, y: 0 }}
            style={styles.playButtonSurface}
          >
            <MaterialCommunityIcons color="#ffffff" name="play" size={26} />
            <Text style={styles.playButtonText}>PLAY GAME</Text>
            <View style={styles.playCostBadge}>
              <Text style={styles.playCostBadgeText}>{selectedPlayCostLabel}</Text>
            </View>
          </LinearGradient>
        </Pressable>
      </>
    );
  }

  function renderTutorialModal() {
    if (selectedMode === "quake") {
      return (
        <Modal
          animationType="fade"
          onRequestClose={() => setShowPayoutRules(false)}
          transparent
          visible={showPayoutRules}
        >
          <View style={styles.tutorialOverlay}>
            <View style={[styles.tutorialModal, styles.quakeTutorialModal]}>
              <LinearGradient
                colors={["#20100b", "#070709"]}
                end={{ x: 1, y: 1 }}
                start={{ x: 0, y: 0 }}
                style={styles.tutorialHeader}
              >
                <View style={styles.tutorialHeaderCopy}>
                  <Text style={styles.tutorialKicker}>How To Play</Text>
                  <Text style={styles.tutorialTitle}>Stack'em: Quake</Text>
                  <Text style={styles.tutorialLead}>
                    Survive a rising board. Select only top tiles, make exactly 21 in the
                    holding zone, and use manual quake when the board stalls.
                  </Text>
                </View>
                <Pressable
                  accessibilityLabel="Close tutorial"
                  onPress={() => setShowPayoutRules(false)}
                  style={({ pressed }) => [
                    styles.tutorialClose,
                    pressed && styles.tutorialClosePressed
                  ]}
                >
                  <MaterialCommunityIcons color="#f7fbff" name="close" size={22} />
                </Pressable>
              </LinearGradient>

              <ScrollView
                contentContainerStyle={styles.tutorialScroll}
                showsVerticalScrollIndicator={false}
              >
                <View style={styles.tutorialDemo}>{renderQuakePreview()}</View>

                <View style={styles.tutorialStepGrid}>
                  <TutorialStep
                    icon="numeric-1-circle"
                    title="Pick Top Tiles"
                    body="Each cell is a stack. Only the top visible tile can be selected."
                  />
                  <TutorialStep
                    icon="numeric-2-circle"
                    title="Fill Holding Slots"
                    body="Selected tiles move into 5 holding slots. Aces count as 1 or 11."
                  />
                  <TutorialStep
                    icon="numeric-3-circle"
                    title="Make Exactly 21"
                    body="A 21 clears the holding zone and awards 50 points per tile used."
                  />
                  <TutorialStep
                    icon="numeric-4-circle"
                    title="Survive Quakes"
                    body={`Easy spawns 4 tiles, Medium 6, Hard 12. A stack reaching 10 ends the run.`}
                  />
                </View>

                <View style={styles.tutorialPayoutTable}>
                  {difficultyOptions.map((option) => (
                    <View
                      key={`quake-tutorial-payout-${option.key}`}
                      style={[
                        styles.tutorialPayoutRow,
                        selectedDifficulty === option.key && styles.tutorialPayoutRowActive
                      ]}
                    >
                      <Text style={styles.tutorialPayoutDifficulty}>{option.label}</Text>
                      <Text style={styles.tutorialPayoutValue}>
                        {quakeSpawnCounts[option.key]} tiles
                      </Text>
                      <Text style={styles.tutorialPayoutMeta}>per quake wave</Text>
                    </View>
                  ))}
                </View>
              </ScrollView>
            </View>
          </View>
        </Modal>
      );
    }

    const visiblePreviewTiles = previewTutorialTiles.filter(
      (_, index) => previewStep > index
    );
    const previewColumnTotals = Array.from({ length: 5 }, (_, col) =>
      visiblePreviewTiles
        .filter((tile) => tile.col === col)
        .reduce((sum, tile) => sum + Number(tile.label), 0)
    );
    const previewRowTotals = Array.from({ length: 5 }, (_, row) =>
      visiblePreviewTiles
        .filter((tile) => tile.row === row)
        .reduce((sum, tile) => sum + Number(tile.label), 0)
    );

    return (
      <Modal
        animationType="fade"
        onRequestClose={() => setShowPayoutRules(false)}
        transparent
        visible={showPayoutRules}
      >
        <View style={styles.tutorialOverlay}>
          <View style={styles.tutorialModal}>
            <LinearGradient
              colors={["#123049", "#061421"]}
              end={{ x: 1, y: 1 }}
              start={{ x: 0, y: 0 }}
              style={styles.tutorialHeader}
            >
              <View style={styles.tutorialHeaderCopy}>
                <Text style={styles.tutorialKicker}>How To Play</Text>
                <Text style={styles.tutorialTitle}>21 Stack'em</Text>
                <Text style={styles.tutorialLead}>
                  Stack numbered tiles onto the grid and build blackjack-style rows and
                  columns. Every line that lands exactly on 21 locks in and pays.
                </Text>
              </View>
              <Pressable
                accessibilityLabel="Close tutorial"
                onPress={() => setShowPayoutRules(false)}
                style={({ pressed }) => [
                  styles.tutorialClose,
                  pressed && styles.tutorialClosePressed
                ]}
              >
                <MaterialCommunityIcons color="#f7fbff" name="close" size={22} />
              </Pressable>
            </LinearGradient>

            <ScrollView
              contentContainerStyle={styles.tutorialScroll}
              showsVerticalScrollIndicator={false}
            >
              <View style={styles.tutorialDemo}>
                <View style={styles.tutorialTopTotals}>
                  {previewColumnTotals.map((total, index) => (
                    <View
                      key={`tutorial-col-${index}`}
                      style={[
                        styles.previewTotalPill,
                        total === PREVIEW_TARGET_TOTAL && styles.previewTotalPillComplete
                      ]}
                    >
                      <Text
                        style={[
                          styles.previewTotalText,
                          total === PREVIEW_TARGET_TOTAL && styles.previewTotalTextComplete
                        ]}
                      >
                        {total || "-"}
                      </Text>
                    </View>
                  ))}
                </View>
                <View style={styles.tutorialBoardRow}>
                  <View style={styles.tutorialSideTotals}>
                    {previewRowTotals.map((total, index) => (
                      <View
                        key={`tutorial-row-${index}`}
                        style={[
                          styles.previewTotalPill,
                          total === PREVIEW_TARGET_TOTAL && styles.previewTotalPillComplete
                        ]}
                      >
                        <Text
                          style={[
                            styles.previewTotalText,
                            total === PREVIEW_TARGET_TOTAL && styles.previewTotalTextComplete
                          ]}
                        >
                          {total || "-"}
                        </Text>
                      </View>
                    ))}
                  </View>
                  <View style={styles.tutorialBoard}>
                    {previewBoardRows.map((row, rowIndex) => (
                      <View key={`tutorial-board-row-${rowIndex}`} style={styles.boardPreviewRow}>
                        {row.map((cell) => {
                          const tutorialIndex = previewTutorialTiles.findIndex(
                            (tile) => tile.row === cell.row && tile.col === cell.col
                          );
                          const tutorialTile =
                            tutorialIndex >= 0 && previewStep > tutorialIndex
                              ? previewTutorialTiles[tutorialIndex]
                              : null;
                          const tutorialComplete =
                            tutorialTile && previewStep > previewTutorialTiles.length;

                          return (
                            <View
                              key={`tutorial-${cell.key}`}
                              style={[
                                styles.boardPreviewCell,
                                tutorialTile && styles.boardPreviewTutorialCell,
                                tutorialComplete && styles.boardPreviewTutorialCellComplete
                              ]}
                            >
                              {tutorialTile ? (
                                <Text
                                  style={[
                                    styles.boardPreviewTutorialText,
                                    tutorialComplete && styles.boardPreviewTutorialTextComplete
                                  ]}
                                >
                                  {tutorialTile.label}
                                </Text>
                              ) : null}
                            </View>
                          );
                        })}
                      </View>
                    ))}
                  </View>
                </View>
                <Text style={styles.tutorialDemoCaption}>
                  Guided demo: 10 + 6 + 5 makes 21 across the top row.
                </Text>
              </View>

              <View style={styles.tutorialStepGrid}>
                <TutorialStep
                  icon="numeric-1-circle"
                  title="Place The Waiting Tile"
                  body="Use the first waiting tile. Drop or tap it into any open cell that is not locked."
                />
                <TutorialStep
                  icon="numeric-2-circle"
                  title="Watch Row And Column Totals"
                  body="Totals update across the top and down the left. A line over 21 busts and ends the run."
                />
                <TutorialStep
                  icon="numeric-3-circle"
                  title="Hit Exactly 21"
                  body="A row or column that totals 21 locks, turns green, and adds the difficulty reward."
                />
                <TutorialStep
                  icon="numeric-4-circle"
                  title="Bank The Run"
                  body="Keep building lines, or end the game to save the run and leaderboard score."
                />
              </View>

              <View style={styles.tutorialInfoBand}>
                <Text style={styles.tutorialBandTitle}>Why It Exists</Text>
                <Text style={styles.tutorialBandText}>
                  21 Stack'em is a fast blackjack puzzle built for Big Slick players:
                  casino math, grid pressure, and short sessions that reward clean
                  decisions. Easy starts empty, Medium starts with 3 filled tiles, and
                  Hard starts with 6.
                </Text>
              </View>

              <View style={styles.tutorialPayoutTable}>
                {difficultyOptions.map((option) => (
                  <View
                    key={`tutorial-payout-${option.key}`}
                    style={[
                      styles.tutorialPayoutRow,
                      selectedDifficulty === option.key && styles.tutorialPayoutRowActive
                    ]}
                  >
                    <Text style={styles.tutorialPayoutDifficulty}>{option.label}</Text>
                    <Text style={styles.tutorialPayoutValue}>{option.rewardRange}</Text>
                    <Text style={styles.tutorialPayoutMeta}>
                      {option.openingTiles} filled tiles
                    </Text>
                  </View>
                ))}
              </View>

              <View style={styles.tutorialInfoBand}>
                <Text style={styles.tutorialBandTitle}>Attempts And Cost</Text>
                <Text style={styles.tutorialBandText}>
                  You get 3 free attempts per difficulty each day. After those are used,
                  each Stack'em game costs 50 chips. The Play button shows the remaining
                  free attempts or the chip cost before you start.
                </Text>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    );
  }

  function renderStorePanel() {
    return (
      <>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>STORE</Text>
          <Text style={styles.sectionMeta}>
            {status === "authenticated"
              ? "Chip balance, shop, and wallet activity"
              : "Local play has 10,000 chips. Sign in to sync purchases."}
          </Text>
        </View>

        <View style={styles.profilePreview}>
          <LinearGradient colors={["#183b59", "#071827"]} style={styles.profileAvatar}>
            <Text style={styles.profileAvatarText}>
              {playerName.slice(0, 1).toUpperCase()}
            </Text>
          </LinearGradient>
          <View style={styles.profilePreviewCopy}>
            <Text numberOfLines={1} style={styles.profilePreviewName}>
              {playerName}
            </Text>
            <Text numberOfLines={1} style={styles.profilePreviewMeta}>
              {status === "authenticated" ? profile?.sEmail ?? "Store account loaded" : "Local store preview"}
            </Text>
          </View>
        </View>

        <View style={styles.menuStatGrid}>
          <MenuStat label="Chips" value={formatChipCount(profile?.nChips ?? 10000)} />
          <MenuStat label="Session" value={status.toUpperCase()} />
          <MenuStat label="Daily" value={selectedPlayCostLabel} />
          <MenuStat label="Store" value={status === "authenticated" ? "LIVE" : "LOCAL"} />
        </View>

        {status === "authenticated" ? (
          <View style={styles.menuActionRow}>
            <MenuButton
              icon="storefront"
              label="Open Store"
              onPress={() => navigate(stackemRoutes.store)}
              primary
            />
            <MenuButton
              icon="logout"
              label="Sign Out"
              onPress={() => {
                void logout();
              }}
            />
          </View>
        ) : (
          <View style={styles.menuActionRow}>
            <MenuButton
              icon="storefront"
              label="Open Store"
              onPress={() => navigate(stackemRoutes.store)}
              primary
            />
            <MenuButton
              icon="login"
              label="Sign In"
              onPress={() =>
                navigate({ pathname: stackemRoutes.auth, params: { mode: "login" } } as Href)
              }
            />
          </View>
        )}
      </>
    );
  }

  function renderSimplePanel(
    title: string,
    subtitle: string,
    icon: keyof typeof MaterialCommunityIcons.glyphMap,
    actionLabel: string,
    actionPath: Href
  ) {
    return (
      <>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>{title}</Text>
          <Text style={styles.sectionMeta}>{subtitle}</Text>
        </View>
        <View style={styles.simpleMenuHero}>
          <View style={styles.simpleMenuIcon}>
            <MaterialCommunityIcons color="#f7fbff" name={icon} size={34} />
          </View>
          <View style={styles.simpleMenuCopy}>
            <Text style={styles.simpleMenuTitle}>{title}</Text>
            <Text style={styles.simpleMenuText}>
              {status === "authenticated"
                ? `${currentProduct.title} is connected to ${playerName}.`
                : "Local play is available. Sign in to sync hub features."}
            </Text>
          </View>
        </View>
        <MenuButton
          icon={icon}
          label={actionLabel}
          onPress={() => navigate(actionPath)}
          primary
        />
      </>
    );
  }

  function renderActivePanel() {
    if (activeMenu === "store") {
      return renderStorePanel();
    }

    if (activeMenu === "daily") {
      return renderSimplePanel(
        "REWARDS",
        "Daily rewards and claim status",
        "gift",
        "Open Rewards",
        stackemRoutes.rewards
      );
    }

    if (activeMenu === "leaderboards") {
      return renderSimplePanel(
        "LEADERS",
        "Scores and saved runs",
        "trophy",
        "Open Leaders",
        stackemRoutes.leaderboard
      );
    }

    if (activeMenu === "settings") {
      return renderSimplePanel(
        "SETTINGS",
        "Rules, audio, controls, and preferences",
        "cog",
        "Open Settings",
        stackemRoutes.settings
      );
    }

    return renderGamePanel();
  }

  return (
    <ScreenContainer contentContainerStyle={styles.content} scroll>
      <View style={styles.shell}>
        <LinearGradient
          colors={["rgba(18, 48, 73, 0.96)", "rgba(4, 14, 25, 0.99)", "rgba(2, 9, 17, 1)"]}
          end={{ x: 1, y: 1 }}
          start={{ x: 0, y: 0 }}
          style={styles.lobbyFrame}
        >
          <View style={styles.innerFrame}>
            <View style={styles.topBar}>
              <View style={styles.logoPlate}>
                <StackemLogo />
              </View>
              <View style={styles.accountPill}>
                <LinearGradient colors={["#183b59", "#071827"]} style={styles.avatar}>
                  <Text style={styles.avatarText}>{playerName.slice(0, 1).toUpperCase()}</Text>
                </LinearGradient>
                <View style={styles.accountCopy}>
                  <Text numberOfLines={1} style={styles.brandName}>BIGSLICKGAMES</Text>
                  <Text numberOfLines={1} style={styles.balance}>{displayBalance}</Text>
                </View>
              </View>
            </View>

            <AppNav
              activeKey={activeMenu}
              onSelect={(key) => {
                setActiveMenu(key);
                return true;
              }}
            />

            <View style={styles.menuPanel}>
              {renderActivePanel()}
            </View>
          </View>
        </LinearGradient>
      </View>
      {renderTutorialModal()}
    </ScreenContainer>
  );
}

function TutorialStep({
  body,
  icon,
  title
}: {
  body: string;
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  title: string;
}) {
  return (
    <View style={styles.tutorialStep}>
      <View style={styles.tutorialStepIcon}>
        <MaterialCommunityIcons color="#f8fbff" name={icon} size={22} />
      </View>
      <Text style={styles.tutorialStepTitle}>{title}</Text>
      <Text style={styles.tutorialStepBody}>{body}</Text>
    </View>
  );
}

function MenuStat({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.menuStat}>
      <Text style={styles.menuStatLabel}>{label}</Text>
      <Text numberOfLines={1} style={styles.menuStatValue}>{value}</Text>
    </View>
  );
}

function MenuButton({
  icon,
  label,
  onPress,
  primary = false
}: {
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  label: string;
  onPress: () => void;
  primary?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.menuButton,
        primary && styles.menuButtonPrimary,
        pressed && styles.cardPressed
      ]}
    >
      <MaterialCommunityIcons
        color="#f7fbff"
        name={icon}
        size={20}
      />
      <Text style={[styles.menuButtonText, primary && styles.menuButtonTextPrimary]}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  accountCopy: { flex: 1, minWidth: 0 },
  accountPill: {
    alignItems: "center",
    backgroundColor: "rgba(20, 34, 48, 0.96)",
    borderColor: "rgba(133, 169, 195, 0.54)",
    borderRadius: 42,
    borderWidth: 2,
    flex: 1,
    flexDirection: "row",
    gap: 8,
    minHeight: 62,
    paddingHorizontal: 10,
    paddingVertical: 6,
    shadowColor: "#000000",
    shadowOffset: { height: 8, width: 0 },
    shadowOpacity: 0.28,
    shadowRadius: 12
  },
  anteBlock: { gap: 10 },
  antePill: {
    alignItems: "center",
    backgroundColor: "rgba(20, 34, 48, 0.92)",
    borderColor: "rgba(133, 169, 195, 0.5)",
    borderRadius: 999,
    borderWidth: 2,
    flex: 1,
    minHeight: 54,
    justifyContent: "center"
  },
  antePillSelected: {
    backgroundColor: "#6fa8d8",
    borderColor: "#d7ecfb"
  },
  anteRow: { flexDirection: "row", gap: 10 },
  anteText: {
    color: "#f7fbff",
    fontFamily: theme.fonts.display,
    fontSize: 22,
    lineHeight: 24
  },
  anteTextSelected: { color: "#f8fbff" },
  anteTitle: {
    color: "#b8cee0",
    fontFamily: theme.fonts.label,
    fontSize: 13,
    letterSpacing: 1.4
  },
  avatar: {
    alignItems: "center",
    borderColor: "#d7ecfb",
    borderRadius: 999,
    borderWidth: 2,
    height: 46,
    justifyContent: "center",
    width: 46
  },
  avatarText: {
    color: "#ffffff",
    fontFamily: theme.fonts.display,
    fontSize: 26,
    lineHeight: 26
  },
  balance: {
    color: "#d7ecfb",
    fontFamily: theme.fonts.display,
    fontSize: 28,
    lineHeight: 30
  },
  brandName: {
    color: "#b8cee0",
    fontFamily: theme.fonts.bodyBold,
    fontSize: 14,
    letterSpacing: 1.4
  },
  cardPressed: { opacity: 0.86 },
  content: {
    alignItems: "center",
    paddingBottom: 18,
    paddingHorizontal: 10,
    paddingTop: 8
  },
  boardPreview: {
    aspectRatio: 1,
    backgroundColor: "rgba(16, 29, 43, 0.94)",
    borderColor: "rgba(133, 169, 195, 0.36)",
    borderRadius: 18,
    borderWidth: 2,
    flex: 1,
    gap: 5,
    padding: 8,
    width: "100%"
  },
  boardPreviewBodyRow: {
    alignItems: "stretch",
    flexDirection: "row",
    gap: 7
  },
  boardPreviewCell: {
    alignItems: "center",
    backgroundColor: "rgba(25, 42, 58, 0.86)",
    borderColor: "rgba(103, 137, 163, 0.54)",
    borderRadius: 9,
    borderWidth: 1,
    flex: 1,
    justifyContent: "center",
    minHeight: 0
  },
  boardPreviewMeta: {
    color: "#d7ecfb",
    fontFamily: theme.fonts.label,
    fontSize: 12,
    letterSpacing: 1,
    textTransform: "uppercase"
  },
  boardPreviewMetaRow: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between"
  },
  boardPreviewMetaActions: {
    alignItems: "center",
    flexDirection: "row",
    gap: 8
  },
  boardPreviewSeedCell: {
    backgroundColor: "#6fa8d8",
    borderBottomColor: "#2d6080",
    borderBottomWidth: 4,
    borderColor: "#d7ecfb"
  },
  boardPreviewSeedText: {
    color: "#ffffff",
    fontFamily: theme.fonts.display,
    fontSize: 24,
    lineHeight: 24
  },
  boardPreviewTutorialCell: {
    backgroundColor: "#83bedc",
    borderBottomColor: "#2d6080",
    borderBottomWidth: 4,
    borderColor: "#d7ecfb"
  },
  boardPreviewTutorialCellComplete: {
    backgroundColor: "#22c55e",
    borderBottomColor: "#15803d",
    borderColor: "#86efac"
  },
  boardPreviewTutorialText: {
    color: "#ffffff",
    fontFamily: theme.fonts.display,
    fontSize: 22,
    lineHeight: 24
  },
  boardPreviewTutorialTextComplete: {
    color: "#ffffff"
  },
  boardPreviewRow: {
    flex: 1,
    flexDirection: "row",
    gap: 5
  },
  boardPreviewSideTotals: {
    gap: 5,
    justifyContent: "space-between",
    width: 34
  },
  boardPreviewShell: {
    backgroundColor: "rgba(20, 34, 48, 0.82)",
    borderColor: "rgba(133, 169, 195, 0.34)",
    borderRadius: 22,
    borderWidth: 1.5,
    gap: 10,
    padding: 12
  },
  boardPreviewTitle: {
    color: theme.colors.text,
    fontFamily: theme.fonts.bodyBold,
    fontSize: 14
  },
  boardPreviewTopTotals: {
    flexDirection: "row",
    gap: 5,
    paddingLeft: 49,
    paddingRight: 8
  },
  boardPreviewWithTotals: {
    alignSelf: "center",
    gap: 6,
    maxWidth: 306,
    width: "100%"
  },
  difficultyPill: {
    alignItems: "center",
    backgroundColor: "rgba(20, 34, 48, 0.88)",
    borderColor: "rgba(133, 169, 195, 0.52)",
    borderRadius: 999,
    borderWidth: 1.5,
    flex: 1,
    justifyContent: "center",
    minHeight: 44,
    minWidth: 0,
    paddingHorizontal: 10
  },
  difficultyPillRow: {
    flexDirection: "row",
    gap: 8
  },
  difficultyPillSelected: {
    backgroundColor: "#6fa8d8",
    borderColor: "#d7ecfb"
  },
  difficultyPillText: {
    color: "#f7fbff",
    fontFamily: theme.fonts.label,
    fontSize: 13,
    letterSpacing: 1,
    textTransform: "uppercase"
  },
  difficultyPillTextSelected: {
    color: "#ffffff"
  },
  infoButton: {
    alignItems: "center",
    backgroundColor: "rgba(111, 168, 216, 0.14)",
    borderColor: "rgba(142, 179, 206, 0.42)",
    borderRadius: 999,
    borderWidth: 1,
    height: 24,
    justifyContent: "center",
    width: 24
  },
  infoButtonActive: {
    backgroundColor: "#6fa8d8",
    borderColor: "#d7ecfb"
  },
  infoButtonPressed: {
    opacity: 0.78
  },
  authActions: {
    flexDirection: "row",
    gap: 8
  },
  authButton: {
    alignItems: "center",
    backgroundColor: "#416c91",
    borderColor: "#d7ecfb",
    borderRadius: 18,
    borderWidth: 1.5,
    flex: 1,
    flexDirection: "row",
    gap: 6,
    justifyContent: "center",
    minHeight: 48,
    paddingHorizontal: 8
  },
  authButtonSecondary: {
    alignItems: "center",
    backgroundColor: "rgba(20, 34, 48, 0.88)",
    borderColor: "rgba(133, 169, 195, 0.52)",
    borderRadius: 18,
    borderWidth: 1.5,
    flex: 1,
    flexDirection: "row",
    gap: 6,
    justifyContent: "center",
    minHeight: 48,
    paddingHorizontal: 8
  },
  authButtonText: {
    color: "#ffffff",
    fontFamily: theme.fonts.label,
    fontSize: 12,
    letterSpacing: 1
  },
  ecosystemAction: {
    alignItems: "center",
    backgroundColor: "rgba(20, 34, 48, 0.88)",
    borderColor: "rgba(133, 169, 195, 0.4)",
    borderRadius: 18,
    borderWidth: 1.5,
    flexBasis: "48%",
    flexDirection: "row",
    flexGrow: 1,
    gap: 10,
    minHeight: 64,
    minWidth: 134,
    paddingHorizontal: 10,
    paddingVertical: 10
  },
  ecosystemCopy: {
    flex: 1,
    minWidth: 0
  },
  ecosystemGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8
  },
  ecosystemIcon: {
    alignItems: "center",
    backgroundColor: "rgba(95, 167, 231, 0.2)",
    borderColor: "rgba(158, 223, 255, 0.42)",
    borderRadius: 14,
    borderWidth: 1,
    height: 38,
    justifyContent: "center",
    width: 38
  },
  ecosystemLabel: {
    color: "#f7fbff",
    fontFamily: theme.fonts.bodyBold,
    fontSize: 14
  },
  ecosystemMeta: {
    color: theme.colors.subtleText,
    fontFamily: theme.fonts.body,
    fontSize: 11,
    lineHeight: 15
  },
  ecosystemPanel: {
    backgroundColor: "rgba(20, 34, 48, 0.82)",
    borderColor: "rgba(133, 169, 195, 0.42)",
    borderRadius: 26,
    borderWidth: 2,
    gap: 12,
    paddingHorizontal: 14,
    paddingVertical: 14
  },
  innerFrame: {
    backgroundColor: "rgba(2, 9, 17, 0.42)",
    borderColor: "rgba(182, 225, 255, 0.08)",
    borderRadius: 30,
    borderWidth: 1,
    gap: 16,
    padding: 10
  },
  lobbyFrame: {
    borderColor: "rgba(133, 169, 195, 0.56)",
    borderRadius: 36,
    borderWidth: 2,
    elevation: 10,
    overflow: "hidden",
    padding: 8,
    shadowColor: "#6fa8d8",
    shadowOffset: { height: 16, width: 0 },
    shadowOpacity: 0.22,
    shadowRadius: 26
  },
  logo: { height: 58, width: 118 },
  logoPlate: { alignItems: "center", justifyContent: "center", minWidth: 124 },
  menuActionRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10
  },
  menuButton: {
    alignItems: "center",
    backgroundColor: "rgba(20, 34, 48, 0.88)",
    borderColor: "rgba(133, 169, 195, 0.52)",
    borderRadius: 18,
    borderWidth: 1.5,
    flex: 1,
    flexDirection: "row",
    gap: 8,
    justifyContent: "center",
    minHeight: 52,
    minWidth: 132,
    paddingHorizontal: 12
  },
  menuButtonPrimary: {
    backgroundColor: "#6fa8d8",
    borderColor: "#d7ecfb"
  },
  menuButtonText: {
    color: "#f7fbff",
    fontFamily: theme.fonts.label,
    fontSize: 13,
    letterSpacing: 1,
    textTransform: "uppercase"
  },
  menuButtonTextPrimary: {
    color: "#ffffff"
  },
  menuPanel: {
    backgroundColor: "rgba(20, 34, 48, 0.88)",
    borderColor: "rgba(133, 169, 195, 0.38)",
    borderRadius: 34,
    borderWidth: 2,
    elevation: 7,
    gap: 18,
    minHeight: 360,
    paddingHorizontal: 18,
    paddingVertical: 20,
    shadowColor: "#6fa8d8",
    shadowOffset: { height: 12, width: 0 },
    shadowOpacity: 0.2,
    shadowRadius: 22
  },
  menuStat: {
    backgroundColor: "rgba(16, 29, 43, 0.74)",
    borderColor: "rgba(133, 169, 195, 0.34)",
    borderRadius: 16,
    borderWidth: 1,
    flex: 1,
    gap: 4,
    minWidth: 120,
    paddingHorizontal: 12,
    paddingVertical: 10
  },
  menuStatGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10
  },
  menuStatLabel: {
    color: theme.colors.subtleText,
    fontFamily: theme.fonts.label,
    fontSize: 10,
    letterSpacing: 1,
    textTransform: "uppercase"
  },
  menuStatValue: {
    color: theme.colors.text,
    fontFamily: theme.fonts.bodyBold,
    fontSize: 14
  },
  logoutLink: {
    alignItems: "center",
    alignSelf: "flex-start",
    flexDirection: "row",
    gap: 6,
    paddingHorizontal: 4,
    paddingVertical: 2
  },
  logoutText: {
    color: theme.colors.subtleText,
    fontFamily: theme.fonts.bodyBold,
    fontSize: 12
  },
  
  playButton: {
    borderRadius: 999,
    elevation: 5,
    overflow: "hidden",
    shadowColor: "#6fa8d8",
    shadowOffset: { height: 10, width: 0 },
    shadowOpacity: 0.28,
    shadowRadius: 18
  },
  playButtonPressed: { opacity: 0.86 },
  playButtonSurface: {
    alignItems: "center",
    flexDirection: "row",
    gap: 8,
    justifyContent: "center",
    minHeight: 64
  },
  playCostBadge: {
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.18)",
    borderColor: "rgba(255, 255, 255, 0.35)",
    borderRadius: 999,
    borderWidth: 1,
    justifyContent: "center",
    minHeight: 28,
    minWidth: 46,
    paddingHorizontal: 10
  },
  playCostBadgeText: {
    color: "#ffffff",
    fontFamily: theme.fonts.label,
    fontSize: 11,
    letterSpacing: 0,
    textTransform: "uppercase"
  },
  playButtonText: {
    color: "#ffffff",
    fontFamily: theme.fonts.display,
    fontSize: 26,
    letterSpacing: 1,
    lineHeight: 28
  },
  payoutRulesCard: {
    backgroundColor: "rgba(111, 168, 216, 0.1)",
    borderColor: "rgba(142, 179, 206, 0.26)",
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10
  },
  payoutRulesText: {
    color: theme.colors.text,
    fontFamily: theme.fonts.body,
    fontSize: 12,
    lineHeight: 16,
    textAlign: "center"
  },
  tutorialBandText: {
    color: "rgba(232, 244, 255, 0.84)",
    fontFamily: theme.fonts.body,
    fontSize: 13,
    lineHeight: 19
  },
  tutorialBandTitle: {
    color: "#d7ecfb",
    fontFamily: theme.fonts.bodyBold,
    fontSize: 15
  },
  tutorialBoard: {
    aspectRatio: 1,
    backgroundColor: "rgba(2, 11, 19, 0.9)",
    borderColor: "rgba(126, 203, 255, 0.22)",
    borderRadius: 18,
    borderWidth: 1,
    flex: 1,
    gap: 5,
    padding: 8
  },
  tutorialBoardRow: {
    flexDirection: "row",
    gap: 7
  },
  tutorialClose: {
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.1)",
    borderColor: "rgba(255,255,255,0.22)",
    borderRadius: 999,
    borderWidth: 1,
    height: 42,
    justifyContent: "center",
    width: 42
  },
  tutorialClosePressed: {
    opacity: 0.78
  },
  tutorialDemo: {
    alignSelf: "center",
    gap: 6,
    maxWidth: 330,
    width: "100%"
  },
  tutorialDemoCaption: {
    color: "rgba(232, 244, 255, 0.76)",
    fontFamily: theme.fonts.bodyBold,
    fontSize: 12,
    lineHeight: 16,
    textAlign: "center"
  },
  tutorialHeader: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    flexDirection: "row",
    gap: 12,
    padding: 18
  },
  tutorialHeaderCopy: {
    flex: 1,
    gap: 5,
    minWidth: 0
  },
  tutorialInfoBand: {
    backgroundColor: "rgba(20, 34, 48, 0.78)",
    borderColor: "rgba(133, 169, 195, 0.36)",
    borderRadius: 16,
    borderWidth: 1,
    gap: 7,
    padding: 14
  },
  tutorialKicker: {
    color: "#d7ecfb",
    fontFamily: theme.fonts.label,
    fontSize: 11,
    letterSpacing: 1.2,
    textTransform: "uppercase"
  },
  tutorialLead: {
    color: "rgba(232, 244, 255, 0.86)",
    fontFamily: theme.fonts.body,
    fontSize: 13,
    lineHeight: 19
  },
  tutorialModal: {
    backgroundColor: "#061421",
    borderColor: "rgba(126, 203, 255, 0.34)",
    borderRadius: 24,
    borderWidth: 1.5,
    maxHeight: "92%",
    maxWidth: 520,
    overflow: "hidden",
    width: "94%"
  },
  tutorialOverlay: {
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.72)",
    flex: 1,
    justifyContent: "center",
    padding: 12
  },
  tutorialPayoutDifficulty: {
    color: "#f7fbff",
    flex: 1,
    fontFamily: theme.fonts.bodyBold,
    fontSize: 14
  },
  tutorialPayoutMeta: {
    color: "rgba(232, 244, 255, 0.66)",
    fontFamily: theme.fonts.label,
    fontSize: 10,
    letterSpacing: 0.8,
    textTransform: "uppercase"
  },
  tutorialPayoutRow: {
    alignItems: "center",
    backgroundColor: "rgba(7, 24, 40, 0.72)",
    borderColor: "rgba(84, 130, 171, 0.36)",
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    justifyContent: "space-between",
    paddingHorizontal: 12,
    paddingVertical: 10
  },
  tutorialPayoutRowActive: {
    backgroundColor: "rgba(111, 168, 216, 0.14)",
    borderColor: "rgba(215, 236, 251, 0.48)"
  },
  tutorialPayoutTable: {
    gap: 8
  },
  tutorialPayoutValue: {
    color: "#d7ecfb",
    fontFamily: theme.fonts.display,
    fontSize: 16,
    lineHeight: 18
  },
  tutorialScroll: {
    gap: 14,
    padding: 16,
    paddingBottom: 22
  },
  tutorialSideTotals: {
    gap: 5,
    justifyContent: "space-between",
    width: 34
  },
  tutorialStep: {
    backgroundColor: "rgba(7, 24, 40, 0.78)",
    borderColor: "rgba(84, 130, 171, 0.42)",
    borderRadius: 16,
    borderWidth: 1,
    flexBasis: "48%",
    flexGrow: 1,
    gap: 7,
    minWidth: 150,
    padding: 12
  },
  tutorialStepBody: {
    color: "rgba(232, 244, 255, 0.78)",
    fontFamily: theme.fonts.body,
    fontSize: 12,
    lineHeight: 17
  },
  tutorialStepGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10
  },
  tutorialStepIcon: {
    alignItems: "center",
    backgroundColor: "#6fa8d8",
    borderRadius: 999,
    height: 34,
    justifyContent: "center",
    width: 34
  },
  tutorialStepTitle: {
    color: "#f7fbff",
    fontFamily: theme.fonts.bodyBold,
    fontSize: 13,
    lineHeight: 17
  },
  tutorialTitle: {
    color: "#f7fbff",
    fontFamily: theme.fonts.display,
    fontSize: 34,
    lineHeight: 34
  },
  tutorialTopTotals: {
    flexDirection: "row",
    gap: 5,
    paddingLeft: 49,
    paddingRight: 8
  },
  profileAvatar: {
    alignItems: "center",
    borderColor: "#d7ecfb",
    borderRadius: 999,
    borderWidth: 2,
    height: 72,
    justifyContent: "center",
    width: 72
  },
  profileAvatarText: {
    color: "#ffffff",
    fontFamily: theme.fonts.display,
    fontSize: 38,
    lineHeight: 38
  },
  profilePreview: {
    alignItems: "center",
    backgroundColor: "rgba(7, 24, 40, 0.72)",
    borderColor: "rgba(84, 130, 171, 0.48)",
    borderRadius: 22,
    borderWidth: 1.5,
    flexDirection: "row",
    gap: 14,
    padding: 14
  },
  profilePreviewCopy: {
    flex: 1,
    gap: 4,
    minWidth: 0
  },
  profilePreviewMeta: {
    color: theme.colors.subtleText,
    fontFamily: theme.fonts.body,
    fontSize: 13
  },
  profilePreviewName: {
    color: theme.colors.text,
    fontFamily: theme.fonts.bodyBold,
    fontSize: 22
  },
  previewTotalPill: {
    alignItems: "center",
    backgroundColor: "rgba(2, 11, 19, 0.78)",
    borderColor: "rgba(84, 130, 171, 0.48)",
    borderRadius: 999,
    borderWidth: 1,
    flex: 1,
    justifyContent: "center",
    minHeight: 24,
    minWidth: 0
  },
  previewTotalPillComplete: {
    backgroundColor: "#22c55e",
    borderColor: "#86efac"
  },
  previewTotalText: {
    color: theme.colors.subtleText,
    fontFamily: theme.fonts.label,
    fontSize: 10,
    letterSpacing: 0
  },
  previewTotalTextComplete: {
    color: "#ffffff"
  },
  quakePreview: {
    gap: 10,
    width: "100%"
  },
  quakePreviewHud: {
    alignItems: "center",
    backgroundColor: "rgba(26, 40, 55, 0.96)",
    borderColor: "rgba(142, 179, 206, 0.62)",
    borderRadius: 16,
    borderWidth: 1.5,
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 12,
    paddingVertical: 8
  },
  quakePreviewHudLabel: {
    color: "#b6ccdc",
    fontFamily: theme.fonts.label,
    fontSize: 9,
    letterSpacing: 1.2,
    textTransform: "uppercase"
  },
  quakePreviewHudValue: {
    color: "#eaf6ff",
    fontFamily: theme.fonts.display,
    fontSize: 24,
    lineHeight: 24
  },
  quakePreviewSpawnBadge: {
    backgroundColor: "rgba(111, 168, 216, 0.16)",
    borderColor: "rgba(142, 179, 206, 0.42)",
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 5
  },
  quakePreviewSpawnText: {
    color: "#eaf6ff",
    fontFamily: theme.fonts.label,
    fontSize: 9,
    letterSpacing: 1,
    textTransform: "uppercase"
  },
  quakePreviewBoard: {
    backgroundColor: "rgba(16, 29, 43, 0.94)",
    borderColor: "rgba(133, 169, 195, 0.32)",
    shadowColor: "#6fa8d8",
    shadowOffset: { height: 0, width: 0 },
    shadowOpacity: 0.2,
    shadowRadius: 14
  },
  quakePreviewCell: {
    backgroundColor: "rgba(25, 42, 58, 0.86)",
    borderColor: "rgba(103, 137, 163, 0.54)",
    overflow: "visible"
  },
  quakePreviewCellWave: {
    borderColor: "rgba(111, 168, 216, 0.62)"
  },
  quakePreviewCellStack: {
    shadowColor: "#6fa8d8",
    shadowOffset: { height: 0, width: 0 },
    shadowOpacity: 0.22,
    shadowRadius: 8
  },
  quakePreviewTile: {
    alignItems: "center",
    borderColor: "rgba(233, 244, 255, 0.68)",
    borderRadius: 8,
    borderWidth: 1,
    height: "78%",
    justifyContent: "center",
    overflow: "hidden",
    position: "relative",
    width: "78%"
  },
  quakePreviewTileLayer: {
    borderColor: "rgba(151, 181, 204, 0.22)",
    borderRadius: 8,
    borderWidth: 1,
    bottom: 0,
    left: 0,
    opacity: 0.76,
    overflow: "hidden",
    position: "absolute",
    right: 0,
    top: 0
  },
  quakePreviewTileText: {
    color: "#ffffff",
    fontFamily: theme.fonts.display,
    fontSize: 13,
    lineHeight: 13,
    textShadowColor: "rgba(0, 0, 0, 0.8)",
    textShadowOffset: { height: 1, width: 0 },
    textShadowRadius: 2,
    zIndex: 2
  },
  quakePreviewTileGlow: {
    backgroundColor: "rgba(255, 255, 255, 0.18)",
    borderRadius: 999,
    bottom: "18%",
    left: "18%",
    position: "absolute",
    right: "18%",
    top: "28%"
  },
  quakePreviewTileImage: {
    height: "100%",
    opacity: 0.16,
    position: "absolute",
    width: "100%"
  },
  quakePreviewTileSheen: {
    backgroundColor: "rgba(255, 255, 255, 0.34)",
    borderRadius: 999,
    height: "34%",
    left: "10%",
    position: "absolute",
    top: "7%",
    transform: [{ rotate: "-12deg" }],
    width: "72%"
  },
  quakePreviewHolding: {
    backgroundColor: "rgba(16, 29, 43, 0.74)",
    borderColor: "rgba(133, 169, 195, 0.4)",
    borderRadius: 16,
    borderWidth: 1,
    gap: 7,
    padding: 10
  },
  quakePreviewHoldingTitle: {
    color: "#b6ccdc",
    fontFamily: theme.fonts.label,
    fontSize: 10,
    letterSpacing: 1.4,
    textAlign: "center",
    textTransform: "uppercase"
  },
  quakePreviewHoldingTotal: {
    color: "#eaf6ff",
    fontFamily: theme.fonts.display,
    fontSize: 18,
    lineHeight: 18,
    textAlign: "center"
  },
  quakePreviewHoldingSlots: {
    flexDirection: "row",
    gap: 6,
    justifyContent: "center"
  },
  quakePreviewHoldSlot: {
    alignItems: "center",
    aspectRatio: 1,
    backgroundColor: "rgba(13, 27, 42, 0.46)",
    borderColor: "rgba(133, 169, 195, 0.34)",
    borderRadius: 8,
    borderWidth: 1,
    flex: 1,
    justifyContent: "center",
    maxWidth: 44
  },
  quakePreviewHoldTile: {
    alignItems: "center",
    borderRadius: 8,
    height: "82%",
    justifyContent: "center",
    overflow: "hidden",
    width: "82%"
  },
  quakePreviewCaption: {
    color: "rgba(232, 244, 255, 0.72)",
    fontFamily: theme.fonts.body,
    fontSize: 11,
    lineHeight: 15,
    textAlign: "center"
  },
  quakeTutorialModal: {
    backgroundColor: "#172433",
    borderColor: "rgba(133, 169, 195, 0.5)"
  },
  sectionHeader: { gap: 2 },
  sectionMeta: {
    color: theme.colors.subtleText,
    fontFamily: theme.fonts.body,
    fontSize: 13
  },
  sectionTitle: {
    color: "#f7fbff",
    fontFamily: theme.fonts.display,
    fontSize: 38,
    lineHeight: 40
  },
  seedBadge: {
    alignItems: "center",
    backgroundColor: "rgba(8, 26, 43, 0.9)",
    borderColor: "rgba(84, 130, 171, 0.72)",
    borderRadius: 18,
    borderWidth: 2,
    minWidth: 62,
    paddingVertical: 8
  },
  seedBadgeSelected: { backgroundColor: "#6fa8d8", borderColor: "#d7ecfb" },
  seedText: {
    color: theme.colors.subtleText,
    fontFamily: theme.fonts.label,
    fontSize: 9,
    letterSpacing: 1
  },
  seedValue: {
    color: "#f7fbff",
    fontFamily: theme.fonts.display,
    fontSize: 22,
    lineHeight: 22
  },
  seedValueSelected: { color: "#ffffff" },
  setupPanel: {
    backgroundColor: "rgba(20, 34, 48, 0.86)",
    borderColor: "rgba(133, 169, 195, 0.42)",
    borderRadius: 34,
    borderWidth: 2,
    elevation: 7,
    gap: 18,
    paddingHorizontal: 18,
    paddingVertical: 20,
    shadowColor: "#6fa8d8",
    shadowOffset: { height: 12, width: 0 },
    shadowOpacity: 0.2,
    shadowRadius: 22
  },
  simpleMenuCopy: {
    flex: 1,
    gap: 6,
    minWidth: 0
  },
  simpleMenuHero: {
    alignItems: "center",
    backgroundColor: "rgba(7, 24, 40, 0.72)",
    borderColor: "rgba(84, 130, 171, 0.48)",
    borderRadius: 22,
    borderWidth: 1.5,
    flexDirection: "row",
    gap: 14,
    padding: 14
  },
  simpleMenuIcon: {
    alignItems: "center",
    backgroundColor: "rgba(95, 167, 231, 0.2)",
    borderColor: "rgba(158, 223, 255, 0.42)",
    borderRadius: 18,
    borderWidth: 1,
    height: 64,
    justifyContent: "center",
    width: 64
  },
  simpleMenuText: {
    color: theme.colors.subtleText,
    fontFamily: theme.fonts.body,
    fontSize: 13,
    lineHeight: 18
  },
  simpleMenuTitle: {
    color: theme.colors.text,
    fontFamily: theme.fonts.bodyBold,
    fontSize: 20
  },
  shell: { maxWidth: 430, width: "100%" },
  statusBadge: {
    backgroundColor: "rgba(2, 11, 19, 0.78)",
    borderColor: "rgba(84, 130, 171, 0.48)",
    borderRadius: 16,
    borderWidth: 1,
    flex: 1,
    gap: 3,
    minWidth: 120,
    paddingHorizontal: 10,
    paddingVertical: 8
  },
  statusLabel: {
    color: theme.colors.subtleText,
    fontFamily: theme.fonts.label,
    fontSize: 10,
    letterSpacing: 1,
    textTransform: "uppercase"
  },
  statusRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8
  },
  statusValue: {
    color: theme.colors.text,
    fontFamily: theme.fonts.bodyBold,
    fontSize: 13
  },
  topBar: {
    alignItems: "center",
    backgroundColor: "rgba(2, 11, 19, 0.96)",
    borderBottomColor: "rgba(79, 121, 158, 0.38)",
    borderBottomWidth: 1,
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    flexDirection: "row",
    gap: 8,
    justifyContent: "space-between",
    overflow: "hidden",
    paddingHorizontal: 8,
    paddingVertical: 6
  }
});
