import { Href, router } from "expo-router";
import { Pressable, StyleSheet, Switch, Text, View } from "react-native";

import { ScreenContainer } from "../components/layout/ScreenContainer";
import { AppNav } from "../components/layout/AppNav";
import { OptionGroup } from "../components/ui/OptionGroup";
import { getStackemAppearance } from "../game/appearance";
import { useDeviceProfile } from "../hooks/useDeviceProfile";
import { useGameSettings } from "../store/game-settings";
import {
  BoardPaletteKey,
  GameSettings,
  HapticsLevel,
  TilePaletteKey,
  VisualThemeKey
} from "../types/settings";
import { theme } from "../theme";

const themeOptions: { label: string; value: VisualThemeKey }[] = [
  { label: "Classic", value: "classic" },
  { label: "Ocean", value: "ocean" },
  { label: "Sunset", value: "sunset" }
];

const tileOptions: { label: string; value: TilePaletteKey }[] = [
  { label: "Ivory", value: "ivory" },
  { label: "Jade", value: "jade" },
  { label: "Rose", value: "rose" }
];

const boardOptions: { label: string; value: BoardPaletteKey }[] = [
  { label: "Felt", value: "felt" },
  { label: "Midnight", value: "midnight" },
  { label: "Ember", value: "ember" }
];

const hapticsOptions: { label: string; value: HapticsLevel }[] = [
  { label: "Off", value: "off" },
  { label: "Subtle", value: "subtle" },
  { label: "Full", value: "full" }
];

export function SettingsScreen() {
  const device = useDeviceProfile();
  const { settings, resetSettings, updateSetting } = useGameSettings();
  const isWide = device.isLandscape || device.width >= 860;
  const appearance = getStackemAppearance(settings);

  return (
    <ScreenContainer
      scroll
      contentContainerStyle={[styles.content, isWide && styles.contentWide]}
    >
      <AppNav />
      <View style={[styles.hero, { borderColor: appearance.boardBorder }]}>
        <Text style={[styles.heroKicker, { color: appearance.bannerAccent }]}>
          Table Styling
        </Text>
        <Text style={styles.heroTitle}>Visual Settings</Text>
        <Text style={styles.heroBody}>
          Change the table theme, tile finish, and board colour set. These updates
          apply directly to the live game screen.
        </Text>
        <View style={styles.previewRow}>
          <View
            style={[
              styles.previewBoard,
              {
                backgroundColor: appearance.boardBackground,
                borderColor: appearance.boardBorder
              }
            ]}
          >
            <View
              style={[
                styles.previewCell,
                {
                  backgroundColor: appearance.cellBackground,
                  borderColor: appearance.cellPlayableBorder
                }
              ]}
            />
            <View
              style={[
                styles.previewCell,
                {
                  backgroundColor: appearance.cellBackground,
                  borderColor: appearance.cellBorder
                }
              ]}
            />
            <View
              style={[
                styles.previewTile,
                { borderColor: appearance.boardBorder }
              ]}
            >
              <View
                style={[
                  styles.previewTileFace,
                  { backgroundColor: appearance.tileSurface[0] }
                ]}
              >
                <Text style={[styles.previewTileText, { color: appearance.tileRank }]}>
                  21
                </Text>
              </View>
            </View>
          </View>
        </View>
      </View>

      <View style={[styles.section, isWide && styles.sectionWide]}>
        <Text style={styles.sectionTitle}>Theme mood</Text>
        <Text style={styles.sectionText}>
          Controls the banner glow and overall table energy.
        </Text>
        <OptionGroup
          onChange={(value) =>
            updateSetting("visualTheme", value as GameSettings["visualTheme"])
          }
          options={themeOptions}
          selectedValue={settings.visualTheme}
        />
      </View>

      <View style={[styles.section, isWide && styles.sectionWide]}>
        <Text style={styles.sectionTitle}>Board colours</Text>
        <Text style={styles.sectionText}>
          Sets the board shell, cell borders, and line capsules.
        </Text>
        <OptionGroup
          onChange={(value) =>
            updateSetting("boardPalette", value as GameSettings["boardPalette"])
          }
          options={boardOptions}
          selectedValue={settings.boardPalette}
        />
      </View>

      <View style={[styles.section, isWide && styles.sectionWide]}>
        <Text style={styles.sectionTitle}>Tile finish</Text>
        <Text style={styles.sectionText}>
          Changes the tile surface and number colour.
        </Text>
        <OptionGroup
          onChange={(value) =>
            updateSetting("tilePalette", value as GameSettings["tilePalette"])
          }
          options={tileOptions}
          selectedValue={settings.tilePalette}
        />
      </View>

      <View style={[styles.section, isWide && styles.sectionWide]}>
        <Text style={styles.sectionTitle}>Feedback</Text>
        <Text style={styles.sectionText}>
          Control haptics and lightweight runtime behavior.
        </Text>
        <OptionGroup
          onChange={(value) =>
            updateSetting("haptics", value as GameSettings["haptics"])
          }
          options={hapticsOptions}
          selectedValue={settings.haptics}
        />
        <SettingToggle
          label="Keep screen awake during runs"
          onValueChange={(value) => updateSetting("keepAwake", value)}
          value={settings.keepAwake}
        />
        <SettingToggle
          label="Reduce motion"
          onValueChange={(value) => updateSetting("reducedMotion", value)}
          value={settings.reducedMotion}
        />
      </View>

      <View style={[styles.section, isWide && styles.sectionWide]}>
        <Text style={styles.sectionTitle}>Rules</Text>
        <Text style={styles.sectionText}>
          Open the current game rules, scoring, difficulty values, and power-up guide.
        </Text>
        <Pressable
          onPress={() => router.push("/how-to-play" as Href)}
          style={({ pressed }) => [styles.rulesButton, pressed && styles.rulesButtonPressed]}
        >
          <Text style={styles.rulesButtonLabel}>Open Rules</Text>
        </Pressable>
      </View>

      <View style={[styles.section, isWide && styles.sectionWide]}>
        <Text style={styles.sectionTitle}>Reset</Text>
        <Text style={styles.sectionText}>
          Restore the default table look and runtime options.
        </Text>
        <Text onPress={resetSettings} style={styles.resetButton}>
          Reset settings
        </Text>
      </View>
    </ScreenContainer>
  );
}

