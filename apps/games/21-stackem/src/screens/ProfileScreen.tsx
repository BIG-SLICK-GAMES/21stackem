import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Href, router, useLocalSearchParams } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { Image, Pressable, StyleSheet, Switch, Text, View } from "react-native";

import { ScreenContainer } from "../components/layout/ScreenContainer";
import { AppNav } from "../components/layout/AppNav";
import { HubAccessGate } from "../components/platform/HubAccessGate";
import { HubNotice } from "../components/platform/HubNotice";
import { HubPanel } from "../components/platform/HubPanel";
import { GameButton } from "../components/ui/GameButton";
import { useHubSession } from "../platform/auth/session";
import { formatChipCount, getErrorMessage } from "../platform/lib/format";
import {
  buildAvatarOptions,
  getAvatarImageSource
} from "../shared/constants/builtInAvatars";
import { theme } from "../theme";

function getAvatarLabel(profileName?: string) {
  const safeName = (profileName || "P").trim();
  return safeName.slice(0, 1).toUpperCase();
}

export function ProfileScreen() {
  const params = useLocalSearchParams<{ section?: string | string[] }>();
  const {
    logout,
    profile,
    refreshProfile,
    token,
    updatePlayerSettings,
    updateProfile
  } = useHubSession();
  const [avatar, setAvatar] = useState("");
  const [musicEnabled, setMusicEnabled] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [vibrationEnabled, setVibrationEnabled] = useState(true);
  const [avatarOptions, setAvatarOptions] = useState<
    Array<{
      id: string;
      label: string;
      sPath: unknown;
      sUri: string;
      selected: boolean;
    }>
  >([]);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isSavingSettings, setIsSavingSettings] = useState(false);
  const sectionParam = Array.isArray(params.section) ? params.section[0] : params.section;
  const settingsFirst = sectionParam === "settings";

  useEffect(() => {
    setAvatar(profile?.sAvatar ?? "");
    setMusicEnabled(profile?.bMusicEnabled ?? true);
    setSoundEnabled(profile?.bSoundEnabled ?? true);
    setVibrationEnabled(profile?.bVibrationEnabled ?? true);
    setAvatarOptions(
      buildAvatarOptions(profile?.aAvatar?.aAvatar ?? [], profile?.sAvatar ?? "")
    );
  }, [profile]);

  const profileStats = useMemo(
    () => [
      {
        label: "Chip Balance",
        value: formatChipCount(profile?.nChips)
      },
      {
        label: "Games Played",
        value: String(Number(profile?.nGamePlayed) || 0)
      },
      {
        label: "Games Won",
        value: String(Number(profile?.nGameWon) || 0)
      },
      {
        label: "Losses",
        value: String(Number(profile?.nGameLost) || 0)
      }
    ],
    [profile?.nChips, profile?.nGameLost, profile?.nGamePlayed, profile?.nGameWon]
  );

  if (!token) {
    return (
      <ScreenContainer contentContainerStyle={styles.centered}>
        <HubAccessGate message="Sign in before opening the shared profile screen." />
      </ScreenContainer>
    );
  }

  async function handleProfileSave() {
    setError(null);
    setSuccess(null);
    setIsSavingProfile(true);

    try {
      await updateProfile({
        sAvatar: avatar.trim() || undefined
      });
      setSuccess("Profile image updated.");
    } catch (nextError) {
      setError(getErrorMessage(nextError));
    } finally {
      setIsSavingProfile(false);
    }
  }

  async function handleSettingsSave() {
    setError(null);
    setSuccess(null);
    setIsSavingSettings(true);

    try {
      await updatePlayerSettings({
        bMusicEnabled: musicEnabled,
        bSoundEnabled: soundEnabled,
        bVibrationEnabled: vibrationEnabled
      });
      setSuccess("Player settings synced.");
    } catch (nextError) {
      setError(getErrorMessage(nextError));
    } finally {
      setIsSavingSettings(false);
    }
  }

  function handleAvatarSelect(nextAvatar: { sUri: string }) {
    setAvatar(nextAvatar.sUri);
    setAvatarOptions((current) =>
      current.map((avatarOption) => ({
        ...avatarOption,
        selected: avatarOption.sUri === nextAvatar.sUri
      }))
    );
  }

  const profilePanel = (
    <HubPanel
      subtitle="Shared profile data from the common user database."
      title="Player Profile"
    >
      <View style={styles.identityShell}>
        <View style={styles.avatarStage}>
          <View style={styles.avatarCircle}>
            {getAvatarImageSource(avatar || profile?.sAvatar, profile?.sUserName) ? (
              <Image
                source={getAvatarImageSource(avatar || profile?.sAvatar, profile?.sUserName)}
                style={styles.avatarImage}
              />
            ) : (
              <Text style={styles.avatarGlyph}>
                {getAvatarLabel(profile?.sUserName)}
              </Text>
            )}
          </View>
          <Text style={styles.playerName}>{profile?.sUserName ?? "Player"}</Text>
          <Text style={styles.playerMeta}>
            {profile?.sEmail || "No email"}
          </Text>
          <Text style={styles.playerMeta}>
            Registered account
          </Text>
        </View>

        <View style={styles.statsGrid}>
          {profileStats.map((item) => (
            <View key={item.label} style={styles.statCard}>
              <Text style={styles.statValue}>{item.value}</Text>
              <Text style={styles.statLabel}>{item.label}</Text>
            </View>
          ))}
        </View>
      </View>

      {error ? <HubNotice message={error} tone="error" /> : null}
      {success ? <HubNotice message={success} tone="success" /> : null}
    </HubPanel>
  );

  const identityPanel = (
    <HubPanel
        subtitle="Account identity is locked to the shared Big Slick login."
        title="Identity"
      >
        <ReadOnlyAccountRow
          label="Username"
          value={profile?.sUserName || "Player"}
        />
        <ReadOnlyAccountRow
          label="Email"
          value={profile?.sEmail || "No email"}
        />
        <View style={styles.avatarPickerCopy}>
          <Text style={styles.avatarPickerTitle}>Choose your profile image</Text>
          <Text style={styles.avatarPickerBody}>
            Username and email are managed by the shared login. Stack'em can only update the profile image.
          </Text>
        </View>
        <View style={styles.avatarGrid}>
          {avatarOptions.map((avatarOption) => (
            <Pressable
              key={avatarOption.id}
              onPress={() => {
                handleAvatarSelect(avatarOption);
              }}
              style={({ pressed }) => [
                styles.avatarOption,
                avatarOption.selected && styles.avatarOptionSelected,
                pressed && styles.avatarOptionPressed
              ]}
            >
              <Image
                source={avatarOption.sPath as never}
                style={styles.avatarOptionImage}
              />
            </Pressable>
          ))}
        </View>
        <GameButton
          disabled={isSavingProfile}
          label="Save Profile Image"
          onPress={() => {
            void handleProfileSave();
          }}
          subtitle="Name and email stay locked"
          tone="primary"
        />
      </HubPanel>
  );

  const settingsPanel = (
    <HubPanel
      subtitle="Shared account preferences saved in the common backend."
      title="Settings"
    >
      <ToggleRow
        label="Music"
        onValueChange={setMusicEnabled}
        value={musicEnabled}
      />
      <ToggleRow
        label="Sound"
        onValueChange={setSoundEnabled}
        value={soundEnabled}
      />
      <ToggleRow
        label="Vibration"
        onValueChange={setVibrationEnabled}
        value={vibrationEnabled}
      />
      <GameButton
        disabled={isSavingSettings}
        label="Save Settings"
        onPress={() => {
          void handleSettingsSave();
        }}
        subtitle="Sync audio and vibration flags to the backend"
        tone="primary"
      />
    </HubPanel>
  );

  return (
    <ScreenContainer scroll contentContainerStyle={styles.content}>
      <AppNav activeKey={settingsFirst ? "settings" : undefined} />
      {settingsFirst ? settingsPanel : profilePanel}
      {settingsFirst ? profilePanel : identityPanel}
      {settingsFirst ? identityPanel : settingsPanel}

      <HubPanel
        subtitle="Common account actions and game shortcuts."
        title="Shortcuts"
      >
        <View style={styles.shortcutsGrid}>
          <ShortcutCard
            description="Reload the latest profile data from the Stackem backend."
            label="Refresh Profile"
            onPress={() => {
              void refreshProfile();
            }}
          />
          <ShortcutCard
            description="Open the live rules page inside Stackem settings."
            label="Rules"
            onPress={() => {
              router.push("/settings" as Href);
            }}
          />
          <ShortcutCard
            description="Jump back to the leaderboard and shared run history."
            label="Leaderboard"
            onPress={() => {
              router.push("/leaderboard" as Href);
            }}
          />
          <ShortcutCard
            danger
            description="Clear the current shared account session from this device."
            label="Log Out"
            onPress={() => {
              void logout();
            }}
          />
        </View>
      </HubPanel>
    </ScreenContainer>
  );
}

