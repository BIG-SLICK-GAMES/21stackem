import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Href, router } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View
} from "react-native";

import { ScreenContainer } from "../components/layout/ScreenContainer";
import { HubNotice } from "../components/platform/HubNotice";
import { HubTextField } from "../components/platform/HubTextField";
import { GameButton } from "../components/ui/GameButton";
import { stackemRoutes } from "../navigation/routes";
import { useHubSession } from "../platform/auth/session";
import { formatChipCount, getErrorMessage } from "../platform/lib/format";
import { runtimeConfig } from "../config/runtime";
import { theme } from "../theme";

function isValidEmailOrUsername(value: string) {
  return (
    /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(value) ||
    /^[a-zA-Z0-9_]+$/.test(value)
  );
}

export function PortalScreen() {
  const { isReady, login, logout, profile, status } = useHubSession();
  const [identity, setIdentity] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isAuthenticated = status === "authenticated";

  async function handleLogin() {
    const nextIdentity = identity.trim();
    setError(null);

    if (!nextIdentity || !isValidEmailOrUsername(nextIdentity)) {
      setError("Enter your BSG email or username.");
      return;
    }

    if (!password) {
      setError("Password is required.");
      return;
    }

    setIsSubmitting(true);

    try {
      await login({
        sEmail: nextIdentity,
        sPassword: password
      });
      setPassword("");
    } catch (nextError) {
      setError(getErrorMessage(nextError));
    } finally {
      setIsSubmitting(false);
    }
  }

  if (!isReady) {
    return (
      <ScreenContainer contentContainerStyle={styles.loadingScreen}>
        <ActivityIndicator color={theme.colors.accent} />
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer scroll contentContainerStyle={styles.content}>
      <View style={styles.topBar}>
        <View>
          <Text style={styles.brand}>Big Slick Games</Text>
          <Text style={styles.domain}>bigslickgames.com</Text>
        </View>
        <View style={styles.backendPill}>
          <MaterialCommunityIcons
            color="#d7ecfb"
            name="server-network"
            size={15}
          />
          <Text numberOfLines={1} style={styles.backendText}>
            {runtimeConfig.apiHostLabel}
          </Text>
        </View>
      </View>

      <View style={styles.portalShell}>
        <View style={styles.loginPanel}>
          <View style={styles.panelHeader}>
            <Text style={styles.kicker}>Casino Portal</Text>
            <Text style={styles.title}>
              {isAuthenticated ? "Player Lobby" : "Player Login"}
            </Text>
          </View>

          {isAuthenticated ? (
            <View style={styles.profileBlock}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>
                  {(profile?.sUserName || "P").trim().slice(0, 1).toUpperCase()}
                </Text>
              </View>
              <View style={styles.profileCopy}>
                <Text numberOfLines={1} style={styles.profileName}>
                  {profile?.sUserName ?? "Player"}
                </Text>
                <Text numberOfLines={1} style={styles.profileEmail}>
                  {profile?.sEmail ?? "BSG account loaded"}
                </Text>
              </View>
            </View>
          ) : (
            <View style={styles.form}>
              <HubTextField
                autoCapitalize="none"
                keyboardType="email-address"
                label="Email or username"
                onChangeText={setIdentity}
                placeholder="BSG login"
                value={identity}
              />
              <HubTextField
                autoCapitalize="none"
                label="Password"
                onChangeText={setPassword}
                placeholder="Password"
                secureTextEntry
                value={password}
              />
            </View>
          )}

          {error ? <HubNotice message={error} tone="error" /> : null}

          {isAuthenticated ? (
            <View style={styles.sessionStats}>
              <PortalStat
                icon="poker-chip"
                label="Chips"
                value={formatChipCount(profile?.nChips)}
              />
              <PortalStat
                icon="cards-playing"
                label="Games"
                value={String(Number(profile?.nGamePlayed) || 0)}
              />
              <PortalStat
                icon="trophy"
                label="Wins"
                value={String(Number(profile?.nGameWon) || 0)}
              />
            </View>
          ) : null}

          <View style={styles.actions}>
            {isAuthenticated ? (
              <>
                <GameButton
                  compact
                  label="21 Stack'em"
                  onPress={() => {
                    router.push(stackemRoutes.lobby);
                  }}
                  subtitle="Open the Stack'em lobby"
                  tone="primary"
                />
                <View style={styles.secondaryActions}>
                  <SmallAction
                    icon="account-circle"
                    label="Profile"
                    onPress={() => {
                      router.push(stackemRoutes.profile);
                    }}
                  />
                  <SmallAction
                    icon="logout"
                    label="Logout"
                    onPress={() => {
                      void logout();
                    }}
                  />
                </View>
              </>
            ) : (
              <>
                <GameButton
                  compact
                  disabled={isSubmitting}
                  label={isSubmitting ? "Signing In..." : "Sign In"}
                  onPress={() => {
                    void handleLogin();
                  }}
                  subtitle="Use your BSG account"
                  tone="primary"
                />
                <View style={styles.secondaryActions}>
                  <SmallAction
                    icon="account-plus"
                    label="Register"
                    onPress={() => {
                      router.push({ pathname: stackemRoutes.auth, params: { mode: "register" } } as Href);
                    }}
                  />
                  <SmallAction
                    icon="lock-reset"
                    label="Reset"
                    onPress={() => {
                      router.push(stackemRoutes.auth);
                    }}
                  />
                </View>
              </>
            )}
          </View>
        </View>
      </View>
    </ScreenContainer>
  );
}

function PortalStat({
  icon,
  label,
  value
}: {
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  label: string;
  value: string;
}) {
  return (
    <View style={styles.stat}>
      <MaterialCommunityIcons color="#d7ecfb" name={icon} size={18} />
      <View>
        <Text style={styles.statLabel}>{label}</Text>
        <Text style={styles.statValue}>{value}</Text>
      </View>
    </View>
  );
}

function SmallAction({
  icon,
  label,
  onPress
}: {
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.smallAction, pressed && styles.pressed]}
    >
      <MaterialCommunityIcons color="#f5f8ff" name={icon} size={18} />
      <Text style={styles.smallActionText}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  actions: {
    gap: theme.spacing.md
  },
  avatar: {
    alignItems: "center",
    backgroundColor: "#6fa8d8",
    borderRadius: 28,
    height: 56,
    justifyContent: "center",
    width: 56
  },
  avatarText: {
    color: "#081018",
    fontFamily: theme.fonts.display,
    fontSize: 28,
    lineHeight: 32
  },
  backendPill: {
    alignItems: "center",
    backgroundColor: "rgba(3, 12, 20, 0.72)",
    borderColor: "rgba(158, 223, 255, 0.24)",
    borderRadius: 999,
    borderWidth: 1,
    flexDirection: "row",
    gap: 6,
    maxWidth: 180,
    paddingHorizontal: 12,
    paddingVertical: 8
  },
  backendText: {
    color: theme.colors.subtleText,
    fontFamily: theme.fonts.bodyBold,
    fontSize: 12
  },
  brand: {
    color: theme.colors.text,
    fontFamily: theme.fonts.display,
    fontSize: 30,
    lineHeight: 32
  },
  content: {
    gap: theme.spacing.xl,
    marginHorizontal: "auto",
    maxWidth: 1100,
    paddingBottom: theme.spacing.xxxl,
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.lg,
    width: "100%"
  },
  domain: {
    color: "#d7ecfb",
    fontFamily: theme.fonts.label,
    fontSize: 12,
    letterSpacing: 1,
    marginTop: 4,
    textTransform: "uppercase"
  },
  form: {
    gap: theme.spacing.md
  },
  kicker: {
    color: "#e35a68",
    fontFamily: theme.fonts.label,
    fontSize: 12,
    letterSpacing: 1,
    textTransform: "uppercase"
  },
  loadingScreen: {
    alignItems: "center",
    justifyContent: "center"
  },
  loginPanel: {
    backgroundColor: "rgba(4, 12, 18, 0.9)",
    borderColor: "rgba(158, 223, 255, 0.22)",
    borderRadius: 8,
    borderWidth: 1,
    gap: theme.spacing.lg,
    minWidth: 300,
    padding: theme.spacing.lg
  },
  panelHeader: {
    gap: 4
  },
  portalShell: {
    marginHorizontal: "auto",
    maxWidth: 460,
    width: "100%"
  },
  pressed: {
    opacity: 0.78
  },
  profileBlock: {
    alignItems: "center",
    flexDirection: "row",
    gap: theme.spacing.md
  },
  profileCopy: {
    flex: 1,
    minWidth: 0
  },
  profileEmail: {
    color: theme.colors.subtleText,
    fontFamily: theme.fonts.body,
    fontSize: 14
  },
  profileName: {
    color: theme.colors.text,
    fontFamily: theme.fonts.bodyBold,
    fontSize: 20
  },
  secondaryActions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: theme.spacing.sm
  },
  sessionStats: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: theme.spacing.sm
  },
  smallAction: {
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.08)",
    borderColor: "rgba(255, 255, 255, 0.12)",
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: "row",
    gap: 8,
    minHeight: 44,
    paddingHorizontal: 14
  },
  smallActionText: {
    color: theme.colors.text,
    fontFamily: theme.fonts.bodyBold,
    fontSize: 14
  },
  stat: {
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.08)",
    borderRadius: 8,
    flexDirection: "row",
    gap: 8,
    minWidth: 120,
    paddingHorizontal: 12,
    paddingVertical: 10
  },
  statLabel: {
    color: theme.colors.subtleText,
    fontFamily: theme.fonts.label,
    fontSize: 10,
    letterSpacing: 1,
    textTransform: "uppercase"
  },
  statValue: {
    color: theme.colors.text,
    fontFamily: theme.fonts.bodyBold,
    fontSize: 15
  },
  title: {
    color: theme.colors.text,
    fontFamily: theme.fonts.display,
    fontSize: 44,
    lineHeight: 46
  },
  topBar: {
    alignItems: "center",
    flexDirection: "row",
    gap: theme.spacing.md,
    justifyContent: "space-between"
  }
});