function SettingToggle({
  label,
  onValueChange,
  value
}: {
  label: string;
  onValueChange: (value: boolean) => void;
  value: boolean;
}) {
  return (
    <View style={styles.toggleRow}>
      <Text style={styles.toggleLabel}>{label}</Text>
      <Switch
        onValueChange={onValueChange}
        thumbColor={value ? theme.colors.surface : "#9CA3AF"}
        trackColor={{
          false: "#38465b",
          true: theme.colors.accent
        }}
        value={value}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: theme.spacing.lg,
    marginHorizontal: "auto",
    maxWidth: 430,
    paddingBottom: theme.spacing.xxxl + 96,
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.xl,
    width: "100%"
  },
  contentWide: {
    alignItems: "stretch"
  },
  hero: {
    backgroundColor: "rgba(5, 18, 30, 0.92)",
    borderColor: "rgba(105, 150, 190, 0.56)",
    borderRadius: 30,
    borderWidth: 2,
    elevation: 7,
    gap: theme.spacing.md,
    padding: theme.spacing.lg,
    width: "100%"
  },
  heroBody: {
    color: theme.colors.subtleText,
    fontFamily: theme.fonts.body,
    fontSize: 15,
    lineHeight: 22,
    maxWidth: 1000
  },
  heroKicker: {
    fontFamily: theme.fonts.label,
    fontSize: 11,
    letterSpacing: 1.8,
    textTransform: "uppercase"
  },
  heroTitle: {
    color: theme.colors.text,
    fontFamily: theme.fonts.display,
    fontSize: 34,
    lineHeight: 34
  },
  previewBoard: {
    borderRadius: 24,
    borderWidth: 1,
    flexDirection: "row",
    gap: theme.spacing.sm,
    padding: theme.spacing.md
  },
  previewCell: {
    borderRadius: 16,
    borderWidth: 1,
    height: 58,
    width: 58
  },
  previewRow: {
    flexDirection: "row"
  },
  previewTile: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 4
  },
  previewTileFace: {
    alignItems: "center",
    borderRadius: 14,
    height: 58,
    justifyContent: "center",
    width: 58
  },
  previewTileText: {
    fontFamily: theme.fonts.display,
    fontSize: 24,
    lineHeight: 24
  },
  resetButton: {
    color: theme.colors.warning,
    fontFamily: theme.fonts.bodyBold,
    fontSize: 15
  },
  rulesButton: {
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
  rulesButtonLabel: {
    color: theme.colors.text,
    fontFamily: theme.fonts.label,
    fontSize: 12,
    letterSpacing: 1.2,
    textTransform: "uppercase"
  },
  rulesButtonPressed: {
    opacity: 0.86
  },
  section: {
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
    shadowRadius: 22,
    width: "100%"
  },
  sectionText: {
    color: theme.colors.subtleText,
    fontFamily: theme.fonts.body,
    fontSize: 15,
    lineHeight: 22
  },
  sectionTitle: {
    color: theme.colors.text,
    fontFamily: theme.fonts.bodyBold,
    fontSize: 20
  },
  sectionWide: {
    minWidth: "100%",
    width: "100%"
  },
  toggleLabel: {
    color: theme.colors.text,
    flex: 1,
    fontFamily: theme.fonts.body,
    fontSize: 15,
    lineHeight: 21,
    marginRight: theme.spacing.md
  },
  toggleRow: {
    alignItems: "flex-start",
    backgroundColor: "rgba(7, 24, 40, 0.88)",
    borderColor: "rgba(84, 130, 171, 0.62)",
    borderRadius: theme.radius.lg,
    borderWidth: 2,
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.md
  }
});