function ToggleRow({
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

function ReadOnlyAccountRow({
  label,
  value
}: {
  label: string;
  value: string;
}) {
  return (
    <View style={styles.readOnlyRow}>
      <Text style={styles.readOnlyLabel}>{label}</Text>
      <Text numberOfLines={1} style={styles.readOnlyValue}>{value}</Text>
      <MaterialCommunityIcons color="rgba(232, 244, 255, 0.58)" name="lock" size={18} />
    </View>
  );
}

function ShortcutCard({
  danger = false,
  description,
  label,
  onPress
}: {
  danger?: boolean;
  description: string;
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.shortcutCard,
        danger && styles.shortcutCardDanger,
        pressed && styles.shortcutCardPressed
      ]}
    >
      <Text style={[styles.shortcutTitle, danger && styles.shortcutTitleDanger]}>
        {label}
      </Text>
      <Text style={styles.shortcutDescription}>{description}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  avatarCircle: {
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.08)",
    borderColor: "rgba(255, 255, 255, 0.14)",
    borderRadius: 999,
    borderWidth: 1,
    height: 104,
    justifyContent: "center",
    overflow: "hidden",
    width: 104
  },
  avatarGlyph: {
    color: theme.colors.text,
    fontFamily: theme.fonts.display,
    fontSize: 44,
    lineHeight: 44
  },
  avatarStage: {
    alignItems: "center",
    gap: theme.spacing.sm,
    paddingVertical: theme.spacing.sm
  },
  centered: {
    justifyContent: "center",
    paddingHorizontal: theme.spacing.lg
  },
  avatarGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: theme.spacing.sm
  },
  avatarImage: {
    height: "100%",
    width: "100%"
  },
  avatarOption: {
    borderColor: theme.colors.border,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    height: 72,
    overflow: "hidden",
    width: 72
  },
  avatarOptionImage: {
    height: "100%",
    width: "100%"
  },
  avatarOptionPressed: {
    opacity: 0.82
  },
  avatarOptionSelected: {
    borderColor: theme.colors.text,
    borderWidth: 2
  },
  avatarPickerBody: {
    color: theme.colors.subtleText,
    fontFamily: theme.fonts.body,
    fontSize: 13,
    lineHeight: 18
  },
  avatarPickerCopy: {
    gap: 4
  },
  avatarPickerTitle: {
    color: theme.colors.text,
    fontFamily: theme.fonts.bodyBold,
    fontSize: 15
  },
  content: {
    gap: theme.spacing.lg,
    marginHorizontal: "auto",
    maxWidth: 430,
    paddingBottom: theme.spacing.xxxl + 32,
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.xl
  },
  identityShell: {
    gap: theme.spacing.lg
  },
  playerMeta: {
    color: theme.colors.subtleText,
    fontFamily: theme.fonts.body,
    fontSize: 14,
    textAlign: "center"
  },
  playerName: {
    color: theme.colors.text,
    fontFamily: theme.fonts.bodyBold,
    fontSize: 24
  },
  readOnlyLabel: {
    color: theme.colors.subtleText,
    fontFamily: theme.fonts.label,
    fontSize: 11,
    letterSpacing: 1,
    textTransform: "uppercase"
  },
  readOnlyRow: {
    alignItems: "center",
    backgroundColor: "rgba(7, 24, 40, 0.88)",
    borderColor: "rgba(84, 130, 171, 0.5)",
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    flexDirection: "row",
    gap: theme.spacing.sm,
    minHeight: 52,
    paddingHorizontal: theme.spacing.md
  },
  readOnlyValue: {
    color: theme.colors.text,
    flex: 1,
    fontFamily: theme.fonts.bodyBold,
    fontSize: 15,
    minWidth: 0,
    textAlign: "right"
  },
  shortcutCard: {
    backgroundColor: "rgba(7, 24, 40, 0.88)",
    borderColor: "rgba(84, 130, 171, 0.5)",
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    gap: 6,
    minWidth: 150,
    padding: theme.spacing.md
  },
  shortcutCardDanger: {
    borderColor: "rgba(255, 111, 127, 0.5)"
  },
  shortcutCardPressed: {
    backgroundColor: "rgba(14, 38, 65, 0.92)"
  },
  shortcutDescription: {
    color: theme.colors.subtleText,
    fontFamily: theme.fonts.body,
    fontSize: 13,
    lineHeight: 18
  },
  shortcutTitle: {
    color: theme.colors.text,
    fontFamily: theme.fonts.bodyBold,
    fontSize: 16
  },
  shortcutTitleDanger: {
    color: theme.colors.warning
  },
  shortcutsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: theme.spacing.md
  },
  statCard: {
    backgroundColor: "rgba(7, 24, 40, 0.88)",
    borderColor: "rgba(84, 130, 171, 0.5)",
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    gap: 6,
    minWidth: 140,
    padding: theme.spacing.md
  },
  statLabel: {
    color: theme.colors.subtleText,
    fontFamily: theme.fonts.label,
    fontSize: 11,
    letterSpacing: 1,
    textTransform: "uppercase"
  },
  statValue: {
    color: theme.colors.text,
    fontFamily: theme.fonts.display,
    fontSize: 26,
    lineHeight: 26
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: theme.spacing.md
  },
  toggleLabel: {
    color: theme.colors.text,
    flex: 1,
    fontFamily: theme.fonts.body,
    fontSize: 15,
    marginRight: theme.spacing.md
  },
  toggleRow: {
    alignItems: "center",
    backgroundColor: "rgba(7, 24, 40, 0.88)",
    borderColor: "rgba(84, 130, 171, 0.5)",
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    flexDirection: "row",
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.md
  }
});
